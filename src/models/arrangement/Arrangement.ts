import { AttendanceCLType, AttendanceType, toAttendanceCLType } from '../attendance/Attendance'
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common'
import { CompanyCLType, CompanyType, toCompanyCLType } from '../company/Company'
import { RequestCLType, RequestType, toRequestCLType } from '../request/Request'
import { SiteCLType, SiteType, toSiteCLType } from '../site/Site'
import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'
import { CustomDate, toCustomDateFromTotalSeconds } from '../_others/CustomDate'
import { ID } from '../_others/ID'
import { TotalSeconds } from '../_others/TotalSeconds'
import { AttendanceModificationCLType, AttendanceModificationModel, toAttendanceModificationCLType } from '../attendanceModification/AttendanceModification'

/**
 * @param attendanceId - ネストされた手配における勤怠の統一に必要。ネストした手配をまとめるのは作業員ではなく勤怠。
 * @param respondRequestId - 応答する常用依頼。現場直下の場合はtopが入る。topを入れる理由はクエリーを投げられるようにするため。
 * @param date - 日付。現場に合わせる。最適化用。
 */
export type ArrangementModel = Partial<{
    arrangementId: ID
    siteId: ID
    workerId: ID
    workerBelongingCompanyId: ID
    createCompanyId: ID
    respondRequestId: ID | 'top'
    updateWorkerId: ID
    attendanceId: ID
    isConfirmed: boolean
    date: TotalSeconds
}> &
    CommonModel

export const initArrangement = (arrangement: Create<ArrangementModel> | Update<ArrangementModel>): Update<ArrangementModel> => {
    const newArrangement: Update<ArrangementModel> = {
        arrangementId: arrangement.arrangementId,
        siteId: arrangement.siteId,
        workerId: arrangement.workerId,
        workerBelongingCompanyId: arrangement.workerBelongingCompanyId,
        createCompanyId: arrangement.createCompanyId,
        respondRequestId: arrangement.respondRequestId,
        updateWorkerId: arrangement.updateWorkerId,
        attendanceId: arrangement.attendanceId,
        isConfirmed: arrangement.isConfirmed,
        date: arrangement.date,
    }

    return newArrangement
}

/**
 * {@link WorkerOptionInputParam - 説明}
 */
export type ArrangementOptionInputParam = ReplaceAnd<
    GetOptionObjectType<ArrangementOptionParam>,
    {
        //
    }
>

/**
 * {@link WorkerOptionParam - 説明}
 */
export type ArrangementOptionParam = {
    worker?: WorkerType
    workerBelongingCompany?: CompanyType
    createCompany?: CompanyType
    attendance?: AttendanceType
    attendanceModification?: AttendanceModificationModel
    site?: SiteType
    respondRequest?: RequestType
    updateWorker?: WorkerType
}
/**
 * respondArrangement - 常用依頼手配に対する応答手配
 */
export type ArrangementType = ArrangementModel & ArrangementOptionParam

export type GetArrangementOptionParam = GetOptionParam<ArrangementType, ArrangementOptionParam, ArrangementOptionInputParam>

export type ArrangementCLType = ReplaceAnd<
    ArrangementType,
    {
        worker?: WorkerCLType
        createCompany?: CompanyCLType
        workerBelongingCompany?: CompanyCLType
        attendance?: AttendanceCLType
        attendanceModification?: AttendanceModificationCLType
        site?: SiteCLType
        respondRequest?: RequestCLType
        updateWorker?: WorkerCLType
        date?: CustomDate
    } & CommonCLType
>

export const toArrangementCLType = (data?: ArrangementType): ArrangementCLType => {
    return {
        ...data,
        ...toCommonCLType(data),
        worker: data?.worker ? toWorkerCLType(data?.worker) : undefined,
        createCompany: data?.createCompany ? toCompanyCLType(data?.createCompany) : undefined,
        workerBelongingCompany: data?.workerBelongingCompany ? toCompanyCLType(data?.workerBelongingCompany) : undefined,
        attendance: data?.attendance ? toAttendanceCLType(data?.attendance) : undefined,
        attendanceModification: data?.attendanceModification ? toAttendanceModificationCLType(data?.attendanceModification) : undefined,
        site: data?.site ? toSiteCLType(data?.site) : undefined,
        respondRequest: data?.respondRequest ? toRequestCLType(data?.respondRequest) : undefined,
        updateWorker: data?.updateWorker ? toWorkerCLType(data?.updateWorker) : undefined,
        date: data?.date ? toCustomDateFromTotalSeconds(data.date, true) : undefined,
    } as ArrangementCLType
}
