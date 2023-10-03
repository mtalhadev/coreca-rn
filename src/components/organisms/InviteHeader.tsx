import React, { useState, useRef, useEffect } from 'react'
import { Text, Pressable, View, Image, ViewStyle, Linking } from 'react-native'

import { FontStyle, ColorStyle } from '../../utils/Styles'
import { THEME_COLORS, WINDOW_WIDTH } from '../../utils/Constants'
import CreateCompanyImage from './../../../assets/images/createCompany.svg'
import { TextInput } from 'react-native-gesture-handler'
import { InviteUrl } from './InviteUrl'
import { AppButton } from '../atoms/AppButton'
import { useTextTranslation } from '../../fooks/useTextTranslation'

export type InviteHeaderProps = {
    invitationUrl: string
    guidance: string
    onPortChanged?: (port: string|undefined) => void
    style?: ViewStyle
}

export const InviteHeader = React.memo((props: Partial<InviteHeaderProps>) => {
    const { invitationUrl, guidance, onPortChanged, style } = props
    const { t } = useTextTranslation()

    return (
        <View style={style}>
            <View
                style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',

                    marginTop: 30,
                }}
            >
                <View style={{ marginLeft: 20, flexDirection: 'column' }}>
                    <View style={{ flexDirection: 'row' }}>
                        <Text
                            style={{
                                fontFamily: FontStyle.medium,
                                color: '#000',
                                fontSize: 14,
                                lineHeight: 17,
                            }}
                        >
                            {t('common:TheMoreFriendsYouHaveTheBetter')}
                        </Text>
                        <Text
                            style={{
                                fontFamily: FontStyle.bold,
                                color: THEME_COLORS.BLUE.MIDDLE,
                                fontSize: 14,
                                lineHeight: 17,
                            }}
                        >
                            {t('common:DiligentManagement')}
                        </Text>
                        <Text
                            style={{
                                fontFamily: FontStyle.medium,
                                color: '#000',
                                fontSize: 14,
                                lineHeight: 17,
                            }}
                        >
                            {t('common:Is')}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row' }}>
                        <Text
                            style={{
                                fontFamily: FontStyle.medium,
                                fontSize: 14,
                                lineHeight: 20,
                            }}
                        >
                            {t('common:More')}
                            <Text
                                style={{
                                    fontFamily: FontStyle.bold,
                                    fontSize: 14,
                                }}
                            >
                                {t('common:Raku')}
                            </Text>
                            {t('common:WillBe')}
                        </Text>
                        <View
                            style={{
                                width: 32,
                                height: 8,
                                backgroundColor: THEME_COLORS.GREEN.MIDDLE,
                                left: -120,
                                marginTop: 12,
                                zIndex: -1,
                            }}
                        ></View>
                    </View>
                </View>
                <View>
                    <CreateCompanyImage />
                </View>
            </View>

            <InviteUrl 
                invitationUrl={invitationUrl} 
                guidance={guidance} 
                onPortChanged={(port) => {
                    if (onPortChanged){
                        onPortChanged(port)
                    }
                }}
                style={{ marginTop: 30, marginHorizontal: 10 }} />
        </View>
    )
})
