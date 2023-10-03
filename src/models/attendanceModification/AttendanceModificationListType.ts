import { CommonListType, ReplaceAnd } from '../_others/Common'
import { AttendanceModificationCLType, AttendanceModificationModel, toAttendanceModificationCLType } from './AttendanceModification'

export type GetAttendanceModificationListType = 'all'[]

export type AttendanceModificationListType = CommonListType<AttendanceModificationModel> & {
    items?: AttendanceModificationModel[]
}

export type AttendanceModificationListCLType = ReplaceAnd<
    AttendanceModificationListType,
    {
        items?: AttendanceModificationCLType[]
    }
>

export const toAttendanceModificationListCLType = (data?: AttendanceModificationListType | undefined): AttendanceModificationListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toAttendanceModificationCLType(val)) : undefined,
    }
}

export const toAttendanceModificationListType = (items?: AttendanceModificationModel[], mode?: 'all' | 'none'): AttendanceModificationListType => {
    mode = mode ?? 'all'
    if (mode == 'none') {
        return {
            items,
        }
    }
    return {
        items,
    }
}
