/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react'
import { Text, Pressable, View, ViewStyle } from 'react-native'

import { BlueColor, ColorStyle, FontStyle } from '../../../utils/Styles'
import { THEME_COLORS } from '../../../utils/Constants'
import { useNavigation } from '@react-navigation/core'
import DropdownSvg from './../../../../assets/images/dropdown.svg'
import { InputBox, ValidType } from '../../atoms/InputBox'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
// const { t } = useTextTranslation()
export type InputObject =
    | {
          tag: string
          value: string
      }
    | undefined

type InputValue = InputObject[] | undefined

export type InputObjectDropdownBoxProps = {
    title: string
    placeholder: string
    color: ColorStyle
    borderWidth: number
    height: number
    infoText: string
    onValueChangeValid: (value?: InputValue) => void
    value: InputValue
    selectableItems: InputValue
    selectNum: number | 'any'
    minSelectNum: number
    disable: boolean
    required: boolean
    style?: ViewStyle
}

export const InputObjectDropdownBox = (props: Partial<InputObjectDropdownBoxProps>) => {
    // import { useTextTranslation } from '../../../fooks/useTextTranslation'
const { t } = useTextTranslation()
    let { color, borderWidth, height, title, infoText, onValueChangeValid, placeholder, selectableItems, value, selectNum, disable, required, minSelectNum, style } = props
    title = title ?? t('common:Title')
    color = color ?? BlueColor
    borderWidth = borderWidth ?? 2
    height = height ?? 50
    placeholder = placeholder ?? t('common:Selection')
    selectNum = selectNum ?? 1
    selectableItems = selectableItems ?? [
        {
            tag: t('common:Sample1'),
            value: 'sample1',
        },
        {
            tag: t('common:Sample2'),
            value: 'sample2',
        },
    ]
    disable = disable ?? false
    required = required ?? false
    minSelectNum = minSelectNum ?? 0
    const navigation = useNavigation<any>()
    const [isSelectMenuOpen, setIsSelectMenuOpen] = useState<boolean>(false)
    const [valid, setValid] = useState<ValidType>('none')
    const [selectItems, setSelectItems] = useState<InputValue>(value as InputValue)
    const [update, setUpdate] = useState(0)
    const [dropdownText, setDropdownText] = useState(placeholder)
    const [textColor, setTextColor] = useState(THEME_COLORS.OTHERS.LIGHT_GRAY)

    useEffect(() => {
        setSelectItems(value)
        setUpdate(update + 1)
    }, [value])

    const _onChangeSelectItems = (value: string[] | undefined) => {
        // 
    }

    const _onValueChangeValid = (value: InputValue | undefined) => {
        if (onValueChangeValid) {
            if (isSelectMenuOpen) {
                onValueChangeValid(value)
                setIsSelectMenuOpen(false)
            }
        }
    }

    const _onCloseSelectMenu = (items: string[] | undefined) => {
        setIsSelectMenuOpen(true)
        setSelectItems(items?.map((item) => textToItem(item)).filter((item) => item != undefined))
        setUpdate(update + 1)
    }

    const _setDropdownText = (selectItems?: InputValue) => {
        if (selectItems == undefined) {
            return
        }
        let dropdownTextLocal = ''
        selectItems?.forEach((item, index) => {
            if (item?.tag) {
                dropdownTextLocal += (dropdownTextLocal.length > 0 ? ', ' : '') + item.tag
            }
        })
        // なぜか(selectItems?.length ?? 0) > 0をrender以下に直接入れると更新されないのでここでここで分岐
        setTextColor((selectItems?.length ?? 0) > 0 ? (valid == 'bad' ? 'red' : '#000') : THEME_COLORS.OTHERS.LIGHT_GRAY)
        setDropdownText((selectItems?.length ?? 0) > 0 ? dropdownTextLocal : placeholder ?? '')
    }

    const updateDropdown = (selectItems: InputValue | undefined) => {
        // if (disable) {
        //     return
        // }
        if (selectItems == undefined) {
            return
        }
        _setDropdownText(selectItems)
        if (selectItems.length <= 0 && (minSelectNum ?? 0) <= 0) {
            setValid('none')
            _onValueChangeValid(selectItems)
        } else {
            if (selectItems.length == selectNum) {
                setValid('good')
                _onValueChangeValid(selectItems)
            } else if (selectNum == 'any' && (minSelectNum ?? 0) <= selectItems.length) {
                setValid('good')
                _onValueChangeValid(selectItems)
            } else {
                if (required) {
                    setValid('bad')
                } else {
                    setValid('none')
                }
                _onValueChangeValid(undefined)
            }
        }
    }

    const itemToText = (item: InputObject): string | undefined => {
        return item?.tag
    }

    const textToItem = (tag: string): InputObject | undefined => {
        return selectableItems?.filter((item) => item?.tag == tag)[0]
    }

    useEffect(() => {
        updateDropdown(selectItems)
    }, [update])

    return (
        <View style={[style]}>
            <InputBox valid={valid} height={height} borderWidth={borderWidth} color={color} title={title} disable={disable} required={required} infoText={infoText}>
                <Pressable
                    onPress={() => {
                        if (disable) {
                            return
                        }
                        navigation.push('SelectMenu', {
                            color,
                            title,
                            items: selectableItems?.map(itemToText).filter((item) => item != undefined),
                            minNum: minSelectNum,
                            initialItems: selectItems?.map(itemToText).filter((item) => item != undefined),
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
                    }}
                >
                    <Text
                        style={{
                            color: textColor,
                            fontFamily: FontStyle.regular,
                            fontSize: 14,
                            lineHeight: 20,
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
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
            </InputBox>
        </View>
    )
}
