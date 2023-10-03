/* eslint-disable indent */
import React, { useState, useEffect, useContext, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, StyleSheet, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { ConstructionHeaderCL } from '../../../../components/organisms/construction/ConstructionHeaderCL'
import { IconParam } from '../../../../components/organisms/IconParam'
import { ConstructionMeter } from '../../../../components/organisms/construction/ConstructionMeter'
import { TableArea } from '../../../../components/atoms/TableArea'
import { ShadowBoxWithHeader } from '../../../../components/organisms/shadowBox/ShadowBoxWithHeader'
import { Line } from '../../../../components/atoms/Line'
import { GlobalStyles } from '../../../../utils/Styles'
import { AddressMap } from '../../../../components/organisms/AddressMap'
import { AppButton } from '../../../../components/atoms/AppButton'
import {
    compareWithAnotherDate,
    CustomDate,
    dayBaseText,
    getDailyEndTime,
    getDailyStartTime,
    getTextBetweenAnotherDate,
    nextDay,
    timeText,
    toCustomDateFromTotalSeconds,
} from '../../../../models/_others/CustomDate'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { StoreType } from '../../../../stores/Store'
import { deleteParamOfLocalUpdateScreens, setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { ConstructionDetailRouterContext } from './ConstructionDetailRouter'
import { ConstructionListCacheReturnType, deleteTargetConstructionsFromCache, getMyConstructionDetail, restoreConstructionsCache } from '../../../../usecases/construction/MyConstructionCase'
import { useIsFocused } from '@react-navigation/native'
import { deleteTargetConstruction } from '../../../../usecases/construction/CommonConstructionCase'
import { Contract } from '../../../../components/organisms/contract/Contract'
import { ConstructionCLType, ConstructionType } from '../../../../models/construction/Construction'
import { checkLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { updateCachedData, getCachedData, genKeyName } from '../../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { ScrollViewInstead } from '../../../../components/atoms/ScrollViewInstead'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { deleteParamOfUpdateScreens, checkUpdateOfTargetScreen } from '../../../../usecases/updateScreens/CommonUpdateScreensCase'
import { toCustomDatesListFromStartAndEnd, toIdAndMonthFromStrings, UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
import isEmpty from 'lodash/isEmpty'
import uniqBy from 'lodash/uniqBy'
import cloneDeep from 'lodash/cloneDeep'
import range from 'lodash/range'
import flatten from 'lodash/flatten'
import DisplayIdInDev from '../../../../components/atoms/DisplayIdInDEV'
import { InstructionCLType } from '../../../../models/instruction/Instruction'
import { approveTargetInstruction, deleteTargetInstruction, getTargetInstruction, unApproveTargetInstruction } from '../../../../usecases/construction/MyConstructionInstructionCase'
import { THEME_COLORS } from '../../../../utils/Constants'
import { CompanyCLType } from '../../../../models/company/Company'
import { departmentsToText } from '../../../../usecases/worker/CommonWorkerCase'
import { checkMyDepartment } from '../../../../usecases/department/DepartmentCase'
import { setDeletedConstructionIds, setIsCacheReady } from '../../../../stores/CacheSlice'
import { ConstructionHeader } from '../../../../components/organisms/construction/ConstructionHeader'
import { ContractingProjectConstructionListType } from '../../../../models/construction/ContractingProjectConstructionListType'

type NavProps = StackNavigationProp<RootStackParamList, 'ConstructionDetail'>
type RouteProps = RouteProp<RootStackParamList, 'ConstructionDetail'>

/**
 * isEditable: 編集削除発注が可能かどうか。上位契約の状態できまる
 */
type InitialStateType = {
    id?: string
    updateCache: number
    construction?: MyConstructionDetailUIType
    isFetching: boolean
    isEditable: boolean
    instruction?: InstructionCLType
}

export type MyConstructionDetailUIType = {
    dayCount?: number
} & ConstructionType

const initialState: InitialStateType = {
    isEditable: true,
    isFetching: false,
    updateCache: 0,
}
const ConstructionDetail = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ id, construction, isFetching, updateCache, instruction, isEditable }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const { constructionId, update, projectId, relatedCompanyId, contractor, supportType } = useContext(ConstructionDetailRouterContext)
    const cachedConstructionKey = genKeyName({ screenName: 'ConstructionDetail', accountId: accountId, constructionId: constructionId ?? '', companyId: myCompanyId ?? '' })
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const deletedConstructionIds = useSelector((state: StoreType) => state?.cache.deletedConstructionIds)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])
    const holidays = useSelector((state: StoreType) => state?.util?.holidays)

    const startDate = useMemo(() => (construction?.project?.startDate ? toCustomDateFromTotalSeconds(cloneDeep(construction.project.startDate)) : undefined), [construction?.project?.startDate])
    const endDate = useMemo(() => (construction?.project?.endDate ? toCustomDateFromTotalSeconds(cloneDeep(construction.project.endDate)) : undefined), [construction?.project?.endDate])
    const otherOffDays = useMemo(() => (construction?.otherOffDays ? construction?.otherOffDays?.map((day) => toCustomDateFromTotalSeconds(day)) : undefined), [construction?.otherOffDays])
    const siteMeetingTime = useMemo(() => (construction?.siteMeetingTime ? toCustomDateFromTotalSeconds(cloneDeep(construction.siteMeetingTime)) : undefined), [construction?.siteMeetingTime])
    const siteStartTime = useMemo(() => (construction?.siteStartTime ? toCustomDateFromTotalSeconds(cloneDeep(construction.siteStartTime)) : undefined), [construction?.siteStartTime])
    const siteEndTime = useMemo(() => (construction?.siteEndTime ? toCustomDateFromTotalSeconds(cloneDeep(construction.siteEndTime)) : undefined), [construction?.siteMeetingTime])

    useSafeUnmount(setState, initialState)
    const isFocused = useIsFocused()

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))

            /**
             * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
             */
            ;(async () => {
                const isUpdateResult = await checkUpdateOfTargetScreen({
                    targetId: id,
                    accountId: accountId,
                    targetScreenName: 'ConstructionDetail',
                    localUpdateScreens,
                })
                if (isUpdateResult.success) {
                    dispatch(setIsNavUpdating(true))
                }
            })()
            if (
                (construction?.constructionRelation == 'order-children' && construction?.contract?.orderCompany?.companyPartnership == 'my-company') ||
                (construction?.constructionRelation == 'manager' && construction?.contract?.orderCompany?.companyPartnership == 'partner')
            ) {
                _getTargetInstruction()
            }
        }
    }, [isFocused, update, id])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useEffect(() => {
        if (constructionId) {
            setState((prev) => ({ ...prev, id: constructionId }))
        }
    }, [constructionId])

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        setState((prev) => ({ ...prev, isEditable: construction?.contract?.status == 'created' ? false : true }))
    }, [construction?.contract])

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(id) || isEmpty(myCompanyId) || isFetching != true) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const constructionResult = await getMyConstructionDetail({
                    constructionId: id,
                    myCompanyId,
                    holidays,
                })
                const cachedResult = await getCachedData<MyConstructionDetailUIType>(cachedConstructionKey)
                if (cachedResult.success) {
                    setState((prev) => ({ ...prev, construction: cachedResult.success }))
                    if (constructionResult.success?.constructionId == undefined) return
                    if (cachedResult.success.updatedAt && constructionResult.success.updatedAt && cachedResult.success.updatedAt > constructionResult.success?.updatedAt) {
                        // キャッシュよりDBが古い場合、更新しない
                        return
                    }
                }
                if (constructionResult.error || constructionResult.success == undefined || constructionResult.success == undefined) {
                    throw {
                        error: constructionResult.error,
                    }
                }
                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                setState((prev) => ({ ...prev, construction: constructionResult.success }))
                const cachedConstructionResult = await updateCachedData({ key: cachedConstructionKey, value: constructionResult.success })
                if (cachedConstructionResult.error) {
                    dispatch(
                        setToastMessage({
                            text: cachedConstructionResult.error,
                            type: 'error',
                        }),
                    )
                }
                deleteParamOfLocalUpdateScreens({
                    screens: localUpdateScreens,
                    screenName: 'ConstructionDetail',
                    id,
                    paramName: 'ids',
                })
                await deleteParamOfUpdateScreens({
                    accountId: accountId,
                    screenName: 'ConstructionDetail',
                    id,
                    paramName: 'ids',
                })
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                setState((prev) => ({ ...prev, isFetching: false }))
                if (isFocused) {
                    dispatch(setIsNavUpdating(false))
                    dispatch(setLoading(false))
                }
            }
        })()
        if (
            (construction?.constructionRelation == 'order-children' && construction?.contract?.orderCompany?.companyPartnership == 'my-company') ||
            (construction?.constructionRelation == 'manager' && construction?.contract?.orderCompany?.companyPartnership == 'partner')
        ) {
            _getTargetInstruction()
        }
    }, [isFetching])

    /**
     * @summary 工事詳細のキャッシュを更新する副作用関数
     * @purpose アプリ側にKVSによるキャッシュを設けて初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            const result = await getCachedData<MyConstructionDetailUIType>(cachedConstructionKey)
            if (result.error) {
                if (result.errorCode != 'FIRST_FETCH') {
                    dispatch(
                        setToastMessage({
                            text: result.error,
                            type: 'error',
                        }),
                    )
                }
                setState((prev) => ({ ...prev, isFetching: true }))
            } else {
                setState((prev) => ({ ...prev, construction: result.success }))
                if (
                    (result.success?.constructionRelation == 'order-children' && result.success?.contract?.orderCompany?.companyPartnership == 'my-company') ||
                    (result.success?.constructionRelation == 'manager' && result.success?.contract?.orderCompany?.companyPartnership == 'partner')
                ) {
                    _getTargetInstruction()
                }
            }
        })()
    }, [updateCache])

    const _deleteConstruction = async () => {
        try {
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
                    errorCode: 'DELETE_CONSTRUCTION_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: id ?? 'no-id',
                modelType: 'construction',
            })
            if (lockResult.error) {
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                throw {
                    error: lockResult.error,
                }
            }

            /**
             * DBから工事削除前にキャッシュから削除
             */
            dispatch(setIsCacheReady(false))
            const deleteTargetConstructionsFromCacheResult = await deleteTargetConstructionsFromCache({
                constructionIds: [constructionId as string],
                myCompanyId,
                accountId,
                startDate: construction?.project?.startDate ? toCustomDateFromTotalSeconds(construction?.project?.startDate) : undefined,
                endDate: construction?.project?.endDate ? toCustomDateFromTotalSeconds(construction?.project?.endDate) : undefined,
                contractId: construction?.contractId,
                dispatch,
            })

            let cacheBackUp: ConstructionListCacheReturnType[] | undefined

            if (deleteTargetConstructionsFromCacheResult.error) {
                const _error =
                    (deleteTargetConstructionsFromCacheResult.error === '初回更新中' ? deleteTargetConstructionsFromCacheResult.error : '削除した工事をキャッシュへ反映するのに失敗しました') +
                    ' constructionId: ' +
                    constructionId
                console.log(_error)
                // throw {
                //     error: deleteTargetConstructionFromCacheResult.error,
                //     errorCode: deleteTargetConstructionFromCacheResult.errorCode,
                // }
            } else {
                cacheBackUp = deleteTargetConstructionsFromCacheResult.success
            }

            dispatch(setIsCacheReady(true))

            const result = await deleteTargetConstruction({ constructionId })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                if (cacheBackUp !== undefined && !isEmpty(cacheBackUp)) {
                    dispatch(setIsCacheReady(false))

                    const restoreConstructionsCacheResult = await restoreConstructionsCache({
                        cacheData: cacheBackUp,
                    })
                    dispatch(setIsCacheReady(true))
                    if (restoreConstructionsCacheResult.error) {
                        console.log('削除した工事のキャッシュデータ復元に失敗しました')
                        // throw {
                        //     error: restoreConstructionsCacheResult.error,
                        //     errorCode: restoreConstructionsCacheResult.errorCode,
                        // }
                    }
                }

                throw {
                    error: result.error,
                }
            }

            const dateList: number[] = []

            if (construction && startDate && endDate) {
                let date = getDailyStartTime(startDate)
                for (const dateIndex in range(0, compareWithAnotherDate(getDailyStartTime(startDate), nextDay(getDailyEndTime(endDate), 1)).days)) {
                    dateList.push(date.totalSeconds)
                    date = nextDay(date, 1)
                }
            }

            let newLocalUpdateScreens: UpdateScreenType[] = []
            if (startDate && endDate) {
                const dateList = toCustomDatesListFromStartAndEnd(startDate, endDate)
                if (relatedCompanyId) {
                    const idAndDates = dateList?.map((month) => toIdAndMonthFromStrings(relatedCompanyId, month))
                    newLocalUpdateScreens = [
                        ...newLocalUpdateScreens,
                        {
                            screenName: 'CompanyInvoice',
                            idAndDates: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'CompanyInvoice').map((screen) => screen.idAndDates)), ...(idAndDates ?? [])]?.filter(
                                (data) => data != undefined,
                            ) as string[],
                        },
                    ]
                }
            }

            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            dispatch(
                setToastMessage({
                    text: t('common:ConstructionDeleted'),
                    type: 'success',
                } as ToastMessage),
            )

            navigation.goBack()
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

    const _getTargetInstruction = async () => {
        const targetRequestId = String(constructionId)
        const instructionType = 'construction'
        const instructionResult = await getTargetInstruction({ targetRequestId, instructionType, holidays })
        setState((prev) => ({ ...prev, instruction: instructionResult.success }))
        setState((prev) => ({ ...prev, instructionDayCount: instructionResult.detail }))
    }

    const _approveInstruction = async () => {
        try {
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
                    errorCode: 'APPROVE_INSTRUCTION_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: instruction?.instructionId ?? 'no-id',
                modelType: 'instruction',
            })
            if (lockResult.error) {
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                throw {
                    error: lockResult.error,
                }
            }
            const instructionId = instruction?.instructionId
            const result = await approveTargetInstruction({ instructionId: instructionId })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            setState((prev) => ({ ...prev, isFetching: true }))
            dispatch(
                setToastMessage({
                    text: t('admin:InstructionApproved'),
                    type: 'success',
                } as ToastMessage),
            )
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

    const _unApproveInstruction = async () => {
        try {
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
                    errorCode: 'UN_APPROVE_INSTRUCTION_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: instruction?.instructionId ?? 'no-id',
                modelType: 'instruction',
            })
            if (lockResult.error) {
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                throw {
                    error: lockResult.error,
                }
            }
            const instructionId = instruction?.instructionId
            const result = await unApproveTargetInstruction({ instructionId: instructionId })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            setState((prev) => ({ ...prev, isFetching: true }))
            dispatch(
                setToastMessage({
                    text: t('admin:InstructionNotApproved'),
                    type: 'success',
                } as ToastMessage),
            )
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

    const _deleteConstructionInstruction = async () => {
        try {
            if (
                !checkMyDepartment({
                    targetDepartmentIds: construction?.contract?.orderDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') + '\n' + t('common:Department') + ': ' + departmentsToText(construction?.contract?.orderDepartments?.items),
                    errorCode: 'DELETE_INSTRUCTION_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: instruction?.instructionId ?? 'no-id',
                modelType: 'instruction',
            })
            if (lockResult.error) {
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                throw {
                    error: lockResult.error,
                }
            }
            const instructionId = instruction?.instructionId
            const result = await deleteTargetInstruction({ instructionId })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            dispatch(
                setToastMessage({
                    text: t('admin:InstructionDeleted'),
                    type: 'success',
                } as ToastMessage),
            )
            _getTargetInstruction()
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

    const getInstructionStatusMessage = () => {
        if (instruction?.instructionStatus == 'created') {
            return 'admin:InstructionStatusCreated'
        } else if (instruction?.instructionStatus == 'edited') {
            return 'admin:InstructionStatusEdited'
        } else if (instruction?.instructionStatus == 'approved') {
            return 'admin:InstructionStatusApproved'
        } else if (instruction?.instructionStatus == 'unapproved') {
            return 'admin:InstructionStatusUnapproved'
        } else {
            return ''
        }
    }

    const getInstructionContents = (
        originValue: string | CustomDate | undefined | { siteStartTime?: CustomDate; siteEndTime?: CustomDate; siteStartTimeIsNextDay?: Boolean; siteEndTimeIsNextDay?: Boolean },
        instructionValue: string | CustomDate | undefined | { siteStartTime?: CustomDate; siteEndTime?: CustomDate; siteStartTimeIsNextDay?: Boolean; siteEndTimeIsNextDay?: Boolean },
        valueType?: string | undefined,
    ) => {
        // if (isEmpty(originValue)) {
        //     originValue = t('common:Undecided')
        // }
        // if (isEmpty(instructionValue)) {
        //     return `変更前：${originValue}\n変更後：変更なし`
        // }

        if (valueType == 'date') {
            originValue = originValue ? dayBaseText(originValue as CustomDate) : '未定'
            instructionValue = instructionValue ? dayBaseText(instructionValue as CustomDate) : '未定'
        } else if (valueType == 'time') {
            originValue = originValue ? timeText(originValue as CustomDate) : '未定'
            instructionValue = instructionValue ? timeText(instructionValue as CustomDate) : '未定'
        } else if (valueType == 'workTime') {
            originValue = originValue as { siteStartTime: CustomDate; siteEndTime: CustomDate; siteStartTimeIsNextDay: Boolean; siteEndTimeIsNextDay: Boolean }
            originValue = originValue.siteStartTime
                ? (originValue.siteStartTimeIsNextDay ? t('common:Next') : '') +
                  getTextBetweenAnotherDate(
                      nextDay(originValue.siteStartTime, originValue.siteStartTimeIsNextDay ? 1 : 0),
                      originValue.siteEndTime ? nextDay(originValue.siteEndTime, originValue.siteEndTimeIsNextDay ? 1 : 0) : undefined,
                      true,
                  )
                : t('common:Undecided')
            instructionValue = instructionValue as { siteStartTime: CustomDate; siteEndTime: CustomDate; siteStartTimeIsNextDay: Boolean; siteEndTimeIsNextDay: Boolean }
            instructionValue = instructionValue.siteStartTime
                ? (instructionValue.siteStartTimeIsNextDay ? t('common:Next') : '') +
                  getTextBetweenAnotherDate(
                      nextDay(instructionValue.siteStartTime, instructionValue.siteStartTimeIsNextDay ? 1 : 0),
                      instructionValue.siteEndTime ? nextDay(instructionValue.siteEndTime, instructionValue.siteEndTimeIsNextDay ? 1 : 0) : undefined,
                      true,
                  )
                : t('common:Undecided')
        }

        if (originValue != instructionValue) {
            return `変更前：${originValue ?? 'なし'}\n変更後：${instructionValue}`
        } else {
            return `変更前：${originValue ?? 'なし'}\n変更後：変更なし`
        }
    }

    const getConstructionDetailInstructionList = (construction: MyConstructionDetailUIType, instruction: InstructionCLType) => {
        let instructionList = []
        if (instruction.instructionInfo.name && construction.name != instruction.instructionInfo.name) {
            instructionList.push({
                key: '工事名',
                content: getInstructionContents(construction.name, instruction.instructionInfo.name),
            })
        }
        if (
            (instruction.instructionInfo.startDate != undefined && startDate != undefined && dayBaseText(startDate) != dayBaseText(instruction.instructionInfo.startDate)) ||
            (instruction.instructionInfo.startDate != undefined && startDate == undefined)
        ) {
            instructionList.push({
                key: '工期開始日',
                content: getInstructionContents(startDate, instruction.instructionInfo.startDate, 'date'),
            })
        }
        if (
            (instruction.instructionInfo.endDate != undefined && endDate != undefined && dayBaseText(endDate) != dayBaseText(instruction.instructionInfo.endDate)) ||
            (instruction.instructionInfo.endDate != undefined && endDate == undefined)
        ) {
            instructionList.push({
                key: '工期終了日',
                content: getInstructionContents(endDate, instruction.instructionInfo.endDate, 'date'),
            })
        }
        if (instruction.instructionInfo.offDaysOfWeek && construction.offDaysOfWeek?.join(', ') != instruction.instructionInfo.offDaysOfWeek?.join(', ')) {
            instructionList.push({
                key: '定休日',
                content: getInstructionContents(construction.offDaysOfWeek?.join(', '), instruction.instructionInfo?.offDaysOfWeek?.join(', ')),
            })
        }
        if (
            instruction.instructionInfo.otherOffDays &&
            otherOffDays?.map((offDay: CustomDate) => dayBaseText(offDay)).join(', ') != instruction.instructionInfo?.otherOffDays?.map((offDay: CustomDate) => dayBaseText(offDay)).join(', ')
        ) {
            instructionList.push({
                key: 'その他の休日',
                content: getInstructionContents(
                    otherOffDays?.map((offDay: CustomDate) => dayBaseText(offDay)).join(', '),
                    instruction.instructionInfo?.otherOffDays?.map((offDay: CustomDate) => dayBaseText(offDay)).join(', '),
                ),
            })
        }
        if (instruction.dayCount && `${construction.dayCount ?? 0}${t('common:Day')}（休み除く）` != `${instruction.dayCount ?? 0}${t('common:Day')}（休み除く）`) {
            instructionList.push({
                key: '工事日数',
                content: getInstructionContents(`${construction.dayCount ?? 0}${t('common:Day')}（休み除く）`, `${instruction.dayCount ?? 0}${t('common:Day')}（休み除く）`),
            })
        }
        if (
            instruction.instructionInfo.requiredWorkerNum &&
            (construction.requiredWorkerNum ?? 0).toString() + t('common:Name') != (instruction.instructionInfo.requiredWorkerNum ?? 0).toString() + t('common:Name')
        ) {
            instructionList.push({
                key: '予定作業員数',
                content: getInstructionContents(
                    (construction.requiredWorkerNum ?? 0).toString() + t('common:Name'),
                    (instruction.instructionInfo.requiredWorkerNum ?? 0).toString() + t('common:Name'),
                ),
            })
        }
        if (instruction.instructionInfo.remarks && construction.remarks != instruction.instructionInfo.remarks) {
            instructionList.push({
                key: '備考',
                content: getInstructionContents(construction.remarks, instruction.instructionInfo.remarks),
            })
        }
        if (instruction.instructionInfo.updateWorker?.name && construction.updateWorker?.name != instruction.instructionInfo.updateWorker?.name) {
            instructionList.push({
                key: '工事作成者',
                content: getInstructionContents(construction.updateWorker?.name, instruction.instructionInfo.updateWorker?.name),
            })
        }
        return instructionList
    }

    const getConstructionDefaultSiteSettingInstructionList = (construction: MyConstructionDetailUIType, instruction: InstructionCLType) => {
        let instructionList = []
        if (construction.siteMeetingTime != instruction.instructionInfo.siteMeetingTime?.totalSeconds) {
            instructionList.push({
                key: '集合時間',
                content: getInstructionContents(siteMeetingTime, instruction.instructionInfo.siteMeetingTime, 'time'),
            })
        }
        if (
            instruction.instructionInfo.siteStartTime &&
            (construction.siteStartTime != instruction.instructionInfo.siteStartTime.totalSeconds ||
                construction.siteEndTime != instruction.instructionInfo.siteEndTime?.totalSeconds ||
                construction.siteStartTimeIsNextDay != instruction.instructionInfo.siteStartTimeIsNextDay ||
                construction.siteEndTimeIsNextDay != instruction.instructionInfo.siteEndTimeIsNextDay)
        ) {
            instructionList.push({
                key: '作業時間',
                content: getInstructionContents(
                    {
                        siteStartTime: construction.siteStartTime ? toCustomDateFromTotalSeconds(construction.siteStartTime) : undefined,
                        siteEndTime: construction.siteEndTime ? toCustomDateFromTotalSeconds(construction.siteEndTime) : undefined,
                        siteStartTimeIsNextDay: construction.siteStartTimeIsNextDay,
                        siteEndTimeIsNextDay: construction.siteEndTimeIsNextDay,
                    },
                    {
                        siteStartTime: instruction.instructionInfo.siteStartTime,
                        siteEndTime: instruction.instructionInfo.siteEndTime,
                        siteStartTimeIsNextDay: instruction.instructionInfo.siteStartTimeIsNextDay,
                        siteEndTimeIsNextDay: instruction.instructionInfo.siteEndTimeIsNextDay,
                    },
                    'workTime',
                ),
            })
        }
        if (instruction.instructionInfo.siteRequiredNum && construction.siteRequiredNum != instruction.instructionInfo.siteRequiredNum) {
            instructionList.push({
                key: '必要作業員',
                content: getInstructionContents((construction.siteRequiredNum ?? 0).toString() + t('common:Name'), (instruction.instructionInfo.siteRequiredNum ?? 0).toString() + t('common:Name')),
            })
        }
        if (instruction.instructionInfo.siteBelongings && construction.siteBelongings != instruction.instructionInfo.siteBelongings) {
            instructionList.push({
                key: '持ち物',
                content: getInstructionContents(construction.siteBelongings, instruction.instructionInfo.siteBelongings),
            })
        }
        if (instruction.instructionInfo.siteRemarks && construction.siteRemarks != instruction.instructionInfo.siteRemarks) {
            instructionList.push({
                key: '備考',
                content: getInstructionContents(construction.siteRemarks, instruction.instructionInfo.siteRemarks),
            })
        }
        return instructionList
    }

    return (
        <ScrollViewInstead
            style={{
                backgroundColor: '#fff',
                paddingHorizontal: 10,
                paddingTop: 10,
            }}>
            {construction != undefined && (
                // {cachedConstruction != undefined && (
                <View>
                    <View style={{}}>
                        {!isEmpty(instruction) && instruction.instructionStatus != 'approved' && (
                            <>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        marginBottom: 5,
                                        width: '100%',
                                    }}>
                                    <Text
                                        style={{
                                            color: THEME_COLORS.OTHERS.ALERT_RED,
                                        }}>
                                        {t(getInstructionStatusMessage())}
                                    </Text>
                                </View>
                                <View>
                                    {getConstructionDetailInstructionList(construction, instruction).length > 0 && (
                                        <>
                                            <Text style={GlobalStyles.mediumText}>{t('admin:ConstructionDetailInstructions')}</Text>
                                            <TableArea columns={getConstructionDetailInstructionList(construction, instruction)} />
                                        </>
                                    )}
                                    {getConstructionDefaultSiteSettingInstructionList(construction, instruction).length > 0 && (
                                        <>
                                            <View style={{ marginTop: 10 }}>
                                                <Text style={GlobalStyles.mediumText}>{t('admin:OnsiteDefaultSettingInstructions')}</Text>
                                            </View>
                                            <TableArea columns={getConstructionDefaultSiteSettingInstructionList(construction, instruction)} />
                                        </>
                                    )}
                                    {construction.siteAddress != instruction.instructionInfo.siteAddress && (
                                        <>
                                            <AddressMap
                                                location={{
                                                    address: construction.siteAddress,
                                                }}
                                                style={{
                                                    marginTop: 10,
                                                }}
                                            />
                                            <AddressMap
                                                location={{
                                                    address: instruction.instructionInfo.siteAddress,
                                                }}
                                                style={{
                                                    marginTop: 10,
                                                }}
                                                isInstruction={true}
                                            />
                                        </>
                                    )}
                                </View>
                            </>
                        )}
                        {(isEmpty(instruction) || instruction.instructionStatus == 'approved' || instruction.instructionStatus == 'unapproved') && (
                            <>
                                <ConstructionHeader style={{
                                    marginTop: instruction?.instructionStatus == 'unapproved' ? 10 : 0,
                                }} constructionRelation={construction.constructionRelation} displayName={construction.displayName} project={construction.project} />
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        marginTop: 10,
                                    }}>
                                    <IconParam iconName={'site'} paramName={'現場数'} suffix={'日'} count={construction?.sites?.items?.length} />
                                    <IconParam hasBorder iconName={'attend-worker'} paramName={'総手配数'} suffix={'名'} count={construction.constructionMeter?.presentNum} />
                                </View>
                                <ConstructionMeter
                                    style={{
                                        marginTop: 5,
                                    }}
                                    presentCount={construction.constructionMeter?.presentNum}
                                    requiredCount={construction.constructionMeter?.requiredNum}
                                />
                                <TableArea
                                    columns={[
                                        {
                                            key: '案件名',
                                            content: construction.project?.name,
                                        },
                                        {
                                            key: '工事名',
                                            content: construction.name,
                                        },
                                        {
                                            key: '工期',
                                            content: `${startDate ? dayBaseText(startDate) : '未定'}〜${endDate ? dayBaseText(endDate) : '未定'}`,
                                        },
                                        {
                                            key: '定休日',
                                            content: construction?.offDaysOfWeek?.join(', '),
                                        },
                                        {
                                            key: 'その他の休日',
                                            content: otherOffDays?.map((offDay: CustomDate) => dayBaseText(offDay)).join(', '),
                                        },
                                        {
                                            key: '工事日数',
                                            content: `${construction.dayCount ?? 0}${t('common:Day')}（休み除く）`,
                                        },
                                        {
                                            key: '予定作業員数',
                                            content: (construction.requiredWorkerNum ?? 0).toString() + t('common:Name'),
                                        },
                                        {
                                            key: '備考',
                                            content: construction.remarks,
                                        },
                                        {
                                            key: '工事作成者',
                                            content: construction.updateWorker?.name,
                                        },
                                    ]}
                                    style={{
                                        marginTop: 10,
                                    }}
                                />
                                <AddressMap
                                    location={{
                                        address: construction.siteAddress,
                                    }}
                                    style={{
                                        marginTop: 10,
                                    }}
                                />
                            </>
                        )}
                        {construction.contract != undefined && (
                            <ShadowBoxWithHeader
                                title={supportType === 'support-receive' || supportType === 'support-order' ? t('admin:SupportAgreement') : t('admin:ContractAgreement')}
                                style={{
                                    marginTop: 10,
                                }}>
                                <Contract
                                    contract={construction.contract}
                                    type={construction?.constructionRelation === 'owner' ? 'receive' : construction?.subContract !== undefined && construction?.subContract ? 'order' : 'both'}
                                    contractor={construction.constructionRelation === 'order-children' || construction.constructionRelation === 'fake-company-manager' ? contractor : undefined}
                                    supportType={supportType}
                                />
                            </ShadowBoxWithHeader>
                        )}
                        {construction.subContract != undefined && construction.constructionRelation !== 'owner' && (
                            <ShadowBoxWithHeader
                                title={
                                    construction.subContract?.orderCompanyId != myCompanyId && construction.subContract?.receiveCompanyId != myCompanyId
                                        ? t('admin:ContractAgreement')
                                        : construction.subContract?.orderCompanyId == myCompanyId
                                        ? t('admin:OrderContract')
                                        : t('admin:OrderContract')
                                }
                                style={{
                                    marginTop: 10,
                                }}
                                onPress={
                                    construction.subContract?.orderCompanyId == myCompanyId
                                        ? checkMyDepartment({
                                              targetDepartmentIds: construction.subContract.orderDepartmentIds,
                                              activeDepartmentIds,
                                          })
                                            ? () => {
                                                  navigation.push('ContractingProjectDetailRouter', {
                                                      contractId: construction.subContract?.contractId,
                                                      projectId: projectId,
                                                      title: construction.displayName,
                                                  })
                                              }
                                            : () =>
                                                  dispatch(
                                                      setToastMessage({
                                                          text:
                                                              t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                                                              '\n' +
                                                              t('common:Department') +
                                                              ': ' +
                                                              departmentsToText(construction.subContract?.orderDepartments?.items),
                                                          type: 'error',
                                                      } as ToastMessage),
                                                  )
                                        : undefined
                                }>
                                <Contract contract={construction.subContract} type={'receive'} />
                            </ShadowBoxWithHeader>
                        )}
                    </View>
                    {construction.constructionRelation == 'manager' && (
                        <View
                            style={{
                                marginTop: 20,
                            }}>
                            {!isEditable && (
                                <Text
                                    style={{
                                        ...GlobalStyles.mediumText,
                                        color: THEME_COLORS.OTHERS.ALERT_RED,
                                        marginBottom: 10,
                                    }}>
                                    {t('admin:CannotPlaceAnOrderUntilTheContractIsApproved')}
                                </Text>
                            )}
                            <AppButton
                                title={t('admin:PlaceOrderByContract')}
                                onPress={() => {
                                    navigation.push('CreateContract', {
                                        superConstructionId: id,
                                        projectId: projectId,
                                    })
                                }}
                                disabled={isEditable ? false : true}
                            />
                        </View>
                    )}

                    {(isEmpty(instruction) || instruction.instructionStatus == 'approved' || instruction.instructionStatus == 'unapproved') && (
                        <View
                            style={{
                                marginTop: 10,
                            }}>
                            <Text style={GlobalStyles.mediumText}>{t('admin:OnsiteDefaultSetting')}</Text>
                            <TableArea
                                style={{
                                    marginTop: 10,
                                }}
                                columns={[
                                    {
                                        key: '集合時間',
                                        content: siteMeetingTime ? timeText(siteMeetingTime) : t('common:Undecided'),
                                    },
                                    {
                                        key: '作業時間',
                                        content: `${
                                            siteStartTime
                                                ? (construction?.siteStartTimeIsNextDay ? t('common:Next') : '') +
                                                  getTextBetweenAnotherDate(
                                                      nextDay(siteStartTime, construction.siteStartTimeIsNextDay ? 1 : 0),
                                                      siteEndTime ? nextDay(siteEndTime, construction.siteEndTimeIsNextDay ? 1 : 0) : undefined,
                                                      true,
                                                  )
                                                : t('common:Undecided')
                                        }`,
                                    },
                                    {
                                        key: '必要作業員',
                                        content: (construction.siteRequiredNum ?? 0).toString() + t('common:Name'),
                                    },
                                    {
                                        key: '持ち物',
                                        content: construction.siteBelongings,
                                    },
                                    {
                                        key: '備考',
                                        content: construction.siteRemarks,
                                    },
                                ]}
                            />
                        </View>
                    )}
                    {construction.contract?.superConstruction?.constructionRelation == 'intermediation' && (
                        <>
                            <Line
                                style={{
                                    marginTop: 20,
                                }}
                            />
                            <ShadowBoxWithHeader
                                title={t('admin:OriginalBrokerageConstruction')}
                                style={{
                                    marginTop: 10,
                                }}
                                onPress={() => {
                                    navigation.push('ConstructionDetailRouter', {
                                        title: construction.contract?.superConstruction?.name,
                                        projectId: projectId,
                                        constructionId: construction.contract?.superConstruction?.constructionId,
                                    })
                                }}>
                                <ConstructionHeader
                                    constructionRelation={construction.contract?.superConstruction?.constructionRelation}
                                    displayName={construction.contract?.superConstruction?.displayName}
                                    project={construction.project}
                                />
                            </ShadowBoxWithHeader>
                        </>
                    )}
                    {(isEmpty(instruction) || instruction.instructionStatus == 'approved' || instruction.instructionStatus == 'unapproved') &&
                        (construction.constructionRelation == 'manager' || construction.constructionRelation == 'fake-company-manager') && (
                            <>
                                <Line
                                    style={{
                                        marginTop: 20,
                                    }}
                                />
                                <View
                                    style={{
                                        marginTop: 10,
                                    }}>
                                    {!isEditable && (
                                        <Text
                                            style={{
                                                ...GlobalStyles.mediumText,
                                                color: THEME_COLORS.OTHERS.ALERT_RED,
                                            }}>
                                            {t('admin:CannotEditUntilTheContractIsApproved')}
                                        </Text>
                                    )}
                                    <AppButton
                                        style={{
                                            marginTop: 10,
                                        }}
                                        title={t('admin:EditConstructionInfo')}
                                        onPress={
                                            construction.contract?.receiveCompanyId == myCompanyId ||
                                            checkMyDepartment({
                                                targetDepartmentIds: construction.contract?.orderDepartmentIds,
                                                activeDepartmentIds,
                                            })
                                                ? () => {
                                                      navigation.push('EditConstruction', {
                                                          constructionId: id,
                                                          contractId: construction.contractId,
                                                      })
                                                  }
                                                : () =>
                                                      dispatch(
                                                          setToastMessage({
                                                              text:
                                                                  t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                                                                  '\n' +
                                                                  t('common:Department') +
                                                                  ': ' +
                                                                  departmentsToText(construction.contract?.orderDepartments?.items),
                                                              type: 'error',
                                                          } as ToastMessage),
                                                      )
                                        }
                                        disabled={isEditable ? false : true}
                                    />
                                    {construction.fakeCompanyInvReservationId == undefined && (
                                        <AppButton
                                            style={{
                                                marginTop: 10,
                                            }}
                                            title={t('common:Delete')}
                                            isGray
                                            onPress={() => {
                                                Alert.alert(t('admin:WantToDeleteAllDetailsWillDelete'), t('admin:OperationCannotBeUndone'), [
                                                    { text: t('admin:Deletion'), onPress: () => _deleteConstruction() },
                                                    {
                                                        text: t('admin:Cancel'),
                                                        style: 'cancel',
                                                    },
                                                ])
                                            }}
                                            disabled={isEditable ? false : true}
                                        />
                                    )}
                                </View>
                            </>
                        )}

                    {!isEmpty(instruction) && instruction.instructionStatus != 'approved' && instruction.instructionStatus != 'unapproved' && construction.constructionRelation == 'manager' && (
                        <>
                            <Line
                                style={{
                                    marginTop: 20,
                                }}
                            />
                            <View
                                style={{
                                    marginTop: 10,
                                }}>
                                <ShadowBoxWithHeader
                                    title={t('admin:Instruction')}
                                    style={{
                                        marginTop: 10,
                                    }}>
                                    <AppButton
                                        style={{
                                            marginTop: 10,
                                        }}
                                        title={t('admin:Approve')}
                                        isGray
                                        onPress={() => {
                                            Alert.alert(t('admin:WantToApproveInstructionTitle'), t('admin:WantToApproveInstructionMessage'), [
                                                { text: t('admin:Approve'), onPress: () => _approveInstruction() },
                                                {
                                                    text: t('admin:Cancel'),
                                                    style: 'cancel',
                                                },
                                            ])
                                        }}
                                    />

                                    <AppButton
                                        style={{
                                            marginTop: 10,
                                        }}
                                        title={t('admin:NotApprove')}
                                        isGray
                                        onPress={() => {
                                            Alert.alert(t('admin:NotWantToApproveInstructionTitle'), t('admin:NotWantToApproveInstructionMessage'), [
                                                { text: t('admin:NotApprove'), onPress: () => _unApproveInstruction() },
                                                {
                                                    text: t('admin:Cancel'),
                                                    style: 'cancel',
                                                },
                                            ])
                                        }}
                                    />
                                </ShadowBoxWithHeader>
                            </View>
                        </>
                    )}
                    {construction.constructionRelation == 'order-children' && (
                        <>
                            <Line
                                style={{
                                    marginTop: 20,
                                    marginBottom: 10,
                                }}
                            />
                            {!isEditable && (
                                <Text
                                    style={{
                                        ...GlobalStyles.mediumText,
                                        color: THEME_COLORS.OTHERS.ALERT_RED,
                                        marginTop: 10,
                                    }}>
                                    {t('admin:CannotEditUntilTheContractIsApproved')}
                                </Text>
                            )}
                            <View>
                                <AppButton
                                    style={{
                                        marginTop: 10,
                                    }}
                                    title={t('admin:RequestEditingConstructionInfo')}
                                    onPress={
                                        checkMyDepartment({
                                            targetDepartmentIds: construction.contract?.orderDepartmentIds,
                                            activeDepartmentIds,
                                        })
                                            ? () => {
                                                  navigation.push('EditConstruction', {
                                                      constructionId: id,
                                                      contractId: construction.contractId,
                                                      isInstruction: true,
                                                      instructionId: instruction?.instructionId,
                                                  })
                                              }
                                            : () =>
                                                  dispatch(
                                                      setToastMessage({
                                                          text:
                                                              t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                                                              '\n' +
                                                              t('common:Department') +
                                                              ': ' +
                                                              departmentsToText(construction.contract?.orderDepartments?.items),
                                                          type: 'error',
                                                      } as ToastMessage),
                                                  )
                                    }
                                    disabled={isEditable ? false : true}
                                />
                                {!isEmpty(instruction) && instruction.instructionStatus != 'approved' && (
                                    <AppButton
                                        style={{
                                            marginTop: 10,
                                        }}
                                        title={t('admin:DeleteInstruction')}
                                        isGray
                                        onPress={
                                            checkMyDepartment({
                                                targetDepartmentIds: construction.contract?.orderDepartmentIds,
                                                activeDepartmentIds,
                                            })
                                                ? () => {
                                                      Alert.alert(t('admin:WantToDeleteInstruction'), t('admin:OperationCannotBeUndone'), [
                                                          { text: t('admin:Deletion'), onPress: () => _deleteConstructionInstruction() },
                                                          {
                                                              text: t('admin:Cancel'),
                                                              style: 'cancel',
                                                          },
                                                      ])
                                                  }
                                                : () =>
                                                      dispatch(
                                                          setToastMessage({
                                                              text:
                                                                  t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                                                                  '\n' +
                                                                  t('common:Department') +
                                                                  ': ' +
                                                                  departmentsToText(construction.contract?.orderDepartments?.items),
                                                              type: 'error',
                                                          } as ToastMessage),
                                                      )
                                        }
                                    />
                                )}
                            </View>
                        </>
                    )}
                    <DisplayIdInDev id={constructionId} label="constructionId" />

                    <BottomMargin />
                </View>
            )}
        </ScrollViewInstead>
    )
}
export default ConstructionDetail

const styles = StyleSheet.create({})
