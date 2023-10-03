import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import * as Clipboard from 'expo-clipboard'
import { isEmpty } from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, ListRenderItem, ListRenderItemInfo, Platform, View, ViewToken, Modal as RNModal } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import Modal from 'react-native-modal'
import { useDispatch, useSelector } from 'react-redux'
import { EmojiKeyboard } from 'rn-emoji-keyboard'
import ImageViewer from 'react-native-image-zoom-viewer'
import { IImageInfo } from 'react-native-image-zoom-viewer/src/image-viewer.type'
import ChatInput from '../../../../components/organisms/chat/ChatInput'
import { Message } from '../../../../components/organisms/chat/Message'
import PopupForMessage from '../../../../components/organisms/chat/PopupForMessage'
import { EmptyScreen } from '../../../../components/template/EmptyScreen'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { MessageCLType, MessageType, toMessageCLType } from '../../../../models/message/Message'
import { RoomCLType, toRoomCLType } from '../../../../models/room/Room'
import { RoomUserType } from '../../../../models/roomUser/RoomUser'
import { ThreadHeadCLType, toThreadHeadCLType } from '../../../../models/threadHead/ThreadHead'
import { CustomDate, newCustomDate, timeText } from '../../../../models/_others/CustomDate'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { RootStackParamList } from '../../../../screens/Router'
import { _getFirestore } from '../../../../services/firebase/FirestoreService'
import { _getMessage, _getMessageListOfTargetRoom } from '../../../../services/message/MessageService'
import { _addOrDeleteReactionOfTargetMessage } from '../../../../services/reaction/ReactionService'
import { _getThreadHead } from '../../../../services/threadHead/ThreadHeadService'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { getRoomInfo, getRoomInfoResponse } from '../../../../usecases/chat/MembersListCase'
import { createMessageRead, createNewMessage, createNewThread } from '../../../../usecases/chat/ChatBatchCase'
import { SCREEN_HEIGHT, SCREEN_WIDTH, THEME_COLORS, WINDOW_HEIGHT, WINDOW_WIDTH } from '../../../../utils/Constants'
import { getUuidv4, resizeImage, sleep, SwitchAdminOrWorkerProps } from '../../../../utils/Utils'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import { _uploadImageAndGetUrl } from '../../../../services/firebase/StorageService'
import { BottomMargin } from '../../../atoms/BottomMargin'
import { createTodo } from '../../../../usecases/chat/TodoListCase'

type NavProps = StackNavigationProp<RootStackParamList, 'ChatDetail'>
type RouteProps = RouteProp<RootStackParamList, 'ChatDetail'>

// LogBox.ignoreLogs(['Please report: Excessive number of pending callbacks: 501.']);
type InitialStateType = {
    roomId?: string
    threadId?: string
    room?: RoomCLType
    messages?: MessageCLType[]
    roomUsers?: RoomUserType[]
    messagesLength?: number
    isRefreshMessages?: boolean
    lastMessageIdAndUpdateCount?: string
    reply?: MessageCLType
    selMessage?: MessageCLType
    isVisibleForMessage?: boolean
    isVisibleEmoji?: boolean
    isVisibleImageViewer?: boolean
    selectedImage?: string
    threadHead?: ThreadHeadCLType
    refresh: number
    localUpdate: number
    refreshing: boolean
}

export type MessageUIType = MessageCLType

const initialState: InitialStateType = {
    //
    messagesLength: 0,
    lastMessageIdAndUpdateCount: 'none@0',
    isRefreshMessages: true,
    isVisibleForMessage: false,
    isVisibleEmoji: false,
    isVisibleImageViewer: false,
    localUpdate: 0,
    refresh: 0,
    refreshing: false,
}

const ChatDetail = (props: Partial<SwitchAdminOrWorkerProps>) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const side = props.side ?? 'admin'

    const [
        {
            roomId,
            threadId,
            room,
            roomUsers,
            messages,
            messagesLength,
            isRefreshMessages,
            lastMessageIdAndUpdateCount,
            reply,
            selMessage,
            isVisibleForMessage,
            isVisibleEmoji,
            isVisibleImageViewer,
            selectedImage,
            threadHead,
            refresh,
            localUpdate,
            refreshing,
        },
        setState,
    ] = useState(initialState)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const loading = useSelector((state: StoreType) => state?.util?.loading)

    let listnerUnscribe: any = undefined
    const ref = useRef<FlatList>(null)

    useSafeUnmount(setState, initialState)
    useEffect(() => {
        if (route.params?.roomId && route.params?.threadId) {
            setState((prev) => ({ ...prev, roomId: route.params?.roomId, threadId: route.params?.threadId }))
            ;(async () => {
                try {
                    const resultThreadHead = await _getThreadHead({ threadId: route.params?.threadId ?? 'no-id' })
                    if (resultThreadHead.error) {
                        throw { error: resultThreadHead.error }
                    }
                    //console.log(resultThreadHead.success)
                    setState((prev) => ({ ...prev, threadHead: toThreadHeadCLType(resultThreadHead.success) }))
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
            ;(async () => {
                try {
                    const roomResult: CustomResponse<getRoomInfoResponse> = await getRoomInfo(route.params?.roomId ?? 'no-id', signInUser?.workerId ?? 'no-id')
                    if (roomResult.error) {
                        dispatch(
                            setToastMessage({
                                text: roomResult.error,
                                type: 'error',
                            } as ToastMessage),
                        )
                        return
                    }
                    setState((prev) => ({ ...prev, roomUsers: roomResult.success?.roomUsers }))
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
    }, [])

    // console.log('Room users:', roomUsers)

    useEffect(() => {
        navigation.setOptions({
            title: route.params?.name,
        })
    }, [navigation])

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
                if (isEmpty(roomId) || isEmpty(signInUser?.workerId)) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))

                const now = newCustomDate().totalSeconds

                const messageResult = await _getMessageListOfTargetRoom({
                    roomId: roomId ?? 'no-id',
                    threadId: threadId ?? 'no-id',
                    greaterThan: now,
                    limit: 10,
                    options: { worker: true, reactions: true, reply: true, reads: true, threadHead: { lastMessage: { worker: true } } },
                })
                if (messageResult.error) {
                    throw {
                        error: messageResult.error,
                    }
                }

                const _messages = messageResult.success?.items?.map((item) => toMessageCLType(item)) ?? []
                // _messages.reverse()

                setState((prev) => ({ ...prev, messages: _messages }))

                const lastNumber = _getLastTime(messageResult.success?.items ?? [])

                if (listnerUnscribe) {
                    //alert("unsc")
                    listnerUnscribe()
                }
                const lastTime = _getLastTime(messageResult.success?.items ?? [])

                const db = _getFirestore()
                listnerUnscribe = db
                    .collection('Message')
                    .where('roomId', '==', roomId)
                    .where('threadId', '==', threadId)
                    .where('updatedAt', '>=', newCustomDate().totalSeconds)
                    .orderBy('updatedAt', 'desc')
                    .limit(15)
                    /* .endBefore(lastTime) */
                    .onSnapshot((snapshot) => {
                        // console.log('Snapshot: ', snapshot.docs)

                        snapshot.docChanges().forEach((change) => {
                            // console.log('change.type: ', change.type)
                            if (change.type === 'removed') {
                                //deleteMessage(change.doc.id);
                            } else if (change.type == 'added') {
                                // console.log('>> New document added: ', change.doc.data())
                                setState((prev) => ({ ...prev, ..._addMessage(prev.messages, change.doc.data() as MessageType) }))

                                const modMsg = change.doc.data() as MessageType
                                if (modMsg.messageId && modMsg.updateCount && modMsg.updateCount > 0) {
                                    setState((prev) => ({ ...prev, lastMessageIdAndUpdateCount: `${modMsg.messageId}@${modMsg.updateCount}` }))
                                }
                            } else if (change.type == 'modified') {
                                // alert(JSON.stringify(change.doc.data()))
                                // console.log('Doc updated: ', change.doc.data())

                                const modMsg = change.doc.data() as MessageType
                                if (modMsg.messageId && modMsg.updateCount) {
                                    setState((prev) => ({ ...prev, lastMessageIdAndUpdateCount: `${modMsg.messageId}@${modMsg.updateCount}` }))
                                }
                            }
                        })
                    })

                //listnerUnscribe()
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
        return () => {
            listnerUnscribe && listnerUnscribe()
            // console.log('Unscribe listener.....');
        }
    }, [roomId, threadId, refresh, localUpdate])

    useEffect(() => {
        ;(async () => {
            if (isRefreshMessages && messages && messages.length > 0) {
                const sta = new Date().getTime()
                // console.log('*** start - ' + sta)
                const messageResult = await _getMessage({ messageId: messages[0].messageId ?? 'no-id', options: { worker: true, reply: true } })
                // console.log('***  - ' + (new Date().getTime() - sta))
                messages[0] = toMessageCLType(messageResult.success)
                // console.log('*** end - ' + (new Date().getTime() - sta))
                setState((prev) => ({ ...prev, messages: messages }))

                ref.current?.scrollToOffset({ offset: 0 })
            }
        })()
    }, [messagesLength])

    useEffect(() => {
        ;(async () => {
            if (lastMessageIdAndUpdateCount && lastMessageIdAndUpdateCount != 'none@0') {
                // console.log('lastMessageIdAndUpdateCount: ',lastMessageIdAndUpdateCount);
                const currMessageId = lastMessageIdAndUpdateCount.split('@')[0]
                if (currMessageId == 'none') return
                const messageResult = await _getMessage({ messageId: currMessageId, options: { worker: true, reactions: true, reply: true } })
                const newMessage = toMessageCLType(messageResult.success)
                // console.log('>>>> Reactions: ', newMessage.reactions)

                const newMessages: MessageCLType[] =
                    messages?.map((msg) => {
                        if (msg.messageId != currMessageId) {
                            return msg
                        } else {
                            return newMessage
                        }
                    }) ?? []
                setState((prev) => ({ ...prev, messages: newMessages }))
            }
        })()
    }, [lastMessageIdAndUpdateCount])

    const _content: ListRenderItem<MessageUIType> = (info: ListRenderItemInfo<MessageUIType>) => {
        const { item, index } = info
        return (
            <Message
                style={{
                    marginLeft: 13,
                    marginRight: 10,
                    paddingVertical: 6,
                }}
                key={item.messageId}
                message={item}
                myWorkerId={signInUser?.workerId}
                onReply={() => {
                    setState((prev) => ({ ...prev, reply: item }))
                }}
                onThread={() => {
                    _onThreadStart(item)
                }}
                onAddEmoji={() => {
                    setTimeout(() => {
                        setState((prev) => ({ ...prev, selMessage: item, isVisibleEmoji: true }))
                    }, 100)
                }}
                onEnterThread={() => {
                    _onEnterThread(item)
                }}
                onImagePress={(imageUrl: string) => {
                    setState((prev) => ({ ...prev, isVisibleImageViewer: true, selectedImage: imageUrl }))
                }}
                onNotePress={() => {
                    if(roomId && threadId)
                        navigation.push(side == 'admin' ? 'AdminChatNoteList' : 'WorkerChatNoteList', { roomId, threadId })
                }}
                onAddTodo={async(message?: MessageCLType) => {
                    if(message) {
                        const createTaskResult = await createTodo({
                            message: { messageId: message.messageId, message: message.message },
                            roomId: roomId ?? 'no-id',
                            threadId: message.threadId ?? 'no-id',
                            myWorkerId: signInUser?.workerId ?? 'no-id'
                        })
                        if(createTaskResult.error){
                            dispatch(
                                setToastMessage({
                                    text: createTaskResult.error,
                                    type: 'error',
                                } as ToastMessage),
                            )
                        }
                        dispatch(setToastMessage({
                            text: 'New Todo created',
                            type: 'success',
                        } as ToastMessage))
                    }
                }}
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
                    }}>
                    {/* <BottomMargin /> */}
                    
                </View>
            </View>
        )
    }

    const _footer = () => {
        return <View>
            {loading ? (
                        <></>
                    ) : messages != undefined && messages?.length > 0 ? (
                        <></>
                    ) : (
                        <EmptyScreen
                            style={{
                                paddingBottom: WINDOW_HEIGHT / 2.5,
                            }}
                            text={t('common:NoMessageExist')}
                        />
                    )}
        </View>
    }

    const _getLastTime = (rcvMessages: MessageType[]): number => {
        let now: CustomDate = newCustomDate()
        if (rcvMessages.length == 0) {
            return now.totalSeconds
        } else {
            return rcvMessages[0].updatedAt ?? 0
        }
    }

    const _addMessage = (rcvMessages: MessageCLType[] | undefined, message: MessageType): any => {
        if (_existSameMessage(rcvMessages, message.messageId ?? 'no-id') == false) {
            rcvMessages?.unshift(toMessageCLType(message))
        }
        return { messsages: rcvMessages ?? [], messagesLength: (rcvMessages ?? []).length }
    }

    const _existSameMessage = (rcvMessages: MessageCLType[] | undefined, messageId: string): boolean => {
        let hitFlag = false
        rcvMessages?.forEach((msg) => {
            if (msg.messageId == messageId) {
                hitFlag = true
            }
        })

        return hitFlag
    }

    const _getTopTime = (rcvMessages: MessageCLType[]): number => {
        let now: CustomDate = newCustomDate()
        if (rcvMessages.length == 0) {
            return now.totalSeconds
        } else {
            //alert(timeBaseText(rcvMessages[rcvMessages.length-1].createdAt ?? newCustomDate()))

            return rcvMessages[rcvMessages.length - 1].createdAt?.totalSeconds ?? 0
            // return rcvMessages[0].createdAt?.totalSeconds ?? 0
        }
    }

    const _getMoreData = async (): Promise<void> => {
        const topCreatedAt = _getTopTime(messages ?? [])

        const messageResult = await _getMessageListOfTargetRoom({
            roomId: roomId ?? 'no-id',
            threadId: threadId ?? 'no-id',
            greaterThan: topCreatedAt,
            limit: 20,
            options: { worker: true, reactions: true, reply: true, reads: true, threadHead: { lastMessage: { worker: true } } },
        })
        if (messageResult.error) {
            throw {
                error: messageResult.error,
            }
        }

        const newMessages = [...(messages ?? []), ...(messageResult.success?.items?.map((item) => toMessageCLType(item)) ?? [])]

        setState((prev) => ({ ...prev, isRefreshMessages: false }))
        setState((prev) => ({ ...prev, messages: newMessages, messagesLength: newMessages.length }))
        setState((prev) => ({ ...prev, isRefreshMessages: true }))
    }

    const _onEnterThread = (item: MessageCLType): void => {
        const nav = side == 'admin' ? 'AdminChatDetail' : 'WorkerChatDetail'

        //パートナー間のスレッド
        if (item.extraRoomId) {
            navigation.push(nav, {
                roomId: item.extraRoomId,
                threadId: item.threadHead?.threadId ?? 'no-id',
                name: item.message ?? 'no-message',
            })
        }
        //普通のスレッド
        else {
            navigation.push(nav, {
                roomId: roomId ?? 'no-id',
                threadId: item.threadHead?.threadId ?? 'no-id',
                name: 'スレッド：' + route.params?.name,
            })
        }
    }

    const _onRefresh = async () => {
        setState((prev) => ({ ...prev, refreshing: true }))
    }

    const _onPostMessage = async (message: string) => {
        let replyId = undefined
        if (reply) {
            replyId = reply.messageId
        }

        checkMention(message)

        await createNewMessage({
            message: {
                roomId,
                threadId,
                isThreadStart: false,
                workerId: signInUser?.workerId,
                message: message,
                messageType: 'text',
                readCount: 0,
                updateCount: 0,
                replyId,
                createdAt: newCustomDate(),
                updatedAt: newCustomDate(),
            },
            myWorkerId: signInUser?.workerId ?? 'no-id',
        })

        //_onPostMessageDummy(message)

        setState((prev) => ({ ...prev, reply: undefined, selMessage: undefined }))
    }

    const checkMention = (message: string): void => {
        if (message.indexOf('@') >= 0) {
            const msg = '＠メンション機能は、現在作成中です。'
            dispatch(
                setToastMessage({
                    text: msg,
                    type: 'info',
                } as ToastMessage),
            )
        }
    }
    
    const _onPostPictureMessage = async (imageInfo: ImageInfo) => {
        let replyId = undefined
        if (reply) {
            replyId = reply.messageId
        }
        const resize = await resizeImage(imageInfo)
        const [mSizeResult, sSizeResult, xsSizeResult] = await Promise.all([_uploadImageAndGetUrl(resize.m?.uri), _uploadImageAndGetUrl(resize.s?.uri), _uploadImageAndGetUrl(resize.xs?.uri)])
        const imageUrl = mSizeResult.success
        const sImageUrl = sSizeResult.success
        const xsImageUrl = xsSizeResult.success

        await createNewMessage({
            message: {
                roomId,
                threadId,
                isThreadStart: false,
                workerId: signInUser?.workerId,
                message: '',
                messageType: 'picture',
                attachmentUrl: imageUrl,
                sAttachmentUrl: sImageUrl,
                xsAttachmentUrl: xsImageUrl,
                readCount: 0,
                updateCount: 0,
                replyId,
                createdAt: newCustomDate(),
                updatedAt: newCustomDate(),
            },
            myWorkerId: signInUser?.workerId ?? 'no-id',
        })

        //_onPostMessageDummy(message)

        setState((prev) => ({ ...prev, reply: undefined, selMessage: undefined }))
    }



    const _onPostMessageDummy = (message: string) => {
        const newMessage = {
            messageId: getUuidv4(),
            roomId: '123',
            workerId: signInUser?.workerId,
            message: message,
            messageType: 'text',
            readCount: 0,
            worker: {
                imageColorHue: 353,
                name: signInUser?.worker?.name,
            },
            reactions: {
                items: [],
            },
            isThreadStart: false,
            createdAt: newCustomDate(),
        } as MessageCLType

        const prevMessages = [...(messages ?? [])]
        prevMessages.push(newMessage)
        setState((prev) => ({ ...prev, messages: prevMessages }))
    }

    const _onEmojiAdd = async (emoji: string) => {
        await _addOrDeleteReactionOfTargetMessage({
            messageId: selMessage?.messageId ?? 'no-id',
            workerId: signInUser?.workerId ?? 'no-id',
            reactionChar: emoji,
        })

        /*
        const newMsgs = messages?.map( (msg) => {
            if (msg.messageId != selMessage?.messageId) {
                return msg
            }
            else {
                if (msg.reactions) {
                    msg.reactions?.items?.push({messageId: selMessage?.messageId, workerId: selMessage?.workerId, reactionChar: emoji})
                }
                else {
                    msg.reactions = toReactionListCLType({items: [{reactionChar: emoji}]})
                }
                return msg
            }
        })

        setState((prev) => ({ ...prev, messages: newMsgs ?? [] }))
        */
    }

    const _onThreadStart = async (selMessage: MessageCLType) => {
        const resultThreadHead = await _getThreadHead({ threadId: selMessage?.threadId ?? 'no-id' })
        if (resultThreadHead.success) {
            dispatch(
                setToastMessage({
                    text: 'このメッセージに対してスレッドを作成することはできません(スレッドのネスト)',
                    type: 'error',
                } as ToastMessage),
            )
            return
        }

        if (threadHead?.message) {
            // console.log(threadHead)
            dispatch(
                setToastMessage({
                    text: 'このメッセージに対してスレッドを作成することはできません',
                    type: 'error',
                } as ToastMessage),
            )
        } else if (selMessage?.isThreadStart) {
            dispatch(
                setToastMessage({
                    text: 'このメッセージに対してスレッドを作成することはできません',
                    type: 'error',
                } as ToastMessage),
            )
        } else {
            const result = await createNewThread({ message: selMessage ?? {}, myWorkerId: signInUser?.workerId ?? 'no-id' })
            await sleep(1000)
            navigation.push(side == 'admin' ? 'AdminChatDetail' : 'WorkerChatDetail', { roomId: roomId ?? 'no-id', threadId: result.success ?? 'no-id', name: 'スレッド：' + route.params?.name })
        }
    }

    const listKey = useMemo(() => getUuidv4(), [])

    const onViewableItemsChanged = useCallback(async (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
        const messages: MessageType[] = []
        // console.log('start-------------------------')
        info.viewableItems.forEach((item) => {
            // console.log('Viewable状態の要素', item.item.message)
            messages.push(item.item)
        })
        // console.log('end-------------------------')

        await createMessageRead({ messages, myWorkerId: signInUser?.workerId ?? 'no-id' })
    }, [])

    const viewabilityConfig = {
        waitForInteraction: false,
        minimumViewTime: 1000,
        itemVisiblePercentThreshold: 50,
    }

    let keyboardAvoidingBehavior: 'padding' | 'position' | 'height' | undefined = undefined
    if (Platform.OS == 'ios') {
        keyboardAvoidingBehavior = 'padding'
    }

    const _imageUrls = useMemo(() => {
        const pictureMessages = messages?.filter((msg) => msg.messageType === 'picture') || []
        const urls: IImageInfo[] = []
        for (let i = 0; i < pictureMessages.length; i++) {
            const msg = pictureMessages[i]
            const imageInfo: IImageInfo = {
                url: msg.xsAttachmentUrl || 'https://no-url',
                freeHeight: true,
                // freeWidth: false
            }
            urls.push(imageInfo)
        }
        return urls
    }, [messages])

    // console.log('******', _imageUrls);
    // console.log('selectedImage', selectedImage);

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#fff',
            }}>
            <KeyboardAvoidingView
                keyboardVerticalOffset={60 + 20} // adjust the value here if you need more padding
                style={{ backgroundColor: '#fff', flex: 1 }}

                behavior={'padding'}>
                <FlatList
                    style={{
                        backgroundColor: '#fff',
                        // position: 'absolute',
                        display: isVisibleEmoji ? 'none' : 'flex',
                    }}
                    ref={ref}
                    listKey={listKey}
                    inverted={true}
                    /* refreshControl={<RefreshControl refreshing={refreshing} onRefresh={_onRefresh} />} */
                    data={messages}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={_content}
                    ListHeaderComponent={_header}
                    ListFooterComponent={_footer}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    scrollsToTop={true}
                    onEndReached={_getMoreData}
                    onEndReachedThreshold={0.3}
                    viewabilityConfig={viewabilityConfig}
                    // onViewableItemsChanged={onViewableItemsChanged}
                />
                <ChatInput
                    style={{
                        // position: 'absolute',
                        // bottom: 0, 
                        width: WINDOW_WIDTH,
                    }}
                    reply={reply}
                    visible={!isVisibleEmoji}
                    roomUsers={roomUsers?.filter((user) => user.workerId !== signInUser?.workerId)}
                    onPost={(text) => _onPostMessage(text)}
                    onPostAttachment={(imageInfo) => _onPostPictureMessage(imageInfo)}
                    onCloseReply={() => setState((prev) => ({ ...prev, reply: undefined, selMessage: undefined }))}
                    onNotePress={() => {
                        navigation.push(side == 'admin' ? 'AdminChatNoteList' : 'WorkerChatNoteList', { roomId: roomId ?? 'no-id', threadId: threadId ?? 'no-id' })
                    }}
                    onTodoPress={() => {
                        navigation.push(side == 'admin' ? 'AdminTodoListRouter' : 'WorkerTodoListRouter')
                    }}
                />

                {/* <Modal isVisible={isVisibleForMessage}>
                <PopupForMessage
                    onCopy={async() => {
                        await Clipboard.setStringAsync(selMessage?.message as string)
                        setState((prev) => ({ ...prev, isVisibleForMessage: false }))
                    }}
                    onReply={() => {
                        setState((prev) => ({ ...prev, reply: selMessage, isVisibleForMessage: false }))
                    }}
                    onClose={() => {
                        setState((prev) => ({ ...prev, isVisibleForMessage: false }))
                    }}
                    onEmojiClick={() => {
                        setState((prev) => ({ ...prev, isVisibleForMessage: false }))
                        setTimeout(() => {
                            setState((prev) => ({ ...prev, isVisibleEmoji: true }))
                        }, 100);
                        //_onEmojiAdd(emoji)
                    }}
                    onThread={() => {
                        setState((prev) => ({ ...prev, isVisibleForMessage: false }))
                        _onThreadStart()
                    }}
                />
            </Modal> */}
                {!!isVisibleEmoji && (
                    <EmojiKeyboard
                        defaultHeight={500}
                        onEmojiSelected={(emoji) => {
                            _onEmojiAdd(emoji.emoji)
                            setState((prev) => ({ ...prev, isVisibleEmoji: false }))
                        }}
                    />
                )}
                <RNModal visible={isVisibleImageViewer} style={{ flex: 1, padding: 0 }}>
                    <ImageViewer
                        imageUrls={_imageUrls}
                        index={_imageUrls.findIndex((image) => image.url === selectedImage) || 0}
                        enableSwipeDown
                        swipeDownThreshold={20}
                        onSwipeDown={() => {
                            setState((prev) => ({ ...prev, isVisibleImageViewer: false }))
                        }}
                        loadingRender={() => <ActivityIndicator color={'#FFF'} />}
                        style={{ flex: 1, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                        saveToLocalByLongPress={false}
                    />
                </RNModal>

                {/* <EmojiSelectorUI 
                visible={isVisibleEmoji} 
                onEmojiSelect={(emoji) => {
                    _onEmojiAdd(emoji)
                    setState((prev) => ({ ...prev, isVisibleEmoji: false }))
                }}
            /> */}
            </KeyboardAvoidingView>
            
        </View>
    )
}
export default ChatDetail
