import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, AppState, Text, Pressable } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { getRandomImageColorHue, getUuidv4, pickImage, SwitchEditOrCreateProps, useComponentSize } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { AppButton } from '../../../../components/atoms/AppButton'
import {
    DEFAULT_SITE_END_TIME,
    DEFAULT_SITE_END_TIME_OBJ,
    DEFAULT_SITE_MEETING_TIME,
    DEFAULT_SITE_START_TIME,
    DEFAULT_SITE_START_TIME_OBJ,
    LOCK_INTERVAL_TIME,
    MAX_PROJECT_SPAN,
    PLACEHOLDER,
    THEME_COLORS,
    dMarginTop,
} from '../../../../utils/Constants'
import { InputDateTimeBox } from '../../../../components/organisms/inputBox/InputDateTimeBox'
import { InputNumberBox } from '../../../../components/organisms/inputBox/InputNumberBox'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { useIsFocused } from '@react-navigation/native'
import { InputCompanyBox } from '../../../../components/organisms/inputBox/InputCompanyBox'
import { CompanyCLType, CompanyType } from '../../../../models/company/Company'
import { InputDateTimeListBox } from '../../../../components/organisms/inputBox/InputDateTimeListBox'
import { _getInvReservation } from '../../../../services/invReservation/InvReservationService'
import { getInvReservationDetail, writeInvReservation } from '../../../../usecases/invReservation/InvReservationCase'
import {
    CustomDate,
    combineTimeAndDay,
    compareWithAnotherDate,
    dayBaseTextWithoutDate,
    getDailyEndTime,
    getDailyStartTime,
    getMonthlyFirstDay,
    isHoliday,
    monthBaseText,
    nextDay,
    nextMonth,
    toCustomDateFromString,
    toCustomDateFromTotalSeconds,
} from '../../../../models/_others/CustomDate'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'
import uniq from 'lodash/uniq'
import { InputTextBox } from '../../../../components/organisms/inputBox/InputTextBox'
import { ImageIcon } from '../../../../components/organisms/ImageIcon'
import { BlueColor, FontStyle, GlobalStyles } from '../../../../utils/Styles'
import { InputDropDownBox } from '../../../../components/organisms/inputBox/InputDropdownBox'
import { Line } from '../../../../components/atoms/Line'
import { InputDateDropdownBox } from '../../../../components/organisms/inputBox/InputDateDropdownBox'
import { weekDayList, WeekOfDay } from '../../../../utils/ext/Date.extensions'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import cloneDeep from 'lodash/cloneDeep'
import { calculateConstructionDays, getDateRange } from '../../../../usecases/construction/CommonConstructionCase'
import { ID } from '../../../../models/_others/ID'
import { Checkbox } from '../../../../components/atoms/Checkbox'
import { InvReservationCLType, InvReservationType, toInvReservationCLType } from '../../../../models/invReservation/InvReservation'
import { ConstructionCLType, ConstructionModel, ConstructionType } from '../../../../models/construction/Construction'
import { genKeyName, getCachedData, updateCachedData } from '../../../../usecases/CachedDataCase'
import { max, min, range } from 'lodash'
import { ProjectCLType, ProjectType } from '../../../../models/project/Project'
import { SiteType } from '../../../../models/site/Site'
import { InvRequestType, toInvRequestCLType } from '../../../../models/invRequest/InvRequestType'
import { getErrorMessage, getErrorToastMessage } from '../../../../services/_others/ErrorService'
import SearchCompanyBox from '../../company/SearchCompanyBox'
import { _getFirestore } from '../../../../services/firebase/FirestoreService'
import { PartnerCompanyListType } from '../../../../models/company/PartnerCompanyListType'
import { CachedReceiveListType } from '../../transaction/ReceiveList'

type NavProps = StackNavigationProp<RootStackParamList, 'EditInvReservation'>
type RouteProps = RouteProp<RootStackParamList, 'EditInvReservation'>

type InitialStateType = {
    invReservationId?: string
    targetCompany?: CompanyCLType
    disable: boolean
    startDate?: CustomDate
    endDate?: CustomDate
    extraDates?: CustomDate[]
    invRequestIds?: string[]
    initialWorkerCount?: number
    offDaysOfWeek?: WeekOfDay[]
    otherOffDays?: CustomDate[]
    dateRange?: CustomDate[]
    projectOwnerCompany?: CompanyCLType
    companies?: CompanyCLType[]
    inputCompanyName?: string
    isFirstFetch?: boolean
} & ProjectStateType &
    ConstructionStateType

type ProjectStateType = {
    projectId?: ID
    projectName?: string
    image?: ImageInfo
    imageUrl?: string
    imageColorHue?: number
}

type ConstructionStateType = {
    constructionId?: ID
    contractId?: ID
    offDaysOfWeek?: WeekOfDay[]
    holidayCheck?: boolean
    otherOffDays?: CustomDate[]

    remarks?: string
    requiredWorkerNum?: number
    constructionDays?: number
    //ここから現場
    siteMeetingTime?: CustomDate
    siteStartTime?: CustomDate
    siteEndTime?: CustomDate
    siteStartTimeIsNextDay?: boolean
    siteEndTimeIsNextDay?: boolean
    siteRequiredNum?: number
    siteAddress?: string
    siteBelongings?: string
    siteRemarks?: string
}
const initialState: InitialStateType = {
    isFirstFetch: true,
    disable: true,
    extraDates: [],
    dateRange: [],
    constructionDays: 0,
}

type CachedInvReservationDetailType = {
    invReservation?: InvReservationCLType
}

const EditInvReservation = (props: Partial<SwitchEditOrCreateProps>) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const mode = props.mode ?? 'edit'
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const initStartDate = route?.params?.initStartDate
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const holidays = useSelector((store: StoreType) => store.util.holidays)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])

    const unsubscribeCompanyRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)

    const [
        {
            invReservationId,
            disable,
            startDate,
            endDate,
            extraDates,
            targetCompany,
            invRequestIds,
            initialWorkerCount,
            projectId,
            projectName,
            image,
            imageUrl,
            imageColorHue,
            constructionId,
            contractId,
            offDaysOfWeek,
            holidayCheck,
            otherOffDays,
            dateRange,
            projectOwnerCompany,
            companies,
            inputCompanyName,
            remarks,
            requiredWorkerNum,
            constructionDays,
            siteMeetingTime,
            siteStartTime,
            siteStartTimeIsNextDay,
            siteEndTime,
            siteEndTimeIsNextDay,
            siteRequiredNum,
            siteAddress,
            siteBelongings,
            siteRemarks,
            isFirstFetch,
        },
        setState,
    ] = useState(initialState)
    const dispatch = useDispatch()

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    const [size, onLayout] = useComponentSize()

    useEffect(() => {
        isScreenOnRef.current = isFocused
    }, [isFocused])

    useEffect(() => {
        ;(async () => {
            try {
                if (mode == 'new') {
                    return
                }
                dispatch(setLoading(true))
                const result = await getInvReservationDetail({
                    invReservationId: invReservationId ?? 'no-id',
                    myCompanyId,
                })
                const invReservationDetailCacheKey = genKeyName({
                    screenName: 'InvReservationDetail',
                    accountId: accountId ?? '',
                    invReservationId: invReservationId ?? '',
                    companyId: myCompanyId ?? '',
                    workerId: myWorkerId ?? '',
                })
                const cacheResult = await getCachedData<CachedInvReservationDetailType>(invReservationDetailCacheKey ?? 'no-id')
                if (cacheResult.success) {
                    setState((prev) => ({
                        ...prev,
                        ...cacheResult.success?.invReservation,
                        projectName: cacheResult.success?.invReservation?.construction?.project?.name,
                        projectId: cacheResult.success?.invReservation?.construction?.project?.projectId,
                        imageUrl: cacheResult.success?.invReservation?.construction?.project?.imageUrl,
                        imageColorHue: cacheResult.success?.invReservation?.construction?.project?.imageColorHue,
                        constructionId: cacheResult.success?.invReservation?.construction?.constructionId,
                        contractId: cacheResult.success?.invReservation?.construction?.contractId,
                        remarks: cacheResult.success?.invReservation?.construction?.remarks,
                        requiredWorkerNum: cacheResult.success?.invReservation?.construction?.requiredWorkerNum,
                        siteMeetingTime: cacheResult.success?.invReservation?.construction?.siteMeetingTime,
                        siteStartTime: cacheResult.success?.invReservation?.construction?.siteStartTime,
                        siteStartTimeIsNextDay: cacheResult.success?.invReservation?.construction?.siteStartTimeIsNextDay,
                        siteEndTime: cacheResult.success?.invReservation?.construction?.siteEndTime,
                        siteEndTimeIsNextDay: cacheResult.success?.invReservation?.construction?.siteEndTimeIsNextDay,
                        siteRequiredNum: cacheResult.success?.invReservation?.construction?.siteRequiredNum,
                        siteAddress: cacheResult.success?.invReservation?.construction?.siteAddress,
                        siteBelongings: cacheResult.success?.invReservation?.construction?.siteBelongings,
                        siteRemarks: cacheResult.success?.invReservation?.construction?.siteRemarks,
                    }))
                    dispatch(setLoading(false))
                    if (result.success?.updatedAt == undefined) return
                    if (
                        cacheResult?.success?.invReservation?.updatedAt?.totalSeconds &&
                        result?.success?.updatedAt?.totalSeconds &&
                        cacheResult.success.invReservation?.updatedAt.totalSeconds > result.success?.updatedAt.totalSeconds
                    ) {
                        // キャッシュよりDBが古い場合、キャッシュを設定する
                        return
                    }
                }
                dispatch(setLoading(false))
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                setState((prev) => ({
                    ...prev,
                    ...result.success,
                    projectName: result.success?.construction?.project?.name,
                    projectId: result.success?.construction?.project?.projectId,
                    imageUrl: result.success?.construction?.project?.imageUrl,
                    imageColorHue: result.success?.construction?.project?.imageColorHue,
                    constructionId: result.success?.construction?.constructionId,
                    contractId: result.success?.construction?.contractId,
                    remarks: result.success?.construction?.remarks,
                    requiredWorkerNum: result.success?.construction?.requiredWorkerNum,
                    siteMeetingTime: result.success?.construction?.siteMeetingTime,
                    siteStartTime: result.success?.construction?.siteStartTime,
                    siteStartTimeIsNextDay: result.success?.construction?.siteStartTimeIsNextDay,
                    siteEndTime: result.success?.construction?.siteEndTime,
                    siteEndTimeIsNextDay: result.success?.construction?.siteEndTimeIsNextDay,
                    siteRequiredNum: result.success?.construction?.siteRequiredNum,
                    siteAddress: result.success?.construction?.siteAddress,
                    siteBelongings: result.success?.construction?.siteBelongings,
                    siteRemarks: result.success?.construction?.siteRemarks,
                }))
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: `${_error.error} / code: ${_error.errorCode}`,
                        type: 'error',
                    } as ToastMessage),
                )
            }
        })()
    }, [invReservationId])

    useEffect(() => {
        if (route.params?.routeNameFrom == 'ConstructionList') {
            navigation.setOptions({
                title: t('admin:CreateProjectAndConstruction'),
            })
        } else {
            navigation.setOptions({
                title: mode == 'new' ? t('admin:CreateAScheduleToSendInSupport') : t('admin:EditScheduleToSendInSupport'),
            })
        }
    }, [navigation, route])

    useEffect(() => {
        if (mode === 'edit') {
            setState((prev) => ({ ...prev, invReservationId: route.params?.invReservationId }))
        } else {
            setState((prev) => ({ ...prev, startDate: initStartDate, endDate: initStartDate, imageColorHue: getRandomImageColorHue() }))
        }
        return () => {
            setState({ ...initialState })
        }
    }, [])

    useEffect(() => {
        if (startDate == undefined || endDate == undefined || targetCompany == undefined || (targetCompany.isFake && projectName == undefined)) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [startDate, endDate, targetCompany, projectName])

    useEffect(() => {
        if (invReservationId && myWorkerId && appState == 'active' && isFocused) {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: myWorkerId ?? 'no-id',
                        targetId: invReservationId ?? 'no-id',
                        modelType: 'site',
                    })
                    if (lockResult.error) {
                        dispatch(setLoading(false))
                        throw {
                            error: lockResult.error,
                        }
                    }
                } catch (error) {
                    const _error = error as CustomResponse
                    dispatch(setLoading(false))
                    dispatch(
                        setToastMessage({
                            text: `${_error.error} / code: ${_error.errorCode}`,
                            type: 'error',
                        } as ToastMessage),
                    )
                }
            })()
            const keepLock = setInterval(
                (function _update() {
                    updateLockOfTarget({
                        myWorkerId: myWorkerId ?? 'no-id',
                        targetId: invReservationId ?? 'no-id',
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
                    targetId: invReservationId ?? 'no-id',
                    modelType: 'site',
                    unlock: true,
                })
            }
        }
    }, [invReservationId, myWorkerId, appState, isFocused])

    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    const _updateReceiveListCache = async (project: ProjectStateType, construction: ConstructionStateType, invReservationId?: string, isNew?: boolean) => {
        if (startDate == undefined || endDate == undefined) return
        const dateList: number[] = []
        if (startDate && endDate) {
            let date = cloneDeep(startDate)
            for (const dateIndex in range(0, compareWithAnotherDate(getDailyStartTime(startDate), nextDay(getDailyEndTime(endDate), 1)).days)) {
                dateList.push(date.totalSeconds)
                date = nextDay(date, 1)
            }
        }
        const rangeDatesString = dateList.map((date) => dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(date)))
        const uniqExtraDates = uniq(extraDates?.filter((date) => !rangeDatesString.includes(dayBaseTextWithoutDate(date))))
        const uniqExtraDatesString = uniqExtraDates.map((date) => dayBaseTextWithoutDate(date))
        const totalDatesStrings = [...rangeDatesString, ...uniqExtraDatesString]
        let newProject: ProjectType = {}
        let newConstruction: ConstructionModel = {}
        let newSite: SiteType = {}
        let _projectId: string | undefined
        let _contractId: string | undefined
        let _constructionId: string | undefined
        if (targetCompany?.isFake) {
            /**
             * 仮会社へ常用申請を作成した場合に、常用案件作成。工事を一つ作成。
             */
            const totalDates = totalDatesStrings.map((str) => toCustomDateFromString(str).totalSeconds)
            const _startDate = min(totalDates)
            const _endDate = max(totalDates)
            _projectId = project?.projectId ?? getUuidv4()
            let _imageUrl = project?.imageUrl
            newProject = {
                projectId: _projectId,
                updateWorkerId: myWorkerId,
                name: project.projectName,
                startDate: startDate.totalSeconds,
                endDate: endDate.totalSeconds,
                imageUrl: _imageUrl,
                imageColorHue: project.imageColorHue,
                siteAddress: construction.siteAddress,
            }
            _contractId = construction?.contractId ?? getUuidv4()
            _constructionId = construction?.constructionId ?? getUuidv4()
            newConstruction = {
                projectId: _projectId,
                constructionId: _constructionId,
                contractId: _contractId,
                updateWorkerId: myWorkerId,
                name: `${targetCompany?.name}施工工事`,
                fakeCompanyInvReservationId: invReservationId,
                offDaysOfWeek: construction?.offDaysOfWeek,
                otherOffDays: construction?.otherOffDays?.map((date) => date.totalSeconds),
                remarks: construction?.remarks,
                requiredWorkerNum: construction?.requiredWorkerNum,
                siteMeetingTime: construction?.siteMeetingTime?.totalSeconds,
                siteStartTime: construction?.siteStartTime?.totalSeconds,
                siteStartTimeIsNextDay: construction?.siteStartTimeIsNextDay,
                siteEndTime: construction?.siteEndTime?.totalSeconds,
                siteEndTimeIsNextDay: construction?.siteEndTimeIsNextDay,
                siteRequiredNum: construction?.siteRequiredNum,
                siteAddress: construction?.siteAddress,
                siteBelongings: construction?.siteBelongings,
                siteRemarks: construction?.siteRemarks,
            }
            newSite = {
                siteId: 'dummy-id',
                constructionId: _constructionId,
                startDate:
                    combineTimeAndDay(
                        newConstruction?.siteStartTime ? toCustomDateFromTotalSeconds(newConstruction?.siteStartTime) : { ...startDate, ...DEFAULT_SITE_START_TIME_OBJ },
                        nextDay(startDate, newConstruction?.siteStartTimeIsNextDay ? 1 : 0),
                    )?.totalSeconds ?? DEFAULT_SITE_START_TIME.totalSeconds,
                endDate:
                    combineTimeAndDay(
                        newConstruction?.siteEndTime ? toCustomDateFromTotalSeconds(newConstruction?.siteEndTime) : { ...startDate, ...DEFAULT_SITE_END_TIME_OBJ },
                        nextDay(startDate, newConstruction?.siteEndTimeIsNextDay ? 1 : 0),
                    )?.totalSeconds ?? DEFAULT_SITE_END_TIME.totalSeconds,
                meetingDate: construction?.siteMeetingTime?.totalSeconds,
                siteDate: getDailyStartTime(startDate).totalSeconds,
                fakeCompanyInvRequestId: 'dummy-id',
                requiredNum: construction?.siteRequiredNum,
                address: construction.siteAddress,
                belongings: construction?.siteBelongings,
                remarks: construction?.siteRemarks,
            }
        }

        // 月を跨ぐ場合、月毎に生成する
        let month = getMonthlyFirstDay(startDate)
        let cacheKeys = []
        let monthlyDateList: number[] = []
        while (month.totalSeconds <= getMonthlyFirstDay(endDate).totalSeconds) {
            const cachedKey = genKeyName({
                screenName: 'ReceiveList',
                accountId: accountId,
                companyId: myCompanyId as string,
                month: month ? monthBaseText(month).replace(/\//g, '-') : '',
            })
            cacheKeys.push(cachedKey)
            monthlyDateList.push(...dateList.filter((date) => date >= month.totalSeconds && date < nextMonth(month).totalSeconds))
            month = nextMonth(month)
        }

        const promises = cacheKeys.map(async (cachedKey): Promise<CustomResponse<undefined>> => {
            try {
                const receiveListCacheData = await getCachedData<CachedReceiveListType>(cachedKey)
                const monthlyInvRequest = monthlyDateList.map((date) => {
                    return {
                        invReservationId: invReservationId,
                        isApplication: targetCompany?.isFake ? true : false,
                        invRequestId: 'dummy-id',
                        isApproval: targetCompany?.isFake ? true : false,
                        site: date == startDate.totalSeconds ? newSite : undefined,
                        myCompanyId: myCompanyId,
                        targetCompanyId: targetCompany?.companyId,
                        date: date,
                    } as InvRequestType
                })
                const newInvReservation: InvReservationType = {
                    targetCompanyId: targetCompany?.companyId,
                    invRequestIds: monthlyInvRequest.map((inv) => inv.invRequestId ?? 'no-id'),
                    invReservationId: invReservationId,
                    startDate: startDate.totalSeconds,
                    extraDates: [],
                    targetCompany: targetCompany as CompanyType,
                    project: newProject,
                    endDate: endDate.totalSeconds,
                    myCompanyId: myCompanyId,
                    monthlyInvRequests: {
                        items: monthlyInvRequest,
                    },
                    myCompany: {
                        companyId: myCompanyId,
                    },
                }
                if (receiveListCacheData.success?.invRequestInfo) {
                    if (receiveListCacheData.success.invRequestInfo.invReservations) {
                        if (isNew) {
                            // 新規作成の場合
                            receiveListCacheData.success.invRequestInfo.invReservations.push(newInvReservation)
                        } else {
                            // 更新の場合
                            const newInvReservations = receiveListCacheData?.success?.invRequestInfo.invReservations?.map((invReservation) => {
                                if (invReservation.invReservationId == invReservationId) {
                                    invReservation = newInvReservation
                                }
                                return invReservation
                            })
                            receiveListCacheData.success.invRequestInfo.invReservations = newInvReservations
                        }
                    } else {
                        receiveListCacheData.success.invRequestInfo.invReservations = [newInvReservation]
                    }
                    receiveListCacheData.success.invRequestInfo.updatedAt = Number(new Date())
                    await updateCachedData({ key: cachedKey, value: receiveListCacheData.success })
                } else {
                    await updateCachedData({
                        key: cachedKey,
                        value: {
                            projectInfo: receiveListCacheData.success?.projectInfo,
                            invRequestInfo: {
                                invReservations: [newInvReservation],
                                updatedAt: Number(new Date()),
                            },
                            requestInfo: receiveListCacheData.success?.requestInfo,
                        },
                    })
                }
                return Promise.resolve({
                    success: undefined,
                })
            } catch (error) {
                return getErrorMessage(error)
            }
        })

        const results = await Promise.all(promises)
        results.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        })
    }

    const _updateInvReservationInvRequestListCache = async (project: ProjectStateType, construction: ConstructionStateType, invReservationId: string, isNew?: boolean) => {
        if (startDate == undefined || endDate == undefined) return
        const dateList: number[] = []
        if (startDate && endDate) {
            let date = cloneDeep(startDate)
            for (const dateIndex in range(0, compareWithAnotherDate(getDailyStartTime(startDate), nextDay(getDailyEndTime(endDate), 1)).days)) {
                dateList.push(date.totalSeconds)
                date = nextDay(date, 1)
            }
        }
        const rangeDatesString = dateList.map((date) => dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(date)))
        const uniqExtraDates = uniq(extraDates?.filter((date) => !rangeDatesString.includes(dayBaseTextWithoutDate(date))))
        const uniqExtraDatesString = uniqExtraDates.map((date) => dayBaseTextWithoutDate(date))
        const totalDatesStrings = [...rangeDatesString, ...uniqExtraDatesString]
        let newProject: ProjectType = {}
        let newConstruction: ConstructionModel = {}
        let newSite: SiteType = {}
        let _projectId: string | undefined
        let _contractId: string | undefined
        let _constructionId: string | undefined
        if (targetCompany?.isFake) {
            /**
             * 仮会社へ常用申請を作成した場合に、常用案件作成。工事を一つ作成。
             */
            const totalDates = totalDatesStrings.map((str) => toCustomDateFromString(str).totalSeconds)
            const _startDate = min(totalDates)
            const _endDate = max(totalDates)
            _projectId = project?.projectId ?? getUuidv4()
            let _imageUrl = project?.imageUrl
            newProject = {
                projectId: _projectId,
                updateWorkerId: myWorkerId,
                name: project.projectName,
                startDate: startDate.totalSeconds,
                endDate: endDate.totalSeconds,
                imageUrl: _imageUrl,
                imageColorHue: project.imageColorHue,
                siteAddress: construction.siteAddress,
            }
            _contractId = construction?.contractId ?? getUuidv4()
            _constructionId = construction?.constructionId ?? getUuidv4()
            newConstruction = {
                projectId: _projectId,
                constructionId: _constructionId,
                contractId: _contractId,
                updateWorkerId: myWorkerId,
                name: `${targetCompany?.name}施工工事`,
                fakeCompanyInvReservationId: invReservationId,
                offDaysOfWeek: construction?.offDaysOfWeek,
                otherOffDays: construction?.otherOffDays?.map((date) => date.totalSeconds),
                remarks: construction?.remarks,
                requiredWorkerNum: construction?.requiredWorkerNum,
                siteMeetingTime: construction?.siteMeetingTime?.totalSeconds,
                siteStartTime: construction?.siteStartTime?.totalSeconds,
                siteStartTimeIsNextDay: construction?.siteStartTimeIsNextDay,
                siteEndTime: construction?.siteEndTime?.totalSeconds,
                siteEndTimeIsNextDay: construction?.siteEndTimeIsNextDay,
                siteRequiredNum: construction?.siteRequiredNum,
                siteAddress: construction?.siteAddress,
                siteBelongings: construction?.siteBelongings,
                siteRemarks: construction?.siteRemarks,
            }
            newSite = {
                siteId: 'dummy-id',
                constructionId: _constructionId,
                startDate:
                    combineTimeAndDay(
                        newConstruction?.siteStartTime ? toCustomDateFromTotalSeconds(newConstruction?.siteStartTime) : { ...startDate, ...DEFAULT_SITE_START_TIME_OBJ },
                        nextDay(startDate, newConstruction?.siteStartTimeIsNextDay ? 1 : 0),
                    )?.totalSeconds ?? DEFAULT_SITE_START_TIME.totalSeconds,
                endDate:
                    combineTimeAndDay(
                        newConstruction?.siteEndTime ? toCustomDateFromTotalSeconds(newConstruction?.siteEndTime) : { ...startDate, ...DEFAULT_SITE_END_TIME_OBJ },
                        nextDay(startDate, newConstruction?.siteEndTimeIsNextDay ? 1 : 0),
                    )?.totalSeconds ?? DEFAULT_SITE_END_TIME.totalSeconds,
                meetingDate: construction?.siteMeetingTime?.totalSeconds,
                siteDate: getDailyStartTime(startDate).totalSeconds,
                fakeCompanyInvRequestId: 'dummy-id',
                requiredNum: construction?.siteRequiredNum,
                address: construction.siteAddress,
                belongings: construction?.siteBelongings,
                remarks: construction?.siteRemarks,
            }
        }

        // 月を跨ぐ場合、月毎に生成する
        let month = getMonthlyFirstDay(startDate)
        let cacheKeys = []
        let monthlyDateList: number[] = []
        while (month.totalSeconds <= getMonthlyFirstDay(endDate).totalSeconds) {
            const cachedKey = genKeyName({
                screenName: 'InvReservationInvRequestList',
                accountId: accountId,
                companyId: myCompanyId as string,
                invReservationId: invReservationId,
                month: month ? monthBaseText(month).replace(/\//g, '-') : '',
            })
            cacheKeys.push(cachedKey)
            monthlyDateList.push(...dateList.filter((date) => date >= month.totalSeconds && date < nextMonth(month).totalSeconds))
            month = nextMonth(month)
        }

        const promises = cacheKeys.map(async (cachedKey): Promise<CustomResponse<undefined>> => {
            try {
                const monthlyInvRequest = monthlyDateList.map((date) => {
                    return {
                        invReservationId: invReservationId,
                        isApplication: targetCompany?.isFake ? true : false,
                        invRequestId: 'dummy-id',
                        isApproval: targetCompany?.isFake ? true : false,
                        site: date == startDate.totalSeconds ? newSite : undefined,
                        myCompanyId: myCompanyId,
                        targetCompanyId: targetCompany?.companyId,
                        date: date,
                    } as InvRequestType
                })
                const newInvReservation: InvReservationType = {
                    targetCompanyId: targetCompany?.companyId,
                    invRequestIds: monthlyInvRequest.map((inv) => inv.invRequestId ?? 'no-id'),
                    invReservationId: invReservationId,
                    startDate: startDate.totalSeconds,
                    extraDates: [],
                    targetCompany: targetCompany as CompanyType,
                    project: newProject,
                    endDate: endDate.totalSeconds,
                    myCompanyId: myCompanyId,
                    monthlyInvRequests: {
                        items: monthlyInvRequest,
                    },
                    myCompany: {
                        companyId: myCompanyId,
                    },
                }
                await updateCachedData({
                    key: cachedKey,
                    value: {
                        invReservation: toInvReservationCLType(newInvReservation),
                        invRequests: monthlyInvRequest?.map((inv) => toInvRequestCLType(inv)),
                        updatedAt: Number(new Date()),
                    },
                })
                return Promise.resolve({
                    success: undefined,
                })
            } catch (error) {
                return getErrorMessage(error)
            }
        })

        const results = await Promise.all(promises)
        results.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        })
    }

    const _updateInvReservationDetailCache = async (project: ProjectCLType, projectName: string, construction: ConstructionCLType, invReservationId: string, isNew: boolean) => {
        if (startDate == undefined || endDate == undefined) return
        const dateList: number[] = []
        if (startDate && endDate) {
            let date = cloneDeep(startDate)
            for (const dateIndex in range(0, compareWithAnotherDate(getDailyStartTime(startDate), nextDay(getDailyEndTime(endDate), 1)).days)) {
                dateList.push(date.totalSeconds)
                date = nextDay(date, 1)
            }
        }
        const rangeDatesString = dateList.map((date) => dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(date)))
        const uniqExtraDates = uniq(extraDates?.filter((date) => !rangeDatesString.includes(dayBaseTextWithoutDate(date))))
        const uniqExtraDatesString = uniqExtraDates.map((date) => dayBaseTextWithoutDate(date))
        const totalDatesStrings = [...rangeDatesString, ...uniqExtraDatesString]
        const totalDates = totalDatesStrings.map((str) => toCustomDateFromString(str))
        let newProject: ProjectCLType = {}
        let newConstruction: ConstructionCLType = {}
        let newSite: SiteType = {}
        let _projectId: string | undefined
        let _contractId: string | undefined
        let _constructionId: string | undefined
        if (targetCompany?.isFake) {
            /**
             * 仮会社へ常用申請を作成した場合に、常用案件作成。工事を一つ作成。
             */
            const _startDate = min(totalDates)
            const _endDate = max(totalDates)
            _projectId = project?.projectId ?? getUuidv4()
            let _imageUrl = project?.imageUrl
            newProject = {
                projectId: _projectId,
                updateWorkerId: myWorkerId,
                name: projectName,
                startDate: startDate,
                endDate: endDate,
                imageUrl: _imageUrl,
                imageColorHue: project.imageColorHue,
                siteAddress: construction.siteAddress,
                fakeCompanyInvReservationId: invReservationId,
            }
            _contractId = construction?.contractId ?? getUuidv4()
            _constructionId = construction?.constructionId ?? getUuidv4()
            newConstruction = {
                projectId: _projectId,
                constructionId: _constructionId,
                contractId: _contractId,
                updateWorkerId: myWorkerId,
                name: `${targetCompany?.name}施工工事`,
                fakeCompanyInvReservationId: invReservationId,
                offDaysOfWeek: construction?.offDaysOfWeek,
                otherOffDays: construction?.otherOffDays?.map((date) => date),
                remarks: construction?.remarks,
                requiredWorkerNum: construction?.requiredWorkerNum,
                siteMeetingTime: construction?.siteMeetingTime,
                siteStartTime: construction?.siteStartTime,
                siteStartTimeIsNextDay: construction?.siteStartTimeIsNextDay,
                siteEndTime: construction?.siteEndTime,
                siteEndTimeIsNextDay: construction?.siteEndTimeIsNextDay,
                siteRequiredNum: construction?.siteRequiredNum,
                siteAddress: construction?.siteAddress,
                siteBelongings: construction?.siteBelongings,
                siteRemarks: construction?.siteRemarks,
                project: newProject,
                contract: {
                    contractId: _contractId,
                },
                constructionMeter: {},
            }
        }
        const invReservationDetailCacheKey = genKeyName({
            screenName: 'InvReservationDetail',
            accountId: accountId ?? '',
            invReservationId: invReservationId ?? '',
            companyId: myCompanyId ?? '',
            workerId: myWorkerId ?? '',
        })
        construction.project = project
        const newInvReservationDetail: InvReservationCLType = {
            invReservationId: invReservationId,
            targetCompanyId: targetCompany?.companyId,
            myCompanyId: myCompanyId,
            startDate: startDate,
            endDate: endDate,
            extraDates: extraDates,
            targetCompany: targetCompany,
            myCompany: {
                companyId: myCompanyId,
            },
            totalDates: totalDates,
            project: targetCompany?.isFake ? newProject : project,
            otherOffDays: otherOffDays,
            construction: targetCompany?.isFake ? newConstruction : construction,
            projectOwnerCompany: projectOwnerCompany,
            updatedAt: new Date().toCustomDate(),
        }
        await updateCachedData({
            key: invReservationDetailCacheKey,
            value: { invReservation: newInvReservationDetail },
        })
    }

    const _writeInvReservation = async (invReservationId?: string) => {
        try {
            dispatch(setLoading('unTouchable'))
            if (invReservationId != undefined) {
                const lockResult = await checkLockOfTarget({
                    myWorkerId: myWorkerId ?? 'no-id',
                    targetId: invReservationId ?? 'no-id',
                    modelType: 'site',
                })
                if (lockResult.error) {
                    dispatch(setLoading(false))
                    throw {
                        error: lockResult.error,
                    }
                }
            }
            const _project: ProjectStateType = {
                projectId,
                projectName,
                image,
                imageColorHue,
            }
            const _construction: ConstructionStateType = {
                constructionId,
                contractId,
                offDaysOfWeek,
                otherOffDays,
                remarks,
                requiredWorkerNum,
                siteMeetingTime,
                siteStartTime,
                siteStartTimeIsNextDay,
                siteEndTime,
                siteEndTimeIsNextDay,
                siteRequiredNum,
                siteAddress,
                siteBelongings,
                siteRemarks,
            }
            const _invReservationId = invReservationId ?? getUuidv4()
            const isNew = invReservationId ? false : true

            // 取引一覧キャッシュ更新
            await _updateReceiveListCache(_project, _construction, _invReservationId, isNew)
            // 常用で送る一覧キャッシュ更新
            await _updateInvReservationInvRequestListCache(_project, _construction, _invReservationId, isNew)
            // 常用で送る予定詳細のキャッシュ更新
            await _updateInvReservationDetailCache(_project, projectName ?? '', _construction, _invReservationId, isNew)

            const result = await writeInvReservation({
                isNew: isNew,
                invReservationId: _invReservationId,
                myCompanyId,
                startDate,
                endDate,
                extraDates,
                targetCompany,
                initialWorkerCount,
                myWorkerId,
                offDaysOfWeek,
                otherOffDays,
                projectOwnerCompany,
                project: _project,
                construction: _construction,
                holidays,
                accountId,
                activeDepartmentIds,
            })
            dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            let newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'InvRequestDetail',
                    ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'InvRequestDetail').map((screen) => screen.ids)), ...(invRequestIds ?? [])]?.filter(
                        (data) => data != undefined,
                    ) as string[],
                },
            ]
            if (invReservationId) {
                //編集時のみ
                newLocalUpdateScreens = [
                    ...newLocalUpdateScreens,
                    {
                        screenName: 'InvReservationDetail',
                        ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'InvReservationDetail').map((screen) => screen.ids)), invReservationId]?.filter(
                            (data) => data != undefined,
                        ) as string[],
                    },
                ]
            }
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            navigation.goBack()
            if (mode == 'new') {
                if (route.params?.routeNameFrom == 'AdminHome') {
                    navigation.push('AdminHome', {})
                } else {
                    navigation.push('InvReservationDetailRouter', {
                        invReservationId: result.success?.invReservationId,
                        target: 'InvReservationDetail',
                        type: 'order',
                    })
                }
            }
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: `${_error.error} / code: ${_error.errorCode}`,
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    useEffect(() => {
        if (startDate != undefined && endDate != undefined) {
            const _dateRange = getDateRange(startDate, endDate).filter(
                (date) => date.dayOfWeekText && !offDaysOfWeek?.includes(date.dayOfWeekText) && !(offDaysOfWeek?.includes('祝') && isHoliday(date, holidays)),
            )
            const days = calculateConstructionDays(startDate, endDate, offDaysOfWeek, otherOffDays, holidays) + (extraDates?.length ?? 0)
            setState((prev) => ({ ...prev, constructionDays: days, dateRange: _dateRange }))
        }
    }, [startDate, endDate, offDaysOfWeek, otherOffDays, extraDates?.length])

    useEffect(() => {
        if (startDate != undefined && endDate != undefined) {
            const _dateRange = getDateRange(startDate, endDate).filter(
                (date) => date.dayOfWeekText && !offDaysOfWeek?.includes(date.dayOfWeekText) && !(offDaysOfWeek?.includes('祝') && isHoliday(date, holidays)),
            )
            setState((prev) => ({ ...prev, dateRange: _dateRange, isFirstFetch: false }))
        }
        if (isFirstFetch == false) {
            if (startDate && endDate) {
                //otherOffDaysがstartDateとendDateの範囲外の場合、otherOffDaysを範囲内のものに限定する
                const _otherOffDays = otherOffDays?.filter((date) => {
                    return date?.totalSeconds >= startDate?.totalSeconds && date?.totalSeconds <= endDate?.totalSeconds
                })
                //extraDatesがstartDateとendDateの範囲内の場合、extraDatesを範囲外のものに限定する
                const _extraDates = extraDates?.filter((date) => {
                    return date?.totalSeconds < startDate?.totalSeconds || date?.totalSeconds > endDate?.totalSeconds
                })
                setState((prev) => ({ ...prev, extraDates: _extraDates, otherOffDays: _otherOffDays }))
            } else {
                setState((prev) => ({ ...prev, extraDates: [], otherOffDays: [] }))
            }
        }
    }, [startDate, endDate])

    useMemo(() => {
        setState((prev) => ({ ...prev, siteMeetingTime: siteMeetingTime ?? (mode == 'new' ? DEFAULT_SITE_MEETING_TIME : undefined) }))
    }, [])

    useEffect(() => {
        setState((prev) => ({ ...prev, siteStartTime: siteStartTime ?? (mode == 'new' ? DEFAULT_SITE_START_TIME : undefined), siteStartTimeIsNextDay: siteStartTimeIsNextDay }))
    }, [siteStartTime, siteStartTimeIsNextDay])

    useEffect(() => {
        setState((prev) => ({ ...prev, siteEndTime: siteEndTime ?? (mode == 'new' ? DEFAULT_SITE_END_TIME : undefined), siteEndTimeIsNextDay: siteEndTimeIsNextDay }))
    }, [siteEndTime, siteEndTimeIsNextDay])

    useEffect(() => {
        ;(async () => {
            try {
                if (!isScreenOnRef.current) return

                const __cachedKey = genKeyName({
                    screenName: 'SelectCompany',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                })

                const db = _getFirestore()
                unsubscribeCompanyRef.current = db
                    .collection('PartnerCompanyList')
                    .where('companyId', '==', myCompanyId)
                    .onSnapshot(async (data) => {
                        const _partnerCompanyList = data.docs.map((doc) => doc.data())[0] as PartnerCompanyListType | undefined
                        const displayCompanies = filterCompanies(_partnerCompanyList?.companies ?? [])
                        setState((prev) => ({ ...prev, companies: displayCompanies }))
                        dispatch(setLoading(false))

                        const cachedResult = await updateCachedData({ key: __cachedKey, value: _partnerCompanyList?.companies ?? [] })
                        if (cachedResult.error) {
                            const _error = cachedResult as CustomResponse
                            dispatch(
                                setToastMessage({
                                    text: getErrorToastMessage(_error),
                                    type: 'error',
                                }),
                            )
                        }
                    })
                const result = await getCachedData<CompanyCLType[]>(__cachedKey)
                if (result.success) {
                    const displayCompanies = filterCompanies(result.success ?? [])
                    setState((prev) => ({ ...prev, companies: displayCompanies }))
                    dispatch(setLoading(false))
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
    }, [myCompanyId, isFocused])

    // 画面を閉じたときに時にonSnapshotをunsubscribeする
    useEffect(() => {
        return () => {
            if (isScreenOnRef.current) {
                isScreenOnRef.current = false
                if (unsubscribeCompanyRef.current) {
                    unsubscribeCompanyRef.current()
                    unsubscribeCompanyRef.current = null
                }
            }
        }
    }, [isFocused])

    const filterCompanies = (_companies: CompanyCLType[]) => {
        return _companies.filter((company) => company?.companyId != myCompanyId) ?? []
    }

    return (
        <KeyboardAwareScrollView scrollIndicatorInsets={{ right: 1 }} style={{ backgroundColor: '#fff' }} keyboardShouldPersistTaps={'always'}>
            <View style={{ backgroundColor: THEME_COLORS.OTHERS.BACKGROUND }}>
                {targetCompany?.isFake && (
                    <>
                        {/* <Pressable
                            style={{
                                alignSelf: 'center',
                                marginVertical: 20,
                                alignItems: 'center',
                            }}
                            onPress={async () => {
                                const _image = await pickImage()
                                if (_image == undefined) {
                                    return
                                }
                                setState((prev) => ({ ...prev, image: _image }))
                            }}>
                            <ImageIcon
                                type={'project'}
                                size={100}
                                imageUri={image?.uri ?? imageUrl}
                                imageColorHue={imageColorHue}
                                style={{
                                    marginVertical: 10,
                                }}
                            />
                            <Text
                                style={{
                                    color: THEME_COLORS.OTHERS.LINK_BLUE,
                                    lineHeight: 14,
                                    fontFamily: FontStyle.medium,
                                    fontSize: 12,
                                }}>
                                {t('admin:ChangePhoto')}
                            </Text>
                        </Pressable> */}
                        <InputTextBox
                            style={{ marginTop: 30 - dMarginTop }}
                            validation={'none'}
                            required={true}
                            title={t('common:CaseName')}
                            placeholder={PLACEHOLDER.PROJECT_NAME}
                            value={projectName}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, projectName: value }))
                            }}
                        />
                        {/* <InputCompanyBox
                            selectedCompany={projectOwnerCompany}
                            style={{ marginTop: 30 - dMarginTop }}
                            required={false}
                            disable={mode == 'edit' ? true : false}
                            title={t('admin:PrimeContractorForTheProject')}
                            onValueChangeValid={(value: CompanyCLType | undefined) => {
                                setState((prev) => ({ ...prev, projectOwnerCompany: value }))
                            }}
                            withoutMyCompany
                            onClear={() => {
                                setState((prev) => ({ ...prev, projectOwnerCompany: undefined }))
                            }}
                        /> */}
                    </>
                )}
                {targetCompany && (
                    <InputCompanyBox
                        selectedCompany={targetCompany}
                        disableNavigation
                        hideDropdown
                        style={{ marginTop: 30 - dMarginTop }}
                        required={true}
                        disable={mode == 'edit' ? true : false}
                        title={t('admin:WhereToApplyForSupport')}
                        withoutMyCompany
                        onValueChangeValid={(value: CompanyCLType | undefined) => {
                            setState((prev) => ({ ...prev, targetCompany: value }))
                        }}
                        onClear={() => {
                            setState((prev) => ({
                                ...prev,
                                inputCompanyName: undefined,
                                targetCompany: undefined,
                            }))
                        }}
                    />
                )}
                {!targetCompany && (
                    <View onLayout={onLayout}>
                        <InputTextBox
                            style={{ marginTop: 30 - dMarginTop }}
                            validation="none"
                            required={true}
                            title={t('admin:WhereToApplyForSupport')}
                            placeholder={PLACEHOLDER.COMPANY_NAME}
                            disable={mode == 'edit' ? true : false}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, inputCompanyName: value }))
                            }}
                            onClear={() => {
                                setState((prev) => ({
                                    ...prev,
                                    inputCompanyName: undefined,
                                    targetCompany: undefined,
                                }))
                            }}
                        />
                    </View>
                )}
                {inputCompanyName && (
                    <View
                        style={{
                            position: 'absolute',
                            top: (size?.y ?? 0) + (size?.height ?? 0),
                            zIndex: 10,
                            width: '98%',
                            margin: 'auto',
                            alignSelf: 'center',
                        }}>
                        <SearchCompanyBox
                            displayCompanies={companies}
                            inputCompanyName={inputCompanyName}
                            style={{
                                maxHeight: 300,
                                paddingTop: 2,
                                paddingBottom: 5,
                            }}
                            onPressCompany={(value) => setState((prev) => ({ ...prev, targetCompany: value, inputCompanyName: undefined }))}
                        />
                    </View>
                )}
                {/* TODO: 人を送るのを一つにまとめて、カレンダーを使用して選択できるようにする。*/}
                <InputDateTimeBox
                    style={{ marginTop: 30 - dMarginTop }}
                    required={true}
                    title={t('admin:StartDateToSendInSupport')}
                    maxDateTime={endDate}
                    value={startDate}
                    initDateInput={startDate}
                    dateInputMode={'date'}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, startDate: value, endDate: endDate ?? value }))
                    }}
                />
                <InputDateTimeBox
                    style={{ marginTop: 30 - dMarginTop }}
                    required={true}
                    title={t('admin:EndDateToSendInSupport')}
                    minDateTime={startDate}
                    value={endDate}
                    initDateInput={endDate}
                    dateInputMode={'date'}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, endDate: value }))
                    }}
                    infoText={`＊${MAX_PROJECT_SPAN}${t('admin:PleaseSetWithinOneDay')}`}
                />
                <InputDateTimeListBox
                    style={{ marginTop: 30 - dMarginTop }}
                    required={false}
                    dateList={extraDates}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, extraDates: value }))
                    }}
                />
                <InputDropDownBox
                    style={{ marginTop: 30 - dMarginTop }}
                    title={t('common:RegularHolidays')}
                    value={offDaysOfWeek as string[]}
                    selectableItems={weekDayList as string[]}
                    selectNum={'any'}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, offDaysOfWeek: value }))
                    }}
                    disable={holidayCheck}
                    onClear={() => {
                        setState((prev) => ({ ...prev, offDaysOfWeek: undefined }))
                    }}
                />
                <Checkbox
                    size={20}
                    fontSize={12}
                    color={BlueColor.deepColor}
                    textColor={BlueColor.deepTextColor}
                    text={t('common:ClosedOnSaturdaysSundaysAndHolidays')}
                    style={{
                        marginTop: 10,
                        marginLeft: 20,
                    }}
                    checked={holidayCheck}
                    onChange={(value) => {
                        if (value) {
                            const _offDaysOfWeek = uniq([...(offDaysOfWeek ?? []), '土', '日', '祝'])
                            setState((prev) => ({ ...prev, offDaysOfWeek: _offDaysOfWeek, holidayCheck: true }))
                        } else {
                            setState((prev) => ({ ...prev, offDaysOfWeek: offDaysOfWeek?.filter((day) => day != '土' && day != '日' && day != '祝'), holidayCheck: false }))
                        }
                    }}
                />
                <InputDateDropdownBox
                    style={{ marginTop: 30 - dMarginTop }}
                    title={t('common:OtherHolidays')}
                    value={otherOffDays}
                    selectableItems={dateRange}
                    selectNum={'any'}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, otherOffDays: value }))
                    }}
                    onClear={() => {
                        setState((prev) => ({ ...prev, otherOffDays: undefined }))
                    }}
                />
                {targetCompany?.isFake && (
                    <>
                        <InputTextBox
                            style={{ marginTop: 30 - dMarginTop }}
                            validation={'none'}
                            required={false}
                            title={t('common:ConstructionRemarks')}
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
                        <InputNumberBox
                            style={{ marginTop: 30 - dMarginTop }}
                            required={false}
                            title={t('admin:PlannedNoOfWorkers')}
                            value={requiredWorkerNum}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, requiredWorkerNum: value }))
                            }}
                            onClear={() => {
                                setState((prev) => ({ ...prev, requiredWorkerNum: undefined }))
                            }}
                        />

                        <InputTextBox
                            style={{ marginTop: 30 - dMarginTop }}
                            required={false}
                            title={t('common:ProjectAddress')}
                            placeholder={PLACEHOLDER.ADDRESS}
                            value={siteAddress}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, siteAddress: value }))
                            }}
                            infoText={t('common:AllAddressesOfTheCaseWillBeChanged')}
                            onClear={() => {
                                setState((prev) => ({ ...prev, siteAddress: undefined }))
                            }}
                        />
                        <InputNumberBox style={{ marginTop: 30 - dMarginTop }} disable={true} required title={t('common:ConstructionDays')} value={constructionDays} />

                        <Line
                            style={{
                                marginTop: 30 - dMarginTop,
                            }}
                        />
                        <Text
                            style={{
                                ...GlobalStyles.mediumText,
                                marginTop: 30 - dMarginTop,
                                paddingHorizontal: 10,
                                paddingVertical: 7,
                                backgroundColor: THEME_COLORS.BLUE.MIDDLE,
                                color: '#fff',
                            }}>
                            {t('admin:OnsiteDefaultSetting')}
                        </Text>
                        <Text
                            style={{
                                ...GlobalStyles.smallGrayText,
                                marginTop: 5,
                                marginLeft: 10,
                            }}>
                            {t('admin:SettingCreatedWhenSiteCreated')}
                        </Text>
                        <InputDateTimeBox
                            style={{ marginTop: 30 - dMarginTop }}
                            required={false}
                            title={t('common:TimeOfMeeting')}
                            displayNextDayButton={false}
                            initDateInput={siteMeetingTime}
                            value={siteMeetingTime}
                            dateInputMode="time"
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, siteMeetingTime: value }))
                            }}
                            defaultDateInput={DEFAULT_SITE_MEETING_TIME}
                            onClear={() => {
                                setState((prev) => ({ ...prev, siteMeetingTime: DEFAULT_SITE_MEETING_TIME }))
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
                            checked={siteMeetingTime == undefined ? true : false}
                            onChange={(value) => {
                                if (siteMeetingTime != undefined) {
                                    setState((prev) => ({ ...prev, siteMeetingTime: undefined }))
                                } else {
                                    setState((prev) => ({ ...prev, siteMeetingTime: DEFAULT_SITE_MEETING_TIME }))
                                }
                            }}
                        />
                        <InputDateTimeBox
                            style={{ marginTop: 30 - dMarginTop }}
                            required={false}
                            title={t('common:AssignmentStartTime')}
                            displayNextDayButton={true}
                            value={siteStartTime}
                            initDateInput={siteStartTime}
                            minDateTime={siteMeetingTime}
                            maxDateTimeIsNextDay={siteEndTimeIsNextDay}
                            maxDateTime={siteEndTime}
                            isNextDay={siteStartTimeIsNextDay}
                            dateInputMode="time"
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, siteStartTime: value }))
                            }}
                            onNextDayChanged={(value) => {
                                setState((prev) => ({ ...prev, siteStartTimeIsNextDay: value }))
                            }}
                            defaultDateInput={DEFAULT_SITE_START_TIME}
                            onClear={() => {
                                setState((prev) => ({ ...prev, siteStartTime: DEFAULT_SITE_START_TIME, siteStartTimeIsNextDay: false }))
                            }}
                        />
                        <InputDateTimeBox
                            style={{ marginTop: 30 - dMarginTop }}
                            required={false}
                            title={t('common:AssignmentEndTime')}
                            value={siteEndTime}
                            displayNextDayButton={true}
                            initDateInput={siteEndTime}
                            isNextDay={siteEndTimeIsNextDay}
                            minDateTime={siteStartTime}
                            minDateTimeIsNextDay={siteStartTimeIsNextDay}
                            dateInputMode="time"
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, siteEndTime: value }))
                            }}
                            onNextDayChanged={(value) => {
                                setState((prev) => ({ ...prev, siteEndTimeIsNextDay: value }))
                            }}
                            defaultDateInput={DEFAULT_SITE_END_TIME}
                            onClear={() => {
                                setState((prev) => ({ ...prev, siteEndTime: DEFAULT_SITE_END_TIME, siteEndTimeIsNextDay: false }))
                            }}
                        />
                        <InputNumberBox
                            style={{ marginTop: 30 - dMarginTop }}
                            required={false}
                            title={t('common:AverageEmployeesPerDay')}
                            value={siteRequiredNum}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, siteRequiredNum: value, initialWorkerCount: value }))
                            }}
                            onClear={() => {
                                setState((prev) => ({ ...prev, siteRequiredNum: undefined, initialWorkerCount: undefined }))
                            }}
                        />
                        <InputTextBox
                            style={{ marginTop: 30 - dMarginTop }}
                            required={false}
                            title={t('common:PersonalEffects')}
                            placeholder={PLACEHOLDER.BELONGING}
                            value={siteBelongings}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, siteBelongings: value }))
                            }}
                            onClear={() => {
                                setState((prev) => ({ ...prev, siteBelongings: undefined }))
                            }}
                        />
                        <InputTextBox
                            style={{ marginTop: 30 - dMarginTop }}
                            required={false}
                            title={t('common:SiteRemarks')}
                            placeholder={PLACEHOLDER.REMARKS}
                            value={siteRemarks}
                            multiline={true}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, siteRemarks: value }))
                            }}
                            onClear={() => {
                                setState((prev) => ({ ...prev, siteRemarks: undefined }))
                            }}
                        />
                    </>
                )}
                {
                    //仮会社へ送る場合は、１日の平均作業員数と同義(siteRequiredNum)
                    targetCompany?.isFake != true && (
                        <InputNumberBox
                            style={{ marginTop: 30 - dMarginTop }}
                            required={false}
                            title={t('admin:ExpectedNumberOfPeople')}
                            value={initialWorkerCount}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, initialWorkerCount: value }))
                            }}
                            onClear={() => {
                                setState((prev) => ({ ...prev, initialWorkerCount: undefined }))
                            }}
                        />
                    )
                }
            </View>
            <AppButton
                disabled={disable}
                style={{ marginTop: 30, marginLeft: 10, marginRight: 10 }}
                title={mode == 'edit' ? t('common:Save') : t('common:Create')}
                onPress={() => _writeInvReservation(invReservationId)}
            />
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default EditInvReservation

const styles = StyleSheet.create({})
