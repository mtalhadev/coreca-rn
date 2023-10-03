/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react'
import { Text, Pressable, View, ViewStyle } from 'react-native'
import { BlueColor, ColorStyle, FontStyle } from '../../../utils/Styles'
import { THEME_COLORS } from '../../../utils/Constants'
import { useNavigation } from '@react-navigation/core'
import DropdownSvg from './../../../../assets/images/dropdown.svg'
import { InputBox, ValidType } from '../../atoms/InputBox'
import { ConstructionHeaderCL } from '../construction/ConstructionHeaderCL'
import { CustomDate } from '../../../models/_others/CustomDate'
import { ConstructionCLType } from '../../../models/construction/Construction'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
// const { t } = useTextTranslation()
export type InputConstructionBoxProps = {
    title: string
    placeholder: string
    color: ColorStyle
    borderWidth: number
    height: number
    infoText: string
    onValueChangeValid: (value?: ConstructionCLType) => void
    selectedConstruction: ConstructionCLType
    targetDate: CustomDate
    targetMonth?: CustomDate
    disable: boolean
    required: boolean
    style?: ViewStyle
}

export const InputConstructionBox = (props: Partial<InputConstructionBoxProps>) => {
    const { t } = useTextTranslation()
    let { color, borderWidth, height, title, infoText, targetMonth, onValueChangeValid, placeholder, selectedConstruction, targetDate, disable, required, style } = props
    title = title ?? t('common:Title')
    color = color ?? BlueColor
    borderWidth = borderWidth ?? 2
    height = height ?? 90
    placeholder = placeholder ?? t('common:Selection')
    disable = disable ?? false
    required = required ?? false
    const navigation = useNavigation<any>()
    const [valid, setValid] = useState<ValidType>('none')

    //  現場作成時：トップページでタップした日付に紐付けて既存の工事に現場を追加する場合にチェックマークをオンにする
    useEffect(() => {
        if (valid === 'none' && selectedConstruction) {
            setValid('good')
        }
    }, [selectedConstruction])

    const _onValueChangeValid = (value: ConstructionCLType) => {
        if (onValueChangeValid) {
            onValueChangeValid(value)
            setValid(value != undefined ? 'good' : 'none')
        }
    }

    const onPressConstruction = (value: ConstructionCLType) => {
        _onValueChangeValid(value)
        navigation.goBack()
    }

    return (
        <View style={[style]}>
            <InputBox valid={valid} height={height} borderWidth={borderWidth} color={color} title={title} disable={disable} required={required} infoText={infoText}>
                <Pressable
                    onPress={() => {
                        if (disable) {
                            return
                        }
                        navigation.push('SelectConstruction', {
                            selectConstruction: {
                                title: `${title}${t('common:Select')}`,
                                targetDate: targetDate,
                                targetMonth: targetMonth,
                                onPressConstruction,
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
                    {selectedConstruction != undefined && (
                        <ConstructionHeaderCL
                            style={{
                                flex: 1,
                            }}
                            {...selectedConstruction}
                            project={selectedConstruction.project}
                        />
                    )}
                    {selectedConstruction == undefined && (
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

                    <DropdownSvg
                        style={{
                            marginBottom: 3,
                            marginLeft: 20,
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
