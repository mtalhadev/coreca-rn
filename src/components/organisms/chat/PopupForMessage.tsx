import React, { useState } from 'react'
import { Pressable, Text, TextInput, View, ViewStyle } from 'react-native'


import { THEME_COLORS, WINDOW_HEIGHT, WINDOW_WIDTH } from '../../../utils/Constants'

import { MessageCLType } from '../../../models/message/Message'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { Icon } from '../../atoms/Icon'
import Modal from "react-native-modal"

export type PopupForMessageProps = {
    style?: ViewStyle
    onCopy?: ()=> void
    onReply?: () => void
    onClose?: () => void
    onEmojiClick?: ()=> void
    onThread?: () => void
}

export const PopupForMessage = React.memo((props: Partial<PopupForMessageProps>) => {
    let { style, onCopy, onReply, onClose, onEmojiClick, onThread } = props

    const { t } = useTextTranslation()

    const [emojiVisible, setEmojiVisible] = useState<boolean>(false)


    return (

        <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: "#fff", height:80 }}>
            <View 
                style={{
                    flexDirection: 'row',
                }}
            >
                <View style={{flexDirection: 'row', flex: 1}}>

                    <Pressable 
                        style={{
                            marginLeft: 40,
                            alignItems: 'center',
                        }}
                        onPress={() => {
                            if (onCopy) {
                                onCopy()
                            }
                        }}
                    >
                        <Icon name='copy' fill={'#fff'} />
                        <Text style={{color: THEME_COLORS.BLUE.MIDDLE, fontSize: 9}}>Copy</Text>
                    </Pressable>
                    <Pressable 
                        style={{
                            marginLeft: 40,
                            alignItems: 'center',
                        }}
                        onPress={() => {
                            if (onReply) {
                                onReply()
                            }
                        }}                    
                    >
                        <Icon name='reply' fill={'#fff'} />
                        <Text style={{color: THEME_COLORS.BLUE.MIDDLE, fontSize: 9}}>Reply</Text>
                    </Pressable>
                    <Pressable 
                        style={{
                            marginLeft: 40,
                            alignItems: 'center',
                        }}
                        onPress={() => {
                            if (onThread) {
                                onThread()
                            }
                        }}                    
                    >
                        <Icon name='thread' fill={'#fff'} />
                        <Text style={{color: THEME_COLORS.BLUE.MIDDLE, fontSize: 9}}>Thread</Text>
                    </Pressable>
                    <Pressable 
                        style={{
                            marginLeft: 40,
                            alignItems: 'center',
                        }}
                        onPress={() => {

                            if (onEmojiClick) {
                                onEmojiClick()
                            }
                        }}                    
                    >
                        <Icon name='emoji' fill={'#fff'} />
                        <Text style={{color: THEME_COLORS.BLUE.MIDDLE, fontSize: 9}}>Reaction</Text>
                    </Pressable>
                </View>
                <Pressable 
                    style={{
                        marginRight: 20,
                        alignItems: 'center',
                    }}
                    onPress={() => {
                        if (onClose) {
                            onClose()
                        }
                    }}
                >
                    <Icon name='close-reply' fill={THEME_COLORS.BLUE.MIDDLE} />
                </Pressable>
                
            </View>
        </View>
    )

})

export default PopupForMessage