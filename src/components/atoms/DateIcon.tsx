/* eslint-disable prefer-const */
import React, { useMemo } from 'react'
import { Text, View, ViewStyle, StyleSheet } from 'react-native'

import { FontStyle } from '../../utils/Styles'
import { THEME_COLORS } from '../../utils/Constants'
import { CustomDate, isHoliday, isToday, newCustomDate } from "../../models/_others/CustomDate"
import { useSelector } from 'react-redux'
import { StoreType } from '../../stores/Store'
import { useTextTranslation } from '../../fooks/useTextTranslation'
// import DatePicker from 'react-native-date-picker'
export type DateIconProps = {
    date?: CustomDate
    style?: ViewStyle
}

export const DateIcon = React.memo((props: DateIconProps) => {
    const { t } = useTextTranslation()
    let { date, style } = props
    date = date ?? newCustomDate()

    const holidays = useSelector((state: StoreType) => state.util.holidays)
    const isSaturday = date.dayOfWeekText == '土'
    // 2022.07 okuda - KVSキャッシュ導入に伴い、メソッドを持たないキャッシュデータに対応させるためCustomDateを再生成
    // const nationalHoliday = isHoliday(date, holidays)
    const nationalHoliday = useMemo(() => (date && holidays) ? isHoliday(date, holidays) : false, [date, holidays])
    const __isHoliday = date.dayOfWeekText == '日' || nationalHoliday

    const __isToday = useMemo(() => date ? isToday(date) : false, [date])

    const textColor = __isHoliday ? THEME_COLORS.OTHERS.ALERT_RED : isSaturday ? THEME_COLORS.BLUE.MIDDLE : '#000'

    return (
        <View
            style={[
                {
                    flexDirection: 'row',
                },
                style,
            ]}
        >
            {__isToday && (
                <View
                    style={{
                        backgroundColor: textColor,
                        marginRight: 5,
                        padding: 4,
                        height: 20,
                        marginLeft: -5,
                        // marginTop: -20,
                        borderRadius: 10,
                        alignSelf: 'center',
                    }}
                >
                    <Text
                        style={{
                            fontSize: 9,
                            fontFamily: FontStyle.bold,
                            lineHeight: 11,
                            color: '#fff',
                        }}
                    >
                        {t('common:Today')}
                    </Text>
                </View>
            )}
            <View
                style={{
                    flexDirection: 'column',
                }}
            >
                <View
                    style={{
                        flexDirection: 'row',
                    }}
                >
                    <Text
                        style={{
                            fontSize: 12,
                            fontFamily: FontStyle.regular,
                            lineHeight: 14,
                            textAlignVertical: 'top',
                            color: textColor,
                        }}
                    >
                        {`${date.month}/ `}
                    </Text>
                    <Text
                        style={{
                            fontSize: 20,
                            fontFamily: FontStyle.bold,
                            color: textColor,
                            lineHeight: 22,
                        }}
                    >
                        {date.day}
                    </Text>
                    <Text
                        style={{
                            fontSize: 10,
                            fontFamily: FontStyle.regular,
                            lineHeight: 22,
                            marginLeft: 2,
                            color: textColor,
                        }}
                    >
                        {`(${date.dayOfWeekText})`}
                    </Text>
                </View>
                {nationalHoliday && (
                    <Text
                        style={{
                            fontSize: 8,
                            fontFamily: FontStyle.regular,
                            lineHeight: 9,
                            color: textColor,
                        }}
                    >
                        {nationalHoliday}
                    </Text>
                )}
            </View>
        </View>
    )
})

const styles = StyleSheet.create({})

