import { CustomDate, toCustomDateFromTotalSeconds } from '../_others/CustomDate'
import { AttendanceCLType, AttendanceType, toAttendanceCLType } from './Attendance'
import { CompanyCLType, CompanyType, toCompanyCLType } from '../company/Company'
import { RequestCLType, RequestType, toRequestCLType } from '../request/Request'
import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker'
import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ArrangementCLType, ArrangementType, toArrangementCLType } from '../arrangement/Arrangement'
import { SiteRelationType } from '../site/SiteRelationType'
import { AttendanceListCLType, AttendanceListType, toAttendanceListCLType } from './AttendanceListType'
import { ArrangementListCLType, ArrangementListType, toArrangementListCLType } from '../arrangement/ArrangementListType'
import { RequestListCLType, RequestListType, toRequestListCLType } from '../request/RequestListType'
import { TotalSeconds } from '../_others/TotalSeconds'
import { ID } from '../_others/ID'

/**
 * @param unReportedCount - 未報告の作業員。未確定作業員も含む。
 * @param waitingCount - 応答待ち。作業員未確定はカウントしない。
 * @param actualWorkerCount - 稼働数。応答待ちを除く。
 */
export type SiteAttendanceDataType = CommonListType<ArrangementType> & {
    date?: TotalSeconds
    targetAttendances?: AttendanceListType
    // 会社ごとに手配された作業員一覧
    siteCompanies?: SiteAttendanceCompanyType[]
    siteRelation?: SiteRelationType
    siteManageCompanyId?: ID

    subArrangements?: ArrangementListType
    subRequests?: RequestListType
    subRespondCount?: number
    unReportedCount?: number
    waitingCount?: number
    actualWorkerCount?: number
}

export type SiteAttendanceDataCLType = ReplaceAnd<
    SiteAttendanceDataType,
    {
        date?: CustomDate
        targetAttendances?: AttendanceListCLType
        siteCompanies?: SiteAttendanceCompanyCLType[]

        subArrangements?: ArrangementListCLType
        subRequests?: RequestListCLType
    }
>

export const toSiteAttendanceDataCLType = (data?: SiteAttendanceDataType): SiteAttendanceDataCLType => {
    return {
        ...data,
        date: data?.date ? toCustomDateFromTotalSeconds(data?.date, true) : undefined,
        targetAttendances: data?.targetAttendances ? toAttendanceListCLType(data?.targetAttendances) : undefined,
        siteCompanies: data?.siteCompanies ? data?.siteCompanies.map((val) => toSiteAttendanceCompanyCLType(val)) : undefined,
        subArrangements: data?.subArrangements ? toArrangementListCLType(data?.subArrangements) : undefined,
        subRequests: data?.subRequests ? toRequestListCLType(data?.subRequests) : undefined,
    }
}

// ============================================================================

/**
 * @param arrangedWorkers - 自社作業員手配と常用依頼を押し並べて扱う。
 */
export type SiteAttendanceCompanyType = {
    company?: CompanyType
    arrangedWorkers?: SiteAttendanceWorkerType[]
    request?: RequestType
}

export type SiteAttendanceCompanyCLType = ReplaceAnd<
    SiteAttendanceCompanyType,
    {
        company?: CompanyCLType
        arrangedWorkers?: SiteAttendanceWorkerCLType[]
        request?: RequestCLType
    }
>

export const toSiteAttendanceCompanyCLType = (data?: SiteAttendanceCompanyType): SiteAttendanceCompanyCLType => {
    return {
        ...data,
        company: data?.company ? toCompanyCLType(data.company) : undefined,
        arrangedWorkers: data?.arrangedWorkers ? data.arrangedWorkers.map((val) => toSiteAttendanceWorkerCLType(val)) : undefined,
        request: data?.request ? toRequestCLType(data.request) : undefined,
    }
}

// ============================================================================
/**
 * @remarks
 * - 手配
 *     - isConfirmed == true && worker, attendance, arrangementが存在する。分岐はなし。
 * - 常用依頼
 *     - 常用完了: isConfirmed == true && worker, attendance, arrangementが存在する。
 *     - 常用未完了: attendanceIdだけ存在する。勤怠をつけることはできるが手配は存在しない。
 * @param attendanceId - 勤怠ID。常用確定前はデータが存在しないこともある。
 * @param isConfirmed - 常用完了しているかどうか。isConfirmed := attendance && arrangement。完了していたらworker、attendance、arrangementがデータとして入る。
 */
export type SiteAttendanceWorkerType = {
    attendanceId?: ID
    worker?: WorkerType
    attendance?: AttendanceType
    arrangement?: ArrangementType
    isConfirmed?: boolean
}

export type SiteAttendanceWorkerCLType = ReplaceAnd<
    SiteAttendanceWorkerType,
    {
        worker?: WorkerCLType
        attendance?: AttendanceCLType
        arrangement?: ArrangementCLType
    }
>

export const toSiteAttendanceWorkerCLType = (data?: SiteAttendanceWorkerType): SiteAttendanceWorkerCLType => {
    return {
        ...data,
        worker: data?.worker ? toWorkerCLType(data.worker) : undefined,
        attendance: data?.attendance ? toAttendanceCLType(data.attendance) : undefined,
        arrangement: data?.arrangement ? toArrangementCLType(data.arrangement) : undefined,
    }
}
