import { WorkerTagType } from './WorkerTagType'
import { WeekOfDay } from '../../utils/ext/Date.extensions'
import { CustomDate, toCustomDateFromTotalSeconds } from '../_others/CustomDate'
import { AccountCLType, AccountType, toAccountCLType } from '../account/Account'
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common'
import { CompanyCLType, CompanyType, toCompanyCLType } from '../company/Company'
import { CompanyRoleEnumModel, CompanyRoleEnumType } from './CompanyRoleEnumType'
import { ArrangementListCLType, ArrangementListType, toArrangementListCLType } from '../arrangement/ArrangementListType'
import { GetOptionObjectType, GetOptionParam, OptionType } from '../_others/Option'
import { SiteType } from '../site/Site'
import { TotalSeconds, YYYYMMDDTotalSecondsParam } from '../_others/TotalSeconds'
import { ID } from '../_others/ID'
import { DepartmentListType } from '../department/DepartmentListType'

/**
 *
 */
export type WorkerModel = Partial<{
    workerId: ID
    name: string
    nickname: string
    companyId: ID
    companyRole: CompanyRoleEnumModel
    phoneNumber: string
    notificationSettingId: ID
    offDaysOfWeek: WeekOfDay[]
    otherOffDays: TotalSeconds[]
    imageUrl: string
    sImageUrl: string
    xsImageUrl: string
    imageColorHue: number
    leftDate: TotalSeconds
    isOfficeWorker: boolean
    departmentIds: ID[]
}> &
    CommonModel

export const initWorker = (worker: Create<WorkerModel> | Update<WorkerModel>): Update<WorkerModel> => {
    const newWorker: Update<WorkerModel> = {
        workerId: worker.workerId,
        name: worker.name,
        nickname: worker.nickname,
        companyId: worker.companyId,
        companyRole: worker.companyRole,
        phoneNumber: worker.phoneNumber,
        notificationSettingId: worker.notificationSettingId,
        offDaysOfWeek: worker.offDaysOfWeek,
        otherOffDays: worker.otherOffDays,
        imageUrl: worker.imageUrl,
        sImageUrl: worker.sImageUrl,
        xsImageUrl: worker.xsImageUrl,
        imageColorHue: worker.imageColorHue,
        leftDate: worker.leftDate,
        isOfficeWorker: worker.isOfficeWorker,
        departmentIds: worker.departmentIds,
    }

    return newWorker
}

/**
 * _getでOption取得する際の引数の定義
 */
export type WorkerOptionInputParam = ReplaceAnd<
    GetOptionObjectType<WorkerOptionParam>,
    {
        arrangements?: OptionType<{
            timeZoneOffset?: number
            arrangementDate?: CustomDate
        }>
        workerTags?: OptionType<{
            siteId?: ID
            myWorkerId?: ID
            myCompanyId?: ID
            site?: SiteType
            timeZoneOffset?: number
            _date?: TotalSeconds
        }>
    }
>

/**
 * _getでOption取得する際のパラメータと返り値の定義
 */
export type WorkerOptionParam = {
    account?: AccountType
    arrangements?: ArrangementListType
    company?: CompanyType
    workerTags?: WorkerTagType[]
}

export type WorkerType = WorkerModel &
    WorkerOptionParam & {
        companyRole?: CompanyRoleEnumType
        departments?: DepartmentListType
    }

export type GetWorkerOptionParam = GetOptionParam<WorkerType, WorkerOptionParam, WorkerOptionInputParam>

export type WorkerCLType = ReplaceAnd<
    WorkerType,
    {
        account?: AccountCLType
        arrangements?: ArrangementListCLType
        company?: CompanyCLType
        offDaysOfWeek?: WeekOfDay[]
        otherOffDays?: CustomDate[]
        leftDate?: CustomDate
    } & CommonCLType
>

export const toWorkerCLType = (data?: WorkerType): WorkerCLType => {
    if (data == undefined) {
        return {}
    }
    return {
        ...data,
        ...toCommonCLType(data),
        account: data?.account ? toAccountCLType(data?.account) : undefined,
        arrangements: data?.arrangements ? toArrangementListCLType(data?.arrangements) : undefined,
        company: data?.company ? toCompanyCLType(data?.company) : undefined,
        offDaysOfWeek: data?.offDaysOfWeek ? (data?.offDaysOfWeek as WeekOfDay[]) : undefined,
        otherOffDays: data?.otherOffDays ? data?.otherOffDays?.map((val: TotalSeconds) => toCustomDateFromTotalSeconds(val, true)) : undefined,
        leftDate: data?.leftDate ? toCustomDateFromTotalSeconds(data?.leftDate, true) : undefined,
    } as WorkerCLType
}
