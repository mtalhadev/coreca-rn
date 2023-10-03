import { CommonCLType, CommonModel, Create, ReplaceAnd, Update } from '../_others/Common'
import { AttendanceCLType, AttendanceModel, toAttendanceCLType } from '../attendance/Attendance'

/**
 * created -作成済
 * edited - 編集済
 * deleted - 削除済
 * approved - 承認済
 * unapproved - 非承認済
 */
export type AttendanceModificationStatusType = 'created' | 'edited' | 'deleted' | 'approved' | 'unapproved'

export type AttendanceModificationModel = Partial<{
    attendanceModificationId: string
    targetAttendanceId: string
    status: AttendanceModificationStatusType
    modificationInfo: AttendanceModel
    originInfo: AttendanceModel
}> &
    CommonModel

export const initAttendanceModification = (AttendanceModification: Create<AttendanceModificationModel> | Update<AttendanceModificationModel>): Update<AttendanceModificationModel> => {
    const newAttendanceModification: Update<AttendanceModificationModel> = {
        attendanceModificationId: AttendanceModification.attendanceModificationId,
        targetAttendanceId: AttendanceModification.targetAttendanceId,
        status: AttendanceModification.status,
        modificationInfo: AttendanceModification.modificationInfo,
        originInfo: AttendanceModification.originInfo,
    }
    return newAttendanceModification
}

export type AttendanceModificationType = AttendanceModificationModel 

export type AttendanceModificationCLType = ReplaceAnd<
    AttendanceModificationType,
    {
        attendanceModificationId: string
        targetAttendanceId: string
        status: AttendanceModificationStatusType
        modificationInfo: AttendanceCLType
        originInfo: AttendanceCLType
    } & CommonCLType
>

export const toAttendanceModificationCLType = (data?: AttendanceModificationModel): AttendanceModificationCLType => {
    return {
        ...data,
        modificationInfo: data ? toAttendanceCLType(data?.modificationInfo) : undefined,
        originInfo: data ? toAttendanceCLType(data?.originInfo) : undefined,
    } as AttendanceModificationCLType
}
