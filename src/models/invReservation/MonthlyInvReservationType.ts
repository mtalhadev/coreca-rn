import { CommonModel, Create, ReplaceAnd, Update } from '../_others/Common'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'
import { YYYYMMTotalSecondsParam } from '../_others/TotalSeconds'
import { ID } from '../_others/ID'
import { CompanyInvReservationListType } from './CompanyInvReservationListType'

/**
 * 常用で送る予定の月毎のデータを保存。SSG用
 */
export type MonthlyInvReservationModel = Partial<{
    monthlyInvReservationId: ID
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    companyId: ID
}> &
    CompanyInvReservationListType &
    CommonModel

export const initMonthlyInvReservation = (monthlyInvReservation: Create<MonthlyInvReservationModel> | Update<MonthlyInvReservationModel>): Update<MonthlyInvReservationModel> => {
    const newMonthlyInvReservation: Update<MonthlyInvReservationModel> = {
        monthlyInvReservationId: monthlyInvReservation.monthlyInvReservationId,
        companyId: monthlyInvReservation.companyId,
        month: monthlyInvReservation.month,
        endOfMonth: monthlyInvReservation.endOfMonth,
    }
    return newMonthlyInvReservation
}

/**
 * {@link MonthlyInvReservationOptionParam - 説明}
 */
export type MonthlyInvReservationOptionInputParam = ReplaceAnd<
    GetOptionObjectType<MonthlyInvReservationOptionParam>,
    {
        //
    }
>

export type GetMonthlyInvReservationOptionParam = GetOptionParam<MonthlyInvReservationType, MonthlyInvReservationOptionParam, MonthlyInvReservationOptionInputParam>

/**
 *
 */
export type MonthlyInvReservationOptionParam = {
    //
}

export type MonthlyInvReservationType = MonthlyInvReservationModel & MonthlyInvReservationOptionParam
