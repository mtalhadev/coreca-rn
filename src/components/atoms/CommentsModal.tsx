import { ImageInfo } from 'expo-image-picker';
import React, { useEffect, useState } from 'react'
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Image, FlatList, ListRenderItem, ListRenderItemInfo, ViewProps, ViewStyle, Pressable } from 'react-native';
import Modal from 'react-native-modal'
import { useDispatch, useSelector } from 'react-redux';
import { NoteCommentCLType } from '../../models/noteComment/NoteComment';
import { toWorkerCLType } from '../../models/worker/Worker';
import { newCustomDate } from '../../models/_others/CustomDate';
import { CustomResponse } from '../../models/_others/CustomResponse';
import { _uploadImageAndGetUrl } from '../../services/firebase/StorageService';
import { getErrorToastMessage } from '../../services/_others/ErrorService';
import { StoreType } from '../../stores/Store';
import { setLoading, setToastMessage, ToastMessage } from '../../stores/UtilSlice';
import { createNewNote, createNewNoteComment } from '../../usecases/note/AddNoteCase';
import { getCommentList, GetCommentListResponse } from '../../usecases/note/CommentListCase';
import { SCREEN_WIDTH, THEME_COLORS, WINDOW_WIDTH } from '../../utils/Constants'
import { resizeImage } from '../../utils/Utils';
import ChatInput from '../organisms/chat/ChatInput';
import { ChatNoteComment, ChatNoteCommentProps } from '../organisms/chat/ChatNoteComment';
const COMMENTS: NoteCommentCLType[] = [
    {
        noteCommentId: '1',
        noteId: '23232',
        worker: { workerId: '453453', name: 'Aksjflks', imageUrl: 'https://i.pravatar.cc/50'},
        commentType: 'text',
        message: 'HI',
        // attachmentUrl: 'https://i.pravatar.cc/500',
        // sAttachmentUrl: 'https://i.pravatar.cc/250',
        // xsAttachmentUrl: 'https://i.pravatar.cc/100',
        createdAt: newCustomDate()
    },
    {
        noteCommentId: '1',
        noteId: '23232',
        worker: { workerId: '453453', name: 'Aksjflks', imageUrl: 'https://i.pravatar.cc/50'},
        commentType: 'text',
        message: 'HI',
        // attachmentUrl: 'https://i.pravatar.cc/500',
        // sAttachmentUrl: 'https://i.pravatar.cc/250',
        // xsAttachmentUrl: 'https://i.pravatar.cc/100',
        createdAt: newCustomDate()
    },
    {
        noteCommentId: '1',
        noteId: '23232',
        worker: { workerId: '453453', name: 'Aksjflks', imageUrl: 'https://i.pravatar.cc/50'},
        commentType: 'text',
        message: 'HI',
        attachmentUrl: 'https://i.pravatar.cc/500',
        sAttachmentUrl: 'https://i.pravatar.cc/250',
        xsAttachmentUrl: 'https://i.pravatar.cc/100',
        createdAt: newCustomDate()
    },
    {
        noteCommentId: '1',
        noteId: '23232',
        worker: { workerId: '453453', name: 'Aksjflks', imageUrl: 'https://i.pravatar.cc/50'},
        commentType: 'text',
        message: 'HI',
        // attachmentUrl: 'https://i.pravatar.cc/500',
        // sAttachmentUrl: 'https://i.pravatar.cc/250',
        // xsAttachmentUrl: 'https://i.pravatar.cc/100',
        createdAt: newCustomDate()
    },
    {
        noteCommentId: '1',
        noteId: '23232',
        worker: { workerId: '453453', name: 'Aksjflks', imageUrl: 'https://i.pravatar.cc/50'},
        commentType: 'text',
        message: 'HI',
        // attachmentUrl: 'https://i.pravatar.cc/500',
        // sAttachmentUrl: 'https://i.pravatar.cc/250',
        // xsAttachmentUrl: 'https://i.pravatar.cc/100',
        createdAt: newCustomDate()
    },
    {
        noteCommentId: '1',
        noteId: '23232',
        worker: { workerId: '453453', name: 'Aksjflks', imageUrl: 'https://i.pravatar.cc/50'},
        commentType: 'text',
        message: 'HI',
        // attachmentUrl: 'https://i.pravatar.cc/500',
        // sAttachmentUrl: 'https://i.pravatar.cc/250',
        // xsAttachmentUrl: 'https://i.pravatar.cc/100',
        createdAt: newCustomDate()
    },
    {
        noteCommentId: '1',
        noteId: '23232',
        worker: { workerId: '453453', name: 'Aksjflks', imageUrl: 'https://i.pravatar.cc/50'},
        commentType: 'text',
        message: 'HI',
        attachmentUrl: 'https://i.pravatar.cc/500',
        sAttachmentUrl: 'https://i.pravatar.cc/250',
        xsAttachmentUrl: 'https://i.pravatar.cc/100',
        createdAt: newCustomDate()
    },
    {
        noteCommentId: '1',
        noteId: '23232',
        worker: { workerId: '453453', name: 'Aksjflks', imageUrl: 'https://i.pravatar.cc/50'},
        commentType: 'text',
        message: 'byw',
        // attachmentUrl: 'https://i.pravatar.cc/500',
        // sAttachmentUrl: 'https://i.pravatar.cc/250',
        // xsAttachmentUrl: 'https://i.pravatar.cc/100',
        createdAt: newCustomDate()
    },
]
export type CommentsProps = {
    isVisible: boolean
    noteId: string
    comments: NoteCommentCLType[]
    closeModal: () => void
    onAttachmentPress: (attachment: string) => void

}

const scrollViewRef = React.createRef<ScrollView>()

export const CommentsModal = React.memo((props: Partial<CommentsProps>) => {

    const { isVisible, noteId, closeModal, onAttachmentPress } = props
    const dispatch = useDispatch();
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const [noteComments, setNoteComments] = useState<NoteCommentCLType[]>(COMMENTS ?? []);   
    const [scrollOffset, setScrollOffset] = useState<number>(0)

    useEffect(() => {
        if(noteId) {
            ;(async () => {
                try {
                    dispatch(setLoading(true))
                    const commentsListResult: CustomResponse<GetCommentListResponse> = await getCommentList(noteId)
                    if (commentsListResult.error) {
                        dispatch(
                            setToastMessage({
                                text: commentsListResult.error,
                                type: 'error',
                            } as ToastMessage),
                        )
                        return
                    }
                    setNoteComments(commentsListResult.success ?? [])
                } catch (error) {
                    const _error = error as CustomResponse
                    dispatch(
                        setToastMessage({
                            text: getErrorToastMessage(_error),
                            type: 'error',
                        } as ToastMessage),
                    )
                } finally {
                    dispatch(setLoading(false))
                }
            })()
        }

    }, [noteId]);

    const _handleOnScroll = (offsetY: number) => {
        setScrollOffset(offsetY)
    }
    const _handleScrollTo = (p: any) => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo(p);
        }
    }
    
    const _onAttachmentPress = (attachment: string) => {

    } 
    const _onPostComment = async (message: string) => {
        if(noteId && signInUser?.workerId){     
            const noteComment: NoteCommentCLType = {
                commentType: 'text',
                noteId,
                worker: toWorkerCLType(signInUser.worker),
                message,
                createdAt: newCustomDate()
            }
            setNoteComments(noteComments.concat(noteComment))

            dispatch(setLoading(true))      
            const createNoteResult = await createNewNoteComment({
                noteId,
                workerId: signInUser.workerId,
                commentType: 'text',
                message: message,
            })
            if (createNoteResult.error) {
                // console.log('====>>> error: ', createNoteResult.error)
                dispatch(
                    setToastMessage({
                        text: createNoteResult.error,
                        type: 'error',
                    })
                )
            } else if (createNoteResult.success){
                dispatch(
                    setToastMessage({
                        text: 'Comment created',
                        type: 'success',
                    })
                );
            }
            dispatch(setLoading(false))    
        } 
    }
    const _onPostAttachment = async (image: ImageInfo) => {
        if(noteId && signInUser?.workerId && image){     
            const noteComment: NoteCommentCLType = {
                commentType: 'picture',
                noteId,
                worker: toWorkerCLType(signInUser.worker),
                message: "",
                attachmentUrl: image.uri,
                sAttachmentUrl: image.uri,
                xsAttachmentUrl: image.uri,
                createdAt: newCustomDate()
            }
            setNoteComments(noteComments.concat(noteComment))

            const resize = await resizeImage(image)
            const [mSizeResult, sSizeResult, xsSizeResult] = await Promise.all([_uploadImageAndGetUrl(resize.m?.uri), _uploadImageAndGetUrl(resize.s?.uri), _uploadImageAndGetUrl(resize.xs?.uri)])
            const imageUrl = mSizeResult.success
            const sImageUrl = sSizeResult.success
            const xsImageUrl = xsSizeResult.success

            const createNoteResult = await createNewNoteComment({
                noteId,
                workerId: signInUser.workerId,
                commentType: 'text',
                message: "",
                attachmentUrl: imageUrl,
                sAttachmentUrl: sImageUrl,
                xsAttachmentUrl: xsImageUrl,
            })
            if (createNoteResult.error) {
                // console.log('====>>> error: ', createNoteResult.error)
                dispatch(
                    setToastMessage({
                        text: createNoteResult.error,
                        type: 'error',
                    })
                )
            } else if (createNoteResult.success){
                dispatch(
                    setToastMessage({
                        text: 'Comment created',
                        type: 'success',
                    })
                );
            }
        } 
    }

    const contentHeight = 60 * noteComments.length + 200;
    const scrollViewHeight = 600;

    return (
        <Modal
            isVisible={isVisible}
            onBackButtonPress={closeModal}
            onBackdropPress={closeModal}
            animationIn='slideInUp'
            animationOut={'slideOutDown'}
            swipeDirection={['down']}
            scrollTo={_handleScrollTo}
            scrollOffset={scrollOffset}
            scrollOffsetMax={contentHeight - scrollViewHeight} // content height - ScrollView height
            propagateSwipe={true}    
            onSwipeComplete={closeModal}
            style={{ justifyContent: 'flex-end', margin:0 }}
        >
            <View style={{
                height: scrollViewHeight,
                backgroundColor: '#FFF',
                borderRadius: 30,
            }}>
                <View style={{
                    width: 80,
                    height: 8,
                    borderRadius: 10,
                    backgroundColor: THEME_COLORS.OTHERS.LIGHT_GRAY,
                    alignSelf: 'center',
                    marginVertical: 12
                }}/>
                <View style={{
                    flex: 1,
                    marginVertical: 10,
                }}>
                    <ScrollView
                        ref={scrollViewRef}
                        onScroll={(e) => _handleOnScroll(e.nativeEvent.contentOffset.y)}
                        scrollEventThrottle={16}
                        contentContainerStyle={{ alignItems: 'center' }}>
                        {
                            noteComments.map((comment, index) => (
                                <ChatNoteComment 
                                    comment={comment}
                                    onAttachmentPress={onAttachmentPress}
                                    key={comment.noteCommentId ?? 'comment-'+index}
                                />
                            ))
                        }
                    </ScrollView>
                </View>
                <ChatInput
                    style={{
                        // position: 'absolute',
                        // bottom: 0, 
                        width: WINDOW_WIDTH,
                    }}
                    showAtIcon={false}
                    onPost={(text) => _onPostComment(text)}
                    onPostAttachment={(imageInfo) => _onPostAttachment(imageInfo)}
                />
            </View>
        </Modal>

    );
})