/* eslint-disable indent */
/* eslint-disable prefer-const */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { View, ViewStyle, Animated, StyleSheet, FlatList, ListRenderItem, RefreshControl } from 'react-native'

import { WINDOW_WIDTH } from '../../utils/Constants'
import '../../utils/ext/Date.extensions'
import { CustomDate, dayBaseTextWithoutDate, monthBaseText, newCustomDate, yearBaseText } from '../../models/_others/CustomDate'
import { Side, SwitchDateButton } from '../organisms/SwitchDateButton'
import { EmptyScreen, EmptyScreenProps } from './EmptyScreen'
import { BottomMargin } from '../atoms/BottomMargin'
import { useIsFocused } from '@react-navigation/native'
import cloneDeep from 'lodash/cloneDeep'
import { match } from 'ts-pattern'
import { useDispatch, useSelector } from 'react-redux'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { StoreType } from '../../stores/Store'
import { getUuidv4 } from '../../utils/Utils'

/**
 * @requires
 * @param dataPages - 日付をキーとした、データオブジェクト。例：{'2022/03/15': データT[]}
 * #### dateTypeごとの日付
 *  - year - 'yyyy'（CustomDate.yearBaseText()）
 *  - month - 'yyyy/mm'（CustomDate.monthBaseText()）
 *  - day - 'yyyy/mm/dd'（CustomDate.dayBaseText()WithoutDay）
 * @param fetchFunction - データ取得関数。更新のロジックを組み込むため。CustomDateが引数として渡される。
 * ---
 * @partial
 * @param interDataProcess - オブジェクトのバリューデータ（type U）から入力データ（type T[]）への整形フロー。データフィルターや型変換に使用。\
 * T[] == Uで同じなら必要なし。\
 * 使用例：DateArrangementとDateAttendance参照
 * @param updateIndex - 外部からの強制アップデート。デフォルト不要
 * @param onDateChange - 日付切り替え時の追加処理記述（立ち上げ時にも発生）。デフォルト不要
 * @param onRefresh - リフレッシュ時の追加処理記述。デフォルト不要
 * @param scrollEnabled - スクロール可能かどうか
 */
export type SwitchPageV2Props<T = any, U = any> = {
    dataPages: Record<string, U>
    fetchFunction: (date: CustomDate) => Promise<void>
    interDataProcess?: (data?: U) => T[] | undefined
    content: ListRenderItem<T>
    footer?: () => JSX.Element
    header?: () => JSX.Element
    updateIndex?: number
    emptyProps?: EmptyScreenProps
    style?: ViewStyle
    backgroundColor?: string
    duration?: number
    onDateChange?: (value: CustomDate, side: Side) => void
    dateType?: 'year' | 'month' | 'day'
    dateInitValue?: CustomDate
    onRefresh?: () => Promise<void>
    scrollEnabled?: boolean
}

/**
 *
 * @remarks v1との違い
 * - 入力するデータ構造を日付ベースのものに変更
 * - 日付切り替えごとに毎回同じデータを取得しないようにキャッシュを使って効率化
 * - ページ切り替え時のみデータを新規に更新
 * - interDataProcessを使ってデータ整形やフィルターを内部化
 * @param props
 * @returns
 */
export const SwitchPageV2 = React.memo((props: SwitchPageV2Props) => {
    let {
        style,
        backgroundColor,
        content,
        header,
        scrollEnabled,
        dataPages,
        updateIndex,
        fetchFunction,
        interDataProcess,
        emptyProps,
        duration,
        footer,
        onDateChange,
        dateType,
        dateInitValue,
        onRefresh,
    } = props
    const _duration = duration ?? 300
    backgroundColor = backgroundColor ?? '#fff'
    const loading = useSelector((state: StoreType) => state?.util?.loading)
    const flatListSlideAnim = useRef(new Animated.Value(0)).current
    const [refreshing, setRefreshing] = useState<boolean>(false)
    const [date, setDate] = useState<CustomDate>(dateInitValue ?? newCustomDate())
    const [update, setUpdate] = useState<number>(0)
    const [forceUpdate, setForceUpdate] = useState<number>(0)
    const isFocused = useIsFocused()

    /**
     * 立ち上げ時にも発生する。
     */
    useEffect(() => {
        if (onDateChange) {
            onDateChange(date, 'next')
        }
    }, [])

    const flatListSlide = useCallback(
        (duration: number, toLeft = true) => {
            Animated.sequence([
                Animated.timing(flatListSlideAnim, {
                    toValue: -(WINDOW_WIDTH + 50) * (toLeft ? 1 : -1),
                    duration: duration / 2,
                    useNativeDriver: true,
                }),
                Animated.timing(flatListSlideAnim, {
                    toValue: (WINDOW_WIDTH + 50) * (toLeft ? 1 : -1),
                    duration: 0,
                    useNativeDriver: true,
                }),
                Animated.timing(flatListSlideAnim, {
                    toValue: 0,
                    duration: duration / 2,
                    useNativeDriver: true,
                }),
            ]).start()
        },
        [flatListSlideAnim],
    )

    /**
     * データを取得する関数
     */
    const __fetchData = useCallback(
        async (_forceUpdate?: boolean) => {
            /**
             * fetch中に日付が変更しても問題ないように。
             */
            const _date = cloneDeep(date)
            if (dataPages[dayBaseTextWithoutDate(_date)] == undefined) {
            }

            /**
             * 強制更新の場合は存在していてもreturnしない。
             */
            if (_forceUpdate != true) {
                if (dataPages[dayBaseTextWithoutDate(_date)] != undefined) {
                    return
                }
            }
            await fetchFunction(_date)
        },
        [date, dataPages],
    )

    /**
     * データ存在すれば更新しない。（日付切り替えなど）
     */
    useEffect(() => {
        ;(async () => {
            /**
             * 無用なリレンダリングとフェッチコールを抑制
             */
            // await __fetchData(false)
            update ? await __fetchData(false) : void 0
        })()
    }, [update])

    /**
     * 強制更新（ページ遷移など）
     */
    useEffect(() => {
        ;(async () => {
            /**
             * 無用なリレンダリングとフェッチコールを抑制
             */
            // await __fetchData(true)
            forceUpdate ? await __fetchData(true) : void 0
        })()
    }, [forceUpdate])

    useEffect(() => {
        /**
         * 無用なリレンダリングとフェッチコールを抑制
         */
        // setUpdate(update + 1)
        isFocused && date ? setUpdate(update + 1) : void 0
    }, [date])

    useEffect(() => {
        if (isFocused) {
            // if (isFocused && updateIndex) {
            setForceUpdate(forceUpdate + 1)
        }
    }, [isFocused, updateIndex])

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

    const __getData = useCallback(
        (_dataPages: Record<string, unknown>, _date: CustomDate): unknown[] | undefined => {
            const dateText = match(dateType)
                .with('year', () => yearBaseText(_date))
                .with('month', () => monthBaseText(_date))
                .otherwise(() => dayBaseTextWithoutDate(_date))
            const data = interDataProcess ? interDataProcess(_dataPages[dateText]) : (_dataPages[dateText] as unknown[])
            return data
        },
        [dateType, interDataProcess],
    )

    const listKey = useMemo(() => getUuidv4(), [])

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: backgroundColor,
                ...style,
            }}>
            <SwitchDateButton
                style={{
                    marginTop: 15,
                    zIndex: 1,
                    position: 'absolute',
                    alignSelf: 'center',
                }}
                dateType={dateType ?? 'month'}
                initValue={dateInitValue ?? undefined}
                onChangeValue={(value, side) => {
                    flatListSlide(_duration, side == 'next')
                    setTimeout(() => {
                        setDate(value)
                        if (onDateChange) {
                            onDateChange(value, side)
                        }
                    }, _duration / 2)
                }}
            />
            <Animated.View
                style={{
                    transform: [{ translateX: flatListSlideAnim }],
                    flex: 1,
                }}>
                <FlatList
                    listKey={listKey}
                    data={__getData(dataPages, date)}
                    // getUuidだと重くなる
                    keyExtractor={(item, index) => index.toString()}
                    ListFooterComponent={footer ?? _footer}
                    ListHeaderComponent={header}
                    renderItem={content}
                    scrollEnabled={scrollEnabled}
                    ListEmptyComponent={() => (emptyProps && !loading ? <EmptyScreen {...emptyProps} /> : <></>)}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                />
            </Animated.View>
        </View>
    )
})

const styles = StyleSheet.create({})
