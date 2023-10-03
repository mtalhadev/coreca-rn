import React from 'react'
import { Linking, Pressable, Text, View, Image, ViewStyle } from 'react-native'

import { FontStyle } from '../../../utils/Styles'
import _ from 'lodash'
import * as Clipboard from 'expo-clipboard'

import { SCREEN_WIDTH, THEME_COLORS, WINDOW_WIDTH } from '../../../utils/Constants'
import { ImageIcon } from '../ImageIcon'

import { MessageCLType } from '../../../models/message/Message'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { Reaction } from './Reaction'
import { CustomDate, newCustomDate, timeText } from '../../../models/_others/CustomDate'
import ParsedText from 'react-native-parsed-text'
import {
    Menu,
    MenuTrigger,
    MenuOptions,
    MenuOption,
    renderers,
  } from 'react-native-popup-menu';
import { Icon } from '../../atoms/Icon'
import VectorIcon from '../../atoms/VectorIcon'
import { AppButton } from '../../atoms/AppButton'

export type MessageProps = {
    message?: MessageCLType
    myWorkerId: string
    iconSize?: number
    style?: ViewStyle
    onLongPress?: ()=> void
    onEnterThread?: ()=> void
    onImagePress?: (imageUrl: string)=> void
    onReply?: () => void
    onAddEmoji?: () => void
    onThread?: () => void
    onNotePress?: () => void
    onAddTodo?: (message?: MessageCLType) => void

}

export const Message = React.memo((props: Partial<MessageProps>) => {
    let { message, myWorkerId, style, iconSize, onLongPress, onEnterThread, onImagePress, onReply, onAddEmoji, onThread, onNotePress, onAddTodo } = props
    iconSize = iconSize ?? 25
    const _imageUri = (iconSize <= 30 ? message?.worker?.xsImageUrl : iconSize <= 50 ? message?.worker?.sImageUrl : message?.worker?.imageUrl) ?? message?.worker?.imageUrl
    const _threadHeadImageUri = (iconSize <= 30 ? message?.threadHead?.lastMessage?.worker?.xsImageUrl : iconSize <= 50 ? message?.threadHead?.lastMessage?.worker?.sImageUrl : message?.threadHead?.lastMessage?.worker?.imageUrl) ?? message?.threadHead?.lastMessage?.worker?.imageUrl

    const reactionChars: string[] = []
    const reactionCount: number[] = []

    const checkSameReaction = (reactionChar: string): [boolean, number] => {
        let hitFlag: boolean = false
        let hitIndex: number = -1

        reactionChars.forEach((char, index) => {
            if (char == reactionChar) {
                hitFlag = true
                hitIndex = index
            }
        })
        return [hitFlag, hitIndex]
    }

    const sumReaction = () => {
        message?.reactions?.items?.forEach(reaction => {
            const ret = checkSameReaction(reaction.reactionChar as string)
            if (ret[0] == false) {
                reactionChars.push(reaction.reactionChar as string)
                reactionCount.push(1)
            }
            else {
                reactionCount[ret[1]] += 1
            }
        });
    }
    sumReaction()


    /*
    if (message?.isThreadStart == true) {
        console.log(timeText(newCustomDate())  + '**' +  message.message)
    }
    */
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
    }

   
    return (
        <View
            style={[
                {
                    flexDirection: 'column',
                    borderBottomColor: THEME_COLORS.OTHERS.LIGHT_GRAY,
                    borderBottomWidth: 0.3,
                },
                style,
            ]}>
            {message?.replyId && (
                <View
                    style={{
                        backgroundColor: '#B7D1E6',
                        marginBottom: 8,
                        paddingVertical:8,
                        paddingHorizontal: 13,
                        marginLeft: -13,
                        marginRight: -10
                    }}
                >
                    <Text
                        style={{
                            color: THEME_COLORS.BLUE.MIDDLE,
                            fontSize: 12,
                            lineHeight: 14,

                        }}
                    >
                        Re : {message.reply?.worker?.name}
                    </Text>
                    <Text
                        style={{
                            color: THEME_COLORS.OTHERS.GRAY,
                            marginTop:4,
                            fontSize: 12,
                            lineHeight: 14,

                        }}
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                    >
                        {message.reply?.message}
                    </Text>

                </View>
            )}
            <Pressable
                style={{
                    flexDirection: 'row',
                    marginVertical: 8,
                }}
                onLongPress={()=> {
                    if (onLongPress) {
                        onLongPress()
                    }
                }}
            >

                <View
                    style={{
                        alignItems: 'center',
                    }}>
                    <ImageIcon imageColorHue={message?.worker?.imageColorHue} imageUri={_imageUri} type={'worker'} size={iconSize} style={{marginTop: -4}}/>
                </View>

                <View
                    style={{
                        marginLeft: 10,
                        justifyContent: 'center',
                    }}>
                    <View
                        style={{
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            paddingRight: 6,
                        }}>
                        <Text
                            numberOfLines={1}
                            ellipsizeMode={'middle'}
                            style={{
                                fontFamily: FontStyle.bold,
                                fontSize: 12,
                                lineHeight: 14,
                                width: WINDOW_WIDTH - 110,
                            }}>
                            {message?.worker?.name}
                        </Text>
                        {message?.messageType == 'text' && 
                        <ParsedText
                            childrenProps={{ ellipsizeMode: 'middle' }}
                            style={{
                                fontFamily: FontStyle.regular,
                                marginTop: 6,
                                fontSize: 12,
                                lineHeight: 16,
                                width: WINDOW_WIDTH - 110,
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
                            >
                                {message?.message}
                        </ParsedText>
                        }
                        {message?.messageType == 'picture' && 
                        <Pressable 
                            onPress={() => {
                                if(onImagePress)  
                                    onImagePress(message?.xsAttachmentUrl ?? 'https://no-url')
                            }} 
                        >
                            <Image
                                style={{
                                    marginTop: 6,
                                    width: SCREEN_WIDTH * 0.6,
                                    height: SCREEN_WIDTH * 0.6,
                                    resizeMode: 'contain',
                                    borderRadius: 5
                                }} 
                                source={{uri: message?.attachmentUrl ?? 'https://no-url'}}
                                testID='message-picture'
                                />
                        </Pressable>
                        }
                        {message?.messageType == 'note' && 
                        <ParsedText
                            childrenProps={{ ellipsizeMode: 'middle' }}
                            style={{
                                fontFamily: FontStyle.regular,
                                marginTop: 6,
                                fontSize: 12,
                                lineHeight: 16,
                                width: WINDOW_WIDTH - 110,
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
                            >
                                {message?.message}
                        </ParsedText>
                        }

                    </View>
                    {message?.messageType != 'note' &&
                    <View
                        style={{
                            flexDirection: 'row',
                            marginTop: 8,
                            width: WINDOW_WIDTH - 110,
                            flexWrap: 'wrap',
                        }}
                    >
                        {reactionChars.length > 0 && 
                            reactionChars.map((char, index) => { 
                                return <Reaction 
                                            char={char} 
                                            count={reactionCount[index]} 
                                            style = {{
                                                marginRight: 5,
                                                paddingHorizontal: 5,
                                                paddingVertical: 1,
                                                backgroundColor: THEME_COLORS.OTHERS.TABLE_AREA_PURPLE,
                                                borderRadius: 10
                                            }}
                                        />
                            })
                        }
                    </View>
                    }
                    {message?.isThreadStart && (
                        <Pressable
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 8,
                            }}
                            onPress={() => {
                                if (onEnterThread) {
                                    onEnterThread()
                                }
                            }}
                        >
                            <ImageIcon imageColorHue={message?.threadHead?.lastMessage?.worker?.imageColorHue} imageUri={_threadHeadImageUri} type={'worker'} size={24} />
                            <Text
                                numberOfLines={1}
                                ellipsizeMode={'middle'}
                                style={{
                                    fontFamily: FontStyle.bold,
                                    color: THEME_COLORS.BLUE.MIDDLE,
                                    fontSize: 12,
                                    lineHeight: 14,
                                    marginLeft: 8,
                                    paddingTop: 4,
                                }}>
                                {message.threadHead?.messageCount}件のメッセージ
                            </Text>
                        </Pressable>
                    )}
                </View>
                <View
                    style={{
                        alignItems: 'flex-end',
                        // marginTop: 15,
                        // marginRight: 10,
                    }}
                >
                    {message?.messageType == 'note' ?
                    <AppButton
                        style={{
                            backgroundColor: "transparent",
                            paddingHorizontal: 15,
                            marginLeft: -30,
                            marginTop: 2
                        }}
                        height={30}
                        fontSize={14}
                        hasShadow={false}
                        borderColor={THEME_COLORS.OTHERS.BORDER_COLOR2}
                        borderWidth={1}
                        textColor={THEME_COLORS.OTHERS.BLACK}
                        title={'Notes'}
                        onPress={() => {
                            if(onNotePress)
                            onNotePress()
                        }}
                        />
                    :
                    <View
                        style={{
                            flexDirection: 'column',
                            alignItems: 'flex-end'
                        }}
                        
                    >
                        <Text
                            style={{
                                color: THEME_COLORS.OTHERS.GRAY,
                                fontSize: 10,
                                // backgroundColor: '#ddd',
                                marginTop: 20
                            }}
                        >
                            {timeText(message?.createdAt as CustomDate).substring(0, 5)}
                        </Text>
                        <Menu style={{
                            marginTop: 10
                        }} renderer={renderers.Popover}>
                            <MenuTrigger 
                                customStyles={{
                                    triggerWrapper: {
                                        top: -42,
                                        // right: 10
                                    },
                                }}
                                >
                                <VectorIcon.Entypo name='dots-three-horizontal' color={THEME_COLORS.OTHERS.GRAY} size={13}/>
                            </MenuTrigger>
                            <MenuOptions
                                optionsContainerStyle={{
                                    top: -48,
                                    right: 25
                                }}
                                customStyles={{
                                    optionsContainer: {
                                        justifyContent: 'center',
                                        borderRadius: 5,

                                    },
                                    optionsWrapper: {
                                        flexDirection: 'row',
                                        borderRadius: 8,
                                        backgroundColor: 'white',
                                        justifyContent: 'center',
                                        alignItems: "center",                   
                                    },
                                }}
                            >
                                <MenuOption onSelect={() => Clipboard.setStringAsync(message?.message as string)}>
                                    <Icon name='copy' fill={'#fff'} />
                                </MenuOption>
                                <MenuOption onSelect={() => onReply && onReply()}>
                                    <Icon name='reply' fill={'#fff'} />
                                </MenuOption>
                                <MenuOption onSelect={() => onThread && onThread()}>
                                    <Icon name='thread' fill={'#fff'} />
                                </MenuOption>
                                <MenuOption onSelect={() => onAddEmoji && onAddEmoji()}>
                                    <Icon name='emoji' fill={'#fff'} />
                                </MenuOption>
                                <MenuOption onSelect={() => onAddTodo && onAddTodo(message)}>
                                    <Icon name='addTodo' fill={'#fff'} />
                                </MenuOption>
                                <MenuOption >
                                    <Icon name='close' fill={THEME_COLORS.OTHERS.GRAY} width={10} style={{ marginHorizontal: 5 }}/>
                                </MenuOption>
                            </MenuOptions>
                        </Menu>
                    </View>
                    }
                    {(message?.workerId == myWorkerId && (message?.readCount ??0) > 0) &&
                    <View>
                        <Text
                            style={{
                                color: THEME_COLORS.OTHERS.GRAY,
                                fontSize: 10,
                                marginRight: 13
                            }}
                        >
                            既読{message?.readCount}
                        </Text>
                    </View>
                    }
                </View>
            </Pressable>
            
        </View>

    )
})
