import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { isEmpty } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, ListRenderItem, ListRenderItemInfo, RefreshControl, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { ChatSearchbar } from '../../../../components/organisms/chat/ChatSearchbar'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { CompanyType } from '../../../../models/company/Company'
import { ProjectType } from '../../../../models/project/Project'
import { RoomEnumType, RoomType } from '../../../../models/room/Room'
import { RoomUserType } from '../../../../models/roomUser/RoomUser'
import { WorkerType } from '../../../../models/worker/Worker'
import { CustomDate, newCustomDate } from '../../../../models/_others/CustomDate'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { RootStackParamList } from '../../../../screens/Router'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { genKeyName, getCachedData, updateCachedData } from '../../../../usecases/CachedDataCase'
import { getProjectConstractionList, GetProjectConstructionResponse } from '../../../../usecases/chat/ChatListCase'
import { checkUpdateOfTargetScreen, deleteScreenOfUpdateScreens, getUpdateScreenOfTargetAccountAndScreen } from '../../../../usecases/updateScreens/CommonUpdateScreensCase'
import { SCREEN_WIDTH, THEME_COLORS } from '../../../../utils/Constants'
import { SwitchAdminOrWorkerProps } from '../../../../utils/Utils'
import { Search } from '../../Search'
import { ChatProjectItem } from './ChatProjectItem'
import { BottomMargin } from '../../../atoms/BottomMargin'

const RoomUsers: RoomUserUIType[] = [
    /*
	{ roomId: 'chat-1', avatar: 'https://i.pravatar.cc/50', roomType: 'project', name: '', companyName: '', lastMessage: "商品棚、設置完了しました", updatedAt: newCustomDate(), unreadCount: 7 },
	{ roomId: 'chat-2', avatar: 'https://i.pravatar.cc/50', roomType: 'construction', name: 'メイン', companyName: '自社', lastMessage: "商品棚、設置完了しました", updatedAt: newCustomDate(), unreadCount: 3 },
	{ roomId: 'chat-3', avatar: 'https://i.pravatar.cc/50', roomType: 'contract', name: 'サブ1', companyName: '株式会社中山建設', lastMessage: "商品棚、設置完了しました", updatedAt: newCustomDate(), unreadCount: 2 },
    */
]
const Projects: ProjectConstructionUIType[] = [
    /*
	{ projectId: 'project-1', avatar: 'https://i.pravatar.cc/50', name: 'ABC書店渋谷南口', companyName: "株式会社イージーワークス", roomUsers: RoomUsers },
	{ projectId: 'project-2', avatar: 'https://i.pravatar.cc/50', name: 'DEFスーパー汐留北', companyName: "株式会社中山建設", roomUsers: RoomUsers  },
	{ projectId: 'project-3', avatar: 'https://i.pravatar.cc/50', name: 'TGF不動產社屋', companyName: "株式会社中山建設", roomUsers: RoomUsers  },
	{ projectId: 'project-4', avatar: 'https://i.pravatar.cc/50', name: '水道橋南小学校プール壁', companyName: "株式会社イージーワークス", roomUsers: RoomUsers  },
    */
]

export type RoomUserUIType = {
    roomId: string
    rootThreadId: string
    roomType: RoomEnumType
    name?: string
    companyName?: string
    lastMessage?: string
    unreadCount?: number
    company?: CompanyType
    worker?: WorkerType
    room?: RoomType
    updatedAt?: CustomDate
    onEnter?: (roomId: string, rootThreadId: string, name: string) => void
}

export type ProjectConstructionUIType = {
    projectId: string
    name: string
    project: ProjectType
    companyName: string
    roomUsers: RoomUserUIType[]
    lastMessage?: string
    onEnter?: (roomId: string, rootThreadId: string, name: string) => void
}

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    filteredProjects: ProjectConstructionUIType[]
    allProjects: ProjectConstructionUIType[]
    lastRoomUser?: RoomUserType
    updateCache: number
    refreshing: boolean
}
const initialState: InitialStateType = {
    filteredProjects: [],
    allProjects: Projects,
    lastRoomUser: undefined,
    updateCache: 0,
    refreshing: false,
}

const ChatProjectList = (props: Partial<SwitchAdminOrWorkerProps>) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const side = props.side ?? 'admin'
    const screenName: string = side == 'admin' ? 'AdminChatProjectList' : 'WorkerChatProjectList'

    const [{ filteredProjects, allProjects, lastRoomUser, updateCache, refreshing }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const accountId = signInUser?.accountId ?? ''
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const cachedProjectConstructionListKey = genKeyName({ screenName: screenName, accountId: accountId, companyId: myCompanyId ?? '' })

    const [textFilter, setTextFilter] = useState<string | undefined>(undefined)

    //productionでのログ出力抑制
    !__DEV__ && (console.log = () => {})

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
                    const newLocalUpdateScreens = localUpdateScreens.filter((screen) => screen.screenName != screenName)
                    dispatch(setLocalUpdateScreens(newLocalUpdateScreens))
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
                const projectConstructionResult: CustomResponse<GetProjectConstructionResponse> = await getProjectConstractionList({
                    myWorkerId: signInUser?.workerId ?? 'no-id',
                    myCompanyId: myCompanyId ?? 'no-id',
                    beforeSecond: newCustomDate().totalSeconds,
                })
                if (projectConstructionResult.error) {
                    dispatch(
                        setToastMessage({
                            text: projectConstructionResult.error,
                            type: 'error',
                        } as ToastMessage),
                    )
                    return
                }
                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                setState((prev) => ({
                    ...prev,
                    allProjects: projectConstructionResult.success?.projectConstructionList ?? [],
                    filteredProjects: projectConstructionResult.success?.projectConstructionList ?? [],
                    lastRoomUser: projectConstructionResult.success?.lastRoomUser,
                }))
                const cachedResult = await updateCachedData({ key: cachedProjectConstructionListKey, value: projectConstructionResult.success })
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

    useSafeLoadingUnmount(dispatch, isFocused)

    useSafeUnmount(setState, initialState)

    /**
     * @summary updateCacheフラグが変化した時の副作用フック（KVSから表示データを再取得更新）
     * @purpose アプリ側にKVSによるキャッシュを設けて一覧の初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            const result = await getCachedData<GetProjectConstructionResponse>(cachedProjectConstructionListKey)
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
                setState((prev) => ({
                    ...prev,
                    allProjects: result.success?.projectConstructionList ?? [],
                    filteredProjects: result.success?.projectConstructionList ?? [],
                    lastRoomUser: result.success?.lastRoomUser,
                }))
            }
        })()
    }, [updateCache])

    useEffect(() => {
        const dataFilteredByProjectName = filteredByProjectName(allProjects) as ProjectConstructionUIType[]
        if (textFilter && textFilter.length > 0) {
            if (dataFilteredByProjectName.length > 0) {
                setState((prev) => ({ ...prev, filteredProjects: dataFilteredByProjectName }))
            } else {
                setState((prev) => ({ ...prev, filteredProjects: [] }))
            }
        } else {
            setState((prev) => ({ ...prev, filteredProjects: allProjects }))
        }
    }, [textFilter])

    const _content: ListRenderItem<ProjectConstructionUIType> = (info: ListRenderItemInfo<ProjectConstructionUIType>) => {
        const { item, index } = info
        const item2 = { ...item, onEnter: (roomId: string, rootThreadId: string, name: string) => _onEnterRoom(roomId, rootThreadId, name) }
        return <ChatProjectItem {...item2} />
    }

    const _header = (
        <Search
            style={{
                marginTop: 8,
                marginBottom: 10,
                marginHorizontal: 10,
                backgroundColor: '#FFF',
                width: SCREEN_WIDTH - 20,
            }}
            text={textFilter}
            title={t('common:SearchByProjectOrConstructionName')}
            onChange={setTextFilter}
            clearText={() => setTextFilter(undefined)}
            placeholder={t('common:SearchByProjectOrConstructionName')}
            onBlur={undefined}
        />
    )

    const filteredByProjectName = useCallback(
        (data: ProjectType[]) => {
            return data.filter(({ name }) => {
                if (name && textFilter && textFilter.length > 0) {
                    return name.indexOf(textFilter) > -1
                }
            })
        },
        [textFilter],
    )

    const _onRefresh = async () => {
        setState((prev) => ({ ...prev, refreshing: true }))
    }

    const _onEnterRoom = (roomId: string, rootThreadId: string, name: string) => {
        navigation.push(side == 'admin' ? 'AdminChatDetail' : 'WorkerChatDetail', {
            roomId,
            threadId: rootThreadId,
            name,
        })
    }

    const _getMoreData = async (): Promise<void> => {
        if (lastRoomUser == undefined) {
            return Promise.resolve()
        }

        const projectConstructionResult: CustomResponse<GetProjectConstructionResponse> = await getProjectConstractionList({
            myWorkerId: signInUser?.workerId ?? 'no-id',
            myCompanyId: myCompanyId ?? 'no-id',
            beforeSecond: lastRoomUser.updatedAt ?? 0,
        })
        if (projectConstructionResult.error) {
            throw {
                error: projectConstructionResult.error,
            }
        }

        const filteredList = projectConstructionResult.success?.projectConstructionList.filter((project) => {
            let hitFlag: boolean = false
            allProjects.forEach((project2) => {
                if (project2.projectId == project.projectId) {
                    hitFlag = true
                }
            })
            return !hitFlag
        })

        setState((prev) => ({ ...prev, allDms: [...(allProjects ?? []), ...(filteredList ?? [])], lastRoomUser: projectConstructionResult.success?.lastRoomUser }))
    }

    return (
        <FlatList
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: THEME_COLORS.OTHERS.BACKGROUND,
            }}
            contentContainerStyle={{ alignItems: 'center' }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={_onRefresh} />}
            data={filteredProjects}
            renderItem={_content}
            keyExtractor={(item, i) => item.projectId}
            ListHeaderComponent={_header}
            ListFooterComponent={() => <BottomMargin />}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            onEndReached={_getMoreData}
            onEndReachedThreshold={0.3}
        />
    )
}

export default ChatProjectList
