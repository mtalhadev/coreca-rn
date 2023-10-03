import { CommonModel, Create, ReplaceAnd, Update } from '../_others/Common';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';
import { YYYYMMTotalSecondsParam } from '../_others/TotalSeconds';
import { ID } from '../_others/ID';
import { InvRequestType } from './InvRequestType';
import { InvReservationType } from '../invReservation/InvReservation';

/**
 * 常用で送る予定の月毎の常用で送るデータを保存。SSG用
 */
export type MonthlyInvRequestModel = Partial<{
    monthlyInvRequestId: ID;
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    companyId: ID
    invReservationId : ID
    invReservation: InvReservationType
    invRequests: InvRequestType[]
}> & CommonModel;

export const initMonthlyInvRequest = (monthlyInvRequest: Create<MonthlyInvRequestModel> | Update<MonthlyInvRequestModel>): Update<MonthlyInvRequestModel> => {
    const newMonthlyInvRequest: Update<MonthlyInvRequestModel> = {
        monthlyInvRequestId: monthlyInvRequest.monthlyInvRequestId,
        companyId: monthlyInvRequest.companyId,
        invReservationId: monthlyInvRequest.invReservationId,
        month: monthlyInvRequest.month,
        endOfMonth: monthlyInvRequest.endOfMonth,
        invReservation: monthlyInvRequest.invReservation,
        invRequests: monthlyInvRequest.invRequests,
    };
    return newMonthlyInvRequest;
};

/**
 * {@link MonthlyInvRequestOptionParam - 説明}
 */
export type MonthlyInvRequestOptionInputParam = ReplaceAnd<
    GetOptionObjectType<MonthlyInvRequestOptionParam>,
    {
        // 
    }
>;

export type GetMonthlyInvRequestOptionParam = GetOptionParam<MonthlyInvRequestType, MonthlyInvRequestOptionParam, MonthlyInvRequestOptionInputParam>;

/**
 * 
 */
export type MonthlyInvRequestOptionParam = {
    // 
};

export type MonthlyInvRequestType = MonthlyInvRequestModel & MonthlyInvRequestOptionParam;