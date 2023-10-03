import { ReportType } from '../../components/organisms/attendance/DatePickButton'
import { AttendanceCLType, AttendanceType, toAttendanceCLType } from '../../models/attendance/Attendance'
import { SiteCLType, SiteType, toSiteCLType } from '../../models/site/Site'
import { Update } from '../../models/_others/Common'
import { LocationInfoModel } from '../../models/_others/LocationInfoType'
import { _getArrangement } from '../../services/arrangement/ArrangementService'
import { _createAttendance, _getAttendance, _updateAttendance } from '../../services/attendance/AttendanceService'
import { _getSite } from '../../services/site/SiteService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { CustomDate, getHHmmTotalSeconds, newCustomDate } from "../../models/_others/CustomDate"
import { getErrorMessage } from '../../services/_others/ErrorService'
import { toWorkerCLType, WorkerType } from '../../models/worker/Worker'
import { deleteFieldParam } from '../../services/firebase/FirestoreService'
import { PopupType } from '../../screens/workerSide/attendance/AttendancePopup'
import { AttendanceModificationCLType, AttendanceModificationModel, toAttendanceModificationCLType } from '../../models/attendanceModification/AttendanceModification'

export type GetSiteAndAttendanceParam = {
    attendanceId?: string
    arrangementId?: string
}

export type GetSiteAndAttendanceResponse =
    | {
          attendance?: AttendanceCLType
          attendanceModification?: AttendanceModificationCLType
          site?: SiteCLType
      }
    | undefined

export const getSiteAndAttendance = async (params: GetSiteAndAttendanceParam): Promise<CustomResponse<GetSiteAndAttendanceResponse>> => {
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
        let attendanceModification = undefined as undefined | AttendanceModificationModel
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
                    attendanceModification = arrangement.attendanceModification
                }
            }
        }

        const rtnObj: GetSiteAndAttendanceResponse = {
            attendance: {
                ...toAttendanceCLType(attendance),
                worker: toWorkerCLType(worker),
            },
            site: toSiteCLType(site),
            attendanceModification: attendanceModification ? toAttendanceModificationCLType(attendanceModification) : undefined,
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
} & AttendanceCLType

export type UpdateAttendanceResponse = boolean | undefined

export const updateAttendance = async (params: UpdateAttendanceParam): Promise<CustomResponse<UpdateAttendanceResponse>> => {
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
        /**
         * attendanceが存在しないなら、空を入力。
         */
        const update: Update<AttendanceType> = {
            ...attendance,
            overtimeWork: isAbsence || (overtimeWork == undefined || (overtimeWork?.hour == 0 && overtimeWork.minute == 0)) ? deleteFieldParam() : getHHmmTotalSeconds(overtimeWork),
            earlyLeaveTime: isAbsence || (earlyLeaveTime == undefined || (earlyLeaveTime?.hour == 0 && earlyLeaveTime.minute == 0)) ? deleteFieldParam() : getHHmmTotalSeconds(earlyLeaveTime),
            midnightWorkTime: isAbsence || (midnightWorkTime == undefined || (midnightWorkTime?.hour == 0 && midnightWorkTime.minute == 0)) ? deleteFieldParam() : getHHmmTotalSeconds(midnightWorkTime),
            isHolidayWork: isAbsence ? deleteFieldParam() : isHolidayWork ?? false,
            behindTime: isAbsence || (behindTime == undefined || (behindTime?.hour == 0 && behindTime.minute == 0)) ? deleteFieldParam() : getHHmmTotalSeconds(behindTime),
            
            ...side == 'start' ? {
                isAbsence: isStartNotEntered ? deleteFieldParam() : isAbsence,
                startDate: (isStartNotEntered || isAbsence) ? deleteFieldParam() : startDate?.totalSeconds,
                startComment,
                startLocationInfo,
            } : {
                endDate: (isEndNotEntered || isAbsence) ? deleteFieldParam() : endDate?.totalSeconds,
                endLocationInfo,
                endComment,
            }
        }

        if (side == 'start') {
            update['startStampDate'] = newCustomDate().totalSeconds
        } else if (side == 'end') {
            update['endStampDate'] = newCustomDate().totalSeconds
        }
        
        if (attendance != undefined) {
            const result = await _updateAttendance(update)
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            return Promise.resolve({
                success: true,
            })
        } else {
            update['attendanceId'] = attendanceId
            
            const result = await _createAttendance(update as AttendanceType)
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
