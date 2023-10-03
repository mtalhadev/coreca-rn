import React, { useEffect, useMemo, useState } from 'react'
import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { View, ScrollView, Text } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { Line } from '../../../components/atoms/Line'
import { TableArea } from '../../../components/atoms/TableArea'
import { DatePickButton, ReportType } from '../../../components/organisms/attendance/DatePickButton'
import { SiteCLType } from '../../../models/site/Site'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { autoCreateAttendanceOfSite, countAutoCreateAttendanceOfSite, getSiteForEditBundleAttendance } from '../../../usecases/attendance/SiteAttendanceCase'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { GlobalStyles, GreenColor } from '../../../utils/Styles'
import { RootStackParamList } from '../../Router'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { AppButton } from '../../../components/atoms/AppButton'
import { newDate } from '../../../utils/ext/Date.extensions'
import { CustomDate, getTextBetweenAnotherDate, timeBaseText } from '../../../models/_others/CustomDate'
import { StoreType } from '../../../stores/Store'
import { InputDateTimeBox } from '../../../components/organisms/inputBox/InputDateTimeBox'
import { THEME_COLORS } from '../../../utils/Constants'
import { Checkbox } from '../../../components/atoms/Checkbox'
import { updateLockOfTarget } from '../../../usecases/lock/CommonLockCase'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { UpdateScreenType } from '../../../models/updateScreens/UpdateScreens'
import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'
import { AttendanceType } from '../../../models/attendance/Attendance'
import { checkMyDepartment } from '../../../usecases/department/DepartmentCase'
import { departmentsToText } from '../../../usecases/worker/CommonWorkerCase'
import { _getSiteAttendanceData } from '../../../services/site/SiteArrangementService'
import { getNewAttendances, onUpdateAttendanceUpdateAllSiteAttendancesCache, onUpdateAttendanceUpdateSiteAttendanceCache } from '../../../usecases/attendance/CommonAttendanceCase'

type NavProps = StackNavigationProp<RootStackParamList, 'EditBundleAttendance'>
type RouteProps = RouteProp<RootStackParamList, 'EditBundleAttendance'>

type InitialStateType = {
    siteId?: string
    requestId?: string
    update: number
    attendances?: AttendanceType[]
} & EditBundleAttendanceUIType

export type EditBundleAttendanceUIType = {
    startReport?: ReportType
    endReport?: ReportType
    site?: SiteCLType
    overtimeWork?: CustomDate
    earlyLeaveTime?: CustomDate
    midnightWorkTime?: CustomDate
    isHolidayWork?: boolean
    behindTime?: CustomDate
    targetCount?: number
}

const initialState: InitialStateType = {
    startReport: undefined,
    endReport: undefined,
    targetCount: 0,
    update: 0,
}

const EditBundleAttendance = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ startReport, endReport, site, requestId, targetCount, update, siteId, overtimeWork, earlyLeaveTime, midnightWorkTime, isHolidayWork, behindTime, attendances }, setState] =
        useState(initialState)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state.account?.signInUser)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const { t } = useTextTranslation()
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])

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
                if (siteId == undefined) {
                    return
                }

                if (isFocused) dispatch(setLoading(true))
                const result = await getSiteForEditBundleAttendance({ siteId })
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                const resultCount = await countAutoCreateAttendanceOfSite({ siteId, requestId, companyId: myCompanyId, myWorkerId: signInUser?.workerId })

                if (resultCount.error) {
                    throw {
                        error: resultCount.error,
                    }
                }

                setState((prev) => ({
                    ...prev,
                    ...result.success?.site,
                    site: result.success?.site,
                    attendances: result.success?.attendances,
                    startReport: undefined,
                    endReport: undefined,
                    targetCount: resultCount.success,
                }))
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
    }, [siteId, update])

    useEffect(() => {
        navigation.setOptions({ title: t('admin:AttendanceCompilationAndEditing') })
        setState((prev) => ({ ...prev, siteId: route?.params?.siteId, requestId: route?.params?.requestId }))
    }, [])

    const onStartTimeChange = (report: ReportType) => {
        setState((prev) => ({ ...prev, startReport: report }))
    }

    const onEndTimeChange = (report: ReportType) => {
        setState((prev) => ({ ...prev, endReport: report }))
    }

    const _autoCreateAttendances = async () => {
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
            if (siteId == undefined) {
                throw {
                    error: '現場情報がありません。',
                } as CustomResponse
            }

            if (myCompanyId == undefined) {
                throw {
                    error: '自社情報がありません。',
                } as CustomResponse
            }

            if (signInUser?.accountId == undefined) {
                throw {
                    error: 'アカウント情報がありません。',
                } as CustomResponse
            }

            if (signInUser?.workerId == undefined) {
                throw {
                    error: '作業員情報がありません。',
                } as CustomResponse
            }
            const siteAttendanceDataResult = await _getSiteAttendanceData({ siteId, respondRequestId: requestId, myCompanyId: myCompanyId, myWorkerId: signInUser?.workerId })
            if (siteAttendanceDataResult.error) {
                throw {
                    error: siteAttendanceDataResult.error,
                }
            }
            const unReportAttendances = uniqBy(
                flatten(siteAttendanceDataResult.success?.siteCompanies?.map((company) => company.arrangedWorkers?.map((worker) => worker.attendance))).filter(
                    (data) => data != undefined && !data.isReported,
                ),
                (att) => att?.attendanceId,
            ) as AttendanceType[]
            const newAttendancesResult = await Promise.all(
                unReportAttendances.map((_attendance) =>
                    getNewAttendances({
                        attendanceId: _attendance.attendanceId,
                        startDate: startReport as CustomDate,
                        endDate: startReport == 'absence' ? undefined : (endReport as CustomDate),
                        overtimeWork,
                        earlyLeaveTime,
                        midnightWorkTime,
                        isHolidayWork,
                        behindTime,
                        isUnconfirmed: _attendance.worker == undefined || _attendance.arrangement == undefined,
                        editWorkerId: signInUser?.workerId,
                        myCompanyId: myCompanyId,
                        accountId: signInUser?.accountId,
                        siteId: siteId,
                    }),
                ),
            )
            const newAttendances = newAttendancesResult.map((result) => result.success)
            await onUpdateAttendanceUpdateSiteAttendanceCache({
                newAttendances: newAttendances as AttendanceType[],
                myCompanyId: myCompanyId,
                accountId: signInUser?.accountId,
                siteId: siteId,
            })
            await onUpdateAttendanceUpdateAllSiteAttendancesCache({
                newAttendances: newAttendances as AttendanceType[],
                myCompanyId: myCompanyId,
                accountId: signInUser?.accountId,
                date: startReport as CustomDate,
            })

            if (isFocused) {
                dispatch(setLoading(false))
            }
            navigation.goBack()
            dispatch(
                setToastMessage({
                    text: `${targetCount}${t('admin:AttendanceOfTheCaseReported')}`,
                    type: 'success',
                } as ToastMessage),
            )

            const result = await autoCreateAttendanceOfSite({
                siteId,
                requestId,
                startDate: startReport as CustomDate,
                endDate: startReport == 'absence' ? undefined : (endReport as CustomDate),
                companyId: myCompanyId,
                myWorkerId: signInUser?.workerId,
                earlyLeaveTime,
                isHolidayWork,
                behindTime,
                overtimeWork,
                midnightWorkTime,
                isAbsence: startReport == 'absence' ? true : undefined,
                editWorkerId: signInUser?.workerId,
            })

            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            await updateLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: siteId ?? 'no-id',
                modelType: 'site',
                unlock: true,
            })
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

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            style={{
                flex: 1,
                paddingHorizontal: 10,
                backgroundColor: '#fff',
            }}>
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
                    {t('admin:OnsiteInformation')}
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
                            content: site?.meetingDate ? timeBaseText(site?.meetingDate) : '未定',
                        },
                        {
                            key: '作業時間',
                            content: site?.startDate ? getTextBetweenAnotherDate(site?.startDate, site.endDate) : '未定',
                        },
                        {
                            key: '対象作業員数',
                            content: targetCount?.toString(),
                        },
                    ]}
                />
            </View>

            <Line
                style={{
                    marginTop: 15,
                }}
            />
            <View
                style={{
                    marginTop: 15,
                }}>
                <Text style={[GlobalStyles.headerText, {}]}>{t('admin:InitiationReport')}</Text>
                <DatePickButton
                    style={{
                        marginTop: 15,
                    }}
                    onDateChange={onStartTimeChange}
                    date={startReport}
                    initDate={startReport != 'absence' ? startReport ?? site?.startDate : site?.startDate}
                    type={'start'}
                />
            </View>

            {startReport != 'absence' && (
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
                        <DatePickButton
                            style={{
                                marginTop: 15,
                            }}
                            onDateChange={onEndTimeChange}
                            date={endReport}
                            initDate={endReport != 'absence' ? endReport ?? site?.endDate : site?.endDate}
                            type={'end'}
                        />
                    </View>
                </>
            )}
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
                    value={behindTime}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, behindTime: value }))
                    }}
                    color={GreenColor}
                    dateInputMode={'time'}
                />
                <InputDateTimeBox
                    title={t('admin:LeaveEarly')}
                    style={{
                        marginBottom: 20,
                    }}
                    initDateInput={newDate({
                        hour: 1,
                        minute: 0,
                    }).toCustomDate()}
                    placeholder={'00:00'}
                    infoText={t('admin:DifferenceFromPrescribedWorkingHours')}
                    value={earlyLeaveTime}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, earlyLeaveTime: value }))
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
                    value={overtimeWork}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, overtimeWork: value }))
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
                    value={midnightWorkTime}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, midnightWorkTime: value }))
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
                    checked={isHolidayWork}
                    onChange={(value) => {
                        setState((prev) => ({ ...prev, isHolidayWork: value }))
                    }}
                />
            </View>
            <View
                style={{
                    marginTop: 20,
                    marginHorizontal: 10,
                }}>
                <AppButton
                    onPress={async () => {
                        /*
                        if (startReport != undefined && startReport != 'absence' && site?.startDate?.dayBaseText() != (startReport as CustomDate).dayBaseText()) {
                            dispatch(
                                setToastMessage({
                                    text: '現場日付と作業開始日付が異なります',
                                    type: 'error',
                                } as ToastMessage),
                            )
                            return
                        }
                        */
                        await _autoCreateAttendances()
                    }}
                    title={t('admin:SummarizeAndReportAttendance')}
                />
                <Text
                    style={[
                        GlobalStyles.smallGrayText,
                        {
                            marginTop: 7,
                            textAlign: 'center',
                        },
                    ]}>
                    {t('admin:IfCompletedAttendanceReportWillNotChange')}
                </Text>
            </View>
            <BottomMargin />
        </ScrollView>
    )
}
export default EditBundleAttendance
