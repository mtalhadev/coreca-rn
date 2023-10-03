import React from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { FontStyle } from '../../utils/Styles'
import { THEME_COLORS } from '../../utils/Constants'
import { NumberText } from './NumberText'

export type BadgeProps = {
    batchCount: number
    color: string
    size: number
    fontSize: number
    textColor: string
    style?: ViewStyle
}

export const Badge = React.memo((props: Partial<BadgeProps>) => {
    let { batchCount, size, color, fontSize, textColor, style } = props
    batchCount = batchCount ?? 1
    size = size ?? 20
    fontSize = fontSize ?? 10

    return (
        <View
            style={[
                {
                    backgroundColor: color ?? THEME_COLORS.OTHERS.ALERT_RED,
                    width: size,
                    height: size,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: size,
                    borderWidth: 0.5,
                    borderColor: '#fff',
                },
                style,
            ]}>
            <NumberText
                style={{
                    fontFamily: FontStyle.black,
                    fontSize: fontSize,
                    lineHeight: fontSize + 2,
                    color: textColor ?? '#fff',
                    width: '150%',
                    textAlign: 'center',
                }}
                testID="batchCount">
                {batchCount}
            </NumberText>
        </View>
    )
})
