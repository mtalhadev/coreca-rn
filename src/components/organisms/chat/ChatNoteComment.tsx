import React from 'react'
import { Image, Pressable, Text, View, ViewStyle } from 'react-native'

import * as Clipboard from 'expo-clipboard'
import { FontStyle } from '../../../utils/Styles'

import { THEME_COLORS, WINDOW_WIDTH } from '../../../utils/Constants'
import { ImageIcon } from '../ImageIcon'

import {
    Menu, MenuOption, MenuOptions, MenuTrigger, renderers
} from 'react-native-popup-menu'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { NoteCommentCLType } from '../../../models/noteComment/NoteComment'
import { CustomDate, timeText } from '../../../models/_others/CustomDate'
import { Icon } from '../../atoms/Icon'
import VectorIcon from '../../atoms/VectorIcon'

export type ChatNoteCommentProps = {
    comment: NoteCommentCLType
    style?: ViewStyle
    onAttachmentPress?: (attachment: string) => void 

}

export const ChatNoteComment = React.memo((props: Partial<ChatNoteCommentProps>) => {
    const {
        comment,
        style,
        onAttachmentPress,
     } = props;

    const iconSize = 25
    const _imageUri = (iconSize <= 30 ? comment?.worker?.xsImageUrl : iconSize <= 50 ? comment?.worker?.sImageUrl : comment?.worker?.imageUrl) ?? comment?.worker?.imageUrl
    const { t } = useTextTranslation()
   
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
                    imageColorHue={comment?.worker?.imageColorHue} 
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
                            {comment?.worker?.name}
                        </Text>
                        {!!comment?.message?.length && 
                        <Text
                            ellipsizeMode='middle'
                            style={{
                                fontFamily: FontStyle.regular,
                                marginTop: 6,
                                fontSize: 12,
                                lineHeight: 16,
                                width: WINDOW_WIDTH - 110,
                            }}
                            >
                                {comment?.message}
                        </Text>
                        }
                        {(comment?.xsAttachmentUrl) && 
                        <Pressable 
                            onPress={() => {
                                if(onAttachmentPress)  
                                    onAttachmentPress(comment.attachmentUrl ?? 'https://no-url')
                            }} 
                        >
                            <Image
                                style={{
                                    marginTop: 6,
                                    width: 160,
                                    height: 120,
                                    resizeMode: 'contain'
                                }} 
                                source={{uri: comment?.xsAttachmentUrl ?? 'https://no-url'}}
                                />
                        </Pressable>
                        }
                    </View>
                </View>
                <View
                    style={{
                        alignItems: 'flex-end',
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
                            {timeText(comment?.createdAt as CustomDate).substring(0, 5)}
                        </Text>
                        {/* <Menu style={{
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
                                <MenuOption onSelect={() => Clipboard.setStringAsync(comment?.message as string)}>
                                    <Icon name='copy' fill={'#fff'} />
                                </MenuOption>
                                <MenuOption onSelect={() => onDelete && onDelete(comment?.noteCommentId ?? 'no-id')}>
                                    <VectorIcon.Feather name='trash-2' color={THEME_COLORS.BLUE.MIDDLE} size={17} />
                                </MenuOption>
                            </MenuOptions>
                        </Menu> */}

                    </View>
                </View>
            </Pressable>
            
        </View>

    )
})
