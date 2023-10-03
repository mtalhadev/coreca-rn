import React, { useState, useEffect, useContext, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, ListRenderItem, ListRenderItemInfo, FlatList } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { useIsFocused } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { IconParam } from '../../../components/organisms/IconParam'
import { SiteAttendance } from '../../../components/organisms/site/SiteAttendance'
import { EmptyScreen } from '../../../components/template/EmptyScreen'
import { SiteAttendanceDataType, SiteAttendanceCompanyType } from '../../../models/attendance/SiteAttendanceDataType'
import { SiteType } from '../../../models/site/Site'
import { StoreType } from '../../../stores/Store'
import { deleteParamOfLocalUpdateScreens, setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { getAttendanceDataOfTargetSite } from '../../../usecases/attendance/SiteAttendanceCase'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { RootStackParamList } from '../../Router'
import { Line } from '../../../components/atoms/Line'
import { WSiteRouterContext } from './WSiteRouter'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { updateCachedData, getCachedData, genKeyName } from '../../../usecases/CachedDataCase'
import { getUuidv4 } from '../../../utils/Utils'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { deleteParamOfUpdateScreens, checkUpdateOfTargetScreen } from '../../../usecases/updateScreens/CommonUpdateScreensCase'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { CustomDate, isTodayOrBefore, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'

type NavProps = StackNavigationProp<RootStackParamList, 'WSiteWorkerList'>
type RouteProps = RouteProp<RootStackParamList, 'WSiteWorkerList'>

type InitialStateType = {
    siteAttendances?: SiteAttendanceDataType
    site?: SiteType
    isFetching: boolean
    updateCache: number
}

type CacheWSiteWorkerListType = {
    siteAttendances: SiteAttendanceDataType
    site: SiteType
}

const initialState: InitialStateType = {
    isFetching: false,
    updateCache: 0,
}

const WSiteWorkerList = () => {
    const { t, i18n } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ siteAttendances, site, isFetching, updateCache }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const { siteId, update } = useContext(WSiteRouterContext)
    const myCompanyId = useSelector((state: StoreType) => state?.account?.belongCompanyId)
    const loading = useSelector((state: StoreType) => state?.util?.loading)
    const signInUser = useSelector((state: StoreType) => state?.account?.signInUser)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const accountId = signInUser?.accountId ?? ''
    const cachedWSiteWorkerListKey = genKeyName({ screenName: 'WSiteWokerList', accountId: accountId, siteId: siteId ?? '', companyId: myCompanyId ?? '', workerId: signInUser?.workerId ?? '' })

    useSafeUnmount(setState, initialState)

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))
            /**
             * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
             */
            ;(async () => {
                const isUpdateResult = await checkUpdateOfTargetScreen({ targetId: siteId, accountId: signInUser?.accountId, targetScreenName: 'WSiteWorkerList', localUpdateScreens })
                if (isUpdateResult.success) {
                    dispatch(setIsNavUpdating(true))
                }
            })()
        }
    }, [isFocused])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (isFocused && siteId && signInUser && myCompanyId) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))
        }
    }, [siteId, signInUser, myCompanyId, update])

    useEffect(() => {
        if (signInUser) {
            return () => setState(initialState)
        }
    }, [signInUser])

    useEffect(() => {
        ;(async () => {
            try {
                if (siteId == undefined || signInUser == undefined || myCompanyId == undefined || isFetching != true || !isFocused) {
                    return
                }
                if (siteAttendances && !isNavUpdating) {
                    dispatch(setLoading('inVisible'))
                } else {
                    if (isFocused) {
                        dispatch(setLoading(true))
                    }
                }
                const result = await getAttendanceDataOfTargetSite({
                    siteId,
                    myCompanyId,
                    myWorkerId: signInUser?.workerId,
                })
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                setState((prev) => ({ ...prev, siteAttendances: result.success?.siteAttendanceData, site: result.success?.site }))
                const cachedResult = await updateCachedData({ key: cachedWSiteWorkerListKey, value: { siteAttendances: result.success?.siteAttendanceData ?? {}, site: result.success?.site ?? {} } })
                if (cachedResult.error) {
                    dispatch(
                        setToastMessage({
                            text: cachedResult.error,
                            type: 'error',
                        }),
                    )
                }
                deleteParamOfLocalUpdateScreens({
                    screens: localUpdateScreens,
                    screenName: 'WSiteWorkerList',
                    id: siteId,
                    paramName: 'ids',
                })
                await deleteParamOfUpdateScreens({
                    accountId,
                    screenName: 'WSiteWorkerList',
                    id: siteId,
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
                setState((rev) => ({ ...rev, isFetching: false }))
                if (isFocused) {
                    dispatch(setIsNavUpdating(false))
                    dispatch(setLoading(false))
                }
            }
        })()
    }, [isFetching])

    /**
     * @summary updateCacheフラグ更新時の副作用フック（KVSから表示データを取得更新）
     * @purpose アプリ側にKVSによるキャッシュを設けて一覧の初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            if (updateCache) {
                const result = await getCachedData<CacheWSiteWorkerListType>(cachedWSiteWorkerListKey)
                if (result.error) {
                    if (result.errorCode != 'FIRST_FETCH') {
                        dispatch(
                            setToastMessage({
                                text: result.error,
                                type: 'error',
                            }),
                        )
                    }
                    setState((rev) => ({ ...rev, isFetching: true }))
                } else {
                    setState((rev) => ({ ...rev, siteAttendances: result.success?.siteAttendances, site: result.success?.site }))
                }
            }
        })()
    }, [updateCache])

    const _content: ListRenderItem<SiteAttendanceCompanyType> = (info: ListRenderItemInfo<SiteAttendanceCompanyType>) => {
        const { item, index } = info
        return (
            <SiteAttendance
                siteAttendance={item}
                side={'worker'}
                myWorkerId={signInUser?.workerId}
                editable={false}
                isTodayOrBefore={isTodayOrBefore(toCustomDateFromTotalSeconds(site?.startDate as number))}
                style={{
                    marginHorizontal: 10,
                    marginTop: 10,
                }}
            />
        )
    }

    const _header = () => {
        const arrangeCount = siteAttendances?.actualWorkerCount ?? 0

        return (
            <>
                <View
                    style={{
                        paddingTop: 10,
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
                        <IconParam paramName={'作業員'} suffix={'名'} count={arrangeCount} iconName={'worker'} />
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

    return (
        <FlatList
            style={{}}
            listKey={listKey}
            data={siteAttendances?.siteCompanies}
            keyExtractor={(item, index) => index.toString()}
            renderItem={_content}
            ListHeaderComponent={_header}
            ListFooterComponent={<BottomMargin />}
            ListEmptyComponent={loading ? <></> : <EmptyScreen text={t('worker:ristrictedSite')} />}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
        />
    )
}
export default WSiteWorkerList

const styles = StyleSheet.create({})
