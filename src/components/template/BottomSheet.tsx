/* eslint-disable prefer-const */
import React, { useRef, useEffect, PropsWithChildren } from 'react'
import { View, ViewStyle, Animated, StyleSheet, Platform } from 'react-native'
import { ifIphoneX } from 'react-native-iphone-screen-helper'
import { useDispatch } from 'react-redux'
import { IPHONEX_BOTTOM_HEIGHT, WINDOW_HEIGHT, WINDOW_WIDTH } from '../../utils/Constants'

export type BottomSheetProps = {
    height?: number
    isOpen?: boolean
    onClose?: () => void
    style?: ViewStyle
}

export const BottomSheet = React.memo((props: PropsWithChildren<Partial<BottomSheetProps>>) => {
    let { style, height, isOpen, children, onClose } = props
    const dispatch = useDispatch()
    const ANIM_DURATION = 200
    const shadowAnim = useRef(new Animated.Value(10)).current
    const fadeAnim = useRef(new Animated.Value(0)).current
    const slideAnim = useRef(new Animated.Value(WINDOW_HEIGHT)).current

    useEffect(() => {
        if (height) {
            openAnimation(ANIM_DURATION)
        }
    }, [height])

    const closeAnimation = (duration: number) => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: duration,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: WINDOW_HEIGHT,
                duration: duration,
                useNativeDriver: true,
            }),
        ]).start()
    }

    const openAnimation = (duration: number) => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0.5,
                duration: duration,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: WINDOW_HEIGHT - (height ?? 0),
                duration: duration,
                useNativeDriver: true,
            }),
        ]).start()
    }

    useEffect(() => {
        if (isOpen) {
            openAnimation(ANIM_DURATION)
        } else {
            closeAnimation(ANIM_DURATION)
        }
    }, [isOpen])

    return (
        <View
            style={{
                position: 'absolute',
            }}>
            {isOpen == true && (
                <Animated.View
                    style={[
                        {
                            zIndex: Platform.OS == 'ios' ? 1 : undefined,
                        },
                    ]}>
                    <Animated.View
                        style={{
                            width: WINDOW_WIDTH,
                            height: WINDOW_HEIGHT,
                            backgroundColor: '#000',
                            position: 'absolute',
                            opacity: fadeAnim,
                            zIndex: Platform.OS == 'ios' ? 1 : undefined,
                        }}
                        onTouchStart={() => {
                            if (onClose) {
                                onClose()
                            }
                        }}></Animated.View>
                    <Animated.View
                        style={[
                            {
                                position: 'absolute',
                                zIndex: Platform.OS == 'ios' ? 2 : undefined,
                                width: WINDOW_WIDTH,
                                height: height,
                                backgroundColor: '#fff',
                                transform: [
                                    {
                                        translateY: slideAnim,
                                    },
                                ],

                                shadowOpacity: 0.2,
                                shadowColor: '#000',
                                shadowRadius: shadowAnim,
                                shadowOffset: { width: 0, height: 0 },
                                elevation: shadowAnim,
                                ...ifIphoneX(
                                    {
                                        paddingBottom: 50 + IPHONEX_BOTTOM_HEIGHT,
                                    },
                                    {
                                        paddingBottom: 50,
                                    },
                                ),
                            },
                            style,
                        ]}>
                        {children}
                    </Animated.View>
                </Animated.View>
            )}
        </View>
    )
})

const styles = StyleSheet.create({})
