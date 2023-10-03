import cloneDeep from 'lodash/cloneDeep'
import range from 'lodash/range'
import { WeekOfDay } from '../../utils/ext/Date.extensions'
import { CompanyCLType, CompanyType, toCompanyCLType } from '../company/Company'
import { ConstructionCLType, ConstructionType, toConstructionCLType } from '../construction/Construction'
import { InvRequestListType, InvRequestListCLType, toInvRequestListCLType } from '../invRequest/InvRequestListType'
import { ProjectCLType, ProjectType, toProjectCLType } from '../project/Project'
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common'
import { compareWithAnotherDate, CustomDate, getDailyEndTime, getDailyStartTime, nextDay, toCustomDateFromTotalSeconds } from '../_others/CustomDate'
import { ID } from '../_others/ID'
import { GetOptionObjectType, GetOptionParam, OptionType } from '../_others/Option'
import { TotalSeconds } from '../_others/TotalSeconds'

/**
 * @param
 * extraDates 申請期間外の特定の常用で送る日（任意）
 */
export type InvReservationModel = Partial<{
    invReservationId: ID
    startDate: TotalSeconds
    endDate: TotalSeconds
    targetCompanyId: ID
    myCompanyId: ID
    invRequestIds: ID[]
    extraDates?: TotalSeconds[]
    initialWorkerCount?: number
    offDaysOfWeek?: WeekOfDay[]
    otherOffDays?: number[]
    projectOwnerCompanyId?: ID
}> &
    CommonModel

export const initInvReservation = (invReservation: Create<InvReservationModel> | Update<InvReservationModel>): Update<InvReservationModel> => {
    const newReservation: Update<InvReservationModel> = {
        invReservationId: invReservation.invReservationId,
        startDate: invReservation.startDate,
        endDate: invReservation.endDate,
        targetCompanyId: invReservation.targetCompanyId,
        myCompanyId: invReservation.myCompanyId,
        invRequestIds: invReservation.invRequestIds,
        extraDates: invReservation.extraDates,
        initialWorkerCount: invReservation.initialWorkerCount,
        offDaysOfWeek: invReservation.offDaysOfWeek,
        otherOffDays: invReservation.otherOffDays,
        projectOwnerCompanyId: invReservation.projectOwnerCompanyId,
    }
    return newReservation
}

export type InvReservationOptionInputParam = ReplaceAnd<
    GetOptionObjectType<InvReservationOptionParam>,
    {
        monthlyInvRequests: OptionType<{
            month: TotalSeconds
            endOfMonth: TotalSeconds
        }>;
    }
>
/**
 * construction - 仮会社へ常用を送った場合にひもづく仮会社施工工事
 */
export type InvReservationOptionParam = {
    targetCompany?: CompanyType
    myCompany?: CompanyType
    monthlyInvRequests?: InvRequestListType
    construction?: ConstructionType
    project?: ProjectType
    projectOwnerCompany?: CompanyType
}

export type InvReservationType = InvReservationModel & InvReservationOptionParam 
export type GetInvReservationOptionParam = GetOptionParam<InvReservationType, InvReservationOptionParam, InvReservationOptionInputParam>

export type InvReservationCLType = ReplaceAnd<
    InvReservationType,
    {
        startDate?: CustomDate
        endDate?: CustomDate
        extraDates?: CustomDate[]
        targetCompany?: CompanyCLType
        myCompany?: CompanyCLType
        totalDates?: CustomDate[]
        monthlyInvRequests?: InvRequestListCLType
        project?: ProjectCLType
        otherOffDays?: CustomDate[]
        construction?: ConstructionCLType
        projectOwnerCompany?: CompanyCLType
    } & CommonCLType
>

export const toInvReservationCLType = (data?: InvReservationType): InvReservationCLType => {
    if (data == undefined) {
        return {}
    }
    const extraDates = data.extraDates?.map(date => toCustomDateFromTotalSeconds(date))
    const _totalDates: CustomDate[] = []
    if (data.startDate && data.endDate) {
        let date = toCustomDateFromTotalSeconds(cloneDeep(data.startDate))
        for (const dateIndex in range(0, compareWithAnotherDate(getDailyStartTime(toCustomDateFromTotalSeconds(data.startDate)), nextDay(getDailyEndTime(toCustomDateFromTotalSeconds(data.endDate)), 1)).days)) {
            _totalDates.push(date)
            date = nextDay(date, 1)
        }
    }
    const totalDates = [..._totalDates??[], ...extraDates??[]].filter(date => data != undefined)
    return {
        ...data,
        ...toCommonCLType(data),
        startDate: data.startDate ? toCustomDateFromTotalSeconds(data.startDate) : undefined,
        endDate: data.endDate ? toCustomDateFromTotalSeconds(data.endDate) : undefined,
        extraDates: extraDates,
        targetCompany: data?.targetCompany ? toCompanyCLType(data.targetCompany) : undefined,
        myCompany: data?.myCompany ? toCompanyCLType(data.myCompany) : undefined,
        totalDates: totalDates,
        otherOffDays: data?.otherOffDays ? data.otherOffDays.map(date => toCustomDateFromTotalSeconds(date)) : undefined,
        monthlyInvRequests: data?.monthlyInvRequests ? toInvRequestListCLType(data.monthlyInvRequests) : undefined,
        project: data.project ? toProjectCLType(data.project) : undefined,
        construction: data.construction ? toConstructionCLType(data.construction) : undefined,
        projectOwnerCompany: data.projectOwnerCompany ? toCompanyCLType(data.projectOwnerCompany) : undefined,
    } as InvReservationCLType
}
