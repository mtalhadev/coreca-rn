import { useNavigation } from '@react-navigation/native'
import React, { useCallback } from 'react'
import { View, Text, ScrollView, Pressable, ViewStyle } from 'react-native'
import { match } from 'ts-pattern'
import { SiteType } from '../../../models/site/Site'
import { THEME_COLORS } from '../../../utils/Constants'
import { CustomDate, dayBaseText, monthBaseText, newCustomDate } from '../../../models/_others/CustomDate'
import { FontStyle, GlobalStyles } from '../../../utils/Styles'
import { HomeCalendarSites } from './HomeCalendarSites'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { Icon } from '../../atoms/Icon'
// const { t } = useTextTranslation()
/**
 * @param date - 日付
 * @param selectMonth - 表示されている月（dateの月==selectMonthとは限らない。）
 * @param sites - 表示する現場一覧（construction.projectが必要）
 * @param isTopDay - スケジュールにおいて一番上の日付かどうか（UIのため）
 * @param isLeftDay - スケジュールにおいて一番左の日付かどうか（UIのため）
 * @param isBottomDay - スケジュールにおいて一番下の日付かどうか（UIのため）
 * @param onTapWeek - 拡張するときに使用。拡張前なら拡張。拡張済みなら元に戻るよう-1を返す。
 */
type HomeCalendarDayProps = {
    date: CustomDate
    selectMonth: CustomDate
    isTappedWeek?: boolean
    sites: SiteType[]
    preDateConstructionIds?: string[]
    style?: ViewStyle
    isTopDay?: boolean
    isLeftDay?: boolean
    isBottomDay?: boolean
    isHoliday?: boolean
    weekNumber?: number
    expandingWeekNumber?: number
    onTapWeek?: (weekNumber?: number) => void
    onTapDay?: (date?: CustomDate) => void
    useSmartDisplay?: boolean
    useOnlyNewSiteDisplay?: boolean
}

const NORMAL_OPACITY = 1
const LOW_OPACITY = 0.3

const SUNDAY_NUMBER = 0
const SATURDAY_NUMBER = 6

/**
 *
 * @param date 日付指定。ここから曜日を取り出す。
 * @param dayOfWeek 曜日直接指定
 * @returns 曜日に合った色を返す。
 */
export const getDateColor = (date?: CustomDate, dayOfWeek?: number, isHoliday?: boolean) => {
    if (isHoliday) {
        return 'red'
    }
    return match(dayOfWeek ?? date?.dayOfWeek)
        .with(SUNDAY_NUMBER, () => 'red')
        .with(SATURDAY_NUMBER, () => 'blue')
        .otherwise(() => 'black')
}

/**
 * @param date
 * @param selectMonth
 * @returns 表示されている月の日付かどうか。違う場合薄く表示する。
 */
export const getDateOpacity = (date: CustomDate, selectMonth: CustomDate) => {
    return monthBaseText(date) === monthBaseText(selectMonth) ? NORMAL_OPACITY : LOW_OPACITY
}

/**
 * @remarks スケジュールの日付を定義。
 * @param props
 * @returns
 */
export const HomeCalendarDay = React.memo((props: HomeCalendarDayProps) => {
    const {
        date,
        selectMonth,
        useOnlyNewSiteDisplay,
        useSmartDisplay,
        preDateConstructionIds,
        expandingWeekNumber,
        isLeftDay,
        isHoliday,
        weekNumber,
        onTapWeek,
        isTappedWeek,
        onTapDay,
        isTopDay,
        isBottomDay,
        sites,
        style,
    } = props

    const navigation = useNavigation<any>()
    const today = newCustomDate()
    const { t } = useTextTranslation()
    const __dayHeader = useCallback(() => {
        return (
            <View
                // onPress={() => {
                //     navigation.push('DateRouter', {
                //         date: date,
                //     })
                // }}
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    paddingBottom: 5,
                }}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                    <View
                        style={{
                            alignItems: 'center',
                            alignSelf: 'center',
                            justifyContent: 'center',
                            marginLeft: 5,
                            marginTop: 5,
                        }}>
                        {dayBaseText(today) === dayBaseText(date) && (
                            <View
                                style={{
                                    backgroundColor: getDateColor(date, undefined, isHoliday),
                                    padding: 10,
                                    borderRadius: 10,
                                    position: 'absolute',
                                }}></View>
                        )}
                        <Text
                            style={{
                                ...GlobalStyles.smallGrayText,
                                color: getDateColor(date, undefined, isHoliday),
                                ...(dayBaseText(today) === dayBaseText(date)
                                    ? {
                                          color: '#fff',
                                          fontFamily: FontStyle.bold,
                                      }
                                    : {}),
                            }}>
                            {date.day}
                        </Text>
                    </View>
                    {isHoliday && (
                        <Text
                            style={{
                                ...GlobalStyles.smallText,
                                fontSize: 7,
                                color: getDateColor(date, undefined, isHoliday),
                                ...(dayBaseText(today) === dayBaseText(date)
                                    ? {
                                          marginLeft: 7,
                                      }
                                    : {}),
                                marginTop: 4,
                                marginLeft: 1,
                            }}>
                            (祝)
                        </Text>
                    )}
                </View>

                {sites.length > 0 && (
                    <Text
                        style={{
                            ...GlobalStyles.smallGrayText,
                            fontSize: 10,
                            lineHeight: 12,
                            marginRight: 2,
                            color: THEME_COLORS.OTHERS.GRAY,
                            fontFamily: FontStyle.regular,
                        }}>
                        {sites.length}
                        <Text style={{ fontSize: 8 }}>{t('common:TheAforeSaid')}</Text>
                    </Text>
                )}
            </View>
        )
    }, [today, date, sites])

    return (
        <Pressable
            style={{
                backgroundColor: '#fff',
                borderWidth: 1,
                borderLeftWidth: isLeftDay ? 1 : 0,
                borderBottomWidth: isBottomDay ? 1 : 0,
                borderColor: THEME_COLORS.OTHERS.SUPER_LIGHT_GRAY,
                borderTopColor: isTopDay ? THEME_COLORS.OTHERS.BORDER_COLOR : THEME_COLORS.OTHERS.SUPER_LIGHT_GRAY,
                ...style,
            }}
            onPress={() => {
                /**
                 * まだ拡張してない場合はonTapWeekを発動。
                 */
                if (expandingWeekNumber != undefined && onTapWeek != undefined && weekNumber != undefined) {
                    if (expandingWeekNumber != weekNumber) {
                        onTapWeek(weekNumber)

                        return
                    }
                    //  else {
                    //     /**
                    //      * すでに拡張している場合は元に戻す。
                    //      */
                    //     onTapWeek(-1)
                    //     return
                    // }
                }
                navigation.push('DateRouter', {
                    date: date,
                })
            }}>
            <View
                style={{
                    opacity: getDateOpacity(date, selectMonth),
                    flex: 1,
                }}>
                {__dayHeader()}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    style={{
                        flex: 1,
                    }}>
                    <HomeCalendarSites useOnlyNewSiteDisplay={useOnlyNewSiteDisplay} preDateConstructionIds={preDateConstructionIds} useSmartDisplay={useSmartDisplay} sites={sites} date={date} />
                </ScrollView>
                {isTappedWeek === true && (
                    <Pressable
                        style={{
                            padding: 5,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            backgroundColor: THEME_COLORS.BLUE.MIDDLE_DEEP,
                        }}
                        onPress={() => {
                            if (onTapDay) {
                                onTapDay(date)
                            }
                            navigation.push('ConstructionList', {
                                targetMonth: selectMonth,
                                routeNameFrom: 'AdminHome',
                            })
                        }}>
                        <Icon fill="#fff" name="plus" width={10} height={10} />
                        <Text
                            style={{
                                ...GlobalStyles.smallText,
                                fontFamily: FontStyle.medium,
                                marginLeft: 3,
                                fontSize: 11,
                                lineHeight: 13,
                                color: '#fff',
                            }}>
                            現場
                        </Text>
                    </Pressable>
                )}
            </View>
        </Pressable>
    )
})
