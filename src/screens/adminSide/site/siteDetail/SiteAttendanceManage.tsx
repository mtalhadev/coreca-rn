import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, StyleSheet, ListRenderItem, ListRenderItemInfo, FlatList } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { EmptyScreen } from '../../../../components/template/EmptyScreen'
import { SiteAttendance } from '../../../../components/organisms/site/SiteAttendance'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { StoreType } from '../../../../stores/Store'
import { useIsFocused } from '@react-navigation/native'
import { deleteParamOfLocalUpdateScreens, setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { AppButton } from '../../../../components/atoms/AppButton'
import { SiteAttendanceCompanyType, SiteAttendanceDataType } from '../../../../models/attendance/SiteAttendanceDataType'
import { IconParam } from '../../../../components/organisms/IconParam'
import { THEME_COLORS } from '../../../../utils/Constants'
import { Line } from '../../../../components/atoms/Line'
import { updateCachedData, getCachedData, genKeyName } from '../../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { getUuidv4 } from '../../../../utils/Utils'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { _getFirestore } from '../../../../services/firebase/FirestoreService'
import { SiteAttendanceModel } from '../../../../models/attendance/SiteAttendance'
import { getLastLoggedInAtTargetWorker } from '../../../../usecases/userInfo/userInfoCase'
import { InvRequestType } from '../../../../models/invRequest/InvRequestType'
import { SiteType } from '../../../../models/site/Site'
import { getInvRequest, getInvRequestDetail } from '../../../../usecases/invRequest/invRequestCase'
import DisplayIdInDev from '../../../../components/atoms/DisplayIdInDEV'
import { dayBaseText } from '../../../../models/_others/CustomDate'
import { FontStyle } from '../../../../utils/Styles'
import isEmpty from 'lodash/isEmpty'

type NavProps = StackNavigationProp<RootStackParamList, 'SiteAttendanceManage'>
type RouteProps = RouteProp<RootStackParamList, 'SiteAttendanceManage'>

type InitialStateType = {
    siteAttendances?: SiteAttendanceDataType
    site?: SiteType
    invRequest?: InvRequestType
    companyWorkersLastLoggedIn?: CompanyWorkersLastLoggedInType[]
    isFetching: boolean
}

type CompanyWorkersLastLoggedInType = {
    companyId?: string
    workersLastLoggedIn?: WorkerLastLoggedInType[]
}

export type WorkerLastLoggedInType = {
    workerId?: string
    lastLoggedInAt?: number
}

const initialState: InitialStateType = {
    isFetching: false,
}

const SiteAttendanceManage = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ siteAttendances, site, invRequest, companyWorkersLastLoggedIn, isFetching }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const siteId = route.params?.siteId
    const requestId = route.params?.requestId
    const invRequestId = route.params?.invRequestId
    const siteNumber = route.params?.siteNumber
    const date = route.params?.date
    const myCompanyId = useSelector((state: StoreType) => state?.account?.belongCompanyId)
    const loading = useSelector((state: StoreType) => state?.util?.loading)
    const signInUser = useSelector((state: StoreType) => state?.account?.signInUser)
    const cachedSiteAttendancesKey = genKeyName({
        screenName: 'SiteAttendanceManage',
        accountId: signInUser?.accountId ?? '',
        siteId: siteId ?? invRequestId ?? '',
        companyId: myCompanyId ?? '',
    })
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const unsubscribeRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)

    useSafeUnmount(setState, initialState)

    const editable = (siteAttendances?.siteRelation == 'manager' || siteAttendances?.siteRelation == 'fake-company-manager' || requestId != undefined || invRequestId != undefined) && loading == false
    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        navigation.setOptions({
            title: site?.siteNameData?.name ?? (invRequest?.targetCompany?.name ? `${invRequest?.targetCompany?.name}` + `${t('admin:ToApply')}` : t('admin:AttendanceList')),
            headerTitleContainerStyle: {
                right: 20,
            },
        })
    }, [site?.siteNameData?.name, invRequest?.targetCompany?.name])

    useEffect(() => {
        ;(async () => {
            try {
                if ((siteId == undefined && invRequestId == undefined) || signInUser == undefined || myCompanyId == undefined || isFetching != true) {
                    return
                }
                if (siteAttendances && !isNavUpdating) {
                    dispatch(setLoading('inVisible'))
                } else {
                    if (isFocused) {
                        dispatch(setLoading(true))
                    }
                }

                if (!isFocused) {
                    return
                }
                // SSG対応前
                // if (siteId) {
                //     const result = await getAttendanceDataOfTargetSite({
                //         siteId: siteId,
                //         myCompanyId,
                //         myWorkerId: signInUser?.workerId,
                //         requestId: requestId,
                //     })
                //     if (result.error) {
                //         throw {
                //             error: result.error,
                //         }
                //     }
                //     setState((prev) => ({ ...prev, siteAttendances: result.success?.siteAttendanceData, site: result.success?.site }))
                //     /**
                //      * キャッシュアップデート前に先に表示データを更新。
                //      */
                //     const cachedSiteAttendancesResult = await updateCachedData({
                //         key: cachedSiteAttendancesKey,
                //         value: { attendances: result.success?.siteAttendanceData, site: result.success?.site },
                //     })
                //     if (cachedSiteAttendancesResult.error) {
                //         dispatch(
                //             setToastMessage({
                //                 text: cachedSiteAttendancesResult.error,
                //                 type: 'error',
                //             }),
                //         )
                //     }
                // } else if (invRequestId) {
                //     const result = await getAttendanceDataOfTargetInvRequest({
                //         myCompanyId,
                //         invRequestId,
                //         myWorkerId: signInUser?.workerId,
                //     })
                //     if (result.error) {
                //         throw {
                //             error: result.error,
                //         }
                //     }
                //     setState((prev) => ({
                //         ...prev,
                //         siteAttendances: result.success?.siteAttendanceData,
                //         invRequest: result.success?.invRequest,
                //         site: result.success?.site,
                //         siteId: result.success?.site?.siteId,
                //     }))
                //     /**
                //      * キャッシュアップデート前に先に表示データを更新。
                //      */
                //     const cachedSiteAttendancesResult = await updateCachedData({
                //         key: cachedSiteAttendancesKey,
                //         value: { attendances: result.success?.siteAttendanceData, invRequest: result.success?.invRequest, site: result.success?.site, siteId: result.success?.site?.siteId },
                //     })
                //     if (cachedSiteAttendancesResult.error) {
                //         dispatch(
                //             setToastMessage({
                //                 text: cachedSiteAttendancesResult.error,
                //                 type: 'error',
                //             }),
                //         )
                //     }
                // }

                // SSG対応後
                const db = _getFirestore()
                unsubscribeRef.current = db
                    .collection('SiteAttendance')
                    .where('companyId', '==', myCompanyId)
                    .where('siteId', '==', siteId ?? invRequestId ?? 'no-id')
                    .onSnapshot(async (data) => {
                        const _siteAttendance = (data?.docs?.map((doc) => doc?.data())[0] ?? []) as SiteAttendanceModel
                        const siteAttendanceCacheData = await getCachedData<SiteAttendanceModel>(cachedSiteAttendancesKey)
                        if (siteAttendanceCacheData.success) {
                            if (siteAttendanceCacheData.success.updatedAt && _siteAttendance.updatedAt && siteAttendanceCacheData.success.updatedAt > _siteAttendance.updatedAt) {
                                // キャッシュよりDBが古い場合、更新しない
                                setState((prev) => ({
                                    ...prev,
                                    siteAttendances: siteAttendanceCacheData.success?.siteAttendanceData,
                                    site: siteAttendanceCacheData.success?.site,
                                    invRequest: siteAttendanceCacheData.success?.invRequest,
                                }))
                                dispatch(setLoading(false))
                                return
                            }
                        }
                        let _invRequest: InvRequestType | undefined
                        if (_siteAttendance.invRequest == undefined) {
                            const result = await getInvRequest({
                                invRequestId,
                            })
                            _invRequest = result.success
                        }
                        setState((prev) => ({
                            ...prev,
                            siteAttendances: _siteAttendance?.siteAttendanceData,
                            site: _siteAttendance.site,
                            invRequest: _siteAttendance.invRequest ?? _invRequest,
                        }))
                        dispatch(setLoading(false))
                        const cachedResult = await updateCachedData({ key: cachedSiteAttendancesKey, value: _siteAttendance ?? {} })
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
                const result = await getCachedData<SiteAttendanceModel>(cachedSiteAttendancesKey)
                if (result.success) {
                    setState((prev) => ({
                        ...prev,
                        siteAttendances: result.success?.siteAttendanceData,
                        site: result.success?.site,
                        invRequest: result.success?.invRequest,
                    }))
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
            } finally {
                setState((prev) => ({ ...prev, isFetching: false }))
                if (isFocused) {
                    dispatch(setIsNavUpdating(false))
                    dispatch(setLoading(false))
                }
            }
        })()
    }, [isFetching])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
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
        // 作業員の最終ログイン時刻を取得
        if (!isEmpty(siteAttendances) && isFocused) {
            ;(async () => {
                const companyWorkerIds =
                    siteAttendances?.siteCompanies
                        ?.map((siteCompany) => {
                            const companyId = siteCompany?.company?.companyId
                            if (companyId) {
                                const workerIds = siteCompany?.arrangedWorkers?.map((arrangedWorker) => arrangedWorker?.worker?.workerId)
                                return { companyId, workerIds: workerIds ?? [] }
                            }
                            return undefined
                        })
                        ?.filter((data) => data != undefined) ?? []

                const _companyWorkersLastLoggedIn = (await Promise.all(
                    companyWorkerIds.map(async (item) => {
                        const workersLastLoggedIn = await Promise.all(
                            item?.workerIds
                                ?.map(async (workerId) => {
                                    if (workerId) {
                                        const userInfoResult = await getLastLoggedInAtTargetWorker({ userInfoId: workerId })
                                        return { workerId, lastLoggedInAt: userInfoResult.success ? userInfoResult.success : undefined }
                                    }
                                    return undefined
                                })
                                ?.filter((data) => data != undefined) ?? [],
                        )

                        return { companyId: item?.companyId, workersLastLoggedIn }
                    }),
                )) as CompanyWorkersLastLoggedInType[]

                setState((prev) => ({ ...prev, companyWorkersLastLoggedIn: _companyWorkersLastLoggedIn }))
            })()
        }
    }, [isFocused, siteAttendances])

    const _content: ListRenderItem<SiteAttendanceCompanyType> = (info: ListRenderItemInfo<SiteAttendanceCompanyType>) => {
        const { item, index } = info
        if (invRequest && invRequest.isApplication == false && invRequest.myCompanyId != myCompanyId) {
            return <></>
        }

        const workersLastLoggedIn = companyWorkersLastLoggedIn?.find((companyWorker) => companyWorker?.companyId == item.company?.companyId)?.workersLastLoggedIn

        return (
            <SiteAttendance
                key={item.company?.companyId ?? index}
                siteAttendance={item}
                editable={editable}
                side={'admin'}
                siteId={siteId}
                style={{
                    marginHorizontal: 10,
                    marginTop: 10,
                }}
                isMyCompany={item.company?.companyId == myCompanyId}
                workersLastLoggedIn={workersLastLoggedIn}
            />
        )
    }

    const _header = () => {
        const unReportCount = siteAttendances?.unReportedCount
        const waitingCount = siteAttendances?.waitingCount
        /**
         * 応答待ちはカウントしない。会社ごとの作業員カウントの合計と等しくするため。
         */
        const arrangeCount = siteAttendances?.actualWorkerCount
        return (
            <>
                <View
                    style={{
                        paddingTop: 10,
                        paddingHorizontal: 10,
                        backgroundColor: '#fff',
                    }}>
                    {date != undefined && (
                        <Text
                            style={{
                                fontFamily: FontStyle.bold,
                                fontSize: 14,
                                lineHeight: 16,
                                textAlign: 'center',
                                paddingVertical: 3,
                            }}>
                            {dayBaseText(date)}
                        </Text>
                    )}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 10,
                        }}>
                        <IconParam paramName={t('common:NoOfOperations')} suffix={t('common:Name')} count={arrangeCount} iconName={'attend-worker'} />
                        {siteId && (
                            <IconParam
                                paramName={t('common:WaitingForAResponse')}
                                suffix={t('common:Name')}
                                hasBorder
                                count={waitingCount}
                                color={(waitingCount ?? 0) > 0 ? THEME_COLORS.OTHERS.ALERT_RED : '#000'}
                                iconName={'worker'}
                            />
                        )}
                        <IconParam
                            paramName={t('common:Unreported')}
                            suffix={t('common:Name')}
                            hasBorder
                            count={unReportCount}
                            color={(unReportCount ?? 0) > 0 ? THEME_COLORS.OTHERS.ALERT_RED : '#000'}
                            iconName={'worker'}
                        />
                    </View>
                    {siteId && (
                        <AppButton
                            title={t('admin:SiteDetails')}
                            height={30}
                            onPress={() =>
                                navigation.push('SiteDetail', {
                                    siteId: siteId,
                                    requestId: siteAttendances?.siteRelation == 'fake-company-manager' ? undefined : requestId,
                                    title: site?.siteNameData?.name,
                                    siteNumber: siteNumber,
                                })
                            }
                            style={{ marginBottom: 10 }}
                            isGray
                        />
                    )}
                    {siteId == undefined && invRequestId && (
                        <AppButton
                            title={t('admin:SendYourSupport') + t('admin:Details')}
                            height={30}
                            onPress={() => navigation.push('InvRequestDetail', { invRequestId: invRequestId, type: 'order' })}
                            style={{ marginBottom: 10 }}
                            isGray
                        />
                    )}
                    {siteAttendances?.siteRelation != 'order-children' && siteId && (siteAttendances?.targetAttendances?.items?.length ?? 0) > 0 && (
                        <AppButton
                            title={t('admin:CollectiveAttendanceRegisteration')}
                            height={30}
                            onPress={() => navigation.push('EditBundleAttendance', { siteId: siteId, requestId: siteAttendances?.siteRelation == 'fake-company-manager' ? undefined : requestId })}
                            style={{ marginBottom: 10 }}
                        />
                    )}
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

    return (
        <FlatList
            style={{}}
            listKey={listKey}
            data={siteAttendances?.siteCompanies}
            keyExtractor={(item, index) => index.toString()}
            renderItem={_content}
            ListHeaderComponent={_header}
            ListFooterComponent={() => {
                // if (__DEV__) {
                    return (
                        <>
                            <DisplayIdInDev id={siteId} label="siteId" />
                            <DisplayIdInDev id={requestId} label="requestId" />
                            <DisplayIdInDev id={invRequestId} label="invRequestId" />
                            <DisplayIdInDev id={myCompanyId} label="myCompanyId" />
                            <BottomMargin />
                        </>
                    )
                // } else {
                //     return <BottomMargin />
                // }
            }}
            ListEmptyComponent={
                (loading && siteAttendances?.siteRelation) || siteAttendances?.siteRelation == undefined ? (
                    <></>
                ) : (
                    <EmptyScreen
                        text={
                            siteAttendances?.siteRelation == 'fake-company-manager' || siteAttendances?.siteRelation == 'manager'
                                ? t('admin:NoWorkerYetArranged')
                                : t('admin:AttendanceCannotControlledAtBrokerage')
                        }
                    />
                )
            }
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
        />
    )
}
export default SiteAttendanceManage

const styles = StyleSheet.create({})
