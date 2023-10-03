import React, { useRef, useEffect, useCallback, useMemo } from 'react'
import { Text, Pressable, ViewStyle, Animated, Easing, InteractionManager } from 'react-native'

import { FontStyle } from '../../utils/Styles'
import isEmpty from 'lodash/isEmpty'
import { IPHONEX_NOTCH_HEIGHT_MAXIMUM_PLUS, WINDOW_WIDTH } from '../../utils/Constants'
import { setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { useDispatch } from 'react-redux'
import { ifIphoneX } from 'react-native-iphone-screen-helper'
import { match } from 'ts-pattern'
export type ToastProps = {
    toastMessage?: ToastMessage
    style?: ViewStyle
}

export const Toast = React.memo((props: Partial<ToastProps>) => {
    const { toastMessage, style } = props
    let { title, text, type, time } = toastMessage as ToastMessage

    const topAnim = useRef(new Animated.Value(0)).current
    const fadeAnim = useRef(new Animated.Value(0)).current
    const dispatch = useDispatch()
    time = time ?? 3000
    type = type ?? 'info'
    const color = useMemo(
        () =>
            match(type)
                .with('info', () => '#fff')
                .with('warn', () => 'orange')
                .with('error', () => 'red')
                .with('success', () => 'chartreuse')
                .otherwise(() => '#fff'),
        [type],
    )

    const slide = useCallback(
        (duration: number) => {
            Animated.parallel([
                Animated.sequence([
                    Animated.timing(topAnim, {
                        toValue: ifIphoneX(20 + IPHONEX_NOTCH_HEIGHT_MAXIMUM_PLUS, 20),
                        duration: duration + 50,
                        useNativeDriver: false,
                        easing: Easing.ease,
                    }),
                    Animated.timing(topAnim, {
                        delay: time,
                        toValue: 0,
                        duration,
                        useNativeDriver: false,
                        easing: Easing.ease,
                    }),
                ]),
                Animated.sequence([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: duration + 50,
                        useNativeDriver: false,
                        easing: Easing.ease,
                    }),
                    Animated.timing(fadeAnim, {
                        delay: time,
                        toValue: 0,
                        duration,
                        useNativeDriver: false,
                        easing: Easing.ease,
                    }),
                ]),
            ]).start()
            InteractionManager.runAfterInteractions(() => {
                dispatch(setToastMessage(undefined))
                Animated.parallel([
                    Animated.timing(topAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: false,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: false,
                    }),
                ]).start()
            })
        },
        [topAnim, fadeAnim],
    )

    useEffect(() => {
        if (toastMessage && toastMessage.text != '' && toastMessage?.text != undefined) {
            Animated.parallel([
                Animated.timing(topAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: false,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: false,
                }),
            ]).start()
            slide(100)
        }
    }, [toastMessage])

    return (
        <Animated.View
            style={[
                style,
                {
                    top: topAnim,
                    position: 'absolute',
                    opacity: fadeAnim,
                    zIndex: 1,
                    width: WINDOW_WIDTH - 20,
                    marginHorizontal: 10,
                    padding: 15,
                    borderRadius: 10,
                    backgroundColor: color,
                    shadowOpacity: 0.3,
                    shadowColor: '#000',
                    display: isEmpty(text) ? 'none' : 'flex',
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 5 },
                    elevation: 8,
                },
            ]}>
            <Pressable
                onPress={() => {
                    dispatch(setToastMessage(undefined))
                }}>
                {title != undefined && (
                    <Text
                        style={{
                            fontFamily: FontStyle.medium,
                            fontSize: 14,
                            lineHeight: 17,
                            color: type == 'error' ? '#fff' : '#000',
                        }}>
                        {title ?? ''}
                    </Text>
                )}
                {text != undefined && (
                    <Text
                        style={{
                            fontFamily: FontStyle.regular,
                            fontSize: 13,
                            lineHeight: 16,
                            marginTop: 5,
                            color: type == 'error' ? '#fff' : '#000',
                        }}>
                        {text ?? ''}
                    </Text>
                )}
            </Pressable>
        </Animated.View>
    )
})
