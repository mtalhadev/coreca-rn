import React from 'react'
import { Text, Pressable, View, ViewStyle } from 'react-native'

import { GlobalStyles } from '../../utils/Styles'
import { THEME_COLORS } from '../../utils/Constants'

export type CheckboxProps = {
    checked: boolean
    text: string
    size: number
    color: string
    fontSize: number
    textColor: string
    onChange: (value?: boolean) => void
    style?: ViewStyle
}

export const Checkbox = React.memo((props: Partial<CheckboxProps>) => {
    let { checked, text, size, color, fontSize, textColor, style, onChange } = props
    checked = checked ?? false
    text = text ?? ''
    size = size ?? 16
    fontSize = fontSize ?? 10

    return (
        <Pressable
            style={[
                {
                    flexDirection: 'row',
                    height: size,
                },
                style,
            ]}
            onPress={() => {
                if (onChange != undefined) {
                    onChange(!checked)
                }
            }}
        >
            <View
                style={{
                    borderWidth: 1,
                    borderColor: THEME_COLORS.OTHERS.LIGHT_GRAY,
                    borderRadius: 5,
                    backgroundColor: checked ? color ?? THEME_COLORS.BLUE.MIDDLE : '#fff',
                    width: size,
                    height: size,
                    marginRight: 10,
                }}
            >
                <Text
                    style={{
                        color: '#fff',
                        textAlign: 'center',
                        fontSize: size - 5,
                        lineHeight: size - 3,
                    }}
                >
                    {checked ? '✓' : ''}
                </Text>
            </View>

            <Text
                style={{
                    ...GlobalStyles.smallText,
                    fontSize: fontSize,
                    lineHeight: fontSize + 2,
                    color: textColor ?? '#000',
                    paddingTop: 1,
                }}
            >
                {text}
            </Text>
        </Pressable>
    )
})
