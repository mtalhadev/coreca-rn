import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Animated, FlatList, ViewStyle } from 'react-native'
import { CustomDate, dayBaseText, dayBaseTextWithoutDate, monthBaseText, nextDay, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import isEmpty from 'lodash/isEmpty'
import range from 'lodash/range'
import { HomeCalendarDay } from './HomeCalendarDay'
import { GlobalStyles } from '../../../utils/Styles'
import { THEME_COLORS, WINDOW_HEIGHT } from '../../../utils/Constants'
import { DateDataType } from '../../../models/date/DateDataType'
import { useDispatch, useSelector } from 'react-redux'
import { StoreType } from '../../../stores/Store'
import { _deleteDateData } from '../../../services/date/DateDataService'
import { setExpandWeekNumber, setTargetDate } from '../../../stores/CalendarSlice'

/**
 * @param month - 対象の月
 * @param firstDate - 表示する月の最初の日付（日曜から。1日とは限らない。）
 * @param dateData - 日付ごとのデータ一ヶ月分（35日分）
 * @param dayHeight - 日付のますの高さを定義。デフォルトはWINDOW_HEIGHTをMONTHLY_WEEK_COUNT==5で割った数。
 */
type HomeCalendarMonthProps = {
    month: CustomDate
    firstDate?: CustomDate
    dateData?: DateDataType[]
    dayHeight?: number
    useSmartDisplay?: boolean
    useOnlyNewSiteDisplay?: boolean
    style?: ViewStyle
}

/**
 * スケジュールの縦ますの数。月において何週まで表示するかを定義。
 */
export const MONTHLY_WEEK_COUNT = 6 as const
/**
 * １週間の日数。
 */
export const WEEKLY_DAY_COUNT = 7 as const

/**
 * 拡張される高さ。そこから縮小する高さを算出。
 */
export const MAX_EXPANDING_HEIGHT = WINDOW_HEIGHT / 4
export const EXPANDING_HEIGHT = Math.min(200, MAX_EXPANDING_HEIGHT)
export const SHRINKING_HEIGHT = EXPANDING_HEIGHT / (MONTHLY_WEEK_COUNT - 1)
const EXPAND_DURATION = 300

/**
 * 日〜土のテキスト部分の高さ。日付ごとの高さを算出する際に使用する。
 */
export const WEEK_DAYS_TEXT_MARGIN_TOP = 3 as const
export const WEEK_DAYS_TEXT_LINE_HEIGHT = 12 as const
export const WEEK_DAYS_TEXT_HEIGHTS = WEEK_DAYS_TEXT_MARGIN_TOP + WEEK_DAYS_TEXT_LINE_HEIGHT

const WEEK_DAY_LIST = ['日', '月', '火', '水', '木', '金', '土'] as const

/**
 * @remarks スケジュールの月を定義
 * @param props
 * @returns
 */
export const HomeCalendarMonth = React.memo((props: HomeCalendarMonthProps) => {
    const dispatch = useDispatch()

    const { firstDate, month, useSmartDisplay, useOnlyNewSiteDisplay, dayHeight, dateData, style } = props
    const tappedDate = useSelector((store: StoreType) => store?.calendar?.targetDate)
    const expandWeekNumber = useSelector((store: StoreType) => store?.calendar?.expandWeekNumber)
    const _dayHeight = useMemo(() => dayHeight ?? WINDOW_HEIGHT / MONTHLY_WEEK_COUNT, [dayHeight])
    const _shrinkingHeight = useMemo(() => _dayHeight - SHRINKING_HEIGHT, [_dayHeight])
    const _expandingHeight = useMemo(() => _dayHeight + EXPANDING_HEIGHT, [_dayHeight])
    const holidays = useSelector((store: StoreType) => store.util.holidays)
    const dateList = useMemo(() => (firstDate != undefined ? range(WEEKLY_DAY_COUNT * MONTHLY_WEEK_COUNT).map((dayCount) => nextDay(firstDate, dayCount)) : []), [firstDate])

    useEffect(() => {
        if (expandWeekNumber === -1) {
            dispatch(setTargetDate({}))
        }
    }, [expandWeekNumber])

    const __initialHeight = useMemo(
        () =>
            (weekNumber: number): number =>
                expandWeekNumber != -1 ? (weekNumber == expandWeekNumber ? _expandingHeight : _shrinkingHeight) : _dayHeight,
        [],
    )

    const __getWeekNumber = (index: number) => Math.floor(index / WEEKLY_DAY_COUNT)

    /**
     * 高さのアニメーション用のバリューリスト。週ごと。
     */
    const weekAnimList = range(0, MONTHLY_WEEK_COUNT).map((weekNumber) => useRef(new Animated.Value(__initialHeight(weekNumber))).current)

    const __shrinkAnimDataSet = useCallback(
        (weekAnim: Animated.Value) => {
            // スケジュール縮小アニメーション
            Animated.timing(weekAnim, {
                toValue: _shrinkingHeight,
                duration: EXPAND_DURATION,
                useNativeDriver: false,
            }).start()
        },
        [_shrinkingHeight],
    )
    const __expandAnimDataSet = useCallback(
        (weekAnim: Animated.Value) => {
            // スケジュール拡大アニメーション
            Animated.timing(weekAnim, {
                toValue: _expandingHeight,
                duration: EXPAND_DURATION,
                useNativeDriver: false,
            }).start()
        },
        [_expandingHeight],
    )
    const __normalizeAnimDataSet = useCallback(
        (weekAnim: Animated.Value) => {
            // 元に戻すアニメーション
            Animated.timing(weekAnim, {
                toValue: _dayHeight,
                duration: EXPAND_DURATION,
                useNativeDriver: false,
            }).start()
        },
        [_dayHeight],
    )

    const __weekDaysHeader = () => {
        return (
            <FlatList
                style={{
                    marginBottom: WEEK_DAYS_TEXT_MARGIN_TOP,
                }}
                listKey={(firstDate ? monthBaseText(firstDate) : '') + 'days'}
                numColumns={WEEKLY_DAY_COUNT}
                data={WEEK_DAY_LIST}
                renderItem={({ item, index }) => (
                    <View
                        style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1,
                        }}>
                        <Text
                            style={{
                                ...GlobalStyles.smallGrayText,
                                fontSize: WEEK_DAYS_TEXT_LINE_HEIGHT - 2,
                                lineHeight: WEEK_DAYS_TEXT_LINE_HEIGHT,
                                color: THEME_COLORS.OTHERS.LIGHT_GRAY,
                            }}>
                            {item}
                        </Text>
                    </View>
                )}
            />
        )
    }

    useMemo(() => {
        weekAnimList.forEach((weekAnim, weekCount) => {
            if (expandWeekNumber == -1) {
                __normalizeAnimDataSet(weekAnim)
            } else {
                if (expandWeekNumber == weekCount) {
                    __expandAnimDataSet(weekAnim)
                } else {
                    __shrinkAnimDataSet(weekAnim)
                }
            }
        })
    }, [expandWeekNumber])

    const __getPreDateConstructionIds = useCallback(
        (index: number): string[] => {
            if (index <= 0 || dateData == undefined || useSmartDisplay != true) {
                return []
            }
            return (dateData[index - 1]?.sites?.totalSites?.items?.map((site) => site.constructionId).filter((id) => id != undefined) ?? []) as string[]
        },
        [dateList, useSmartDisplay],
    )

    const __getSites = useCallback((date: CustomDate) => {
        if (dateData == undefined) {
            return []
        }
        let __filtered = dateData.filter((_data) => _data.date && dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(_data.date)) == dayBaseTextWithoutDate(date))

        /**
         * 重複データがある場合。本来あってはいけない。
         */
        if (__filtered.length > 1) {
            /**
             * ### 新しい方を前に並べる。
             * a, b => aの方が新しい場合 => a, b
             * compareFunc(a, b) < 0のとき => a, bになるので、
             * compareFunc(a, b) = (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
             * 新しい方がa.updatedAtが大きい。updatedAtがない場合は0にして優先表示しない。
             */
            __filtered = __filtered.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))

            /**
             * 重複データを削除する。
             */
            Promise.all(__filtered.map((item, index) => (index > 0 && item.dateDataId ? _deleteDateData(item.dateDataId) : undefined)))
        }
        return __filtered[0]?.sites?.totalSites?.items ?? []
    }, [])

    const __isHoliday = useCallback(
        (date: CustomDate): boolean => {
            return holidays ? holidays[dayBaseTextWithoutDate(date)] != undefined : false
        },
        [holidays],
    )

    const renderItem = useCallback(
        ({ item, index }: any) => {
            const isTappedWeek = expandWeekNumber === __getWeekNumber(index)
            return (
                <Animated.View
                    style={{
                        height: weekAnimList[__getWeekNumber(index)],
                        flex: 1,
                    }}>
                    <HomeCalendarDay
                        style={{
                            flex: 1,
                            backgroundColor: isTappedWeek ? THEME_COLORS.OTHERS.BACKGROUND : undefined,
                        }}
                        key={dayBaseText(item)}
                        date={item}
                        onTapWeek={(weekNumber) => {
                            if (weekNumber != undefined) {
                                dispatch(setExpandWeekNumber(weekNumber))
                            }
                        }}
                        isTappedWeek={isTappedWeek}
                        onTapDay={(date) => {
                            if (date) {
                                dispatch(setTargetDate(date))
                            }
                        }}
                        useSmartDisplay={useSmartDisplay}
                        useOnlyNewSiteDisplay={useOnlyNewSiteDisplay}
                        preDateConstructionIds={__getPreDateConstructionIds(index)}
                        expandingWeekNumber={expandWeekNumber}
                        weekNumber={__getWeekNumber(index)}
                        isHoliday={__isHoliday(item)}
                        isLeftDay={index % WEEKLY_DAY_COUNT == 0}
                        isTopDay={index < WEEKLY_DAY_COUNT}
                        isBottomDay={index >= WEEKLY_DAY_COUNT * (MONTHLY_WEEK_COUNT - 1)}
                        selectMonth={month}
                        sites={__getSites(item)}
                    />
                </Animated.View>
            )
        },
        [expandWeekNumber],
    )

    const keyExtractor = useCallback((item: CustomDate, index: number) => index.toString(), [])

    const listRender = useMemo(() => {
        return (
            <FlatList
                style={{
                    flex: 1,
                }}
                listKey={firstDate ? monthBaseText(firstDate) : 'list'}
                keyExtractor={keyExtractor}
                numColumns={WEEKLY_DAY_COUNT}
                data={dateList}
                renderItem={renderItem}
            />
        )
    }, [dateList, renderItem])

    return (
        <View
            style={{
                flex: 1,
                ...style,
            }}>
            {__weekDaysHeader()}
            {listRender}
        </View>
    )
})
