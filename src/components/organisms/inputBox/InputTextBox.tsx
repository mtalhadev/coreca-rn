/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react'
import { Pressable, View, ViewStyle, TextInput } from 'react-native'

import { BlueColor, ColorStyle, FontStyle } from '../../../utils/Styles'
import { THEME_COLORS } from '../../../utils/Constants'
import { isPassword, isPhone } from '../../../utils/Utils'
import EyeSvg from './../../../../assets/images/eye.svg'
import CancelSvg from './../../../../assets/images/cancel.svg'
import { isEmail } from '../../../utils/Utils'
import { InputBox } from '../../atoms/InputBox'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
// const { t } = useTextTranslation()
type InputValue = string

export type InputTextBoxProps = {
    title: string
    placeholder: string
    color: ColorStyle
    borderWidth: number
    height: number
    infoText: string
    onValueChangeValid: (value?: InputValue) => void
    onClear: (value?: InputValue) => void
    // onClear: () => void
    value: InputValue
    multiline: boolean
    minLength: number
    maxLength: number
    validation: 'none' | 'email' | 'phone' | 'password' | 'number'
    disable: boolean
    required: boolean
    style?: ViewStyle
}

export const MULTILINE_HEIGHT_MULTIPLE = 2

export const InputTextBox = (props: Partial<InputTextBoxProps>) => {
    // import { useTextTranslation } from '../../../fooks/useTextTranslation'
    const { t } = useTextTranslation()
    let { color, borderWidth, height, title, infoText, onValueChangeValid, onClear, placeholder, value, multiline, validation, minLength, maxLength, disable, required, style } = props
    title = title ?? t('common:Title')
    color = color ?? BlueColor
    borderWidth = borderWidth ?? 2
    height = height ?? 50
    placeholder = placeholder ?? t('common:EnterText')
    multiline = multiline ?? false
    validation = validation ?? 'none'
    disable = disable ?? false
    required = required ?? false
    minLength = minLength ?? 1
    maxLength = maxLength ?? 1000
    const [text, setText] = useState<string | undefined>(value as string | undefined)
    const [secret, setSecret] = useState<boolean>(validation == 'password')
    const [isFocused, setIsFocused] = useState<boolean>(false)
    const [valid, setValid] = useState<'good' | 'bad' | 'none'>('none')
    const [isFirstUpdate, setIsFirstUpdate] = useState(true)

    useEffect(() => {
        if (!isFocused) {
            setText(value as string | undefined)
        }
    }, [value])

    const _onValueChangeValid = (value: InputValue | undefined) => {
        if (onValueChangeValid) {
            if (isFocused) {
                onValueChangeValid(value)
            }
        }
    }

    const updateTextInput = (text: string | undefined) => {
        if (text == undefined) {
            return
        }
        if (isFirstUpdate) {
            setIsFirstUpdate(false)
        }
        let valid = true

        if (validation == 'email' && !isEmail(text)) {
            valid = false
        }

        if (validation == 'phone' && !isPhone(text)) {
            valid = false
        }

        if (validation == 'password' && !isPassword(text)) {
            valid = false
        }

        if (validation == 'number' && (text != '' || !isNaN(Number(text)))) {
            valid = false
        }

        if (!((minLength as number) <= text.length && text.length <= (maxLength as number))) {
            valid = false
        }

        if (valid) {
            setValid('good')
            _onValueChangeValid(text)
        } else {
            if (!isFirstUpdate && !isFocused) {
                if (required) {
                    setValid('bad')
                }
            } else {
                setValid('none')
            }
            _onValueChangeValid(undefined)
        }
    }

    useEffect(() => {
        updateTextInput(text)
    }, [text, isFocused])

    return (
        <View style={[style]}>
            <InputBox
                valid={valid}
                height={multiline ? height * MULTILINE_HEIGHT_MULTIPLE : height}
                borderWidth={borderWidth}
                color={color}
                title={title}
                disable={disable}
                required={required}
                infoText={infoText}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1,
                        }}>
                        <TextInput
                            style={{
                                fontFamily: FontStyle.regular,
                                fontSize: 14,
                                lineHeight: 20,
                                height: multiline ? height * MULTILINE_HEIGHT_MULTIPLE : height,
                                textAlignVertical: multiline ? 'top' : 'center',
                                color: valid == 'bad' ? 'red' : '#000',
                                paddingTop: multiline ? 10 : 0,
                                flex: 1,
                            }}
                            placeholder={placeholder}
                            placeholderTextColor={THEME_COLORS.OTHERS.LIGHT_GRAY}
                            onChangeText={(text) => {
                                if (disable) {
                                    return
                                }
                                setText(text)
                            }}
                            onFocus={() => {
                                setIsFocused(true)
                            }}
                            onBlur={() => {
                                setIsFocused(false)
                            }}
                            secureTextEntry={secret}
                            editable={!disable}
                            maxLength={maxLength}
                            multiline={multiline}
                            value={text}
                        />
                        {validation == 'password' && (
                            <Pressable
                                style={{
                                    position: 'absolute',
                                    right: 15,
                                }}
                                onPress={() => {
                                    setSecret(!secret)
                                }}>
                                <EyeSvg style={{}} width={15} height={15} fill={secret ? '#bbb' : '#888'} />
                            </Pressable>
                        )}
                    </View>
                    {onClear && (
                        <Pressable
                            disabled={disable}
                            onPress={() => {
                                if (onClear) {
                                    onClear()
                                    setText(undefined)
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
