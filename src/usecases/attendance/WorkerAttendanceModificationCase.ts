import { AttendanceCLType, AttendanceType, toAttendanceCLType } from '../../models/attendance/Attendance'
import { SiteCLType, SiteType, toSiteCLType } from '../../models/site/Site'
import { Update } from '../../models/_others/Common'
import { _getArrangement } from '../../services/arrangement/ArrangementService'
import { _createAttendance, _getAttendance, _updateAttendance } from '../../services/attendance/AttendanceService'
import { _getSite } from '../../services/site/SiteService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { CustomDate, getHHmmTotalSeconds, newCustomDate, timeBaseText, timeText, toCustomDateFromTotalSeconds, truncateSeconds } from '../../models/_others/CustomDate'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { toWorkerCLType, WorkerType } from '../../models/worker/Worker'
import { deleteFieldParam } from '../../services/firebase/FirestoreService'
import { PopupType } from '../../screens/workerSide/attendance/AttendancePopup'
import { getUuidv4 } from '../../utils/Utils'
import { AttendanceModificationCLType, AttendanceModificationModel, AttendanceModificationType } from '../../models/attendanceModification/AttendanceModification'
import { _approveAttendanceModification, _createAttendanceModification, _unApproveAttendanceModification, _updateAttendanceModification } from '../../services/attendance/AttendanceModificationService'
import cloneDeep from 'lodash/cloneDeep'
import isEmpty from 'lodash/isEmpty'
import { TFunction } from 'react-i18next'

export type GetSiteAndAttendanceParam = {
    attendanceId?: string
    arrangementId?: string
}

export type GetSiteAndAttendanceResponse =
    | {
          attendance?: AttendanceCLType
          site?: SiteCLType
      }
    | undefined

export const getSiteAndAttendanceModification = async (params: GetSiteAndAttendanceParam): Promise<CustomResponse<GetSiteAndAttendanceResponse>> => {
    try {
        const { attendanceId, arrangementId } = params

        if (attendanceId == undefined && arrangementId == undefined) {
            throw {
                error: '勤怠情報がありません。',
            } as CustomResponse
        }
        let site = undefined as undefined | SiteType
        let worker = undefined as undefined | WorkerType
        let attendance = undefined as undefined | AttendanceType
        if (attendanceId == undefined) {
            const result = await _getArrangement({
                arrangementId: arrangementId ?? 'no-id',
                options: {
                    attendance: true,
                    worker: true,
                    site: {
                        siteNameData: true,
                    },
                },
            })

            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: 'GET_ARRANGEMENT_ERROR',
                } as CustomResponse
            }
            attendance = result.success?.attendance
            site = result.success?.site
            worker = result.success?.worker
        } else {
            const resultAttendance = await _getAttendance({
                attendanceId: attendanceId,
                options: {
                    arrangement: {
                        worker: true,
                    },
                },
            })
            if (resultAttendance.error) {
                throw {
                    error: resultAttendance.error,
                    errorCode: 'GET_ATTENDANCE_ERROR',
                } as CustomResponse
            }
            attendance = resultAttendance.success
            const arrangement = attendance?.arrangement
            if (arrangement != undefined) {
                if (arrangement) {
                    const siteResult = await _getSite({
                        siteId: arrangement?.siteId ?? 'no-id',
                        options: {
                            siteNameData: true,
                        },
                    })
                    if (siteResult.error) {
                        throw {
                            error: siteResult.error,
                            errorCode: 'GET_SITE_ERROR',
                        }
                    }
                    site = siteResult.success
                }
            }
        }

        const rtnObj: GetSiteAndAttendanceResponse = {
            attendance: {
                ...toAttendanceCLType(attendance),
                worker: toWorkerCLType(worker),
            },
            site: toSiteCLType(site),
        }

        return Promise.resolve({
            success: rtnObj,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type UpdateAttendanceParam = {
    arrangementId?: string
    // 最適化用
    attendanceId?: string
    /**
     * 未入力かどうか
     */
    isStartNotEntered?: boolean
    isEndNotEntered?: boolean
    side: PopupType | undefined
    siteInfo: SiteCLType
    attendanceModification?: AttendanceModificationCLType
} & AttendanceCLType

export type UpdateAttendanceResponse = boolean | undefined

export const updateAttendanceModification = async (params: UpdateAttendanceParam): Promise<CustomResponse<UpdateAttendanceResponse>> => {
    try {
        const {
            arrangementId,
            isStartNotEntered,
            isEndNotEntered,
            attendanceId,
            startLocationInfo,
            endLocationInfo,
            startComment,
            endComment,
            isAbsence,
            startDate,
            endDate,
            behindTime,
            overtimeWork,
            earlyLeaveTime,
            midnightWorkTime,
            isHolidayWork,
            side,
            siteInfo,
            attendanceModification,
        } = params
        if (arrangementId == undefined && attendanceId == undefined) {
            throw {
                error: '情報が足りません。',
            }
        }

        if (startDate && endDate) {
            if (startDate.totalSeconds > endDate.totalSeconds) {
                throw {
                    error: '作業終了は作業開始以降にする必要があります。',
                }
            }
        }

        let attendance = undefined as AttendanceType | undefined

        if (attendanceId == undefined) {
            const arrangementResult = await _getArrangement({
                arrangementId: arrangementId ?? 'no-id',
                options: {
                    attendance: true,
                },
            })
            if (arrangementResult.error) {
                throw {
                    error: arrangementResult.error,
                }
            }
            attendance = arrangementResult.success?.attendance
        } else {
            const attendanceResult = await _getAttendance({
                attendanceId,
            })
            if (attendanceResult.error) {
                throw attendanceResult.error
            }
            attendance = attendanceResult.success
        }
        const originAttendance = cloneDeep(attendance)

        // 遅刻の自動計算
        if (attendance && startDate && siteInfo && siteInfo.startDate) {
            if (startDate.totalSeconds > siteInfo.startDate.totalSeconds) {
                attendance.startDate = startDate.totalSeconds
                const totalSeconds = (truncateSeconds(startDate.totalSeconds) - truncateSeconds(siteInfo.startDate?.totalSeconds)) / 1000
                attendance.behindTime = getHHmmTotalSeconds(new Date(0, 1, 0, 0, 0, totalSeconds).toCustomDate())
            } else {
                attendance.startDate = siteInfo.startDate.totalSeconds
                attendance.behindTime = undefined
            }
        }

        // 早退の自動計算
        if (attendance && endDate && siteInfo && siteInfo.endDate) {
            if (endDate.totalSeconds < siteInfo.endDate.totalSeconds) {
                attendance.endDate = endDate.totalSeconds
                const totalSeconds = (truncateSeconds(siteInfo.endDate?.totalSeconds) - truncateSeconds(endDate.totalSeconds)) / 1000
                attendance.earlyLeaveTime = getHHmmTotalSeconds(new Date(0, 1, 0, 0, 0, totalSeconds).toCustomDate())
            } else {
                attendance.endDate = siteInfo.endDate.totalSeconds
                attendance.earlyLeaveTime = undefined
            }
        }
        if (attendanceModification?.attendanceModificationId != undefined) {
            const update: Update<AttendanceType> = {
                ...attendance,
                overtimeWork: isAbsence || overtimeWork == undefined || (overtimeWork?.hour == 0 && overtimeWork.minute == 0) ? undefined : getHHmmTotalSeconds(overtimeWork),
                midnightWorkTime: isAbsence || midnightWorkTime == undefined || (midnightWorkTime?.hour == 0 && midnightWorkTime.minute == 0) ? undefined : getHHmmTotalSeconds(midnightWorkTime),
                isHolidayWork: isAbsence ? undefined : isHolidayWork ?? false,

                ...(side == 'start'
                    ? {
                          isAbsence: isStartNotEntered ? undefined : isAbsence,
                          startDate: isStartNotEntered || isAbsence ? undefined : attendance?.startDate,
                          endDate: isAbsence ? undefined : attendanceModification?.modificationInfo?.endDate?.totalSeconds,
                          startComment,
                          startLocationInfo,
                          endLocationInfo: isAbsence ? undefined : attendanceModification?.modificationInfo?.endLocationInfo,
                          behindTime: isAbsence || attendance?.behindTime == undefined || attendance.behindTime == 0 ? undefined : attendance.behindTime,
                          earlyLeaveTime: isAbsence ? undefined : attendanceModification?.modificationInfo?.earlyLeaveTime?.totalSeconds,
                      }
                    : {
                          isAbsence: false,
                          startDate: attendanceModification?.modificationInfo?.startDate?.totalSeconds,
                          endDate: isEndNotEntered ? undefined : attendance?.endDate,
                          startLocationInfo: attendanceModification?.modificationInfo?.startLocationInfo,
                          endLocationInfo,
                          endComment,
                          behindTime: attendanceModification?.modificationInfo?.behindTime?.totalSeconds,
                          earlyLeaveTime: attendance?.earlyLeaveTime == undefined || attendance.earlyLeaveTime == 0 ? undefined : attendance.earlyLeaveTime,
                      }),
            }
            if (side == 'start') {
                update['startStampDate'] = newCustomDate().totalSeconds
            } else if (side == 'end') {
                update['endStampDate'] = newCustomDate().totalSeconds
            }
            const newAttendanceModification = {
                attendanceModificationId: attendanceModification.attendanceModificationId,
                targetAttendanceId: attendanceModification.targetAttendanceId,
                status: 'edited',
                modificationInfo: update,
                originInfo: originAttendance,
            } as AttendanceModificationModel
            const result = await _updateAttendanceModification(newAttendanceModification)
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            return Promise.resolve({
                success: true,
            })
        } else {
            const update: Update<AttendanceType> = {
                ...attendance,
                overtimeWork: isAbsence || overtimeWork == undefined || (overtimeWork?.hour == 0 && overtimeWork.minute == 0) ? undefined : getHHmmTotalSeconds(overtimeWork),
                midnightWorkTime: isAbsence || midnightWorkTime == undefined || (midnightWorkTime?.hour == 0 && midnightWorkTime.minute == 0) ? undefined : getHHmmTotalSeconds(midnightWorkTime),
                isHolidayWork: isAbsence ? undefined : isHolidayWork ?? false,

                ...(side == 'start'
                    ? {
                          isAbsence: isStartNotEntered ? undefined : isAbsence,
                          startDate: isStartNotEntered || isAbsence ? undefined : attendance?.startDate,
                          endDate: isAbsence ? undefined : attendance?.endDate,
                          startComment,
                          startLocationInfo,
                          endLocationInfo: isAbsence ? undefined : attendance?.endLocationInfo,
                          behindTime: isAbsence || attendance?.behindTime == undefined || attendance.behindTime == 0 ? undefined : attendance.behindTime,
                          earlyLeaveTime: isAbsence ? undefined : attendance?.earlyLeaveTime,
                      }
                    : {
                          isAbsence: false,
                          startDate: attendance?.startDate,
                          endDate: isEndNotEntered ? undefined : attendance?.endDate,
                          startLocationInfo: attendance?.startLocationInfo,
                          endLocationInfo,
                          endComment,
                          behindTime: attendance?.behindTime,
                          earlyLeaveTime: attendance?.earlyLeaveTime == undefined || attendance.earlyLeaveTime == 0 ? undefined : attendance.earlyLeaveTime,
                      }),
            }
            if (side == 'start') {
                update['startStampDate'] = newCustomDate().totalSeconds
            } else if (side == 'end') {
                update['endStampDate'] = newCustomDate().totalSeconds
            }
            const newAttendanceModification = {
                attendanceModificationId: getUuidv4(),
                targetAttendanceId: attendanceId,
                status: 'created',
                modificationInfo: update,
                originInfo: originAttendance,
            } as AttendanceModificationModel
            const result = await _createAttendanceModification(newAttendanceModification)
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            return Promise.resolve({
                success: true,
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type UpdateTargetAttendanceModificationParam = {
    attendanceModificationId?: string
    targetAttendanceId?: string
}

export type ApproveAttendanceModificationResponse = boolean | undefined

export const approveTargetAttendanceModification = async (params: UpdateTargetAttendanceModificationParam): Promise<CustomResponse<ApproveAttendanceModificationResponse>> => {
    try {
        const { attendanceModificationId, targetAttendanceId } = params
        if (attendanceModificationId == undefined && targetAttendanceId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }

        const attendanceModificationResult = await _approveAttendanceModification(params)
        if (attendanceModificationResult.error) {
            throw {
                error: attendanceModificationResult.error,
                errorCode: attendanceModificationResult.errorCode,
            } as CustomResponse
        }

        const updateAttendanceResult = await _updateAttendance({
            attendanceId: targetAttendanceId,
            isApprove: true,
        })

        if (updateAttendanceResult.error) {
            throw {
                error: updateAttendanceResult.error,
                errorCode: updateAttendanceResult.errorCode,
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type UnApproveAttendanceModificationResponse = boolean | undefined

export const unApproveTargetAttendanceModification = async (params: UpdateTargetAttendanceModificationParam): Promise<CustomResponse<UnApproveAttendanceModificationResponse>> => {
    try {
        const { attendanceModificationId, targetAttendanceId } = params
        if (attendanceModificationId == undefined && targetAttendanceId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }

        const attendanceModificationResult = await _unApproveAttendanceModification(params)
        if (attendanceModificationResult.error) {
            throw {
                error: attendanceModificationResult.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const getAttendanceModificationDetailContents = (
    originValue: string | CustomDate | boolean | undefined,
    modifiedValue: string | CustomDate | boolean | undefined,
    valueType?: string | undefined,
    t?: TFunction<'translation', undefined>,
) => {
    if (t == undefined) {
        return ''
    }
    if (isEmpty(originValue)) {
        originValue = t('common:Unregistered')
    }

    if (valueType == 'datetime') {
        originValue = originValue as CustomDate
        if (isEmpty(originValue) || isNaN(originValue.totalSeconds)) {
            originValue = t('common:Unregistered')
        } else {
            originValue = timeBaseText(originValue as CustomDate)
        }
        modifiedValue = modifiedValue as CustomDate
        if (!isEmpty(modifiedValue) && !isNaN(modifiedValue.totalSeconds)) {
            modifiedValue = timeBaseText(modifiedValue as CustomDate)
        } else {
            return `変更前：${originValue}\n変更後：変更なし`
        }
    }

    if (valueType == 'time') {
        originValue = originValue as CustomDate
        if (isEmpty(originValue) || isNaN(originValue.totalSeconds)) {
            originValue = t('common:Unregistered')
        } else {
            originValue = timeText(originValue as CustomDate)
        }
        modifiedValue = modifiedValue as CustomDate
        if (isEmpty(modifiedValue) || isNaN(modifiedValue.totalSeconds)) {
            modifiedValue = t('common:Unregistered')
        } else {
            modifiedValue = timeText(modifiedValue as CustomDate)
        }
    }

    if (valueType == 'datetimeToAbsence') {
        originValue = originValue as CustomDate
        if (isEmpty(originValue) || isNaN(originValue.totalSeconds)) {
            originValue = t('common:Unregistered')
        } else {
            originValue = timeBaseText(originValue as CustomDate)
        }
        modifiedValue = modifiedValue as boolean
        if (modifiedValue) {
            modifiedValue = t('common:Absence')
        } else {
            return `変更前：${originValue}\n変更後：変更なし`
        }
    }

    if (valueType == 'absenceToDatetime') {
        originValue = t('common:Absence')
        if (modifiedValue) {
            modifiedValue = timeBaseText(modifiedValue as CustomDate)
        } else {
            return `変更前：${originValue}\n変更後：変更なし`
        }
    }

    if (originValue != modifiedValue) {
        return `変更前：${originValue}\n変更後：${modifiedValue}`
    } else {
        return `変更前：${originValue}\n変更後：変更なし`
    }
}

export const getAttendanceModificationDetail = (attendance?: AttendanceCLType, attendanceModification?: AttendanceModificationType, t?: TFunction<'translation', undefined>) => {
    let attendanceModificationList = []
    const startDate = attendance?.startDate
    const endDate = attendance?.endDate
    const modificationInfoStartDate = attendanceModification?.modificationInfo?.startDate ? toCustomDateFromTotalSeconds(attendanceModification?.modificationInfo.startDate) : undefined
    const modificationInfoEndDate = attendanceModification?.modificationInfo?.endDate ? toCustomDateFromTotalSeconds(attendanceModification?.modificationInfo.endDate) : undefined

    if (attendanceModification?.modificationInfo?.isAbsence && !attendance?.isAbsence) {
        attendanceModificationList.push({
            key: '作業開始',
            content: getAttendanceModificationDetailContents(startDate, attendanceModification?.modificationInfo.isAbsence, 'datetimeToAbsence', t),
        })
        attendanceModificationList.push({
            key: '作業終了',
            content: getAttendanceModificationDetailContents(endDate, attendanceModification?.modificationInfo.isAbsence, 'datetimeToAbsence', t),
        })
    } else if (!attendanceModification?.modificationInfo?.isAbsence && attendance?.isAbsence) {
        attendanceModificationList.push({
            key: '作業開始',
            content: getAttendanceModificationDetailContents(attendance?.isAbsence, modificationInfoStartDate, 'absenceToDatetime', t),
        })
        attendanceModificationList.push({
            key: '作業終了',
            content: getAttendanceModificationDetailContents(attendance?.isAbsence, modificationInfoEndDate, 'absenceToDatetime', t),
        })
    } else {
        attendanceModificationList.push({
            key: '作業開始',
            content: getAttendanceModificationDetailContents(startDate, modificationInfoStartDate, 'datetime', t),
        })
        attendanceModificationList.push({
            key: '作業終了',
            content: getAttendanceModificationDetailContents(endDate, modificationInfoEndDate, 'datetime', t),
        })
    }
    if (attendanceModification?.modificationInfo?.behindTime != attendance?.behindTime) {
        let origin = attendance?.behindTime
        let modified = attendanceModification?.modificationInfo?.behindTime ? toCustomDateFromTotalSeconds(attendanceModification?.modificationInfo?.behindTime) : undefined
        attendanceModificationList.push({
            key: '遅刻時間',
            content: getAttendanceModificationDetailContents(origin, modified, 'time', t),
        })
    }
    if (attendanceModification?.modificationInfo?.earlyLeaveTime != attendance?.earlyLeaveTime) {
        let origin = attendance?.earlyLeaveTime
        let modified = attendanceModification?.modificationInfo?.earlyLeaveTime ? toCustomDateFromTotalSeconds(attendanceModification?.modificationInfo?.earlyLeaveTime) : undefined
        attendanceModificationList.push({
            key: '早退時間',
            content: getAttendanceModificationDetailContents(origin, modified, 'time', t),
        })
    }
    if (attendanceModification?.modificationInfo?.overtimeWork != attendance?.overtimeWork) {
        let origin = attendance?.overtimeWork
        let modified = attendanceModification?.modificationInfo?.overtimeWork ? toCustomDateFromTotalSeconds(attendanceModification?.modificationInfo?.overtimeWork) : undefined
        attendanceModificationList.push({
            key: '残業時間',
            content: getAttendanceModificationDetailContents(origin, modified, 'time', t),
        })
    }
    if (attendanceModification?.modificationInfo?.midnightWorkTime != attendance?.midnightWorkTime) {
        let origin = attendance?.midnightWorkTime
        let modified = attendanceModification?.modificationInfo?.midnightWorkTime ? toCustomDateFromTotalSeconds(attendanceModification?.modificationInfo?.midnightWorkTime) : undefined
        attendanceModificationList.push({
            key: '深夜時間',
            content: getAttendanceModificationDetailContents(origin, modified, 'time', t),
        })
    }
    return attendanceModificationList
}
