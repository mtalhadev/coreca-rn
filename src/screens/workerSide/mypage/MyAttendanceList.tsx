import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, StyleSheet, ListRenderItem, ListRenderItemInfo, Pressable } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { useIsFocused } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import cloneDeep from 'lodash/cloneDeep'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { Site } from '../../../components/organisms/site/Site'
import { SummaryUIType, WorkerSummary } from '../../../components/organisms/worker/WorkerSummary'
import { SwitchPage } from '../../../components/template/SwitchPage'
import { ArrangementCLType } from '../../../models/arrangement/Arrangement'
import { StoreType } from '../../../stores/Store'
import { deleteParamOfLocalUpdateScreens, setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { getWorkerAttendancesOfMonth } from '../../../usecases/worker/CommonWorkerCase'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import {
    CustomDate,
    dayBaseText,
    getMonthlyFinalDay,
    getMonthlyFirstDay,
    isToday,
    isTodayOrBefore,
    isTomorrow,
    monthBaseText,
    newCustomDate,
    toCustomDateFromTotalSeconds,
    YYYYMMDateType,
} from '../../../models/_others/CustomDate'
import { FontStyle, GreenColor } from '../../../utils/Styles'
import { WorkerAttendanceType } from '../../adminSide/worker/workerDetail/WorkerAttendanceList'
import { WorkerDetailRouterContextType } from '../../adminSide/worker/workerDetail/WorkerDetailRouter'
import { RootStackParamList } from '../../Router'
import { updateCachedData, getCachedData, genKeyName } from '../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { getUpdateScreenOfTargetAccountAndScreen, deleteParamOfUpdateScreens } from '../../../usecases/updateScreens/CommonUpdateScreensCase'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
type NavProps = StackNavigationProp<RootStackParamList, 'WorkerAttendanceList'>
type RouteProps = RouteProp<RootStackParamList, 'WorkerAttendanceList'>

type InitialStateType = {
    selectedMonth: CustomDate
    arrangements: WorkerAttendanceType
    monthData: ArrangementCLType[]
    summary?: SummaryUIType
    isFetching: boolean
    updateCache: number
    updateMonths?: number[]
    /**
     * localUpdateScreensにより、updateScreens取得前に更新した日付
     */
    updatedMonths?: YYYYMMDateType[]
}

type CachedAttendanceType = {
    arrangements: WorkerAttendanceType
    monthData: ArrangementCLType[]
}

const initialState: InitialStateType = {
    arrangements: {},
    monthData: [],
    isFetching: false,
    selectedMonth: newCustomDate(),
    updateCache: 0,
}

const MyAttendanceList = () => {
    const { t, i18n } = useTextTranslation()

    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state.account?.signInUser)
    const accountId = signInUser?.accountId ?? ''
    const [{ arrangements, selectedMonth, summary, monthData, isFetching, updateCache, updateMonths, updatedMonths }, setState] = useState(initialState)
    const cachedAttendanceListKey = useRef(
        genKeyName({
            screenName: 'MyAttendanceList',
            accountId: accountId,
            companyId: myCompanyId ?? '',
            workerId: signInUser?.workerId ?? '',
            month: selectedMonth ? monthBaseText(selectedMonth).replace(/\//g, '-') : '',
        }),
    )
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const dispatch = useDispatch()
    const [dateUpdate, setDateUpdate] = useState(0)

    useSafeUnmount(setState, initialState, () => setDateUpdate(dateUpdate + 1))

    useEffect(() => {
        _onDateChange(selectedMonth)
    }, [arrangements])

    useEffect(() => {
        if (isFocused) {
            ;(async () => {
                const updateResult = await getUpdateScreenOfTargetAccountAndScreen({
                    accountId,
                    screenName: 'MyAttendanceList',
                })
                const updateScreen = updateResult.success
                setState((prev) => ({ ...prev, updateMonths: updateScreen?.dates ?? [] }))
            })()
        }
    }, [isFocused])

    /**
     * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
     */
    useEffect(() => {
        ;(async () => {
            if (selectedMonth && isFocused) {
                const LocalTargetScreen = localUpdateScreens.filter((screen) => screen.screenName == 'MyAttendanceList')[0]
                const localTargetMonths = LocalTargetScreen?.dates?.filter(
                    (_date: number) => _date >= getMonthlyFirstDay(selectedMonth).totalSeconds && _date <= getMonthlyFinalDay(selectedMonth).totalSeconds,
                )
                if (localTargetMonths && localTargetMonths.length > 0) {
                    /**
                     * 作成編集者本人はUpdateScreensが更新される前に遷移するため、Storeで対応
                     */
                    dispatch(setIsNavUpdating(true))
                    setState((prev) => ({ ...prev, updatedMonths: [...(updatedMonths ?? []), monthBaseText(selectedMonth)] }))
                } else {
                    const targetMonths = updateMonths?.filter(
                        (_date) =>
                            _date >= getMonthlyFirstDay(selectedMonth).totalSeconds &&
                            _date <= getMonthlyFinalDay(selectedMonth).totalSeconds &&
                            !updatedMonths?.includes(monthBaseText(toCustomDateFromTotalSeconds(_date))),
                    )
                    if (targetMonths && targetMonths?.length > 0) {
                        dispatch(setIsNavUpdating(true))
                        setState((prev) => ({ ...prev, updatedMonths: [...(updatedMonths ?? []), monthBaseText(selectedMonth)] }))
                    }
                }
            }
        })()
    }, [selectedMonth, updateMonths])

    useEffect(() => {
        if (myCompanyId && selectedMonth && signInUser?.workerId) {
            // __DEV__ && logger.logAccessInfo('\n2. キャッシュキー生成の副作用フック')
            // __DEV__ && console.log('\n2-1. キャッシュキーを更新: '+ (selectedMonth? monthBaseText(selectedMonth).replace(/\//g, '-') : '') + '\n')
            cachedAttendanceListKey.current = genKeyName({
                screenName: 'MyAttendanceList',
                accountId: accountId,
                companyId: myCompanyId,
                workerId: signInUser.workerId,
                /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                month: selectedMonth ? monthBaseText(selectedMonth).replace(/\//g, '-') : '',
            })
        }
    }, [myCompanyId, selectedMonth, signInUser?.workerId])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    let _preDay: string | undefined = undefined

    const _onDateChange = async (date: CustomDate) => {
        setState((prev) => ({
            ...prev,
            selectedMonth: date,
        }))
    }

    useEffect(() => {
        return () => {
            setState(initialState)
            setDateUpdate(dateUpdate + 1)
        }
    }, [signInUser])

    useEffect(() => {
        ;(async () => {
            try {
                if (signInUser?.workerId == undefined || myCompanyId == undefined || isFetching != true) {
                    setState((prev) => ({ ...prev, isFetching: false }))
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const result = await getWorkerAttendancesOfMonth({
                    workerId: signInUser.workerId,
                    myCompanyId,
                    month: selectedMonth,
                })
                setState((prev) => ({ ...prev, isFetching: false }))
                dispatch(setIsNavUpdating(false))
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                const fetchMonthBaseText = cachedAttendanceListKey.current.substring(cachedAttendanceListKey.current.length - 7).replace(/-/g, '/')
                if (monthBaseText(selectedMonth) == fetchMonthBaseText) {
                    // __DEV__ && console.log('3-4、カレント月とフェッチデータが一致したので表示データを更新')
                    const _arrangements = cloneDeep(arrangements)
                    _arrangements[monthBaseText(selectedMonth)] = result.success ?? []
                    const _monthData = _arrangements
                        ? (_arrangements[monthBaseText(selectedMonth)] ?? []).sort(
                              (a, b) => (a.site?.meetingDate?.totalSeconds ?? a.site?.startDate?.totalSeconds ?? 0) - (b.site?.meetingDate?.totalSeconds ?? b.site?.startDate?.totalSeconds ?? 0),
                          )
                        : []
                    setState((prev) => ({ ...prev, arrangements: _arrangements, monthData: result.success ?? [] }))
                    const cachedResult = await updateCachedData({ key: cachedAttendanceListKey.current, value: { arrangements: result?.success ?? {}, monthData: _monthData } })
                    if (cachedResult.error) {
                        dispatch(
                            setToastMessage({
                                text: cachedResult.error,
                                type: 'error',
                            }),
                        )
                    }
                    deleteParamOfLocalUpdateScreens({
                        screens: localUpdateScreens,
                        screenName: 'MyAttendanceList',
                        startDate: getMonthlyFirstDay(selectedMonth).totalSeconds,
                        endDate: getMonthlyFinalDay(selectedMonth).totalSeconds,
                        paramName: 'dates',
                    })
                    await deleteParamOfUpdateScreens({
                        accountId,
                        screenName: 'MyAttendanceList',
                        startDate: getMonthlyFirstDay(selectedMonth).totalSeconds,
                        endDate: getMonthlyFinalDay(selectedMonth).totalSeconds,
                        paramName: 'dates',
                    })
                } else {
                    /**
                     * カレント月とフェッチデータが一致しないので、フェッチデータは捨てる（日送り連打対策）
                     */
                    //  __DEV__ && console.log('3-5、日送り連打でカレント月とフェッチデータが一致しない（フェッチデータは捨てる）')
                    // __DEV__ && console.log('currentDate: ' + monthBaseText(month) + '\nfetchDate: ' + fetchDayBaseTextWithoutDate)
                    dispatch(setIsNavUpdating(true))
                }
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                if (isFocused) dispatch(setLoading(false))
            }
        })()
    }, [isFetching])

    /**
     * @summary updateCacheフラグ更新時の副作用フック（KVSから表示データを取得更新）
     * @purpose アプリ側にKVSによるキャッシュを設けて一覧の初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            const result = await getCachedData<CachedAttendanceType>(cachedAttendanceListKey.current)
            if (result.error) {
                if (result.errorCode != 'FIRST_FETCH') {
                    dispatch(
                        setToastMessage({
                            text: result.error,
                            type: 'error',
                        }),
                    )
                }
                setState((rev) => ({ ...rev, isFetching: true }))
            } else if (result.success && result.success.arrangements && result.success.monthData) {
                setState((rev) => ({ ...rev, arrangements: result.success?.arrangements ?? {}, monthData: result.success?.monthData ?? [] }))
            } else {
                setState((rev) => ({ ...rev, isFetching: true }))
            }
        })()
    }, [updateCache])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))
        }
    }, [isFocused, route, selectedMonth])

    useEffect(() => {
        _onDateChange(selectedMonth)
    }, [])

    const _onRefresh = async () => {
        setState((prev) => ({ ...prev, isFetching: true }))
    }

    const _footer = () => {
        return <BottomMargin />
    }

    const _header = () => {
        return (
            <WorkerSummary
                style={{
                    margin: 10,
                    marginTop: 65,
                }}
                color={GreenColor}
                arrangements={monthData}
                month={selectedMonth.month}
            />
        )
    }

    const _content: ListRenderItem<ArrangementCLType> = (info: ListRenderItemInfo<ArrangementCLType>) => {
        const { item, index } = info
        const startDate = item?.site?.startDate
        const day = startDate ? dayBaseText(startDate) : undefined
        const displayDay = _preDay != day
        _preDay = day
        const __isToday = startDate ? isToday(startDate) : false
        const __isTomorrow = startDate ? isTomorrow(startDate) : false
        const __isTodayOrBefore = startDate ? isTodayOrBefore(startDate) : false

        return (
            <Pressable
                style={{
                    margin: 10,
                    marginBottom: 0,
                }}>
                {displayDay && (
                    <View
                        style={{
                            marginBottom: 5,
                            marginTop: 5,
                            marginLeft: 5,
                        }}>
                        <Text
                            style={{
                                fontSize: __isToday || __isTomorrow ? 12 : 14,
                                lineHeight: 15,
                                fontFamily: __isToday || __isTomorrow ? FontStyle.regular : FontStyle.medium,
                            }}>
                            {day}
                        </Text>
                        {(__isToday || __isTomorrow) && (
                            <Text
                                style={{
                                    fontSize: 20,
                                    lineHeight: 22,
                                    fontFamily: FontStyle.black,
                                    marginTop: 5,
                                }}>
                                {__isToday ? `${t('common:Today')}` : `${t('common:Tomorrow')}`}
                            </Text>
                        )}
                    </View>
                )}
                <Site
                    site={item?.site}
                    canEditAttendance={__isTodayOrBefore ? !item.attendance?.isReported : false}
                    canModifyAttendance={item?.workerId == signInUser?.workerId}
                    arrangement={item}
                    color={GreenColor}
                    onPress={(site) => {
                        navigation.push('WSiteRouter', {
                            title: site?.siteNameData?.name,
                            siteId: site?.siteId,
                        })
                    }}
                />
            </Pressable>
        )
    }

    return (
        <SwitchPage
            dateUpdate={dateUpdate}
            dateInitValue={selectedMonth}
            data={monthData}
            header={_header}
            emptyProps={{ text: `${t('worker:AttendanceLine')}` }}
            content={_content}
            onRefresh={_onRefresh}
            footer={_footer}
            onDateChange={_onDateChange}
        />
    )
}
export default MyAttendanceList

const styles = StyleSheet.create({})
