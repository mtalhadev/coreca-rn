import { SiteArrangementDataCLType, SiteArrangementDataType, toSiteArrangementDataCLType } from '../arrangement/SiteArrangementDataType'
import { AttendanceCLType, AttendanceType, toAttendanceCLType } from '../attendance/Attendance'
import { CompanyCLType, CompanyType, toCompanyCLType } from '../company/Company'
import { InvReservationCLType, InvReservationType, toInvReservationCLType } from '../invReservation/InvReservation'
import { SiteCLType, SiteType, toSiteCLType } from '../site/Site'
import { WorkerListCLType, toWorkerListCLType, WorkerListType } from '../worker/WorkerListType'
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common'
import { CustomDate, toCustomDateFromTotalSeconds } from '../_others/CustomDate'
import { ID } from '../_others/ID'
import { GetOptionObjectType, GetOptionParam, OptionType } from '../_others/Option'
import { TotalSeconds } from '../_others/TotalSeconds'
import { InvRequestWorkerModel } from './InvRequestWorker'

/**
 * @param targetCompanyId 作業員を送られる会社
 * @param myCompanyId 作業員を送る会社
 * @param isApplication 申請を出しているかどうか。falseは未申請。trueは申請済み
 * @param isApproval 承認の可否。falseは拒否。waitingは承認まち
 * @param relatedInvRequestIds 又貸しで常用申請作業員を常用申請手配したときに、元の常用申請IDが常用申請手配先のInvRequestに保存される。配列として保持しておくことで検索が楽になる。
 */
export type InvRequestModel = Partial<{
    invRequestId: ID
    invReservationId: ID
    targetCompanyId: ID
    myCompanyId: ID
    isApproval: boolean | 'waiting'
    isApplication: boolean //申請準備
    workerIds: ID[]
    date: TotalSeconds
    workerCount: number
    updateWorkerId: ID
    attendanceIds: ID[]
    relatedInvRequestIds: ID[]
}> &
    CommonModel

export const initInvRequest = (application: Create<InvRequestModel> | Update<InvRequestModel>): Update<InvRequestModel> => {
    const newReservation: Update<InvRequestModel> = {
        invRequestId: application.invRequestId,
        invReservationId: application.invReservationId,
        targetCompanyId: application.targetCompanyId,
        myCompanyId: application.myCompanyId,
        isApproval: application.isApproval,
        isApplication: application.isApplication,
        workerIds: application.workerIds,
        date: application.date,
        workerCount: application.workerCount,
        updateWorkerId: application.updateWorkerId,
        attendanceIds: application.attendanceIds,
        relatedInvRequestIds: application.relatedInvRequestIds,
    }
    return newReservation
}

export type InvRequestOptionInputParam = ReplaceAnd<
    GetOptionObjectType<InvRequestOptionParam>,
    {
        invRequestArrangementData?: OptionType<{
            myWorkerId: ID
        }>
    }
>
/**
 * site - 仮会社へ常用を送った場合にひもづく仮会社施工現場
 */
export type InvRequestOptionParam = {
    targetCompany?: CompanyType
    myCompany?: CompanyType
    workers?: WorkerListType
    attendances?: AttendanceType[]
    invRequestWorkers?: InvRequestWorkerModel[]
    site?: SiteType
    invReservation?: InvReservationType
    invRequestArrangementData?: SiteArrangementDataType
}

export type InvRequestType = InvRequestModel & {
    invRequestStatus?: InvRequestStatusType
} & InvRequestOptionParam
export type GetInvRequestOptionParam = GetOptionParam<InvRequestType, InvRequestOptionParam, InvRequestOptionInputParam>

export type InvRequestCLType = ReplaceAnd<
    InvRequestType,
    {
        targetCompany?: CompanyCLType
        myCompany?: CompanyCLType
        workers?: WorkerListCLType
        date?: CustomDate
        attendances?: AttendanceCLType[]
        site?: SiteCLType
        invReservation?: InvReservationCLType
        invRequestArrangementData?: SiteArrangementDataCLType
    } & CommonCLType
>

export const toInvRequestCLType = (data?: InvRequestType): InvRequestCLType => {
    if (data == undefined) {
        return {}
    }
    return {
        ...data,
        ...toCommonCLType(data),
        targetCompany: data?.targetCompany ? toCompanyCLType(data.targetCompany) : undefined,
        myCompany: data?.myCompany ? toCompanyCLType(data.myCompany) : undefined,
        workers: data?.workers ? toWorkerListCLType(data.workers) : undefined,
        date: data?.date ? toCustomDateFromTotalSeconds(data.date) : undefined,
        attendances: data?.attendances ? data.attendances.map((att) => toAttendanceCLType(att)) : undefined,
        site: data ? toSiteCLType(data.site) : undefined,
        invReservation: data ? toInvReservationCLType(data.invReservation) : undefined,
        invRequestArrangementData: data ? toSiteArrangementDataCLType(data.invRequestArrangementData) : undefined,
    } as InvRequestCLType
}

/**
 * 申請の状態
 * - unapplied 未申請
 * - waiting 承認待ち
 * - unauthorized 非承認
 * - approval 承認
 */
export type InvRequestStatusType = 'unapplied' | 'waiting' | 'unauthorized' | 'approval'

export const toInvRequestStatusType = (invRequest: InvRequestModel): InvRequestStatusType => {
    if (invRequest.isApplication == false) {
        return 'unapplied'
    }
    if (invRequest.isApproval == true) {
        return 'approval'
    } else if (invRequest.isApproval == false) {
        return 'unauthorized'
    } else if (invRequest.isApproval == 'waiting') {
        return 'waiting'
    }
    return 'unapplied'
}

/**
 * 常用で送る先が仮会社の場合、工事案件ともに1つに固定される
 */
export type FakeCompanyInvRequestType = InvRequestType & {
    constructionId?: ID
    siteId?: ID
}
