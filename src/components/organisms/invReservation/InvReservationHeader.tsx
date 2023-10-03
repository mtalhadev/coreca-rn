import React, { useMemo } from 'react'
import { View, Text, ViewStyle } from 'react-native'
import { InvReservationType } from '../../../models/invReservation/InvReservation'
import { dayBaseText, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { GlobalStyles } from '../../../utils/Styles'
import { useComponentSize, isNoValueObject } from '../../../utils/Utils'
import { SiteMeter } from '../site/SiteMeter'

export type InvReservationHeaderProps = {
    batchSize?: number
    style?: ViewStyle
    invReservation?: InvReservationType
    presentCount?: number
    isDisplayMeter?: boolean
}

export const InvReservationHeader = React.memo((props: Partial<InvReservationHeaderProps>) => {
    let { invReservation, style, batchSize, presentCount, isDisplayMeter } = props
    const [size, onLayout] = useComponentSize()
    batchSize = batchSize ?? 18

    const __startDate = useMemo(() => (invReservation?.startDate ? toCustomDateFromTotalSeconds(invReservation.startDate) : undefined), [invReservation?.startDate])
    const __endDate = useMemo(() => (invReservation?.endDate ? toCustomDateFromTotalSeconds(invReservation.endDate) : undefined), [invReservation?.endDate])
    const __extraDates = useMemo(() => (invReservation?.extraDates ? invReservation?.extraDates.map((date) => toCustomDateFromTotalSeconds(date)) : undefined), [invReservation?.extraDates])

    return (
        <>
            {!isNoValueObject(invReservation) && invReservation != undefined && (
                <View onLayout={onLayout} style={[{}, style]}>
                    <View>
                        {__startDate != undefined && __endDate != undefined && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 5,
                                }}>
                                <Text style={[GlobalStyles.smallGrayText]}>
                                    {dayBaseText(__startDate)}〜{dayBaseText(__endDate)}
                                </Text>
                            </View>
                        )}
                        {__extraDates != undefined && __extraDates.length > 0 && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    marginBottom: 5,
                                }}>
                                <Text style={[GlobalStyles.smallGrayText]}>{__extraDates?.map((date) => dayBaseText(date))?.join(',  ')}</Text>
                            </View>
                        )}
                    </View>
                    {isDisplayMeter && <SiteMeter presentCount={presentCount ?? 0} requiredCount={invReservation?.initialWorkerCount} style={{ marginTop: 5 }} />}
                </View>
            )}
        </>
    )
})
