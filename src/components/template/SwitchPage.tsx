/* eslint-disable indent */
/* eslint-disable prefer-const */
import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { View, ViewStyle, Animated, StyleSheet, FlatList, ListRenderItem, RefreshControl } from 'react-native'
import { WINDOW_WIDTH } from '../../utils/Constants'
import '../../utils/ext/Date.extensions'
import { CustomDate, dayBaseText, nextDay, nextMonth, nextYear } from '../../models/_others/CustomDate'
import { Side, SwitchDateButton } from '../organisms/SwitchDateButton'
import { EmptyScreen, EmptyScreenProps } from './EmptyScreen'
import { BottomMargin } from '../atoms/BottomMargin'
import { getUuidv4 } from '../../utils/Utils'
import { newDate } from '../../utils/ext/Date.extensions'
import { DateDataType } from '../../models/date/DateDataType'
import { ProjectType } from '../../models/project/Project'

export type SwitchPageProps<T = any> = {
    data: T[] | undefined
    content: ListRenderItem<T>
    footer?: () => JSX.Element
    header?: (() => JSX.Element) | JSX.Element
    emptyProps?: EmptyScreenProps
    style?: ViewStyle
    backgroundColor?: string
    duration?: number
    onDateChange?: (value: CustomDate, isFetched: boolean, fetchedData?: ExtendedDateDataType) => void
    dateType?: 'year' | 'month' | 'day'
    dateInitValue?: CustomDate
    onRefresh?: () => Promise<void>
    scrollEnabled?: boolean
    dateUpdate?: number
    inputData?: ExtendedDateDataType
    screenName?: string
    switchDateButtonTopMargin?: number
    isHideDateSwitch?: boolean
    onScroll?: () => void
    flatListRef?: React.RefObject<FlatList<T>>
}
/**
 * 連続で月を切り替えた際に、まとめる秒数。
 * 長すぎるとパフォーマンスが悪くなり、短すぎると意味をなさない。
 */
const CONTINUITY_SWITCH_TIME = 350

type FetchedDataType = {
    [key: string]: ExtendedDateDataType
}

type ExtendedDateDataType = {
    monthlyData: DateDataType[]
    projects: ProjectType[]
}

export const SwitchPage = React.memo((props: SwitchPageProps) => {
    let {
        style,
        backgroundColor,
        content,
        header,
        emptyProps,
        duration,
        footer,
        data,
        onDateChange,
        dateType,
        dateInitValue,
        onRefresh,
        scrollEnabled,
        dateUpdate,
        inputData,
        screenName,
        switchDateButtonTopMargin,
        isHideDateSwitch,
        onScroll,
        flatListRef,
    } = props
    const [fetchedData, setFetchDate] = useState({} as FetchedDataType)
    const _duration = duration ?? 100
    backgroundColor = backgroundColor ?? '#fff'
    const flatListSlideAnim = useRef(new Animated.Value(0)).current
    const [refreshing, setRefreshing] = useState<boolean>(false)
    /**
     * 連続した月の切り替えが終わった後の最終的な日付
     */
    const [date, setDate] = useState<CustomDate>(dateInitValue || newDate().toCustomDate())
    /**
     * 月を切り替えた時にすぐに切り替わる日付
     */
    const [_date, _setDate] = useState<CustomDate>()
    const [side, setSide] = useState<Side>()

    useEffect(() => {
        if (dateInitValue) {
            setDate(dateInitValue)
        }
    }, [dateInitValue])

    const flatListSlideOut = (duration: number, toLeft = true) => {
        Animated.sequence([
            Animated.timing(flatListSlideAnim, {
                toValue: -(WINDOW_WIDTH + 50) * (toLeft ? 1 : -1),
                duration: duration,
                useNativeDriver: true,
            }),
        ]).start()
    }

    const flatListSlideIn = (duration: number, toLeft = true) => {
        Animated.sequence([
            Animated.timing(flatListSlideAnim, {
                toValue: (WINDOW_WIDTH + 50) * (toLeft ? 1 : -1),
                duration: 0,
                useNativeDriver: true,
            }),
            Animated.timing(flatListSlideAnim, {
                toValue: 0,
                duration: duration,
                useNativeDriver: true,
            }),
        ]).start()
    }

    const _footer = () => {
        return <BottomMargin />
    }

    const _onRefresh = async () => {
        setRefreshing(true)
        if (onRefresh) {
            await onRefresh()
        }
        setRefreshing(false)
    }

    const listKey = useMemo(() => getUuidv4(), [])

    useEffect(() => {
        if (date) {
            if (screenName && inputData) {
                const key = screenName + date.year + date.month
                fetchedData[key] = inputData
            }
        } else if (_date) {
            if (screenName && inputData) {
                const key = screenName + _date.year + _date.month
                fetchedData[key] = inputData
            }
        }
    }, [inputData])

    useEffect(() => {
        if (_date) {
            const timer = setTimeout(async () => {
                flatListSlideIn(_duration / 2, side == 'next')
                setDate(_date)
                if (onDateChange) {
                    if (screenName) {
                        const key = screenName + _date.year + _date.month
                        if (fetchedData && key in fetchedData) {
                            onDateChange(_date, true, fetchedData[key])
                        } else {
                            onDateChange(_date, false, undefined)
                        }
                    } else {
                        onDateChange(_date, false, undefined)
                    }
                }
                clearTimeout(timer)
            }, CONTINUITY_SWITCH_TIME)
            return () => {
                clearInterval(timer)
            }
        }
    }, [_date])

    const _onChangeValue = (value: CustomDate, side: Side) => {
        flatListSlideOut(_duration / 2, side == 'next')
        _setDate(value)
        setSide(side)
    }
    // const _switch = useCallback((side: Side, newValue: CustomDate, multiple = 1) => {
    //     let _value = undefined
    //     switch (dateType) {
    //         case 'month':
    //             // 2022.07 okuda - KVSキャッシュ導入に伴い、メソッドを持たないキャッシュデータに対応させるためCustomDateを再生成
    //             // _value = nextMonth(newValue, side == 'next' ? multiple : -multiple)
    //             _value = nextMonth(newValue, side == 'next' ? multiple : -multiple)
    //             setMonth(_value)
    //             break
    //         case 'year':
    //             // 2022.07 okuda - KVSキャッシュ導入に伴い、メソッドを持たないキャッシュデータに対応させるためCustomDateを再生成
    //             // _value = nextYear(newValue, side == 'next' ? multiple : -multiple)
    //             _value = nextYear(newValue, side == 'next' ? multiple : -multiple)
    //             setMonth(_value)
    //             break
    //         case 'day':
    //             // 2022.07 okuda - KVSキャッシュ導入に伴い、メソッドを持たないキャッシュデータに対応させるためCustomDateを再生成
    //             // _value = nextDay(newValue, side == 'next' ? multiple : -multiple)
    //             _value = nextDay(newValue, side == 'next' ? multiple : -multiple)
    //             setMonth(_value)
    //             break
    //     }
    //     if (_value == undefined) {
    //         return
    //     }
    //     if (_onChangeValue) {
    //         _onChangeValue(_value, side)
    //     }
    // }, [dateType, _onChangeValue]);

    // const _onSwipeLeft = (gestureState: PanResponderGestureState) => {
    //   flatListSlide(_duration, true);
    //   _switch('next', date);
    // }
    // const _onSwipeRight = (gestureState: PanResponderGestureState) => {
    //   flatListSlide(_duration, false);
    //   _switch('prev', date);
    // }

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: backgroundColor,
                ...style,
            }}>
            {isHideDateSwitch != true && (
                <SwitchDateButton
                    style={{ marginTop: switchDateButtonTopMargin ?? 15, zIndex: 1, position: 'absolute', alignSelf: 'center' }}
                    dateType={dateType ?? 'month'}
                    initValue={date ?? undefined}
                    onChangeValue={_onChangeValue}
                    changeValue={date}
                    dateUpdate={dateUpdate}
                />
            )}
            <Animated.View
                style={{
                    transform: [{ translateX: flatListSlideAnim }],
                    flex: 1,
                }}>
                <FlatList
                    // onScrollEndDrag={() => console.log("end")}
                    onScrollBeginDrag={() => {
                        if (onScroll) {
                            onScroll()
                        }
                    }}
                    ref={flatListRef}
                    data={data} // getUuidだと重くなる
                    listKey={listKey}
                    keyExtractor={(item, index) => index.toString()}
                    ListFooterComponent={footer ?? _footer}
                    ListHeaderComponent={header}
                    renderItem={content}
                    ListEmptyComponent={() => (emptyProps ? <EmptyScreen {...emptyProps} /> : <></>)}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            progressViewOffset={-500} //not displaying progress indicator (android only)
                            refreshing={refreshing}
                            onRefresh={_onRefresh}
                        />
                    }
                    scrollEnabled={scrollEnabled === undefined ? true : false}
                />
            </Animated.View>
        </View>
    )
})

const styles = StyleSheet.create({})
