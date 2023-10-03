import React from 'react'
import { Pressable, Text, View, ViewStyle } from 'react-native'

import { FontStyle } from '../../../utils/Styles'

import { ReactionCLType } from '../../../models/reaction/Reaction'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

export type ReactionProps = {
    char?: string
    count: number
    style?: ViewStyle
}

export const Reaction = React.memo((props: Partial<ReactionProps>) => {
    let { char, count, style } = props

    const { t } = useTextTranslation()
    return (
        <View
            style={[
                {
                    flexDirection: 'row',
                },
                style,
            ]}>

            <Pressable
                style={[
                    {
                        flexDirection: 'row',
                    },
                ]}
            >
            
                <Text
                    numberOfLines={1}
                    ellipsizeMode={'middle'}
                    style={{
                        fontFamily: FontStyle.regular,
                        fontSize: 14,
                        lineHeight: 20,
                        marginRight: 4,
                    }}>
                    {char}
                </Text>
                <Text
                    ellipsizeMode={'middle'}
                    style={{
                        fontFamily: FontStyle.regular,
                        fontSize: 12,
                        lineHeight: 18,
                    }}>
                    {count?.toString()}
                </Text>
            </Pressable>
        </View>

    )
})
