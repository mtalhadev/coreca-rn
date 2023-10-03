import React, { useState } from 'react'
import { Pressable, Text, TextInput, View, ViewStyle } from 'react-native'


import EmojiSelector, { Categories } from 'react-native-emoji-selector'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { WINDOW_HEIGHT } from '../../../utils/Constants'

export type EmojiSelectorUIProps = {
    visible?: boolean
    style?: ViewStyle
    onEmojiSelect?: (message: string) => void
}

export const EmojiSelectorUI = React.memo((props: Partial<EmojiSelectorUIProps>) => {
    let { style, visible, onEmojiSelect } = props

    visible = visible ?? false
    const { t } = useTextTranslation()

    return (

        <View
            style={{
                display: visible ? 'flex' : 'none',
                height: WINDOW_HEIGHT - 100,
                left: 0,
                backgroundColor: '#fff',
            }}
        >
            <EmojiSelector
                showHistory={true}
                onEmojiSelected={emoji => {
                    if (onEmojiSelect) {
                        onEmojiSelect(emoji)
                    }
                }} 
            />
        </View>
    )
})

export default EmojiSelectorUI