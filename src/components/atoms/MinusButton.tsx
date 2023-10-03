import React, { useCallback, useRef } from 'react'
import { Pressable, ViewStyle, Animated } from 'react-native'

import { Icon } from './Icon'
import { THEME_COLORS } from '../../utils/Constants'

export type MinusButtonProps = {
    style?: ViewStyle
    color: string
    onPress: () => void
    shadow: boolean
    disabled: boolean
    size: number
}

export const MinusButton = React.memo((props: Partial<MinusButtonProps>) => {
    let { style, color, onPress, shadow, disabled, size } = props
    disabled = disabled ?? false
    shadow = shadow ?? true
    size = size ?? 30
    const shadowAnim = useRef(new Animated.Value(8)).current
    const shadowFadeOut = useCallback((duration: number) => {
        Animated.sequence([
            Animated.timing(shadowAnim, {
                toValue: 0,
                duration,
                useNativeDriver: true,
            }),
            Animated.timing(shadowAnim, {
                toValue: 8,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start()
    }, [shadowAnim])
    return (
        <Animated.View
            style={[
                {
                    shadowOpacity: !disabled && shadow ? 0.2 : 0,
                    shadowColor: '#000',
                    shadowRadius: shadowAnim,
                    shadowOffset: { width: 0, height: 5 },
                    elevation: !disabled && shadow ? shadowAnim : 0,
                    height: size,
                    width: size,
                    backgroundColor: '#fff',
                    borderRadius: size,
                },
                style,
            ]}
        >
            <Pressable
                onPress={() => {
                    if (!disabled) {
                        shadowFadeOut(100)
                        if (onPress) {
                            onPress()
                        }
                    }
                }}
                style={[
                    {
                        backgroundColor: disabled ? THEME_COLORS.OTHERS.BORDER_COLOR : color ?? THEME_COLORS.OTHERS.ALERT_RED,
                        borderRadius: size,
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: size,
                        width: size,
                    },
                ]}
            >
                <Icon style={{}} name={'minus'} width={size / 2} height={size / 2} fill={'#fff'} />
            </Pressable>
        </Animated.View>
    )
})
