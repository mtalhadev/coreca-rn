/* eslint-disable indent */
/* eslint-disable prefer-const */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Text, Pressable, View, ViewStyle, Animated, StyleSheet } from 'react-native'

import { FontStyle } from '../../utils/Styles'
import MaskedView from '@react-native-masked-view/masked-view'
import { WINDOW_WIDTH } from '../../utils/Constants'
import './../../utils/ext/Date.extensions'
import {
    CustomDate,
    dayBaseText,
    getDailyStartTime,
    getMonthlyFirstDay,
    getYearlyFirstDay,
    monthBaseText,
    newCustomDate,
    nextDay,
    nextMonth,
    nextYear,
    yearBaseText,
} from '../../models/_others/CustomDate'
import SwitchButtonHighlight from './../../../assets/images/switchButtonHighlight.svg'
import Arrow from './../../../assets/images/back.svg'
import { match } from 'ts-pattern'
export type Side = 'next' | 'prev'

export type SwitchDateButtonProps = {
    dateType: 'year' | 'month' | 'day'
    onChangeValue: (value: CustomDate, side: Side) => void
    initValue: CustomDate
    changeValue: CustomDate
    fontSize: number
    textColor: string
    fontFamily: string
    shadow: boolean
    highlightColor: string
    buttonColor: string
    disabled: boolean
    animation: boolean
    dateUpdate?: number
    style?: ViewStyle
}

export const SwitchDateButton = React.memo((props: Partial<SwitchDateButtonProps>) => {
    let { dateType, onChangeValue, initValue, changeValue, fontSize, textColor, fontFamily, shadow, highlightColor, buttonColor, disabled, animation, dateUpdate, style } = props
    dateType = dateType ?? 'day'

    fontSize = fontSize ?? 14
    shadow = shadow ?? true
    fontFamily = fontFamily ?? FontStyle.regular
    textColor = textColor ?? '#000'
    highlightColor = highlightColor ?? '#fff'
    buttonColor = buttonColor ?? '#EFF1F5'
    animation = animation ?? true
    disabled = disabled ?? false
    const height = 30
    const width = WINDOW_WIDTH - 20

    const today = useMemo(
        () =>
            match(dateType)
                .with('year', () => getYearlyFirstDay(newCustomDate()))
                .with('month', () => getMonthlyFirstDay(newCustomDate()))
                .with('day', () => getDailyStartTime(newCustomDate()))
                .otherwise(() => newCustomDate()),
        [dateType],
    )

    const [value, setValue] = useState<CustomDate>(initValue ?? today)
    const [update, setUpdate] = useState<number>(0)
    const scaleXAnimLeft = useRef(new Animated.Value(1)).current
    const scaleXAnimRight = useRef(new Animated.Value(1)).current
    const shadowAnim = useRef(new Animated.Value(2)).current
    const textAnim = useRef(new Animated.Value(0)).current
    const arrowAnimLeft = useRef(new Animated.Value(0)).current
    const arrowAnimRight = useRef(new Animated.Value(0)).current

    useEffect(() => {
        setValue(initValue ?? today)
    }, [dateUpdate])

    /**
     * 動作軽量化のために非表示。
     * Hiruma
     * 2022-11-17
     */
    // const scaleX = useCallback((duration: number, anim: Animated.Value) => {
    //     Animated.sequence([
    //         Animated.timing(anim, {
    //             toValue: 1.2,
    //             duration: duration / 2,
    //             useNativeDriver: true,
    //         }),
    //         Animated.timing(anim, {
    //             toValue: 1,
    //             duration: duration / 2,
    //             useNativeDriver: true,
    //         }),
    //     ]).start()
    // }, [])

    /**
     * 動作軽量化+日付を先に確認するために非表示。
     * Hiruma
     * 2022-11-17
     */
    // const textSlide = useCallback((duration: number, left = true) => {
    //     Animated.sequence([
    //         Animated.timing(textAnim, {
    //             toValue: (left ? 1 : -1) * WINDOW_WIDTH - 40,
    //             duration: duration / 2,
    //             useNativeDriver: true,
    //         }),
    //         Animated.timing(textAnim, {
    //             toValue: (left ? 1 : -1) * (-WINDOW_WIDTH + 40),
    //             duration: 0,
    //             useNativeDriver: true,
    //         }),
    //         Animated.timing(textAnim, {
    //             toValue: 0,
    //             duration: duration / 2,
    //             useNativeDriver: true,
    //         }),
    //     ]).start()
    // }, [])

    const arrowSlide = useCallback((duration: number, anim: Animated.Value) => {
        Animated.sequence([
            Animated.timing(anim, {
                toValue: -5,
                duration: duration / 2,
                useNativeDriver: true,
            }),
            Animated.timing(anim, {
                toValue: 0,
                duration: duration / 2,
                useNativeDriver: true,
            }),
        ]).start()
    }, [])

    /**
     * 動作軽量化のために非表示。
     * Hiruma
     * 2022-11-17
     */
    // const shadowFadeOut = useCallback((duration: number) => {
    //     Animated.timing(shadowAnim, {
    //         toValue: 0,
    //         duration: duration / 2,
    //         useNativeDriver: true,
    //     }).start()
    //     InteractionManager.runAfterInteractions(() => {
    //         Animated.timing(shadowAnim, {
    //             toValue: 2,
    //             duration: duration / 2,
    //             useNativeDriver: true,
    //         }).start()
    //     })
    // }, [])

    const _switch = useCallback(
        (side: Side, newValue: CustomDate, multiple = 1, _animation = animation) => {
            let _value = undefined
            switch (dateType) {
                case 'month':
                    _value = nextMonth(getMonthlyFirstDay(newValue), side == 'next' ? multiple : -multiple)
                    setValue(_value)
                    break
                case 'year':
                    _value = nextYear(newValue, side == 'next' ? multiple : -multiple)
                    setValue(_value)
                    break
                case 'day':
                    _value = nextDay(newValue, side == 'next' ? multiple : -multiple)
                    setValue(_value)
                    break
            }
            if (_value == undefined) {
                return
            }
            if (_animation) {
                /**
                 * 動作軽量化のために非表示。
                 * Hiruma
                 * 2022-11-17
                 */
                const duration = 200
                // scaleX(duration, side == 'next' ? scaleXAnimRight : scaleXAnimLeft)
                arrowSlide(duration, side == 'next' ? arrowAnimRight : arrowAnimLeft)
                // setTimeout(() => {
                //     setUpdate(update + 1)
                // }, duration / 2)
                // shadowFadeOut(duration)
                // textSlide(duration, side == 'prev')
            }

            if (onChangeValue) {
                onChangeValue(_value, side)
            }
        },
        [dateType, onChangeValue],
    )

    useMemo(() => {
        if (changeValue == undefined) {
            return
        }
        let side: Side = 'prev'
        if (changeValue.totalSeconds > value.totalSeconds) {
            side = 'next'
        }
        let change = true
        switch (dateType) {
            case 'year':
                if (changeValue.year == value.year) {
                    change = false
                }
                break
            case 'month':
                if (changeValue.month == value.month) {
                    change = false
                }
                break
            case 'day':
                if (changeValue.day == value.day) {
                    change = false
                }
                break
            default:
                change = false
                break
        }
        if (change) {
            _switch(side, changeValue, 0)
        }
    }, [changeValue])

    return (
        <Animated.View
            style={[
                {
                    shadowOpacity: !disabled && shadow ? 0.3 : 0,
                    shadowColor: '#000',
                    shadowRadius: shadowAnim,
                    shadowOffset: { width: 1, height: 1 },
                    elevation: !disabled && shadow ? shadowAnim : 0,
                    alignSelf: 'center',
                    position: 'absolute',
                    zIndex: 1,
                    backgroundColor: buttonColor,
                    borderRadius: height,
                    height,
                    width,
                },
                style,
            ]}>
            <MaskedView
                style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                }}
                maskElement={
                    <View
                        style={{
                            backgroundColor: '#000',
                            borderRadius: height,
                            height,
                            width,
                        }}></View>
                }>
                <Pressable
                    onPress={() => {
                        if (!disabled) {
                            _switch('prev', value)
                        }
                    }}
                    style={{
                        left: 0,
                        position: 'absolute',
                        justifyContent: 'center',
                        zIndex: 2,
                        width: 100,
                        height,
                    }}>
                    <Animated.View
                        style={{
                            position: 'absolute',
                            zIndex: 1,
                            left: 15,
                            transform: [
                                {
                                    translateX: arrowAnimLeft,
                                },
                            ],
                            // marginLeft: ,
                        }}>
                        <Arrow width={16} height={16} fill={'#444'} />
                    </Animated.View>
                    <Animated.View
                        style={{
                            transform: [{ scale: scaleXAnimLeft }],
                        }}>
                        <SwitchButtonHighlight
                            style={{
                                transform: [
                                    {
                                        scale: -1,
                                    },
                                ],
                            }}
                            fill={highlightColor}
                        />
                    </Animated.View>
                </Pressable>
                <Animated.View
                    style={{
                        transform: [
                            {
                                translateX: textAnim,
                            },
                        ],
                        justifyContent: 'center',
                        alignItems: 'center',
                        height,
                    }}>
                    <Text
                        style={{
                            fontFamily,
                            fontSize,
                            lineHeight: 16,
                            zIndex: 0,
                            color: textColor,
                        }}>
                        {dateType == 'year' ? yearBaseText(value) : dateType == 'month' ? monthBaseText(value) : dayBaseText(value)}
                    </Text>
                </Animated.View>

                <Pressable
                    onTouchStart={() => {
                        if (!disabled) {
                            _switch('next', value)
                        }
                    }}
                    style={{
                        right: 0,
                        position: 'absolute',
                        justifyContent: 'center',
                        // alignItems: 'center',
                        zIndex: 1,
                        height,
                    }}>
                    <Animated.View
                        style={{
                            position: 'absolute',
                            zIndex: 1,
                            transform: [
                                {
                                    scaleX: -1,
                                },
                                {
                                    translateX: arrowAnimRight,
                                },
                            ],
                            right: 15,
                        }}>
                        <Arrow width={16} height={16} fill={'#444'} />
                    </Animated.View>

                    <Animated.View
                        style={{
                            transform: [{ scale: scaleXAnimRight }],
                        }}>
                        <SwitchButtonHighlight style={{}} fill={highlightColor} />
                    </Animated.View>
                </Pressable>
            </MaskedView>
        </Animated.View>
    )
})

const styles = StyleSheet.create({})
