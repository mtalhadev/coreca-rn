import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, ListRenderItem, ListRenderItemInfo, Text } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { useIsFocused } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { AppButton } from '../../../components/atoms/AppButton'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { StoreType } from '../../../stores/Store'
import { setToastMessage, ToastMessage, setLoading, setLocalUpdateScreens } from '../../../stores/UtilSlice'
import {
    combineTimeAndDay,
    CustomDate,
    getMonthlyFinalDay,
    getMonthlyFirstDay,
    getDailyStartTime,
    monthBaseText,
    newCustomDate,
    nextDay,
    nextMonth,
    toCustomDateFromTotalSeconds,
    dayBaseText,
    dayBaseTextWithoutDate,
} from '../../../models/_others/CustomDate'
import { DEFAULT_SITE_END_TIME, DEFAULT_SITE_MEETING_TIME, DEFAULT_SITE_START_TIME, THEME_COLORS } from '../../../utils/Constants'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { RootStackParamList } from '../../Router'
import { SwitchPage } from '../../../components/template/SwitchPage'
import { match } from 'ts-pattern'
import { ProjectType } from '../../../models/project/Project'
import { MonthlyProjectType } from '../../../models/project/MonthlyProjectType'
import { ConstructionCLType, ConstructionType } from '../../../models/construction/Construction'
import { genKeyName, getCachedData, updateCachedData } from '../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { _getFirestore } from '../../../services/firebase/FirestoreService'
import { Search } from '../../../components/organisms/Search'
import { ContractingProjectPrefix } from '../../../components/organisms/contract/ContractingProjectPrefix'
import { ShadowBox } from '../../../components/organisms/shadowBox/ShadowBox'
import { checkLockOfTarget } from '../../../usecases/lock/CommonLockCase'
import cloneDeep from 'lodash/cloneDeep'
import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'
import isEmpty from 'lodash/isEmpty'
import { writeConstructionSite } from '../../../usecases/site/MySiteCase'
import { toIdAndMonthFromStrings, UpdateScreenType } from '../../../models/updateScreens/UpdateScreens'
import { ConstructionSummary } from '../../../components/organisms/construction/ConstructionSummary'
import { getUuidv4 } from '../../../utils/Utils'
import { setSelectedProject } from '../../../stores/CreateProjectSlice'
import { SelectButton } from '../../../components/organisms/SelectButton'
import { FakeCompanyInvRequestType } from '../../../models/invRequest/InvRequestType'
import { createInvRequestToFakeCompany } from '../../../usecases/invRequest/invRequestCase'
import { GlobalStyles } from '../../../utils/Styles'
import { SiteType } from '../../../models/site/Site'
import { _getInvReservation } from '../../../services/invReservation/InvReservationService'
import { DateDataType } from '../../../models/date/DateDataType'
import { SiteArrangementModel } from '../../../models/arrangement/SiteArrangement'
import { checkMyDepartment } from '../../../usecases/department/DepartmentCase'
import { ContractType } from '../../../models/contract/Contract'
import { SiteDateType } from '../../../models/site/SiteDateType'
import { setNewConstructionIds, setNewConstructionIdsInSiteDate } from '../../../stores/CacheSlice'

type NavProps = StackNavigationProp<RootStackParamList, 'ConstructionList'>
type RouteProps = RouteProp<RootStackParamList, 'ConstructionList'>

type DisplayType = 'project' | 'support'

export type ConstructionUIType = {
    projectId?: string
    projectName?: string
    constructionId?: string
    receiveCompanyName?: string
    startDate?: number
    endDate?: number
    constructionName?: string
    isSiteOnTheDay?: boolean
    isSiteOnThePreviousDay?: boolean
    construction?: ConstructionType
}
type ExtendedDateDataType = {
    monthlyData: DateDataType[]
    projects: ProjectType[]
}
type ProjectNameType = {
    constructionId?: string
    projectName?: string
}
type ConstructionSiteType = {
    constructionId?: string
    sites?: SiteType[]
}
type InitialStateType = {
    selectedDate: CustomDate
    selectedMonth: CustomDate
    /**
     * その月の案件一覧
     */
    monthData?: ProjectType[]
    /**
     *
     * その月の工事一覧データ
     *   siteDate: 前日入場・当日現場の有無判定のための日別・会社別現場データ。当日と前日のデータ
     *   monthlySiteDate: キャッシュ（月別）用に、ひと月分のsiteDateを纏める（上記目的のため、前月の月末日も含める）
     **/
    constructions?: ConstructionType[]
    constructionsCached?: ConstructionType[]
    displayConstructionsData?: ConstructionUIType[]
    siteDate?: SiteDateType[]
    siteDateCached?: SiteDateType[]
    monthlySiteDate?: SiteDateType[]
    /**
     * 最終的に表示する工事の一覧
     */
    displayFilteredConstructionsData?: ConstructionUIType[]
    isFetching: boolean
    updateCache: number
    displayType?: DisplayType
    selectedConstructions: SelectedConstructionType[]
    invRequestToCreate: FakeCompanyInvRequestType[]
}

const initialState: InitialStateType = {
    selectedDate: newCustomDate(),
    selectedMonth: newCustomDate(),
    isFetching: false,
    updateCache: 0,
    selectedConstructions: [],
    invRequestToCreate: [],
}

export type SelectedConstructionType = {
    contractId: string
    constructionId: string
    projectId: string
    siteId: string
    construction: ConstructionType
}

export type ConstructionListCacheType = {
    constructions?: ConstructionType[]
    monthlySiteDate?: SiteDateType[]
    updatedAt?: number
}

/*
 * @summary 現場を追加する案件を複数選択
 * 案件名・工事名で検索可
 */

const ConstructionList = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const [
        {
            selectedDate,
            selectedMonth,
            monthData,
            displayConstructionsData,
            displayFilteredConstructionsData,
            isFetching,
            updateCache,
            displayType,
            selectedConstructions,
            invRequestToCreate,
            constructions,
            constructionsCached,
            siteDate,
            siteDateCached,
            monthlySiteDate,
        },
        setState,
    ] = useState(initialState)
    const route = useRoute<RouteProps>()
    const loading = useSelector((state: StoreType) => state.util.loading)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)

    const isCacheReady = useSelector((state: StoreType) => state?.cache.isCacheReady)
    const deletedConstructionIds = useSelector((state: StoreType) => state?.cache.deletedConstructionIds)
    const newConstructionIds = useSelector((state: StoreType) => state?.cache.newConstructionIds)
    const newConstructionIdsInSiteDate = useSelector((state: StoreType) => state?.cache.newConstructionIdsInSiteDate)

    const targetMonth = route.params?.targetMonth
    const targetDateFromParams = route.params?.targetDate
    const targetDate = useSelector((state: StoreType) => state?.calendar?.targetDate)
    const [textFilter, setTextFilter] = useState<string | undefined>(undefined)
    const cachedKey = useRef(
        genKeyName({
            screenName: 'ConstructionList',
            accountId: accountId,
            companyId: myCompanyId as string,
            /** "/" はKVSのキーに使えない文字のため "-" に変換 */
            month: selectedMonth ? monthBaseText(selectedMonth).replace(/\//g, '-') : '',
        }),
    )
    const activeDepartments = useSelector((state: StoreType) => state?.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])
    const unsubscribeRef = useRef<any>(null)
    const unsubscribeSiteRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)

    useEffect(() => {
        setState((prev) => ({ ...prev, displayType: route.params?.displayType ?? 'project' }))
    }, [route.params?.displayType])

    useEffect(() => {
        navigation.setOptions({
            title: t('admin:SelectProjectToAddSites'),
            headerTitleContainerStyle: {
                right: 15,
            },
        })
        // }
    }, [navigation])

    useEffect(() => {
        if (targetMonth) {
            setState((prev) => ({ ...prev, selectedMonth: targetMonth }))
        }
    }, [])

    useEffect(() => {
        // From DateArrangements or DateAttendances
        if (targetDateFromParams) {
            setState((prev) => ({ ...prev, selectedDate: targetDateFromParams }))
        }

        // From AdminHome
        // カレンダー表示月の日付をタップした場合のみselectedDateを定義
        // (例)11月なら10月31日は除外
        if (
            targetDate &&
            Object.keys(targetDate).length > 0 &&
            targetMonth &&
            targetDate.totalSeconds >= getMonthlyFirstDay(targetMonth).totalSeconds &&
            targetDate.totalSeconds <= getMonthlyFinalDay(targetMonth).totalSeconds
        ) {
            setState((prev) => ({ ...prev, selectedDate: targetDate }))
        }
    }, [])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }

        isScreenOnRef.current = isFocused
    }, [isFocused])

    const [dateUpdate, setDateUpdate] = useState(0)

    useEffect(() => {
        if (__isAvailableFromNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    /**
     * 立ち上げと立ち退き時の挙動
     */
    useEffect(() => {
        if (__isAvailable) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
        return () => {
            setState(initialState)
            setDateUpdate(dateUpdate + 1)
        }
    }, [myCompanyId])

    useEffect(() => {
        cachedKey.current = genKeyName({
            screenName: 'ConstructionList',
            accountId: accountId,
            companyId: myCompanyId as string,
            /** "/" はKVSのキーに使えない文字のため "-" に変換 */
            month: selectedMonth ? monthBaseText(selectedMonth).replace(/\//g, '-') : '',
        })
    }, [accountId, myCompanyId, selectedMonth])

    useEffect(() => {
        setState((prev) => ({ ...prev, constructions: undefined, constructionsCached: undefined, siteDateCached: undefined, monthlySiteDate: undefined }))
    }, [myCompanyId, selectedMonth])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))
        }
    }, [isFocused, myCompanyId, selectedMonth])

    useSafeLoadingUnmount(dispatch, isFocused)

    useSafeUnmount(setState, initialState, () => setDateUpdate(dateUpdate + 1))

    /**
     * headerの更新からDB fetchして良いかどうか
     */
    const __isAvailableFromNavUpdating = useMemo(() => !isFetching && isNavUpdating && isFocused, [isFetching, isNavUpdating, isFocused])

    /**
     * DB fetchして良いかどうか
     */
    const __isAvailable = useMemo(() => selectedMonth != undefined && myCompanyId != undefined, [selectedMonth, myCompanyId])

    const __filterConstruction = (construction: ConstructionType): boolean => {
        return construction.constructionRelation != 'other-company' && construction.constructionRelation != 'intermediation'
    }

    const _writeSite = async (siteId?: string, constructionId?: string, projectId?: string, contractId?: string, construction?: ConstructionCLType) => {
        try {
            if (siteId == undefined || constructionId == undefined || construction?.constructionRelation == undefined) {
                throw {
                    error: t('common:NotEnoughInformation'),
                }
            }
            dispatch(setLoading('unTouchable'))
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

            // siteMeetingTime, siteStartTime, siteEndTimeがTotalSecondsの場合にCustomDateに変換
            const meetingTime = typeof construction.siteMeetingTime === 'number' ? toCustomDateFromTotalSeconds(construction.siteMeetingTime) : construction.siteMeetingTime
            const startTime =
                construction?.siteStartTime !== undefined
                    ? typeof construction.siteStartTime === 'number'
                        ? toCustomDateFromTotalSeconds(construction.siteStartTime)
                        : construction.siteStartTime
                    : DEFAULT_SITE_START_TIME
            const endTime =
                construction?.siteEndTime !== undefined
                    ? typeof construction.siteEndTime === 'number'
                        ? toCustomDateFromTotalSeconds(construction.siteEndTime)
                        : construction.siteEndTime
                    : DEFAULT_SITE_END_TIME

            const result = await writeConstructionSite({
                siteId,
                myCompanyId,
                constructionId,
                date: selectedDate,
                meetingTime,
                startTime,
                endTime,
                requiredNum: construction?.siteRequiredNum,
                remarks: construction?.siteRemarks,
                address: construction?.siteAddress,
                belongings: construction?.siteBelongings,
                siteStartTimeIsNextDay: construction?.siteStartTimeIsNextDay,
                siteEndTimeIsNextDay: construction?.siteEndTimeIsNextDay,
                constructionRelation: construction.constructionRelation,
                projectId,
            })
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
                const meetingDate = combineTimeAndDay(meetingTime ?? DEFAULT_SITE_MEETING_TIME, selectedDate)
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
                        idAndDates: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'ConstructionSiteList').map((screen) => screen.idAndDates)), constructionIdAndDate]?.filter(
                            (data) => data != undefined,
                        ) as string[],
                    },
                ]
                dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            }
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        } finally {
            if (isFocused) dispatch(setLoading(false))
        }
    }

    /**
     * 選択された常用案件に現場を追加する
     * @param invRequest FakeCompanyInvRequestType
     */
    const _writeInvRequest = async (invRequest: FakeCompanyInvRequestType) => {
        try {
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: invRequest.invReservationId ?? 'no-id',
                modelType: 'invReservation',
            })
            if (lockResult.error) {
                throw {
                    error: lockResult.error,
                    errorCode: lockResult.errorCode,
                }
            }

            const InvRequestsResult = await Promise.all(
                invRequestToCreate?.map((inv) =>
                    createInvRequestToFakeCompany({
                        invRequestId: inv.invRequestId,
                        invReservationId: inv.invReservationId,
                        targetCompanyId: inv.targetCompanyId,
                        myCompanyId,
                        date: inv.date,
                        constructionId: invRequest.constructionId,
                        siteId: invRequest.siteId,
                    }),
                ),
            )
            InvRequestsResult.forEach((InvRequestResult) => {
                if (InvRequestResult?.error) {
                    throw {
                        error: InvRequestResult.error,
                        errorCode: InvRequestResult.errorCode,
                    }
                }
            })
            const newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'InvReservationDetail',
                    ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'InvReservationDetail').map((screen) => screen.ids)), invRequest.invReservationId]?.filter(
                        (data) => data != undefined,
                    ) as string[],
                },
            ]
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        } finally {
            if (isFocused) dispatch(setLoading(false))
        }
    }

    const _updateAdminHomeCache = async (displayType: DisplayType) => {
        const adminHomeCacheKey = genKeyName({
            screenName: 'AdminHome',
            accountId: accountId,
            companyId: myCompanyId as string,
            month: selectedMonth ? monthBaseText(selectedMonth).replace(/\//g, '-') : '',
        })
        const adminHomeCacheData = await getCachedData<ExtendedDateDataType>(adminHomeCacheKey)
        let cachedResult
        if (displayType == 'project' && selectedConstructions.length > 0) {
            const siteList = selectedConstructions.map((selectedConstruction) => {
                const { siteId, constructionId, projectId, contractId, construction } = selectedConstruction
                const meetingTime = typeof construction.siteMeetingTime === 'number' ? toCustomDateFromTotalSeconds(construction.siteMeetingTime) : construction.siteMeetingTime

                const startTime =
                    construction?.siteStartTime !== undefined
                        ? typeof construction.siteStartTime === 'number'
                            ? toCustomDateFromTotalSeconds(construction.siteStartTime)
                            : construction.siteStartTime
                        : DEFAULT_SITE_START_TIME
                const endTime =
                    construction?.siteEndTime !== undefined
                        ? typeof construction.siteEndTime === 'number'
                            ? toCustomDateFromTotalSeconds(construction.siteEndTime)
                            : construction.siteEndTime
                        : DEFAULT_SITE_END_TIME
                const newSite = {
                    siteId,
                    myCompanyId,
                    constructionId,
                    date: selectedDate,
                    meetingDate: meetingTime?.totalSeconds,
                    startDate: startTime.totalSeconds,
                    endDate: endTime.totalSeconds,
                    requiredNum: construction?.siteRequiredNum,
                    remarks: construction?.siteRemarks,
                    address: construction?.siteAddress,
                    belongings: construction?.siteBelongings,
                    siteStartTimeIsNextDay: construction?.siteStartTimeIsNextDay,
                    siteEndTimeIsNextDay: construction?.siteEndTimeIsNextDay,
                    constructionRelation: construction.constructionRelation,
                    projectId,
                    siteNameData: {
                        name: construction.displayName,
                    },
                    siteRelation: construction.constructionRelation,
                    siteMeter: {
                        companyPresentNum: 0,
                    },
                    construction: construction,
                } as SiteType
                return newSite
            })
            const targetDateData = adminHomeCacheData.success?.monthlyData.find((dateData) => dateData.date == selectedDate?.totalSeconds)
            if (targetDateData) {
                const newAdminHomeData = adminHomeCacheData.success?.monthlyData.map((dateData) => {
                    if (dateData.date == selectedDate?.totalSeconds && dateData.sites?.totalSites?.items) {
                        dateData.sites.totalSites.items = uniqBy([...dateData?.sites?.totalSites?.items, ...(siteList ?? [])], 'siteId')
                        dateData.updatedAt = Number(new Date())
                    }
                    if (dateData.date == selectedDate?.totalSeconds && dateData?.arrangementSummary?.sitesCount && dateData?.sites?.totalSites?.items) {
                        dateData.arrangementSummary.sitesCount = dateData.sites.totalSites.items.length
                    }
                    if (dateData.date == selectedDate?.totalSeconds && dateData?.attendanceSummary?.sitesCount && dateData?.sites?.totalSites?.items) {
                        dateData.attendanceSummary.sitesCount = dateData.sites.totalSites.items.length
                    }
                    return dateData
                })
                cachedResult = await updateCachedData({ key: adminHomeCacheKey, value: { monthlyData: newAdminHomeData ?? [] } })
            } else {
                const newDateData: DateDataType = {
                    date: selectedDate?.totalSeconds,
                    sites: {
                        totalSites: { items: siteList ?? [] },
                    },
                    updatedAt: Number(new Date()),
                    arrangementSummary: { sitesCount: siteList.length },
                    attendanceSummary: { sitesCount: siteList.length },
                }
                adminHomeCacheData.success?.monthlyData.push(newDateData)
                cachedResult = await updateCachedData({ key: adminHomeCacheKey, value: { monthlyData: adminHomeCacheData.success?.monthlyData ?? [] } })
            }
        }

        if (displayType == 'support' && invRequestToCreate.length > 0) {
            const promises = invRequestToCreate.map(async (invRequest) => {
                const invReservationResult = await _getInvReservation({
                    invReservationId: invRequest.invReservationId ?? 'no-id',
                    options: {
                        project: true,
                        construction: true,
                    },
                })
                const newSite = {
                    siteId: invRequest.siteId,
                    myCompanyId,
                    constructionId: invRequest.constructionId,
                    date: selectedDate,
                    meetingDate: invReservationResult?.success?.construction?.siteMeetingTime,
                    startDate: invReservationResult?.success?.construction?.siteStartTime ?? DEFAULT_SITE_START_TIME.totalSeconds,
                    endDate: invReservationResult?.success?.construction?.siteEndTime ?? DEFAULT_SITE_END_TIME.totalSeconds,
                    requiredNum: invReservationResult?.success?.construction?.siteRequiredNum,
                    remarks: invReservationResult?.success?.construction?.siteRemarks,
                    address: invReservationResult?.success?.construction?.siteAddress,
                    belongings: invReservationResult?.success?.construction?.siteBelongings,
                    siteStartTimeIsNextDay: invReservationResult?.success?.construction?.siteStartTimeIsNextDay,
                    siteEndTimeIsNextDay: invReservationResult?.success?.construction?.siteEndTimeIsNextDay,
                    constructionRelation: invReservationResult?.success?.construction?.constructionRelation,
                    projectId: invReservationResult.success?.project?.projectId,
                    siteNameData: {
                        name: invReservationResult?.success?.project?.name,
                    },
                    siteRelation: 'fake-company-manager',
                    siteMeter: {
                        companyPresentNum: 0,
                    },
                } as SiteType

                return newSite
            })
            const siteList = await Promise.all(promises)
            const targetDateData = adminHomeCacheData.success?.monthlyData.find((dateData) => dateData.date == selectedDate?.totalSeconds)
            if (targetDateData) {
                const newAdminHomeData = adminHomeCacheData.success?.monthlyData.map((dateData) => {
                    if (dateData.date == selectedDate?.totalSeconds && dateData.sites?.totalSites?.items) {
                        dateData.sites.totalSites.items = uniqBy([...dateData?.sites?.totalSites?.items, ...(siteList ?? [])], 'siteId')
                        dateData.updatedAt = Number(new Date())
                    }
                    if (dateData.date == selectedDate?.totalSeconds && dateData?.arrangementSummary?.sitesCount && dateData?.sites?.totalSites?.items) {
                        dateData.arrangementSummary.sitesCount = dateData.sites.totalSites.items.length
                    }
                    if (dateData.date == selectedDate?.totalSeconds && dateData?.attendanceSummary?.sitesCount && dateData?.sites?.totalSites?.items) {
                        dateData.attendanceSummary.sitesCount = dateData.sites.totalSites.items.length
                    }
                    return dateData
                })
                cachedResult = await updateCachedData({ key: adminHomeCacheKey, value: { monthlyData: newAdminHomeData ?? [] } })
            } else {
                const newDateData: DateDataType = {
                    date: selectedDate?.totalSeconds,
                    sites: {
                        totalSites: { items: siteList ?? [] },
                    },
                    updatedAt: Number(new Date()),
                    arrangementSummary: { sitesCount: siteList.length },
                    attendanceSummary: { sitesCount: siteList.length },
                }
                adminHomeCacheData.success?.monthlyData.push(newDateData)
                cachedResult = await updateCachedData({ key: adminHomeCacheKey, value: { monthlyData: adminHomeCacheData.success?.monthlyData ?? [] } })
            }
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

    const _updateSiteArrangementCache = async (selectedConstruction: SelectedConstructionType) => {
        const { siteId, constructionId, projectId, construction } = selectedConstruction
        if (siteId === undefined || constructionId === undefined || projectId === undefined || isEmpty(construction)) {
            throw {
                error: 'siteId, constructionId, projectId, 工事のいずれかが定義されていません。',
            }
        }

        const siteArrangementCachedKey = genKeyName({
            screenName: 'SiteArrangement',
            accountId: accountId,
            companyId: myCompanyId as string,
            siteId: siteId,
        })

        const meetingTime =
            construction?.siteMeetingTime !== undefined
                ? typeof construction.siteMeetingTime === 'number'
                    ? toCustomDateFromTotalSeconds(construction.siteMeetingTime)
                    : construction.siteMeetingTime
                : DEFAULT_SITE_MEETING_TIME
        const endTime =
            construction?.siteEndTime !== undefined
                ? typeof construction.siteEndTime === 'number'
                    ? toCustomDateFromTotalSeconds(construction.siteEndTime)
                    : construction.siteEndTime
                : DEFAULT_SITE_END_TIME
        const newSite: SiteType = {
            siteId,
            siteDate: selectedDate?.totalSeconds,
            siteRelation: construction.constructionRelation,
            endDate: combineTimeAndDay(endTime, nextDay(selectedDate as CustomDate, construction?.siteEndTimeIsNextDay ? 1 : 0))?.totalSeconds,
            meetingDate: combineTimeAndDay(meetingTime, selectedDate)?.totalSeconds,
            siteNameData: {
                name: construction.displayName,
            },
            constructionId,
            construction,
        }

        const newSiteArrangementData = {
            companyId: myCompanyId,
            date: selectedDate?.totalSeconds,
            site: newSite,
            siteId: siteId,
            constructionId,
            siteArrangementData: {
                siteName: construction.displayName,
                date: selectedDate?.totalSeconds,
                siteRelation: construction.constructionRelation,
            },
            targetMeter: { companyPresentNum: 0, companyRequiredNum: 0, presentArrangements: { items: [] }, presentRequests: { items: [] } },
        } as SiteArrangementModel

        const cachedResult = await updateCachedData({ key: siteArrangementCachedKey, value: newSiteArrangementData })
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

    const _updateDateArrangementsCache = async (selectedConstruction: SelectedConstructionType) => {
        const { siteId, constructionId, projectId, construction } = selectedConstruction

        const dateArrangementsCacheKey = genKeyName({
            screenName: 'DateRouter',
            accountId: accountId ?? '',
            companyId: myCompanyId ?? '',
            date: selectedDate ? dayBaseTextWithoutDate(selectedDate).replace(/\//g, '-') : '',
        })

        const meetingTime =
            construction?.siteMeetingTime !== undefined
                ? typeof construction.siteMeetingTime === 'number'
                    ? toCustomDateFromTotalSeconds(construction.siteMeetingTime)
                    : construction.siteMeetingTime
                : DEFAULT_SITE_MEETING_TIME
        const endTime =
            construction?.siteEndTime !== undefined
                ? typeof construction.siteEndTime === 'number'
                    ? toCustomDateFromTotalSeconds(construction.siteEndTime)
                    : construction.siteEndTime
                : DEFAULT_SITE_END_TIME
        const newSite: SiteType = {
            siteId,
            siteDate: selectedDate?.totalSeconds,
            siteRelation: construction.constructionRelation,
            endDate: combineTimeAndDay(endTime, nextDay(selectedDate as CustomDate, construction?.siteEndTimeIsNextDay ? 1 : 0))?.totalSeconds,
            meetingDate: combineTimeAndDay(meetingTime, selectedDate)?.totalSeconds,
            siteNameData: {
                name: construction.displayName,
            },
            constructionId,
            construction,
        }

        const dateArrangementsCacheData = await getCachedData<DateDataType>(dateArrangementsCacheKey)
        let cachedResult
        if (dateArrangementsCacheData.success) {
            if (dateArrangementsCacheData.success.sites?.totalSites?.items) {
                dateArrangementsCacheData.success.sites.totalSites.items.push(newSite)
            } else {
                dateArrangementsCacheData.success = {
                    ...dateArrangementsCacheData.success,
                    sites: {
                        totalSites: {
                            items: [newSite],
                        },
                    },
                }
            }
            dateArrangementsCacheData.success.updatedAt = Number(new Date())
            cachedResult = await updateCachedData({ key: dateArrangementsCacheKey, value: dateArrangementsCacheData.success })
        } else {
            const newDateData = {
                date: newSite.siteDate,
                sites: {
                    totalSites: { items: [newSite] ?? [] },
                },
                updatedAt: Number(new Date()),
                arrangementSummary: { siteCount: 1 },
                attendanceSummary: { siteCount: 1 },
            } as DateDataType
            dateArrangementsCacheData.success = newDateData
            cachedResult = await updateCachedData({ key: dateArrangementsCacheKey, value: dateArrangementsCacheData.success })
        }
    }

    const _writeSites = async () => {
        if (selectedConstructions.length > 0) {
            selectedConstructions.map(async (selectedConstruction) => {
                const { construction } = selectedConstruction
                if (construction?.contract?.status == 'created') {
                    throw {
                        error: t('admin:ThereAreConstructionProjectsForWhichContractsHaveNotBeenApproved'),
                    }
                }
            })
            await _updateSiteArrangementCache(selectedConstructions[0])
            // 日付管理のキャッシュ更新
            await _updateDateArrangementsCache(selectedConstructions[0])

            const promises = selectedConstructions.map(async (selectedConstruction) => {
                const { siteId, constructionId, projectId, contractId, construction } = selectedConstruction
                return await _writeSite(siteId, constructionId, projectId, contractId, construction as ConstructionCLType)
            })
            await _updateAdminHomeCache('project')
            await Promise.all(promises)
            navigation.push('DateRouter', {
                date: selectedDate,
            })
        }

        if (invRequestToCreate.length > 0) {
            const promises = invRequestToCreate.map(async (invRequest) => {
                return await _writeInvRequest(invRequest)
            })
            await _updateAdminHomeCache('support')
            await Promise.all(promises)
            if (selectedConstructions.length == 0) {
                navigation.push('DateRouter', {
                    date: selectedDate,
                })
            }
        }

        setState((prev) => ({ ...prev, selectedConstructions: [], invRequestToCreate: [] }))
    }

    const _contentConstructionList: ListRenderItem<ConstructionUIType> = (info: ListRenderItemInfo<ConstructionUIType>) => {
        const { item, index } = info

        const { projectId, projectName, constructionId, construction, isSiteOnTheDay, isSiteOnThePreviousDay, receiveCompanyName, startDate, endDate } = item
        const selected =
            invRequestToCreate.map((invRequest) => invRequest.invReservationId).includes(construction?.fakeCompanyInvReservationId) ||
            (constructionId != undefined && selectedConstructions.map((construction) => construction.constructionId).includes(constructionId))

        return (
            <ConstructionSummary
                onLongPress={() =>
                    navigation.push('ConstructionDetailRouter', {
                        projectId,
                        constructionId,
                        title: projectName,
                        target: 'ConstructionDetail',
                    })
                }
                isSelected={selected}
                onPress={() => {
                    if (construction?.fakeCompanyInvReservationId != undefined) {
                        if (selected) {
                            setState((prev) => ({ ...prev, invRequestToCreate: invRequestToCreate?.filter((inv) => inv.invReservationId != construction?.fakeCompanyInvReservationId) }))
                        } else {
                            if (item.construction?.contractId && projectId && startDate && endDate && targetDate && construction) {
                                const newInvRequest: FakeCompanyInvRequestType = {
                                    invRequestId: getUuidv4(),
                                    invReservationId: construction.fakeCompanyInvReservationId,
                                    targetCompanyId: construction.contract?.receiveCompanyId,
                                    date: selectedDate ? getDailyStartTime(selectedDate)?.totalSeconds : undefined,
                                    constructionId,
                                    siteId: getUuidv4(),
                                }
                                const _invRequestToCreate = [...(invRequestToCreate ?? []), newInvRequest]
                                setState((prev) => ({ ...prev, invRequestToCreate: _invRequestToCreate }))
                            }
                        }
                    } else if (selectedConstructions && constructionId) {
                        if (selected) {
                            const selectedConstructionsChanged = selectedConstructions.filter((construction) => construction.constructionId !== constructionId) ?? []

                            setState((prev) => ({ ...prev, selectedConstructions: selectedConstructionsChanged }))
                        } else {
                            if (item.construction?.contractId && projectId && startDate && endDate && targetDate && construction) {
                                const selectedConstruction: SelectedConstructionType = {
                                    contractId: item.construction?.contractId,
                                    constructionId,
                                    projectId,
                                    siteId: getUuidv4(),
                                    construction,
                                }
                                setState((prev) => ({ ...prev, selectedConstructions: [...prev.selectedConstructions, selectedConstruction] }))
                            }
                        }
                    }
                }}
                construction={construction}
                key={item?.construction?.constructionId ?? index}
                projectName={item?.projectName}
                targetDate={targetDate}
                isSiteOnTheDay={isSiteOnTheDay}
                isSiteOnThePreviousDay={isSiteOnThePreviousDay}
                receiveCompanyName={receiveCompanyName}
            />
        )
    }

    const onDisplayTypeChange = (type: DisplayType) => {
        setState((prev) => ({ ...prev, displayType: type }))
    }

    const _header = useMemo(() => {
        return (
            <View
                style={{
                    paddingTop: 45,
                    backgroundColor: '#fff',
                    borderBottomWidth: 1,
                    paddingHorizontal: 10,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                }}>
                <SelectButton
                    items={[t('admin:Contract'), t('admin:Support')]}
                    onChangeItem={(value) => {
                        if (value == t('admin:Support')) {
                            onDisplayTypeChange('support')
                        }
                        if (value == t('admin:Contract')) {
                            onDisplayTypeChange('project')
                        }
                    }}
                    selected={match(displayType)
                        .with('project', () => t('admin:Contract'))
                        .with('support', () => t('admin:Support'))
                        .otherwise(() => t('common:Contract'))}
                    style={{ marginTop: 10 }}
                />
                <Text
                    style={{
                        ...GlobalStyles.smallGrayText,
                        marginVertical: 5,
                        marginLeft: 5,
                    }}>
                    {t('admin:MultipleProjectsCanBeSelected')}
                </Text>
            </View>
        )
    }, [displayType])

    const _footer = () =>
        useMemo(() => {
            return (
                <View style={{ marginTop: 20, marginHorizontal: 10 }}>
                    <AppButton
                        isGray={true}
                        onPress={() => {
                            navigation.push('CreateProjectAndConstruction', {
                                routeNameFrom: 'ConstructionList',
                                selectedDate: selectedDate,
                                initStartDate: selectedDate,
                            })
                        }}
                        title={t('admin:CreateANewProject')}
                    />
                    <BottomMargin />
                </View>
            )
        }, [selectedDate])

    const _onDateChange = async (date: CustomDate) => {
        setState((prev) => ({
            ...prev,
            displayConstructionsData: [],
            selectedMonth: getMonthlyFirstDay(date),
            constructionsDetail: [],
            /**
             * Hiruma
             * 2022-11-25
             */
            isFetching: true,
        }))
    }

    useEffect(() => {
        setState((prev) => ({ ...prev, selectedConstructions: [], invRequestToCreate: [] }))
    }, [selectedMonth])

    useEffect(() => {
        ;(async () => {
            try {
                if (!isScreenOnRef.current) return
                if (isFetching != true) return
                if (!__isAvailable) return
                if (isFocused) dispatch(setLoading(true))
                const __selectedMonth = cloneDeep(getMonthlyFirstDay(selectedMonth))
                const result = await getCachedData<ConstructionListCacheType>(cachedKey.current)
                const db = _getFirestore()
                unsubscribeRef.current = db
                    .collection('MonthlyProject')
                    .where('companyId', '==', myCompanyId)
                    .where('month', '>=', __selectedMonth?.totalSeconds)
                    .where('month', '<', nextMonth(__selectedMonth).totalSeconds)
                    .onSnapshot(async (data) => {
                        const _monthlyData = data?.docs.map((doc) => doc.data())[0] as MonthlyProjectType | undefined

                        if (_monthlyData === undefined) return
                        if (_monthlyData && result?.success) {
                            if (result?.success?.updatedAt && _monthlyData?.updatedAt && result?.success?.updatedAt >= _monthlyData?.updatedAt) {
                                // キャッシュよりDBが古い場合、更新しない
                                return
                            }
                        }
                        const projects = (_monthlyData?.projects?.sort((a, b) => (a.startDate ?? 0) - (b.startDate ?? 0)) ?? []) as ProjectType[]
                        setState((prev) => ({
                            ...prev,
                            monthData: projects ?? [],
                        }))
                    })
                if (result.success) {
                    const _constructions = result.success?.constructions ?? []
                    const _monthlySiteDate = result.success?.monthlySiteDate ?? []

                    const date = selectedDate?.totalSeconds
                    const previousDate = nextDay(selectedDate, -1)?.totalSeconds

                    const _siteDate = _monthlySiteDate?.filter((siteDate) => siteDate?.date && [date, previousDate].includes(siteDate.date))

                    setState((prev) => ({
                        ...prev,
                        constructionsCached: _constructions,
                        siteDateCached: _siteDate,
                        monthlySiteDate: _monthlySiteDate,
                        isFetching: false,
                    }))
                }
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
                    dispatch(setIsNavUpdating(false))
                    dispatch(setLoading(false))
                }
            }
        })()
    }, [isFetching, selectedMonth])

    useEffect(() => {
        ;(async () => {
            if (!isScreenOnRef.current) return
            if (!isFetching) return
            if (!__isAvailable) return

            try {
                const __selectedDate = cloneDeep(selectedDate)
                const db = _getFirestore()
                const dateStart = getDailyStartTime(nextDay(__selectedDate, -1))?.totalSeconds
                const dateEnd = getDailyStartTime(__selectedDate)?.totalSeconds

                unsubscribeSiteRef.current = db
                    .collection('SiteDate')
                    .where('companyId', '==', myCompanyId)
                    .where('date', '>=', dateStart)
                    .where('date', '<=', dateEnd)
                    .onSnapshot(async (data) => {
                        const _siteDate = data?.docs.map((doc) => doc.data()) as SiteDateType[] | undefined

                        if (_siteDate === undefined) return

                        setState((prev) => ({
                            ...prev,
                            siteDate: _siteDate ?? [],
                        }))
                    })
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
    }, [isFetching, selectedMonth])

    // 画面を閉じたときに時にonSnapshotをunsubscribeする
    useEffect(() => {
        return () => {
            if (isScreenOnRef.current) {
                isScreenOnRef.current = false
                if (unsubscribeRef.current) {
                    unsubscribeRef.current()
                    unsubscribeRef.current = null
                }
                if (unsubscribeSiteRef.current) {
                    unsubscribeSiteRef.current()
                    unsubscribeSiteRef.current = null
                }
            }
        }
    }, [isFocused])

    // 月変更時にonSnapshotをunsubscribeする（前月のデータ更新が続くのを防ぐため）
    useEffect(() => {
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
            }
            if (unsubscribeSiteRef.current) {
                unsubscribeSiteRef.current()
                unsubscribeSiteRef.current = null
            }
        }
    }, [selectedMonth])

    const _onRefresh = async () => {
        setState((prev) => ({ ...prev, isFetching: true }))
    }

    useEffect(() => {
        cachedKey.current = genKeyName({
            screenName: 'ConstructionList',
            accountId: accountId,
            companyId: myCompanyId as string,
            /** "/" はKVSのキーに使えない文字のため "-" に変換 */
            month: selectedMonth ? monthBaseText(selectedMonth).replace(/\//g, '-') : '',
        })
    }, [accountId, myCompanyId, selectedMonth])

    /**
     * 表示用工事データ
     */
    useEffect(() => {
        if (!isCacheReady) return
        if (!isFocused) return
        if (isFocused) dispatch(setLoading(false))

        if (monthData !== undefined) {
            const constructions = flatten(
                monthData?.map((project) => {
                    const contracts = project.companyContracts?.totalContracts?.items

                    return project?.projectConstructions?.totalConstructions?.items
                        ?.filter(__filterConstruction)
                        ?.filter((construction) => {
                            // 自社が編集できない工事は非表示
                            return !(construction?.constructionRelation != 'fake-company-manager' && construction?.constructionRelation != 'manager')
                        })
                        .map((construction) => {
                            const _contract = contracts?.find(({ contractId }) => contractId === construction?.contractId)
                            if (construction !== undefined && _contract !== undefined) {
                                const _project = { name: project?.name, projectId: project?.projectId, startDate: project?.startDate, endDate: project?.endDate }
                                construction.project = _project
                                construction.contract = _contract
                            }

                            return construction
                        })
                }),
            ).filter((construction) => construction !== undefined) as ConstructionType[]

            setState((prev) => ({ ...prev, constructions, isFetching: false }))
        }
    }, [myCompanyId, monthData])

    /**
     * 表示用工事リスト生成
     */
    useEffect(() => {
        if ((constructions !== undefined || constructionsCached !== undefined) && isFocused) {
            let __constructions = constructions ?? constructionsCached ?? []

            __constructions =
                (deletedConstructionIds ?? []).length === 0 ? __constructions : __constructions?.filter(({ constructionId }) => constructionId && !deletedConstructionIds?.includes(constructionId))

            let _siteDate = siteDate ?? siteDateCached ?? []

            // キャッシュに新規追加工事が存在し、まだDBのデータに存在しない場合は、キャッシュを使う
            if (newConstructionIds && newConstructionIds?.length > 0) {
                const isNewConstructionExistsInCache = constructionsCached?.some((construction) => newConstructionIds?.includes(construction?.constructionId as string))

                if (isNewConstructionExistsInCache) {
                    const isNewConstructionExists = constructions?.some((construction) => newConstructionIds?.includes(construction?.constructionId as string))

                    if (isNewConstructionExists) {
                        dispatch(setNewConstructionIds([]))
                    } else {
                        __constructions = constructionsCached ?? []
                    }
                }
            }
            if (newConstructionIdsInSiteDate && newConstructionIdsInSiteDate?.length > 0) {
                const isNewConstructionExistsInSiteDateInCache = siteDateCached
                    ?.map((siteDate) => {
                        return siteDate.sites?.some((site) => newConstructionIdsInSiteDate.includes(site?.constructionId as string))
                    })
                    ?.includes(true)

                if (isNewConstructionExistsInSiteDateInCache) {
                    const isNewConstructionExistsInSiteDate = _siteDate
                        ?.map((siteDate) => {
                            return siteDate.sites?.some((site) => newConstructionIdsInSiteDate.includes(site?.constructionId as string))
                        })
                        ?.includes(true)

                    if (isNewConstructionExistsInSiteDate) {
                        dispatch(setNewConstructionIdsInSiteDate([]))
                    } else {
                        _siteDate = siteDateCached ?? []
                    }
                }
            }

            const _constructions = __constructions.map((construction) => {
                const __sites = flatten(_siteDate?.map((item) => item?.sites)?.filter((data) => data !== undefined))
                const _sites = __sites?.filter((site) => site?.constructionId === construction?.constructionId)
                if (_sites !== undefined) {
                    construction.sites = { items: _sites as SiteType[] }
                }
                return construction
            })

            const _displayConstructionsData = _constructions.map((construction) => {
                const receiveCompanyName = construction?.contract?.receiveCompanyId === myCompanyId ? '自社' : construction?.contract?.receiveCompany?.name

                const siteDates = construction?.sites?.items?.map(({ siteDate }) => siteDate)

                // 当日に現場が存在する工事は半透明でタップ不可
                // 前日に現場が存在する工事に前日入場タグを表示。
                let isSiteOnTheDay = false
                let isSiteOnThePreviousDay = false
                if (!isEmpty(selectedDate) && siteDates) {
                    const today = selectedDate.totalSeconds
                    const previousDay = nextDay(selectedDate, -1).totalSeconds

                    siteDates?.forEach((_siteDate) => {
                        if (_siteDate) {
                            if (_siteDate === today) {
                                isSiteOnTheDay = true
                                return
                            }
                            if (_siteDate === previousDay) {
                                isSiteOnThePreviousDay = true
                            }
                        }
                    })
                }

                return {
                    projectId: construction?.project?.projectId ? construction?.project?.projectId : construction?.contract?.projectId,
                    projectName: construction?.project?.name,
                    startDate: construction?.project?.startDate,
                    endDate: construction?.project?.endDate,
                    constructionId: construction?.constructionId,
                    constructionName: construction?.name,
                    construction: construction as ConstructionType,
                    isSiteOnTheDay,
                    isSiteOnThePreviousDay,
                    receiveCompanyName,
                } as ConstructionUIType
            })

            // 前日入場のタグ付き工事を上に表示
            // 当日現場のある工事は下に表示
            const displayConstructionsData = _displayConstructionsData
                .sort((a, b) => {
                    if (a.isSiteOnThePreviousDay !== undefined && b.isSiteOnThePreviousDay !== undefined) {
                        return Number(b.isSiteOnThePreviousDay) - Number(a.isSiteOnThePreviousDay)
                    }
                    return 0
                })
                .sort((a, b) => {
                    if (a.isSiteOnTheDay !== undefined && b.isSiteOnTheDay !== undefined) {
                        return Number(a.isSiteOnTheDay) - Number(b.isSiteOnTheDay)
                    }
                    return 0
                })

            //表示月とデータ・フェッチした月が一致すればアップデート(月送り連打対策)
            const fetchMonthBaseText = cachedKey.current.substring(cachedKey.current.length - 7).replace(/-/g, '/')
            if (monthBaseText(selectedMonth) == fetchMonthBaseText && _constructions !== undefined) {
                setState((prev) => ({ ...prev, displayConstructionsData }))
                ;(async () => {
                    try {
                        const date = selectedDate.totalSeconds
                        const previousDate = nextDay(selectedDate, -1).totalSeconds

                        const _monthlySiteDate = monthlySiteDate?.filter((siteDate) => siteDate?.date && ![date, previousDate].includes(siteDate.date)) ?? []

                        const cachedResult = await updateCachedData({
                            key: cachedKey.current,
                            value: {
                                constructions: _constructions,
                                monthlySiteDate: [..._monthlySiteDate, ...(_siteDate ?? [])],
                            },
                        })

                        if (cachedResult.error) {
                            throw {
                                error: cachedResult.error,
                                errorCode: cachedResult.errorCode,
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
            }
        }
    }, [constructions, siteDate])

    const filterConstructionsByConstructionName = (data: ConstructionUIType[]) => {
        return data.filter((data) => {
            if (data?.constructionName && textFilter && textFilter.length > 0) {
                return data.constructionName.indexOf(textFilter) > -1
            }
        })
    }
    const filterConstructionsByProjectName = (data: ConstructionUIType[]) => {
        return data.filter((data) => {
            if (data?.projectName && textFilter && textFilter.length > 0) {
                return data.projectName.indexOf(textFilter) > -1
            }
        })
    }

    const filteredByProjectName = (data: ProjectType[]) => {
        return data.filter(({ name }) => {
            if (name && textFilter && textFilter.length > 0) {
                return name.indexOf(textFilter) > -1
            }
        })
    }

    useEffect(() => {
        if (displayConstructionsData && isFocused) {
            const filteredByTypeConstructionsData = displayConstructionsData.filter((data) =>
                displayType == 'support'
                    ? data?.construction?.fakeCompanyInvReservationId != undefined
                    : data?.construction?.constructionRelation != 'other-company' &&
                      data?.construction?.constructionRelation != 'intermediation' &&
                      data?.construction?.fakeCompanyInvReservationId == undefined,
            )
            const filteredDepartmentsData = filteredByTypeConstructionsData.filter((data) => {
                if (
                    data.construction?.contract?.receiveCompanyId != myCompanyId ||
                    (checkMyDepartment({
                        targetDepartmentIds: data.construction?.contract?.receiveDepartmentIds,
                        activeDepartmentIds,
                    }) &&
                        data.construction?.contract?.status != 'created')
                ) {
                    return true
                } else {
                    return false
                }
            })

            const dataFilteredByProjectName = filterConstructionsByProjectName(filteredDepartmentsData)
            const dataFilteredByConstructionName = filterConstructionsByConstructionName(filteredDepartmentsData)

            if (textFilter && textFilter.length > 0) {
                if (dataFilteredByProjectName.length > 0) {
                    setState((prev) => ({ ...prev, displayFilteredConstructionsData: dataFilteredByProjectName }))
                } else if (dataFilteredByConstructionName.length > 0) {
                    setState((prev) => ({ ...prev, displayFilteredConstructionsData: dataFilteredByConstructionName as ProjectType[] }))
                } else {
                    setState((prev) => ({ ...prev, displayFilteredConstructionsData: [] }))
                }
            } else {
                setState((prev) => ({ ...prev, displayFilteredConstructionsData: filteredDepartmentsData }))
            }
        }
    }, [textFilter, displayConstructionsData, displayType, activeDepartmentIds])

    return (
        <>
            <View style={{ backgroundColor: '#fff', paddingBottom: 10 }}>
                <Search
                    style={{ marginTop: 10, marginHorizontal: 15 }}
                    text={textFilter}
                    title={t('common:SearchByProjectOrConstructionName')}
                    onChange={setTextFilter}
                    clearText={() => setTextFilter(undefined)}
                    placeholder={t('common:SearchByProjectOrConstructionName')}
                />
            </View>
            <SwitchPage
                dateType={'month'}
                dateUpdate={dateUpdate}
                dateInitValue={selectedMonth}
                data={displayFilteredConstructionsData}
                header={_header}
                content={_contentConstructionList}
                emptyProps={
                    loading
                        ? undefined
                        : {
                              text: t('admin:ThereAreNoDealsForTheCurrentMonthYet'),
                          }
                }
                onRefresh={_onRefresh}
                footer={_footer}
                onDateChange={_onDateChange}
                switchDateButtonTopMargin={5}
            />
            <View
                style={{
                    paddingVertical: 10,
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                }}>
                {!isEmpty(selectedDate) && (
                    <Text
                        style={{
                            ...GlobalStyles.normalText,
                            alignSelf: 'center',
                            marginBottom: 5,
                        }}>
                        現場を追加する日付 {dayBaseText(selectedDate)}
                    </Text>
                )}
                <AppButton
                    style={{ marginHorizontal: 15 }}
                    title={
                        t('admin:AddSites') +
                        (selectedConstructions.length + invRequestToCreate.length > 0 ? `（ ${t('admin:Selected')} ${selectedConstructions.length + invRequestToCreate.length} ）` : '')
                    }
                    disabled={selectedConstructions.length + invRequestToCreate.length === 0}
                    onPress={() => {
                        _writeSites()
                    }}
                />
            </View>
        </>
    )
}

export default ConstructionList
