import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Image, Linking, Pressable, Text, TextInput, View, ViewStyle } from 'react-native'

import { FontStyle, GlobalStyles } from '../../../utils/Styles'
import _, { trim } from 'lodash'
import { IPHONEX_BOTTOM_HEIGHT, THEME_COLORS, WINDOW_WIDTH } from '../../../utils/Constants'
import { MessageCLType } from '../../../models/message/Message'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { Icon } from '../../atoms/Icon'
import { pickImage, resizeImage } from '../../../utils/Utils'
import { _uploadImageAndGetUrl } from '../../../services/firebase/StorageService'
import { ThreadLogType } from '../../../models/threadLog/ThreadLog'
import { MentionPopup } from './MentionPopup'
import { RoomUserType } from '../../../models/roomUser/RoomUser'
import ParsedText from 'react-native-parsed-text'
import VectorIcon from '../../atoms/VectorIcon'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import { isIphoneX } from 'react-native-iphone-screen-helper'
import { navigate } from '../../../screens/RootNavigation'

export type ChatInputProps = {
    reply?: MessageCLType
    threadReply?: ThreadLogType
    visible?: boolean
    roomUsers: RoomUserType[]
    style?: ViewStyle
    showAtIcon?: boolean
    onPost?: (message: string) => void
    onPostAttachment?: (image: ImageInfo) => void
    onCloseReply?: () => void
    onCloseThreadReply?: () => void
    onNotePress?: () => void
    onTodoPress?: () => void
}

const viewRef = React.createRef<View>()

export const ChatInput = React.memo((props: Partial<ChatInputProps>) => {
    let { reply, threadReply, visible, style, roomUsers, showAtIcon, onPost, onPostAttachment, onCloseReply, onCloseThreadReply, onNotePress, onTodoPress } = props
    const { t } = useTextTranslation()

    const [textInput, setTextInput] = useState<string>('')
    const [mentionInput, setMentionInput] = useState<string>('')
    const [showPopover, setShowPopover] = useState<boolean>(false)
    const [isMessageStarted, setIsMessageStarted] = useState(true)
    const [members, setMembers] = useState<RoomUserType[]>(roomUsers || [])
    const [mentionUSer, setMentionUSer] = useState<RoomUserType>()
    const [imageInfo, setImageInfo] = useState<ImageInfo>()

    // console.log('mentionUSer',mentionUSer);

    useEffect(() => {
        if (roomUsers?.length) {
            setMembers(roomUsers)
        }
    }, [roomUsers])

    useEffect(() => {
        if (mentionUSer) {
            const index = textInput.lastIndexOf('@')
            setTextInput(textInput.substring(0, index).concat(`@${mentionUSer.worker?.name} `))
        }
    }, [mentionUSer])

    visible = visible ?? true
    showAtIcon = showAtIcon ?? true

    const checkEmpty = (text: string | undefined): boolean => {
        if (text == undefined) {
            return true
        }
        if (trim(text) == '') {
            return true
        }
        return false
    }

    const _onChangeText = (text: string) => {
        setTextInput(text)
    }
    const _onKeyPress = (key: string) => {
        if (key == '@') {
            setShowPopover(true)
            setIsMessageStarted(false)
        } else if (key == ' ') {
            setShowPopover(false)
            setIsMessageStarted(true)
            setMentionInput('')
        } else {
            if (!isMessageStarted) {
                if (key !== 'Backspace') setMentionInput(mentionInput + key)
                else setMentionInput(mentionInput.slice(0, -1) || '')
            }
        }
        // console.log('key pressed: ', key)
    }
    // console.log('=== mentionInput: ', mentionInput);

    const _handleUrlPress = async (url: string) => {
        if (await Linking.canOpenURL(url)) await Linking.openURL(url)
    }
    const _handleEmailPress = (email: string) => {
        Linking.openURL(`mailto:${email}`)
    }
    const _handlePhonePress = (phone: string) => {
        Linking.openURL(`sms:${phone}`)
    }
    const _handleMentionNamePress = (mentionName: string) => {
        setMentionUSer(roomUsers?.find((item) => item.worker?.name && mentionName.includes(item.worker?.name)))
        setShowPopover(true)
    }

    const _onSelectUser = (workerId: string) => {
        setShowPopover(false)
        console.log('workerId: ', workerId)
        const roomUser = roomUsers?.find((item) => item.worker?.workerId === workerId)
        setMentionUSer(roomUser)
    }

    const filtered = members.filter((item) => item.worker?.name?.startsWith(mentionInput))

    return (
        <View
            ref={viewRef}
            style={[
                {
                    flexDirection: 'column',
                    display: visible ? 'flex' : 'none',
                    padding: 10,
                    paddingBottom: isIphoneX() ? IPHONEX_BOTTOM_HEIGHT : 0,
                    backgroundColor: '#fff',
                    // borderColor: THEME_COLORS.OTHERS.GRAY,
                    // borderTopWidth: 0.5
                },
                style,
            ]}>
            {reply && (
                <View
                    style={{
                        flexDirection: 'row',
                    }}>
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                color: THEME_COLORS.BLUE.MIDDLE,
                            }}>
                            Re : {reply?.worker?.name}
                        </Text>
                        <Text
                            style={{
                                color: THEME_COLORS.OTHERS.GRAY,
                            }}
                            numberOfLines={1}
                            ellipsizeMode={'tail'}>
                            {reply?.message}
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => {
                            if (onCloseReply) {
                                onCloseReply()
                            }
                        }}>
                        <Icon name="close-reply" fill={THEME_COLORS.BLUE.HIGH_LIGHT} />
                    </Pressable>
                </View>
            )}
            {threadReply && (
                <View
                    style={{
                        borderTopColor: THEME_COLORS.BLUE.MIDDLE,
                        borderTopWidth: 1,
                        flexDirection: 'row',
                        paddingVertical: 8,
                        paddingHorizontal: 8,
                    }}>
                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                fontFamily: FontStyle.bold,
                            }}
                            numberOfLines={1}
                            ellipsizeMode={'tail'}>
                            {threadReply.room?.name ? threadReply.room?.name + 'へ投稿' : ''}
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => {
                            if (onCloseThreadReply) {
                                onCloseThreadReply()
                            }
                        }}>
                        <Icon name="close-reply" fill={THEME_COLORS.BLUE.HIGH_LIGHT} />
                    </Pressable>
                </View>
            )}
            <View
                style={{
                    flexDirection: 'column',
                }}>
                <View
                    style={{
                        flexDirection: 'row',
                    }}>
                    <TextInput
                        multiline={true}
                        onChangeText={_onChangeText}
                        onKeyPress={(e) => _onKeyPress(e.nativeEvent.key)}
                        style={{
                            borderColor: THEME_COLORS.OTHERS.GRAY,
                            borderWidth: 0.5,
                            borderRadius: 15,
                            marginHorizontal: 0,
                            flex: 1,
                            paddingTop: 9,
                            paddingHorizontal: 10,
                            ...GlobalStyles.normalText,
                        }}>
                        <ParsedText
                            style={{
                                fontFamily: FontStyle.regular,
                                fontSize: 12,
                            }}
                            parse={[
                                {
                                    type: 'url',
                                    style: {
                                        color: THEME_COLORS.BLUE.MIDDLE_DEEP,
                                    },
                                    onPress: _handleUrlPress,
                                },
                                {
                                    type: 'phone',
                                    style: {
                                        color: THEME_COLORS.BLUE.MIDDLE_DEEP,
                                    },
                                    onPress: _handlePhonePress,
                                },
                                {
                                    type: 'email',
                                    style: {
                                        color: THEME_COLORS.BLUE.MIDDLE_DEEP,
                                    },
                                    onPress: _handleEmailPress,
                                },
                                {
                                    pattern: /@(\w+)|@(従業員\d{5})/,
                                    style: {
                                        color: THEME_COLORS.BLUE.MIDDLE_DEEP,
                                        fontFamily: FontStyle.bold,
                                    },
                                    onPress: _handleMentionNamePress,
                                },
                            ]}
                            childrenProps={{ allowFontScaling: false }}>
                            {textInput}
                        </ParsedText>
                    </TextInput>

                    <Pressable
                        onPress={async () => {
                            if (onPost && !checkEmpty(textInput)) {
                                onPost(textInput.trim())
                                setTextInput('')
                            } else if (imageInfo && imageInfo.uri) {
                                if (onPostAttachment) {
                                    onPostAttachment(imageInfo)
                                }
                                setImageInfo(undefined)
                            }
                        }}
                        style={({ pressed }) => ({
                            opacity: pressed ? 0.7 : 1,
                        })}>
                        <View
                            style={{
                                width: 35,
                                height: 35,
                                marginLeft: 8,
                                backgroundColor: THEME_COLORS.BLUE.MIDDLE,
                                borderRadius: 25,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                            <VectorIcon.FontAwesome name="send" size={18} color="#FFF" style={{ marginRight: 2 }} />
                        </View>
                    </Pressable>

                    {Boolean(showAtIcon) === true && <MentionPopup data={filtered.length ? filtered : members} visible={showPopover} selected={mentionUSer} onSelectUser={_onSelectUser} />}
                </View>

                {imageInfo && (
                    <View
                        style={{
                            width: 110,
                            height: 115,
                            marginTop: 6,
                            alignSelf: 'center',
                        }}>
                        <Image
                            style={{
                                marginTop: 6,
                                width: 100,
                                height: 100,
                                borderRadius: 10,
                                resizeMode: 'contain',
                                backgroundColor: THEME_COLORS.OTHERS.SUPER_LIGHT_GRAY,
                            }}
                            source={{ uri: imageInfo.uri }}
                        />
                        <Pressable
                            onPress={() => {
                                setImageInfo(undefined)
                            }}
                            style={{
                                width: 20,
                                height: 20,
                                borderRadius: 20,
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                backgroundColor: THEME_COLORS.OTHERS.LIGHT_GRAY,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                            <Icon name="close" width={8} height={8} fill={THEME_COLORS.OTHERS.BACKGROUND} />
                        </Pressable>
                    </View>
                )}

                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        marginBottom: 5,
                    }}>
                    {Boolean(showAtIcon) === true && (
                        <Pressable
                            onPress={() => {
                                if (onCloseReply) {
                                    onCloseReply()
                                }
                                setShowPopover(!showPopover)
                            }}
                            style={{
                                marginTop: 5,
                                marginRight: 15,
                                marginLeft: 5,
                            }}>
                            <Text
                                style={{
                                    fontFamily: FontStyle.bold,
                                    fontSize: 20,
                                    lineHeight: 26,
                                    color: THEME_COLORS.OTHERS.GRAY,
                                }}>
                                @
                            </Text>
                        </Pressable>
                    )}
                    {Boolean(onPostAttachment) === true && (
                        <Pressable
                            onPress={async () => {
                                const image = await pickImage(false)
                                setImageInfo(image)
                            }}
                            style={{
                                marginTop: 10,
                            }}>
                            <Icon name="attachment" width={20} height={20} />
                        </Pressable>
                    )}
                    {Boolean(onNotePress) === true && (
                        <Pressable
                            onPress={() => {
                                if (onNotePress) onNotePress()
                            }}
                            style={{
                                marginTop: 10,
                                marginLeft: 16,
                            }}>
                            <VectorIcon.FontAwesome name="file-text-o" size={20} color={THEME_COLORS.OTHERS.GRAY} />
                        </Pressable>
                    )}
                    {Boolean(onTodoPress) === true && (
                        <Pressable
                            onPress={() => {
                                if (onTodoPress) onTodoPress()
                            }}
                            style={{
                                marginTop: 10,
                                marginLeft: 16,
                            }}>
                            <VectorIcon.Octicon name="tasklist" size={20} color={THEME_COLORS.OTHERS.GRAY} />
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    )
})

export default ChatInput
