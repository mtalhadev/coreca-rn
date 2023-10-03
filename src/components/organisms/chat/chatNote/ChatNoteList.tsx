import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { isEmpty } from 'lodash'
import React, { useEffect, useMemo, useState } from 'react'
import { FlatList, ListRenderItem, ListRenderItemInfo, RefreshControl, Modal as RNModal, ActivityIndicator } from 'react-native'
import ImageViewer from 'react-native-image-zoom-viewer'
import { IImageInfo } from 'react-native-image-zoom-viewer/built/image-viewer.type'
import { useDispatch, useSelector } from 'react-redux'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { NoteCLType, NoteType, toNoteCLType } from '../../../../models/note/Note'
import { newCustomDate } from '../../../../models/_others/CustomDate'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { RootStackParamList } from '../../../../screens/Router'
import { _getFirestore } from '../../../../services/firebase/FirestoreService'
import { _getNote } from '../../../../services/note/NoteService'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { genKeyName, getCachedData, updateCachedData } from '../../../../usecases/CachedDataCase'
import { getNotesList, GetNotesListResponse } from '../../../../usecases/note/NoteListCase'
import { checkUpdateOfTargetScreen, deleteScreenOfUpdateScreens, getUpdateScreenOfTargetAccountAndScreen } from '../../../../usecases/updateScreens/CommonUpdateScreensCase'
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../../../utils/Constants'
import { SwitchAdminOrWorkerProps } from '../../../../utils/Utils'
import { BottomMargin } from '../../../atoms/BottomMargin'
import { Search } from '../../Search'
import { ChatNote, ChatNoteProps } from '../ChatNote'
import { EmojiKeyboard } from 'rn-emoji-keyboard'
import { _addOrDeleteNoteReactionOfTargetNote } from '../../../../services/noteReaction/NoteReactionService'
import { CommentsModal } from '../../../atoms/CommentsModal'

export type ChatNoteUIType = ChatNoteProps

const NOTES: ChatNoteUIType[] = [
    // { note: { noteId: 'chat-1', message: 'HI there',  worker: {name: '取引先',  imageUrl: 'https://i.pravatar.cc/50',} },    },
    // { note: { noteId: 'chat-2', message: 'HI there',  worker: {name: '個人',   imageUrl: 'https://i.pravatar.cc/50',} },    },
    // { note: { noteId: 'chat-3', message: 'HI there',  worker: {name: '力又夕公', imageUrl: 'https://i.pravatar.cc/50',} },  },
    // { note: { noteId: 'chat-4', message: 'HI there',  worker: {name: '取引先',  imageUrl: 'https://i.pravatar.cc/50',} }, },
]

type NavProps = StackNavigationProp<RootStackParamList, 'AdminChatNoteList'>
type RouteProps = RouteProp<RootStackParamList, 'AdminChatNoteList'>

type InitialStateType = {
    filtered?: ChatNoteUIType[]
    all?: ChatNoteUIType[]
    isImageViewerVisible?: boolean
    isVisibleEmoji?: boolean
    isCommentsVisible?: boolean
    note?: ChatNoteUIType
    updateCache: number
    refreshing: boolean
}
const initialState: InitialStateType = {
    all: NOTES,
    isImageViewerVisible: false,
    isVisibleEmoji: false,
    isCommentsVisible: false,
    updateCache: 0,
    refreshing: false,
}

const ChatNoteList = (props: Partial<SwitchAdminOrWorkerProps>) => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const side = props.side ?? 'admin'
    const screenName: 'AdminChatNoteList' | 'WorkerChatNoteList' = side == 'admin' ? 'AdminChatNoteList' : 'WorkerChatNoteList'
    const { t } = useTextTranslation()

    const [{ filtered, all, isImageViewerVisible, isVisibleEmoji, isCommentsVisible, note, updateCache, refreshing }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const accountId = signInUser?.accountId ?? ''
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)

    const cachedNotesListKey = genKeyName({ screenName: screenName, accountId: accountId, companyId: myCompanyId ?? '' })

    const [textFilter, setTextFilter] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1, refreshing: true }))

            /**
             * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
             */
            ;(async () => {
                const isUpdateResult = await checkUpdateOfTargetScreen({
                    accountId: accountId,
                    targetScreenName: screenName,
                    localUpdateScreens,
                })
                if (isUpdateResult.success) {
                    const newLocalUpdateScreens = localUpdateScreens.filter((screen) => screen.screenName != screenName)
                    dispatch(setLocalUpdateScreens(newLocalUpdateScreens))
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
                if (isEmpty(signInUser?.workerId)) {
                    dispatch(setIsNavUpdating(false))
                    setState((prev) => ({ ...prev, refreshing: false }))
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const notesListResult: CustomResponse<GetNotesListResponse> = await getNotesList({
                    roomId: route.params?.roomId ?? 'no-id',
                    threadId: route.params?.threadId ?? 'no-id',
                    greaterThan: newCustomDate().totalSeconds,
                })
                if (notesListResult.error) {
                    dispatch(
                        setToastMessage({
                            text: notesListResult.error,
                            type: 'error',
                        } as ToastMessage),
                    )
                    return
                }

                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                setState((prev) => ({ ...prev, all: notesListResult.success ?? [], filtered: notesListResult.success ?? [] }))

                const cachedResult = await updateCachedData({ key: cachedNotesListKey, value: notesListResult.success })
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

    console.log('====>>> All Notes: ', all)

    useSafeLoadingUnmount(dispatch, isFocused)

    useSafeUnmount(setState, initialState)

    // console.log('route.params?.roomId: ',route.params?.roomId);
    // console.log('route.params?.threadId: ',route.params?.threadId);

    /**
     * @summary updateCacheフラグが変化した時の副作用フック（KVSから表示データを再取得更新）
     * @purpose アプリ側にKVSによるキャッシュを設けて一覧の初期表示速度を改善する
     * @author Okuda
     */
    // useEffect(() => {
    //     ;(async () => {
    //         const result = await getCachedData<GetNotesListResponse>(cachedNotesListKey)
    //         if (result.error) {
    //             if (result.errorCode != 'FIRST_FETCH') {
    //                 dispatch(
    //                     setToastMessage({
    //                         text: result.error,
    //                         type: 'error',
    //                     }),
    //                 )
    //             }
    //             setState((rev) => ({ ...rev, refreshing: true }))
    //         } else {
    //             setState((rev) => ({ ...rev, all: result.success ?? [] , filtered: result.success ?? [] }))
    //         }
    //     })()
    // }, [updateCache])

    useEffect(() => {
        if (textFilter && textFilter.length > 0) {
            let searchText = textFilter
            const filteredData =
                all?.filter(({ note }) => {
                    if (note.message?.length || note.worker?.name?.length) return note?.message?.includes(searchText) || note?.worker?.name?.includes(searchText)
                }) || []
            if (filteredData.length > 0) {
                setState((prev) => ({ ...prev, filtered: filteredData }))
            } else {
                setState((prev) => ({ ...prev, filtered: [] }))
            }
        } else {
            setState((prev) => ({ ...prev, filtered: all }))
        }
    }, [textFilter])

    const _content: ListRenderItem<ChatNoteUIType> = (info: ListRenderItemInfo<ChatNoteUIType>) => {
        const { item, index } = info
        const item2 = {
            ...item,
            onImagePress: () => {
                setState((prev) => ({ ...prev, isImageViewerVisible: true, note: item }))
            },
            onAddEmoji: () => {
                setTimeout(() => {
                    setState((prev) => ({ ...prev, note: item, isVisibleEmoji: true }))
                }, 100)
            },
            onComment: () => {
                setState((prev) => ({ ...prev, note: item, isCommentsVisible: true }))
            },
        }

        return <ChatNote {...item2} />
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
            title={t('common:SearchByWorkerName')}
            onChange={setTextFilter}
            clearText={() => setTextFilter(undefined)}
            placeholder={t('common:SearchByWorkerName')}
            onBlur={undefined}
        />
    )

    const _onRefresh = async () => {
        setState((prev) => ({ ...prev, refreshing: true }))
    }

    const _onEmojiAdd = async (emoji: string) => {
        await _addOrDeleteNoteReactionOfTargetNote({
            noteId: note?.note.noteId ?? 'no-id',
            workerId: signInUser?.workerId ?? 'no-id',
            reactionChar: emoji,
        })
    }
    // const _getMoreData = async(): Promise<void> => {
    //     if (all == undefined || all?.length == 0) {
    //         return Promise.resolve()
    //     }

    //     console.log("**************" + all[(all?.length ?? 0) - 1].updatedAt?.totalSeconds)

    //     const dmListResult: CustomResponse<GetDMListResponse> = await getDmList({
    //         myWorkerId: signInUser?.workerId ?? 'no-id',
    //         myCompanyId: myCompanyId ?? 'no-id',
    //         beforeSecond: all[(all?.length ?? 0) - 1].updatedAt?.totalSeconds ?? 0
    //     })
    //     if (dmListResult.error) {
    //         throw {
    //             error: dmListResult.error,
    //         }
    //     }

    //     setState((prev) => ({ ...prev,
    //         allDms: [ ...(all ?? []), ...(dmListResult.success ?? [])] ,
    //     }))

    // }

    const _imageUrls = useMemo(() => {
        const attachments = note?.attachments?.filter((att) => att.attachmentType === 'picture') || []
        const urls: IImageInfo[] = []
        for (let i = 0; i < attachments.length; i++) {
            const attachment = attachments[i]
            const imageInfo: IImageInfo = {
                url: attachment.xsAttachmentUrl || 'https://no-url',
                freeHeight: true,
                // freeWidth: false
            }
            urls.push(imageInfo)
        }
        return urls
    }, [note?.attachments])

    return (
        <>
            <FlatList
                style={{
                    backgroundColor: '#FFF',
                    display: isVisibleEmoji ? 'none' : 'flex',
                }}
                contentContainerStyle={{ alignItems: 'center' }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={_onRefresh} />}
                data={filtered}
                renderItem={_content}
                keyExtractor={(item, i) => item.note?.noteId ?? 'note-' + i}
                ListHeaderComponent={_header}
                ListFooterComponent={() => <BottomMargin />}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                // onEndReached={_getMoreData}
                onEndReachedThreshold={0.3}
            />

            <CommentsModal
                comments={note?.comments ?? []}
                noteId={note?.note.noteId}
                isVisible={isCommentsVisible}
                closeModal={() => setState((prev) => ({ ...prev, isCommentsVisible: false }))}
                // onAttachmentPress={() => }
            />

            <RNModal visible={isImageViewerVisible} style={{ flex: 1, padding: 0 }}>
                <ImageViewer
                    imageUrls={_imageUrls}
                    index={0}
                    enableSwipeDown
                    swipeDownThreshold={20}
                    onSwipeDown={() => {
                        setState((prev) => ({ ...prev, isImageViewerVisible: false }))
                    }}
                    loadingRender={() => <ActivityIndicator color={'#FFF'} />}
                    style={{ flex: 1, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                    saveToLocalByLongPress={false}
                />
            </RNModal>
            {!!isVisibleEmoji && (
                <EmojiKeyboard
                    defaultHeight={500}
                    onEmojiSelected={(emoji) => {
                        _onEmojiAdd(emoji.emoji)
                        setState((prev) => ({ ...prev, isVisibleEmoji: false }))
                    }}
                />
            )}
        </>
    )
}

export default ChatNoteList
