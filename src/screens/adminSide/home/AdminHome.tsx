import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet } from 'react-native'
import { useRoute, RouteProp } from '@react-navigation/core'
import { BOTTOM_TAB_BASE_HEIGHT, getTopBarHeight, IPHONEX_BOTTOM_HEIGHT, THEME_COLORS, WINDOW_HEIGHT } from '../../../utils/Constants'
import { CustomDate, getDailyStartTime, getMonthlyFirstDay, monthBaseText, newCustomDate, nextDay } from '../../../models/_others/CustomDate'
import { RootStackParamList } from '../../Router'
import { StoreType } from '../../../stores/Store'
import { setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { updateCachedData, getCachedData, genKeyName } from '../../../usecases/CachedDataCase'
import { HomeCalendarMonth, MONTHLY_WEEK_COUNT, WEEKLY_DAY_COUNT, WEEK_DAYS_TEXT_HEIGHTS } from '../../../components/organisms/homeCalendar/HomeCalendarMonth'
import { StackNavigationProp } from '@react-navigation/stack'
import { DateDataType } from '../../../models/date/DateDataType'
import { isIphoneX } from 'react-native-iphone-screen-helper'
import { getErrorMessage, getErrorToastMessage } from '../../../services/_others/ErrorService'
import { SelectButton } from '../../../components/organisms/SelectButton'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import PermissionModal from '../../../components/template/PushPermissionModal'
import { useTextTranslation } from './../../../fooks/useTextTranslation'
import { SwitchPage } from '../../../components/template/SwitchPage'
import { _getFirestore } from '../../../services/firebase/FirestoreService'
import cloneDeep from 'lodash/cloneDeep'
import { ProjectType } from '../../../models/project/Project'
import { AppButton } from '../../../components/atoms/AppButton'
import { Filter } from '../../../components/organisms/Filter'
import { setExpandWeekNumber } from '../../../stores/CalendarSlice'
import { checkMyDepartment } from '../../../usecases/department/DepartmentCase'

type NavProps = StackNavigationProp<RootStackParamList, 'AdminHome'>
type RouteProps = RouteProp<RootStackParamList, 'AdminHome'>

const SWITCH_TEXT_ALL = 'すべて' as const
const SWITCH_TEXT_ONLY_NEW = '新規のみ' as const
// const SWITCH_TEXT_SMART = 'スマート' as const
const SWITCH_TEXT_LIST = [SWITCH_TEXT_ALL, SWITCH_TEXT_ONLY_NEW] as const
type SwitchDisplayType = typeof SWITCH_TEXT_LIST[number]

const thisMonth = newCustomDate()

type ExtendedDateDataType = {
    monthlyData: DateDataType[]
    projects: ProjectType[]
}

type InitialStateType = {
    month?: CustomDate
    monthlyData: DateDataType[]
    projects?: ProjectType[]
    displayMode: SwitchDisplayType
    isFetching: boolean
    isFirstLoad: boolean
}

const initialState: InitialStateType = {
    month: thisMonth,
    monthlyData: [],
    projects: [],
    displayMode: SWITCH_TEXT_ALL,
    isFetching: false,
    isFirstLoad: true,
}

const CALENDER_MARGIN_TOP = 55 as const
const HEADER_HEIGHT = 50 as const
const BUFFER = 0 as const

const OTHER_HEIGHT = CALENDER_MARGIN_TOP + WEEK_DAYS_TEXT_HEIGHTS + HEADER_HEIGHT + BOTTOM_TAB_BASE_HEIGHT + (isIphoneX() ? IPHONEX_BOTTOM_HEIGHT : 0) + BUFFER
const CALENDER_DAY_BASE_HEIGHT = (WINDOW_HEIGHT - (getTopBarHeight() + OTHER_HEIGHT)) / MONTHLY_WEEK_COUNT
// const logger = createLogger() // for log rerendering

/**
 * @summary 管理スケジュールの月別現場一覧Screen
 * @remark 月別データを月別オブジェクトで管理。
 * 三ヶ月分だけ保持する。コンポーネントも三ヶ月分を保持。
 * @todo
 * @returns JSX
 */
const AdminHome = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const { t } = useTextTranslation()

    const [{ month, monthlyData, isFetching, isFirstLoad, displayMode, projects }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state?.account.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state?.account.signInUser)
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])

    const accountId = useSelector((state: StoreType) => signInUser?.accountId ?? '')
    const isFocused = useIsFocused()

    const displayModeKey = useMemo(() => `${accountId}-adminHome-display-mode`, [accountId])

    const [filter, setFilter] = useState<string[]>([])
    const cachedFilterKey = genKeyName({
        screenName: 'AdminHome',
        accountId: accountId,
        companyId: myCompanyId as string,
    })
    const [displayMonthlyData, setDisplayMonthlyData] = useState<DateDataType[] | null>(null)

    const displayDateDataRef = useRef<DateDataType[]>(new Array(42).fill(null))
    const isDataFetchedRef = useRef<boolean[]>(new Array(42).fill(false))
    const timerRef = useRef<NodeJS.Timer | null>(null)
    const unsubscribeRef = useRef<any>(new Array(42).fill(null))
    const isScreenOnRef = useRef<boolean>(false)
    const cachedKeyRef = useRef<string | null>(null)

    useEffect(() => {
        ;(async () => {
            /**
             * AdminHomeでリセットしたときのみデフォルト設定になる不具合あり。それ以外ではうまくいく
             */
            const result = await getCachedData(displayModeKey)
            if (result.success) {
                setState((prev) => ({ ...prev, displayMode: result.success as SwitchDisplayType }))
            }
        })()
    }, [displayModeKey])

    useEffect(() => {
        if (isFirstLoad) {
            // 月変更時以外はフィルターをリセット（オフ）にする。フィルターを掛けたままで現場追加時に処理が重くなるのを状態を防ぐため 。
            setState((prev) => ({ ...prev, isFirstLoad: false }))
            setFilter([])
            ;(async () => {
                await updateCachedData({
                    key: cachedFilterKey,
                    value: [],
                })
            })()
        } else {
            ;(async () => {
                const filterResult = await getCachedData<string>(cachedFilterKey)
                if (filterResult.success) {
                    setFilter([filterResult.success])
                } else {
                    setFilter([])
                }
            })()
        }
    }, [month])

    const [dateUpdate, setDateUpdate] = useState(0)
    useSafeUnmount(setState, initialState, () => setDateUpdate(dateUpdate + 1))
    useSafeLoadingUnmount(dispatch, isFocused)

    /**
     * 立ち上げと立ち退き時の挙動
     */
    useEffect(() => {
        if (__isAvailable) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
        // __DEV__ && logger.logAccessInfo('1. mount時の副作用フック（ステートを初期化）')
        return () => {
            setState(initialState)
            setDateUpdate(dateUpdate + 1)
        }
    }, [myCompanyId])

    /**
     * headerの更新からDB fetchして良いかどうか
     */
    const __isAvailableFromNavUpdating = useMemo(() => !isFetching && isNavUpdating && isFocused, [isFetching, isNavUpdating, isFocused])

    /**
     * DB fetchして良いかどうか
     */
    const __isAvailable = useMemo(() => month != undefined && myCompanyId != undefined, [month, myCompanyId])

    useEffect(() => {
        ;(async () => {
            const __month = month ? cloneDeep(getMonthlyFirstDay(month)) : undefined
            cachedKeyRef.current = genKeyName({
                screenName: 'AdminHome',
                accountId: accountId,
                companyId: myCompanyId as string,
                /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                month: __month ? monthBaseText(__month).replace(/\//g, '-') : '',
            })
            await updateCachedData({ key: cachedKeyRef.current as string, value: { monthlyData: [] } })
            setState((prev) => ({ ...prev, isFetching: true }))
        })()
    }, [isNavUpdating])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }

        isScreenOnRef.current = isFocused
    }, [isFocused])

    // 月変更時にonSnapshotをunsubscribe、タイマーもリセット（前の月のデータ更新取得が続くのを防ぐため）
    useEffect(() => {
        if (isScreenOnRef.current && unsubscribeRef.current) {
            unsubscribeRef.current.map((unsub: any) => unsub !== null && undefined && unsub.unsubscribe())
            unsubscribeRef.current = new Array(42).fill(null)
            displayDateDataRef.current = new Array(42).fill(null)
            isDataFetchedRef.current = new Array(42).fill(false)

            setState((rev) => ({ ...rev, monthlyData: [] }))
            dispatch(setExpandWeekNumber(-1))
        }
    }, [month])

    /**
     * @summary fetchステート変化時の副作用フック（フェッチ＆キャッシュ保存）
     * @purpose アプリ側にKVSによるキャッシュを設けて一覧の初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            if (!isScreenOnRef.current) return
            if (!__isAvailable || !isFetching) return
            // __DEV__ && logger.logAccessInfo('\n3. fetchステート変化時の副作用フック（フェッチ＆キャッシュ保存）')
            if (isFocused) dispatch(setLoading(true))
            try {
                if (__firstDay == undefined) {
                    return
                }

                const __month = month ? cloneDeep(getMonthlyFirstDay(month)) : undefined
                // const __endOfMonth = __month ? getMonthlyFinalDay(__month) : undefined

                /**
                 * monthが切り替わる前に先に生成。
                 */
                cachedKeyRef.current = genKeyName({
                    screenName: 'AdminHome',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                    /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                    month: __month ? monthBaseText(__month).replace(/\//g, '-') : '',
                })

                /**
                 * タイム測る用
                 */
                // const date = new Date()

                const firstDay = __firstDay.totalSeconds
                const endDay = nextDay(__firstDay, WEEKLY_DAY_COUNT * MONTHLY_WEEK_COUNT).totalSeconds
                const numOfDays = (endDay - firstDay) / (86400 * 1000)
                let dates = []
                for (let i = 0; i < numOfDays; i++) {
                    const date = firstDay + i * (86400 * 1000)
                    dates.push(date)
                }

                const result = await getCachedData<ExtendedDateDataType>(cachedKeyRef.current ?? 'no-id')
                const db = _getFirestore()
                dates.forEach((date, index) => {
                    const startOfDay = new Date(date)
                    startOfDay.setHours(0, 0, 0, 0) // Set time to the start of the day

                    const endOfDay = new Date(date)
                    endOfDay.setHours(23, 59, 59, 999) // Set time to the end of the day

                    const startOfDayTimestamp = startOfDay.getTime()
                    const endOfDayTimestamp = endOfDay.getTime()

                    unsubscribeRef.current[index] = db
                        .collection('DateData')
                        .where('companyId', '==', myCompanyId)
                        .where('date', '>=', startOfDayTimestamp)
                        .where('date', '<', endOfDayTimestamp)
                        // .where('date', '==', date)
                        .onSnapshot(async (data) => {
                            // dispatch(setLoading(true))
                            const _dateData = data?.docs[0]?.data() as DateDataType
                            const _cacheDateData = result.success?.monthlyData?.filter((cacheDateData) => {
                                return cacheDateData.date === date
                            })
                            if (_dateData == undefined && _cacheDateData) {
                                // キャッシュのみデータ存在する場合、キャッシュ使う
                                isDataFetchedRef.current[index] = true
                                displayDateDataRef.current[index] = _cacheDateData[0]
                                return
                            }
                            if (_dateData && _cacheDateData) {
                                if (_cacheDateData[0]?.updatedAt && _dateData.updatedAt && _cacheDateData[0].updatedAt > _dateData?.updatedAt) {
                                    // キャッシュよりDBが古い場合、キャッシュ使う
                                    isDataFetchedRef.current[index] = true
                                    displayDateDataRef.current[index] = _cacheDateData[0]
                                    return
                                }
                            }
                            // dispatch(setLoading(false))
                            isDataFetchedRef.current[index] = true
                            displayDateDataRef.current[index] = _dateData
                        })
                })

                if (result.success) {
                    // console.log('cachetime', Number(new Date()) - Number(date), monthlyData.length > 0 && monthlyData[0].date && toCustomDateFromTotalSeconds(monthlyData[0].date).month == __month?.month)
                    /**
                     * すでにその月のデータが入力されている場合はキャッシュを入れない。
                     */
                    // if (result.success?.monthlyData?.length > 0) return
                    let _monthlyData: DateDataType[] = []
                    _monthlyData = cloneDeep(result.success?.monthlyData?.filter((data) => data !== null))
                    for (const dateData of _monthlyData) {
                        const totalSitesFiltered = dateData.sites?.totalSites?.items?.filter(
                            (site) =>
                                (site.construction?.contract?.orderCompanyId != myCompanyId ||
                                    checkMyDepartment({
                                        targetDepartmentIds: site.construction?.contract?.orderDepartmentIds,
                                        activeDepartmentIds,
                                    })) &&
                                (site.construction?.contract?.receiveCompanyId != myCompanyId ||
                                    checkMyDepartment({
                                        targetDepartmentIds: site.construction?.contract?.receiveDepartmentIds,
                                        activeDepartmentIds,
                                    })),
                        )
                        if (dateData?.sites?.totalSites) {
                            dateData.sites.totalSites.items = totalSitesFiltered ?? []
                        }
                    }
                    dispatch(setLoading(false))
                    setState((rev) => ({ ...rev, monthlyData: _monthlyData ?? [] }))
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
                if (isFocused) {
                    dispatch(setLoading(false))
                    dispatch(setIsNavUpdating(false))
                }
            }
        })()
    }, [myCompanyId, isFetching, isFocused, month])

    useEffect(() => {
        // タイマーが始動する前までのレンダリング
        // 最初にキャッシュがない場合にデータ取得時点でレンダリングするため
        // isDataFetchedRef.current == true（データ取得時）の場合のみレンダリング
        let count = 0
        const timer = setInterval(async () => {
            count++
            if (count >= 10) {
                clearInterval(timer)
                return
            }

            await _setMonthlyData()
        }, 1000)

        return () => {
            clearInterval(timer)
            count = 0
        }
    }, [month, route])

    // タイマーで一定時間ごとにレンダリング
    useEffect(() => {
        if (isScreenOnRef.current) {
            timerRef.current = setInterval(async () => {
                await _setMonthlyData()
            }, 10000)
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }
        }
    }, [isFocused, month])

    // 画面を閉じたときに時にonSnapshotをunsubscribeする
    useEffect(() => {
        return () => {
            if (unsubscribeRef.current && isScreenOnRef.current) {
                isScreenOnRef.current = false
                unsubscribeRef.current.map((unsub: any) => unsub !== null && undefined && unsub.unsubscribe())
                unsubscribeRef.current = new Array(42).fill(null)
                isDataFetchedRef.current = new Array(42).fill(false)

                setState((rev) => ({ ...rev, monthlyData: [] }))
                setDisplayMonthlyData(null)
                setFilter([])
                dispatch(setExpandWeekNumber(-1))
            }
        }
    }, [isFocused])

    useEffect(() => {
        isDataFetchedRef.current = new Array(42).fill(true)
        _setMonthlyData()
    }, [activeDepartmentIds])

    const _setMonthlyData = async () => {
        try {
            // 現場がない日が存在するとmonthlyDataがセットされないため、一旦コメントアウト
            // if (displayDateDataRef.current.some((data) => data === null)) return
            if (!isDataFetchedRef.current.some((data) => data === true)) return
            isDataFetchedRef.current = isDataFetchedRef.current.map((data) => (data === true ? false : data))

            const _monthlyData = displayDateDataRef.current?.filter((data) => data)

            for (const dateData of _monthlyData) {
                const totalSitesFiltered = dateData.sites?.totalSites?.items?.filter(
                    (site) =>
                        (site.construction?.contract?.orderCompanyId != myCompanyId ||
                            checkMyDepartment({
                                targetDepartmentIds: site.construction?.contract?.orderDepartmentIds,
                                activeDepartmentIds,
                            })) &&
                        (site.construction?.contract?.receiveCompanyId != myCompanyId ||
                            checkMyDepartment({
                                targetDepartmentIds: site.construction?.contract?.receiveDepartmentIds,
                                activeDepartmentIds,
                            })),
                )
                if (dateData?.sites?.totalSites) {
                    dateData.sites.totalSites.items = totalSitesFiltered ?? []
                }
                // 発注管理下工事を一旦非表示にする
                // https://gitlab.com/coreca-inc/coreca-app/-/issues/1386
                const _totalSitesFiltered = dateData.sites?.totalSites?.items?.filter((site) => !site.siteRelation?.includes('order-children'))
                if (dateData?.sites?.totalSites) {
                    dateData.sites.totalSites.items = _totalSitesFiltered ?? []
                }
            }

            const cacheResult = await _updateCachedData()
            if (cacheResult.error) {
                throw {
                    error: cacheResult.error,
                    errorCode: cacheResult.errorCode,
                }
            }

            setState((prev) => ({
                ...prev,
                isFetching: false,
                monthlyData: _monthlyData,
            }))
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    const _updateCachedData = async (): Promise<CustomResponse> => {
        try {
            const _monthlyData = displayDateDataRef.current?.filter((data) => data)
            await updateCachedData({ key: cachedKeyRef.current as string, value: { monthlyData: _monthlyData ?? [] } })

            return Promise.resolve({ success: undefined })
        } catch (error) {
            return getErrorMessage(error)
        }
    }

    const _onRefresh = async () => {
        setState((prev) => ({ ...prev, isFetching: true }))
    }

    useEffect(() => {
        setState((prev) => ({ ...prev, month: month ?? thisMonth }))
    }, [route])

    /**
     * sync実装のため。先にisFetchingを先にtrueにすることで、時間を少なくする。
     * Hiruma
     */
    const _onDateChange = async (_month: CustomDate, isFetched?: boolean, fetchedData?: ExtendedDateDataType) => {
        // __DEV__ && logger.logAccessInfo('\n5. onDateChangeイベントハンドラ')
        // if (isFetched) {
        //     setState((rev) => ({ ...rev, month: _month, monthlyData: [], projects: fetchedData?.projects ?? [] }))
        // } else {
        setState((prev) => ({ ...prev, month: _month, monthlyData: [], isFetching: true }))
        // }
    }

    const __filterSite = (_filter: string[]): DateDataType[] => {
        let _monthlyData: DateDataType[] = []
        _monthlyData = cloneDeep(monthlyData)
        if (_filter.includes('自社施工')) {
            for (const dateData of _monthlyData) {
                const totalSitesFiltered = dateData.sites?.totalSites?.items?.filter((site) => site.siteRelation == 'manager')
                if (dateData?.sites?.totalSites) {
                    dateData.sites.totalSites.items = totalSitesFiltered ?? []
                }
            }
            // 発注管理下工事を一旦非表示にする
            // https://gitlab.com/coreca-inc/coreca-app/-/issues/1386
            // } else if (_filter.includes('請負発注')) {
            //     for (const dateData of _monthlyData) {
            //         const totalSitesFiltered = dateData.sites?.totalSites?.items?.filter((site) => site.siteRelation?.includes('order-children') || site.siteRelation?.includes('fake-company-manager'))
            //         if (dateData?.sites?.totalSites) {
            //             dateData.sites.totalSites.items = totalSitesFiltered ?? []
            //         }
            //     }
        } else if (_filter.includes('常用')) {
            for (const dateData of _monthlyData) {
                const totalSitesFiltered = dateData.sites?.totalSites?.items?.filter((site) => site.siteRelation == 'other-company')
                if (dateData?.sites?.totalSites) {
                    dateData.sites.totalSites.items = totalSitesFiltered ?? []
                }
            }
        } else {
            for (const dateData of _monthlyData) {
                if (dateData?.sites?.totalSites) {
                    dateData.sites.totalSites.items = dateData.sites?.totalSites?.items ?? []
                }
            }
        }
        return _monthlyData
    }

    useEffect(() => {
        //  フィルタ＝適用時のみ処理を行う
        if (filter.length === 0 || filter.includes('すべて')) {
            return
        }
        const filteredMonthlyData = __filterSite(filter)
        const isDisplayMonthlyDataUpdated = JSON.stringify(displayMonthlyData) != JSON.stringify(filteredMonthlyData)
        if (isDisplayMonthlyDataUpdated) {
            setDisplayMonthlyData(filteredMonthlyData)
        }
    }, [filter, monthlyData, month, activeDepartments])

    const __header = useCallback(() => {
        return (
            <View
                style={{
                    height: HEADER_HEIGHT,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 10,
                }}>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                    <AppButton
                        title={t('admin:Case')}
                        iconName="plus"
                        height={35}
                        fontSize={12}
                        style={{
                            paddingHorizontal: 10,
                            marginRight: 10,
                        }}
                        onPress={() => {
                            navigation.push('CreateConstruction', {
                                routeNameFrom: 'AdminHome',
                                selectedDate: month,
                            })

                            // タップした日付はStoreで取得（re-renderされて日付が伸びなくなるのを防止）
                            // navigation.push('SelectCompany', {
                            //     selectCompany: {
                            //         withoutMyCompany: true,
                            //         title: `${t('common:SelectCustomerClient')}`,
                            //     },
                            //     routeNameFrom: 'AdminHome',
                            //     initStartDate: month,
                            // })
                        }}
                    />
                    <Filter
                        // 発注管理下工事を一旦非表示にする
                        // https://gitlab.com/coreca-inc/coreca-app/-/issues/1386
                        // items={[t('common:All'), t('common:InHouseConstruction'), t('common:ContractOrder'), t('common:Support')]}
                        items={[t('common:All'), t('common:InHouseConstruction'), t('common:Support')]}
                        selectedItems={filter}
                        onChange={(filter) => {
                            setFilter(filter)
                            if (filter.length === 0 || filter.includes('すべて')) {
                                setDisplayMonthlyData(null)
                            }
                            ;(async () => {
                                await updateCachedData({
                                    key: cachedFilterKey,
                                    value: filter.length == 0 ? 'すべて' : filter[0],
                                })
                            })()
                        }}
                        title={t('admin:KindsOfSiteToDisplay')}
                        style={{
                            paddingVertical: 5,
                        }}
                        selectNum={1}
                    />
                    <SelectButton
                        height={20}
                        fontSize={10}
                        style={{
                            flex: 1.5,
                        }}
                        items={SWITCH_TEXT_LIST}
                        selected={displayMode ?? SWITCH_TEXT_ONLY_NEW}
                        isGlobalLayoutWidth={true}
                        onChangeItem={(value) => {
                            updateCachedData({
                                key: displayModeKey,
                                value: value,
                            })
                            setState((prev) => ({ ...prev, displayMode: value as SwitchDisplayType }))
                            if (value == SWITCH_TEXT_ONLY_NEW) {
                                dispatch(
                                    setToastMessage({
                                        text: t('common:DisplayOmittedExceptForNew'),
                                        type: 'info',
                                    }),
                                )
                            }
                            // if (value == SWITCH_TEXT_SMART) {
                            //     dispatch(
                            //         setToastMessage({
                            //             text: t('common:SmartDisplayOmittedExceptForNew'),
                            //             type: 'info',
                            //             time: 5000
                            //         }),
                            //     )
                            // }
                        }}
                    />
                </View>
            </View>
        )
    }, [displayMode, filter])

    const __monthlyFirstDay = useMemo(() => (month ? getMonthlyFirstDay(month) : undefined), [month])
    const __firstDay = useMemo(() => (__monthlyFirstDay ? getDailyStartTime(nextDay(__monthlyFirstDay, -__monthlyFirstDay.dayOfWeek)) : undefined), [__monthlyFirstDay])

    const content = useCallback(
        () => (
            <View
                style={{
                    paddingTop: CALENDER_MARGIN_TOP,
                }}>
                {__header()}
                {/* firstDateはキャッシュにおけるCustomDateの復元失敗を考慮する。 */}
                <HomeCalendarMonth
                    // useSmartDisplay={displayMode == SWITCH_TEXT_SMART}
                    useOnlyNewSiteDisplay={displayMode == SWITCH_TEXT_ONLY_NEW}
                    dayHeight={CALENDER_DAY_BASE_HEIGHT}
                    firstDate={
                        // monthlyData?.[0]?.date
                        __firstDay
                    }
                    dateData={displayMonthlyData === null ? monthlyData : displayMonthlyData}
                    month={month ?? thisMonth}
                />
            </View>
        ),
        [__header, displayMode, monthlyData, displayMonthlyData, __firstDay],
    )

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: THEME_COLORS.OTHERS.BACKGROUND,
            }}>
            <PermissionModal type={'admin'} />
            <SwitchPage
                dateUpdate={dateUpdate}
                data={[]}
                header={content}
                content={() => <></>}
                onDateChange={_onDateChange}
                dateType={'month'}
                dateInitValue={thisMonth}
                onRefresh={_onRefresh}
                scrollEnabled={false}
                inputData={{ monthlyData: monthlyData, projects: projects } as ExtendedDateDataType}
                screenName={'AdminHome'}
            />
        </View>
    )
}

export default AdminHome

const styles = StyleSheet.create({})
