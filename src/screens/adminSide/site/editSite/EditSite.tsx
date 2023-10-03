import React, { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, AppState, Text } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { ConstructionOverview } from '../../../../components/organisms/construction/ConstructionOverview'
import { getUuidv4, SwitchEditOrCreateProps } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { InputTextBox } from '../../../../components/organisms/inputBox/InputTextBox'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import {
    combineTimeAndDay,
    CustomDate,
    dayBaseText,
    dayBaseTextWithoutDate,
    getDailyStartTime,
    getMonthlyFirstDay,
    getYYYYMMDDTotalSeconds,
    monthBaseText,
    nextDay,
    toCustomDateFromTotalSeconds,
} from '../../../../models/_others/CustomDate'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { AppButton } from '../../../../components/atoms/AppButton'
import { DEFAULT_SITE_END_TIME, DEFAULT_SITE_MEETING_TIME, DEFAULT_SITE_START_TIME, LOCK_INTERVAL_TIME, PLACEHOLDER, THEME_COLORS, dMarginTop } from '../../../../utils/Constants'
import { InputDateTimeBox } from '../../../../components/organisms/inputBox/InputDateTimeBox'
import { InputNumberBox } from '../../../../components/organisms/inputBox/InputNumberBox'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { getConstructionSiteForEdit, writeConstructionSite } from '../../../../usecases/site/MySiteCase'
import { getTargetConstruction } from '../../../../usecases/construction/CommonConstructionCase'
import { InputConstructionBox } from '../../../../components/organisms/inputBox/InputConstructionBox'
import { ConstructionCLType, ConstructionType, toConstructionCLType } from '../../../../models/construction/Construction'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { useIsFocused } from '@react-navigation/native'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { BaseModal } from '../../../../components/organisms/BaseModal'
import { BlueColor, FontStyle } from '../../../../utils/Styles'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { toIdAndMonthFromStrings, UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'
import { InstructionCLType } from '../../../../models/instruction/Instruction'
import { writeConstructionSiteInstruction } from '../../../../usecases/site/MySiteInstructionCase'
import { checkMyDepartment } from '../../../../usecases/department/DepartmentCase'
import { departmentsToText } from '../../../../usecases/worker/CommonWorkerCase'
import { Checkbox } from '../../../../components/atoms/Checkbox'
import { SiteCLType, SiteType, toSiteCLType } from '../../../../models/site/Site'
import { RequestCLType } from '../../../../models/request/Request'
import { ContractCLType } from '../../../../models/contract/Contract'
import { CompanyCLType } from '../../../../models/company/Company'
import { genKeyName, getCachedData, updateCachedData } from '../../../../usecases/CachedDataCase'
import { DateDataType } from '../../../../models/date/DateDataType'
import { add, cloneDeep, findIndex } from 'lodash'
import { MonthlySiteType } from '../../../../models/site/MonthlySiteType'

type NavProps = StackNavigationProp<RootStackParamList, 'EditSite'>
type RouteProps = RouteProp<RootStackParamList, 'EditSite'>

type InitialStateType = {
    siteId?: string
    constructionId?: string
    contractId?: string
    construction?: ConstructionCLType
    selectableConstructions?: ConstructionCLType[]
    disable: boolean
    siteEndTimeIsNextDay?: boolean
    siteStartTimeIsNextDay?: boolean
    isVisibleModal?: boolean
    update: number
    isInstruction?: boolean
    fakeCompanyInvRequestId?: string
    keepDate?: CustomDate //変更前の日付
} & SiteEditUIType

//TODO:CLに置き換えられるはず、いずれCLも削除する
export type SiteEditUIType = {
    date?: CustomDate
    startTime?: CustomDate
    endTime?: CustomDate
    meetingTime?: CustomDate
    requiredNum?: number
    address?: string
    belongings?: string
    remarks?: string
    updatedAt?: number
}

const initialState: InitialStateType = {
    disable: true,
    isVisibleModal: false,
    update: 0,
    isInstruction: false,
}
type CachedSiteDetailType = {
    site?: SiteCLType
    request?: RequestCLType
    contractor?: CompanyCLType
    contract?: ContractCLType
    updatedAt?: number
}
type CachedMonthlySiteType = {
    monthlySite: MonthlySiteType
    construction: ConstructionType
}
const EditSite = (props: Partial<SwitchEditOrCreateProps>) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const mode = props.mode ?? 'edit'
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const targetDate = route?.params?.targetDate
    const targetMonth = route?.params?.targetMonth
    const projectId = route?.params?.projectId
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])
    const signInUser = useSelector((state: StoreType) => state?.account.signInUser)

    //mode == 'new' の時、targetDate != undefined なら、日付を固定。 targetDate == undefined なら、工事を固定
    // isFromAdminHomeScreen === tureの時、targetDate === undefined なら、工事のみ固定　targetDate !== undefined なら、工事と日付固定

    const [
        {
            siteId,
            constructionId,
            contractId,
            siteEndTimeIsNextDay,
            siteStartTimeIsNextDay,
            selectableConstructions,
            construction,
            date,
            keepDate,
            disable,
            startTime,
            endTime,
            meetingTime,
            requiredNum,
            address,
            belongings,
            remarks,
            isVisibleModal,
            update,
            fakeCompanyInvRequestId,
        },
        setState,
    ] = useState(initialState)
    const dispatch = useDispatch()

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        ;(async () => {
            try {
                if (constructionId == undefined || myCompanyId == undefined) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const constructionResult = await getTargetConstruction({
                    constructionId,
                    myCompanyId,
                })

                if (constructionResult.error) {
                    throw {
                        error: constructionResult.error,
                    }
                }
                const cachedSiteDetailKey = genKeyName({
                    screenName: 'SiteDetail',
                    accountId: accountId ?? '',
                    siteId: siteId ?? '',
                    companyId: myCompanyId ?? '',
                    workerId: myWorkerId ?? '',
                    requestId: '',
                })
                const siteDetailCacheData = await getCachedData<CachedSiteDetailType>(cachedSiteDetailKey)
                setState((prev) => ({
                    ...prev,
                    construction: constructionResult.success ? constructionResult.success : siteDetailCacheData.success?.site?.construction,
                    contractId: constructionResult.success?.contractId,
                }))
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                if (isFocused) {
                    dispatch(setLoading(false))
                    dispatch(setIsNavUpdating(false))
                }
            }
        })()
    }, [constructionId, update])

    useEffect(() => {
        ;(async () => {
            try {
                if (mode == 'new') {
                    return
                }
                if (siteId == undefined) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const result = await getConstructionSiteForEdit({
                    siteId,
                    myCompanyId,
                })

                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                const cachedSiteDetailKey = genKeyName({
                    screenName: 'SiteDetail',
                    accountId: accountId ?? '',
                    siteId: siteId ?? '',
                    companyId: myCompanyId ?? '',
                    workerId: myWorkerId ?? '',
                    requestId: '',
                })
                const siteDetailCacheData = await getCachedData<CachedSiteDetailType>(cachedSiteDetailKey)

                if (siteDetailCacheData.success) {
                    setState((prev) => ({
                        ...prev,
                        ...siteDetailCacheData.success,
                        construction: siteDetailCacheData.success?.site?.construction,
                        siteEndTimeIsNextDay:
                            siteDetailCacheData.success?.site?.meetingDate &&
                            siteDetailCacheData.success?.site?.endDate &&
                            dayBaseText(siteDetailCacheData.success?.site?.meetingDate) != dayBaseText(siteDetailCacheData.success?.site?.endDate),
                        siteStartTimeIsNextDay:
                            siteDetailCacheData.success?.site?.meetingDate &&
                            siteDetailCacheData.success?.site?.startDate &&
                            dayBaseText(siteDetailCacheData.success?.site?.meetingDate) != dayBaseText(siteDetailCacheData.success?.site?.startDate),
                    }))
                    if (siteDetailCacheData.success.site?.updatedAt && result.success?.updatedAt && siteDetailCacheData.success.site?.updatedAt.totalSeconds > result.success.updatedAt) {
                        // キャッシュよりDBが古い場合、更新しない
                        return
                    }
                }
                setState((prev) => ({
                    ...prev,
                    ...result.success,
                    construction: toSiteCLType(result.success).construction ? toSiteCLType(result.success).construction : siteDetailCacheData.success?.site?.construction,
                    siteEndTimeIsNextDay: result.success?.meetingTime && result.success?.endTime && dayBaseText(result.success?.meetingTime) != dayBaseText(result.success?.endTime),
                    siteStartTimeIsNextDay: result.success?.meetingTime && result.success?.startTime && dayBaseText(result.success?.meetingTime) != dayBaseText(result.success?.startTime),
                }))
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                if (isFocused) {
                    dispatch(setLoading(false))
                }
            }
        })()
    }, [siteId])

    useEffect(() => {
        if (route.params?.isInstruction) {
            navigation.setOptions({
                title: t('admin:RequestEditingTheSite'),
            })
        } else {
            navigation.setOptions({
                title: mode == 'new' ? t('common:CreateASite') : t('common:EditTheSite'),
            })
        }
    }, [navigation])

    useEffect(() => {
        if (mode === 'edit') {
            setState((prev) => ({ ...prev, siteId: route.params?.siteId, constructionId: route?.params?.constructionId }))
        } else {
            setState((prev) => ({ ...prev, siteId: getUuidv4(), construction: route?.params?.construction, constructionId: route?.params?.constructionId, date: targetDate }))
        }
        return () => {
            setState({ ...initialState })
        }
    }, [])

    useEffect(() => {
        if (date == undefined || startTime == undefined || endTime == undefined || constructionId == undefined) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [date, startTime, endTime, requiredNum])

    useEffect(() => {
        if (siteId && myWorkerId && appState == 'active' && isFocused) {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: myWorkerId ?? 'no-id',
                        targetId: siteId ?? 'no-id',
                        modelType: 'site',
                    })
                    if (lockResult.error) {
                        throw {
                            error: lockResult.error,
                        }
                    }
                } catch (error) {
                    const _error = error as CustomResponse
                    dispatch(
                        setToastMessage({
                            text: getErrorToastMessage(_error),
                            type: 'error',
                        } as ToastMessage),
                    )
                }
            })()
            const keepLock = setInterval(
                (function _update() {
                    updateLockOfTarget({
                        myWorkerId: myWorkerId ?? 'no-id',
                        targetId: siteId ?? 'no-id',
                        modelType: 'site',
                    })
                    return _update
                })(),
                LOCK_INTERVAL_TIME,
            )
            return () => {
                clearInterval(keepLock)
                updateLockOfTarget({
                    myWorkerId: myWorkerId ?? 'no-id',
                    targetId: siteId ?? 'no-id',
                    modelType: 'site',
                    unlock: true,
                })
            }
        }
    }, [siteId, myWorkerId, appState, isFocused])

    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    useEffect(() => {
        if (mode === 'new' && constructionId) {
            setState((prev) => ({
                ...prev,
                meetingTime: construction?.siteMeetingTime,
                startTime: construction?.siteStartTime ?? DEFAULT_SITE_START_TIME,
                endTime: construction?.siteEndTime ?? DEFAULT_SITE_END_TIME,
                requiredNum: construction?.siteRequiredNum,
                remarks: construction?.siteRemarks,
                address: construction?.siteAddress,
                belongings: construction?.siteBelongings,
                siteStartTimeIsNextDay: construction?.siteStartTimeIsNextDay,
                siteEndTimeIsNextDay: construction?.siteEndTimeIsNextDay,
            }))
        }
    }, [constructionId, construction])

    const _updateConstructionSiteListCache = async (site: SiteType) => {
        if (site.siteDate == undefined) return
        let month = getMonthlyFirstDay(toCustomDateFromTotalSeconds(site.siteDate))
        const cachedKey = genKeyName({
            screenName: 'ConstructionSiteList',
            accountId: accountId,
            companyId: myCompanyId as string,
            constructionId: constructionId as string,
            month: month ? monthBaseText(month).replace(/\//g, '-') : '',
        })
        const constructionSiteListCacheData = await getCachedData<CachedMonthlySiteType>(cachedKey)
        if (constructionSiteListCacheData.success && constructionSiteListCacheData.success.monthlySite?.sites?.items) {
            const newSites = constructionSiteListCacheData.success.monthlySite.sites?.items?.map((item) => {
                if (item.siteId == site.siteId) {
                    return site
                } else {
                    return item
                }
            })
            constructionSiteListCacheData.success.monthlySite.sites.items = newSites
        } else {
            if (constructionSiteListCacheData.success) {
                constructionSiteListCacheData.success = {
                    ...constructionSiteListCacheData.success,
                    monthlySite: {
                        sites: {
                            items: [site],
                        },
                    },
                }
            }
        }
        await updateCachedData({
            key: cachedKey,
            value: {
                monthlySite: constructionSiteListCacheData.success?.monthlySite,
                construction: constructionSiteListCacheData.success?.construction,
            },
        })
    }

    const _writeSite = async (siteId?: string) => {
        try {
            if (construction?.contract?.status == 'created') {
                throw {
                    error: t('admin:ContractHasNotBeenApproved'),
                    errorCode: 'WRITE_SITE_ERROR',
                }
            }
            if (
                construction?.contract?.receiveCompanyId == myCompanyId &&
                !checkMyDepartment({
                    targetDepartmentIds: construction?.contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                        '\n' +
                        t('common:Department') +
                        ': ' +
                        departmentsToText(construction?.contract?.receiveDepartments?.items),
                    errorCode: 'WRITE_SITE_ERROR',
                }
            }
            if (siteId == undefined || constructionId == undefined || construction?.constructionRelation == undefined) {
                throw {
                    error: t('common:NotEnoughInformation'),
                }
            }
            if (construction?.contract?.orderCompanyId == myCompanyId && !checkMyDepartment({ targetDepartmentIds: construction?.contract?.orderDepartmentIds, activeDepartmentIds })) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') + '\n' + t('common:Department') + ': ' + departmentsToText(construction?.contract?.orderDepartments?.items),
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: siteId ?? 'no-id',
                modelType: 'site',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }

            if (route.params?.isInstruction) {
                const result = await writeConstructionSiteInstruction({
                    siteId,
                    myCompanyId,
                    constructionId,
                    date: date,
                    startTime,
                    endTime,
                    meetingTime,
                    requiredNum,
                    address,
                    siteEndTimeIsNextDay,
                    siteStartTimeIsNextDay,
                    belongings,
                    remarks,
                    constructionRelation: construction.constructionRelation,
                    contractId: contractId,
                    projectId: projectId ?? construction?.projectId,
                })
                if (isFocused) dispatch(setLoading(false))
                if (result.error) {
                    if (result.errorCode == 'OUT_OF_RANGE') {
                        setState((prev) => ({ ...prev, isVisibleModal: true }))
                    } else if (result.error == 'siteAlreadyExistsOnTheDay') {
                        dispatch(
                            setToastMessage({
                                text: t('admin:SiteAlreadyExistsOnTheDay'),
                                type: 'error',
                            } as ToastMessage),
                        )
                    } else {
                        throw {
                            error: result.error,
                            errorCode: result.errorCode,
                        }
                    }
                } else {
                    const newLocalUpdateScreens: UpdateScreenType[] = [
                        {
                            screenName: 'SiteDetail',
                            ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'SiteDetail').map((screen) => screen.ids)), siteId]?.filter(
                                (data) => data != undefined,
                            ) as string[],
                        },
                    ]
                    dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
                    dispatch(
                        setToastMessage({
                            text: result.success == 'create' ? t('admin:NewSiteInstructionCreated') : t('admin:SiteInstructionUpdated'),
                            type: 'success',
                        } as ToastMessage),
                    )
                    if (route.params?.isFromAdminHomeScreen) {
                        navigation.pop(2)
                    } else {
                        navigation.goBack()
                    }
                }
            } else {
                // 工事の現場一覧キャッシュ更新
                const siteDate = meetingTime?.totalSeconds ? getYYYYMMDDTotalSeconds(toCustomDateFromTotalSeconds(meetingTime?.totalSeconds)) : date ? getYYYYMMDDTotalSeconds(date) : undefined
                const newSite: SiteType = {
                    siteId: siteId,
                    constructionId,
                    startDate: startTime?.totalSeconds,
                    endDate: endTime?.totalSeconds,
                    meetingDate: meetingTime?.totalSeconds,
                    requiredNum,
                    address,
                    belongings,
                    remarks,
                    siteDate,
                    updatedAt: Number(new Date()),
                }
                await _updateConstructionSiteListCache(newSite)
                const result = await writeConstructionSite({
                    siteId,
                    myCompanyId,
                    constructionId,
                    date: date,
                    startTime,
                    endTime,
                    meetingTime,
                    requiredNum,
                    address,
                    siteEndTimeIsNextDay,
                    siteStartTimeIsNextDay,
                    belongings,
                    remarks,
                    constructionRelation: construction.constructionRelation,
                    projectId: projectId ?? construction?.projectId,
                })
                if (isFocused) dispatch(setLoading(false))
                if (result.error) {
                    if (result.errorCode == 'OUT_OF_RANGE') {
                        setState((prev) => ({ ...prev, isVisibleModal: true }))
                    } else if (result.error == 'siteAlreadyExistsOnTheDay') {
                        dispatch(
                            setToastMessage({
                                text: t('admin:SiteAlreadyExistsOnTheDay'),
                                type: 'error',
                            } as ToastMessage),
                        )
                    } else {
                        throw {
                            error: result.error,
                            errorCode: result.errorCode,
                        }
                    }
                } else {
                    if (keepDate != undefined && date != undefined && dayBaseText(keepDate) != dayBaseText(date)) {
                        //日付を変更した場合
                        const cachedKey = genKeyName({
                            screenName: 'DateArrangements',
                            accountId: signInUser?.accountId ?? '',
                            companyId: myCompanyId ?? '',
                            /** "/" はKVSのキーに使えない文字のため "-" に置き換え */
                            date: keepDate ? dayBaseTextWithoutDate(keepDate).replace(/\//g, '-') : '',
                        })
                        const dateArrangementsCacheData = await getCachedData<DateDataType>(cachedKey)
                        if (dateArrangementsCacheData.success) {
                            //キャッシュがあった場合のみ上書き
                            const _dateArrangementsCacheData = cloneDeep(dateArrangementsCacheData.success)
                            const newTotalSites = _dateArrangementsCacheData?.sites?.totalSites?.items?.filter((site) => site.siteId != siteId)
                            const _findIndex = (siteId: string | undefined): number | undefined => {
                                return findIndex(newTotalSites, (_site) => _site.siteId == siteId)
                            }
                            const targetSiteNum = _findIndex(siteId)
                            if (targetSiteNum) {
                                //配列内の数字がtargetNumよりも大きい場合は1小さくする
                                const decreaseNumbersGreaterThanTarget = (arr: number[] | undefined) => {
                                    return arr?.map((num) => (num == targetSiteNum ? undefined : num > targetSiteNum ? num - 1 : num)).filter((data) => data != undefined) as number[]
                                }
                                const newDateArrangementsCacheData: DateDataType = {
                                    ...dateArrangementsCacheData.success,
                                    sites: {
                                        totalSites: {
                                            items: newTotalSites ?? [],
                                        },
                                        orderChildSites: decreaseNumbersGreaterThanTarget(dateArrangementsCacheData.success.sites?.orderChildSites),
                                        orderSites: decreaseNumbersGreaterThanTarget(dateArrangementsCacheData.success.sites?.orderSites),
                                        fakeCompanyMangerSites: decreaseNumbersGreaterThanTarget(dateArrangementsCacheData.success.sites?.fakeCompanyMangerSites),
                                        managerSites: decreaseNumbersGreaterThanTarget(dateArrangementsCacheData.success.sites?.managerSites),
                                        requestedSites: decreaseNumbersGreaterThanTarget(dateArrangementsCacheData.success.sites?.requestedSites),
                                    },
                                    updatedAt: Number(new Date()),
                                }
                                const cachedResult = await updateCachedData({ key: cachedKey, value: newDateArrangementsCacheData })
                                if (cachedResult.error) {
                                    const _error = cachedResult as CustomResponse
                                    dispatch(
                                        setToastMessage({
                                            text: getErrorToastMessage(_error),
                                            type: 'error',
                                        }),
                                    )
                                }
                            }
                        }
                    } else if (date) {
                        const cachedKey = genKeyName({
                            screenName: 'DateArrangements',
                            accountId: signInUser?.accountId ?? '',
                            companyId: myCompanyId ?? '',
                            /** "/" はKVSのキーに使えない文字のため "-" に置き換え */
                            date: date ? dayBaseTextWithoutDate(date).replace(/\//g, '-') : '',
                        })
                        const dateArrangementsCacheData = await getCachedData<DateDataType>(cachedKey)
                        if (dateArrangementsCacheData.success) {
                            //キャッシュがあった場合のみ上書き
                            const _dateArrangementsCacheData = cloneDeep(dateArrangementsCacheData.success)
                            const newTotalSites = _dateArrangementsCacheData?.sites?.totalSites?.items?.map((site) => {
                                const _site: SiteType =
                                    site.siteId == siteId
                                        ? {
                                              ...site,
                                              siteId: siteId,
                                              constructionId,
                                              startDate: combineTimeAndDay(startTime ?? DEFAULT_SITE_START_TIME, nextDay(date, siteStartTimeIsNextDay ? 1 : 0))?.totalSeconds,
                                              endDate: combineTimeAndDay(endTime ?? DEFAULT_SITE_END_TIME, nextDay(date, siteEndTimeIsNextDay ? 1 : 0))?.totalSeconds,
                                              meetingDate: combineTimeAndDay(meetingTime, date)?.totalSeconds,
                                              requiredNum,
                                              managerWorkerId: site.managerWorkerId,
                                              address,
                                              belongings,
                                              isConfirmed: site.isConfirmed,
                                              remarks,
                                              updateWorkerId: myWorkerId,
                                              siteDate: getDailyStartTime(date).totalSeconds,
                                              relatedCompanyIds: site.relatedCompanyIds,
                                              fakeCompanyInvRequestId,
                                          }
                                        : site
                                return _site
                            })
                            const newDateArrangementsCacheData: DateDataType = {
                                ...dateArrangementsCacheData.success,
                                sites: {
                                    ...dateArrangementsCacheData.success?.sites,
                                    totalSites: {
                                        items: newTotalSites ?? [],
                                    },
                                },
                                updatedAt: Number(new Date()),
                            }
                            const cachedResult = await updateCachedData({ key: cachedKey, value: newDateArrangementsCacheData })
                            if (cachedResult.error) {
                                const _error = cachedResult as CustomResponse
                                dispatch(
                                    setToastMessage({
                                        text: getErrorToastMessage(_error),
                                        type: 'error',
                                    }),
                                )
                            }
                        }
                    }
                    const meetingDate = combineTimeAndDay(meetingTime ?? DEFAULT_SITE_MEETING_TIME, date)
                    const constructionIdAndDate = toIdAndMonthFromStrings(constructionId, meetingDate)
                    const newLocalUpdateScreens: UpdateScreenType[] = [
                        {
                            screenName: 'SiteDetail',
                            ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'SiteDetail').map((screen) => screen.ids)), siteId]?.filter(
                                (data) => data != undefined,
                            ) as string[],
                        },
                        {
                            screenName: 'ConstructionSiteList',
                            idAndDates: [
                                ...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'ConstructionSiteList').map((screen) => screen.idAndDates)),
                                constructionIdAndDate,
                            ]?.filter((data) => data != undefined) as string[],
                        },
                    ]
                    if (fakeCompanyInvRequestId) {
                        newLocalUpdateScreens.push({
                            screenName: 'InvRequestDetail',
                            ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'InvRequestDetail').map((screen) => screen.ids)), fakeCompanyInvRequestId]?.filter(
                                (data) => data != undefined,
                            ) as string[],
                        })
                    }
                    dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
                    if (route.params?.isFromAdminHomeScreen) {
                        navigation.pop(2)
                    } else {
                        navigation.goBack()
                    }
                }
            }
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    return (
        <KeyboardAwareScrollView style={{ backgroundColor: '#fff' }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
            {mode == 'edit' && <ConstructionOverview construction={construction} project={construction?.project} style={{ margin: 15, marginTop: 20 }} />}
            <View style={{ backgroundColor: THEME_COLORS.OTHERS.BACKGROUND }}>
                {mode == 'new' && (
                    <InputConstructionBox
                        style={{ marginTop: 30 - dMarginTop }}
                        required={true}
                        disable={route.params?.isFromAdminHomeScreen || (targetDate == undefined && construction != undefined)}
                        title={t('admin:ConstructionToAddSite')}
                        targetDate={targetDate}
                        targetMonth={targetMonth}
                        selectedConstruction={construction}
                        onValueChangeValid={(value) => {
                            setState((prev) => ({
                                ...prev,
                                constructionId: value?.constructionId,
                            }))
                        }}
                    />
                )}
                <InputDateTimeBox
                    style={{ marginTop: 30 - dMarginTop }}
                    required={true}
                    disable={targetDate != undefined ? true : fakeCompanyInvRequestId != undefined}
                    title={t('common:WorkingDay')}
                    // maxDateTime={construction?.endDate}
                    // minDateTime={construction?.startDate}
                    value={date}
                    initDateInput={date}
                    dateInputMode={'date'}
                    onValueChangeValid={(value) => {
                        if (keepDate == undefined) {
                            setState((prev) => ({ ...prev, date: value, keepDate: date }))
                        }
                        setState((prev) => ({ ...prev, date: value }))
                    }}
                />
                <InputDateTimeBox
                    style={{ marginTop: 30 - dMarginTop }}
                    title={t('common:TimeOfMeeting')}
                    displayNextDayButton={false}
                    value={meetingTime}
                    maxDateTime={startTime}
                    initDateInput={meetingTime}
                    dateInputMode={'time'}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, meetingTime: value }))
                    }}
                    onClear={() => {
                        setState((prev) => ({ ...prev, meetingTime: DEFAULT_SITE_MEETING_TIME }))
                    }}
                />
                <Checkbox
                    size={20}
                    fontSize={12}
                    color={BlueColor.deepColor}
                    textColor={BlueColor.deepTextColor}
                    text={t('common:SetAnUndeterminedTimeForTheMeeting')}
                    style={{
                        marginTop: 10,
                        marginLeft: 20,
                    }}
                    checked={meetingTime == undefined ? true : false}
                    onChange={(value) => {
                        if (meetingTime != undefined) {
                            setState((prev) => ({ ...prev, meetingTime: undefined }))
                        } else {
                            setState((prev) => ({ ...prev, meetingTime: DEFAULT_SITE_MEETING_TIME }))
                        }
                    }}
                />
                <InputDateTimeBox
                    style={{ marginTop: 30 - dMarginTop }}
                    required={true}
                    title={t('common:AssignmentStartTime')}
                    value={startTime}
                    displayNextDayButton={true}
                    initDateInput={startTime ?? DEFAULT_SITE_START_TIME}
                    isNextDay={siteStartTimeIsNextDay}
                    maxDateTimeIsNextDay={siteEndTimeIsNextDay}
                    minDateTime={meetingTime}
                    maxDateTime={endTime}
                    dateInputMode={'time'}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, startTime: value }))
                    }}
                    onNextDayChanged={(value) => {
                        setState((prev) => ({ ...prev, siteStartTimeIsNextDay: value }))
                    }}
                />
                <InputDateTimeBox
                    style={{ marginTop: 30 - dMarginTop }}
                    required={true}
                    title={t('common:AssignmentEndTime')}
                    displayNextDayButton={true}
                    initDateInput={endTime ?? DEFAULT_SITE_END_TIME}
                    isNextDay={siteEndTimeIsNextDay}
                    minDateTimeIsNextDay={siteStartTimeIsNextDay}
                    value={endTime}
                    minDateTime={startTime}
                    dateInputMode={'time'}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, endTime: value }))
                    }}
                    onNextDayChanged={(value) => {
                        setState((prev) => ({ ...prev, siteEndTimeIsNextDay: value }))
                    }}
                />
                <InputNumberBox
                    style={{ marginTop: 30 - dMarginTop }}
                    disable={fakeCompanyInvRequestId != undefined}
                    title={t('common:NoOfWorkersRequired')}
                    value={requiredNum}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, requiredNum: value }))
                    }}
                    onClear={() => {
                        setState((prev) => ({ ...prev, requiredNum: undefined }))
                    }}
                />
                <InputTextBox
                    style={{ marginTop: 30 - dMarginTop }}
                    validation={'none'}
                    required={false}
                    title={t('common:ProjectAddress')}
                    placeholder={PLACEHOLDER.ADDRESS}
                    value={address}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, address: value }))
                    }}
                    infoText={t('common:AllAddressesOfTheCaseWillBeChanged')}
                    onClear={() => {
                        setState((prev) => ({ ...prev, address: undefined }))
                    }}
                />
                <InputTextBox
                    style={{ marginTop: 30 - dMarginTop }}
                    validation={'none'}
                    required={false}
                    title={t('common:PersonalEffects')}
                    placeholder={PLACEHOLDER.BELONGING}
                    value={belongings}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, belongings: value }))
                    }}
                    onClear={() => {
                        setState((prev) => ({ ...prev, belongings: undefined }))
                    }}
                />
                <InputTextBox
                    style={{ marginTop: 30 - dMarginTop }}
                    validation={'none'}
                    required={false}
                    title={t('common:Remarks')}
                    placeholder={PLACEHOLDER.REMARKS}
                    value={remarks}
                    multiline={true}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, remarks: value }))
                    }}
                    onClear={() => {
                        setState((prev) => ({ ...prev, remarks: undefined }))
                    }}
                />
            </View>
            <AppButton
                disabled={disable}
                style={{ marginTop: 30, marginLeft: 10, marginRight: 10 }}
                title={mode == 'edit' ? t('common:Save') : t('common:Create')}
                onPress={() => _writeSite(siteId)}
            />
            <BaseModal
                onPress={() => {
                    setState((prev) => ({ ...prev, isVisibleModal: false }))
                    navigation.push('EditConstruction', {
                        constructionId,
                        contractId,
                        isInstruction: route.params?.isInstruction,
                    })
                }}
                onClose={() => setState((prev) => ({ ...prev, isVisibleModal: false }))}
                isVisible={isVisibleModal}
                disabled={false}
                buttonTitle={t('common:EditConstruction')}>
                <Text
                    style={{
                        fontSize: 14,
                        color: THEME_COLORS.OTHERS.BLACK,
                        fontFamily: FontStyle.medium,
                        textAlign: 'center',
                        lineHeight: 16,
                    }}>
                    {t('admin:SiteToCreatedMustBeWithinConstructionPeriodWantToEdit')}
                </Text>
            </BaseModal>
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default EditSite

const styles = StyleSheet.create({})
