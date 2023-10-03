import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { Image, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { Icon } from '../../../atoms/Icon'
import { NavButton } from '../../../atoms/NavButton'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { checkUpdateOfTargetScreen } from '../../../../usecases/updateScreens/CommonUpdateScreensCase'
import { SCREEN_WIDTH, THEME_COLORS } from '../../../../utils/Constants'
import { FontStyle, GlobalStyles } from '../../../../utils/Styles'
import { RootStackParamList } from '../../../../screens/Router'
import { pickImage, resizeImage, SwitchAdminOrWorkerProps } from '../../../../utils/Utils'
import { AppButton } from '../../../atoms/AppButton'
import { _createNote } from '../../../../services/note/NoteService'
import { NoteType } from '../../../../models/note/Note'
import { createNewNote, createNewNoteAttachment } from '../../../../usecases/note/AddNoteCase'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import { Images } from '../../../atoms/Images'
import { _uploadImageAndGetUrl } from '../../../../services/firebase/StorageService'
import { Modal } from 'react-native-paper'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { getRoomInfo, getRoomInfoResponse } from '../../../../usecases/chat/MembersListCase'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { RoomUserType } from '../../../../models/roomUser/RoomUser'
import { MentionPopup } from '../MentionPopup'
import ParsedText from 'react-native-parsed-text'

type InitialStateType = {
    message: string
    roomUsers?: RoomUserType[]
    updateCache: number,
    refreshing: boolean
}
const initialState: InitialStateType = {
    message: '',
    roomUsers: [],
    updateCache: 0,
    refreshing: false
}

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'AdminAddNote'>

const AddNote = (props: Partial<SwitchAdminOrWorkerProps>) => {
  const [{ updateCache, refreshing, message, roomUsers }, setState] = useState(initialState)
  const { t } = useTextTranslation()
  const navigation = useNavigation<NavProps>()
  const route = useRoute<RouteProps>()
  const { roomId, threadId } = route.params ?? { roomId: "no-id", threadId: 'no-id' }
  const side = props.side ?? 'admin'

  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
  const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
  const signInUser = useSelector((state: StoreType) => state.account.signInUser)
  const accountId = signInUser?.accountId ?? ''

  const [images, setImages] = useState<ImageInfo[]>([]);
  const [mentionInput, setMentionInput] = useState<string>('');
  const [showPopover, setShowPopover] = useState<boolean>(false);
  const [isMessageStarted, setIsMessageStarted] = useState(true);
  const [members, setMembers] = useState<RoomUserType[]>(roomUsers || []);
  const [mentionUSer, setMentionUSer] = useState<RoomUserType>();

	useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))

            /**
             * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
             */
            ;(async () => {
                const isUpdateResult = await checkUpdateOfTargetScreen({
                    accountId: signInUser?.accountId,
                    targetScreenName: (side == 'admin' ? 'AdminAddNote' : 'WorkerAddNote'),
                    localUpdateScreens,
                })
                if (isUpdateResult.success) {
                    dispatch(setIsNavUpdating(true))
                }
            })()
            ;(async () => {
                try {
                    const roomResult: CustomResponse<getRoomInfoResponse> = await getRoomInfo(roomId, signInUser?.workerId ?? 'no-id')
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
    }, [isFocused])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, refreshing: true }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useSafeUnmount(setState, initialState)

    useEffect(() => {
        if(roomUsers?.length) {
            setMembers(roomUsers);
        }
    }, [roomUsers]);

    useEffect(() => {
        if(mentionUSer) {
            const index = message.lastIndexOf('@');
            setState(prev => ({ ...prev, message: message.substring(0, index).concat(`@${mentionUSer.worker?.name} `) }))
        }
    }, [mentionUSer]);

    const _createNewNote = async () => {
        if(roomId && threadId && signInUser?.workerId){     
            dispatch(setLoading(true))      
            const createNoteResult = await createNewNote(roomId, threadId, signInUser?.workerId, message)
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
                        text: 'Note created',
                        type: 'success',
                    })
                );
                if(images.length>0){
                    for (let i = 0; i < images.length; i++) {
                        const image = images[i];
                        const resize = await resizeImage(image)
                        const [mSizeResult, sSizeResult, xsSizeResult] = await Promise.all([_uploadImageAndGetUrl(resize.m?.uri), _uploadImageAndGetUrl(resize.s?.uri), _uploadImageAndGetUrl(resize.xs?.uri)])
                        const imageUrl = mSizeResult.success
                        const sImageUrl = sSizeResult.success
                        const xsImageUrl = xsSizeResult.success
                        const attachResult = await createNewNoteAttachment({
                            noteId: createNoteResult.success,
                            index: i+1,
                            attachmentType: 'picture',
                            attachmentUrl : imageUrl,
                            sAttachmentUrl: sImageUrl,
                            xsAttachmentUrl: xsImageUrl
                        })
                        if (attachResult.error) {
                            // console.log('====>>> error: ', createNoteResult.error)
                            dispatch(
                                setToastMessage({
                                    text: attachResult.error,
                                    type: 'error',
                                })
                            )
                        } else if(attachResult.success) {
                            dispatch(
                                setToastMessage({
                                    text: `Picture ${i+1} of ${images.length} uploaded`,
                                    type: 'success',
                                })
                            );
            
                        }
                    }
                }
                dispatch(setLoading(false))      
                navigation.goBack();
            }  
        } 
    }
    
    const _onChangeText = (text:string) => {
        setState(prev => ({ ...prev, message: text }))
    }
    const _onKeyPress = (key: string) => {
        if(key == '@') {
            setShowPopover(true)
            setIsMessageStarted(false)
        } else if(key == " "){
            setShowPopover(false)
            setIsMessageStarted(true)
            setMentionInput('')
        } else {
            if(!isMessageStarted) {
                if(key !== 'Backspace')
                    setMentionInput(mentionInput+key);
                else 
                    setMentionInput(mentionInput.slice(0, -1) || '');

            }
        }
        // console.log('key pressed: ', key);
        
    }

    const _handleUrlPress = async (url: string) => {
        if(await Linking.canOpenURL(url))
            await Linking.openURL(url);
    }
    const _handleEmailPress = (email: string)  => {
        Linking.openURL(`mailto:${email}`);
    }
    const _handlePhonePress = (phone: string)  => {
        Linking.openURL(`sms:${phone}`);
    }
    const _handleMentionNamePress = (mentionName: string)  => {
        setMentionUSer(roomUsers?.find(item => item.worker?.name && mentionName.includes(item.worker?.name)));
        setShowPopover(true)
    }
    
    const _onSelectUser = (workerId: string) => {
        setShowPopover(false);
        console.log('workerId: ',workerId);
        const roomUser = roomUsers?.find(item => item.worker?.workerId === workerId);
        setMentionUSer(roomUser);
    }

    const filtered = members.filter(item => item.worker?.name?.startsWith(mentionInput)) 


  return (
    <View style={{
      flex: 1,
      backgroundColor: 'white',  
    }}>

        <AppButton
            style={{
                margin: 15
            }}
            isGray
            hasShadow={false}
            title={t('common:AddNote')}
            onPress={() => _createNewNote()}
            disabled={message.length===0 && images.length===0}
            />

        {images.length>0 && (
            <Images
                images={images.map(img => img.uri)}
                onRemoveImage={(imageUri) => { setImages(images.filter(image => image.uri !== imageUri)) }}
                />
        )}

        <MentionPopup
            data={filtered.length ? filtered : members}
            visible={showPopover}
            selected={mentionUSer}
            onSelectUser={_onSelectUser}
            containerStyle={{ left: 10, right: 10, bottom: 30, width: SCREEN_WIDTH-20 }}
        />

        <TextInput
            multiline={true}
            onChangeText={_onChangeText}
            onKeyPress={(e) => _onKeyPress(e.nativeEvent.key)}
            placeholder={t('common:EnterText')}
            autoFocus
            style={{
                flex: 1,
                marginHorizontal: 10,
                paddingTop: 9,
                paddingHorizontal: 10,
                ...GlobalStyles.normalText,
            }}
        >
            <ParsedText
                style={{
                    fontFamily: FontStyle.regular,
                    fontSize: 12,    
                }}
                parse={[
                    {
                        type: 'url',
                        style: {
                            color: THEME_COLORS.BLUE.MIDDLE_DEEP
                        },
                        onPress: _handleUrlPress
                    }, {
                        type: 'phone',
                        style: {
                            color: THEME_COLORS.BLUE.MIDDLE_DEEP
                        },
                        onPress: _handlePhonePress
                    }, {
                        type: 'email',
                        style: {
                            color: THEME_COLORS.BLUE.MIDDLE_DEEP
                        },
                        onPress: _handleEmailPress
                    }, {
                        pattern: /@(\w+)|@(従業員\d{5})/,
                        style: {
                            color: THEME_COLORS.BLUE.MIDDLE_DEEP,
                            fontFamily: FontStyle.bold
                        },
                        onPress: _handleMentionNamePress
                    },
                ]}
                childrenProps={{allowFontScaling: false}}
                >
                    {message}
            </ParsedText>

        </TextInput>
        
        <AppButton
            style={{
                margin: 15,
                marginBottom: 30
            }}
            isGray
            hasShadow={false}
            title={t('common:AddPicture')}
            onPress={async ()=> {
                const image = await pickImage(false)
                if(!image) return
                setImages(images.concat(image))
            }}
            />
    </View>
  )
}   

export default AddNote;