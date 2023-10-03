/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { Text, Pressable, View, Image, ViewStyle, Animated, Easing, TextInput, Platform } from 'react-native'
import { BlueColor, GreenColor, ColorStyle, GlobalStyles, FontStyle } from '../../../utils/Styles'
import { THEME_COLORS } from '../../../utils/Constants'
import { useNavigation } from '@react-navigation/core'
import DropdownSvg from './../../../../assets/images/dropdown.svg'
import CancelSvg from './../../../../assets/images/cancel.svg'
import { InputBox, ValidType } from '../../atoms/InputBox'
import { CompanyCL } from '../company/CompanyCL'
import { CompanyCLType } from '../../../models/company/Company'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
// const { t } = useTextTranslation()
export type InputCompanyBoxProps = {
    title: string
    placeholder: string
    color: ColorStyle
    borderWidth: number
    height: number
    infoText: string
    onValueChangeValid: (value?: CompanyCLType) => void
    selectedCompany: CompanyCLType
    disable: boolean
    disableNavigation: boolean
    withoutMyCompany: boolean
    excludedCompanyIds: string[]
    onlyFakeCompany: boolean
    onlyLinkedCompany: boolean
    required: boolean
    isCompanyAlreadyExists: boolean
    hideDropdown: boolean
    onClear: () => void
    style?: ViewStyle
}

export const InputCompanyBox = (props: Partial<InputCompanyBoxProps>) => {
    const { t } = useTextTranslation()
    let {
        color,
        borderWidth,
        height,
        withoutMyCompany,
        excludedCompanyIds,
        onlyFakeCompany,
        onlyLinkedCompany,
        title,
        infoText,
        onValueChangeValid,
        placeholder,
        selectedCompany,
        disable,
        disableNavigation,
        required,
        isCompanyAlreadyExists,
        hideDropdown,
        onClear,
        style,
    } = props
    title = title ?? t('common:Title')
    color = color ?? BlueColor
    borderWidth = borderWidth ?? 2
    height = height ?? 90
    placeholder = placeholder ?? t('common:Selection')
    disable = disable ?? false
    required = required ?? false
    withoutMyCompany = withoutMyCompany ?? false
    const navigation = useNavigation<any>()
    const [valid, setValid] = useState<ValidType>('none')
    const [isFirstUpdate, setIsFirstUpdate] = useState(true)

    // 最初に会社選択ページに遷移し、会社選択後に、入力フォームへ遷移した場合にチェックマークをオンにする
    useEffect(() => {
        if (selectedCompany && isCompanyAlreadyExists) {
            setValid('good')
        }
    }, [isCompanyAlreadyExists, selectedCompany])

    // ページ・リフレッシュ時に、会社欄が空白になった場合にチェックマークをオフにする
    useEffect(() => {
        if (!selectedCompany) setValid('none')
    }, [selectedCompany])

    const _onValueChangeValid = (value: CompanyCLType) => {
        if (onValueChangeValid) {
            onValueChangeValid(value)
            setValid(value != undefined ? 'good' : 'none')
        }
    }

    const onPressCompany = (company: CompanyCLType) => {
        _onValueChangeValid(company)
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
                    <Pressable
                        onPress={() => {
                            if (disable || disableNavigation) {
                                return
                            }
                            navigation.push('SelectCompany', {
                                selectCompany: {
                                    withoutMyCompany,
                                    excludedCompanyIds,
                                    onlyFakeCompany,
                                    onlyLinkedCompany,
                                    title: `${title}${t('common:Select')}`,
                                    onPressCompany,
                                },
                            })
                        }}
                        disabled={disable}
                        style={{
                            height,
                            flex: 1,
                            justifyContent: 'space-between',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                        {selectedCompany != undefined && (
                            <CompanyCL
                                style={{
                                    flex: 1,
                                }}
                                company={selectedCompany}
                            />
                        )}
                        {selectedCompany == undefined && (
                            <Text
                                style={{
                                    color: THEME_COLORS.OTHERS.LIGHT_GRAY,
                                    fontFamily: FontStyle.regular,
                                    fontSize: 14,
                                    lineHeight: 20,
                                }}
                                numberOfLines={1}
                                ellipsizeMode="tail">
                                {placeholder}
                            </Text>
                        )}

                        {!hideDropdown && (
                            <DropdownSvg
                                style={{
                                    marginBottom: 3,
                                    marginLeft: 20,
                                }}
                                width={15}
                                height={15}
                                fill={'#C9C9C9'}
                            />
                        )}
                    </Pressable>
                    {onClear && !disable && (
                        <Pressable
                            disabled={disable}
                            onPress={() => {
                                if (onClear) {
                                    onClear()
                                }
                            }}
                            style={{
                                marginLeft: 10,
                                marginRight: -10,
                            }}>
                            <CancelSvg style={{}} width={25} height={25} fill={'#C9C9C9'} />
                        </Pressable>
                    )}
                </View>
            </InputBox>
        </View>
    )
}
