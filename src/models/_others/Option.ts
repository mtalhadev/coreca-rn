import { AccountType, GetAccountOptionParam } from '../account/Account'
import { CompanyType, GetCompanyOptionParam } from '../company/Company'
import { CustomResponse } from './CustomResponse'
import { AttendanceType, GetAttendanceOptionParam } from '../attendance/Attendance'
import { GetNotificationOptionParam, NotificationType } from '../notification/Notification'
import { GetPartnershipOptionParam, PartnershipType } from '../partnership/Partnership'
import { GetProjectOptionParam, ProjectType } from '../project/Project'
import { GetRequestOptionParam, RequestType } from '../request/Request'
import { GetSiteOptionParam, SiteType } from '../site/Site'
import { DateDataType, GetDateDataOptionParam } from '../date/DateDataType'
import { GetWorkerOptionParam, WorkerType } from '../worker/Worker'
import { ArrangementType, GetArrangementOptionParam } from '../arrangement/Arrangement'
import { ConstructionType, GetConstructionOptionParam } from '../construction/Construction'
import { ContractType, GetContractOptionParam } from '../contract/Contract'
import { CommonListType } from './Common'
import { GetReservationOptionParam, ReservationType } from '../reservation/Reservation'
import { GetInvRequestOptionParam, InvRequestType } from '../invRequest/InvRequestType'
import { GetInvReservationOptionParam, InvReservationType } from '../invReservation/InvReservation'
import { GetMessageOptionParam, MessageType } from '../message/Message'
import { GetReactionOptionParam, ReactionType } from '../reaction/Reaction'
import { GetReadOptionParam, ReadType } from '../read/Read'
import { GetRoomOptionParam, RoomType } from '../room/Room'
import { GetRoomUserOptionParam, RoomUserType } from '../roomUser/RoomUser'
import { GetThreadHeadOptionParam, ThreadHeadType } from '../threadHead/ThreadHead'
import { ThreadLogOptionParam, ThreadLogType } from '../threadLog/ThreadLog'
import { DepartmentType, GetDepartmentOptionParam } from '../department/DepartmentType'
import { ContractLogType, GetContractLogOptionParam } from '../contractLog/ContractLog'

export type OptionParam<T> = boolean | { [P in keyof T]?: T[P] | undefined | boolean }

/**
 * OptionInputParam作成時に使用。
 */
export type OptionType<Input = undefined> = {
    params?: Input
}

/**
 * OptionInputParam作成時に使用。
 */
export type GetOptionObjectType<T> = { [K in keyof T]: OptionType }

/**
 *
 * @param options
 * @returns booleanを除いて返す。{}にする。
 */
export const getOption = (options?: OptionParam<any>): any => {
    return options == undefined || typeof options == 'boolean' ? {} : options
}

/**
 * optionsの非同期処理のために。
 */
export type OptionPromiseType<T> = { [P in keyof T]?: Promise<CustomResponse<T[P]>> }

/**
 * _getのoptionの定義を型から自動で作成する。
 */
export type GetOptionParam<Type, Output, InputOption extends { [K in keyof Output]: any }> = {
    [P in keyof Output]: (
        | boolean
        | undefined
        | {
              [Q in keyof GetAnyOptionParam<Output[P]>]: boolean | undefined | GetAnyOptionParam<Output[P]>[Q]
          }
    ) &
        InputOption[P]
} & {
    withoutSelf?: Type
}

/**
 * 新しいmodelを追加するときはここにも追加する。
 */
export type GetAnyOptionParam<T> = Required<T> extends Required<WorkerType | CommonListType<WorkerType> | undefined>
    ? GetWorkerOptionParam
    : Required<T> extends Required<AccountType | CommonListType<AccountType> | undefined>
    ? GetAccountOptionParam
    : Required<T> extends Required<CompanyType | CommonListType<CompanyType> | undefined>
    ? GetCompanyOptionParam
    : Required<T> extends Required<ContractType | CommonListType<ContractType> | undefined>
    ? GetContractOptionParam
    : Required<T> extends Required<ConstructionType | CommonListType<ConstructionType> | undefined>
    ? GetConstructionOptionParam
    : Required<T> extends Required<NotificationType | CommonListType<NotificationType> | undefined>
    ? GetNotificationOptionParam
    : Required<T> extends Required<PartnershipType | CommonListType<PartnershipType> | undefined>
    ? GetPartnershipOptionParam
    : Required<T> extends Required<SiteType | CommonListType<SiteType> | undefined>
    ? GetSiteOptionParam
    : Required<T> extends Required<ProjectType | CommonListType<ProjectType> | undefined>
    ? GetProjectOptionParam
    : Required<T> extends Required<RequestType | CommonListType<RequestType> | undefined>
    ? GetRequestOptionParam
    : Required<T> extends Required<AttendanceType | CommonListType<AttendanceType> | AttendanceType[] | undefined>
    ? GetAttendanceOptionParam
    : Required<T> extends Required<ArrangementType | CommonListType<ArrangementType> | undefined>
    ? GetArrangementOptionParam
    : Required<T> extends Required<DateDataType | CommonListType<DateDataType> | undefined>
    ? GetDateDataOptionParam
    : Required<T> extends Required<ReservationType | CommonListType<ReservationType> | undefined>
    ? GetReservationOptionParam
    : Required<T> extends Required<InvRequestType | CommonListType<InvRequestType> | undefined>
    ? GetInvRequestOptionParam
    : Required<T> extends Required<InvReservationType | CommonListType<InvReservationType> | undefined>
    ? GetInvReservationOptionParam
    : Required<T> extends Required<MessageType | CommonListType<MessageType> | undefined>
    ? GetMessageOptionParam
    : Required<T> extends Required<ReactionType | CommonListType<ReactionType> | undefined>
    ? GetReactionOptionParam
    : Required<T> extends Required<ReadType | CommonListType<ReadType> | undefined>
    ? GetReadOptionParam
    : Required<T> extends Required<RoomType | CommonListType<RoomType> | undefined>
    ? GetRoomOptionParam
    : Required<T> extends Required<RoomUserType | CommonListType<RoomUserType> | undefined>
    ? GetRoomUserOptionParam
    : Required<T> extends Required<ThreadHeadType | CommonListType<ThreadHeadType> | undefined>
    ? GetThreadHeadOptionParam
    : Required<T> extends Required<ThreadLogType | CommonListType<ThreadLogType> | undefined>
    ? ThreadLogOptionParam
    : Required<T> extends Required<DepartmentType | CommonListType<DepartmentType> | undefined>
    ? GetDepartmentOptionParam
    : Required<T> extends Required<ContractLogType | CommonListType<ContractLogType> | undefined>
    ? GetContractLogOptionParam
    : undefined
