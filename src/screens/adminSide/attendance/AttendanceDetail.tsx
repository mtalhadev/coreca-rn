import React, { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, AppState, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { ScrollView } from 'react-native-gesture-handler'
import { Worker } from '../../../components/organisms/worker/Worker'
import { TableArea } from '../../../components/atoms/TableArea'
import { Line } from '../../../components/atoms/Line'
import { ShadowBoxWithHeader } from '../../../components/organisms/shadowBox/ShadowBoxWithHeader'
import { GlobalStyles, GreenColor } from '../../../utils/Styles'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { StoreType } from '../../../stores/Store'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import {
    getAttendanceDetail,
    getNewAttendances,
    onUpdateAttendanceUpdateAllSiteAttendancesCache,
    onUpdateAttendanceUpdateSiteAttendanceCache,
    updateAttendanceByAdmin,
} from '../../../usecases/attendance/CommonAttendanceCase'
import { AddressMap } from '../../../components/organisms/AddressMap'
import { SiteType, toSiteCLType } from '../../../models/site/Site'
import { WorkerType } from '../../../models/worker/Worker'
import { newDate } from '../../../utils/ext/Date.extensions'
import { CustomDate, getTextBetweenAnotherDate, timeBaseText, timeText, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { InputDateTimeBox } from '../../../components/organisms/inputBox/InputDateTimeBox'
import { LOCK_INTERVAL_TIME, THEME_COLORS } from '../../../utils/Constants'
import { AppButton } from '../../../components/atoms/AppButton'
import { AttendanceCLType, AttendanceType, toAttendanceCLType } from '../../../models/attendance/Attendance'
import { Checkbox } from '../../../components/atoms/Checkbox'
import { checkLockOfTarget, updateLockOfTarget } from '../../../usecases/lock/CommonLockCase'
import { useIsFocused } from '@react-navigation/native'
import { reportTypeToPartialAttendanceCLType } from '../../../components/organisms/attendance/DatePickButton'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../fooks/useTextTranslation'
import uniqBy from 'lodash/uniqBy'
import flatten from 'lodash/flatten'
import { toIdAndMonthFromTotalSeconds, UpdateScreenType } from '../../../models/updateScreens/UpdateScreens'
import DisplayIdInDev from '../../../components/atoms/DisplayIdInDEV'
import { AttendanceModificationType, toAttendanceModificationCLType } from '../../../models/attendanceModification/AttendanceModification'
import isEmpty from 'lodash/isEmpty'
import { approveTargetAttendanceModification, getAttendanceModificationDetail, unApproveTargetAttendanceModification } from '../../../usecases/attendance/WorkerAttendanceModificationCase'
import { AttendanceReportCL } from '../../../components/organisms/attendance/AttendanceReportCL'
import { checkMyDepartment } from '../../../usecases/department/DepartmentCase'
import { departmentsToText } from '../../../usecases/worker/CommonWorkerCase'

type NavProps = StackNavigationProp<RootStackParamList, 'AttendanceDetail'>
type RouteProps = RouteProp<RootStackParamList, 'AttendanceDetail'>

type InitialStateType = {
    arrangementId?: string
    siteId?: string
    site?: SiteType
    update: number
    attendanceId?: string
    attendance?: AttendanceCLType
    attendanceModification?: AttendanceModificationType
    worker?: WorkerType
    startDate?: CustomDate
    endDate?: CustomDate
    behindTime?: CustomDate
    earlyLeaveTime?: CustomDate
    overtimeWork?: CustomDate
    midnightWorkTime?: CustomDate
    isHolidayWork?: boolean
}

const initialState: InitialStateType = {
    update: 0,
}

const AttendanceDetail = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [
        {
            site,
            siteId,
            update,
            worker,
            arrangementId,
            attendanceId,
            attendance,
            attendanceModification,
            startDate,
            endDate,
            behindTime,
            earlyLeaveTime,
            overtimeWork,
            midnightWorkTime,
            isHolidayWork,
        },
        setState,
    ] = useState(initialState)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])

    useSafeUnmount(setState, initialState)

    const siteStartDate = useMemo(() => (site?.startDate ? toCustomDateFromTotalSeconds(site?.startDate) : undefined), [site?.startDate])
    const siteMeetingDate = useMemo(() => (site?.meetingDate ? toCustomDateFromTotalSeconds(site?.meetingDate) : undefined), [site?.meetingDate])
    const siteEndDate = useMemo(() => (site?.endDate ? toCustomDateFromTotalSeconds(site?.endDate) : undefined), [site?.endDate])

    /**
     * 作業員未確定かどうか
     */
    const isUnconfirmed = worker?.workerId == undefined

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        ;(async () => {
            try {
                if (signInUser == undefined || myCompanyId == undefined || attendanceId == undefined || siteId == undefined) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const result = await getAttendanceDetail({ myCompanyId, attendanceId, myWorkerId: signInUser?.workerId, siteId: siteId })
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                dispatch(setIsNavUpdating(false))
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                const _worker = result.success?.attendance?.worker
                setState((prev) => ({
                    ...prev,
                    attendance: toAttendanceCLType(result.success?.attendance),
                    attendanceModification: result.success?.attendanceModification,
                    site: result.success?.site,
                    worker: _worker,
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
        })()
    }, [update])

    useEffect(() => {
        setState((prev) => ({ ...prev, arrangementId: route?.params?.arrangementId, attendanceId: route?.params?.attendanceId, update: update + 1, siteId: route?.params?.siteId }))
    }, [route])

    useEffect(() => {
        // 欠勤報告済みの場合は(画面を開いた時に)欠勤のみの条件判定だと無限ループになる
        if (attendance?.isAbsence && (overtimeWork != undefined || earlyLeaveTime != undefined || midnightWorkTime != undefined || isHolidayWork == true || behindTime != undefined)) {
            const resetTime = newDate({
                hour: 0,
                minute: 0,
            }).toCustomDate()
            // 休日労働(チェック=>欠勤=>欠勤解除時)の反映にupdateをインクリメント
            setState((prev) => ({ ...prev, overtimeWork: resetTime, earlyLeaveTime: resetTime, midnightWorkTime: resetTime, isHolidayWork: false, behindTime: resetTime, update: update + 1 }))
        }
    }, [attendance?.isAbsence])

    useEffect(() => {
        if (site?.siteId && attendanceId && signInUser?.workerId && appState == 'active' && isFocused) {
            ;(async () => {
                try {
                    const [siteLockResult, attendanceLockResult] = await Promise.all([
                        checkLockOfTarget({
                            myWorkerId: signInUser?.workerId ?? 'no-id',
                            targetId: site?.siteId ?? 'no-id',
                            modelType: 'site',
                        }),
                        checkLockOfTarget({
                            myWorkerId: signInUser?.workerId ?? 'no-id',
                            targetId: attendanceId ?? 'no-id',
                            modelType: 'attendance',
                        }),
                    ])

                    if (siteLockResult.error) {
                        throw {
                            error: siteLockResult.error,
                        }
                    }
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
                        myWorkerId: signInUser?.workerId ?? 'no-id',
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
                    myWorkerId: signInUser?.workerId ?? 'no-id',
                    targetId: attendanceId ?? 'no-id',
                    modelType: 'attendance',
                    unlock: true,
                })
            }
        }
    }, [site?.siteId, attendanceId, signInUser?.workerId, appState, isFocused])

    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])
    const _updateAttendance = async () => {
        try {
            /**
             * １対１関係なのでattendanceIdかarrangementIdどちらかが存在すればよい。arrangementIdは存在しない可能性がある。
             */
            if (attendanceId == undefined && arrangementId == undefined) {
                return
            }
            if (
                site?.construction?.contract?.receiveCompanyId == myCompanyId &&
                !checkMyDepartment({
                    targetDepartmentIds: site?.construction?.contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                        '\n' +
                        t('common:Department') +
                        ': ' +
                        departmentsToText(site?.construction?.contract?.receiveDepartments?.items),
                    errorCode: 'UPDATE_ATTENDANCE_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const attendanceLockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: attendanceId ?? 'no-id',
                modelType: 'attendance',
            })
            if (attendanceLockResult.error) {
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                throw {
                    error: attendanceLockResult.error,
                }
            }

            const newAttendances = await getNewAttendances({
                ...attendance,
                attendanceId,
                arrangementId,
                isStartNotEntered: attendance?.startDate == undefined,
                isEndNotEntered: attendance?.endDate == undefined,
                isUnconfirmed: isUnconfirmed,
                editWorkerId: signInUser?.workerId,
                myCompanyId: myCompanyId,
                accountId: signInUser?.accountId,
                siteId: siteId,
            })
            await onUpdateAttendanceUpdateSiteAttendanceCache({
                newAttendances: [newAttendances.success] as AttendanceType[],
                myCompanyId: myCompanyId,
                accountId: signInUser?.accountId,
                siteId: siteId,
            })
            await onUpdateAttendanceUpdateAllSiteAttendancesCache({
                newAttendances: [newAttendances.success] as AttendanceType[],
                myCompanyId: myCompanyId,
                accountId: signInUser?.accountId,
                date: startDate,
            })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            navigation.goBack()
            dispatch(
                setToastMessage({
                    text: t('common:Updated'),
                    type: 'success',
                } as ToastMessage),
            )
            const result = await updateAttendanceByAdmin({
                ...attendance,
                attendanceId,
                arrangementId,
                isStartNotEntered: attendance?.startDate == undefined,
                isEndNotEntered: attendance?.endDate == undefined,
                isUnconfirmed: isUnconfirmed,
                editWorkerId: signInUser?.workerId,
            })

            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            const invRequestIds = (attendance?.invRequests?.items?.map((inv) => inv.invRequestId).filter((data) => data != undefined) as string[]) ?? []
            const idAndDate = toIdAndMonthFromTotalSeconds(attendance?.workerId, site?.siteDate)

            let newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'WorkerAttendanceList',
                    idAndDates: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'WorkerAttendanceList').map((screen) => screen.idAndDates)), idAndDate]?.filter(
                        (data) => data != undefined,
                    ) as string[],
                },
            ]
            if (signInUser?.workerId == attendance?.workerId) {
                newLocalUpdateScreens = [
                    ...newLocalUpdateScreens,
                    {
                        screenName: 'MySchedule',
                    },
                ]
            }
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            setState((prev) => ({ ...prev, update: update + 1 }))
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

    const getInitStartDate = () => {
        if (startDate) {
            return startDate
        }
        let initDate
        if (
            !isEmpty(attendanceModification) &&
            !isEmpty(attendanceModification.modificationInfo?.startDate) &&
            !isNaN(attendanceModification.modificationInfo?.startDate as number) &&
            attendanceModification?.status != 'approved' &&
            attendanceModification?.status != 'unapproved'
        ) {
            initDate = attendanceModification.modificationInfo?.startDate ? toCustomDateFromTotalSeconds(attendanceModification.modificationInfo?.startDate) : undefined
        } else if (attendance?.startDate) {
            initDate = attendance?.startDate
        } else {
            initDate = site?.startDate ? toCustomDateFromTotalSeconds(site?.startDate) : undefined
        }
        return initDate
    }

    const getInitEndDate = () => {
        if (endDate) {
            return endDate
        }
        let initDate
        if (
            !isEmpty(attendanceModification) &&
            !isEmpty(attendanceModification.modificationInfo?.endDate) &&
            !isNaN(attendanceModification.modificationInfo?.endDate as number) &&
            attendanceModification?.status != 'approved' &&
            attendanceModification?.status != 'unapproved'
        ) {
            initDate = attendanceModification.modificationInfo?.endDate ? toCustomDateFromTotalSeconds(attendanceModification.modificationInfo?.endDate) : undefined
        } else if (attendance?.endDate) {
            initDate = attendance?.endDate
        } else {
            initDate = site?.endDate ? toCustomDateFromTotalSeconds(site?.endDate) : undefined
        }
        return initDate
    }

    const getBehindTime = () => {
        if (behindTime) {
            return behindTime
        }
        let initDate
        if (
            !isEmpty(attendanceModification) &&
            !isEmpty(attendanceModification.modificationInfo?.behindTime) &&
            !isNaN(attendanceModification.modificationInfo?.behindTime as number) &&
            attendanceModification?.status != 'approved' &&
            attendanceModification?.status != 'unapproved'
        ) {
            initDate = attendanceModification.modificationInfo?.behindTime ? toCustomDateFromTotalSeconds(attendanceModification.modificationInfo?.behindTime) : undefined
        } else if (attendance?.behindTime) {
            initDate = attendance?.behindTime
        }
        return initDate
    }

    const getEarlyLeaveTime = () => {
        if (earlyLeaveTime) {
            return earlyLeaveTime
        }
        let initDate
        if (
            !isEmpty(attendanceModification) &&
            !isEmpty(attendanceModification.modificationInfo?.earlyLeaveTime) &&
            !isNaN(attendanceModification.modificationInfo?.earlyLeaveTime as number) &&
            attendanceModification?.status != 'approved' &&
            attendanceModification?.status != 'unapproved'
        ) {
            initDate = attendanceModification.modificationInfo?.earlyLeaveTime ? toCustomDateFromTotalSeconds(attendanceModification.modificationInfo?.earlyLeaveTime) : undefined
        } else if (attendance?.earlyLeaveTime) {
            initDate = attendance?.earlyLeaveTime
        }
        return initDate
    }

    const getOvertimeWork = () => {
        if (overtimeWork) {
            return overtimeWork
        }
        let initDate
        if (
            !isEmpty(attendanceModification) &&
            !isEmpty(attendanceModification.modificationInfo?.overtimeWork) &&
            !isNaN(attendanceModification.modificationInfo?.overtimeWork as number) &&
            attendanceModification?.status != 'approved' &&
            attendanceModification?.status != 'unapproved'
        ) {
            initDate = attendanceModification.modificationInfo?.overtimeWork ? toCustomDateFromTotalSeconds(attendanceModification.modificationInfo?.overtimeWork) : undefined
        } else if (attendance?.overtimeWork) {
            initDate = attendance?.overtimeWork
        }
        return initDate
    }

    const getMidnightWorkTime = () => {
        if (midnightWorkTime) {
            return midnightWorkTime
        }
        let initDate
        if (
            !isEmpty(attendanceModification) &&
            !isEmpty(attendanceModification.modificationInfo?.midnightWorkTime) &&
            !isNaN(attendanceModification.modificationInfo?.midnightWorkTime as number) &&
            attendanceModification?.status != 'approved' &&
            attendanceModification?.status != 'unapproved'
        ) {
            initDate = attendanceModification.modificationInfo?.midnightWorkTime ? toCustomDateFromTotalSeconds(attendanceModification.modificationInfo?.midnightWorkTime) : undefined
        } else {
            initDate = attendance?.midnightWorkTime
        }
        return initDate
    }

    const getIsHolidayWork = () => {
        if (isHolidayWork) {
            return isHolidayWork
        }
        let initDate

        if (!isEmpty(attendanceModification) && attendanceModification?.status != 'approved' && attendanceModification?.status != 'unapproved') {
            initDate = attendanceModification.modificationInfo?.isHolidayWork
        } else {
            initDate = attendance?.isHolidayWork
        }
        return initDate
    }

    const _approveAttendanceModification = async (attendanceModification: AttendanceModificationType) => {
        try {
            if (
                site?.construction?.contract?.receiveCompanyId == myCompanyId &&
                !checkMyDepartment({
                    targetDepartmentIds: site?.construction?.contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                        '\n' +
                        t('common:Department') +
                        ': ' +
                        departmentsToText(site?.construction?.contract?.receiveDepartments?.items),
                    errorCode: 'UPDATE_ATTENDANCE_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: attendanceModification?.attendanceModificationId ?? 'no-id',
                modelType: 'attendanceModification',
            })
            if (lockResult.error) {
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                throw {
                    error: lockResult.error,
                }
            }
            const attendanceModificationId = attendanceModification?.attendanceModificationId
            const result = await approveTargetAttendanceModification({ attendanceModificationId, targetAttendanceId: attendanceId })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            setState((prev) => ({ ...prev, update: update + 1 }))
            dispatch(
                setToastMessage({
                    text: t('admin:AttendanceModificationApproved'),
                    type: 'success',
                } as ToastMessage),
            )
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

    const _unApproveAttendanceModification = async (attendanceModification: AttendanceModificationType) => {
        try {
            if (
                site?.construction?.contract?.receiveCompanyId == myCompanyId &&
                !checkMyDepartment({
                    targetDepartmentIds: site?.construction?.contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error:
                        t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') +
                        '\n' +
                        t('common:Department') +
                        ': ' +
                        departmentsToText(site?.construction?.contract?.receiveDepartments?.items),
                    errorCode: 'UPDATE_ATTENDANCE_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: attendanceModification?.attendanceModificationId ?? 'no-id',
                modelType: 'attendanceModification',
            })
            if (lockResult.error) {
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                throw {
                    error: lockResult.error,
                }
            }
            const attendanceModificationId = attendanceModification?.attendanceModificationId
            const result = await unApproveTargetAttendanceModification({ attendanceModificationId })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            dispatch(
                setToastMessage({
                    text: t('admin:AttendanceModificationNotApproved'),
                    type: 'success',
                } as ToastMessage),
            )
            setState((prev) => ({ ...prev, update: update + 1 }))
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

    const getStatusMessage = () => {
        if (attendanceModification?.status == 'created') {
            return 'admin:AttendanceModificationStatusCreated'
        } else if (attendanceModification?.status == 'edited') {
            return 'admin:AttendanceModificationStatusEdited'
        } else if (attendanceModification?.status == 'approved') {
            return 'admin:AttendanceModificationStatusApproved'
        } else if (attendanceModification?.status == 'unapproved') {
            return 'admin:AttendanceModificationStatusUnapproved'
        } else {
            return ''
        }
    }



    return (
        <ScrollView
            style={{
                flex: 1,
                paddingHorizontal: 10,
                backgroundColor: '#fff',
            }}>
            <ShadowBoxWithHeader
                onPress={() => {
                    if (worker?.company?.isFake || worker?.companyId == myCompanyId) {
                        navigation.push('WorkerDetailRouter', {
                            workerId: worker?.workerId,
                            title: worker?.name,
                        })
                    }
                }}
                title={t('common:Labourer')}
                style={{
                    marginTop: 10,
                }}>
                {site != undefined && isUnconfirmed == true && (
                    <View style={{}}>
                        <Text style={{ ...GlobalStyles.smallText }}>{t('common:OperatorNotIdentified')}</Text>
                        <Text style={{ ...GlobalStyles.smallGrayText, marginTop: 5 }}>{`${t('common:DiligenceID')}   ${attendanceId}`}</Text>
                    </View>
                )}
                {
                    /**
                     * siteの分岐を入れているのは、現場を取得した段階で判定したいから。
                     */
                    site != undefined && isUnconfirmed != true && <Worker worker={worker} style={{}} />
                }
            </ShadowBoxWithHeader>
            <Line
                style={{
                    marginTop: 15,
                }}
            />
            <View>
                <Text
                    style={[
                        GlobalStyles.boldText,
                        {
                            marginTop: 15,
                            fontSize: 14,
                            lineHeight: 16,
                        },
                    ]}>
                    {t('common:OnsiteInformation')}
                </Text>
                <TableArea
                    style={{
                        marginTop: 10,
                    }}
                    columns={[
                        {
                            key: '現場名',
                            content: site?.siteNameData?.name,
                        },
                        {
                            key: '集合時間',
                            content: siteMeetingDate ? timeBaseText(siteMeetingDate) : '未定',
                        },
                        {
                            key: '作業時間',
                            content: siteStartDate ? getTextBetweenAnotherDate(siteStartDate, siteEndDate) : '未定',
                        },
                    ]}
                />
                <AddressMap
                    location={{
                        address: site?.address,
                    }}
                    style={{
                        marginTop: 10,
                    }}
                />
            </View>

            <Line
                style={{
                    marginTop: 15,
                }}
            />
            {!isEmpty(attendanceModification) && attendanceModification.status != 'approved' && (
                <>
                    <View
                        style={{
                            flexDirection: 'row',
                            paddingTop: 10,
                            paddingLeft: 0,
                            width: '100%',
                        }}>
                        <Text
                            style={{
                                color: THEME_COLORS.OTHERS.ALERT_RED,
                            }}>
                            {t(getStatusMessage())}
                        </Text>
                    </View>
                    <View
                        style={{
                            marginTop: 5,
                            marginLeft: 0,
                            marginRight: 10,
                        }}>
                        <Text style={GlobalStyles.mediumText}>{t('admin:AttendanceModificationDetail')}</Text>
                        <TableArea columns={getAttendanceModificationDetail(attendance, attendanceModification, t)} />
                    </View>
                </>
            )}
            {(isEmpty(attendanceModification) || (!isEmpty(attendanceModification) && (attendanceModification.status == 'approved' || attendanceModification.status == 'unapproved'))) && (
                <>
                    <View
                        style={{
                            marginTop: 15,
                        }}>
                        <Text style={[GlobalStyles.headerText, {}]}>{t('admin:InitiationReport')}</Text>
                        <AttendanceReportCL
                            style={{
                                marginTop: 10,
                            }}
                            initDate={getInitStartDate()}
                            attendance={attendance}
                            attendanceModification={toAttendanceModificationCLType(attendanceModification)}
                            type={'start'}
                            canEditComment={false}
                            mapType={'currentLocation'}
                            onReportTimeChange={(report) => {
                                const reportValue = reportTypeToPartialAttendanceCLType(report, 'start', toSiteCLType(site), attendance)
                                setState((prev) => ({ ...prev, attendance: { ...attendance, ...reportValue } }))
                                if (reportValue.startDate) {
                                    setState((prev) => ({ ...prev, startDate: reportValue.startDate }))
                                    if (attendance) {
                                        attendance.startDate = reportValue.startDate
                                    }
                                }
                                if (reportValue.endDate) {
                                    setState((prev) => ({ ...prev, endDate: reportValue.endDate }))
                                }
                                setState((prev) => ({ ...prev, behindTime: reportValue.behindTime, earlyLeaveTime: reportValue.earlyLeaveTime }))
                            }}
                            isAdmin={true}
                        />
                    </View>

                    {attendance?.isAbsence != true && (
                        <>
                            <Line
                                style={{
                                    marginTop: 15,
                                }}
                            />

                            <View
                                style={{
                                    marginTop: 15,
                                }}>
                                <Text style={[GlobalStyles.headerText, {}]}>{t('admin:EndReport')}</Text>
                                <AttendanceReportCL
                                    style={{
                                        marginTop: 10,
                                    }}
                                    initDate={getInitEndDate()}
                                    attendance={attendance}
                                    attendanceModification={toAttendanceModificationCLType(attendanceModification)}
                                    type={'end'}
                                    canEditComment={false}
                                    mapType={'currentLocation'}
                                    onReportTimeChange={(report) => {
                                        const reportValue = reportTypeToPartialAttendanceCLType(report, 'end', toSiteCLType(site), attendance)
                                        setState((prev) => ({ ...prev, attendance: { ...attendance, ...reportValue } }))
                                        if (reportValue.startDate) {
                                            setState((prev) => ({ ...prev, startDate: reportValue.startDate }))
                                        }
                                        if (reportValue.endDate) {
                                            setState((prev) => ({ ...prev, endDate: reportValue.endDate }))
                                            if (attendance) {
                                                attendance.endDate = reportValue.endDate
                                            }
                                        }
                                        setState((prev) => ({ ...prev, behindTime: reportValue.behindTime, earlyLeaveTime: reportValue.earlyLeaveTime }))
                                    }}
                                    isAdmin={true}
                                />
                            </View>
                            <Line
                                style={{
                                    marginTop: 30,
                                }}
                            />

                            <View
                                style={{
                                    paddingTop: 25,
                                    marginHorizontal: -10,
                                    backgroundColor: THEME_COLORS.OTHERS.PURPLE_GRAY,
                                }}>
                                <InputDateTimeBox
                                    title={t('admin:LateArrival')}
                                    style={{
                                        marginBottom: 20,
                                    }}
                                    initDateInput={newDate({
                                        hour: 1,
                                        minute: 0,
                                    }).toCustomDate()}
                                    placeholder={'00:00'}
                                    infoText={t('admin:EnterTimeYouWereLate')}
                                    value={getBehindTime()}
                                    onValueChangeValid={(value) => {
                                        setState((prev) => ({ ...prev, attendance: { ...attendance, behindTime: value }, behindTime: value }))
                                    }}
                                    color={GreenColor}
                                    dateInputMode={'time'}
                                />
                                <InputDateTimeBox
                                    title={t('admin:EarlyRetirement')}
                                    style={{
                                        marginBottom: 20,
                                    }}
                                    initDateInput={newDate({
                                        hour: 1,
                                        minute: 0,
                                    }).toCustomDate()}
                                    placeholder={'00:00'}
                                    infoText={t('admin:DifferenceFromPrescribedWorkingHours')}
                                    value={getEarlyLeaveTime()}
                                    onValueChangeValid={(value) => {
                                        setState((prev) => ({ ...prev, attendance: { ...attendance, earlyLeaveTime: value }, earlyLeaveTime: value }))
                                    }}
                                    color={GreenColor}
                                    dateInputMode={'time'}
                                />

                                <InputDateTimeBox
                                    title={t('admin:OvertimeHours')}
                                    style={{
                                        marginBottom: 20,
                                    }}
                                    initDateInput={newDate({
                                        hour: 1,
                                        minute: 0,
                                    }).toCustomDate()}
                                    placeholder={'00:00'}
                                    infoText={t('admin:OvertimeHoursDifferenceFromPrescribedWorkingHours')}
                                    value={getOvertimeWork()}
                                    onValueChangeValid={(value) => {
                                        setState((prev) => ({ ...prev, attendance: { ...attendance, overtimeWork: value }, overtimeWork: value }))
                                    }}
                                    color={GreenColor}
                                    dateInputMode={'time'}
                                />
                                <InputDateTimeBox
                                    title={t('admin:NightWork')}
                                    style={{
                                        marginBottom: 20,
                                    }}
                                    initDateInput={newDate({
                                        hour: 1,
                                        minute: 0,
                                    }).toCustomDate()}
                                    placeholder={'00:00'}
                                    infoText={t('admin:LateNightWorkHours')}
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
                                    text={t('admin:DayOffWork')}
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
                        </>
                    )}
                </>
            )}

            {(isEmpty(attendanceModification) || (!isEmpty(attendanceModification) && (attendanceModification.status == 'approved' || attendanceModification.status == 'unapproved'))) && (
                <>
                    <AppButton
                        style={{
                            flex: 1,
                            marginTop: 15,
                        }}
                        onPress={() => {
                            _updateAttendance()
                        }}
                        title={t('admin:RegisterOrUpdateAttendance')}
                    />
                </>
            )}
            {!isEmpty(attendanceModification) && attendanceModification.status != 'approved' && attendanceModification.status != 'unapproved' && (
                <>
                    <Line
                        style={{
                            marginTop: 20,
                        }}
                    />
                    <View
                        style={{
                            marginTop: 10,
                        }}>
                        <ShadowBoxWithHeader
                            title={t('common:AttendanceModificationRequest')}
                            style={{
                                marginTop: 10,
                            }}>
                            <AppButton
                                style={{
                                    marginTop: 10,
                                }}
                                title={t('admin:Approve')}
                                isGray
                                onPress={() => {
                                    Alert.alert(t('admin:WantToApproveAttendanceModificationTitle'), t('admin:WantToApproveAttendanceModificationMessage'), [
                                        { text: t('admin:Approve'), onPress: () => _approveAttendanceModification(attendanceModification) },
                                        {
                                            text: t('admin:Cancel'),
                                            style: 'cancel',
                                        },
                                    ])
                                }}
                            />

                            <AppButton
                                style={{
                                    marginTop: 10,
                                }}
                                title={t('admin:NotApprove')}
                                isGray
                                onPress={() => {
                                    Alert.alert(t('admin:NotWantToApproveAttendanceModificationTitle'), t('admin:NotWantToApproveAttendanceModificationMessage'), [
                                        { text: t('admin:NotApprove'), onPress: () => _unApproveAttendanceModification(attendanceModification) },
                                        {
                                            text: t('admin:Cancel'),
                                            style: 'cancel',
                                        },
                                    ])
                                }}
                            />
                        </ShadowBoxWithHeader>
                    </View>
                </>
            )}

            <DisplayIdInDev id={attendance?.attendanceId ?? attendanceId} label="attendanceId" />

            <BottomMargin />
        </ScrollView>
    )
}
export default AttendanceDetail
