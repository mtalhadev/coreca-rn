/* eslint-disable indent */
import React, { useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Animated, Pressable, PlatformColor, Easing } from 'react-native'
import { BlueColor, GreenColor, ColorStyle, GlobalStyles, FontStyle } from '../../utils/Styles'
import { WINDOW_WIDTH } from '../../utils/Constants'
import { Badge } from '../atoms/Badge'

export const CustomTopTabBar = React.memo(({ state, descriptors, navigation, position, color, onTabPress }: any) => {
    const routeCount = state.routes.length
    const inputRange = state.routes.map((_: any, i: number) => i)
    const BAR_MARGIN = 10
    const barPosition = position.interpolate({
        inputRange,
        outputRange: inputRange.map((i: number) => (i * WINDOW_WIDTH) / routeCount),
    })
    // const routeOptions = descriptors[state.routes[state.index]]?.options
    const colorStyle: ColorStyle = color ?? BlueColor
    return (
        <View
            style={{
                flexDirection: 'row',
                backgroundColor: colorStyle.mainColor,
                alignItems: 'center',
                height: 38,
                zIndex: 1,
            }}
        >
            {state.routes.map((route: any, index: number) => {
                const { options } = descriptors[route.key]
                const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name

                const isFocused = state.index === index

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    })

                    if (!isFocused && !event.defaultPrevented) {
                        // The `merge: true` option makes sure that the params inside the tab screen are preserved
                        navigation.navigate({ name: route.name, merge: true })
                        onTabPress && onTabPress(index)
                    }
                }

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    })
                }

                const opacity = position.interpolate({
                    inputRange,
                    outputRange: inputRange.map((i: number) => (i === index ? 1 : 0.8)),
                })

                const scale = position.interpolate({
                    inputRange: inputRange,
                    outputRange: inputRange.map((i: number) => (i === index ? 1 : 0.9)),
                })

                return (
                    <Pressable
                        key={index}
                        accessibilityRole="button"
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Animated.Text
                            style={[
                                {
                                    color: colorStyle.textColor,
                                    opacity,
                                    transform: [{ scale }],
                                    fontSize: 12,
                                    lineHeight: 14,
                                    fontFamily: FontStyle.medium,
                                },
                            ]}
                        >
                            {label}
                        </Animated.Text>
                    </Pressable>
                )
            })}
            <Animated.View
                style={{
                    backgroundColor: colorStyle.subColor,
                    height: 24,
                    marginLeft: BAR_MARGIN,
                    width: WINDOW_WIDTH / routeCount - BAR_MARGIN * 2,
                    position: 'absolute',
                    borderRadius: 100,
                    zIndex: -1,
                    transform: [{ translateX: barPosition }],
                }}
            ></Animated.View>
        </View>
    )
})
