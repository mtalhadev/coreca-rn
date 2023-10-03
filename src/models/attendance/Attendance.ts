import { CustomDate, toCustomDateFromTotalSeconds } from '../_others/CustomDate'
import { ArrangementCLType, ArrangementType, toArrangementCLType } from '../arrangement/Arrangement'
import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker'
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common'
import { LocationInfoModel, LocationInfoType } from '../_others/LocationInfoType'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'
import { HHmmTotalSecondsParam, TotalSeconds } from '../_others/TotalSeconds'
import { ID } from '../_others/ID'
import { InvRequestListType } from '../invRequest/InvRequestListType'

/**
 * @param startDate - 作業開始日時。
 * @param startStampDate - 作業開始時間の作業員による打刻日時。編集不可。
 * @param endDate - 作業終了日時。
 * @param endStampDate - 作業終了時間の作業員による打刻日時。編集不可。
 * @param startEditWorkerId - 管理者が編集した際にそのIDを保存。
 * @param endEditWorkerId - 管理者が編集した際にそのIDを保存。
 */
export type AttendanceModel = Partial<{
    attendanceId: ID
    startDate: TotalSeconds
    startStampDate: TotalSeconds
    endDate: TotalSeconds
    endStampDate: TotalSeconds
    startComment: string
    endComment: string
    isAbsence: boolean
    startLocationInfo: LocationInfoModel
    endLocationInfo: LocationInfoModel
    startEditWorkerId: ID
    endEditWorkerId: ID

    // 以下時間情報（hh:mm）のみ必要。
    overtimeWork: HHmmTotalSecondsParam
    earlyLeaveTime: HHmmTotalSecondsParam
    midnightWorkTime: HHmmTotalSecondsParam
    isHolidayWork: boolean
    behindTime: HHmmTotalSecondsParam

    // Arrangementとは１対１で繋がる。作業員未確定の場合は'unconfirmed'になる。
    arrangementId: ID | 'unconfirmed'
    // 非正規化
    workerId: ID
    //未承認： false,承認：true
    isApprove?: boolean
}> &
    CommonModel

export const initAttendance = (attendance: Create<AttendanceModel> | Update<AttendanceModel>): Update<AttendanceModel> => {
    const newAttendance: Update<AttendanceModel> = {
        attendanceId: attendance.attendanceId,
        startDate: attendance.startDate,
        startStampDate: attendance.startStampDate,
        endDate: attendance.endDate,
        endStampDate: attendance.endStampDate,
        startComment: attendance.startComment,
        endComment: attendance.endComment,
        isAbsence: attendance.isAbsence,
        startLocationInfo: attendance.startLocationInfo,
        endLocationInfo: attendance.endLocationInfo,
        startEditWorkerId: attendance.startEditWorkerId,
        endEditWorkerId: attendance.endEditWorkerId,

        overtimeWork: attendance.overtimeWork,
        earlyLeaveTime: attendance.earlyLeaveTime,
        midnightWorkTime: attendance.midnightWorkTime,
        isHolidayWork: attendance.isHolidayWork,
        behindTime: attendance.behindTime,

        arrangementId: attendance.arrangementId,
        workerId: attendance.workerId,
        isApprove: attendance.isApprove,
    }
    return newAttendance
}

/**
 * {@link WorkerOptionInputParam - 説明}
 */
export type AttendanceOptionInputParam = ReplaceAnd<
    GetOptionObjectType<AttendanceOptionParam>,
    {
        // arrangements: OptionType<{
        //     companyId?: ID
        // }>,
    }
>

/**
 * {@link WorkerOptionParam - 説明}
 */
export type AttendanceOptionParam = {
    arrangement?: ArrangementType
    worker?: WorkerType
    startEditWorker?: WorkerType
    endEditWorker?: WorkerType
    isReported?: boolean
    invRequests?: InvRequestListType
}

export type AttendanceType = AttendanceModel &
    AttendanceOptionParam & {
        startLocationInfo?: LocationInfoType
        endLocationInfo?: LocationInfoType
    }
export type GetAttendanceOptionParam = GetOptionParam<AttendanceType, AttendanceOptionParam, AttendanceOptionInputParam>

export type AttendanceCLType = ReplaceAnd<
    AttendanceType,
    {
        startDate?: CustomDate
        startStampDate?: CustomDate
        endDate?: CustomDate
        endStampDate?: CustomDate
        worker?: WorkerCLType
        arrangement?: ArrangementCLType
        startEditWorker?: WorkerCLType
        endEditWorker?: WorkerCLType
        overtimeWork?: CustomDate
        earlyLeaveTime?: CustomDate
        midnightWorkTime?: CustomDate
        behindTime?: CustomDate
    } & CommonCLType
>

export const toAttendanceCLType = (data?: AttendanceType): AttendanceCLType => {
    return {
        ...data,
        ...toCommonCLType(data),
        startDate: data?.startDate ? toCustomDateFromTotalSeconds(data?.startDate, true) : undefined,
        endDate: data?.endDate ? toCustomDateFromTotalSeconds(data?.endDate, true) : undefined,
        startStampDate: data?.startStampDate ? toCustomDateFromTotalSeconds(data?.startStampDate, true) : undefined,
        endStampDate: data?.endStampDate ? toCustomDateFromTotalSeconds(data?.endStampDate, true) : undefined,
        arrangement: data?.arrangement ? toArrangementCLType(data?.arrangement) : undefined,
        worker: data?.worker ? toWorkerCLType(data.worker) : undefined,
        startEditWorker: data?.startEditWorker ? toWorkerCLType(data?.startEditWorker) : undefined,
        endEditWorker: data?.endEditWorker ? toWorkerCLType(data?.endEditWorker) : undefined,
        overtimeWork: data?.overtimeWork ? toCustomDateFromTotalSeconds(data?.overtimeWork, true) : undefined,
        earlyLeaveTime: data?.earlyLeaveTime ? toCustomDateFromTotalSeconds(data?.earlyLeaveTime, true) : undefined,
        midnightWorkTime: data?.midnightWorkTime ? toCustomDateFromTotalSeconds(data?.midnightWorkTime, true) : undefined,
        behindTime: data?.behindTime ? toCustomDateFromTotalSeconds(data?.behindTime, true) : undefined,
    } as AttendanceCLType
}
