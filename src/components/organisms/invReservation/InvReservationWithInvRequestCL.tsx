import { useNavigation } from '@react-navigation/native'
import React, { useMemo } from 'react'
import { View, ViewStyle, Text, FlatList } from 'react-native'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { InvReservationCLType } from '../../../models/invReservation/InvReservation'
import { compareWithToday, dayBaseText, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { THEME_COLORS } from '../../../utils/Constants'
import { GlobalStyles } from '../../../utils/Styles'
import { getUuidv4 } from '../../../utils/Utils'
import { NewBadge } from '../../atoms/NewBadge'
import { CompanyCL } from '../company/CompanyCL'
import { DateInvRequestArrangementCL } from '../date/DateInvRequestArrangementCL'
import { Prefix } from '../Prefix'
import { ShadowBoxWithToggle } from '../shadowBox/ShadowBoxWithToggle'

export type InvReservationProps = {
    displayType?: 'order' | 'receive'
    invReservation?: InvReservationCLType
    onPress?: () => void
    isShowLabel?: boolean
    style?: ViewStyle
}

export const InvReservationWithInvRequestCL = React.memo((props: Partial<InvReservationProps>) => {
    const { displayType, invReservation, onPress, isShowLabel, style } = props
    const { t } = useTextTranslation()
    const listKey = useMemo(() => getUuidv4(), [])

    return (
        <ShadowBoxWithToggle
            style={{
                padding: 10,
                paddingTop: 5,
                ...style,
            }}
            onPress={onPress}
            bottomChildren={
                <Text style={[GlobalStyles.smallGrayText]}>
                    {t('common:NoOfdaysOfSupport') + ' ' + (invReservation?.monthlyInvRequests?.items?.filter((iReq) => iReq.isApplication == true)?.length ?? 0) + t('common:Day')}
                </Text>
            }
            hideChildren={
                <FlatList
                    listKey={listKey}
                    data={invReservation?.monthlyInvRequests?.items?.filter((iReq) => iReq.isApplication == true) ?? []}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={() => {
                        return (
                            <View
                                style={{
                                    marginTop: 5,
                                }}>
                                <Text style={GlobalStyles.smallText}>{t('common:ThereIsNoSite')}</Text>
                            </View>
                        )
                    }}
                    renderItem={({ item, index }) => {
                        return (
                            <DateInvRequestArrangementCL
                                key={item.invRequestId ?? index.toString()}
                                style={{
                                    marginHorizontal: 5,
                                    marginTop: 8,
                                }}
                                data={item}
                                isReceive={displayType == 'receive'}
                                hasShadow={false}
                                isShowCompanyIcon={false}
                            />
                        )
                    }}
                />
            }>
            <View>
                {invReservation?.startDate != undefined && invReservation?.endDate != undefined && (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 5,
                        }}>
                        <Text style={[GlobalStyles.smallGrayText]}>
                            {dayBaseText(invReservation?.startDate)}〜{dayBaseText(invReservation?.endDate)}
                        </Text>
                        {compareWithToday(invReservation?.startDate).totalMilliseconds < 0 && <NewBadge />}
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
                        <Text style={[GlobalStyles.smallGrayText]}>{invReservation?.extraDates?.map((date) => dayBaseText(date))?.join(',  ')}</Text>
                    </View>
                )}
                <View
                    style={[
                        {
                            flexDirection: 'row',
                            alignItems: 'center',
                        },
                    ]}>
                    {displayType != undefined && isShowLabel != false && (
                        <Prefix
                            style={{
                                marginRight: 10,
                            }}
                            fontSize={10}
                            fontColor={'#000'}
                            color={displayType == 'order' ? THEME_COLORS.OTHERS.LIGHT_PINK : THEME_COLORS.OTHERS.TIMER_SKY_BLUE}
                            text={displayType == 'order' ? '発注' : '受注'}
                        />
                    )}
                    <CompanyCL company={displayType == 'order' ? invReservation?.targetCompany : invReservation?.myCompany} hasLastDeal={false} style={{ flex: 0 }} />
                    <Text
                        ellipsizeMode={'middle'}
                        numberOfLines={1}
                        style={{
                            ...GlobalStyles.smallGrayText,
                            marginLeft: 5,
                            flex: 1,
                        }}>
                        {invReservation?.project?.name}
                    </Text>
                </View>
            </View>
        </ShadowBoxWithToggle>
    )
})
