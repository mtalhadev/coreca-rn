import React from 'react'
import { Text, View, ViewStyle } from 'react-native'
import { THEME_COLORS } from '../../utils/Constants'
import { FontStyle } from '../../utils/Styles'

export type ChipProps = {
    text: string
    color: string
    fontSize: number
    textColor: string
    style?: ViewStyle
}

export const Chip = React.memo((props: Partial<ChipProps>) => {
    let { text, color, fontSize, textColor, style } = props
    text = text ?? ''
    fontSize = fontSize ?? 10

    return (
        <View
            style={[
                {
                    backgroundColor: color ?? THEME_COLORS.OTHERS.ALERT_RED,
                    width: text.length * 20,
                    height: 'auto',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderRadius: 100,
                    borderWidth: 0.5,
                    borderColor: '#fff',
                },
                style,
            ]}
        >
            <Text
                style={{
                    fontFamily: FontStyle.regular,
                    fontSize: fontSize,
                    lineHeight: fontSize + 2,
                    color: textColor ?? '#fff',
                }}
            >
                {text}
            </Text>
        </View>
    )
})
