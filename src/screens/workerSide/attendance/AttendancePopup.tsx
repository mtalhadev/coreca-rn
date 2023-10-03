/* eslint-disable indent */
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, StyleSheet, Pressable, AppState, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { ScrollView } from 'react-native-gesture-handler'
import { AttendanceReportCL } from '../../../components/organisms/attendance/AttendanceReportCL'
import { Icon } from '../../../components/atoms/Icon'
import { AppButton } from '../../../components/atoms/AppButton'
import { LOCK_INTERVAL_TIME, THEME_COLORS } from '../../../utils/Constants'
import { FontStyle, GlobalStyles, GreenColor } from '../../../utils/Styles'
import { Line } from '../../../components/atoms/Line'
import { newDate } from '../../../utils/ext/Date.extensions'
import { compareWithToday, CustomDate, getTextBetweenAnotherDate, timeBaseText, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { TableArea } from '../../../components/atoms/TableArea'
import { SiteCLType } from '../../../models/site/Site'
import { AttendanceCLType } from '../../../models/attendance/Attendance'
import { setIsBottomOff, setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { UpdateAttendanceParam, getSiteAndAttendance, updateAttendance } from '../../../usecases/attendance/WorkerAttendanceCase'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { InputDateTimeBox } from '../../../components/organisms/inputBox/InputDateTimeBox'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { LocationInfoType } from '../../../models/_others/LocationInfoType'
import { reportTypeToPartialAttendanceCLType } from '../../../components/organisms/attendance/DatePickButton'
import { getCurrentLocation } from '../../../services/_others/LocationService'
import { Checkbox } from '../../../components/atoms/Checkbox'
import { ToggleMenu } from '../../../components/organisms/ToggleMenu'
import { checkLockOfTarget, updateLockOfTarget } from '../../../usecases/lock/CommonLockCase'
import { StoreType } from '../../../stores/Store'
import { useIsFocused } from '@react-navigation/native'
import { checkIsHolidayWorker } from '../../../usecases/worker/WorkerListCase'
import { WorkerCLType, WorkerType } from '../../../models/worker/Worker'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { UpdateScreenType } from '../../../models/updateScreens/UpdateScreens'
import { useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { updateAttendanceModification } from '../../../usecases/attendance/WorkerAttendanceModificationCase'
import { AttendanceModificationCLType } from '../../../models/attendanceModification/AttendanceModification'
import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'
import isEmpty from 'lodash/isEmpty'
import { genKeyName, getCachedData, updateCachedData } from '../../../usecases/CachedDataCase'
import { CachedWorkerHomeType } from '../WorkerHome'
import { _updateAccount } from '../../../services/account/AccountService'

type NavProps = StackNavigationProp<RootStackParamList, 'AttendancePopup'>
type RouteProps = RouteProp<RootStackParamList, 'AttendancePopup'>

export type PopupType = 'start' | 'end'

type InitialStateType = {
    type?: PopupType
    attendanceId?: string
    arrangementId?: string
    attendance?: AttendanceCLType
    attendanceModification?: AttendanceModificationCLType
    site?: SiteCLType
    worker?: WorkerCLType
    /**
     * 非同期でattendanceが古い状態で同期されるため。ここで変更を検出。
     */
    newLocation?: LocationInfoType
    overtimeWork?: CustomDate
    midnightWorkTime?: CustomDate
    isHolidayWork?: boolean
    isFirstReport?: boolean
}

const initialState: InitialStateType = {
    type: 'end',
}
const AttendancePopup = () => {
    const { t, i18n } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId)
    const holidays = useSelector((state: StoreType) => state.util.holidays)
    const localUpdateScreens = useSelector((state: StoreType) => state.util.localUpdateScreens)
    const isBottomOff = useSelector((state: StoreType) => state.util.isBottomOff)
    const isFocused = useIsFocused()
    const [appState, setAppState] = useState(AppState.currentState)
    const [{ type, attendanceId, newLocation, site, attendance, attendanceModification, worker, arrangementId, overtimeWork, midnightWorkTime, isHolidayWork, isFirstReport }, setState] =
        useState(initialState)
    const dispatch = useDispatch()

    useEffect(() => {
        setState((prev) => ({ ...prev, arrangementId: route?.params?.arrangementId, attendanceId: route?.params?.attendanceId, type: route?.params?.type }))
    }, [])

    useEffect(() => {
        return () => setState(initialState)
    }, [myWorkerId])
    useSafeLoadingUnmount(dispatch, isFocused)
    useEffect(() => {
        ;(async () => {
            try {
                if (attendanceId == undefined && arrangementId == undefined) {
                    return
                }

                if (isFocused) dispatch(setLoading(true))
                const result = await getSiteAndAttendance({ attendanceId, arrangementId })
                if (isFocused) dispatch(setLoading(false))

                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
                const _worker = result.success?.attendance?.worker
                const _site = result.success?.site
                /**
                 * 休日なら休日出勤をデフォルトオン
                 */
                const _isHolidayWork =
                    result.success?.attendance?.isHolidayWork ?? checkIsHolidayWorker(_worker as WorkerType, _site?.meetingDate ?? toCustomDateFromTotalSeconds(_site?.siteDate ?? 0), holidays)
                setState((prev) => ({
                    ...prev,
                    attendanceId: result.success?.attendance?.attendanceId,
                    attendance: {
                        ...result.success?.attendance,
                        isHolidayWork: _isHolidayWork,
                        /**
                         * 作業開始の現在地受け渡し。startReportやendReportの更新時に上書きされないように。
                         */
                        ...(type == 'start'
                            ? {
                                  startLocationInfo: route?.params?.location,
                              }
                            : {
                                  endLocationInfo: route?.params?.location,
                              }),
                    },
                    attendanceModification: result.success?.attendanceModification,
                    worker: _worker,
                    site: _site,
                }))

                if (attendance && result.success?.attendanceModification?.status != 'approved') {
                    if (result.success?.attendanceModification?.modificationInfo.overtimeWork) {
                        attendance.overtimeWork = result.success?.attendanceModification?.modificationInfo.overtimeWork
                    }
                    if (result.success?.attendanceModification?.modificationInfo.midnightWorkTime) {
                        attendance.midnightWorkTime = result.success?.attendanceModification?.modificationInfo.midnightWorkTime
                    }
                    if (result.success?.attendanceModification?.modificationInfo.isHolidayWork) {
                        attendance.isHolidayWork = result.success?.attendanceModification?.modificationInfo.isHolidayWork
                    }
                    if (result.success?.attendanceModification?.modificationInfo.startDate) {
                        attendance.startDate = result.success?.attendanceModification?.modificationInfo.startDate
                    }
                    if (result.success?.attendanceModification?.modificationInfo.endDate) {
                        attendance.endDate = result.success?.attendanceModification?.modificationInfo.endDate
                    }
                    if (result.success?.attendanceModification?.modificationInfo.behindTime) {
                        attendance.behindTime = result.success?.attendanceModification?.modificationInfo.behindTime
                    }
                    if (result.success?.attendanceModification?.modificationInfo.earlyLeaveTime) {
                        attendance.earlyLeaveTime = result.success?.attendanceModification?.modificationInfo.earlyLeaveTime
                    }
                }

                //画面起動時にMapコンポーネントで位置情報を取得するが、attendanceデータの読み込みより早い場合、位置情報がattendanceにセットされないのを防ぐ
                const __location = await getCurrentLocation()

                const newLocation = {
                    latitude: __location.success?.coords.latitude,
                    longitude: __location.success?.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }

                if (type == 'start') {
                    setState((prev) => ({ ...prev, attendance: { ...attendance, startLocationInfo: newLocation } }))
                } else {
                    setState((prev) => ({ ...prev, attendance: { ...attendance, endLocationInfo: newLocation } }))
                }
                if (result.success?.attendance?.endDate == undefined && result.success?.attendance?.isAbsence != true) {
                    setState((prev) => ({ ...prev, isFirstReport: true }))
                }
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            }
        })()
    }, [site?.siteId, attendanceId])

    useEffect(() => {
        if (attendanceId && site?.siteId && myWorkerId && appState == 'active' && isFocused) {
            ;(async () => {
                try {
                    const siteLockResult = await checkLockOfTarget({
                        myWorkerId: myWorkerId ?? 'no-id',
                        targetId: site?.siteId ?? 'no-id',
                        modelType: 'site',
                    })
                    if (siteLockResult.error) {
                        throw {
                            error: siteLockResult.error,
                        }
                    }
                    const attendanceLockResult = await checkLockOfTarget({
                        myWorkerId: myWorkerId ?? 'no-id',
                        targetId: attendanceId ?? 'no-id',
                        modelType: 'attendance',
                    })
                    if (attendanceLockResult.error) {
                        throw {
                            error: attendanceLockResult.error,
                        }
                    }
                } catch (error) {
                    const _error = error as CustomResponse
                    dispatch(
                        setToastMessage({
                            text: getErrorToastMessage(_error),
                            type: 'error',
                        } as ToastMessage),
                    )
                }
            })()
            const keepLock = setInterval(
                (function _update() {
                    updateLockOfTarget({
                        myWorkerId: myWorkerId ?? 'no-id',
                        targetId: attendanceId ?? 'no-id',
                        modelType: 'attendance',
                    })
                    return _update
                })(),
                LOCK_INTERVAL_TIME,
            )
            return () => {
                clearInterval(keepLock)
                updateLockOfTarget({
                    myWorkerId: myWorkerId ?? 'no-id',
                    targetId: attendanceId ?? 'no-id',
                    modelType: 'attendance',
                    unlock: true,
                })
            }
        }
    }, [site?.siteId, attendanceId, myWorkerId, appState, isFocused])

    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    const updateWorkerHomeCache = async (newAttendance: UpdateAttendanceParam, isFirstReport: boolean) => {
        try {
            if (accountId == undefined) return

            const cachedWorkerHomeKey = genKeyName({ screenName: 'workerHome', accountId, workerId: myWorkerId ?? '' })
            if (cachedWorkerHomeKey) {
                const result = await getCachedData<CachedWorkerHomeType>(cachedWorkerHomeKey)
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }

                if (result.success) {
                    const { unReportedAttendances, attendances } = result.success

                    const newAttendances =
                        attendances?.map((attendance) => {
                            if (attendance?.arrangement?.attendanceId == attendanceId) {
                                if (isFirstReport) {
                                    if (attendance.arrangement?.attendance) attendance.arrangement.attendance = newAttendance
                                } else {
                                    if (attendance.arrangement?.attendanceModification?.modificationInfo) attendance.arrangement.attendanceModification.modificationInfo = newAttendance
                                }
                            }

                            return attendance
                        }) ?? []

                    const newUnReportedAttendances =
                        unReportedAttendances?.map((attendance) => {
                            if (attendance?.arrangement?.attendanceId == attendanceId) {
                                if (isFirstReport) {
                                    if (attendance.arrangement?.attendance) attendance.arrangement.attendance = newAttendance
                                } else {
                                    if (attendance.arrangement?.attendanceModification?.modificationInfo) attendance.arrangement.attendanceModification.modificationInfo = newAttendance
                                }
                            }

                            return attendance
                        }) ?? []

                    const newCachedData = {
                        key: cachedWorkerHomeKey,
                        value: {
                            unReportedAttendances: newUnReportedAttendances,
                            attendances: newAttendances,
                        },
                    }

                    const updateResult = await updateCachedData(newCachedData)
                    if (updateResult.error) {
                        throw {
                            error: updateResult.error,
                            errorCode: updateResult.errorCode,
                        }
                    }
                }
            }
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

    const saveAttendance = async () => {
        try {
            dispatch(setLoading('unTouchable'))

            if (isFirstReport) {
                const attendanceLockResult = await checkLockOfTarget({
                    myWorkerId: myWorkerId ?? 'no-id',
                    targetId: attendanceId ?? 'no-id',
                    modelType: 'attendance',
                })
                if (attendanceLockResult.error) {
                    if (isFocused) dispatch(setLoading(false))
                    throw {
                        error: attendanceLockResult.error,
                    }
                }

                const newAttendance = {
                    ...attendance,
                    attendanceId: attendanceId,
                    isStartNotEntered: attendance?.startDate == undefined && attendance?.isAbsence != true,
                    isEndNotEntered: attendance?.endDate == undefined,
                    side: type,
                }

                await updateWorkerHomeCache(newAttendance, true)

                const result = await updateAttendance(newAttendance)

                if (isFocused) dispatch(setLoading(false))
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
            } else {
                const attendanceLockResult = await checkLockOfTarget({
                    myWorkerId: myWorkerId ?? 'no-id',
                    targetId: attendanceId ?? 'no-id',
                    modelType: 'attendanceModification',
                })
                if (attendanceLockResult.error) {
                    if (isFocused) dispatch(setLoading(false))
                    throw {
                        error: attendanceLockResult.error,
                    }
                }

                const newAttendanceModification = {
                    ...attendance,
                    attendanceId: attendanceId,
                    isStartNotEntered: attendance?.startDate == undefined && attendance?.isAbsence != true,
                    isEndNotEntered: attendance?.endDate == undefined,
                    side: type,
                    siteInfo: site as SiteCLType,
                    attendanceModification: attendanceModification,
                }

                await updateWorkerHomeCache(newAttendanceModification, false)

                const result = await updateAttendanceModification(newAttendanceModification)
                if (isFocused) dispatch(setLoading(false))
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
            }
            const newLocalUpdateScreens: UpdateScreenType[] = [
                { screenName: 'WorkerHome' },
                {
                    screenName: 'MyAttendanceList',
                    dates: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'MyAttendanceList').map((screen) => screen.dates)), site?.meetingDate?.totalSeconds]?.filter(
                        (data) => data != undefined,
                    ) as number[],
                },
                {
                    screenName: 'WSiteWorkerList',
                    ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'WSiteWorkerList').map((screen) => screen.ids)), site?.siteId]?.filter(
                        (data) => data != undefined,
                    ) as string[],
                },
            ]
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            __route(attendance)
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

    const __route = (_attendance?: AttendanceCLType) => {
        const _isReported = _attendance?.isAbsence || (_attendance?.startDate != undefined && _attendance.endDate != undefined)

        if (_isReported) {
            navigation.goBack()
            return
        }

        if (route.params?.disableCloseButton) {
            navigation.goBack()
            return
        }

        // 現場終了後に未報告の場合、終了報告に進む。
        if ((site?.endDate ? compareWithToday(site?.endDate).totalMilliseconds : 0) > 0 && type == 'start') {
            navigation.replace('AttendancePopup', {
                attendanceId,
                arrangementId,
                type: 'end',
                /**
                 * 同じ現在地を使う可能性が高いので引き渡す。
                 */
                location: _attendance?.startLocationInfo,
            })
            return
        }
        navigation.goBack()
    }

    useEffect(() => {
        setState((prev) => ({
            ...prev,
            attendance: {
                ...attendance,
                ...(type == 'start'
                    ? {
                          startLocationInfo: newLocation,
                      }
                    : {
                          endLocationInfo: newLocation,
                      }),
            },
        }))
    }, [newLocation])

    const getInitDate = () => {
        let initDate
        if (type == 'start') {
            if (!isEmpty(attendanceModification) && attendanceModification.modificationInfo.startDate && attendanceModification.status != 'approved' && attendance?.startDate) {
                initDate = attendanceModification.modificationInfo.startDate
            } else if (attendance?.startDate) {
                initDate = attendance?.startDate
            } else if (attendance?.isAbsence) {
                initDate = attendance?.startDate
            } else if (attendance?.startDate == undefined) {
                initDate = undefined
            } else {
                initDate = site?.startDate
            }
        } else {
            if (
                !isEmpty(attendanceModification) &&
                !isEmpty(attendanceModification.modificationInfo.endDate) &&
                !isNaN(attendanceModification.modificationInfo.endDate.totalSeconds) &&
                attendanceModification.status != 'approved' &&
                attendance?.endDate
            ) {
                initDate = attendanceModification.modificationInfo.endDate
            } else if (attendance?.endDate) {
                initDate = attendance?.endDate
            } else {
                initDate = site?.endDate
            }
        }
        return initDate
    }

    const getOvertimeWork = () => {
        if (overtimeWork) {
            return overtimeWork
        }
        let initDate: CustomDate | undefined
        if (
            !isEmpty(attendanceModification) &&
            !isEmpty(attendanceModification.modificationInfo.overtimeWork) &&
            !isNaN(attendanceModification.modificationInfo.overtimeWork.totalSeconds) &&
            attendanceModification?.status != 'approved'
        ) {
            initDate = attendanceModification.modificationInfo.overtimeWork
        } else {
            initDate = attendance?.overtimeWork
        }
        return initDate
    }

    const getMidnightWorkTime = () => {
        if (midnightWorkTime) {
            return midnightWorkTime
        }
        let initDate: CustomDate | undefined
        if (
            !isEmpty(attendanceModification) &&
            !isEmpty(attendanceModification.modificationInfo.midnightWorkTime) &&
            !isNaN(attendanceModification.modificationInfo.midnightWorkTime.totalSeconds) &&
            attendanceModification?.status != 'approved'
        ) {
            initDate = attendanceModification.modificationInfo.midnightWorkTime
        } else {
            initDate = attendance?.midnightWorkTime
        }
        return initDate
    }

    const getIsHolidayWork = () => {
        if (isHolidayWork) {
            return isHolidayWork
        }
        let initDate: boolean | undefined
        if (!isEmpty(attendanceModification) && attendanceModification?.status != 'approved') {
            initDate = attendanceModification.modificationInfo.isHolidayWork
        } else {
            initDate = attendance?.isHolidayWork
        }
        return initDate
    }

    return (
        <ScrollView
            style={{
                backgroundColor: '#fff',
                flex: 1,
            }}>
            {/**
             *  勤怠を登録するまで画面を表示するフローでもDev環境では、便宜のため閉じるボタンを表示する (MyPageへ遷移)
             */}
            {route.params?.disableCloseButton && !__DEV__ ? (
                <View
                    style={{
                        height: 76,
                    }}></View>
            ) : (
                <Pressable
                    style={{
                        alignSelf: 'flex-end',
                        paddingTop: 50,
                        paddingRight: 20,
                    }}
                    onPress={() => {
                        if (route.params?.disableCloseButton && __DEV__) {
                            navigation.push('MyPageRouter')
                            dispatch(setIsBottomOff(false))
                            return
                        }

                        __route(attendance)
                    }}>
                    <View
                        style={{
                            padding: 8,
                            backgroundColor: THEME_COLORS.OTHERS.BLACK,
                            borderRadius: 100,
                        }}>
                        <Icon name="close" width={18} height={18} fill="#fff" />
                    </View>
                </Pressable>
            )}

            <View
                style={{
                    marginHorizontal: 10,
                }}>
                <Text
                    style={{
                        fontFamily: FontStyle.bold,
                        fontSize: 28,
                        lineHeight: 40,
                    }}>
                    {type == 'start' ? `${t('worker:startofwork')}` : `${t('worker:endofwork')}`}
                </Text>
                <Text
                    style={[
                        GlobalStyles.mediumText,
                        {
                            marginTop: 5,
                        },
                    ]}>
                    {site?.siteNameData?.name}
                </Text>
                <Pressable
                    style={{
                        marginTop: 15,
                    }}
                    onPress={() => {
                        if (route.params?.disableCloseButton) return

                        navigation.push('WSiteRouter', {
                            siteId: site?.siteId,
                            title: site?.siteNameData?.name,
                        })
                    }}>
                    <TableArea
                        columns={[
                            {
                                key: '集合時間',
                                content: site?.meetingDate ? timeBaseText(site?.meetingDate) : '未定',
                            },
                            {
                                key: '作業時間',
                                content: site?.startDate ? getTextBetweenAnotherDate(site?.startDate, site.endDate) : '未定',
                            },
                            {
                                key: '持ち物',
                                content: site?.belongings ? site?.belongings : '',
                            },
                            {
                                key: '備考',
                                content: site?.remarks ? site?.remarks : '',
                            },
                        ]}
                    />
                </Pressable>
            </View>

            <Line
                style={{
                    marginTop: 15,
                    marginHorizontal: 10,
                }}
            />

            <AttendanceReportCL
                style={{
                    paddingHorizontal: 10,
                    marginTop: 15,
                    // paddingTop: 50
                }}
                attendance={attendance}
                attendanceModification={attendanceModification}
                isFirstReport={isFirstReport}
                type={type}
                initDate={getInitDate()}
                mapType={'editableCurrentLocation'}
                canEditComment={true}
                onReportTimeChange={(report) => {
                    if (type) {
                        setState((prev) => ({ ...prev, attendance: { ...attendance, ...reportTypeToPartialAttendanceCLType(report, type, site, attendance) } }))
                    }
                }}
                onMapValueChange={(location) => {
                    setState((prev) => ({
                        ...prev,
                        newLocation: location,
                    }))
                }}
                onCommentChange={(comment) => {
                    setState((prev) => ({
                        ...prev,
                        attendance: {
                            ...attendance,
                            ...(type == 'start'
                                ? {
                                      startComment: comment,
                                  }
                                : {
                                      endComment: comment,
                                  }),
                        },
                    }))
                }}
            />
            <Line
                style={{
                    marginTop: 30,
                }}
            />
            {attendance?.isAbsence != true && (
                <>
                    <ToggleMenu title={t('worker:Overtime')}>
                        <View
                            style={{
                                paddingTop: 25,
                                marginHorizontal: -10,
                                backgroundColor: THEME_COLORS.OTHERS.PURPLE_GRAY,
                            }}>
                            <InputDateTimeBox
                                title={t('worker:overtimehours')}
                                style={{
                                    marginBottom: 20,
                                }}
                                initDateInput={newDate({
                                    hour: 1,
                                    minute: 0,
                                }).toCustomDate()}
                                placeholder={'00:00'}
                                infoText={t('worker:overtimehoursInfo')}
                                value={getOvertimeWork()}
                                onValueChangeValid={(value) => {
                                    setState((prev) => ({ ...prev, attendance: { ...attendance, overtimeWork: value }, overtimeWork: value }))
                                }}
                                color={GreenColor}
                                dateInputMode={'time'}
                            />
                            <InputDateTimeBox
                                title={t('worker:nightwork')}
                                style={{
                                    marginBottom: 20,
                                }}
                                initDateInput={newDate({
                                    hour: 1,
                                    minute: 0,
                                }).toCustomDate()}
                                placeholder={'00:00'}
                                infoText={t('worker:nightworkhrs')}
                                value={getMidnightWorkTime()}
                                onValueChangeValid={(value) => {
                                    setState((prev) => ({ ...prev, attendance: { ...attendance, midnightWorkTime: value }, midnightWorkTime: value }))
                                }}
                                color={GreenColor}
                                dateInputMode={'time'}
                            />
                            <Checkbox
                                size={20}
                                fontSize={12}
                                color={THEME_COLORS.GREEN.MIDDLE}
                                textColor={THEME_COLORS.GREEN.DEEP}
                                text={t('worker:dayoffwork')}
                                style={{
                                    marginBottom: 20,
                                    marginLeft: 20,
                                }}
                                checked={getIsHolidayWork()}
                                onChange={(value) => {
                                    setState((prev) => ({ ...prev, attendance: { ...attendance, isHolidayWork: value }, isHolidayWork: value }))
                                }}
                            />
                        </View>
                    </ToggleMenu>
                    <Line />
                </>
            )}

            <View
                style={{
                    marginTop: 25,
                    marginHorizontal: 10,
                }}>
                <Text
                    style={[
                        GlobalStyles.smallText,
                        {
                            alignSelf: 'center',
                            color: THEME_COLORS.OTHERS.ALERT_RED,
                        },
                    ]}>
                    {t('worker:AfterReportCanNotModifyWithoutApprovement')}
                </Text>
                <AppButton
                    title={t('worker:Reportinformation')}
                    onPress={() => {
                        if ((type == 'start' && attendance?.startLocationInfo?.latitude == undefined) || (type == 'end' && attendance?.endLocationInfo?.latitude == undefined)) {
                            Alert.alert(`${t('worker:Nocurrentlocation')}`, `${t('worker:NocurrentlocationSecond')}`, [
                                {
                                    text: `${t('worker:Report')}`,
                                    onPress: async () => {
                                        await saveAttendance()
                                        if (isBottomOff) dispatch(setIsBottomOff(false))
                                    },
                                },
                                {
                                    text: `${t('worker:cancel')}`,
                                    style: 'cancel',
                                },
                            ])
                        } else {
                            Alert.alert(`${t('worker:Wouldlikeaboveinformation')}`, `${t('worker:WouldlikeaboveinformationSecond')}`, [
                                {
                                    text: `${t('worker:Report')}`,
                                    onPress: async () => {
                                        await saveAttendance()
                                        if (isBottomOff) dispatch(setIsBottomOff(false))
                                    },
                                },
                                {
                                    text: `${t('worker:cancel')}`,
                                    style: 'cancel',
                                },
                            ])
                        }
                    }}
                    disabled={!(attendance?.isAbsence || (type == 'start' && attendance?.startDate != undefined) || (type == 'end' && attendance?.endDate != undefined))}
                    height={50}
                    color={GreenColor}
                    style={{
                        marginTop: 10,
                    }}
                />
            </View>
            <BottomMargin />
        </ScrollView>
    )
}
export default AttendancePopup

const styles = StyleSheet.create({})
