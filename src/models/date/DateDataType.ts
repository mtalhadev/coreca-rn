import { CustomDate, toCustomDateFromTotalSeconds } from '../_others/CustomDate'
import { toCompanyWorkerListCLType, CompanyWorkerListCLType, CompanyWorkerListType } from '../worker/CompanyWorkerListType'
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common'
import { GetOptionObjectType, GetOptionParam, OptionType } from '../_others/Option'
import { CompanySiteListCLType, CompanySiteListType, GetCompanySiteListType, toCompanySiteListCLType } from '../site/CompanySiteListType'
import { TotalSeconds, YYYYMMDDTotalSecondsParam } from '../_others/TotalSeconds'
import { ID } from '../_others/ID'
import { CompanyInvRequestListCLType, CompanyInvRequestListType, toCompanyInvRequestListCLType } from '../invRequest/CompanyInvRequestListType'

/**
 * @param sites - SSG（サーバーサイド生成）にて使用。
 * @param arrangementSummary - 手配周りの日付管理の集計データ。
 * @param attendanceSummary - 勤怠周りの日付管理の集計データ。
 */
export type DateDataModel = Partial<{
    dateDataId: ID
    date: TotalSeconds
    companyId: ID
    sites?: CompanySiteListType
    invRequests?: CompanyInvRequestListType
    arrangementSummary?: {
        arrangedWorkersCount?: number
        sitesCount?: number
    }
    attendanceSummary?: {
        sitesCount?: number
        arrangedWorkersCount?: number
        waitingWorkersCount?: number
        unReportedWorkersCount?: number
        attendanceModificationRequestCount?: number
    }
}> &
    CommonModel

export const initDateData = (dateData: Create<DateDataModel> | Update<DateDataModel>): Update<DateDataModel> => {
    const newDateData: Update<DateDataModel> = {
        dateDataId: dateData.dateDataId,
        date: dateData.date,
        companyId: dateData.companyId,
        sites: dateData.sites,
        invRequests: dateData.invRequests,
        arrangementSummary: dateData.arrangementSummary,
        attendanceSummary: dateData.attendanceSummary,
    }
    return newDateData
}

/**
 * 日付に紐づく情報を保存する。

 */
export type DateDataType = DateDataModel & DateDataOptionParam

/**
 * {@link WorkerOptionInputParam - 説明}
 */
export type DateDataOptionInputParam = ReplaceAnd<
    GetOptionObjectType<DateDataOptionParam>,
    {
        sites?: OptionType<{
            types?: GetCompanySiteListType
        }>
    }
>

/**
 * {@link WorkerOptionParam - 説明}
 */
export type DateDataOptionParam = {
    sites?: CompanySiteListType
    invRequests?: CompanyInvRequestListType
    arrangeableWorkers?: CompanyWorkerListType
}

export type GetDateDataOptionParam = GetOptionParam<DateDataType, DateDataOptionParam, DateDataOptionInputParam>

export type DateDataCLType = ReplaceAnd<
    DateDataType,
    {
        date?: CustomDate
        sites?: CompanySiteListCLType
        invRequests?: CompanyInvRequestListCLType
        arrangeableWorkers?: CompanyWorkerListCLType
    } & CommonCLType
>

export const toDateDataCLType = (data?: DateDataType): DateDataCLType => {
    return {
        ...data,
        ...toCommonCLType(data),
        date: data?.date ? toCustomDateFromTotalSeconds(data?.date) : undefined,
        sites: data?.sites ? toCompanySiteListCLType(data.sites) : undefined,
        invRequests: data?.invRequests ? toCompanyInvRequestListCLType(data.invRequests) : undefined,
        arrangeableWorkers: data?.arrangeableWorkers ? toCompanyWorkerListCLType(data.arrangeableWorkers) : undefined,
    } as DateDataCLType
}
