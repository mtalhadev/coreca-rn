/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Text, Pressable, View, ViewStyle } from 'react-native'

import { BlueColor, ColorStyle, FontStyle } from '../../../utils/Styles'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'
import { THEME_COLORS } from '../../../utils/Constants'
import { useNavigation } from '@react-navigation/core'
import DropdownSvg from './../../../../assets/images/dropdown.svg'
import CancelSvg from './../../../../assets/images/cancel.svg'
import { CustomDate, dayBaseText, monthBaseText, timeBaseText, timeText, toCustomDateFromString, yearBaseText } from '../../../models/_others/CustomDate'
import { InputBox, ValidType } from '../../atoms/InputBox'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
// const { t } = useTextTranslation()
type InputValue = CustomDate[]

export type InputDateDropdownBoxProps = {
    title: string
    placeholder: string
    color: ColorStyle
    borderWidth: number
    height: number
    infoText: string
    onValueChangeValid: (value?: InputValue) => void
    onClear: () => void
    value: InputValue
    dateType: 'year' | 'month' | 'date' | 'datetime' | 'time'
    selectableItems: InputValue
    selectNum: number | 'any'
    minSelectNum: number
    disable: boolean
    required: boolean
    style?: ViewStyle
}

export const InputDateDropdownBox = (props: Partial<InputDateDropdownBoxProps>) => {
    const { t } = useTextTranslation()
    let { color, borderWidth, dateType, height, title, infoText, onValueChangeValid, onClear, placeholder, selectableItems, value, selectNum, disable, required, minSelectNum, style } = props
    title = title ?? t('common:Title')
    color = color ?? BlueColor
    borderWidth = borderWidth ?? 2
    dateType = dateType ?? 'date'
    height = height ?? 50
    placeholder = placeholder ?? t('common:Selection')
    selectNum = selectNum ?? 1
    selectableItems = selectableItems ?? []
    disable = disable ?? false
    required = required ?? false
    minSelectNum = minSelectNum ?? 0
    const navigation = useNavigation<any>()
    const [isSelectMenuOpen, setIsSelectMenuOpen] = useState<boolean>(false)
    const [valid, setValid] = useState<ValidType>('none')
    const [selectItems, setSelectItems] = useState<InputValue | undefined>(value as InputValue | undefined)
    const [update, setUpdate] = useState(0)
    const [dropdownText, setDropdownText] = useState('')
    const [textColor, setTextColor] = useState(THEME_COLORS.OTHERS.LIGHT_GRAY)
    const [isFirstUpdate, setIsFirstUpdate] = useState(true)

    /**
     * 同じ日付がだぶる場合がある。
     */
    const selectableItemsFiltered = useMemo(() => uniqBy(selectableItems, (item) => dayBaseText(item)), [selectableItems])

    useEffect(() => {
        if (!isSelectMenuOpen) {
            const updateValue = uniq(value)
            setSelectItems(updateValue)
            setUpdate(update + 1)
            updateDropdown(updateValue, false)
        }
    }, [value, isSelectMenuOpen])

    /**
     * 外部に選択したデータを渡す。選択中のみ。
     * ここでisSelectMenuOpenでフィルターしないと、valueが更新されて、無限ループしてしまう。
     * @param selectedItems
     */
    const _onValueChangeValid = (value: InputValue | undefined, _isSelectMenuOpen: boolean) => {
        if (onValueChangeValid) {
            if (_isSelectMenuOpen) {
                onValueChangeValid(value)
            }
        }
    }

    const _setDropdownText = (selectItems?: InputValue) => {
        if (selectItems == undefined) {
            return
        }
        let dropdownTextLocal = ''
        const dayBaseTexts = uniq(selectItems?.map((item) => dayBaseText(item)))
        dayBaseTexts?.forEach((item, index) => {
            dropdownTextLocal += (dropdownTextLocal.length > 0 ? ', ' : '') + item
        })
        // なぜか(selectItems?.length ?? 0) > 0をrender以下に直接入れると更新されないのでここでここで分岐
        setTextColor((selectItems?.length ?? 0) > 0 ? (valid == 'bad' ? 'red' : '#000') : THEME_COLORS.OTHERS.LIGHT_GRAY)
        setDropdownText((selectItems?.length ?? 0) > 0 ? dropdownTextLocal : placeholder ?? '')
    }

    /**
     * 選択データの更新プロセス。なぜかstateが使えない場面があるので、直接呼び出す。
     * @param selectItems
     * @returns
     */
    const updateDropdown = (selectItems: InputValue | undefined, _isSelectMenuOpen: boolean) => {
        if (selectItems == undefined) {
            return
        }
        if (isFirstUpdate) {
            setIsFirstUpdate(false)
        }

        _setDropdownText(selectItems)
        if (selectItems.length <= 0 && (minSelectNum ?? 0) <= 0) {
            setValid('none')
        } else {
            if (selectItems.length == selectNum) {
                setValid('good')
            } else if (selectNum == 'any' && (minSelectNum ?? 0) <= selectItems.length) {
                setValid('good')
            } else {
                if (!isFirstUpdate) {
                    setValid('bad')
                } else {
                    setValid('none')
                }
            }
        }
        _onValueChangeValid(selectItems, _isSelectMenuOpen)
    }

    const itemToText = (date: CustomDate): string => {
        if (dateType == 'year') {
            return yearBaseText(date)
        } else if (dateType == 'month') {
            return monthBaseText(date)
        } else if (dateType == 'date') {
            return dayBaseText(date)
        } else if (dateType == 'datetime') {
            return timeBaseText(date)
        } else {
            return timeText(date)
        }
    }

    /**
     * 選択画面で使用。選択変更時に更新。
     * @param selectedItems
     */
    const _onCloseSelectMenu = useCallback(
        (items: string[] | undefined) => {
            setIsSelectMenuOpen(false)
        },
        [setIsSelectMenuOpen],
    )

    /**
     * 選択画面で使用。閉じるタイミングではSelectItemsを更新しない。冗長なので。
     * @param selectedItems
     */
    const _onChangeSelectItems = useCallback(
        (items: string[] | undefined) => {
            const updateItems = uniq(items?.map((item) => toCustomDateFromString(item)))
            setSelectItems(updateItems)
            updateDropdown(updateItems, true)
            setUpdate(update + 1)
        },
        [setSelectItems, updateDropdown, setUpdate, update],
    )

    return (
        <View style={[style]}>
            <InputBox valid={valid} height={height} borderWidth={borderWidth} color={color} title={title} disable={disable} required={required} infoText={infoText}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                    <Pressable
                        onPress={() => {
                            if (disable) {
                                return
                            }
                            navigation.push('SelectMenu', {
                                color,
                                title,
                                items: selectableItemsFiltered?.map(itemToText),
                                minNum: minSelectNum,
                                initialItems: selectItems?.map(itemToText),
                                selectNum,
                                onChange: _onChangeSelectItems,
                                onClose: _onCloseSelectMenu,
                            })
                        }}
                        disabled={disable}
                        style={{
                            height,
                            justifyContent: 'space-between',
                            flexDirection: 'row',
                            alignItems: 'center',
                            flex: 1,
                        }}>
                        <Text
                            style={{
                                color: textColor,
                                fontFamily: FontStyle.regular,
                                fontSize: 14,
                                lineHeight: 20,
                            }}
                            numberOfLines={1}
                            ellipsizeMode="tail">
                            {dropdownText}
                        </Text>
                        <DropdownSvg
                            style={{
                                marginBottom: 3,
                            }}
                            width={15}
                            height={15}
                            fill={'#C9C9C9'}
                        />
                    </Pressable>
                    {onClear && (
                        <Pressable
                            disabled={disable}
                            onPress={() => {
                                if (onClear) {
                                    onClear()
                                }
                            }}>
                            <CancelSvg
                                style={{
                                    marginLeft: 10,
                                    marginRight: -10,
                                }}
                                width={24}
                                height={24}
                                fill={'#C9C9C9'}
                            />
                        </Pressable>
                    )}
                </View>
            </InputBox>
        </View>
    )
}
