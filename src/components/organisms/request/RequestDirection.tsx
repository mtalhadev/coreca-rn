import React from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { THEME_COLORS } from '../../../utils/Constants'
import { GlobalStyles } from '../../../utils/Styles'
import { Icon } from '../../atoms/Icon'
import { CompanyCL } from '../company/CompanyCL'
import { CompanyCLType } from '../../../models/company/Company'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

export type RequestDirectionType = 'contract' | 'dispatch'
export type CompanyDirectionType = 'my-company-to-the-other' | 'other-company-to-me'

export type RequestDirectionProps = {
    type?: RequestDirectionType
    direction?: CompanyDirectionType
    company?: CompanyCLType
    style?: ViewStyle
}

export const RequestDirection = React.memo((props: Partial<RequestDirectionProps>) => {
    let { type, direction, style, company } = props

    const { t } = useTextTranslation()
    direction = direction ?? 'other-company-to-me'
    type = type ?? 'contract'

    const otherCompany = () => {
        return (
            <CompanyCL
                style={{
                    flex: 0,
                }}
                iconSize={30}
                hasLastDeal={false}
                company={company}
            />
        )
    }

    const myCompany = () => {
        return (
            <Text
                style={[
                    GlobalStyles.smallText,
                    {
                        padding: 5,
                        paddingHorizontal: 5,
                        paddingVertical: 3,
                        backgroundColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                    },
                ]}>
                {t('common:OnesCompany')}
            </Text>
        )
    }

    return (
        <View style={[{}, style]}>
            <Text style={GlobalStyles.smallGrayText}>{type == 'contract' ? t('common:Contract') : t('common:Support')}</Text>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 5,
                }}>
                {direction == 'my-company-to-the-other' && myCompany()}
                {direction == 'other-company-to-me' && otherCompany()}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginHorizontal: 10,
                    }}>
                    <Icon name={type == 'contract' ? 'project' : 'worker'} width={20} height={20} fill={THEME_COLORS.OTHERS.GRAY} />
                    <View
                        style={{
                            marginLeft: 3,
                        }}></View>
                    <Icon name={'triangle'} width={14} height={14} fill={THEME_COLORS.OTHERS.BORDER_COLOR} />
                </View>

                {direction == 'other-company-to-me' && myCompany()}
                {direction == 'my-company-to-the-other' && otherCompany()}
            </View>
        </View>
    )
})
