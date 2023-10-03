import React, { useState, useRef, useEffect } from 'react'
import { Text, Pressable, View, Image, ViewStyle, Animated } from 'react-native'
import { Icon } from './Icon'

export type EditButtonProps = {
    style?: ViewStyle
    color: string
    onPress: () => void
    shadow: boolean
    disabled: boolean
    size: number
}

export const EditButton = React.memo((props: Partial<EditButtonProps>) => {
    let { style, color, onPress, shadow, disabled, size } = props
    disabled = disabled ?? false
    shadow = shadow ?? true
    size = size ?? 45
    const shadowAnim = useRef(new Animated.Value(8)).current
    const shadowFadeOut = (duration: number) => {
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
    }
    return (
        <Animated.View
            style={[
                {
                    // shadowOpacity: !disabled && shadow ? 0.2 : 0,
                    shadowColor: '#000',
                    shadowRadius: shadowAnim,
                    shadowOffset: { width: 0, height: 5 },
                    // elevation: !disabled && shadow ? shadowAnim : 0,
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
                        borderRadius: size,
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: size,
                        width: size,
                    },
                ]}
            >
                <Icon style={{}} name={'edit'} width={size / 2} height={size / 2} fill={'#000'} />
            </Pressable>
        </Animated.View>
    )
})
