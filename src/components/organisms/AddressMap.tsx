import React, {  } from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { GlobalStyles, FontStyle } from '../../utils/Styles'
import { THEME_COLORS } from '../../utils/Constants'
import { Map } from '../atoms/Map'
import { LocationInfoType } from '../../models/_others/LocationInfoType'
import { useTextTranslation } from '../../fooks/useTextTranslation'

export const BORDER_RATIO = 0.04

export type MapDetailProps = {
    location?: LocationInfoType
    style?: ViewStyle
    isInstruction?: Boolean
}

/**
 * テキスト住所表示用の地図。
 * @param props
 * @returns
 */
export const AddressMap = React.memo((props: Partial<MapDetailProps>) => {
    const { location, style, isInstruction } = props
    const { t } = useTextTranslation()

    return (
        <View style={[{}, style]}>
            <Text
                style={{
                    fontFamily: FontStyle.regular,
                    fontSize: 12,
                    lineHeight: 14,
                    color: THEME_COLORS.OTHERS.GRAY,
                }}
            >
                {isInstruction ? t('admin:SiteAddressInstruction') : t('common:ProjectAddress')}
            </Text>
            {location?.address != undefined && (
                <Text
                    style={{
                        fontFamily: FontStyle.regular,
                        fontSize: 12,
                        lineHeight: 14,
                        marginTop: 5,
                    }}
                >
                    {location.address}
                </Text>
            )}
            {(location?.address != undefined || (location?.latitude != undefined && location?.longitude != undefined)) && (
                <Map
                    location={location}
                    mapType={'addressMap'}
                    style={{
                        marginTop: 10,
                    }}
                />
            )}
            {location?.address == undefined && (location?.latitude == undefined || location.longitude == undefined) && (
                <Text
                    style={[
                        GlobalStyles.smallText,
                        {
                            marginTop: 10,
                        },
                    ]}
                >
                    {t('common:None')}
                </Text>
            )}
        </View>
    )
})
