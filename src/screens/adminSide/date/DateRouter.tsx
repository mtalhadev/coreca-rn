import React, { createContext, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import DateAttendances from './DateAttendances'
import DateArrangements from './DateArrangements'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/core'
import { CustomDate, dayBaseText, dayBaseTextWithoutDate, getDailyEndTime, getDailyStartTime, getMonthlyFirstDay, isToday, monthBaseText } from '../../../models/_others/CustomDate'
import { useTextTranslation } from './../../../fooks/useTextTranslation'
import { useDispatch, useSelector } from 'react-redux'
import { StoreType } from '../../../stores/Store'
import AllSiteAttendancesManage, { InvRequestSiteInfoType } from '../attendance/AllSiteAttendancesManage'
import { DateDataType } from '../../../models/date/DateDataType'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { CompanySiteListType } from '../../../models/site/CompanySiteListType'
import { SiteListType } from '../../../models/site/SiteListType'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { genKeyName, getCachedData, updateCachedData } from '../../../usecases/CachedDataCase'
import { getDateArrangementDataSummaryData } from '../../../usecases/arrangement/DateArrangementCase'
import { checkMyDepartment } from '../../../usecases/department/DepartmentCase'
import { getDateDataOfTargetDateAndCompany } from '../../../usecases/ssg/DateDataSSGCase'
import { getArrangeableWorkersOfTargetDateAndCompanyDepartment } from '../../../usecases/worker/CommonWorkerCase'
import { EmptyScreen } from '../../../components/template/EmptyScreen'
import cloneDeep from 'lodash/cloneDeep'
import { ProjectType } from '../../../models/project/Project'
import { getDateAttendanceUnApprovedWorkersCount, getDateAttendanceUnReportedWorkersCount } from '../../../usecases/attendance/DateAttendanceCase'
import uniqBy from 'lodash/uniqBy'
import { InvRequestType } from '../../../models/invRequest/InvRequestType'
import { CompanyInvRequestListType } from '../../../models/invRequest/CompanyInvRequestListType'
import { RequestType } from '../../../models/request/Request'

type NavProps = StackNavigationProp<RootStackParamList, 'DateRouter'>
type RouteProps = RouteProp<RootStackParamList, 'DateRouter'>
const TabStack = createMaterialTopTabNavigator()

export type DateRouterContextType = {
    update?: number
    setDate?: React.Dispatch<React.SetStateAction<CustomDate | undefined>>
    dateData?: DateDataType
    setDeletingIds?: React.Dispatch<React.SetStateAction<string[]>>
    initDate?: CustomDate
    setDisplayScreen?: React.Dispatch<React.SetStateAction<DisplayScreenType | undefined>>
    siteIds?: string[] //siteIdsとはいうものの、勤怠の表示に使うためInvRequestIdも混じっている
    invRequestSiteInfoList?: InvRequestSiteInfoType[]
    //toDoInvRequestsとtoDoRequestsはDateDataに移したほうがいいかもしれない
    toDoInvRequests?: InvRequestType[]
    toDoRequests?: RequestType[]
    setToDoInvRequests?: (invRequests: InvRequestType[]) => void
    setToDoRequests?: (request: RequestType[]) => void
}

export const DateRouterContext = createContext<DateRouterContextType>({})

export type ExtendedDateDataType = {
    monthlyData: DateDataType[]
    projects: ProjectType[]
}

type InitialStateType = {
    dateData?: DateDataType
    isFetching?: boolean
    siteIds?: string[]
    invRequestSiteInfoList?: InvRequestSiteInfoType[]
    toDoInvRequests?: InvRequestType[]
    toDoRequests?: RequestType[]
}
const initialState: InitialStateType = {
    isFetching: false,
}
type DisplayScreenType = 'DateArrangements' | 'AllSiteAttendancesManage' | 'DateAttendances'

const DateRouter = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [date, setDate] = useState(route.params?.date)
    const [deletingIds, setDeletingIds] = useState<string[]>([])

    const holidays = useSelector((state: StoreType) => state.util.holidays)
    const isFocused = useIsFocused()
    const myCompanyId = useSelector((state: StoreType) => state?.account.belongCompanyId)
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])
    const cachedKeyRef = useRef<string | null>(null)
    const signInUser = useSelector((state: StoreType) => state?.account.signInUser)
    const adminHomeCacheKeyRef = useRef<string | null>(null)

    const dispatch = useDispatch()
    const [{ dateData, isFetching, siteIds, invRequestSiteInfoList, toDoInvRequests, toDoRequests }, setState] = useState(initialState)

    /**
     * AdminHomeのキャッシュからデータを表示
     * DateData初回表示時には、日付管理にキャッシュがないため
     */
    useEffect(() => {
        if (isFocused && date) {
            ;(async () => {
                try {
                    setDisplayScreen(undefined)
                    const __date = cloneDeep(date) as CustomDate
                    cachedKeyRef.current = genKeyName({
                        screenName: 'DateRouter',
                        accountId: signInUser?.accountId ?? '',
                        companyId: myCompanyId ?? '',
                        /** "/" はKVSのキーに使えない文字のため "-" に置き換え */
                        date: __date ? dayBaseTextWithoutDate(__date).replace(/\//g, '-') : '',
                    })

                    const __month = __date ? cloneDeep(getMonthlyFirstDay(__date)) : undefined
                    adminHomeCacheKeyRef.current = genKeyName({
                        //const adminHomeCacheKey = genKeyName({
                        screenName: 'AdminHome',
                        accountId: signInUser?.accountId ?? '',
                        companyId: myCompanyId as string,
                        /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                        month: __month ? monthBaseText(__month).replace(/\//g, '-') : '',
                    })

                    const adminHomeCacheData = await getCachedData<ExtendedDateDataType>(adminHomeCacheKeyRef.current ?? 'no=id')
                    const dateArrangementsCacheData = await getCachedData<DateDataType>(cachedKeyRef.current ?? 'no-id')

                    if (adminHomeCacheData.success) {
                        adminHomeCacheData.success?.monthlyData.map(async (adminHomeDateData) => {
                            if (adminHomeDateData.date == date?.totalSeconds) {
                                if (adminHomeDateData.updatedAt && dateArrangementsCacheData.success?.updatedAt && adminHomeDateData.updatedAt <= dateArrangementsCacheData.success?.updatedAt) {
                                    setState((prev) => ({ ...prev, dateData: dateArrangementsCacheData.success }))
                                    if (cachedKeyRef.current) {
                                        const cachedResult = await updateCachedData({ key: cachedKeyRef.current, value: dateArrangementsCacheData.success })
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
                                } else {
                                    setState((prev) => ({ ...prev, dateData: adminHomeDateData }))
                                }
                            }
                        })
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
    }, [date, isFocused])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({
                ...prev,
                isFetching: true,
                toDoInvRequests: [],
                toDoRequests: [],
            }))
        }
    }, [isFocused, date, activeDepartmentIds])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({
                ...prev,
                isFetching: true,
            }))
        }
    }, [isNavUpdating])

    // const _setDateData = async () => {
    //     try {
    //         if (!isDataFetchedRef.current) return
    //         isDataFetchedRef.current = false

    //         if (displayDateDataRef.current === null) return

    //         const dateData = displayDateDataRef.current

    //         setState((prev) => ({
    //             ...prev,
    //             isFetching: false,
    //             dateData: dateData,
    //         }))

    //         dispatch(setLoading(false))
    //         dispatch(setIsNavUpdating(false))
    //     } catch (error) {
    //         const _error = error as CustomResponse
    //         dispatch(
    //             setToastMessage({
    //                 text: getErrorToastMessage(_error),
    //                 type: 'error',
    //             } as ToastMessage),
    //         )
    //     }
    // }

    // const displayDateDataRef = useRef<DateDataType | null>(null)

    // const _updateCachedData = async () => {
    //     try {
    //         if (!isDataFetchedRef.current) return
    //         if (cachedKeyRef.current === null) return
    //         const dateData = displayDateDataRef.current ?? []
    //         const cachedResult = await updateCachedData({ key: cachedKeyRef.current, value: { dateDate: dateData } })
    //         if (cachedResult.error) {
    //             const _error = cachedResult as CustomResponse
    //             dispatch(
    //                 setToastMessage({
    //                     text: getErrorToastMessage(_error),
    //                     type: 'error',
    //                 }),
    //             )
    //         }
    //     } catch (error) {
    //         const _error = error as CustomResponse
    //         dispatch(
    //             setToastMessage({
    //                 text: getErrorToastMessage(_error),
    //                 type: 'error',
    //             } as ToastMessage),
    //         )
    //     }
    // }
    // const isDataFetchedRef = useRef<boolean>(false)
    // const timerRef = useRef<NodeJS.Timer | null>(null)
    // const isScreenOnRef = useRef<boolean>(false)

    // // タイマーで一定時間ごとにレンダリング
    // useEffect(() => {
    //     if (isScreenOnRef.current && isDataFetchedRef) {
    //         timerRef.current = setInterval(async () => {
    //             await _updateCachedData()
    //             await _setDateData()
    //         }, 10000)
    //     }
    //     return () => {
    //         if (timerRef.current) {
    //             clearInterval(timerRef.current)
    //             timerRef.current = null
    //         }
    //     }
    // }, [isFocused, date])

    /**
     * @summary fetchステート変化時の副作用フック（フェッチ＆キャッシュ保存）
     * @purpose アプリ側にKVSによるキャッシュを設けて一覧の初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            if (isFocused && date !== undefined && isFetching) {
                /**
                 * フェッチ中に日付が変わるのを防ぐ
                 * 2022.08.23 Hiruma
                 */
                if (isFocused) dispatch(setLoading(true))
                // const __date = cloneDeep(date) as CustomDate
                try {
                    const result = await getDateDataOfTargetDateAndCompany({
                        companyId: myCompanyId,
                        date: date ? getDailyStartTime(date)?.totalSeconds : undefined,
                        endDate: date ? getDailyEndTime(date).totalSeconds : undefined,
                    })
                    if (result.error) {
                        throw {
                            error: result.error,
                            errorCode: result.errorCode,
                        }
                    }
                    let dateData = result.success ? result.success : undefined

                    const dateArrangementsCacheData = await getCachedData<DateDataType>(cachedKeyRef.current ?? 'no-id')
                    let isCacheData = false
                    if (dateArrangementsCacheData.success) {
                        if (dateArrangementsCacheData.success.updatedAt && dateData?.updatedAt && dateArrangementsCacheData.success.updatedAt > dateData?.updatedAt) {
                            // キャッシュよりDBが古い場合、更新しない
                            isCacheData = true
                            dateData = dateArrangementsCacheData.success
                        }
                        if (dateData == undefined) {
                            // サーバからデータ取得できなかった場合、キャッシュを使う
                            isCacheData = true
                            dateData = dateArrangementsCacheData.success
                        }
                    }
                    // const adminHomeCacheData = await getCachedData<ExtendedDateDataType>(adminHomeCacheKeyRef.current ?? 'no-id')
                    // if (adminHomeCacheData.success) {
                    //     const _cacheDateData = adminHomeCacheData.success?.monthlyData.filter((cacheDateData) => {
                    //         return cacheDateData.date === dateData?.date
                    //     })
                    //     if (_cacheDateData[0]?.updatedAt && dateData.updatedAt && _cacheDateData[0].updatedAt > dateData?.updatedAt) {
                    //         // キャッシュよりDBが古い場合、更新しない
                    //         return
                    //     }
                    //     adminHomeCacheData.success?.monthlyData.map((cacheDateData) => {
                    //         if (cacheDateData.date == dateData.date && cacheDateData.updatedAt && dateData.updatedAt && cacheDateData.updatedAt > dateData?.updatedAt) {
                    //             // キャッシュよりDBが古い場合、更新しない
                    //             return
                    //         }
                    //     })
                    // }

                    /**
                     * 部署によって、作業員や現場が異なるので、再度絞り込む。
                     * 後に、サーバーに移す？
                     */
                    const _arrangeableWorkersResult = await getArrangeableWorkersOfTargetDateAndCompanyDepartment({
                        companyId: myCompanyId,
                        date: date?.totalSeconds,
                        endDate: date ? getDailyEndTime(date).totalSeconds : undefined,
                        activeDepartmentIds,
                    })
                    if (_arrangeableWorkersResult.error) {
                        throw {
                            error: _arrangeableWorkersResult.error,
                            errorCode: _arrangeableWorkersResult.errorCode,
                        }
                    }

                    /**
                     * 現場の絞り込み
                     */
                    const __totalSites: SiteListType = {
                        items: dateData?.sites?.totalSites?.items?.filter(
                            (site) =>
                                site?.siteId &&
                                !deletingIds?.includes(site?.siteId) &&
                                !(site.siteRelation == 'fake-company-manager' && site.fakeCompanyInvRequestId != undefined) &&
                                (site.siteRelation == 'fake-company-manager' ||
                                    (site.companyRequests?.receiveRequests?.items?.length ?? 0) > 0 ||
                                    site.construction?.contract?.receiveCompanyId != myCompanyId ||
                                    checkMyDepartment({
                                        targetDepartmentIds: site.construction?.contract?.receiveDepartmentIds,
                                        activeDepartmentIds,
                                    })),
                        ),
                    }
                    const _totalSites: SiteListType = {
                        items: __totalSites?.items?.filter(
                            (site) =>
                                //他社現場からの常用依頼で、自社が承認していない場合は表示しない。
                                (!(site.siteRelation == 'other-company' && site.companyRequests?.receiveRequests?.items && site.companyRequests?.receiveRequests?.items[0]?.isApproval != true) &&
                                    // 発注管理下工事を一旦非表示にする
                                    // https://gitlab.com/coreca-inc/coreca-app/-/issues/1386
                                    site?.siteRelation != 'order-children') ||
                                // 発注管理下から来た常用依頼を表示する
                                // https://gitlab.com/coreca-inc/coreca-app/-/issues/1449
                                (site?.siteRelation == 'order-children' && (site.companyRequests?.receiveRequests?.items?.length ?? 0) > 0),
                        ),
                    }

                    /**
                     * indexの振り直し
                     */
                    const _sites: CompanySiteListType = {
                        totalSites: _totalSites,
                        orderSites: _totalSites.items
                            ?.map((site, index) => (site.siteRelation == 'order-children' || site.siteRelation == 'owner' || site.siteRelation == 'intermediation' ? index : undefined))
                            .filter((data) => data != undefined) as number[],
                        orderChildSites: _totalSites.items?.map((site, index) => (site.siteRelation == 'order-children' ? index : undefined)).filter((data) => data != undefined) as number[],
                        managerSites: _totalSites.items?.map((site, index) => (site.siteRelation == 'manager' ? index : undefined)).filter((data) => data != undefined) as number[],
                        fakeCompanyMangerSites: _totalSites.items
                            ?.map((site, index) => (site.siteRelation == 'fake-company-manager' ? index : undefined))
                            .filter((data) => data != undefined) as number[],
                        requestedSites: _totalSites.items
                            ?.map((site, index) => (site.siteRelation != 'fake-company-manager' && (site.companyRequests?.receiveRequests?.items?.length ?? 0) > 0 ? index : undefined))
                            .filter((data) => data != undefined) as number[],
                        otherCompanySites: _totalSites.items?.map((site, index) => (site.siteRelation == 'other-company' ? index : undefined)).filter((data) => data != undefined) as number[],
                    }
                    //他社からの常用で送るで、自社が承認していない場合は表示しない。
                    const _invRequests: CompanyInvRequestListType = {
                        ...dateData?.invRequests,
                        receiveInvRequests: {
                            //自社への常用で来る（承認済み）は、日付管理に表示しない
                            items: [],
                        },
                        totalInvRequests: {
                            items: dateData?.invRequests?.totalInvRequests?.items?.filter((invR) => !(invR.targetCompanyId == myCompanyId)),
                        },
                    }

                    const toDoRequests: RequestType[] = dateData?.sites?.totalSites?.items
                        ?.filter((site) => site.companyRequests?.receiveRequests?.items && site.companyRequests?.receiveRequests?.items[0]?.isApproval == 'waiting')
                        .map((site) => {
                            if (site.companyRequests?.totalRequests?.items?.filter((data) => data.requestedCompanyId == myCompanyId)[0]) {
                                return {
                                    ...site.companyRequests?.totalRequests?.items?.filter((data) => data.requestedCompanyId == myCompanyId)[0],
                                    site: site,
                                }
                            } else {
                                return undefined
                            }
                        })
                        .filter((data) => data != undefined) as RequestType[]
                    const toDoInvRequests: InvRequestType[] = dateData?.invRequests?.totalInvRequests?.items
                        ?.filter((invR) => invR.targetCompanyId == myCompanyId && invR.invRequestStatus == 'waiting')
                        .filter((data) => data != undefined) as InvRequestType[]
                    setState((prev) => ({
                        ...prev,
                        toDoInvRequests,
                        toDoRequests,
                    }))
                    let newDateData: DateDataType = {
                        ...dateData,
                        arrangeableWorkers: _arrangeableWorkersResult.success,
                        sites: _sites,
                        invRequests: _invRequests,
                        //attendanceSummaryの値は使用しないので修正しないが、使用する場合は修正が必要
                    }
                    if (date && isCacheData == false) {
                        const arrangementSummaryResult = await getDateArrangementDataSummaryData({
                            dateData: newDateData,
                        })
                        if (arrangementSummaryResult.error) {
                            throw {
                                error: arrangementSummaryResult.error,
                                errorCode: arrangementSummaryResult.errorCode,
                            }
                        }
                        newDateData = arrangementSummaryResult.success ?? newDateData
                    }

                    //現場が確定済みかどうか
                    const isAllSitesConfirmed =
                        (dateData?.sites?.totalSites?.items?.filter((site) => (site.siteRelation == 'fake-company-manager' || site.siteRelation == 'manager') && site.isConfirmed !== true)?.length ??
                            0) <= 0
                    const requestedSites = newDateData?.sites?.totalSites?.items?.filter((site, index) => newDateData?.sites?.requestedSites?.includes(index))
                    const confirmedRequestedSites = requestedSites?.filter((site) => site.companyRequests?.receiveRequests?.items && site.companyRequests?.receiveRequests?.items[0].isConfirmed)
                    const isAllRequestedSitesConfirmed = requestedSites?.length === confirmedRequestedSites?.length ? true : false
                    const isAllInvRequestApplied = (newDateData?.invRequests?.orderInvRequests?.items?.filter((invR) => invR.isApplication !== true)?.length ?? 0) <= 0
                    const isAllSitesArranged = isAllSitesConfirmed && isAllRequestedSitesConfirmed && isAllInvRequestApplied ? true : false

                    //作業員が全員承認済みかどうか
                    const siteUnApprovedWorkersCount = getDateAttendanceUnApprovedWorkersCount({ data: newDateData })
                    const isAllWorkersReported = siteUnApprovedWorkersCount === 0 ? true : false

                    // まとめて勤怠を登録する現場のID
                    // AllSiteAttendancesMangeで会社・日付指定でSiteAttendanceを取得すると重複した現場や削除された現場も表示される場合があるため、表示する現場のIDをパラメータで渡す（あくまで一時的回避策）
                    //仮会社へ常用で送る場合は、同じ勤怠SSGが2つ作成される。一つはInvRequestに紐づいており、もう一つはSiteに紐づいている。Siteの方じゃないと常用依頼した作業員の勤怠変更を感知してSSGを更新しない。
                    const fakeSiteInvRequestIds = newDateData.sites?.totalSites?.items?.map((site) => site?.fakeCompanyInvRequestId).filter((data) => data != undefined) as string[]
                    const siteIds = [
                        ...((newDateData.sites?.totalSites?.items?.map((item) => item.siteId)?.filter((data) => data != undefined) as string[]) ?? []),
                        ...((newDateData.invRequests?.orderInvRequests?.items
                            ?.map((item) => item.invRequestId)
                            ?.filter((data) => data != undefined && !fakeSiteInvRequestIds.includes(data)) as string[]) ?? []),
                    ]

                    // 常用現場のUI表示用の現場・会社情報（SiteAttendanceに不足しているため）
                    const invRequestSiteInfoList = (dateData?.invRequests?.totalInvRequests?.items
                        ?.map((item: InvRequestType, index) => {
                            if (item?.invRequestId) {
                                const site = item?.site
                                // uniqBy: 重複する現場が存在する場合があったため
                                const sites = uniqBy(
                                    item?.attendances?.map((att) => att.arrangement?.site)?.sort((a, b) => (a?.meetingDate ?? a?.siteDate ?? 0) - (b?.meetingDate ?? b?.siteDate ?? 0)),
                                    'siteId',
                                )
                                const targetCompany = item?.targetCompany

                                return { invRequestId: item?.invRequestId, site, sites, targetCompany }
                            }
                            return undefined
                        })
                        .filter((item) => item !== undefined) ?? []) as InvRequestSiteInfoType[]
                    setState((prev) => ({
                        ...prev,
                        dateData: newDateData,
                        isFetching: false,
                        siteIds,
                        invRequestSiteInfoList,
                    }))
                    //部署別にSSGが作成されれば、モデルにフラグを持たせることが可能
                    if (route.params?.target) {
                        setDisplayScreen(route.params?.target as DisplayScreenType)
                        navigation.setParams({ target: undefined })
                    } else if (displayScreen != undefined) {
                        // 初回表示の場合自動遷移。それ以外はそこへ止まる
                    } else if (isAllSitesArranged !== true || (newDateData.attendanceSummary?.sitesCount ?? 0) == 0) {
                        //未確定の現場がある場合は手配編集画面
                        setDisplayScreen('DateArrangements')
                    } else if (isAllSitesArranged === true && isAllWorkersReported === true) {
                        //手配が確定しており、未報告の勤怠がない場合は勤怠管理画面
                        setDisplayScreen('DateAttendances')
                    } else if (isAllSitesArranged === true && isAllWorkersReported !== true) {
                        //手配が確定しており、未報告の勤怠がある場合は勤怠編集画面
                        setDisplayScreen('AllSiteAttendancesManage')
                    } else {
                        setDisplayScreen('DateArrangements')
                    }
                    if (cachedKeyRef.current && result.success) {
                        //部署フィルターやtodo除外などしていないプレーンなデータをキャッシュ
                        const cachedResult = await updateCachedData({ key: cachedKeyRef.current, value: result.success })
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
                } catch (error) {
                    const _error = error as CustomResponse
                    setDisplayScreen('DateArrangements')
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
            }
        })()
    }, [isFetching])

    const [displayScreen, setDisplayScreen] = useState<DisplayScreenType | undefined>()

    useEffect(() => {
        if (displayScreen == 'AllSiteAttendancesManage') {
            navigation.setOptions({
                title: t('admin:AttendanceMode'),
            })
        } else if (displayScreen == 'DateAttendances') {
            navigation.setOptions({
                title: t('admin:CompleteMode'),
            })
        } else if (displayScreen == 'DateArrangements') {
            navigation.setOptions({
                title: t('admin:ArrangementMode'),
            })
        } else if (date) {
            navigation.setOptions({
                title: `${isToday(date) ? t('common:Today') : ''}${dayBaseText(date)}${(holidays ?? {})[dayBaseTextWithoutDate(date) ?? ''] != undefined ? ' [祝]' : ''}`,
            })
        }
    }, [displayScreen])

    return (
        <DateRouterContext.Provider
            value={{
                setDate,
                update: route.params?.update,
                dateData,
                setDeletingIds,
                initDate: date,
                setDisplayScreen,
                siteIds,
                invRequestSiteInfoList,
                toDoInvRequests,
                toDoRequests,
                setToDoInvRequests: (item) => setState((prev) => ({ ...prev, toDoInvRequests: item })),
                setToDoRequests: (item) => setState((prev) => ({ ...prev, toDoRequests: item })),
            }}>
            {displayScreen === 'DateAttendances' ? (
                <DateAttendances />
            ) : displayScreen === 'DateArrangements' ? (
                <DateArrangements />
            ) : displayScreen === 'AllSiteAttendancesManage' ? (
                <AllSiteAttendancesManage />
            ) : (
                <EmptyScreen text={t('common:Acquisition')} />
            )}
        </DateRouterContext.Provider>
    )
}
export default DateRouter

const styles = StyleSheet.create({})
