import React from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { FontStyle } from '../../utils/Styles'
import { THEME_COLORS } from '../../utils/Constants'

export type NewBadgeProps = {
    style?: ViewStyle
    size: number
}

export const NewBadge = React.memo((props: Partial<NewBadgeProps>) => {
    let { size, style } = props
    size = size ?? 18

    return (
        <View
            style={[
                {
                    backgroundColor: THEME_COLORS.OTHERS.BLACK,
                    width: size * 2,
                    height: size,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: size / 1.5,
                    borderWidth: 0.5,
                    borderColor: '#fff',
                },
                style,
            ]}
        >
            <Text
                style={{
                    fontFamily: FontStyle.black,
                    fontSize: size / 2,
                    lineHeight: size / 1.5,
                    color: '#fff',
                }}
            >
                NEW
            </Text>
        </View>
    )
})
