import { useNavigation } from '@react-navigation/native'
import React, { useMemo } from 'react'
import { View, ViewStyle, Text, FlatList } from 'react-native'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { InvReservationType } from '../../../models/invReservation/InvReservation'
import { compareWithToday, dayBaseText, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { InvReservationToUniqSites } from '../../../usecases/site/SiteListCase'
import { GlobalStyles } from '../../../utils/Styles'
import { getUuidv4 } from '../../../utils/Utils'
import { NewBadge } from '../../atoms/NewBadge'
import { Company } from '../company/Company'
import { DateArrangement } from '../date/DateArrangement'
import { ShadowBoxWithToggle } from '../shadowBox/ShadowBoxWithToggle'

export type InvReservationProps = {
    invReservation?: InvReservationType
    type?: 'order' | 'receive'
    onPress?: () => void
    hasShadow?: boolean
    style?: ViewStyle
}

export const InvReservationWithSite = React.memo((props: Partial<InvReservationProps>) => {
    const { invReservation, onPress, type, hasShadow, style } = props
    const _hasShadow = hasShadow ?? true
    const { t } = useTextTranslation()
    const listKey = useMemo(() => getUuidv4(), [])
    const navigation = useNavigation<any>()

    const data = InvReservationToUniqSites(invReservation)
    const sortedData = [...data].sort((a: any, b: any) => a.site.meetingDate - b.site.meetingDate)

    const startDate = useMemo(() => (invReservation?.startDate ? toCustomDateFromTotalSeconds(invReservation?.startDate) : undefined), [invReservation?.startDate])
    const endDate = useMemo(() => (invReservation?.endDate ? toCustomDateFromTotalSeconds(invReservation?.endDate) : undefined), [invReservation?.endDate])
    const extraDates = useMemo(() => (invReservation?.extraDates ? invReservation?.extraDates.map((date) => toCustomDateFromTotalSeconds(date)) : undefined), [invReservation?.extraDates])
    return (
        <ShadowBoxWithToggle
            style={{
                padding: 10,
                paddingTop: 5,
                ...style,
            }}
            onPress={onPress}
            bottomChildren={<Text style={[GlobalStyles.smallGrayText]}>{t('admin:NumberOfSitesArranged') + ' ' + data?.length ?? 0}</Text>}
            hideChildren={
                <FlatList
                    listKey={listKey}
                    data={sortedData}
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
                            <DateArrangement
                                key={item.site.siteId ?? index.toString()}
                                style={{
                                    marginHorizontal: 5,
                                    marginTop: 8,
                                }}
                                data={item.site}
                                onPress={() => {
                                    navigation.push('InvRequestDetail', {
                                        invRequestId: item.invRequestId,
                                        type: type,
                                    })
                                }}
                                displayDay={true}
                                displayWorker={true}
                                hasShadow={_hasShadow}
                            />
                        )
                    }}
                />
            }>
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
                {extraDates != undefined && extraDates.length > 0 && (
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
                    {/* 受注タブに発注が表示されてややこしいので非表示 */}
                    {/* {type != undefined && (
                          <Prefix
                            style={{
                                marginRight: 10
                            }}
                            fontSize={10}
                            fontColor={'#000'}
                            color={type == 'order' ? THEME_COLORS.OTHERS.LIGHT_PINK : THEME_COLORS.OTHERS.TIMER_SKY_BLUE}
                            text={type == 'order' ? '発注' : '受注'}
                        />
                    )} */}
                    <Company company={type == 'order' ? invReservation?.targetCompany : invReservation?.myCompany} hasLastDeal={false} />
                </View>
            </View>
        </ShadowBoxWithToggle>
    )
})
