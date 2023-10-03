import React from 'react'
import { Text, Pressable, View, ViewStyle } from 'react-native'

import { THEME_COLORS } from '../../../utils/Constants'
import { GlobalStyles } from '../../../utils/Styles'
import { Icon } from '../../atoms/Icon'
import { useComponentSize } from '../../../utils/Utils'
import { useNavigation } from '@react-navigation/native'
import { CompanyType } from '../../../models/company/Company'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

export type FilterCompanyProps = {
    company: CompanyType
    onChange: (company?: CompanyType) => void
    title: string
    style?: ViewStyle
}

export const FilterCompany = React.memo((props: Partial<FilterCompanyProps>) => {
    const { t } = useTextTranslation()
    let { onChange, title, company, style } = props
    title = title ?? t('common:FilterESPCamera')
    const navigation = useNavigation<any>()
    const [size, onLayout] = useComponentSize()

    const onPressCompany = (company: CompanyType) => {
        if (onChange) {
            onChange(company)
        }
    }

    return (
        <Pressable
            style={[
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 5,
                    borderBottomWidth: 1,
                    paddingHorizontal: 5,
                    borderColor: THEME_COLORS.OTHERS.GRAY,
                    flex: 1,
                },
                style,
            ]}
            onPress={() => {
                navigation.push('SelectCompany', {
                    selectCompany: {
                        title: t('common:SelectACompanyToFilter'),
                        withoutMyCompany: true,
                        onlyFakeCompany: false,
                        onPressCompany,
                    },
                })
            }}
            onLayout={onLayout}
        >
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <Icon name={'filter'} width={16} height={16} fill={company != undefined ? THEME_COLORS.OTHERS.LINK_BLUE : THEME_COLORS.OTHERS.BORDER_COLOR} />
                <Text
                    ellipsizeMode={'middle'}
                    numberOfLines={1}
                    style={{
                        maxWidth: size?.width ? size.width - 30 : undefined,
                        marginLeft: 5,
                    }}
                >
                    {company != undefined && (
                        <Text
                            style={[
                                GlobalStyles.smallText,
                                {
                                    marginLeft: 5,
                                },
                            ]}
                        >
                            {company?.name}
                        </Text>
                    )}
                    {company == undefined && (
                        <Text
                            numberOfLines={1}
                            ellipsizeMode={'tail'}
                            style={[
                                GlobalStyles.smallGrayText,
                                {
                                    marginLeft: 5,
                                },
                            ]}
                        >
                            {title}
                        </Text>
                    )}
                </Text>
            </View>

            {company != undefined && (
                <Pressable
                    style={{
                        padding: 2,
                        paddingLeft: 10,
                    }}
                    onPress={() => {
                        if (onChange) {
                            onChange(undefined)
                        }
                    }}
                >
                    <Icon name={'close'} width={12} height={12} fill={THEME_COLORS.OTHERS.GRAY} />
                </Pressable>
            )}
        </Pressable>
    )
})
