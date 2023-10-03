import React, { useState } from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { FontStyle, GlobalStyles } from '../../utils/Styles'
import { THEME_COLORS } from '../../utils/Constants'
import { TextInput } from 'react-native-gesture-handler'
import { AppButton } from '../atoms/AppButton'
import * as Clipboard from 'expo-clipboard'
import { InputTextBox } from './inputBox/InputTextBox'
import { useDispatch } from 'react-redux'
import { setToastMessage } from '../../stores/UtilSlice'
import { useTextTranslation } from '../../fooks/useTextTranslation'

export type InviteUrlProps = {
    invitationUrl: string
    guidance: string
    hasButtonMargin: boolean
    onPortChanged?: (port: string|undefined) => void
    style?: ViewStyle
}

export const InviteUrl = (props: Partial<InviteUrlProps>) => {
    const { invitationUrl, guidance, hasButtonMargin, onPortChanged, style } = props
    const [metroPort, setMetroPort] = useState('')
    const dispatch = useDispatch()
    const { t } = useTextTranslation()

    return (
        <View style={style}>
            <View
                style={{
                    flexDirection: 'column',
                }}
            >
                <Text
                    style={{
                        marginLeft: 20,
                        fontFamily: FontStyle.regular,
                        color: '#000',
                        fontSize: 14,
                        lineHeight: 17,
                    }}
                >
                    {t('common:InvitationUrl')}
                </Text>
                <View
                    style={{
                        height: 50,
                        marginTop: 5,
                        borderColor: THEME_COLORS.OTHERS.GRAY,
                        borderTopWidth: 2,
                        borderBottomWidth: 2,
                        marginHorizontal: -2,
                        paddingHorizontal: 20,
                        justifyContent: 'center',
                        backgroundColor: '#fff',
                    }}
                >
                    <TextInput
                        style={[
                            GlobalStyles.normalText,
                            {
                                color: THEME_COLORS.OTHERS.LINK_BLUE,
                            },
                            { paddingTop: 3 },
                        ]}
                        editable={false}
                        value={invitationUrl}
                    />
                </View>

                {__DEV__ && (
                <InputTextBox
                    title='metro Port'
                    onValueChangeValid={(value) => {
                        if (onPortChanged) {
                            onPortChanged(value)
                        }
                        setMetroPort(value ?? '')
                    }}
                    value={metroPort}
                    placeholder={'Input metro port (8081)'}
                    style={{marginTop:20}}
                />
                )}

            </View>

            <AppButton
                style={{
                    marginTop: 20,
                    marginHorizontal: hasButtonMargin ? 20 : 0,
                    marginBottom: 15,
                }}
                title={t('common:CopyInvitationUrl')}
                onPress={async () => {
                    await Clipboard.setStringAsync(invitationUrl as string)
                    dispatch(
                        setToastMessage({
                            text: t('common:InvitationUrlCopied'),
                            type: 'success',
                        }),
                    )
                }}
            />
            {guidance != undefined && (
                <Text
                    style={[
                        GlobalStyles.smallGrayText,
                        {
                            alignSelf: 'center',
                        },
                    ]}
                >
                    {guidance ?? ''}
                </Text>
            )}
        </View>
    )
}
