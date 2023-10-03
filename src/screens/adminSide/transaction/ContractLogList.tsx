import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useMemo, useState } from 'react'
import { RootStackParamList } from '../../Router'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { useDispatch, useSelector } from 'react-redux'
import { StoreType } from '../../../stores/Store'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../fooks/useUnmount'
import { View, FlatList, ListRenderItem, RefreshControl, ListRenderItemInfo } from 'react-native'
import { ContractLogType } from '../../../models/contractLog/ContractLog'
import { ToastMessage, setLoading, setToastMessage } from '../../../stores/UtilSlice'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { genKeyName, getCachedData, updateCachedData } from '../../../usecases/CachedDataCase'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { EmptyScreen } from '../../../components/template/EmptyScreen'
import { getUuidv4 } from '../../../utils/Utils'
import { _getFirestore } from '../../../services/firebase/FirestoreService'
import { Contract } from '../../../components/organisms/contract/Contract'
import { getContractLogList } from '../../../usecases/contractLog/CommonContractLogCase'
import { ShadowBoxWithHeader } from '../../../components/organisms/shadowBox/ShadowBoxWithHeader'
import { match } from 'ts-pattern'
import { ContractType } from '../../../models/contract/Contract'

type NavProps = StackNavigationProp<RootStackParamList, 'ContractLogList'>
type RouteProps = RouteProp<RootStackParamList, 'ContractLogList'>
type InitialStateType = {
    displayData?: ContractLogType[]
    contract?: ContractType
    isFetching: boolean
}
const initialState: InitialStateType = {
    isFetching: false,
}

type ContractLogListCacheType = {
    displayData?: ContractLogType[]
    contract?: ContractType
}

const ContractLogList = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ isFetching, displayData, contract }, setState] = useState(initialState)

    const loading = useSelector((state: StoreType) => state.util.loading)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const contractId = route.params?.contractId

    // const unsubscribeRef = useRef<any>(null)
    // const isScreenOnRef = useRef<boolean>(false)

    const __cachedKey = genKeyName({
        screenName: 'ContractLogList',
        accountId: accountId,
        contractId: contractId as string,
    })

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating, isFocused])

    // 画面を閉じたときに時にonSnapshotをunsubscribeする
    // useEffect(() => {
    //     return () => {
    //         if (unsubscribeRef.current && isScreenOnRef.current) {
    //             unsubscribeRef.current()
    //             unsubscribeRef.current = null
    //             isScreenOnRef.current = false
    //         }
    //     }
    // }, [isFocused])

    // useEffect(() => {
    //     isScreenOnRef.current = isFocused
    // }, [isFocused])

    /**
     * 立ち上げと立ち退き時の挙動
     */
    useEffect(() => {
        setState((prev) => ({ ...prev, isFetching: true }))
        return () => {}
    }, [myCompanyId])

    useSafeLoadingUnmount(dispatch, isFocused)

    useSafeUnmount(setState, initialState)

    const content: ListRenderItem<ContractLogType> = (info: ListRenderItemInfo<ContractLogType>) => {
        const { item } = info
        return (
            <ShadowBoxWithHeader
                title={match(item.status)
                    .with('approved', () => t('admin:approved'))
                    .with('canceled', () => t('common:Cancel'))
                    .with('rejected', () => t('common:unauthorized'))
                    .with('waiting', () => t('common:waiting'))
                    .with('created', () => t('common:waiting'))
                    .with('delete', () => t('common:DeleteRequest'))
                    .otherwise(() => '')}
                style={{
                    marginTop: 10,
                    marginHorizontal: 10,
                }}>
                <Contract key={item.contractLogId} contract={item.contract} updateWorker={item.updateWorker} updatedAt={item.updatedAt} />
            </ShadowBoxWithHeader>
        )
    }

    useEffect(() => {
        ;(async () => {
            try {
                // if (!isScreenOnRef.current) return
                if (isFetching != true) return
                if (isFocused) dispatch(setLoading(true))
                /**
                 * 先にキャッシュを表示
                 */
                const result = await getCachedData<ContractLogListCacheType>(__cachedKey)
                if (result.success) {
                    setState((rev) => ({ ...rev, displayData: result.success?.displayData ?? [], contract: result.success?.contract }))
                }
                if (contractId == undefined) {
                    return
                }
                const contractLogResult = await getContractLogList({ contractId })
                setState((prev) => ({ ...prev, isFetching: false }))
                if (contractLogResult.error) {
                    throw {
                        error: contractLogResult.error,
                        errorCode: contractLogResult.errorCode,
                    }
                }
                //updatedAtが新しいもの順にソート。同時の場合は、キャンセルが下になるようにする
                const _displayData =
                    contractLogResult.success?.contractLogList?.totalContractLogs?.items?.sort((a, b) =>
                        (b.updatedAt ?? 0) - (a.updatedAt ?? 0) == 0 ? (b.status == 'canceled' ? -1 : 1) : (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
                    ) ?? []
                setState((prev) => ({
                    ...prev,
                    displayData: _displayData,
                    contract: contractLogResult.success?.contract,
                }))
                const cachedResult = await updateCachedData({
                    key: __cachedKey,
                    value: {
                        //updatedAtが新しいもの順にソート
                        displayData: _displayData,
                        contract: contractLogResult.success?.contract,
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
                //おそらく取得データ数は少ないのでSSG未対応。時間がかかるようなら対応した方がいい
                // const db = _getFirestore()
                // unsubscribeRef.current = db
                //     .collection('ContractLogList')
                //     .where('contractId', '==', contractId)
                //     .onSnapshot(async (data) => {
                //         const _displayData = data.docs.map((doc) => doc.data())[0] as ContractLogListModel | undefined
                //         setState((prev) => ({
                //             ...prev,
                //             isFetching: false,
                //             displayData: _displayData,
                //         }))
                //         const cachedResult = await updateCachedData({ key: __cachedKey, value: _displayData ?? [] })
                //         if (cachedResult.error) {
                //             const _error = cachedResult as CustomResponse
                //             dispatch(
                //                 setToastMessage({
                //                     text: getErrorToastMessage(_error),
                //                     type: 'error',
                //                 }),
                //             )
                //         }
                //     })
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
    }, [isFetching])

    const _onRefresh = async () => {
        setState((prev) => ({ ...prev, isFetching: true }))
    }

    const header = () => {
        return (
            <View
                style={{
                    marginHorizontal: 10,
                    marginTop: 10,
                }}>
                <Contract isOnlyCompany style={{ marginHorizontal: 10 }} contract={contract} />
            </View>
        )
    }
    const footer = () => {
        return <BottomMargin />
    }
    const listKey = useMemo(() => getUuidv4(), [])

    return (
        <FlatList
            data={displayData}
            listKey={listKey}
            keyExtractor={(item, index) => index.toString()}
            ListFooterComponent={footer}
            ListHeaderComponent={header}
            renderItem={content}
            ListEmptyComponent={<EmptyScreen text={t('common:NoInfoAvailable')} />}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl
                    progressViewOffset={-500} //not displaying progress indicator (android only)
                    refreshing={loading ? true : false}
                    onRefresh={_onRefresh}
                />
            }
            scrollEnabled={true}
        />
    )
}

export default ContractLogList
