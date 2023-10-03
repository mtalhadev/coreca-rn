/* eslint-disable prefer-const */
import React, { useState, useRef, useEffect, useLayoutEffect, PropsWithChildren } from 'react'
import { Text, Pressable, View, Image, ViewStyle, Animated, Easing, InteractionManager, StyleSheet } from 'react-native'
import { THEME_COLORS } from '../../../utils/Constants'
import { FontStyle } from '../../../utils/Styles'
import { Icon } from '../../atoms/Icon'
import { Line } from '../../atoms/Line'
import { ShadowBox } from './ShadowBox'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
// const {t} = useTextTranslation()

export type ShadowBoxWithHeaderAndToggleProps = {
    onPress: () => void
    hideChildren: JSX.Element
    bottomChildren: JSX.Element
    headerColor: string
    titleColor: string
    hasShadow?: boolean
    title?: string
    style?: ViewStyle
}

export const ShadowBoxWithHeaderAndToggle = React.memo((props: PropsWithChildren<Partial<ShadowBoxWithHeaderAndToggleProps>>) => {
    let { onPress, style, title, hasShadow, hideChildren, bottomChildren, children, headerColor, titleColor } = props
    // import { useTextTranslation } from '../../../fooks/useTextTranslation'
    const {t} = useTextTranslation()
    
    const [isOpen, setIsOpen] = useState(false)
    const fadeAnim = useRef(new Animated.Value(0)).current
    hasShadow = hasShadow ?? true

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
        <ShadowBox
            style={{
                ...style,
            }}
            hasShadow={hasShadow}
            onPress={() => {
                _toggle()
                onPress && onPress()
            }}
            testID='shadowBox'
        >
            {title != undefined && (
                <View
                    style={{
                        backgroundColor: headerColor ?? THEME_COLORS.OTHERS.PURPLE_GRAY,
                        paddingVertical: 5,
                        paddingLeft: 10,
                        borderTopEndRadius: 10,
                        borderTopStartRadius: 10,
                    }}
                >
                    <Text
                        style={{
                            fontFamily: FontStyle.regular,
                            fontSize: 12,
                            lineHeight: 14,
                            color: titleColor ?? THEME_COLORS.OTHERS.GRAY,
                        }}
                    >
                        {title ?? t('common:Title')}
                    </Text>
                </View>
            )}

            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flex: 1,
                }}
            >
                <View
                    style={{
                        flexDirection: 'column',
                        flex: 1,
                    }}
                >
                    {children}
                </View>
                {bottomChildren == undefined && (
                    <Pressable
                        onPress={_toggle}
                        style={{
                            paddingHorizontal: 5,
                            marginRight: -5,
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
                        }}
                    >
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                flex: 5,
                            }}
                        >
                            {bottomChildren}
                        </View>
                        <View
                            style={{
                                flex: 1,
                                alignItems: 'flex-end',
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
                        </View>
                    </Pressable>
                </View>
            )}

            {isOpen && (
                <Animated.View
                    style={{
                        opacity: fadeAnim,
                    }}
                >
                    {hideChildren}
                </Animated.View>
            )}
        </ShadowBox>
    )
})

const styles = StyleSheet.create({})
