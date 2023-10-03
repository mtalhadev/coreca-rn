import React, { useState, useEffect, useMemo } from 'react'
import { Pressable, View, ViewStyle, Text } from 'react-native'

import { BlueColor, ColorStyle, FontStyle } from '../../../utils/Styles'
import { CustomDate, monthBaseText } from "../../../models/_others/CustomDate"
import { InputBox } from '../../atoms/InputBox'
import { SelectYearMonthModal } from '../../atoms/SelectYearMonthModal'
import { THEME_COLORS } from '../../../utils/Constants'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
// const { t } = useTextTranslation()
type InputValue = CustomDate | undefined

export type InputYearMonthBoxProps = {
    title: string
    placeholder: string
    color: ColorStyle
    borderWidth: number
    height: number
    infoText: string
    onValueChangeValid: (value: InputValue) => void
    value: InputValue
    initDateInput: CustomDate
    disable: boolean
    required: boolean
    style?: ViewStyle
}

export const MULTILINE_HEIGHT_MULTIPLE = 2

export const InputYearMonthBox = (props: Partial<InputYearMonthBoxProps>) => {
    // import { useTextTranslation } from '../../../fooks/useTextTranslation'
    const { t } = useTextTranslation()
    let { color, borderWidth, height, title, infoText, onValueChangeValid, placeholder, value, disable, required, initDateInput, style } = props
    title = title ?? t('common:Title')
    color = color ?? BlueColor
    borderWidth = borderWidth ?? 2
    height = height ?? 50
    placeholder = placeholder ?? t('common:Input')
    disable = disable ?? false
    required = required ?? false
    const [yearMonth, setYearMonth] = useState<InputValue>(value as InputValue)
    const [isSelectYearMonth, setIsSelectYearMonth] = useState<boolean>(false)
    const [valid, setValid] = useState<'good' | 'bad' | 'none'>('none')
    const [isVisible, setIsVisible] = useState<boolean>(false)
    const [isFirstUpdate, setIsFirstUpdate] = useState(true)

    useMemo(() => {
        if (!isSelectYearMonth) {
            setYearMonth(value)
        }
    }, [value])

    const _onValueChangeValid = (_value: InputValue) => {
        if (onValueChangeValid) {
            if (isSelectYearMonth) {
                if (_value != value) {
                    onValueChangeValid(_value)
                }
                setIsSelectYearMonth(false)
            }
        }
    }

    const onHideDateTime = (): void => {
        setIsVisible(false)
    }

    const onConfirmYearMonth = (selectedYearMonth: CustomDate): void => {
        setYearMonth(selectedYearMonth)
        setIsVisible(false)
    }

    const updateDateTime = (_yearMonth: InputValue) => {
        let valid = true
        if (isFirstUpdate) {
            setIsFirstUpdate(false)
        }
        if (_yearMonth == undefined) {
            valid = false
        }

        if (valid) {
            setValid('good')
            _onValueChangeValid(_yearMonth)
        } else {
            if (!isFirstUpdate) {
                setValid('bad')
            } else {
                setValid('none')
            }
            _onValueChangeValid(undefined)
        }
    }

    useEffect(() => {
        updateDateTime(yearMonth)
    }, [yearMonth])

    return (
        <View style={[style]}>
            <InputBox valid={valid} height={height} borderWidth={borderWidth} color={color} title={title} disable={disable} required={required} infoText={infoText}>
                <View style={{ flexDirection: 'row' }}>
                    <Pressable
                        style={{
                            flex: 5,
                        }}
                        onPress={() => {
                            if (!disable) {
                                setIsSelectYearMonth(true)
                                setIsVisible(true)
                            }
                        }}
                    >
                        <View pointerEvents="none">
                            <Text
                                style={{
                                    color: yearMonth != undefined ? (valid == 'bad' ? 'red' : '#000') : THEME_COLORS.OTHERS.LIGHT_GRAY,
                                    fontFamily: FontStyle.regular,
                                    fontSize: 14,
                                    lineHeight: 20,
                                    paddingTop: 5,
                                }}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {yearMonth != undefined ? monthBaseText(yearMonth) : placeholder}
                            </Text>
                        </View>
                    </Pressable>
                </View>
                {isVisible && <SelectYearMonthModal isVisible={isVisible} date={yearMonth ?? initDateInput} onConfirm={onConfirmYearMonth} onCancel={onHideDateTime} />}
            </InputBox>
        </View>
    )
}
