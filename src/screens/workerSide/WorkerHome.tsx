import React, { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/core'
import { RootStackParamList } from '../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { AttendanceCLType } from '../../models/attendance/Attendance'
import { SiteProps } from '../../components/organisms/site/Site'
import { getUnreportedAttendanceListOfTargetWorker } from '../../usecases/worker/WorkerHomeCase'
import { StoreType } from '../../stores/Store'
import { setIsBottomOff, setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { SiteCLType } from '../../models/site/Site'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { updateCachedData, getCachedData, genKeyName } from '../../usecases/CachedDataCase'
import { getDailyStartTime, newCustomDate, nextDay, nextHour, nextMinute } from '../../models/_others/CustomDate'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import { useTextTranslation } from './../../fooks/useTextTranslation'

// import { createLogger } from '../../services/_others/LoggerServiceNative' // for log rerendering
import { useSafeLoadingUnmount, useSafeUnmount } from '../../fooks/useUnmount'
import { setIsNavUpdating } from '../../stores/NavigationSlice'
import { checkUpdateOfTargetScreen, deleteScreenOfUpdateScreens } from '../../usecases/updateScreens/CommonUpdateScreensCase'
import WorkerSchedule from '../../components/template/WorkerSchedule'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    attendances: _SiteUIType[]
    unReportedAttendances: AttendanceCLType[]
    isOpen: boolean
    refreshing: boolean
    isFetching: boolean
    updateCache: number
}

export type CachedWorkerHomeType = {
    attendances: _SiteUIType[]
    unReportedAttendances: AttendanceCLType[]
}

type _SiteUIType = Partial<SiteProps>

const initialState: InitialStateType = {
    attendances: [],
    unReportedAttendances: [],
    isOpen: false,
    refreshing: false,
    isFetching: false,
    updateCache: 0,
}

// const logger = createLogger() // for log rerendering

const WorkerHome = () => {
    const { t, i18n } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ attendances, isOpen, unReportedAttendances, refreshing, isFetching, updateCache }, setState] = useState(initialState)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const accountId = useSelector((state: StoreType) => state.account?.signInUser?.accountId ?? '')
    const isBottomOff = useSelector((state: StoreType) => state.util?.isBottomOff)
    const cachedWorkerHomeKey = genKeyName({ screenName: 'workerHome', accountId: accountId, workerId: myWorkerId ?? '' })

    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)

    const isCacheUpdatedForStartRef = React.useRef(false)
    const isCacheUpdatedForEndRef = React.useRef(false)

    const onPressSite = (site: SiteCLType) => {
        navigation.push('WSiteRouter', { siteId: site.siteId })
    }

    useSafeUnmount(setState, initialState)

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isFocused])

    useSafeLoadingUnmount(dispatch, isFocused)

    /**
     * @summary mount時の副作用フック（表示データを初期化）
     * @author Okuda
     */
    // useEffect(() => {
    //     // __DEV__ && logger.logAccessInfo('1. mount時の副作用フック（表示データを初期化）')
    //     ;(async () => {
    //         if(myWorkerId) {
    //             // __DEV__ && logger.anchor()
    //             const result = await getCachedData< CachedWorkerHomeType[]>(cachedWorkerHomeKey)
    //             // __DEV__ && logger.logPerformance({place: 'getCachedData（キャッシュの有無確認のみ）'})
    //             if (result.error) {
    //                 // __DEV__ && console.log('1-1. キャッシュデータなし')
    //                 setState((prev) => ({ ...prev, isFetching: true }))
    //             }
    //             else {
    //                 // __DEV__ && console.log('1-2. キャッシュデータあり:\nkey: ' + cachedWorkerHomeKey)
    //                 setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))
    //             }
    //         }
    //     })()
    // }, [myWorkerId])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))

            /**
             * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
             */
            ;(async () => {
                const isUpdateResult = await checkUpdateOfTargetScreen({ accountId: accountId, targetScreenName: 'WorkerHome', localUpdateScreens })
                if (isUpdateResult.success) {
                    dispatch(setIsNavUpdating(true))
                }
            })()
        }
    }, [isFocused, myWorkerId])

    /**
     * @summary updateCacheフラグが変化した時の副作用フック（KVSから表示データを取得更新）
     * @purpose アプリ側にKVSによるキャッシュを設けて一覧の初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        if (updateCache) {
            // __DEV__ && logger.logAccessInfo('2. updateCacheフラグが変化した時の副作用フック（KVSから表示データを取得更新）')
            ;(async () => {
                // __DEV__ && console.log('2-1. KVSから表示データを取得して更新\nkey: ' + cachedWorkerHomeKey)
                // __DEV__ && logger.anchor()
                const result = await getCachedData<CachedWorkerHomeType>(cachedWorkerHomeKey)
                // __DEV__ && logger.logPerformance({place: 'getCachedData'})
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
                } else {
                    //キャッシュでイベントハンドラが吹き飛ぶので
                    result.success?.attendances.forEach((attendance) => {
                        attendance.onPress = () => onPressSite(attendance.site as SiteCLType)
                    })
                    setState((rev) => ({
                        ...rev,
                        unReportedAttendances: result.success?.unReportedAttendances as AttendanceCLType[],
                        attendances: result.success?.attendances as _SiteUIType[],
                    }))
                }
            })()
        }
    }, [updateCache])

    useEffect(() => {
        if (isFetching == true) {
            ;(async () => {
                await getData()
                dispatch(setIsNavUpdating(false))
                setState((prev) => ({ ...prev, isFetching: false }))
                const newLocalUpdateScreens = localUpdateScreens.filter((screen) => screen.screenName != 'WorkerHome')
                dispatch(setLocalUpdateScreens(newLocalUpdateScreens))
            })()
        }
    }, [isFetching])

    // const openAttendance = (futureList: _SiteUIType[]) => {
    //     let hitFlag: boolean = false
    //     const nowText = timeBaseText(newCustomDate())

    //     futureList.forEach((attendance) => {
    //         if (hitFlag) {
    //             return
    //         }

    //       if (isToday(attendance.site?.startDate as CustomDate)) {
    //         if (
    //             attendance.arrangement?.attendance?.startDate == undefined &&
    //             attendance.arrangement?.attendanceModification?.modificationInfo.startDate == undefined &&
    //             attendance.arrangement?.attendance?.isAbsence != true &&
    //             (attendance.site?.meetingDate || attendance.site?.siteDate) &&
    //             nowText >= timeBaseText(attendance.site?.meetingDate ?? toCustomDateFromTotalSeconds(attendance.site?.siteDate as number))
    //         ) {
    //             navigation.push('AttendancePopup', {
    //                 arrangementId: attendance.arrangement?.arrangementId,
    //                 attendanceId: attendance.arrangement?.attendance?.attendanceId,
    //                 type: 'start',
    //             })
    //             hitFlag = true
    //         } else if (
    //             attendance.arrangement?.attendance?.endDate == undefined &&
    //             attendance.arrangement?.attendanceModification?.modificationInfo.endDate == undefined &&
    //             attendance.arrangement?.attendance?.isAbsence != true &&
    //             nowText >= timeBaseText(attendance.site?.endDate as CustomDate)
    //         ) {
    //             navigation.push('AttendancePopup', {
    //                 arrangementId: attendance.arrangement?.arrangementId,
    //                 attendanceId: attendance.arrangement?.attendance?.attendanceId,
    //                 type: 'end',
    //             })
    //             hitFlag = true
    //         }
    //       }
    //     })
    // }

    const getData = async () => {
        // __DEV__ && logger.logAccessInfo('4. getData関数（フェッチ実行とKVS更新）')

        try {
            if (isFocused) dispatch(setLoading(true))
            // __DEV__ && logger.logAccessWarning('5-1. フェッチ実行')
            // __DEV__ && logger.anchor()
            const rtnObj = await getUnreportedAttendanceListOfTargetWorker({ workerId: myWorkerId as string })
            // __DEV__ && logger.logPerformance( {place: 'getUnreportedAttendanceListOfTargetWorker'} )

            if (rtnObj.error) {
                throw {
                    error: rtnObj.error,
                } as CustomResponse
            }
            const futureList = rtnObj.success?.sites
                .filter((site) => site != undefined)
                .map((site, idx) => ({
                    site: site,
                    arrangement: rtnObj.success?.arrangements.filter((arr) => arr.siteId == site.siteId)[0],
                    onPress: () => onPressSite(site),
                    canEditAttendance: !rtnObj.success?.arrangements.filter((arr) => arr.siteId == site.siteId)[0]?.attendance?.isReported,
                })) as _SiteUIType[]
            /**
             * キャッシュアップデート前に先に表示データを更新。
             */
            setState((prev) => ({
                ...prev,
                unReportedAttendances: rtnObj.success?.unReportedAttendances as AttendanceCLType[],
                attendances: futureList,
            }))

            // openAttendance(futureList)

            // __DEV__ && console.log('5-2、KVSを更新\n' + cachedWorkerHomeKey)
            // __DEV__ && logger.anchor()
            const cachedResult = await updateCachedData({
                key: cachedWorkerHomeKey,
                value: {
                    unReportedAttendances: rtnObj.success?.unReportedAttendances as AttendanceCLType[],
                    attendances: futureList,
                } as CachedWorkerHomeType,
            })
            // __DEV__ && logger.logPerformance({ place: 'updateCachedData' })
            if (cachedResult.error) {
                dispatch(
                    setToastMessage({
                        text: cachedResult.error,
                        type: 'error',
                    }),
                )
            }
            await deleteScreenOfUpdateScreens({ accountId, screenName: 'WorkerHome' })
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
            }
        }
    }

    /**
     * 30分毎にデータ取得
     */
    useEffect(() => {
        const timer = setInterval(async () => {
            await getData()
        }, 1800 * 1000)

        return () => clearInterval(timer)
    }, [isFocused])

    const attendanceOfToday = useMemo(() => {
        return attendances?.filter((attendance) => attendance?.arrangement?.site?.siteDate && attendance?.arrangement?.site?.siteDate == getDailyStartTime(newCustomDate()).totalSeconds)
    }, [attendances])

    const startDateOfToday = useMemo(() => {
        return attendanceOfToday?.map((attendance) => attendance?.arrangement?.site?.startDate)
    }, [attendanceOfToday])

    const attendanceOfYesterday = useMemo(() => {
        return unReportedAttendances?.filter(
            (attendance) => attendance?.arrangement?.site?.siteDate && attendance?.arrangement?.site?.siteDate == nextDay(getDailyStartTime(newCustomDate()), -1).totalSeconds,
        )
    }, [unReportedAttendances])

    const _openAttendance = async (attendanceList: AttendanceCLType[] | _SiteUIType[], type: 'start' | 'end') => {
        attendanceList.forEach((attendance) => {
            if (
                type == 'start' &&
                attendance.arrangement?.attendance?.startDate == undefined &&
                attendance.arrangement?.attendanceModification?.modificationInfo.startDate == undefined &&
                attendance.arrangement?.attendance?.isAbsence != true &&
                attendance.arrangement?.site?.startDate
            ) {
                navigation.push('AttendancePopup', {
                    arrangementId: attendance.arrangement?.arrangementId,
                    attendanceId: attendance.arrangement?.attendance?.attendanceId,
                    type: 'start',
                    disableCloseButton: true,
                    cachedWorkerHomeKey: cachedWorkerHomeKey,
                })
                isCacheUpdatedForStartRef.current = true
                dispatch(setIsBottomOff(true))
            }
            if (
                type == 'end' &&
                attendance.arrangement?.attendance?.endDate == undefined &&
                attendance.arrangement?.attendanceModification?.modificationInfo.endDate == undefined &&
                attendance.arrangement?.attendance?.isAbsence != true &&
                attendance.arrangement?.site?.endDate
            ) {
                navigation.push('AttendancePopup', {
                    arrangementId: attendance.arrangement?.arrangementId,
                    attendanceId: attendance.arrangement?.attendance?.attendanceId,
                    type: 'end',
                    disableCloseButton: true,
                    cachedWorkerHomeKey: cachedWorkerHomeKey,
                })
                isCacheUpdatedForEndRef.current = true
                dispatch(setIsBottomOff(true))
            }
        })
    }

    const _noticeAtHour = nextHour(getDailyStartTime(newCustomDate()), 7)
    const _noticeAt = nextMinute(_noticeAtHour, 0)

    const _checkUnreportedAttendanceForStart = async () => {
        const now = newCustomDate()
        /**
         * 現場開始30分後に、作業開始報告がない場合に勤怠報告ポップアップを表示
         */
        const isUnreportedStart = startDateOfToday?.filter((startDate) => startDate && startDate?.totalSeconds < nextMinute(now, -30).totalSeconds).length > 0
        if (isUnreportedStart) {
            await _openAttendance(attendanceOfToday, 'start')
        }
    }

    const _checkUnreportedAttendanceForEnd = async () => {
        const now = newCustomDate()
        /**
         * 午前7時に、前日現場の作業終了報告がない場合に勤怠報告ホップアップを表示
         */
        const isUnreportedEnd = attendanceOfYesterday.length > 0
        const isNoticeTime = now.totalSeconds >= _noticeAt.totalSeconds
        if (isUnreportedEnd && isNoticeTime) {
            await _openAttendance(attendanceOfYesterday, 'end')
        }
    }

    useEffect(() => {
        if (isBottomOff) return
        if (!isFocused) return
        if (attendanceOfToday?.length == 0) return
        /**
         * ポップアップ自動表示で勤怠登録後のみ少し遅らす
         * 早いと再度ポップアップが開く場合があるため
         */
        const delay = isCacheUpdatedForStartRef?.current ? 10 : 0
        const timer = setTimeout(() => {
            _checkUnreportedAttendanceForStart()
            isCacheUpdatedForStartRef.current = false
        }, delay * 1000)

        const interval = setInterval(() => {
            _checkUnreportedAttendanceForStart()
        }, 300 * 1000)

        return () => {
            clearInterval(interval)
            clearTimeout(timer)
        }
    }, [attendanceOfToday, isFocused])

    useEffect(() => {
        if (isBottomOff) return
        if (!isFocused) return
        if (unReportedAttendances?.length == 0) return
        /**
         * ポップアップ自動表示で勤怠登録後のみ少し遅らす
         * 早いと再度ポップアップが開く場合があるため
         */
        const delay = isCacheUpdatedForEndRef?.current ? 10 : 0
        const timer = setTimeout(() => {
            _checkUnreportedAttendanceForEnd()
            isCacheUpdatedForEndRef.current = false
        }, delay * 1000)

        const interval = setInterval(() => {
            _checkUnreportedAttendanceForEnd()
        }, 300 * 1000)

        return () => {
            clearInterval(interval)
            clearTimeout(timer)
        }
    }, [attendanceOfYesterday, isFocused])

    return (
        <WorkerSchedule
            attendances={attendances}
            isOpen={isOpen}
            unReportedAttendances={unReportedAttendances}
            refreshing={refreshing}
            onPressToggle={() => setState((prev) => ({ ...prev, isOpen: !isOpen }))}
            onRefresh={async () => {
                setState((prev) => ({ ...prev, refreshing: true }))
                // __DEV__ && logger.logAccessInfo('6. リフレッシュ時にgetDate関数実行')
                await getData()
                setState((prev) => ({ ...prev, refreshing: false }))
            }}
            isAdmin={false}
        />
    )
}
export default WorkerHome

const styles = StyleSheet.create({})
