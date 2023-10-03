import React from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { FontStyle } from '../../../utils/Styles'
import { THEME_COLORS } from '../../../utils/Constants'
import { IconParam } from '../IconParam'
import { Line } from '../../atoms/Line'
import { SiteCLType } from '../../../models/site/Site'
import { timeBaseText, timeText } from '../../../models/_others/CustomDate'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

export type SiteInvoiceUIType = SiteCLType & {
    fromMyCompanyNum: number
}

export type SiteHeaderProps = {
    site?: SiteInvoiceUIType
    style?: ViewStyle
}

export const SiteInvoice = React.memo((props: Partial<SiteHeaderProps>) => {
    const { site, style } = props
    const { t } = useTextTranslation()

    return (
        <View
            style={[
                {
                    borderWidth: 1,
                    borderRadius: 7,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                },
                style,
            ]}>
            <View style={{ marginTop: 10, marginHorizontal: 10 }}>
                <Text style={{ color: THEME_COLORS.OTHERS.GRAY, fontSize: 12, lineHeight: 20 }}>
                    {site?.startDate ? timeBaseText(site?.startDate) : t('common:Undecided')}〜{site?.endDate ? timeText(site?.endDate) : t('common:Undecided')}
                </Text>
                <Text style={{ color: '#000', fontFamily: FontStyle.bold, fontSize: 16, lineHeight: 30 }}>{site?.construction?.displayName}</Text>
                <Line />
                <IconParam paramName={t('common:FromOurCompany')} iconName="attend-worker" count={site?.fromMyCompanyNum} suffix={t('common:Name')} />
            </View>
        </View>
    )
})
