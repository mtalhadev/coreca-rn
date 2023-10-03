/* eslint-disable prefer-const */
import React, { useState, useRef, useEffect, PropsWithChildren, useCallback } from 'react'
import { Pressable, View, ViewStyle, Animated, Easing, StyleSheet } from 'react-native'
import { Icon } from '../../atoms/Icon'
import { Line } from '../../atoms/Line'
import { ShadowBox } from './ShadowBox'

export type ShadowBoxWithToggleProps = {
    onPress: () => void
    onLongPress: () => void
    hideChildren: JSX.Element
    bottomChildren: JSX.Element
    hasShadow?: boolean
    isToggleOpened?: boolean
    title: string
    style?: ViewStyle
}

export const ShadowBoxWithToggle = React.memo((props: PropsWithChildren<Partial<ShadowBoxWithToggleProps>>) => {
    let { onPress, onLongPress, style, title, hasShadow, isToggleOpened, hideChildren, bottomChildren, children } = props

    const [isOpened, setIsOpened] = useState(isToggleOpened ?? false)
    const [isOpen, setIsOpen] = useState(isOpened ?? false)

    const fadeAnim = useRef(new Animated.Value(0)).current
    hasShadow = hasShadow ?? true

    const fadeIn = useCallback(
        (duration = 200) => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration,
                useNativeDriver: true,
                easing: Easing.ease,
            }).start()
        },
        [fadeAnim],
    )

    const fadeOut = useCallback(() => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
        }).start()
    }, [fadeAnim])

    const _toggle = () => {
        if (isOpen) {
            if (isOpened) setIsOpened(false)
            fadeOut()
        } else {
            fadeIn()
        }
        setIsOpen(!isOpen)
    }

    return (
        <ShadowBox
            style={{
                ...style,
            }}
            hasShadow={hasShadow}
            onPress={onPress}
            onLongPress={onLongPress}>
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flex: 1,
                }}>
                <View
                    style={{
                        flexDirection: 'column',
                        flex: 1,
                    }}>
                    {children}
                </View>
                {bottomChildren == undefined && (
                    <Pressable
                        onPress={_toggle}
                        style={{
                            paddingHorizontal: 5,
                            marginRight: -5,
                            marginTop: 20,
                        }}>
                        <Icon
                            style={{
                                transform: [{ scaleY: isOpen ? 1 : -1 }],
                            }}
                            name={'toggle'}
                            width={15}
                            height={15}
                        />
                    </Pressable>
                )}
            </View>

            {bottomChildren != undefined && (
                <View>
                    <Line
                        style={{
                            marginTop: 10,
                        }}
                    />
                    <Pressable
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingTop: 5,
                            alignItems: 'center',
                            flex: 1,
                        }}
                        onPress={() => {
                            _toggle()
                        }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                flex: 5,
                            }}>
                            {bottomChildren}
                        </View>
                        <View
                            style={{
                                flex: 1,
                                alignItems: 'flex-end',
                            }}>
                            <Icon
                                style={{
                                    transform: [{ scaleY: isOpen ? 1 : -1 }],
                                }}
                                name={'toggle'}
                                width={15}
                                height={15}
                            />
                        </View>
                    </Pressable>
                </View>
            )}

            {isOpen && (
                <Animated.View
                    style={{
                        opacity: isOpened ? 1 : fadeAnim,
                    }}>
                    {hideChildren}
                </Animated.View>
            )}
        </ShadowBox>
    )
})

const styles = StyleSheet.create({})
