import React from 'react'
import { Pressable, Text, View, ViewStyle } from 'react-native'

import { FontStyle } from '../../../utils/Styles'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { Icon } from '../../atoms/Icon'

export type CommentCountProps = {
    count: number
    style?: ViewStyle
    onPress?: () => void
}

export const CommentCount = React.memo((props: Partial<CommentCountProps>) => {
    let { count, style, onPress } = props

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
                onPress={onPress}
            >
                <Icon name='comment' width={20} height={20} />

                <Text
                    ellipsizeMode={'middle'}
                    style={{
                        fontFamily: FontStyle.regular,
                        fontSize: 12,
                        lineHeight: 18,
                        marginLeft: 5
                    }}>
                    {count?.toString()}
                </Text>
            </Pressable>
        </View>

    )
})
