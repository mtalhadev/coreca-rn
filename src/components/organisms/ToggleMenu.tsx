import React, { useState, useRef, PropsWithChildren } from 'react'
import { Text, Pressable, View, ViewStyle, Animated, Easing } from 'react-native'

import { GlobalStyles } from '../../utils/Styles'
import { Icon } from '../atoms/Icon'
export type ToggleMenuProps = {
    style?: ViewStyle
    title?: string
    textStyle?: ViewStyle
}

export const ToggleMenu = React.memo((props: Partial<PropsWithChildren<ToggleMenuProps>>) => {
    const { style, title, textStyle, children } = props

    const [isOpen, setIsOpen] = useState(false)
    const fadeAnim = useRef(new Animated.Value(0)).current

    const fadeIn = (duration = 200) => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
            easing: Easing.ease,
        }).start()
    }

    const fadeOut = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
        }).start()
    }

    const _toggle = () => {
        if (isOpen) {
            fadeOut()
        } else {
            fadeIn()
        }
        setIsOpen(!isOpen)
    }
    return (
        <View style={[style]}>
            <Pressable
                onPress={_toggle}
                style={{
                    flex: 1,
                    alignItems: 'center',
                    padding: 10,
                    flexDirection: 'row',
                    justifyContent: 'center',
                }}
            >
                <Icon
                    style={{
                        transform: [{ scaleY: isOpen ? 1 : -1 }],
                    }}
                    name={'toggle'}
                    width={15}
                    height={15}
                />
                {title != undefined && title != '' && (
                    <Text
                        style={{
                            ...GlobalStyles.smallGrayText,
                            marginLeft: 10,
                            ...textStyle,
                        }}
                    >
                        {title}
                    </Text>
                )}
            </Pressable>
            {isOpen && (
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                    }}
                >
                    {children}
                </Animated.View>
            )}
        </View>
    )
})
