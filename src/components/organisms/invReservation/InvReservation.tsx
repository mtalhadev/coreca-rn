import React, { useMemo } from 'react'
import { View, ViewStyle, Text } from 'react-native'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { InvReservationType } from '../../../models/invReservation/InvReservation'
import { compareWithToday, dayBaseText, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { THEME_COLORS } from '../../../utils/Constants'
import { GlobalStyles } from '../../../utils/Styles'
import { NewBadge } from '../../atoms/NewBadge'
import { Prefix } from '../Prefix'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { Company } from '../company/Company'

export type InvReservationProps = {
    invReservation?: InvReservationType
    type?: 'order' | 'receive'
    onPress?: () => void
    style?: ViewStyle
}

export const InvReservation = React.memo((props: Partial<InvReservationProps>) => {
    const { invReservation, onPress, type, style } = props
    const { t } = useTextTranslation()
    const startDate = useMemo(() => (invReservation?.startDate ? toCustomDateFromTotalSeconds(invReservation?.startDate) : undefined), [invReservation?.startDate])
    const endDate = useMemo(() => (invReservation?.endDate ? toCustomDateFromTotalSeconds(invReservation?.endDate) : undefined), [invReservation?.endDate])
    const extraDates = useMemo(() => (invReservation?.extraDates ? invReservation?.extraDates.map((date) => toCustomDateFromTotalSeconds(date)) : undefined), [invReservation?.extraDates])
    return (
        <ShadowBox
            style={{
                padding: 10,
                paddingTop: 5,
                ...style,
            }}
            onPress={onPress}>
            <View>
                {startDate != undefined && endDate != undefined && (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 5,
                        }}>
                        <Text style={[GlobalStyles.smallGrayText]}>
                            {dayBaseText(startDate)}〜{dayBaseText(endDate)}
                        </Text>
                        {compareWithToday(startDate).totalMilliseconds < 0 && <NewBadge />}
                    </View>
                )}
                {invReservation?.extraDates != undefined && invReservation?.extraDates.length > 0 && (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 5,
                        }}>
                        <Text style={[GlobalStyles.smallGrayText]}>{extraDates?.map((date) => dayBaseText(date))?.join(',  ')}</Text>
                    </View>
                )}
                <View
                    style={[
                        {
                            flexDirection: 'row',
                            alignItems: 'center',
                        },
                    ]}>
                    {type != undefined && (
                        <Prefix
                            style={{
                                marginRight: 10,
                            }}
                            fontSize={10}
                            fontColor={'#000'}
                            color={type == 'order' ? THEME_COLORS.OTHERS.LIGHT_PINK : THEME_COLORS.OTHERS.TIMER_SKY_BLUE}
                            text={type == 'order' ? '発注' : '受注'}
                        />
                    )}
                    <Company
                        company={type == 'order' ? invReservation?.targetCompany : invReservation?.myCompany}
                        hasLastDeal={false}
                        // iconSize?: number
                        // displayCompanyPrefix?: boolean
                        // style?: ViewStyle
                    />
                </View>
            </View>
        </ShadowBox>
    )
})
