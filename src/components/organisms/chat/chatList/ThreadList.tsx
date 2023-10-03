import { RouteProp, useIsFocused, useNavigation, useRoute } from "@react-navigation/native"
import { StackNavigationProp } from "@react-navigation/stack"
import { isEmpty } from "lodash"
import React, { useContext, useEffect, useMemo, useState } from "react"
import { FlatList, KeyboardAvoidingView, ListRenderItem, ListRenderItemInfo, Platform, RefreshControl, View } from "react-native"
import { useDispatch, useSelector } from "react-redux"
import { CustomResponse } from "../../../../../__tests__/utils/seed/lib/CustomResponse"
import ChatInput from "../../../../components/organisms/chat/ChatInput"
import { ThreadMessage } from "../../../../components/organisms/chat/ThreadMessage"
import { EmptyScreen } from "../../../../components/template/EmptyScreen"
import { useTextTranslation } from "../../../../fooks/useTextTranslation"
import { useSafeLoadingUnmount, useSafeUnmount } from "../../../../fooks/useUnmount"
import { MessageCLType, MessageType, toMessageCLType } from "../../../../models/message/Message"
import { newCustomDate } from "../../../../models/_others/CustomDate"
import { getErrorToastMessage } from "../../../../services/_others/ErrorService"
import { setIsNavUpdating } from "../../../../stores/NavigationSlice"
import { StoreType } from "../../../../stores/Store"
import { setLoading, setToastMessage, ToastMessage } from "../../../../stores/UtilSlice"
import { THEME_COLORS } from "../../../../utils/Constants"
import { getUuidv4, SwitchAdminOrWorkerProps } from "../../../../utils/Utils"
import { RootStackParamList } from "../../../../screens/Router"
import { ThreadLogType } from "../../../../models/threadLog/ThreadLog"
import { getThreadList } from "../../../../usecases/chat/ChatListCase"
import { BottomMargin } from "../../../atoms/BottomMargin"


type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    threadLogs?: ThreadLogUIType[]
    refresh: number
    localUpdate: number
    refreshing: boolean
}

export type ThreadLogUIType = ThreadLogType

const initialState: InitialStateType = {
    //
    localUpdate: 0,
    refresh: 0,
    refreshing: false,
}

const ChatThread = (props: Partial<SwitchAdminOrWorkerProps>) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const side = props.side ?? 'admin'
    const screenName: string = side == 'admin' ? 'AdminThreadList' : 'WorkerThreadList'

    const [{ threadLogs, refresh, localUpdate, refreshing }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)


    useSafeUnmount(setState, initialState)
    useEffect(() => {
        /*
        if (route.params?.roomId && route.params?.threadId){
            setState((prev) => ({ ...prev, roomId: route.params?.roomId, threadId: route.params?.threadId }))
        }
        */

    }, [])

    useEffect(() => {
        const no3messageId = getUuidv4()
        const tempThreadLogs: ThreadLogType[] = [
            
        ]


        setState((prev) => ({ ...prev, threadLogs: tempThreadLogs, refresh: refresh+1 }))
        
    }, [])

    const isFocused = useIsFocused()

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, localUpdate: localUpdate + 1 }))
        }
    }, [isFocused])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, localUpdate: localUpdate + 1 }))
        }
    }, [isNavUpdating])


    useEffect(() => {
        ;(async () => {
            try {
                /*
                if (isEmpty(roomId) || isEmpty(threadId) || isEmpty(signInUser?.workerId)) {
                    return
                }
                */
                if (isFocused) dispatch(setLoading(true))
                
                const threadResult = await getThreadList({
                    myCompanyId: myCompanyId ?? 'no-id',
                    myWorkerId: signInUser?.workerId ?? 'no-id',
                })
                if (threadResult.error || threadResult.success == undefined) {
                    throw {
                        error: threadResult.error,
                    }
                }

                setState((prev) => ({ ...prev, threadLogs: threadResult.success }))
                
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
    }, [refreshing, localUpdate])

    
    const _content: ListRenderItem<ThreadLogUIType> = (info: ListRenderItemInfo<ThreadLogUIType>) => {
        const { item, index } = info
        return (
          
            <ThreadMessage
                style={{
                    marginLeft: 13,
                    marginRight: 10,
                    paddingVertical: 6,
                }}
                key={item.threadLogId}
                threadLog={item}
                onReplyPress={() => {
                    navigation.push(side == 'admin' ? 'AdminChatDetail' : 'WorkerChatDetail', {
                        roomId: item.roomId ?? 'no-id',
                        threadId: item.threadId ?? 'no-id',
                        name: item.room?.name ?? 'no-name',
                    })
                }}
                onReadThread={() => navigation.push(side == 'admin' ? 'AdminChatDetail' : 'WorkerChatDetail', {roomId: item?.roomId ?? '', threadId: item?.threadId ?? '', name: item.room?.name ?? 'no-name'})}
            />
        )
    }

    const _header = () => {
        return (
            <View>
                <View
                    style={{
                        paddingVertical: 10,
                        backgroundColor: '#fff',
                        // borderBottomWidth: 1,
                        // borderBottomColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                        flexDirection: 'row',
                    }}
                >
                    
                </View>
            </View>
        )
    }

    const _footer = () => {
        return (
            <View />
        )
    }

    const _onRefresh = async () => {
        setState((prev) => ({ ...prev, refreshing: true }))
    }

    


    const _onPostMessage = async (message: string) => {

    }

    

    const listKey = useMemo(() => getUuidv4(), [])

    let keyboardAvoidingBehavior: 'padding' | 'position' | 'height' | undefined = undefined
    if (Platform.OS == 'ios') {
        keyboardAvoidingBehavior = 'padding'
    }

    return (
        <KeyboardAvoidingView
            keyboardVerticalOffset = {60 + 20} // adjust the value here if you need more padding
            style = {{ flex: 1 }}
            behavior = {keyboardAvoidingBehavior} >

            <FlatList
                style={{
                    backgroundColor: '#fff',
                }}
                listKey={listKey}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={_onRefresh} />}
                data={threadLogs}
                keyExtractor={(item, index) => index.toString()}
                renderItem={_content}
                ListEmptyComponent={<EmptyScreen text={t('common:NoMessageExist')} />}
                ListHeaderComponent={_header}
                ListFooterComponent={() => (<BottomMargin />)}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
            />
        </KeyboardAvoidingView>
    )
}
export default ChatThread
