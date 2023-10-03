/* eslint-disable prefer-const */
import React from 'react'
import { Text, Pressable, View, ViewStyle, StyleSheet } from 'react-native'

import { BlueColor, ColorStyle, GlobalStyles, FontStyle } from '../../utils/Styles'
import ThinArrow from './../../../assets/images/thinArrow.svg'
import { Icon, IconName } from './Icon'
import { useTextTranslation } from '../../fooks/useTextTranslation'

export type NavButtonProps = {
    title: string
    onPress: () => void
    style?: ViewStyle
    color: ColorStyle
    subTitle?: string
    height: number
    fontSize: number
    fontFamily: string
    disabled: boolean
    hasIcon: boolean
    iconName: IconName
    iconSize: number
}

export const NavButton = React.memo((props: Partial<NavButtonProps>) => {
    const { t } = useTextTranslation()

    let { title, onPress, color, subTitle, height, fontSize, fontFamily, hasIcon, iconName, iconSize, style } = props
    title = title ?? t('common:Button')
    height = height ?? 90
    fontSize = fontSize ?? 14
    color = color ?? BlueColor
    fontFamily = fontFamily ?? FontStyle.regular
    iconName = iconName ?? 'rich-worker'
    iconSize = iconSize ?? 40
    hasIcon = hasIcon ?? true

    return (
        <Pressable
            style={({ pressed }) => [
                {
                    height,
                    opacity: pressed ? 0.7 : 1,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    borderColor: color?.subColor,
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    flexDirection: 'row',
                    marginBottom: -1,
                },
                style,
            ]}
            onPress={() => {
                if (onPress) {
                    onPress()
                }
            }}
        >
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginLeft: 25,
                }}
            >
                {hasIcon && (
                    <Icon
                        style={{
                            marginRight: 15,
                        }}
                        name={iconName}
                        width={iconSize}
                        height={iconSize}
                    />
                )}
                <View
                    style={{
                        flexDirection: 'column',
                    }}
                >
                    <Text
                        style={{
                            fontFamily,
                            fontSize,
                            lineHeight: fontSize + 2,
                        }}
                    >
                        {title}
                    </Text>
                    {subTitle != undefined && (
                        <Text
                            style={[
                                GlobalStyles.smallGrayText,
                                {
                                    marginTop: 7,
                                },
                            ]}
                        >
                            {subTitle}
                        </Text>
                    )}
                </View>
            </View>

            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <ThinArrow
                    style={{
                        marginRight: 20,
                    }}
                    fill={color.subColor}
                    height={height - 16}
                />
            </View>
        </Pressable>
    )
})

const styles = StyleSheet.create({})
