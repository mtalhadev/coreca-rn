/* eslint-disable prefer-const */
import React, { useRef, PropsWithChildren, useCallback } from 'react'
import { Pressable, ViewStyle, Animated, StyleSheet } from 'react-native'
import { THEME_COLORS } from '../../../utils/Constants'

export type ShadowBoxProps = {
    onPress: () => void
    onLongPress?: () => void
    hasShadow?: boolean
    style?: ViewStyle
    shadowAnimValue?: number,
    testID?: string
}

export const ShadowBox = React.memo((props: PropsWithChildren<Partial<ShadowBoxProps>>) => {
    let { onPress, onLongPress, style, children, hasShadow, shadowAnimValue, testID } = props
    hasShadow = hasShadow ?? (onPress != undefined ? true : false)

    const shadowAnim = useRef(new Animated.Value(shadowAnimValue ?? 8)).current

    const shadowFadeOut = useCallback(
        (duration: number) => {
            Animated.sequence([
                Animated.timing(shadowAnim, {
                    toValue: 0,
                    duration,
                    useNativeDriver: true,
                }),
            ]).start()
        },
        [shadowAnim],
    )
    const shadowFadeIn = useCallback(
        (duration: number) => {
            Animated.sequence([
                Animated.timing(shadowAnim, {
                    toValue: shadowAnimValue ?? 8,
                    duration: duration,
                    useNativeDriver: true,
                }),
            ]).start()
        },
        [shadowAnim],
    )

    return (
        <Animated.View
            style={[
                {
                    shadowOpacity: hasShadow ? 0.2 : 0,
                    shadowColor: '#000',
                    shadowRadius: shadowAnim,
                    shadowOffset: { width: 0, height: 1 },
                    backgroundColor: '#fff',
                    elevation: hasShadow ? shadowAnim : 0,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                },
                style,
            ]}
            onTouchStart={() => {
                shadowFadeOut(100)
            }}
            onTouchEndCapture={() => {
                shadowFadeIn(100)
            }}>
            <Pressable
                style={{
                    flex: 1,
                }}
                // disabledを入れないと親のonPressが効かなくなる。
                disabled={onPress == undefined}
                onPress={onPress}
                onLongPress={onLongPress}
                testID={testID}>
                {children}
            </Pressable>
        </Animated.View>
    )
})

const styles = StyleSheet.create({})
