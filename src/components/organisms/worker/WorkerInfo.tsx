import React from 'react'
import { Text, Pressable, View, ViewStyle, Linking } from 'react-native'

import { FontStyle } from '../../../utils/Styles'

import { Icon } from '../../atoms/Icon'
import { THEME_COLORS } from '../../../utils/Constants'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

export type WorkerInfoType = {
    phoneNumber: string
    email: string
}

export type WorkerInfoProps = WorkerInfoType & {
    style?: ViewStyle
}

export const WorkerInfo = React.memo((props: Partial<WorkerInfoProps>) => {
    const { phoneNumber, email, style } = props
    const { t } = useTextTranslation()

    return (
        <View style={[{}, style]}>
            <Pressable
                onPress={() => {
                    if (phoneNumber) {
                        Linking.openURL(`tel:${phoneNumber}`)
                    }
                }}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 10,
                }}>
                <Icon name={'phone'} width={16} height={16} />
                <Text
                    style={{
                        fontFamily: FontStyle.regular,
                        fontSize: 12,
                        lineHeight: 14,
                        marginLeft: 5,
                        color: phoneNumber ? THEME_COLORS.OTHERS.LINK_BLUE : THEME_COLORS.OTHERS.LIGHT_GRAY,
                    }}>
                    {phoneNumber ?? t('common:None')}
                </Text>
            </Pressable>

            <Pressable
                onPress={() => {
                    if (email) {
                        Linking.openURL(`mailto:${email}`)
                    }
                }}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 10,
                }}>
                <Icon name={'email'} width={15} height={15} />
                <Text
                    style={{
                        fontFamily: FontStyle.regular,
                        fontSize: 12,
                        lineHeight: 14,
                        marginLeft: 5,
                        color: email ? THEME_COLORS.OTHERS.LINK_BLUE : THEME_COLORS.OTHERS.LIGHT_GRAY,
                    }}>
                    {email ?? t('common:None')}
                </Text>
            </Pressable>
        </View>
    )
})
