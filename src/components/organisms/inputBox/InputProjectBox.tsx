/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react'
import { Text, Pressable, View, ViewStyle } from 'react-native'
import { BlueColor, ColorStyle, FontStyle } from '../../../utils/Styles'
import { THEME_COLORS } from '../../../utils/Constants'
import { useNavigation } from '@react-navigation/core'
import DropdownSvg from './../../../../assets/images/dropdown.svg'
import { InputBox, ValidType } from '../../atoms/InputBox'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { ProjectType } from '../../../models/project/Project'
import { ContractingProjectPrefix } from '../contract/ContractingProjectPrefix'
import { CustomDate } from '../../../models/_others/CustomDate'

export type InputProjectBoxProps = {
    title: string
    placeholder: string
    color: ColorStyle
    borderWidth: number
    height: number
    infoText: string
    onValueChangeValid: (project?: ProjectType) => void
    selectedProject: ProjectType
    targetDate: CustomDate
    targetMonth?: CustomDate
    disable: boolean
    required: boolean
    hideDropdown: boolean
    style?: ViewStyle
}

export const InputProjectBox = (props: Partial<InputProjectBoxProps>) => {
    const { t } = useTextTranslation()
    let { color, borderWidth, height, title, infoText, onValueChangeValid, placeholder, selectedProject, targetDate, disable, required, hideDropdown, style } = props
    title = title ?? t('common:Title')
    color = color ?? BlueColor
    borderWidth = borderWidth ?? 2
    height = height ?? 90
    placeholder = placeholder ?? t('common:Selection')
    disable = disable ?? false
    required = required ?? false
    const navigation = useNavigation<any>()
    const [valid, setValid] = useState<ValidType>('none')

    useEffect(() => {
        if (valid === 'none' && selectedProject) {
            setValid('good')
        }
    }, [selectedProject])

    const _onValueChangeValid = (value: ProjectType) => {
        if (onValueChangeValid) {
            onValueChangeValid(value)
            setValid(value != undefined ? 'good' : 'none')
        }
    }

    const onPressProject = (value: ProjectType) => {
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
                        navigation.push('ConstructionList', {
                            targetDate,
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
                    {selectedProject != undefined && <ContractingProjectPrefix contractingProject={selectedProject} />}
                    {selectedProject == undefined && (
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
            </InputBox>
        </View>
    )
}
