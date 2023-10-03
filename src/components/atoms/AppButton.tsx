/* eslint-disable prefer-const */
import React, { useRef, PropsWithChildren } from 'react'
import { Text, Pressable, View, ViewStyle, Animated, Easing, StyleSheet, Platform } from 'react-native'

import { BlueColor, ColorStyle, FontStyle } from '../../utils/Styles'
import { THEME_COLORS } from '../../utils/Constants'
import { Icon, IconName } from './Icon'
import { GlobalStyles } from '../../utils/Styles'
export type AppButtonProps = {
    title: string
    subTitle?: string
    onPress: () => void
    style?: ViewStyle
    color: ColorStyle
    height: number
    paddingTop?: number
    fontSize: number
    textColor: string
    subTitleTextColor?: string
    borderWidth: number
    borderColor: string
    hasShadow: boolean
    fontFamily: string
    buttonColor: string
    iconName: IconName
    iconPosition: 'start' | 'end'
    iconAlign: 'center' | 'between'
    iconSize: number
    iconColor?: string
    disabled: boolean
    isGray: boolean
}

export const AppButton = React.memo((props: PropsWithChildren<Partial<AppButtonProps>>) => {
    let {
        title,
        subTitle,
        onPress,
        iconColor,
        color,
        children,
        height,
        paddingTop,
        fontSize,
        borderWidth,
        iconPosition,
        borderColor,
        hasShadow,
        iconSize,
        textColor,
        subTitleTextColor,
        fontFamily,
        buttonColor,
        iconName,
        iconAlign,
        isGray,
        disabled,
        style,
    } = props
    title = title ?? 'ボタン'
    height = height ?? 40
    paddingTop = paddingTop ?? 1
    fontSize = fontSize ?? 14
    hasShadow = hasShadow ?? true
    borderWidth = borderWidth ?? 0
    color = color ?? BlueColor
    buttonColor = buttonColor ?? color.subColor
    borderColor = borderColor ?? '#fff'
    fontFamily = fontFamily ?? FontStyle.medium
    textColor = textColor ?? color.textColor
    iconPosition = iconPosition ?? 'start'
    iconAlign = iconAlign ?? 'center'
    iconColor = iconColor ?? textColor
    isGray = isGray ?? false
    disabled = disabled ?? false

    if (isGray) {
        borderColor = THEME_COLORS.OTHERS.LIGHT_GRAY
        borderWidth = 1
        textColor = THEME_COLORS.OTHERS.BLACK
        fontFamily = FontStyle.regular
        buttonColor = THEME_COLORS.OTHERS.BACKGROUND
        hasShadow = false
    }

    const INITIAL_SHADOW = 8
    const shadowAnim = useRef(new Animated.Value(INITIAL_SHADOW)).current
    const shadowFadeOut = (duration: number) => {
        Animated.parallel([
            Animated.timing(shadowAnim, {
                toValue: 1,
                duration,
                useNativeDriver: true,
                easing: Easing.ease,
            }),
        ]).start()
    }
    const shadowFadeIn = (duration: number) => {
        Animated.parallel([
            Animated.timing(shadowAnim, {
                toValue: INITIAL_SHADOW,
                duration,
                useNativeDriver: true,
            }),
        ]).start()
    }

    return (
        <Animated.View
            style={[
                {
                    shadowOpacity: !disabled && hasShadow ? 0.3 : 0,
                    shadowColor: '#000',
                    shadowRadius: shadowAnim,
                    shadowOffset: { width: 0, height: 2 },
                    backgroundColor: buttonColor,
                    borderColor: borderColor,
                    borderWidth: borderWidth,
                    height,
                    elevation: !disabled && hasShadow ? shadowAnim : 0,
                    borderRadius: height,
                    justifyContent: 'center',
                    opacity: disabled ? 0.4 : 1,
                },
                style,
            ]}
            onTouchStart={() => {
                if (disabled) {
                    return
                }
                shadowFadeOut(100)
            }}
            onTouchEnd={() => {
                if (disabled) {
                    return
                }
                shadowFadeIn(100)
            }}>
            <Pressable
                style={{
                    flex: 1,
                    alignItems: iconAlign == 'between' ? undefined : 'center',
                    justifyContent: 'center',
                }}
                disabled={disabled}
                onPress={() => {
                    if (onPress) {
                        onPress()
                    }
                }}>
                {children != undefined && children}
                {children == undefined && (
                    <View
                        style={{
                            flex: 1,
                            flexDirection: iconPosition == 'start' ? 'row' : 'row-reverse',
                            alignItems: 'center',
                            justifyContent: iconAlign == 'between' ? 'space-between' : undefined,
                            paddingHorizontal: iconAlign == 'between' ? 20 : undefined,
                        }}>
                        {iconName != undefined && (
                            <Icon
                                style={{
                                    marginRight: iconPosition == 'start' ? (title.length == 0 ? 0 : 5) : 0,
                                    marginLeft: iconPosition == 'start' ? 0 : title.length == 0 ? 0 : 5,
                                }}
                                name={iconName}
                                width={iconSize ?? fontSize * 1.2}
                                height={iconSize ?? fontSize * 1.2}
                                fill={iconColor}
                            />
                        )}
                        <View
                            style={{
                                flexDirection: subTitle !== undefined ? 'column' : undefined,
                                alignContent: subTitle !== undefined ? 'center' : undefined,
                                justifyContent: subTitle !== undefined ? 'center' : undefined,
                                paddingTop: subTitle !== undefined ? 10 : 0,
                            }}>
                            <Text
                                style={{
                                    fontFamily,
                                    fontSize,
                                    color: textColor,
                                    lineHeight: subTitle !== undefined ? 20 : height,
                                    paddingTop: Platform.OS == 'android' && height < 35 ? paddingTop : 0,
                                    textAlign: subTitle !== undefined ? 'center' : undefined,
                                }}>
                                {title}
                            </Text>
                            {subTitle !== undefined && (
                                <Text
                                    style={{
                                        ...GlobalStyles.smallGrayText,
                                        color: subTitleTextColor,
                                    }}>
                                    {subTitle}
                                </Text>
                            )}
                        </View>
                    </View>
                )}
            </Pressable>
        </Animated.View>
    )
})

const styles = StyleSheet.create({})
