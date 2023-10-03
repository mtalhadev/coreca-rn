/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react'
import { Text, Pressable, View, ViewStyle } from 'react-native'

import { BlueColor, ColorStyle, FontStyle } from '../../../utils/Styles'
import { THEME_COLORS } from '../../../utils/Constants'
import { useNavigation } from '@react-navigation/core'
import DropdownSvg from './../../../../assets/images/dropdown.svg'
import CancelSvg from './../../../../assets/images/cancel.svg'
import { InputBox, ValidType } from '../../atoms/InputBox'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
// const { t } = useTextTranslation()
type InputValue = string[]

export type InputDropDownBoxProps = {
    title: string
    placeholder: string
    color: ColorStyle
    borderWidth: number
    height: number
    infoText: string
    onValueChangeValid: (value?: InputValue) => void
    onClear: () => void
    value: InputValue
    selectableItems: string[]
    selectNum: number | 'any'
    minSelectNum: number
    disable: boolean
    required: boolean
    style?: ViewStyle
}

export const InputDropDownBox = React.memo((props: Partial<InputDropDownBoxProps>) => {
    // import { useTextTranslation } from '../../../fooks/useTextTranslation'
    const { t } = useTextTranslation()
    let { color, borderWidth, height, title, infoText, onValueChangeValid, onClear, placeholder, selectableItems, value, selectNum, disable, required, minSelectNum, style } = props
    title = title ?? t('common:Title')
    color = color ?? BlueColor
    borderWidth = borderWidth ?? 2
    height = height ?? 50
    placeholder = placeholder ?? t('common:Selection')
    selectNum = selectNum ?? 1
    selectableItems = selectableItems ?? ['Sample1', 'Sample2']
    disable = disable ?? false
    required = required ?? false
    minSelectNum = minSelectNum ?? 0
    const navigation = useNavigation<any>()
    const [isSelectMenuOpen, setIsSelectMenuOpen] = useState<boolean>(false)
    const [valid, setValid] = useState<ValidType>('none')
    const [selectItems, setSelectItems] = useState<InputValue>((value as InputValue) ?? [])
    const [dropdownText, setDropdownText] = useState('')
    const [isFirstUpdate, setIsFirstUpdate] = useState(true)

    useEffect(() => {
        /**
         * 選択時は反映されないようにすることで、外の値で自動更新されないようにする。
         */
        if (!isSelectMenuOpen) {
            setSelectItems(value ?? [])
            updateDropdownValue(value ?? [], false)
        }
    }, [value])

    /**
     * 外部に選択したデータを渡す。選択中のみ。
     * ここでisSelectMenuOpenでフィルターしないと、valueが更新されて、無限ループしてしまう。
     * @param selectedItems
     */
    const _onValueChangeValid = (selectedItems: string[] | undefined, _isSelectMenuOpen: boolean) => {
        if (onValueChangeValid) {
            /**
             * 選択時のみ、
             */
            if (_isSelectMenuOpen) {
                onValueChangeValid(selectedItems)
            }
        }
    }

    const _setDropdownText = (selectItems?: string[]) => {
        if (selectItems == undefined) {
            return
        }
        let dropdownValueLocal = ''
        selectItems?.forEach((item, index) => {
            dropdownValueLocal += (dropdownValueLocal.length > 0 ? ', ' : '') + item
        })
        setDropdownText(dropdownValueLocal)
    }

    /**
     * 選択データの更新プロセス。直接呼び出す。なぜかstateが使えない場面があるので、直接呼び出す。
     * @param selectItems
     * @returns
     */
    const updateDropdownValue = (selectItems: string[] | undefined, _isSelectMenuOpen: boolean) => {
        if (selectItems == undefined) {
            return
        }
        if (isFirstUpdate) {
            setIsFirstUpdate(false)
        }
        const itemsFilter = selectableItems?.filter((value, index) => selectItems.includes(value))
        _setDropdownText(itemsFilter)
        if (!itemsFilter) {
            return
        }
        if (itemsFilter.length <= 0 && (minSelectNum ?? 0) <= 0) {
            setValid('none')
        } else {
            if (itemsFilter.length == selectNum) {
                setValid('good')
            } else if (selectNum == 'any' && (minSelectNum ?? 0) <= itemsFilter.length) {
                setValid('good')
            } else {
                if (!isFirstUpdate) {
                    setValid('bad')
                } else {
                    setValid('none')
                }
            }
        }
        _onValueChangeValid(itemsFilter, _isSelectMenuOpen)
    }

    /**
     * 選択画面で使用。選択変更時に更新。
     * @param selectedItems
     */
    const _onChangeSelectItems = useCallback(
        (selectedItems: string[] | undefined) => {
            setSelectItems((selectedItems ?? []) as string[])
            updateDropdownValue((selectedItems ?? []) as string[], true)
        },
        [setSelectItems, updateDropdownValue],
    )

    /**
     * 選択画面で使用。閉じるタイミングではSelectItemsを更新しない。冗長なので。
     * @param selectedItems
     */
    const _onCloseSelectMenu = useCallback(
        (selectedItems: string[] | undefined) => {
            setIsSelectMenuOpen(false)
        },
        [setIsSelectMenuOpen],
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
                            setIsSelectMenuOpen(true)
                            navigation.push('SelectMenu', {
                                color,
                                title,
                                items: selectableItems,
                                minNum: minSelectNum,
                                initialItems: selectItems,
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
                                color: (selectItems?.length ?? 0) > 0 ? (valid == 'bad' ? 'red' : '#000') : THEME_COLORS.OTHERS.LIGHT_GRAY,
                                fontFamily: FontStyle.regular,
                                fontSize: 14,
                                lineHeight: 20,
                            }}
                            numberOfLines={1}
                            ellipsizeMode="tail">
                            {(selectItems?.length ?? 0) > 0 ? dropdownText : placeholder}
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
                                    setValid('none')
                                }
                            }}>
                            <CancelSvg
                                style={{
                                    marginHorizontal: 10,
                                    marginVertical: 10,
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
})
