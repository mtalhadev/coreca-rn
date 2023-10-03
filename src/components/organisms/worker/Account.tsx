import React from 'react'
import { Text, View, ViewStyle } from 'react-native'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { THEME_COLORS } from '../../../utils/Constants'
import { ImageIcon } from '../ImageIcon'
import { FontStyle } from '../../../utils/Styles'
import { SelectableAccountType } from '../../../usecases/account/AccountSelectCase'
import { companyRoleToText } from '../../../usecases/company/CommonCompanyCase'

export type AccountProps = {
    onPress?: (item?: SelectableAccountType) => void
    selectableAccount?: SelectableAccountType
    style?: ViewStyle
}

export const Account = React.memo((props: AccountProps): React.ReactElement => {
    const { onPress, selectableAccount, style } = props
    return (
        <ShadowBox
            style={{
                padding: 0,
                marginHorizontal: 10,
                ...style,
            }}
            onPress={() => {
                if (onPress) {
                    onPress(selectableAccount)
                }
            }}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 15,
                }}>
                <ImageIcon
                    type={'company'}
                    imageUri={selectableAccount && (selectableAccount.sCompanyImageUri ?? selectableAccount?.companyImageUri)}
                    imageColorHue={selectableAccount && selectableAccount.companyImageColorHue}
                />
                <View>
                    <Text
                        style={{
                            fontFamily: FontStyle.medium,
                            fontSize: 14,
                            lineHeight: 16,
                            marginLeft: 15,
                        }}>
                        {selectableAccount && selectableAccount.companyName}
                    </Text>
                    <Text
                        style={{
                            fontFamily: FontStyle.light,
                            fontSize: 12,
                            lineHeight: 14,
                            marginLeft: 15,
                            marginTop: 5,
                        }}>
                        {companyRoleToText(selectableAccount && selectableAccount.companyRole)}
                    </Text>
                </View>
            </View>
            <View
                style={{
                    flexDirection: 'row',
                    backgroundColor: THEME_COLORS.GREEN.SUPER_LIGHT,
                    padding: 15,
                    borderBottomEndRadius: 10,
                    borderBottomStartRadius: 10,
                    alignItems: 'center',
                }}>
                <ImageIcon
                    type={'worker'}
                    imageUri={selectableAccount && (selectableAccount.sWorkerImageUri ?? selectableAccount.workerImageUri)}
                    imageColorHue={selectableAccount && selectableAccount.workerImageColorHue}
                />
                <View
                    style={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        marginLeft: 15,
                    }}>
                    <Text
                        style={{
                            fontFamily: FontStyle.regular,
                            fontSize: 13,
                            lineHeight: 16,
                        }}>
                        {selectableAccount && selectableAccount.workerName}
                    </Text>
                    <Text
                        style={{
                            fontFamily: FontStyle.light,
                            fontSize: 12,
                            lineHeight: 16,
                            marginTop: 5,
                        }}>
                        {selectableAccount && selectableAccount.email}
                    </Text>
                </View>
            </View>
        </ShadowBox>
    )
})
