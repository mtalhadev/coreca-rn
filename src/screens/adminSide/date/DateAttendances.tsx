import React, { useState, useEffect, useContext, useMemo, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { View, Text, StyleSheet, Pressable, ListRenderItem, ListRenderItemInfo, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { CustomDate, dayBaseText, dayBaseTextWithoutDate, isToday } from '../../../models/_others/CustomDate'
import { AlertMessage } from '../../../components/organisms/AlertMessage'
import { THEME_COLORS } from '../../../utils/Constants'
import { Line } from '../../../components/atoms/Line'
import { IconParam } from '../../../components/organisms/IconParam'
import { DateAttendance } from '../../../components/organisms/date/DateAttendance'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { AlertUIType, DateInvRequestArrangementType, DateSiteArrangementType } from './DateArrangements'
import { SiteType } from '../../../models/site/Site'
import { ToastMessage, setLoading, setToastMessage } from '../../../stores/UtilSlice'
import { StoreType } from '../../../stores/Store'
import { FontStyle } from '../../../utils/Styles'
import { DateDataType } from '../../../models/date/DateDataType'
import { DateRouterContext } from './DateRouter'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { useIsFocused } from '@react-navigation/native'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../fooks/useTextTranslation'
import { SwitchPage } from '../../../components/template/SwitchPage'
import sum from 'lodash/sum'
import { InvRequestType } from '../../../models/invRequest/InvRequestType'
import { ReplaceAnd } from '../../../models/_others/Common'
import { _getFirestore } from '../../../services/firebase/FirestoreService'
import { InvRequestWithSites } from '../../../components/organisms/invRequest/InvRequestWithSites'
import { checkMyDepartment } from '../../../usecases/department/DepartmentCase'
import ThreeDotsSvg from '../../../../assets/images/threeDots.svg'
import flatten from 'lodash/flatten'
import { BaseModal } from '../../../components/organisms/BaseModal'
import { TodoList } from '../../../components/organisms/TodoList'
import uniqBy from 'lodash/uniqBy'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { RequestType } from '../../../models/request/Request'
import { toIdAndMonthFromTotalSeconds, addUpdateScreens } from '../../../models/updateScreens/UpdateScreens'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { genKeyName, updateCachedData } from '../../../usecases/CachedDataCase'
import { approveInvRequest } from '../../../usecases/invRequest/invRequestCase'
import { updateRequestIsApproval } from '../../../usecases/request/CommonRequestCase'
import { ArrangementType } from '../../../models/arrangement/Arrangement'
import { approveTargetAttendanceModification, unApproveTargetAttendanceModification } from '../../../usecases/attendance/WorkerAttendanceModificationCase'
import { AttendanceType } from '../../../models/attendance/Attendance'
import { getAttendanceModificationRequestCount } from '../../../usecases/attendance/DateAttendanceCase'

type NavProps = StackNavigationProp<RootStackParamList, 'DateRouter'>
type RouteProps = RouteProp<RootStackParamList, 'DateRouter'>

type InitialStateType = {
    date?: CustomDate
    alerts?: AlertUIType[]
    dateData?: DateDataType
    isDisplayTodo?: boolean //未承認の依頼と常用で来る一覧を表示する
    attendanceModificationRequest?: ArrangementType[]
}

const initialState: InitialStateType = {}

// const logger = createLogger() // for log rerendering
type DateAttendanceType = ReplaceAnd<SiteType, InvRequestType>

/**
 *
 * 日付勤怠登録完了画面
 */
const DateAttendances = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ date, alerts, isDisplayTodo, attendanceModificationRequest }, setState] = useState(initialState)
    const holidays = useSelector((state: StoreType) => state.util.holidays)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state?.account.belongCompanyId)
    //dateDataを最新に更新したい場合は、setIsNavUpdating(true)をする
    const { dateData, setDate, initDate, setDisplayScreen, toDoRequests, toDoInvRequests, setToDoRequests, setToDoInvRequests } = useContext(DateRouterContext)
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const cachedKeyRef = useRef<string | null>(null)
    const signInUser = useSelector((state: StoreType) => state?.account.signInUser)

    const isFocused = useIsFocused()
    const loading = useSelector((state: StoreType) => state.util.loading)
    const [dateUpdate, setDateUpdate] = useState(0)

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({
                ...prev,
                date: initDate,
            }))
        }
    }, [initDate, isFocused])

    useEffect(() => {
        if (isFocused) {
            setDateUpdate(dateUpdate + 1)
        }
    }, [isFocused])

    useSafeUnmount(setState, initialState, () => setDateUpdate(dateUpdate + 1))

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        // __DEV__ && logger.logAccessInfo('1. mount時の副作用フック（ステートを初期化）')
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        if (setDate && date && date?.totalSeconds != initDate?.totalSeconds) {
            setDate(date)
        }
        if (isFocused) {
            cachedKeyRef.current = genKeyName({
                screenName: 'DateRouter',
                accountId: signInUser?.accountId ?? '',
                companyId: myCompanyId ?? '',
                /** "/" はKVSのキーに使えない文字のため "-" に置き換え */
                date: date ? dayBaseTextWithoutDate(date).replace(/\//g, '-') : '',
            })
        }
    }, [date])

    /**
     * 現場の数を現場の受注部署で絞り込み
     */
    const sitesCount = useMemo(
        () =>
            activeDepartmentIds?.length == 0
                ? dateData?.arrangementSummary?.sitesCount
                : dateData?.sites?.totalSites?.items?.filter(
                      (site) =>
                          site.construction?.contract?.receiveCompanyId != myCompanyId ||
                          checkMyDepartment({
                              targetDepartmentIds: site?.construction?.contract?.receiveDepartmentIds,
                              activeDepartmentIds,
                          }),
                  )?.length,
        [activeDepartmentIds, dateData, myCompanyId],
    )

    /**
     * 出勤中の数を現場の受注部署で絞り込み
     */
    const arrangedWorkersCount = useMemo(
        () =>
            activeDepartmentIds?.length == 0
                ? dateData?.attendanceSummary?.arrangedWorkersCount
                : sum(
                      dateData?.sites?.totalSites?.items
                          ?.filter(
                              (site) =>
                                  site.construction?.contract?.receiveCompanyId != myCompanyId ||
                                  checkMyDepartment({
                                      targetDepartmentIds: site.construction?.contract?.receiveDepartmentIds,
                                      activeDepartmentIds,
                                  }),
                          )
                          .map((site) => site.allArrangements?.items?.filter((arr) => arr.createCompanyId == myCompanyId)?.length),
                  ) + sum(dateData?.invRequests?.orderInvRequests?.items?.filter((data) => !data.targetCompany?.isFake)?.map((invRequest) => invRequest.attendances?.length ?? 0)),
        [dateData, myCompanyId, activeDepartmentIds],
    )

    /**
     * 未報告の数を現場の受注部署で絞り込み
     */
    const unReportedWorkersCount = useMemo(
        () =>
            activeDepartmentIds?.length == 0
                ? dateData?.attendanceSummary?.unReportedWorkersCount
                : sum(
                      dateData?.sites?.totalSites?.items
                          ?.filter(
                              (site) =>
                                  site.construction?.contract?.receiveCompanyId != myCompanyId ||
                                  checkMyDepartment({
                                      targetDepartmentIds: site.construction?.contract?.receiveDepartmentIds,
                                      activeDepartmentIds,
                                  }),
                          )
                          .map((site) => site.subUnreportedCount),
                  ) +
                  sum(
                      dateData?.invRequests?.orderInvRequests?.items
                          ?.filter((data) => !data.targetCompany?.isFake)
                          ?.map((invRequest) => invRequest.attendances?.filter((att) => att.isReported != true)?.length ?? 0),
                  ),
        [dateData, myCompanyId, activeDepartmentIds],
    )

    /**
     * 勤怠修正依頼を現場の受注部署で絞り込み
     */
    useMemo(() => {
        const _attendanceModificationRequest = [
            ...flatten(
                dateData?.sites?.totalSites?.items
                    ?.filter(
                        (site) =>
                            site.construction?.contract?.receiveCompanyId != myCompanyId ||
                            checkMyDepartment({
                                targetDepartmentIds: site.construction?.contract?.receiveDepartmentIds,
                                activeDepartmentIds,
                            }),
                    )
                    .map(
                        (site) =>
                            site.allArrangements?.items
                                ?.filter((arr) => arr.createCompanyId == myCompanyId && (arr?.attendanceModification?.status == 'created' || arr?.attendanceModification?.status == 'edited'))
                                //手配の中に現場情報を入れる
                                .map((arr) => {
                                    const _arr = {
                                        ...arr,
                                        site: site,
                                    }
                                    return _arr
                                })
                                .filter((data) => data != undefined) as ArrangementType[],
                    ) ?? [],
            ),
            ...flatten(
                dateData?.invRequests?.orderInvRequests?.items?.map(
                    (inv) =>
                        flatten(
                            inv.attendances?.map((att) =>
                                att.arrangement?.attendanceModification?.status == 'created' || att.arrangement?.attendanceModification?.status == 'edited'
                                    ? {
                                          ...att?.arrangement,
                                          worker: {
                                              ...inv?.workers?.items?.filter((worker) => worker.workerId == att.workerId)[0],
                                          },
                                      }
                                    : undefined,
                            ),
                        ).filter((data) => data != undefined) as ArrangementType[],
                ),
            ),
        ]
        setState((prev) => ({
            ...prev,
            attendanceModificationRequest: _attendanceModificationRequest,
        }))
    }, [dateData, myCompanyId, activeDepartmentIds, dateData?.sites?.totalSites?.items])

    useEffect(() => {
        if (isDisplayTodo == false) {
            dispatch(setIsNavUpdating(true))
        }
    }, [isDisplayTodo])

    const _header = useMemo(() => {
        const todoCount = (toDoRequests?.length ?? 0) + (toDoInvRequests?.length ?? 0) + (attendanceModificationRequest?.length ?? 0)
        return (
            <View>
                <View
                    style={{
                        paddingHorizontal: 10,
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 63,
                    }}>
                    <View
                        style={{
                            paddingHorizontal: 10,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}>
                        <View
                            style={{
                                flexDirection: 'column',
                                flex: 2,
                            }}>
                            <IconParam paramName={t('common:NoOfSites')} color={siteIconColor} iconName={'site'} count={sitesCount} style={{ height: '100%' }} />
                        </View>
                        <View
                            style={{
                                flexDirection: 'column',
                                flex: 2,
                                flexShrink: 2,
                            }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    flex: 2,
                                }}>
                                <IconParam
                                    hasBorder={false}
                                    paramName={t('common:NoOfOperations')}
                                    suffix={t('common:Name')}
                                    color={workerIconColor}
                                    iconName={'attend-worker'}
                                    count={arrangedWorkersCount}
                                />
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'flex-start',
                                        alignItems: 'center',
                                    }}>
                                    <Text
                                        style={{
                                            lineHeight: 13,
                                            fontSize: 11,
                                            fontFamily: FontStyle.regular,
                                            color: unReportColor,
                                        }}>
                                        ({t('common:Unreported')}
                                    </Text>
                                    <Text
                                        style={{
                                            lineHeight: 14,
                                            fontSize: 12,
                                            marginLeft: 5,
                                            fontFamily: FontStyle.regular,
                                            color: unReportColor,
                                        }}>
                                        {unReportedWorkersCount}
                                    </Text>
                                    <Text
                                        style={{
                                            lineHeight: 16,
                                            fontSize: 9,
                                            marginLeft: 2,
                                            fontFamily: FontStyle.regular,
                                            color: unReportColor,
                                        }}>
                                        {t('common:Name')}
                                    </Text>
                                    <Text
                                        style={{
                                            lineHeight: 13,
                                            fontSize: 11,
                                            fontFamily: FontStyle.regular,
                                            color: unReportColor,
                                        }}>
                                        )
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <Pressable
                            style={{
                                width: 40,
                                flex: 1,
                                flexShrink: 1,
                                flexDirection: 'row',
                                justifyContent: 'flex-end',
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
                                        text: `${t('admin:EditAttendance')}`,
                                        onPress: () => {
                                            setDisplayScreen ? setDisplayScreen('AllSiteAttendancesManage') : null
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
                    {todoCount > 0 && (
                        <Pressable
                            style={{
                                paddingHorizontal: 10,
                                flexDirection: 'row',
                            }}
                            onPress={() =>
                                setState((prev) => ({
                                    ...prev,
                                    isDisplayTodo: true,
                                }))
                            }>
                            <IconParam paramName={t('admin:unapproved')} iconName={'transaction'} withBatch={true} count={todoCount} />
                        </Pressable>
                    )}
                </View>
                {alerts?.length != 0 && (
                    <View
                        style={{
                            marginTop: 5,
                            paddingHorizontal: 10,
                        }}>
                        {alerts?.map((alert, index) => {
                            return (
                                <Pressable
                                    key={index}
                                    style={{
                                        marginTop: 5,
                                    }}
                                    onPress={() => {
                                        if (alert.screenName) {
                                            navigation.push(alert.screenName as never, alert.params as never)
                                        }
                                    }}>
                                    <AlertMessage isWhite={true} message={alert.message} batchCount={alert.batchCount} />
                                </Pressable>
                            )
                        })}
                    </View>
                )}
                <Line style={{ marginTop: 5 }} />
            </View>
        )
    }, [toDoRequests, toDoInvRequests, alerts, dateData, activeDepartmentIds, myCompanyId, attendanceModificationRequest])

    const _content: ListRenderItem<DateAttendanceType> = (info: ListRenderItemInfo<DateAttendanceType>) => {
        const { item, index } = info

        /**
         * item.siteIdがある場合は、現場
         * item.invRequestIdがある場合は、作業員元申請
         */
        return (
            <View key={index}>
                {item?.siteId && (
                    <DateAttendance
                        style={{
                            marginHorizontal: 10,
                            marginTop: 10,
                        }}
                        key={index}
                        site={item}
                    />
                )}
                {item?.invRequestId &&
                    item?.myCompanyId == myCompanyId && ( //常用で来ている場合、勤怠は現場に紐づいて表示されるため、ここでは表示しない
                        <InvRequestWithSites
                            style={{
                                marginHorizontal: 10,
                                marginTop: 10,
                            }}
                            key={item?.invRequestId ?? index}
                            invRequest={item}
                            myCompanyId={myCompanyId}
                            contentsType={'attendance'}
                        />
                    )}
            </View>
        )
    }

    const _footer = useMemo(
        () => () => {
            return <BottomMargin />
        },
        [],
    )

    const _onDateChange = async (_date: CustomDate) => {
        setState((prev) => ({ ...prev, date: _date }))
    }

    const siteIconColor = (sitesCount ?? 0) == 0 ? THEME_COLORS.OTHERS.ALERT_RED : '#000'
    const workerIconColor = (arrangedWorkersCount ?? 0) == 0 ? THEME_COLORS.OTHERS.ALERT_RED : '#000'
    const unReportColor = (unReportedWorkersCount ?? 0) > 0 ? THEME_COLORS.OTHERS.ALERT_RED : '#000'
    const _onRefresh = async () => {
        if (isFocused) dispatch(setLoading(true))
        dispatch(setIsNavUpdating(true))
    }

    const _siteNumber = (a: SiteType | InvRequestType): number => {
        const siteId = (a as SiteType)?.siteId
        const invRequestId = (a as InvRequestType)?.invRequestId

        if (siteId !== undefined) {
            const { siteNameData } = a as SiteType
            return siteNameData?.siteNumber !== undefined ? siteNameData.siteNumber : 1
        } else if (invRequestId !== undefined) {
            const { site } = a as InvRequestType
            return site?.siteNameData?.siteNumber !== undefined ? site?.siteNameData?.siteNumber : 1
        }
        return 1
    }

    //部署での絞り込みは、Routerでも行っているが、即時反映されないためここでも行っている。他に良い方法があれば。
    const displayData = useMemo(
        () =>
            [
                ...(dateData?.sites?.totalSites?.items ?? [])
                    .filter((data) => !(data.siteRelation == 'fake-company-manager' && data.fakeCompanyInvRequestId != undefined))
                    .filter(
                        (site) =>
                            site.construction?.contract?.receiveCompanyId != myCompanyId ||
                            checkMyDepartment({
                                targetDepartmentIds: site?.construction?.contract?.receiveDepartmentIds,
                                activeDepartmentIds,
                            }),
                    ),
                ...(dateData?.invRequests?.totalInvRequests?.items ?? []),
            ].sort((a, b) => (_siteNumber(a) < _siteNumber(b) ? -1 : 1)),
        [dateData?.sites, dateData?.invRequests],
    )

    useMemo(() => {
        if (isFocused && (toDoRequests?.length ?? 0) + (toDoInvRequests?.length ?? 0) + (attendanceModificationRequest?.length ?? 0) > 0) {
            setState((prev) => ({
                ...prev,
                isDisplayTodo: true,
            }))
        }
    }, [isFocused])

    const _approveRequest = async (respondRequest: RequestType, _isApproval: boolean) => {
        try {
            dispatch(setLoading(true))
            const isApprovalResult = await updateRequestIsApproval({ requestId: respondRequest?.requestId, isApproval: _isApproval })
            if (isApprovalResult.error) {
                throw {
                    error: isApprovalResult.error,
                    errorCode: isApprovalResult.errorCode,
                }
            }

            const targetRequest = toDoRequests?.filter((request) => request?.siteId == respondRequest?.siteId)[0]
            //DateDataキャッシュを更新
            const _newSite: SiteType | undefined = targetRequest
                ? {
                      ...targetRequest.site,
                      companyRequests: {
                          receiveRequests: {
                              items: [...(targetRequest.site?.companyRequests?.receiveRequests?.items ?? [])].map((req) => {
                                  return { ...req, isApproval: _isApproval }
                              }),
                          },
                          totalRequests: {
                              items: [...(targetRequest.site?.companyRequests?.totalRequests?.items ?? [])].map((req) => {
                                  return { ...req, isApproval: _isApproval }
                              }),
                          },
                      },
                  }
                : undefined

            const _sites = toDoRequests?.filter((request) => request.requestId != targetRequest?.requestId).map((req) => req.site)

            const newDateData: DateDataType = {
                ...dateData,
                sites: {
                    ...dateData?.sites,
                    totalSites: {
                        items: uniqBy([...(dateData?.sites?.totalSites?.items ?? []), ...(_sites ?? []), _newSite], 'siteId').filter((data) => data != undefined) as SiteType[],
                    },
                },
                arrangementSummary: {
                    ...dateData?.arrangementSummary,
                    sitesCount: (dateData?.arrangementSummary?.sitesCount ?? 0) + (_isApproval ? 1 : 0),
                },
                updatedAt: Number(new Date()),
            }
            if (cachedKeyRef.current) {
                const cachedResult = await updateCachedData({ key: cachedKeyRef.current, value: newDateData })
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
            if (toDoRequests?.length == 1 && (toDoInvRequests?.length ?? 0) == 0) {
                setState((prev) => ({
                    ...prev,
                    isDisplayTodo: false,
                }))
            } else if (setToDoRequests) {
                setToDoRequests(toDoRequests?.filter((data) => data.requestId != respondRequest?.requestId) ?? [])
            }
            dispatch(
                setToastMessage({
                    text: _isApproval ? t('admin:Approved') : t('admin:Disapproved'),
                    type: 'success',
                } as ToastMessage),
            )
            if (isFocused) {
                dispatch(setLoading(false))
            }
            const companyIdAndDate = toIdAndMonthFromTotalSeconds(respondRequest?.companyId, respondRequest?.date)
            addUpdateScreens({
                dispatch,
                localUpdateScreens,
                updateScreens: [
                    {
                        screenName: 'CompanyInvoice',
                        idAndDates: [companyIdAndDate],
                    },
                    {
                        screenName: 'SiteDetail',
                        ids: [respondRequest?.siteId].filter((data) => data != undefined) as string[],
                    },
                ],
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
            if (isFocused) {
                dispatch(setLoading(false))
            }
        }
    }

    const _approveInvRequest = async (invRequest: InvRequestType, _isApproval: boolean) => {
        try {
            if (invRequest?.invRequestId == undefined) {
                throw {
                    error: 'IDがありません',
                    errorCode: 'APPROVE_INV_REQUEST',
                }
            }
            dispatch(setLoading(true))
            const isApprovalResult = await approveInvRequest({ invRequestId: invRequest?.invRequestId, isApproval: _isApproval })
            if (isApprovalResult.error) {
                dispatch(
                    setToastMessage({
                        text: isApprovalResult.error,
                    } as ToastMessage),
                )
            }

            //DateDataキャッシュを更新
            const _invRequest: InvRequestType = {
                ...invRequest,
                isApproval: _isApproval,
                invRequestStatus: _isApproval ? 'approval' : 'unauthorized',
            }
            const newDateData: DateDataType = {
                ...dateData,
                invRequests: {
                    ...dateData?.invRequests,
                    totalInvRequests: {
                        items: [
                            ...(dateData?.invRequests?.totalInvRequests?.items ?? []),
                            //toDoInvRequestsは渡されるdateDataからは除外されているがdateRouterに渡すdateDataキャッシュには存在しているため。TODO:別枠で保存したほうがよさそう。
                            ...(toDoInvRequests?.filter((data) => data.invRequestId != _invRequest.invRequestId) ?? []),
                            _invRequest,
                        ].filter((data) => data != undefined) as InvRequestType[],
                    },
                    receiveInvRequests: {
                        items: [
                            ...(dateData?.invRequests?.receiveInvRequests?.items ?? []),
                            ...(toDoInvRequests?.filter((data) => data.invRequestId != _invRequest.invRequestId) ?? []),
                            _invRequest,
                        ].filter((data) => data != undefined) as InvRequestType[],
                    },
                },
                updatedAt: Number(new Date()),
            }
            if (cachedKeyRef.current) {
                const cachedResult = await updateCachedData({ key: cachedKeyRef.current, value: newDateData })
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
            if (toDoInvRequests?.length == 1 && (toDoRequests?.length ?? 0) == 0) {
                setState((prev) => ({
                    ...prev,
                    isDisplayTodo: false,
                }))
            } else if (setToDoInvRequests) {
                setToDoInvRequests(toDoInvRequests?.filter((data) => data.invRequestId != invRequest?.invRequestId) ?? [])
            }
            if (isFocused) {
                dispatch(setLoading(false))
            }
            dispatch(
                setToastMessage({
                    text: _isApproval ? t('admin:Approved') : t('admin:Disapproved'),
                    type: 'success',
                } as ToastMessage),
            )
            const companyIdAndDate = toIdAndMonthFromTotalSeconds(invRequest?.myCompanyId, invRequest?.date)
            addUpdateScreens({
                dispatch,
                localUpdateScreens,
                updateScreens: [
                    {
                        screenName: 'CompanyInvoice',
                        idAndDates: [companyIdAndDate],
                    },
                    {
                        screenName: 'InvRequestDetail',
                        ids: [invRequest?.invRequestId].filter((data) => data != undefined) as string[],
                    },
                ],
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
            if (isFocused) {
                dispatch(setLoading(false))
            }
        }
    }
    const _approveTargetAttendanceModification = async (attendanceModificationId?: string, targetAttendanceId?: string, _isApproval?: boolean) => {
        try {
            dispatch(setLoading(true))
            if (_isApproval == true) {
                const isApprovalResult = await approveTargetAttendanceModification({ attendanceModificationId, targetAttendanceId })
                if (isApprovalResult.error) {
                    dispatch(
                        setToastMessage({
                            text: isApprovalResult.error,
                        } as ToastMessage),
                    )
                }
            } else if (_isApproval == false) {
                const isApprovalResult = await unApproveTargetAttendanceModification({ attendanceModificationId, targetAttendanceId })
                if (isApprovalResult.error) {
                    dispatch(
                        setToastMessage({
                            text: isApprovalResult.error,
                        } as ToastMessage),
                    )
                }
            }

            if ((toDoInvRequests?.length ?? 0) == 0 && (toDoRequests?.length ?? 0) == 0 && (attendanceModificationRequest?.length ?? 0) == 1) {
                setState((prev) => ({
                    ...prev,
                    isDisplayTodo: false,
                    attendanceModificationRequest: attendanceModificationRequest?.filter((data) => data.attendanceId != targetAttendanceId) ?? [],
                }))
            } else {
                setState((prev) => ({
                    ...prev,
                    attendanceModificationRequest: attendanceModificationRequest?.filter((data) => data.attendanceId != targetAttendanceId) ?? [],
                }))
            }
            if (isFocused) {
                dispatch(setLoading(false))
            }
            //DateDataキャッシュを更新
            const _totalInvRequests: InvRequestType[] =
                dateData?.invRequests?.totalInvRequests?.items?.map((inv) => {
                    return {
                        ...inv,
                        attendances: inv.attendances
                            ?.map((att) =>
                                att.arrangement?.attendanceModification?.attendanceModificationId == attendanceModificationId
                                    ? ({
                                          ...att,
                                          arrangement: {
                                              ...att.arrangement,
                                              attendanceModification: {
                                                  ...att.arrangement?.attendanceModification,
                                                  status: _isApproval ? 'approval' : 'unapproved',
                                              },
                                          },
                                      } as AttendanceType)
                                    : att,
                            )
                            .filter((data) => data != undefined) as AttendanceType[],
                    } as InvRequestType
                }) ?? []
            const _orderInvRequests: InvRequestType[] =
                dateData?.invRequests?.orderInvRequests?.items?.map((inv) => {
                    return {
                        ...inv,
                        attendances: inv.attendances
                            ?.map((att) =>
                                att.arrangement?.attendanceModification?.attendanceModificationId == attendanceModificationId
                                    ? ({
                                          ...att,
                                          arrangement: {
                                              ...att.arrangement,
                                              attendanceModification: {
                                                  ...att.arrangement?.attendanceModification,
                                                  status: _isApproval ? 'approval' : 'unapproved',
                                              },
                                          },
                                      } as AttendanceType)
                                    : att,
                            )
                            .filter((data) => data != undefined) as AttendanceType[],
                    } as InvRequestType
                }) ?? []
            const _totalSites = dateData?.sites?.totalSites?.items?.map((site) => {
                return {
                    ...site,
                    allArrangements: {
                        ...site.allArrangements,
                        items: site.allArrangements?.items?.map((arr) => {
                            return {
                                ...arr,
                                attendanceModification:
                                    arr.attendanceModification?.attendanceModificationId == attendanceModificationId
                                        ? {
                                              ...arr.attendanceModification,
                                              status: _isApproval ? 'approval' : 'unapproved',
                                          }
                                        : arr.attendanceModification,
                            } as ArrangementType
                        }),
                    },
                } as SiteType
            })

            const newDateData: DateDataType = {
                ...dateData,
                invRequests: {
                    ...dateData?.invRequests,
                    totalInvRequests: {
                        items: _totalInvRequests,
                    },
                    orderInvRequests: {
                        items: _orderInvRequests,
                    },
                },
                sites: {
                    ...dateData?.sites,
                    totalSites: {
                        items: _totalSites,
                    },
                },
                updatedAt: Number(new Date()),
            }
            if (cachedKeyRef.current) {
                const cachedResult = await updateCachedData({ key: cachedKeyRef.current, value: newDateData })
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
            dispatch(
                setToastMessage({
                    text: _isApproval ? t('admin:Approved') : t('admin:Disapproved'),
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
        } finally {
            if (isFocused) {
                dispatch(setLoading(false))
            }
        }
    }
    return (
        <>
            <SwitchPage
                dateUpdate={dateUpdate}
                dateInitValue={date ?? initDate}
                dateType={'day'}
                data={displayData}
                header={_header}
                content={_content}
                emptyProps={
                    loading
                        ? undefined
                        : {
                              text: t('common:SiteNotExist'),
                          }
                }
                onRefresh={_onRefresh}
                footer={_footer}
                onDateChange={_onDateChange}
            />
            {isDisplayTodo && (
                <BaseModal style={{borderRadius:10}} onClose={() => setState((prev) => ({ ...prev, isDisplayTodo: false }))} isVisible={isDisplayTodo}>
                    <TodoList
                        toDoInvRequests={toDoInvRequests}
                        toDoRequests={toDoRequests}
                        attendanceModificationArrangement={attendanceModificationRequest}
                        _approveRequest={_approveRequest}
                        _approveInvRequest={_approveInvRequest}
                        _approveTargetAttendanceModification={_approveTargetAttendanceModification}
                    />
                </BaseModal>
            )}
        </>
    )
}
export default DateAttendances

const styles = StyleSheet.create({})
