/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react'
import { View, ViewStyle, TextInput, Pressable } from 'react-native'

import { BlueColor, ColorStyle, FontStyle } from '../../../utils/Styles'
import { THEME_COLORS } from '../../../utils/Constants'
import { InputBox } from '../../atoms/InputBox'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import CancelSvg from './../../../../assets/images/cancel.svg'
import { setNotificationCategoryAsync } from 'expo-notifications'

// const { t } = useTextTranslation()
type InputValue = number

export type InputNumberBoxProps = {
    title: string
    placeholder: string
    color: ColorStyle
    borderWidth: number
    height: number
    infoText: string
    onValueChangeValid: (value?: InputValue) => void
    onClear: () => void
    value: InputValue
    minNum: number
    maxNum: number
    disable: boolean
    required: boolean
    style?: ViewStyle
}

export const InputNumberBox = (props: Partial<InputNumberBoxProps>) => {
    const { t } = useTextTranslation()
    let { color, borderWidth, height, title, infoText, onValueChangeValid, onClear, placeholder, value, minNum, maxNum, disable, required, style } = props
    title = title ?? t('common:Title')
    color = color ?? BlueColor
    borderWidth = borderWidth ?? 2
    height = height ?? 50
    placeholder = placeholder ?? t('common:EnterNumbers')
    disable = disable ?? false
    required = required ?? false
    const [number, setNumber] = useState<InputValue | undefined>(value as InputValue | undefined)
    const [isFocused, setIsFocused] = useState<boolean>(false)
    const [valid, setValid] = useState<'good' | 'bad' | 'none'>('none')
    const [isFirstUpdate, setIsFirstUpdate] = useState(true)

    useEffect(() => {
        if (!isFocused) {
            setNumber(value)
            updateNumberInput(value, false)
        }
    }, [value, isFocused])

    const _onValueChangeValid = (value: InputValue | undefined, _isFocused: boolean) => {
        if (onValueChangeValid) {
            if (_isFocused) {
                onValueChangeValid(value)
            }
        }
    }

    const updateNumberInput = (value: InputValue | undefined, _isFocused: boolean) => {
        if (value == undefined) {
            return
        }
        if (isFirstUpdate) {
            setIsFirstUpdate(false)
        }
        let valid = true

        if ((minNum as number) > value || value > (maxNum as number)) {
            valid = false
        }

        if (valid) {
            setValid('good')
            _onValueChangeValid(value, _isFocused)
        } else {
            if (!isFirstUpdate && !_isFocused) {
                setValid('bad')
            } else {
                setValid('none')
            }
            _onValueChangeValid(undefined, _isFocused)
        }
    }

    return (
        <View style={[style]}>
            <InputBox valid={valid} height={height} borderWidth={borderWidth} color={color} title={title} disable={disable} required={required} infoText={infoText}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                    <TextInput
                        style={{
                            fontFamily: FontStyle.regular,
                            fontSize: 14,
                            lineHeight: 20,
                            height: height,
                            textAlignVertical: 'center',
                            color: valid == 'bad' ? 'red' : '#000',
                            paddingTop: 0,
                            flex: 1,
                        }}
                        keyboardType={'numeric'}
                        placeholder={placeholder}
                        placeholderTextColor={THEME_COLORS.OTHERS.LIGHT_GRAY}
                        onChangeText={(text) => {
                            if (disable) {
                                return
                            }
                            const newNumber = Number(text)
                            if (isNaN(newNumber)) {
                                return
                            }
                            if ((minNum as number) > newNumber || (maxNum as number) < newNumber) {
                                return
                            }
                            setNumber(newNumber)
                            updateNumberInput(newNumber, true)
                        }}
                        onFocus={() => {
                            setIsFocused(true)
                        }}
                        onBlur={() => {
                            setIsFocused(false)
                        }}
                        editable={!disable}
                        value={number?.toString()}
                    />
                    {onClear && (
                        <Pressable
                            disabled={disable}
                            onPress={() => {
                                if (onClear) {
                                    onClear()
                                    setNumber(undefined)
                                    setValid('none')
                                }
                            }}>
                            <CancelSvg
                                style={{
                                    marginRight: -10,
                                }}
                                width={25}
                                height={25}
                                fill={'#C9C9C9'}
                            />
                        </Pressable>
                    )}
                </View>
            </InputBox>
        </View>
    )
}
