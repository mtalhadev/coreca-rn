import React, { useMemo } from 'react'
import { View, ViewStyle, Text, FlatList } from 'react-native'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { InvReservationType } from '../../../models/invReservation/InvReservation'
import { compareWithToday, dayBaseText, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { WINDOW_WIDTH } from '../../../utils/Constants'
import { GlobalStyles } from '../../../utils/Styles'
import { getUuidv4 } from '../../../utils/Utils'
import { NewBadge } from '../../atoms/NewBadge'
import { Company } from '../company/Company'
import { DateInvRequestArrangement } from '../date/DateInvRequestArrangement'
import { ShadowBoxWithToggle } from '../shadowBox/ShadowBoxWithToggle'
import { useSelector } from 'react-redux'
import { StoreType } from '../../../stores/Store'

export type InvReservationProps = {
    displayType?: 'order' | 'receive'
    invReservation?: InvReservationType
    onPress?: () => void
    style?: ViewStyle
}

export const InvReservationWithInvRequest = React.memo((props: Partial<InvReservationProps>) => {
    const { displayType, invReservation, onPress, style } = props
    const { t } = useTextTranslation()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)

    const listKey = useMemo(() => getUuidv4(), [])
    /**
     * (画面幅 - Workerのpaddingとmarginの合計（40） - アイコンサイズ - 編集ボタンの横幅（14） - タグの合計横幅（タグ数*45+margin） - 名前左マージン（5）)　/　当分して幅を指定するコンテンツの数
     */
    const contentsMaxWidth = (WINDOW_WIDTH - 40)/2
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
            bottomChildren={
                <Text style={[GlobalStyles.smallGrayText]}>
                    {t('common:NoOfdaysOfSupport') + ' ' + (invReservation?.monthlyInvRequests?.items?.filter((iReq) => iReq.isApplication == true)?.length ?? 0) + t('common:Day')}
                </Text>
            }
            hideChildren={
                <FlatList
                    listKey={listKey}
                    data={invReservation?.monthlyInvRequests?.items?.filter((iReq) => iReq.myCompanyId ==  myCompanyId || iReq.isApplication == true) ?? []}
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
                            <DateInvRequestArrangement
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
                    <View
                    style={{
                        maxWidth: contentsMaxWidth,
                    }}
                    >
                    <Company company={displayType == 'order' ? invReservation?.targetCompany : invReservation?.myCompany} hasLastDeal={false} style={{maxWidth: contentsMaxWidth,}}/>
                    </View>
                    <Text
                        ellipsizeMode={'middle'}
                        numberOfLines={1}
                        style={{
                            ...GlobalStyles.smallGrayText,
                            marginLeft: 5,
                            maxWidth: contentsMaxWidth,
                        }}>
                        {invReservation?.project?.name}
                    </Text>
                </View>
            </View>
        </ShadowBoxWithToggle>
    )
})
