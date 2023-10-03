import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/core'
import { RootStackParamList } from '../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { AttendanceCLType } from '../../models/attendance/Attendance'
import { SiteProps } from '../../components/organisms/site/Site'
import { getUnreportedAttendanceListOfTargetWorker } from '../../usecases/worker/WorkerHomeCase'
import { StoreType } from '../../stores/Store'
import { setLoading, setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { SiteCLType } from '../../models/site/Site'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { updateCachedData, getCachedData, genKeyName } from '../../usecases/CachedDataCase'
import { CustomDate, isToday, newCustomDate, timeBaseText, toCustomDateFromTotalSeconds } from '../../models/_others/CustomDate'
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

type CachedWorkerHomeType = {
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

const MySchedule = () => {
    const { t, i18n } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ attendances, isOpen, unReportedAttendances, refreshing, isFetching, updateCache }, setState] = useState(initialState)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account?.signInUser?.accountId ?? '')
    const cachedMyScheduleKey = genKeyName({ screenName: 'MySchedule', accountId: accountId, workerId: myWorkerId ?? '' })

    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)

    const onPressSite = (site: SiteCLType, requestId?: string) => {
        navigation.push('SiteDetail', {
            siteId: site.siteId,
            title: requestId ? t('admin:SupportRequestDetails') : t('admin:SiteDetails'),
            target: 'SiteDetail',
            requestId: requestId,
        })
    }

    useSafeUnmount(setState, initialState)

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

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
    //             const result = await getCachedData< CachedWorkerHomeType[]>(cachedMyScheduleKey)
    //             // __DEV__ && logger.logPerformance({place: 'getCachedData（キャッシュの有無確認のみ）'})
    //             if (result.error) {
    //                 // __DEV__ && console.log('1-1. キャッシュデータなし')
    //                 setState((prev) => ({ ...prev, isFetching: true }))
    //             }
    //             else {
    //                 // __DEV__ && console.log('1-2. キャッシュデータあり:\nkey: ' + cachedMyScheduleKey)
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
                const isUpdateResult = await checkUpdateOfTargetScreen({
                    accountId: accountId,
                    targetScreenName: 'MySchedule',
                    localUpdateScreens,
                })
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
                // __DEV__ && console.log('2-1. KVSから表示データを取得して更新\nkey: ' + cachedMyScheduleKey)
                // __DEV__ && logger.anchor()
                const result = await getCachedData<CachedWorkerHomeType>(cachedMyScheduleKey)
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
                        attendance.onPress = () =>
                            onPressSite(
                                attendance.site as SiteCLType,
                                attendance.site?.companyRequests?.receiveRequests?.items && attendance?.site.companyRequests?.receiveRequests?.items[0]?.requestId,
                            )
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
                // __DEV__ && logger.logAccessInfo(`3. updateフラグが変化した時の副作用フック（getDat関数をコール） upodate: ${isFetching}`)
                await getData()
                dispatch(setIsNavUpdating(false))
                setState((prev) => ({ ...prev, isFetching: false }))
            })()
        }
    }, [isFetching])

    const openAttendance = (futureList: _SiteUIType[]) => {
        let hitFlag: boolean = false
        const nowText = timeBaseText(newCustomDate())

        futureList.forEach((attendance) => {
            if (hitFlag) {
                return
            }

            if (isToday(attendance.site?.startDate as CustomDate)) {
                if (
                    attendance.arrangement?.attendance?.startDate == undefined &&
                    attendance.arrangement?.attendanceModification?.modificationInfo.startDate == undefined &&
                    attendance.arrangement?.attendance?.isAbsence != true &&
                    (attendance.site?.siteDate || attendance.site?.meetingDate) &&
                    nowText >= timeBaseText(attendance.site?.meetingDate ?? toCustomDateFromTotalSeconds(attendance.site?.siteDate as number))
                ) {
                    navigation.push('AttendanceDetail', {
                        arrangementId: attendance.arrangement?.arrangementId,
                        attendanceId: attendance.arrangement?.attendance?.attendanceId,
                        siteId: attendance.site?.siteId ?? 'no-id',
                    })
                    hitFlag = true
                } else if (
                    attendance.arrangement?.attendance?.endDate == undefined &&
                    attendance.arrangement?.attendanceModification?.modificationInfo.endDate == undefined &&
                    attendance.arrangement?.attendance?.isAbsence != true &&
                    nowText >= timeBaseText(attendance.site?.endDate as CustomDate)
                ) {
                    navigation.push('AttendanceDetail', {
                        arrangementId: attendance.arrangement?.arrangementId,
                        attendanceId: attendance.arrangement?.attendance?.attendanceId,
                        siteId: attendance.site?.siteId ?? 'no-id',
                    })
                    hitFlag = true
                }
            }
        })
    }

    const getData = async () => {
        // __DEV__ && logger.logAccessInfo('4. getData関数（フェッチ実行とKVS更新）')
        try {
            if (isFocused) dispatch(setLoading(true))
            // __DEV__ && logger.logAccessWarning('5-1. フェッチ実行')
            // __DEV__ && logger.anchor()
            const rtnObj = await getUnreportedAttendanceListOfTargetWorker({ workerId: myWorkerId as string, companyId: myCompanyId })
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
                    onPress: () => onPressSite(site, site.companyRequests?.receiveRequests?.items && site.companyRequests?.receiveRequests?.items[0]?.requestId),
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

            openAttendance(futureList)

            // __DEV__ && console.log('5-2、KVSを更新\n' + cachedMyScheduleKey)
            // __DEV__ && logger.anchor()
            const cachedResult = await updateCachedData({
                key: cachedMyScheduleKey,
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
            await deleteScreenOfUpdateScreens({ accountId, screenName: 'MySchedule' })
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
            isAdmin={true}
        />
    )
}
export default MySchedule

const styles = StyleSheet.create({})
