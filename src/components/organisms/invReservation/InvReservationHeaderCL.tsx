import React from 'react'
import { View, Text, ViewStyle } from 'react-native'
import { InvReservationCLType } from '../../../models/invReservation/InvReservation'
import { dayBaseText } from '../../../models/_others/CustomDate'
import { GlobalStyles } from '../../../utils/Styles'
import { useComponentSize, isNoValueObject } from '../../../utils/Utils'
import { SiteMeter } from '../site/SiteMeter'

export type InvReservationHeaderCLProps = {
    batchSize?: number
    style?: ViewStyle
    invReservation?: InvReservationCLType
    presentCount?: number
    isDisplayMeter?: boolean
}

export const InvReservationHeaderCL = React.memo((props: Partial<InvReservationHeaderCLProps>) => {
    let { invReservation, style, batchSize, presentCount, isDisplayMeter } = props
    const [size, onLayout] = useComponentSize()
    batchSize = batchSize ?? 18
    return (
        <>
            {!isNoValueObject(invReservation) && invReservation != undefined && (
                <View onLayout={onLayout} style={[{}, style]}>
                    <View style={{}}>
                        {/* <Text
                                style={[
                                    {
                                        fontFamily: FontStyle.black,
                                        fontSize: 22,
                                        lineHeight: 26,
                                        marginRight: 5,
                                    },
                                    titleStyle,
                                ]}>
                                {site?.meetingDate ? dayBaseText(site?.meetingDate) : t('common:Undecided')}
                            </Text> */}
                        {invReservation?.startDate != undefined && invReservation?.endDate != undefined && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 5,
                                }}>
                                <Text style={[GlobalStyles.smallGrayText]}>
                                    {dayBaseText(invReservation?.startDate)}〜{dayBaseText(invReservation.endDate)}
                                </Text>
                            </View>
                        )}
                        {invReservation?.extraDates != undefined && invReservation?.extraDates.length > 0 && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    marginBottom: 5,
                                }}>
                                <Text style={[GlobalStyles.smallGrayText]}>{invReservation.extraDates?.map((date) => dayBaseText(date))?.join(',  ')}</Text>
                            </View>
                        )}
                    </View>
                    {isDisplayMeter && <SiteMeter presentCount={presentCount ?? 0} requiredCount={invReservation?.initialWorkerCount} style={{ marginTop: 5 }} />}
                </View>
            )}
        </>
    )
})
