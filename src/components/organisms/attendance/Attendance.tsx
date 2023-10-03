/* eslint-disable indent */
import React, { useMemo } from 'react'
import { Text, Pressable, View, ViewStyle, Alert } from 'react-native'

import { BlueColor, ColorStyle, GlobalStyles } from '../../../utils/Styles'
import { CustomDate, compareWithAnotherDate, getDailyStartTime, nextDay, timeBaseText, timeText, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { AttendanceElement } from './AttendanceElement'
import { AppSide } from '../site/SiteAttendance'
import { AttendanceCLType } from '../../../models/attendance/Attendance'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { toReportType } from '../../../usecases/attendance/CommonAttendanceCase'
import { ArrangementCLType } from '../../../models/arrangement/Arrangement'
import { TableArea } from '../../atoms/TableArea'
import { THEME_COLORS } from '../../../utils/Constants'
import { Icon } from '../../atoms/Icon'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { useDispatch, useSelector } from 'react-redux'
import { AppButton } from '../../atoms/AppButton'
import { checkMyDepartment } from '../../../usecases/department/DepartmentCase'
import { departmentsToText } from '../../../usecases/worker/CommonWorkerCase'
import { checkLockOfTarget } from '../../../usecases/lock/CommonLockCase'
import { ToastMessage, setLoading, setToastMessage } from '../../../stores/UtilSlice'
import { getErrorMessage } from '../../../services/_others/ErrorService'
import { CustomResponse } from '../../../../__tests__/utils/seed/lib/CustomResponse'
import { approveTargetAttendanceModification } from '../../../usecases/attendance/WorkerAttendanceModificationCase'
import { StoreType } from '../../../stores/Store'

export type AttendanceProps = {
    attendance?: AttendanceCLType
    arrangement?: ArrangementCLType
    siteDate?: CustomDate
    /**
     * 作業員未確定用
     */
    siteId?: string
    canEdit?: boolean
    canModifyAttendance?: boolean
    withBorderLine?: boolean
    side?: AppSide
    color?: ColorStyle
    style?: ViewStyle

    /**
     * 一般作業員の現場管理者用
     */
    isSiteManager?: boolean
}

export const Attendance = React.memo((props: Partial<AttendanceProps>) => {
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const isFocused = useIsFocused()
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])
    const navigation = useNavigation<any>()
    const dispatch = useDispatch()
    const { t } = useTextTranslation()

    let { attendance, style, arrangement, canEdit, canModifyAttendance, siteDate, withBorderLine, siteId, side, color, isSiteManager } = props
    color = color ?? BlueColor
    side = side ?? 'admin'

    const endOnTheNextDay = (attendance?: AttendanceCLType) => {
        if (attendance == undefined) return false

        const startDate = toReportType(attendance, 'start')
        const endDate = toReportType(attendance, 'end')

        if (startDate != undefined && startDate != 'absence' && endDate != undefined) {
            const _start = getDailyStartTime(startDate as CustomDate)
            const _end = getDailyStartTime(endDate as CustomDate)
            return nextDay(_start, 1).totalSeconds == _end.totalSeconds
        }
        return false
    }

    const displayModificationStart =
        (arrangement?.attendanceModification?.modificationInfo.startDate || arrangement?.attendanceModification?.modificationInfo.isAbsence) &&
        arrangement?.attendanceModification?.status != 'approved'

    const displayModificationEnd = arrangement?.attendanceModification?.modificationInfo.endDate && arrangement?.attendanceModification?.status != 'approved'

    /**
     * 遅刻・欠席など定時以外かどうか。
     */
    const _isStartNotOnTime = (item?: AttendanceCLType) => {
        return item?.arrangement?.attendance?.isAbsence == true || item?.arrangement?.attendance?.behindTime != undefined || item?.isAbsence == true || item?.behindTime != undefined
    }

    const _isEndNotOnTime = (item?: AttendanceCLType) => {
        return (
            item?.arrangement?.attendance?.earlyLeaveTime != undefined ||
            item?.arrangement?.attendance?.overtimeWork != undefined ||
            item?.arrangement?.attendance?.midnightWorkTime != undefined ||
            item?.earlyLeaveTime != undefined ||
            item?.overtimeWork != undefined ||
            item?.midnightWorkTime != undefined
        )
    }

    /**
     * @param stampDate
     * @returns 0: 当日, 1: 翌日, 2: それ以降（同年）, 3: 翌年以降, -1: 未定義
     */
    const _dayDiff = (stampDate?: CustomDate): number | undefined => {
        const _siteDate = arrangement?.site?.siteDate ? toCustomDateFromTotalSeconds(arrangement?.site?.siteDate) : siteDate

        if (stampDate == undefined) return -1
        if (_siteDate == undefined) return 2

        const _stampDate = getDailyStartTime(stampDate)
        const _startDate = getDailyStartTime(_siteDate)

        if (_stampDate.year != _startDate.year) return 3

        const diff = compareWithAnotherDate(_startDate, _stampDate).days

        return diff < 2 ? diff : 2
    }

    const _approveAttendanceModification = async () => {
        try {
            const attendanceModification = arrangement?.attendanceModification
            const site = arrangement?.site
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
            const result = await approveTargetAttendanceModification({ attendanceModificationId, targetAttendanceId: attendance?.attendanceId ?? arrangement?.attendance?.attendanceId })
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
                    text: t('admin:AttendanceModificationApproved'),
                    type: 'success',
                } as ToastMessage),
            )
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    return (
        <View style={[{}, style]}>
            <Pressable
                onPress={() => {
                    if (side == 'admin') {
                        if (canEdit == false) return
                        navigation.push(
                            'AttendanceDetail',
                            {
                                attendanceId: attendance?.attendanceId ?? arrangement?.attendanceId,
                                arrangementId: arrangement?.arrangementId,
                                siteId: siteId,
                            },
                            {},
                        )
                    } else if (side == 'worker' && isSiteManager) {
                        if (canEdit == false) return
                        navigation.push(
                            'AttendanceDetail',
                            {
                                attendanceId: attendance?.attendanceId ?? arrangement?.attendanceId,
                                arrangementId: arrangement?.arrangementId,
                                siteId: siteId,
                            },
                            {},
                        )
                    } else {
                        if (attendance?.endDate || attendance?.isAbsence) {
                            if (side == 'worker' && !canModifyAttendance) return
                            Alert.alert(`${t('worker:ModifyAttendance')}`, `${t('worker:WouldLikeModifyAttendance')}`, [
                                {
                                    text: `${t('worker:ModifyStartAttendance')}`,
                                    onPress: () =>
                                        navigation.push(
                                            'AttendancePopup',
                                            {
                                                arrangementId: arrangement?.arrangementId,
                                                attendanceId: attendance?.attendanceId,
                                                type: 'start',
                                            },
                                            {},
                                        ),
                                },
                                {
                                    text: `${t('worker:ModifyEndAttendance')}`,
                                    onPress: () =>
                                        navigation.push(
                                            'AttendancePopup',
                                            {
                                                arrangementId: arrangement?.arrangementId,
                                                attendanceId: attendance?.attendanceId,
                                                type: 'end',
                                            },
                                            {},
                                        ),
                                },
                                { text: `${t('worker:cancel')}`, style: 'cancel' },
                            ])
                        } else {
                            if (canEdit == false) return
                            navigation.push(
                                'AttendancePopup',
                                {
                                    arrangementId: arrangement?.arrangementId,
                                    attendanceId: attendance?.attendanceId,
                                    /**
                                     * 作業開始がすでに入力されていたら作業終了に遷移する。
                                     */
                                    type: attendance?.startDate == undefined ? 'start' : 'end',
                                },
                                {},
                            )
                        }
                    }
                }}
                style={{
                    borderColor: withBorderLine ? THEME_COLORS.OTHERS.BORDER_COLOR : undefined,
                    borderWidth: withBorderLine ? 1 : undefined,
                    borderRadius: withBorderLine ? 10 : undefined,
                    padding: withBorderLine ? 10 : undefined,
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 5,
                }}>
                <View
                    style={{
                        flexDirection: 'column',
                        justifyContent: 'center',
                        marginTop: 5,
                        flex: 5.5,
                    }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignContent: 'center',
                                justifyContent: 'center',
                                flex: 1.5,
                            }}>
                            <Text
                                style={{
                                    ...GlobalStyles.smallText,
                                    fontSize: 12,
                                    lineHeight: 14,
                                }}>
                                {t('admin:WorkingTime')}
                            </Text>
                        </View>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 1.5,
                            }}>
                            <AttendanceElement
                                canEdit={canEdit}
                                timeColor={_isStartNotOnTime(attendance) ? THEME_COLORS.OTHERS.ALERT_RED : undefined}
                                color={color}
                                report={toReportType(attendance, 'start')}
                                isReportDate
                            />
                        </View>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 0.5,
                            }}>
                            {attendance?.isAbsence != true && (
                                <Text
                                    style={{
                                        ...GlobalStyles.smallText,
                                        fontSize: 10,
                                        lineHeight: 12,
                                    }}>
                                    ~
                                </Text>
                            )}
                        </View>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 1.5,
                            }}>
                            {endOnTheNextDay(attendance) && (
                                <Text
                                    style={{
                                        ...GlobalStyles.smallText,
                                        fontSize: 10,
                                        lineHeight: 12,
                                        marginRight: 3,
                                        color: _isEndNotOnTime(attendance) ? THEME_COLORS.OTHERS.ALERT_RED : undefined,
                                    }}>
                                    {t('common:NextDayShort')}
                                </Text>
                            )}
                            {attendance?.isAbsence != true && (
                                <AttendanceElement
                                    canEdit={canEdit}
                                    timeColor={_isEndNotOnTime(attendance) ? THEME_COLORS.OTHERS.ALERT_RED : undefined}
                                    color={color}
                                    report={toReportType(attendance, 'end')}
                                    isReportDate
                                />
                            )}
                        </View>
                        <View style={{ flex: 0.5 }} />
                    </View>

                    {/* 打刻日時 */}
                    {(attendance?.startStampDate != undefined || attendance?.endStampDate != undefined) && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flex: 1.5,
                                }}
                            />
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flex: 1.5,
                                }}>
                                {attendance?.startStampDate != undefined && (
                                    <AttendanceElement
                                        stampDate={attendance?.startStampDate}
                                        canEdit={canEdit}
                                        timeColor={THEME_COLORS.OTHERS.LIGHT_GRAY}
                                        isStampDate
                                        dayDiff={_dayDiff(attendance?.startStampDate)}
                                    />
                                )}
                            </View>
                            <View style={{ flex: 0.5 }} />
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignContent: 'center',
                                    justifyContent: 'center',
                                    flex: 1.5,
                                }}>
                                {attendance?.endStampDate != undefined && (
                                    <AttendanceElement
                                        stampDate={attendance?.endStampDate}
                                        canEdit={canEdit}
                                        timeColor={THEME_COLORS.OTHERS.LIGHT_GRAY}
                                        color={color}
                                        isStampDate
                                        dayDiff={_dayDiff(attendance?.endStampDate)}
                                    />
                                )}
                            </View>
                            <View style={{ flex: 0.5 }} />
                        </View>
                    )}
                </View>

                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1.5,
                        marginRight: 5,
                    }}>
                    <Text
                        style={{
                            marginRight: 5,
                            ...GlobalStyles.smallText,
                            fontSize: 10,
                            lineHeight: 14,
                            color: attendance?.isApprove == true ? THEME_COLORS.OTHERS.BLACK : THEME_COLORS.OTHERS.ALERT_RED,
                        }}>
                        ({attendance?.isApprove == true ? t('admin:approved') : t('admin:unapproved')})
                    </Text>
                    <Icon width={12} height={12} name={'edit'} fill={canEdit == true ? '#000' : THEME_COLORS.OTHERS.SUPER_LIGHT_GRAY} />
                </View>
            </Pressable>

            {attendance?.isAbsence != true &&
                (attendance?.behindTime != undefined ||
                    attendance?.overtimeWork != undefined ||
                    attendance?.earlyLeaveTime != undefined ||
                    attendance?.isHolidayWork == true ||
                    attendance?.midnightWorkTime != undefined ||
                    attendance?.startComment != undefined ||
                    attendance?.endComment != undefined) && (
                    <TableArea
                        style={{
                            paddingTop: 3,
                            paddingBottom: 3,
                            marginBottom: 5,
                        }}
                        lineHight={14}
                        columns={[
                            attendance?.startComment
                                ? {
                                      key: '開始コメント',
                                      content: attendance.startComment,
                                  }
                                : undefined,
                            attendance?.endComment
                                ? {
                                      key: '終了コメント',
                                      content: attendance.endComment,
                                  }
                                : undefined,
                            attendance?.behindTime
                                ? {
                                      key: '遅刻時間',
                                      content: timeText(attendance?.behindTime),
                                  }
                                : undefined,
                            attendance?.overtimeWork
                                ? {
                                      key: '残業時間',
                                      content: timeText(attendance?.overtimeWork),
                                  }
                                : undefined,
                            attendance?.midnightWorkTime
                                ? {
                                      key: '深夜労働',
                                      content: timeText(attendance?.midnightWorkTime),
                                  }
                                : undefined,
                            attendance?.isHolidayWork
                                ? {
                                      key: '休日労働',
                                      content: attendance?.isHolidayWork ? t('common:Yes') : t('common:No'),
                                  }
                                : undefined,
                            attendance?.earlyLeaveTime
                                ? {
                                      key: '早退',
                                      content: timeText(attendance?.earlyLeaveTime),
                                  }
                                : undefined,
                        ]}
                    />
                )}

            {/* 修正依頼 */}
            {(displayModificationStart || displayModificationEnd) && attendance?.isApprove != true && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            // paddingHorizontal: 5,
                            paddingVertical: 3,
                            borderRadius: 5,
                            borderColor: THEME_COLORS.OTHERS.GRAY,
                            borderWidth: 1,
                        }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 1.5,
                            }}>
                            <Text
                                style={{
                                    ...GlobalStyles.smallText,
                                    fontSize: 12,
                                    lineHeight: 14,
                                    textAlign: 'center',
                                }}>
                                {t('common:ModificationRequest')}
                            </Text>
                        </View>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 1.5,
                            }}>
                            {displayModificationStart && (
                                <AttendanceElement
                                    canEdit={canEdit}
                                    color={color}
                                    timeColor={_isStartNotOnTime(arrangement?.attendanceModification?.modificationInfo) ? THEME_COLORS.OTHERS.ALERT_RED : undefined}
                                    type={'start'}
                                    report={toReportType(arrangement?.attendanceModification?.modificationInfo, 'start')}
                                    arrangement={arrangement}
                                    isReportDate
                                />
                            )}
                        </View>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 0.5,
                            }}>
                            {displayModificationStart && displayModificationEnd && (
                                <Text
                                    style={{
                                        ...GlobalStyles.smallText,
                                        fontSize: 10,
                                        lineHeight: 12,
                                    }}>
                                    ~
                                </Text>
                            )}
                        </View>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: 1.5,
                            }}>
                            {displayModificationEnd && (
                                <>
                                    {endOnTheNextDay(arrangement?.attendanceModification?.modificationInfo) && (
                                        <Text
                                            style={{
                                                ...GlobalStyles.smallText,
                                                fontSize: 10,
                                                lineHeight: 12,
                                                color: _isEndNotOnTime(arrangement?.attendanceModification?.modificationInfo) ? THEME_COLORS.OTHERS.ALERT_RED : undefined,
                                                marginRight: -5,
                                            }}>
                                            {t('common:NextDayShort')}
                                        </Text>
                                    )}
                                    <AttendanceElement
                                        canEdit={canEdit}
                                        timeColor={_isEndNotOnTime(arrangement?.attendanceModification?.modificationInfo) ? THEME_COLORS.OTHERS.ALERT_RED : undefined}
                                        color={color}
                                        type={'end'}
                                        report={toReportType(arrangement?.attendanceModification?.modificationInfo, 'end')}
                                        arrangement={arrangement}
                                        isReportDate
                                    />
                                </>
                            )}
                        </View>
                        <View style={{ flex: 0.5 }} />

                        <View
                            style={{
                                flex: 1.5,
                                marginRight: 5,
                            }}>
                            {side == 'admin' && (
                                <AppButton
                                    title={t('admin:ApproveShort')}
                                    height={25}
                                    fontSize={10}
                                    onPress={() => {
                                        Alert.alert(t('admin:WantToApproveAttendanceModificationTitle'), t('admin:WantToApproveAttendanceModificationMessage'), [
                                            { text: t('admin:Approve'), onPress: () => _approveAttendanceModification() },
                                            {
                                                text: t('admin:Cancel'),
                                                style: 'cancel',
                                            },
                                        ])
                                    }}
                                    isGray
                                />
                            )}
                        </View>
                    </View>
                </View>
            )}
        </View>
    )
})
