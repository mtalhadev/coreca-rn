import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { isEmpty } from 'lodash'
import React, { useEffect, useState } from 'react'
import { FlatList, ListRenderItem, ListRenderItemInfo, RefreshControl, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { ChatSearchbar } from '../../../../components/organisms/chat/ChatSearchbar'
import { DMRoom } from '../../../../components/organisms/chat/DMRoom'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { RoomUserType } from '../../../../models/roomUser/RoomUser'
import { newCustomDate } from '../../../../models/_others/CustomDate'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { RootStackParamList } from '../../../../screens/Router'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { genKeyName, getCachedData, updateCachedData } from '../../../../usecases/CachedDataCase'
import { getDmList, GetDMListResponse } from '../../../../usecases/chat/ChatListCase'
import { checkUpdateOfTargetScreen, deleteScreenOfUpdateScreens } from '../../../../usecases/updateScreens/CommonUpdateScreensCase'
import { SCREEN_WIDTH, THEME_COLORS } from '../../../../utils/Constants'
import { SwitchAdminOrWorkerProps } from '../../../../utils/Utils'
import { AppButton } from '../../../atoms/AppButton'
import { Search } from '../../Search'
import { RoomUserUIType } from './ChatProjectList'
import { BottomMargin } from '../../../atoms/BottomMargin'

const CHATS: RoomUserUIType[] = [
    /*
	{ roomId: 'chat-1', roomType: 'company', imageUrl: 'https://i.pravatar.cc/50', name: '取引先', company: { name: '' }, lastMessage: "商品棚、設置完了山 山龙", createdAt: getCurrentTimestamp(), unreadCount: 12, },
	{ roomId: 'chat-2', roomType: 'project', imageUrl: 'https://i.pravatar.cc/50', name: '個人', company: { name: '酒井 啓介' } , lastMessage: "水道橋南小学校の件", createdAt: getCurrentTimestamp(), unreadCount: 12, },
	{ roomId: 'chat-3', roomType: 'custom', imageUrl: 'https://i.pravatar.cc/50', name: '力又夕公', company: { name: '社内管理者用' }, lastMessage: "最近、進捗遲机 困 工事在共有 ！", createdAt: getCurrentTimestamp(), unreadCount: 12, },
	{ roomId: 'chat-4', roomType: 'company', imageUrl: 'https://i.pravatar.cc/50', name: '取引先', company: { name: '株式会社中山建設' }, lastMessage: "ABC書店の件、非常化助办门去龙！", createdAt: getCurrentTimestamp(), unreadCount: 12, },
    */
]

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    filteredDms?: RoomUserUIType[]
    allDms?: RoomUserUIType[]
    updateCache: number
    refreshing: boolean
}
const initialState: InitialStateType = {
    allDms: CHATS,
    updateCache: 0,
    refreshing: false,
}

const DMRoomList = (props: Partial<SwitchAdminOrWorkerProps>) => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const side = props.side ?? 'admin'
    const screenName: string = side == 'admin' ? 'AdminDMRoomList' : 'WorkerDMRoomList'
    const { t } = useTextTranslation()

    const [{ filteredDms, allDms, updateCache, refreshing }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const accountId = signInUser?.accountId ?? ''
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)

    const cachedDMRoomListKey = genKeyName({ screenName: screenName, accountId: accountId, companyId: myCompanyId ?? '' })

    const [textFilter, setTextFilter] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))

            /**
             * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
             */
            ;(async () => {
                const isUpdateResult = await checkUpdateOfTargetScreen({
                    accountId: signInUser?.accountId,
                    targetScreenName: screenName,
                    localUpdateScreens,
                })
                if (isUpdateResult.success) {
                    dispatch(setIsNavUpdating(true))
                }
            })()
        }
    }, [isFocused])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, refreshing: true }))
        }
    }, [isNavUpdating])

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(signInUser?.workerId) || refreshing != true) {
                    dispatch(setIsNavUpdating(false))
                    setState((prev) => ({ ...prev, refreshing: false }))
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const dmListResult: CustomResponse<GetDMListResponse> = await getDmList({
                    myWorkerId: signInUser?.workerId ?? 'no-id',
                    myCompanyId: myCompanyId ?? 'no-id',
                    beforeSecond: newCustomDate().totalSeconds,
                })
                if (dmListResult.error) {
                    dispatch(
                        setToastMessage({
                            text: dmListResult.error,
                            type: 'error',
                        } as ToastMessage),
                    )
                    return
                }

                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                setState((prev) => ({ ...prev, allDms: dmListResult.success ?? [], filteredDms: dmListResult.success ?? [] }))
                const cachedResult = await updateCachedData({ key: cachedDMRoomListKey, value: dmListResult.success })
                if (cachedResult.error) {
                    dispatch(
                        setToastMessage({
                            text: cachedResult.error,
                            type: 'error',
                        }),
                    )
                }
                await deleteScreenOfUpdateScreens({ accountId, screenName: screenName })
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                setState((prev) => ({ ...prev, refreshing: false }))
                if (isFocused) {
                    dispatch(setIsNavUpdating(false))
                    dispatch(setLoading(false))
                }
            }
        })()
    }, [refreshing])
    console.log('====>>> All DMs: ', allDms)

    useSafeLoadingUnmount(dispatch, isFocused)

    useSafeUnmount(setState, initialState)

    /**
     * @summary updateCacheフラグが変化した時の副作用フック（KVSから表示データを再取得更新）
     * @purpose アプリ側にKVSによるキャッシュを設けて一覧の初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            const result = await getCachedData<GetDMListResponse>(cachedDMRoomListKey)
            if (result.error) {
                if (result.errorCode != 'FIRST_FETCH') {
                    dispatch(
                        setToastMessage({
                            text: result.error,
                            type: 'error',
                        }),
                    )
                }
                setState((rev) => ({ ...rev, refreshing: true }))
            } else {
                setState((rev) => ({ ...rev, allDms: result.success ?? [], filteredDms: result.success ?? [] }))
            }
        })()
    }, [updateCache])

    useEffect(() => {
        if (textFilter && textFilter.length > 0) {
            const dataFilteredByWorkerName = allDms?.filter((chat) => chat?.name?.startsWith(textFilter)) || []
            if (dataFilteredByWorkerName.length > 0) {
                setState((prev) => ({ ...prev, filteredDms: dataFilteredByWorkerName }))
            } else {
                setState((prev) => ({ ...prev, filteredDms: [] }))
            }
        } else {
            setState((prev) => ({ ...prev, filteredDms: allDms }))
        }
    }, [textFilter])

    const _content: ListRenderItem<RoomUserUIType> = (info: ListRenderItemInfo<RoomUserUIType>) => {
        const { item, index } = info
        const item2 = { ...item, onEnter: (roomId: string, rootThreadId: string, name: string) => _onEnterRoom(roomId, rootThreadId, name) }

        return <DMRoom {...item2} />
    }
    const _header = (
        <View>
            <Search
                style={{
                    marginTop: 8,
                    marginBottom: 10,
                    marginHorizontal: 10,
                    backgroundColor: '#FFF',
                    width: SCREEN_WIDTH - 20,
                }}
                text={textFilter}
                title={t('common:SearchByWorkerName')}
                onChange={setTextFilter}
                clearText={() => setTextFilter(undefined)}
                placeholder={t('common:SearchByWorkerName')}
                onBlur={undefined}
            />
            <AppButton
                style={{
                    marginTop: 15,
                    marginBottom: 30,
                    marginHorizontal: 10,
                    backgroundColor: 'transparent',
                    paddingHorizontal: 20,
                }}
                hasShadow={false}
                borderColor={THEME_COLORS.OTHERS.BORDER_COLOR2}
                borderWidth={1}
                textColor={THEME_COLORS.OTHERS.BLACK}
                title={t('common:AddChatRoom')}
                onPress={() => navigation.push(side == 'admin' ? 'AdminSelectOnetooneOrCustom' : 'WorkerSelectOnetooneOrCustom', {})}
            />
        </View>
    )
    const _onEnterRoom = (roomId: string, rootThreadId: string, name: string) => {
        navigation.push(side == 'admin' ? 'AdminChatDetail' : 'WorkerChatDetail', {
            roomId,
            threadId: rootThreadId,
            name,
        })
    }

    const _onRefresh = async () => {
        setState((prev) => ({ ...prev, refreshing: true }))
    }

    const _getMoreData = async (): Promise<void> => {
        if (allDms == undefined || allDms?.length == 0) {
            return Promise.resolve()
        }

        // console.log("**************" + allDms[(allDms?.length ?? 0) - 1].updatedAt?.totalSeconds)

        const dmListResult: CustomResponse<GetDMListResponse> = await getDmList({
            myWorkerId: signInUser?.workerId ?? 'no-id',
            myCompanyId: myCompanyId ?? 'no-id',
            beforeSecond: allDms[(allDms?.length ?? 0) - 1].updatedAt?.totalSeconds ?? 0,
        })
        if (dmListResult.error) {
            throw {
                error: dmListResult.error,
            }
        }

        setState((prev) => ({ ...prev, allDms: [...(allDms ?? []), ...(dmListResult.success ?? [])] }))
    }

    return (
        <FlatList
            style={{
                backgroundColor: '#FFF',
            }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={_onRefresh} />}
            data={filteredDms}
            renderItem={_content}
            keyExtractor={(item, i) => item.roomId}
            ListHeaderComponent={_header}
            ListFooterComponent={() => <BottomMargin />}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onEndReached={_getMoreData}
            onEndReachedThreshold={0.3}
        />
    )
}

export default DMRoomList
