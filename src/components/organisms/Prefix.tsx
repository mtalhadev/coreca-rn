import React from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { FontStyle } from '../../utils/Styles'
import { Icon, IconName } from '../atoms/Icon'
import { THEME_COLORS } from '../../utils/Constants'

export type PrefixProps = {
    color: string
    fontSize: number
    fontColor: string
    style?: ViewStyle
    iconName: IconName
    text: string
}

export const Prefix = React.memo((props: Partial<PrefixProps>) => {
    let { color, text, fontSize, fontColor, iconName, style } = props
    fontSize = fontSize ?? 12
    fontColor = fontColor ?? '#fff'
    text = text ?? 'Prefix'

    return (
        <View
            style={[
                {
                    backgroundColor: color ?? THEME_COLORS.OTHERS.ALERT_RED,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 2,
                    flexDirection: 'row',
                    alignItems: 'center',
                },
                style,
            ]}
        >
            {iconName != undefined && (
                <Icon
                    style={{
                        marginRight: 3,
                    }}
                    name={iconName}
                    fill={fontColor}
                    width={fontSize * 1.2}
                    height={fontSize * 1.2}
                />
            )}

            <Text
                style={{
                    fontFamily: FontStyle.medium,
                    fontSize: fontSize,
                    lineHeight: fontSize + 2,
                    color: fontColor,
                }}
            >
                {text}
            </Text>
        </View>
    )
})
