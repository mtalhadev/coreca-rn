import React, { useState, useEffect, useMemo, useRef, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, ListRenderItem, ListRenderItemInfo, FlatList, ViewStyle, Text, Pressable, Alert, Platform } from 'react-native'
import { useNavigation, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { EmptyScreen } from '../../../components/template/EmptyScreen'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { StoreType } from '../../../stores/Store'
import { useIsFocused } from '@react-navigation/native'
import { setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { SiteAttendanceDataType, SiteAttendanceWorkerType } from '../../../models/attendance/SiteAttendanceDataType'
import { SiteType } from '../../../models/site/Site'
import { IconParam } from '../../../components/organisms/IconParam'
import { THEME_COLORS, WINDOW_WIDTH } from '../../../utils/Constants'
import { Line } from '../../../components/atoms/Line'
import { updateCachedData, getCachedData, genKeyName } from '../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { getUuidv4 } from '../../../utils/Utils'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { InvRequestType } from '../../../models/invRequest/InvRequestType'
import { _getFirestore } from '../../../services/firebase/FirestoreService'
import { SiteAttendanceModel } from '../../../models/attendance/SiteAttendance'
import { AppButton } from '../../../components/atoms/AppButton'
import cloneDeep from 'lodash/cloneDeep'
import flatten from 'lodash/flatten'
import sum from 'lodash/sum'
import { FontStyle, GlobalStyles } from '../../../utils/Styles'
import { ShadowBox } from '../../../components/organisms/shadowBox/ShadowBox'
import { InvRequestPrefix } from '../../../components/organisms/invRequest/InvRequestPrefix'
import { CustomDate, dayBaseTextWithoutDate, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { CompanyType } from '../../../models/company/Company'
import { ID } from '../../../models/_others/ID'
import { DateRouterContext } from '../date/DateRouter'
import ThreeDotsSvg from '../../../../assets/images/threeDots.svg'
import { SiteHeader } from '../../../components/organisms/site/SiteHeader'
import { Company } from '../../../components/organisms/company/Company'
import { WorkerList } from '../../../components/organisms/worker/WorkerList'
import { WorkerType } from '../../../models/worker/Worker'
import { checkMyDepartment } from '../../../usecases/department/DepartmentCase'
import { autoCreateAttendanceOfSelectedWorker, updateAttendanceWithDefaultSiteSetting } from '../../../usecases/attendance/SiteAttendanceCase'
import { SwitchPage } from '../../../components/template/SwitchPage'
import { checkLockOfTarget, updateLockOfTarget } from '../../../usecases/lock/CommonLockCase'
import { approveAttendance, getNewAttendances, onUpdateAttendanceUpdateAllSiteAttendancesCache } from '../../../usecases/attendance/CommonAttendanceCase'
import { AttendanceType } from '../../../models/attendance/Attendance'
import { getSiteAttendanceOfTargetCompany } from '../../../usecases/ssg/SiteAttendanceSSGCase'

type NavProps = StackNavigationProp<RootStackParamList, 'DateRouter'>
type RouteProps = RouteProp<RootStackParamList, 'DateRouter'>

export type SelectedAttendanceType = {
    attendanceId: ID
    siteId: ID
}

type InitialStateType = {
    allSiteAttendances?: (SiteAttendanceDataType | undefined)[]
    unReportedAttendanceWorkers: SiteAttendanceWorkerType[]
    reportedAttendanceWorkers: SiteAttendanceWorkerType[]
    sites?: (SiteType | undefined)[]
    invRequests?: (InvRequestType | undefined)[]
    isFetching?: boolean

    date?: CustomDate
    siteIds?: ID[]
    invRequestSiteInfoList?: InvRequestSiteInfoType[]
}

export type AllSiteAttendancesMangeCacheDataType = {
    allSiteAttendances?: (SiteAttendanceDataType | undefined)[]
    sites?: (SiteType | undefined)[]
    invRequests?: (InvRequestType | undefined)[]
    updatedAt?: number
}
/**
 * site 仮会社へ送る場合の現場
 * sites 連携済みへ送った場合の現場/仮会社へ送る場合はその現場
 */
export type InvRequestSiteInfoType = {
    invRequestId?: string
    site?: SiteType
    sites?: SiteType[]
    targetCompany?: CompanyType
}

const initialState: InitialStateType = {
    unReportedAttendanceWorkers: [],
    reportedAttendanceWorkers: [],
}

/**
 *
 * 日付勤怠登録画面
 */
const AllSiteAttendancesManage = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const [{ allSiteAttendances, unReportedAttendanceWorkers, reportedAttendanceWorkers, sites, invRequests, isFetching, date }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state?.account?.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state?.account?.signInUser)
    const { setDate, siteIds, invRequestSiteInfoList, initDate, setDisplayScreen } = useContext(DateRouterContext)

    const cachedKey = useRef<string | null>(null)

    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const unsubscribeRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])
    const loading = useSelector((state: StoreType) => state.util.loading)
    const [dateUpdate, setDateUpdate] = useState(0)

    useEffect(() => {
        if (isFocused) {
            setDateUpdate(dateUpdate + 1)
        }
        return () => {
            setState(initialState)
        }
    }, [isFocused])

    useSafeUnmount(setState, initialState, () => setDateUpdate(dateUpdate + 1))

    useEffect(() => {
        if (siteIds) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [siteIds])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (setDate && date && date?.totalSeconds != initDate?.totalSeconds) {
            setDate(date)
        }
        if (isFocused) {
            cachedKey.current = genKeyName({
                screenName: 'AllSiteAttendancesManage',
                accountId: signInUser?.accountId ?? '',
                companyId: myCompanyId ?? '',
                /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                date: date ? dayBaseTextWithoutDate(date).replace(/\//g, '-') : '',
            })
        }
    }, [date])

    useEffect(() => {
        setState((prev) => ({
            ...prev,
            date: initDate,
        }))
    }, [initDate])

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        ;(async () => {
            try {
                if (signInUser == undefined || myCompanyId == undefined || siteIds == undefined || isFetching != true) {
                    return
                }
                if (allSiteAttendances && !isNavUpdating) {
                    dispatch(setLoading('inVisible'))
                } else {
                    if (isFocused) {
                        dispatch(setLoading(true))
                    }
                }

                if (!isFocused) {
                    return
                }

                cachedKey.current = genKeyName({
                    screenName: 'AllSiteAttendancesManage',
                    accountId: signInUser?.accountId ?? '',
                    companyId: myCompanyId ?? '',
                    /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                    date: date ? dayBaseTextWithoutDate(date).replace(/\//g, '-') : '',
                })

                const allSiteAttendancesCacheData = await getCachedData<AllSiteAttendancesMangeCacheDataType>(cachedKey.current)

                const _date = cloneDeep(date)?.totalSeconds

                if (_date == undefined) {
                    return
                }
                const allSiteAttendancesResult = await getSiteAttendanceOfTargetCompany({
                    companyId: myCompanyId,
                    date: _date,
                })
                if (allSiteAttendancesResult.error) {
                    throw {
                        error: allSiteAttendancesResult.error,
                        errorCode: allSiteAttendancesResult.errorCode,
                    }
                }
                const dbAllSiteAttendances = allSiteAttendancesResult?.success

                if (allSiteAttendancesCacheData.success) {
                    const updatedAt = Math.max(...(dbAllSiteAttendances?.map((siteAttendance) => siteAttendance?.updatedAt) as number[]))
                    const cacheUpdatedAt = allSiteAttendancesCacheData?.success?.updatedAt

                    // キャッシュよりDBが古い場合、更新しない
                    const isCacheNewer = updatedAt != undefined && cacheUpdatedAt != undefined && updatedAt < cacheUpdatedAt
                    if (isCacheNewer) {
                        const allSiteAttendancesCache = (allSiteAttendancesCacheData.success.allSiteAttendances as SiteAttendanceDataType[]) ?? []

                        const sitesCache = allSiteAttendancesCacheData.success.sites as SiteType[]

                        const invRequestsCache = allSiteAttendancesCacheData.success.invRequests as InvRequestType[]
                        setState((prev) => ({
                            ...prev,
                            allSiteAttendances: allSiteAttendancesCache,
                            sites: sitesCache,
                            invRequests: invRequestsCache,
                            isFetching: false,
                        }))

                        dispatch(setLoading(false))
                        return
                    }
                }

                const __allSiteAttendances = siteIds?.map((siteId) => dbAllSiteAttendances?.find((siteAttendance) => siteAttendance?.siteId == siteId))

                const _allSiteAttendances = __allSiteAttendances.map((siteAttendance) => {
                    return siteAttendance?.siteAttendanceData
                })
                const _sites = __allSiteAttendances.map((siteAttendance) => siteAttendance?.site)

                const _invRequests = __allSiteAttendances.map((siteAttendance) => siteAttendance?.invRequest)
                setState((prev) => ({
                    ...prev,
                    allSiteAttendances: _allSiteAttendances,
                    sites: _sites,
                    invRequests: _invRequests,
                    isFetching: false,
                }))

                if (cachedKey.current) {
                    const cachedResult = await updateCachedData<AllSiteAttendancesMangeCacheDataType>({
                        key: cachedKey.current,
                        value: {
                            allSiteAttendances: _allSiteAttendances,
                            sites: _sites,
                            invRequests: _invRequests,
                        },
                    })
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
                setState((prev) => ({ ...prev, isFetching: false }))
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
    }, [isFetching])

    useEffect(() => {
        isScreenOnRef.current = isFocused
        //画面を閉じたときに時にonSnapshotをunsubscribeする
        return () => {
            if (unsubscribeRef.current && isScreenOnRef.current && isFocused == false) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
                isScreenOnRef.current = false
            }
        }
    }, [isFocused])

    useEffect(() => {
        if (isFocused) {
            const workers =
                (flatten(
                    allSiteAttendances?.map((siteAttendance, index) => {
                        const invRequest = invRequests?.[index]
                        if (invRequest && (invRequest?.isApplication == false || invRequest?.myCompanyId != myCompanyId)) {
                            return undefined
                        }
                        if (siteAttendance?.siteCompanies?.length == 0) return undefined

                        const invRequestSiteInfo = invRequestSiteInfoList?.find((invRequestSiteInfo) => invRequestSiteInfo?.invRequestId === invRequest?.invRequestId)
                        const workers = flatten(
                            siteAttendance?.siteCompanies?.map((siteCompany) => {
                                const _arrangedWorkers = siteCompany?.arrangedWorkers?.map((worker) => {
                                    if (worker?.arrangement) {
                                        const _site =
                                            sites?.find((site) => site?.siteId == worker?.arrangement?.siteId) ?? invRequestSiteInfo?.sites?.find((site) => site?.siteId == worker?.arrangement?.siteId)
                                        worker.arrangement.site = _site
                                        return worker
                                    }
                                    return worker
                                })
                                return _arrangedWorkers ?? []
                            }) ?? [],
                        )
                        return workers
                    }),
                ).filter((data) => data != undefined) as SiteAttendanceWorkerType[]) ?? []
            const _unReportedAttendanceWorkers = workers?.filter((item) => item.attendance?.isAbsence != true && (item?.attendance?.startDate == undefined || item?.attendance?.endDate == undefined))
            setState((prev) => ({
                ...prev,
                unReportedAttendanceWorkers: _unReportedAttendanceWorkers,
                reportedAttendanceWorkers: workers?.filter((item) => item.attendance?.isAbsence == true || (item?.attendance?.startDate != undefined && item?.attendance?.endDate != undefined)),
            }))
        }
    }, [allSiteAttendances, invRequests])

    /**
     * 遅刻・欠席など定時以外かどうか。
     */
    const _isNotOnTime = (item: SiteAttendanceWorkerType) => {
        return (
            item?.arrangement?.attendance?.isAbsence == true ||
            item?.arrangement?.attendance?.behindTime != undefined ||
            item?.arrangement?.attendance?.earlyLeaveTime != undefined ||
            item?.arrangement?.attendance?.overtimeWork != undefined ||
            item?.arrangement?.attendance?.midnightWorkTime != undefined ||
            item?.attendance?.isAbsence == true ||
            item?.attendance?.behindTime != undefined ||
            item?.attendance?.earlyLeaveTime != undefined ||
            item?.attendance?.overtimeWork != undefined ||
            item?.attendance?.midnightWorkTime != undefined
        )
    }

    const _registerAllSiteAttendances = async () => {
        try {
            dispatch(setLoading(true))
            // 勤怠キャッシュ更新
            const newAttendancesResult = await Promise.all(
                unReportedAttendanceWorkers.map((item) =>
                    getNewAttendances({
                        attendanceId: item?.attendanceId,
                        startDate: toCustomDateFromTotalSeconds(item?.arrangement?.site?.startDate as number),
                        endDate: toCustomDateFromTotalSeconds(item?.arrangement?.site?.endDate as number),
                        editWorkerId: signInUser?.workerId,
                        myCompanyId: myCompanyId,
                        accountId: signInUser?.accountId,
                        siteId: item?.arrangement?.site?.siteId,
                    }),
                ),
            )
            const newAttendances = newAttendancesResult.map((result) => result.success)
            await onUpdateAttendanceUpdateAllSiteAttendancesCache({
                newAttendances: newAttendances as AttendanceType[],
                myCompanyId: myCompanyId,
                accountId: signInUser?.accountId,
                date,
            })
            //悲観ロック確認と更新
            await Promise.all([
                ...unReportedAttendanceWorkers?.map(async (worker) => {
                    const attendanceLockResult = await checkLockOfTarget({
                        myWorkerId: signInUser?.workerId ?? 'no-id',
                        targetId: worker?.attendanceId ?? 'no-id',
                        modelType: 'attendance',
                    })
                    if (attendanceLockResult.error) {
                        throw {
                            error: attendanceLockResult.error,
                        }
                    }
                    updateLockOfTarget({
                        myWorkerId: signInUser?.workerId ?? 'no-id',
                        targetId: worker?.attendanceId ?? 'no-id',
                        modelType: 'attendance',
                        unlock: false,
                    })
                }),
                ...reportedAttendanceWorkers?.map(async (worker) => {
                    const attendanceLockResult = await checkLockOfTarget({
                        myWorkerId: signInUser?.workerId ?? 'no-id',
                        targetId: worker?.attendanceId ?? 'no-id',
                        modelType: 'attendance',
                    })
                    if (attendanceLockResult.error) {
                        throw {
                            error: attendanceLockResult.error,
                        }
                    }
                    updateLockOfTarget({
                        myWorkerId: signInUser?.workerId ?? 'no-id',
                        targetId: worker?.attendanceId ?? 'no-id',
                        modelType: 'attendance',
                        unlock: false,
                    })
                }),
            ])
            const results = await Promise.all([
                ...unReportedAttendanceWorkers?.map(async (worker) =>
                    updateAttendanceWithDefaultSiteSetting({
                        attendance: worker?.attendance,
                        site: worker?.arrangement?.site,
                    }),
                ),
                ...reportedAttendanceWorkers?.map(async (worker) =>
                    approveAttendance({
                        attendanceId: worker?.attendanceId ?? 'no-id',
                    }),
                ),
            ])
            //悲観ロック解除
            unReportedAttendanceWorkers?.map((worker) => {
                updateLockOfTarget({
                    myWorkerId: signInUser?.workerId ?? 'no-id',
                    targetId: worker?.attendanceId ?? 'no-id',
                    modelType: 'attendance',
                    unlock: true,
                })
            })
            reportedAttendanceWorkers?.map((worker) => {
                updateLockOfTarget({
                    myWorkerId: signInUser?.workerId ?? 'no-id',
                    targetId: worker?.attendanceId ?? 'no-id',
                    modelType: 'attendance',
                    unlock: true,
                })
            })
            results.forEach((result) => {
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            })

            dispatch(
                setToastMessage({
                    text: t('admin:AttendanceHasBeenFinalized'),
                    type: 'success',
                } as ToastMessage),
            )
            navigation.replace('DateRouter', {
                date: date as CustomDate,
                target: 'DateAttendances',
            })
        } catch (error) {
            dispatch(setLoading(false))
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'warn',
                } as ToastMessage),
            )
        } finally {
            if (isFocused) dispatch(setLoading(false))
        }
    }

    const _content: ListRenderItem<SiteAttendanceDataType | undefined> = (info: ListRenderItemInfo<SiteAttendanceDataType | undefined>) => {
        const { item, index } = info

        if (item == undefined) return <></>

        const siteCompanies = item?.siteCompanies ?? []
        if (siteCompanies.length == 0) return <></>

        const invRequest = invRequests?.[index]
        if (invRequest && (invRequest?.isApplication == false || invRequest?.myCompanyId != myCompanyId)) {
            return <></>
        }

        const site = sites?.[index]

        const invRequestSiteInfo = invRequestSiteInfoList?.find((invRequestSiteInfo) => invRequestSiteInfo?.invRequestId === invRequest?.invRequestId)
        const invRequestSite = site?.fakeCompanyInvRequestId
            ? invRequestSiteInfoList?.find((invRequestSiteInfo) => invRequestSiteInfo?.invRequestId === site?.fakeCompanyInvRequestId)?.site
            : undefined

        // const attendanceModifications = site?.allArrangements?.items?.map((arr) => arr.attendanceModification).filter((data) => data != undefined) as AttendanceModificationModel[]

        const workerList = flatten(siteCompanies.map((siteCompany) => siteCompany?.arrangedWorkers?.map((worker) => worker))).filter((data) => data != undefined) as SiteAttendanceWorkerType[]
        const respondedCount = invRequestSite?.subRequests?.items?.filter((req) => req.initialStockedAttendanceIds?.length != req.stockedAttendanceIds?.length)?.length ?? 0
        if (site == undefined && (invRequest?.attendanceIds?.length ?? 0) == 0 && respondedCount == 0) {
            return <></>
        }

        const displayAlert = (data?: SiteType) => {
            Alert.alert(
                `${data?.siteNameData?.name}`,
                '',
                (data?.siteRelation == 'manager' ? checkMyDepartment({ targetDepartmentIds: data?.construction?.contract?.receiveDepartmentIds, activeDepartmentIds }) : false)
                    ? [
                          {
                              text: `${t('worker:cancel')}`,
                              style: 'cancel',
                          },
                          {
                              text: `${t('admin:Details')}`,
                              onPress: () => {
                                  navigation.push('SiteDetail', {
                                      siteId: data?.siteId,
                                      title: data?.siteNameData?.name,
                                      siteNumber: data?.siteNameData?.siteNumber,
                                  })
                              },
                          },
                          {
                              text: `${t('worker:edit')}`,
                              onPress: () => {
                                  navigation.push('EditSite', {
                                      siteId: data?.siteId,
                                      constructionId: data?.constructionId,
                                      mode: 'edit',
                                      isInstruction: data?.siteRelation == 'order-children',
                                      projectId: data?.construction?.contract?.projectId ?? 'no-id',
                                  })
                              },
                          },
                      ]
                    : [
                          {
                              text: `${t('worker:cancel')}`,
                              style: 'cancel',
                          },
                          {
                              text: `${t('admin:Details')}`,
                              onPress: () => {
                                  navigation.push('SiteDetail', {
                                      siteId: data?.siteId,
                                      title: data?.siteNameData?.name,
                                      siteNumber: data?.siteNameData?.siteNumber,
                                      requestId: data?.companyRequests?.receiveRequests?.items?.[0]?.requestId,
                                  })
                              },
                          },
                      ],
            )
        }

        return (
            <ShadowBox
                hasShadow={true}
                style={{
                    marginTop: 10,
                    marginHorizontal: 10,
                    paddingBottom: 10,
                }}
                onPress={() => {
                    if (site) {
                        navigation.push('SiteAttendanceManage', {
                            siteId: site?.siteId ?? ('' as string),
                            siteNumber: site?.siteNameData?.siteNumber,
                            requestId: site?.companyRequests?.receiveRequests?.items && site?.companyRequests?.receiveRequests?.items[0]?.requestId,
                            date,
                        })
                    }
                }}
                key={site?.siteId ?? invRequest?.invRequestId}>
                <>
                    {(invRequest?.invRequestId || site?.fakeCompanyInvRequestId) && (
                        <View
                            style={{
                                backgroundColor: THEME_COLORS.OTHERS.GRAY,
                                paddingVertical: 5,
                                paddingLeft: 10,
                                borderTopEndRadius: 10,
                                borderTopStartRadius: 10,
                                borderBottomRightRadius: 0,
                                borderBottomLeftRadius: 0,
                            }}>
                            <Text
                                style={{
                                    ...GlobalStyles.smallText,
                                    color: '#fff',
                                }}>
                                {t('admin:SendYourSupport')}
                            </Text>
                        </View>
                    )}
                    <SiteHeader
                        site={site && invRequestSite == undefined ? site : invRequestSite}
                        displayDay
                        style={{
                            backgroundColor: THEME_COLORS.OTHERS.PURPLE_GRAY,
                            padding: 8,
                            borderTopEndRadius: 10,
                            borderTopStartRadius: 10,
                        }}
                        displayMeter={false}
                        titleStyle={
                            {
                                lineHeight: 14,
                                fontSize: 12,
                                fontFamily: FontStyle.regular,
                            } as ViewStyle
                        }
                        siteNameWidth={WINDOW_WIDTH - 40}
                        displayAlert={() => displayAlert(site && invRequestSite == undefined ? site : invRequestSite)}
                    />

                    {site?.siteId && (
                        <>
                            <View
                                style={{
                                    marginTop: 3,
                                }}>
                                <WorkerList
                                    onPress={(item) => {
                                        const target = workerList?.filter((worker) => worker.worker?.workerId == item?.workerId)[0]
                                        if (target != undefined) {
                                            navigation.push('AttendanceDetail', {
                                                arrangementId: target.arrangement?.arrangementId ?? '',
                                                attendanceId: target.attendanceId ?? '',
                                                siteId: site?.siteId ?? '',
                                            })
                                        } else {
                                            undefined
                                        }
                                    }}
                                    markingWorkerIds={
                                        workerList
                                            .filter(_isNotOnTime)
                                            .map((worker) => worker.worker?.workerId)
                                            .filter((data) => data != undefined) as string[]
                                    }
                                    lightWorkerIds={
                                        workerList
                                            .filter((worker) => worker?.attendance?.isReported != true && worker?.attendance?.startDate == undefined && worker?.attendance?.endDate == undefined)
                                            .map((worker) => worker.worker?.workerId)
                                            .filter((data) => data != undefined) as string[]
                                    }
                                    workers={workerList?.map((worker) => worker.worker).filter((data) => data != undefined) as WorkerType[]}
                                    displayRespondCount
                                    style={{ marginHorizontal: 8 }}
                                />
                            </View>
                        </>
                    )}

                    {invRequest?.invRequestId && invRequestSite == undefined && (
                        <>
                            {invRequestSiteInfo?.targetCompany && (
                                <Pressable
                                    style={{
                                        flexDirection: 'row',
                                        flexWrap: 'wrap',
                                        alignItems: 'center',
                                        marginLeft: 5,
                                    }}
                                    onPress={() => {
                                        if (item) {
                                            navigation.push('SiteAttendanceManage', {
                                                invRequestId: invRequest?.invRequestId ?? ('' as string),
                                            })
                                        }
                                    }}>
                                    <InvRequestPrefix type={invRequest?.invRequestStatus} fontSize={9} />
                                    <Company
                                        company={invRequestSiteInfo?.targetCompany}
                                        hasLastDeal={false}
                                        style={{
                                            paddingTop: 5,
                                            paddingBottom: 5,
                                            flex: 0,
                                            marginLeft: 10,
                                        }}
                                        displayCompanyPrefix
                                    />
                                </Pressable>
                            )}

                            <FlatList
                                data={invRequestSiteInfo?.sites}
                                listKey={listKey + index.toString()}
                                keyExtractor={(item, index) => index.toString()}
                                ListEmptyComponent={() => {
                                    return (
                                        <View
                                            style={{
                                                marginTop: 5,
                                            }}>
                                            <Text style={GlobalStyles.smallText}>{t('common:ThereIsNoSite')}</Text>
                                        </View>
                                    )
                                }}
                                renderItem={({ item, index }) => {
                                    const _workerList = workerList?.filter((worker) => worker.arrangement?.siteId == item?.siteId)
                                    return (
                                        <ShadowBox
                                            hasShadow={false}
                                            style={{
                                                marginTop: 10,
                                                marginHorizontal: 10,
                                                paddingBottom: 10,
                                            }}
                                            // onPress={() => {
                                            //     if (item) {
                                            //         navigation.push('SiteAttendanceManage', {
                                            //             siteId: item?.siteId ?? ('' as string),
                                            //             siteNumber: item?.siteNameData?.siteNumber,
                                            //             requestId: item?.companyRequests?.receiveRequests?.items && item?.companyRequests?.receiveRequests?.items[0]?.requestId,
                                            //         })
                                            //     }
                                            // }}
                                        >
                                            <SiteHeader
                                                site={item}
                                                displayDay
                                                style={{
                                                    backgroundColor: THEME_COLORS.OTHERS.PURPLE_GRAY,
                                                    padding: 8,
                                                    borderTopEndRadius: 10,
                                                    borderTopStartRadius: 10,
                                                }}
                                                displayMeter={false}
                                                titleStyle={
                                                    {
                                                        lineHeight: 14,
                                                        fontSize: 12,
                                                        fontFamily: FontStyle.regular,
                                                    } as ViewStyle
                                                }
                                                siteNameWidth={WINDOW_WIDTH - 40}
                                                displayAlert={() => displayAlert(item)}
                                            />
                                            <View
                                                style={{
                                                    marginTop: 3,
                                                }}>
                                                <WorkerList
                                                    onPress={(_item) => {
                                                        const target = _workerList?.filter((worker) => worker.worker?.workerId == _item?.workerId)[0]
                                                        if (target != undefined) {
                                                            navigation.push('AttendanceDetail', {
                                                                arrangementId: target.arrangement?.arrangementId ?? '',
                                                                attendanceId: target.attendanceId ?? '',
                                                                siteId: item?.siteId ?? '',
                                                            })
                                                        } else {
                                                            undefined
                                                        }
                                                    }}
                                                    markingWorkerIds={
                                                        _workerList
                                                            .filter(_isNotOnTime)
                                                            .map((worker) => worker.worker?.workerId)
                                                            .filter((data) => data != undefined) as string[]
                                                    }
                                                    lightWorkerIds={
                                                        _workerList
                                                            .filter(
                                                                (worker) =>
                                                                    worker?.attendance?.isReported != true && worker?.attendance?.startDate == undefined && worker?.attendance?.endDate == undefined,
                                                            )
                                                            .map((worker) => worker.worker?.workerId)
                                                            .filter((data) => data != undefined) as string[]
                                                    }
                                                    workers={_workerList?.map((worker) => worker.worker).filter((data) => data != undefined) as WorkerType[]}
                                                    displayRespondCount
                                                    style={{ marginHorizontal: 8 }}
                                                />
                                            </View>
                                        </ShadowBox>
                                    )
                                }}
                            />
                        </>
                    )}
                </>
            </ShadowBox>
        )
    }

    const _header = () => {
        /**
         * 表示されている作業員のみのカウント
         */
        const totalCounts = useMemo(
            () =>
                allSiteAttendances?.map((siteAttendance, index) => {
                    const invRequest = invRequests?.[index]
                    if (invRequest && (invRequest?.isApplication == false || invRequest?.myCompanyId != myCompanyId)) {
                        return [0, 0]
                    }

                    const arrangeCount = sum(siteAttendance?.siteCompanies?.map((siteCompany) => siteCompany?.arrangedWorkers?.length ?? 0) ?? [])
                    const unReportCount = sum(
                        siteAttendance?.siteCompanies?.map((siteCompany) => siteCompany?.arrangedWorkers?.filter((worker) => worker?.attendance?.isReported != true)?.length ?? 0) ?? [],
                    )

                    return [arrangeCount, unReportCount]
                }),
            [allSiteAttendances, invRequests],
        )
        const counts = totalCounts?.reduce(
            (prev, current) => {
                return [prev[0] + current[0], prev[1] + current[1]]
            },
            [0, 0],
        )
        const [arrangeCount, unReportCount] = counts ?? [0, 0]

        return (
            <>
                <View
                    style={{
                        marginTop: 63,
                        paddingHorizontal: 10,
                        backgroundColor: '#fff',
                    }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 10,
                        }}>
                        <IconParam paramName={t('common:NoOfOperations')} suffix={t('common:Name')} count={arrangeCount} iconName={'attend-worker'} />
                        <IconParam
                            paramName={t('common:Unreported')}
                            suffix={t('common:Name')}
                            hasBorder
                            count={unReportCount}
                            color={(unReportCount ?? 0) > 0 ? THEME_COLORS.OTHERS.ALERT_RED : '#000'}
                            iconName={'worker'}
                        />
                        <Pressable
                            style={{
                                width: 40,
                                marginLeft: -40,
                            }}
                            onPress={() => {
                                Alert.alert(`${t('admin:ModeSwitching')}`, '', [
                                    {
                                        text: `${t('admin:ArrangementManage')}`,
                                        onPress: () => {
                                            setDisplayScreen ? setDisplayScreen('DateArrangements') : null
                                        },
                                    },
                                    {
                                        text: `${t('admin:AttendanceManage')}`,
                                        onPress: () => {
                                            setDisplayScreen ? setDisplayScreen('DateAttendances') : null
                                        },
                                    },
                                    {
                                        text: `${t('common:Cancel')}`,
                                        style: 'cancel',
                                    },
                                ])
                            }}>
                            <ThreeDotsSvg fill={'#000'} />
                        </Pressable>
                    </View>
                    <Line
                        style={{
                            marginHorizontal: -10,
                        }}
                    />
                </View>
            </>
        )
    }
    const listKey = useMemo(() => getUuidv4(), [])

    const _onRefresh = async () => {
        if (isFocused) dispatch(setLoading(true))
        dispatch(setIsNavUpdating(true))
    }

    const _onDateChange = async (_date: CustomDate) => {
        // __DEV__ && logger.logAccessInfo('\n5. onDateChangeイベントハンドラ')

        setState((prev) => ({ ...prev, date: _date }))
    }

    return (
        <>
            {/* <FlatList
                style={{}}
                listKey={listKey}
                data={allSiteAttendances}
                keyExtractor={(item, index) => index.toString()}
                renderItem={_content}
                ListHeaderComponent={_header}
                ListFooterComponent={<BottomMargin />}
                ListEmptyComponent={<EmptyScreen text={t('admin:NoWorkerYetArranged')} />}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
            /> */}
            <SwitchPage
                dateUpdate={dateUpdate}
                dateInitValue={date ?? initDate}
                dateType={'day'}
                data={allSiteAttendances}
                header={_header}
                content={_content}
                emptyProps={
                    loading
                        ? undefined
                        : {
                              text: t('admin:NoWorkerYetArranged'),
                          }
                }
                onRefresh={_onRefresh}
                footer={() => <BottomMargin />}
                onDateChange={_onDateChange}
                style={{
                    position: 'relative',
                }}
            />
            <AppButton
                style={{
                    marginHorizontal: 10,
                    position: 'absolute',
                    bottom: 20,
                    right: 0,
                    zIndex: 1000,
                    elevation: Platform.OS === 'android' ? 10 : 0,
                    width: 80,
                }}
                onPress={() => {
                    Alert.alert(t('admin:IfAttendanceIsNotReportedIWillRegisterAttendanceOnTimeIsThatCorrect'), '', [
                        {
                            text: t('common:Register'),
                            onPress: () => {
                                _registerAllSiteAttendances()
                            },
                        },
                        {
                            text: t('common:Fix'),
                            style: 'cancel',
                        },
                    ])
                }}
                title={t('admin:FinalizeAttendances')}
            />
        </>
    )
}

export default AllSiteAttendancesManage

const styles = StyleSheet.create({})
