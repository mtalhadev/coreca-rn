import React, { useEffect, useState } from 'react'
import { Linking, Pressable, Text, View, Image, ViewStyle } from 'react-native'

import { FontStyle } from '../../../utils/Styles'
import _ from 'lodash'
import * as Clipboard from 'expo-clipboard'

import { THEME_COLORS, WINDOW_WIDTH } from '../../../utils/Constants'
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
import { NoteCLType } from '../../../models/note/Note'
import { NoteAttachmentCLType } from '../../../models/noteAttachment/NoteAttachment'
import { NoteReactionCLType, NoteReactionType, toNoteReactionCLType } from '../../../models/noteReaction/NoteReaction'
import { NoteCommentCLType, NoteCommentType, toNoteCommentCLType } from '../../../models/noteComment/NoteComment'
import { _getFirestore } from '../../../services/firebase/FirestoreService'
import { CommentCount } from './CommentCount'

export type ChatNoteProps = {
    note: NoteCLType
    attachments: NoteAttachmentCLType[]
    reactions: NoteReactionCLType[]
    comments: NoteCommentCLType[]
    iconSize?: number
    style?: ViewStyle
    onImagePress?: () => void 
    onComment?: () => void
    onAddEmoji?: () => void

}

export const ChatNote = React.memo((props: Partial<ChatNoteProps>) => {
    let { note, attachments, reactions: noteReactions, comments: noteComments, style, iconSize, onImagePress, onComment, onAddEmoji } = props
    iconSize = iconSize ?? 25
    const _imageUri = (iconSize <= 30 ? note?.worker?.xsImageUrl : iconSize <= 50 ? note?.worker?.sImageUrl : note?.worker?.imageUrl) ?? note?.worker?.imageUrl
    const { t } = useTextTranslation()

    // console.log('attachments: ', attachments);

    const [reactions, setReactions] = useState<NoteReactionCLType[]>(noteReactions ?? []);
    const [comments, setComments] = useState<NoteCommentCLType[]>(noteComments ?? []);
    
    useEffect(() => {
        const db = _getFirestore()
        const listener = db.collection('NoteComment').where('noteId', '==', note?.noteId ?? 'no-id').orderBy('createdAt', 'asc')
            .onSnapshot((data) => {
                const comments = data.docs.map((doc) => doc.data() as NoteCommentType)
                setComments(comments.map(comment => toNoteCommentCLType(comment)))
            })
        return () => {
            listener && listener()
        }
    }, [])

    useEffect(() => {
        const db = _getFirestore()
        const listener = db.collection('NoteReaction').where('noteId', '==', note?.noteId ?? 'no-id').orderBy('createdAt', 'asc')
            .onSnapshot((data) => {
                const reactions = data.docs.map((doc) => doc.data() as NoteReactionType)
                setReactions(reactions.map(reaction => toNoteReactionCLType(reaction)))
            })
        return () => {
            listener && listener()
        }
    }, [])

    const reactionChars: string[] = []
    const reactionCount: number[] = []

    for (let i = 0; i < reactions.length; i++) {
        const reaction = reactions[i];
        const index = reactionChars.findIndex(char => char == reaction.reactionChar)
        if(index == -1) {
            reactionChars.push(reaction.reactionChar as string)
            reactionCount.push(1)
        } else {
            reactionCount[index] += 1
        }

    }


    /*
    if (note?.isThreadStart == true) {
        console.log(timeText(newCustomDate())  + '**' +  note.note)
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

   const commentCount = comments.length;

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
            <Pressable
                style={{
                    flexDirection: 'row',
                    marginVertical: 8,
                }}
            >

                <ImageIcon 
                    imageColorHue={note?.worker?.imageColorHue} 
                    imageUri={_imageUri} 
                    type={'worker'} 
                    size={iconSize} 
                    style={{ marginTop: 5 }}
                    />

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
                            {note?.worker?.name}
                        </Text>
                        {!!note?.message?.length && 
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
                                {note?.message}
                        </ParsedText>
                        }
                        {(attachments && attachments[0]) && 
                        <Pressable 
                            onPress={() => {
                                if(onImagePress)  
                                    onImagePress()
                            }} 
                        >
                            <Image
                                style={{
                                    marginTop: 6,
                                    width: 160,
                                    height: 120,
                                    resizeMode: 'contain'
                                }} 
                                source={{uri: attachments[0]?.xsAttachmentUrl ?? 'https://no-url'}}
                                />
                        </Pressable>
                        }
                    </View>
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
                        {commentCount > 0 && 
                        <CommentCount count={commentCount} onPress={() => onComment && onComment()}/>
                        }
                    </View>
                    {/* {message?.isThreadStart && (
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
                    )} */}
                </View>
                <View
                    style={{
                        alignItems: 'flex-end',
                        // marginTop: 15,
                        // marginRight: 10,
                    }}
                >
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
                            {timeText(note?.createdAt as CustomDate).substring(0, 5)}
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
                                <MenuOption onSelect={() => Clipboard.setStringAsync(note?.message as string)}>
                                    <Icon name='copy' fill={'#fff'} />
                                </MenuOption>
                                <MenuOption onSelect={() => onAddEmoji && onAddEmoji()}>
                                    <Icon name='emoji' fill={'#fff'} />
                                </MenuOption>
                                <MenuOption onSelect={() => onComment && onComment()}>
                                    <Icon name='comment' fill={'#fff'} />
                                </MenuOption>
                                <MenuOption >
                                    <Icon name='close' fill={THEME_COLORS.OTHERS.GRAY} width={10} style={{ marginHorizontal: 5 }}/>
                                </MenuOption>
                            </MenuOptions>
                        </Menu>

                    </View>
                </View>
            </Pressable>
            
        </View>

    )
})
