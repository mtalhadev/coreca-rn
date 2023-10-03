import { CommonListType, ReplaceAnd } from '../_others/Common'
import { AttendanceCLType, AttendanceType, toAttendanceCLType } from './Attendance'

export type GetAttendanceListType = 'all'[]

export type AttendanceListType = CommonListType<AttendanceType> & {
    items?: AttendanceType[]
}

export type AttendanceListCLType = ReplaceAnd<
    AttendanceListType,
    {
        items?: AttendanceCLType[]
    }
>

export const toAttendanceListCLType = (data?: AttendanceListType): AttendanceListCLType => {
    return {
        ...data,
        items: data?.items?.map((val) => toAttendanceCLType(val)),
    }
}

export const toAttendanceListType = (items?: AttendanceType[], mode?: 'all' | 'none'): AttendanceListType => {
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
