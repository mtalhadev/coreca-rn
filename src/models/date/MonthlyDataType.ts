import { CustomDate, toCustomDateFromTotalSeconds } from '../_others/CustomDate';
import { toCompanyWorkerListCLType, CompanyWorkerListCLType, CompanyWorkerListType } from '../worker/CompanyWorkerListType';
import { CommonModel, Create, ReplaceAnd, Update } from '../_others/Common';
import { GetOptionObjectType, GetOptionParam, OptionType } from '../_others/Option';
import { CompanySiteListCLType, CompanySiteListType, GetCompanySiteListType, toCompanySiteListCLType } from '../site/CompanySiteListType';
import { TotalSeconds, YYYYMMDDTotalSecondsParam, YYYYMMTotalSecondsParam } from '../_others/TotalSeconds';
import { ID } from '../_others/ID';
import { DateDataType } from './DateDataType';

/**
 * @param sites - SSG（サーバーサイド生成）にて使用。
 */
export type MonthlyDataModel = Partial<{
    monthlyDataId: ID
    month: YYYYMMTotalSecondsParam;
    companyId: ID;
    dateDataList: DateDataType[]
}> &
    CommonModel

export const initMonthlyData = (monthlyData: Create<MonthlyDataModel> | Update<MonthlyDataModel>): Update<MonthlyDataModel> => {
    const newMonthlyData: Update<MonthlyDataModel> = {
        monthlyDataId: monthlyData.monthlyDataId,
        month: monthlyData.month,
        companyId: monthlyData.companyId,
        dateDataList: monthlyData.dateDataList
    };
    return newMonthlyData;
};

/**
 * 
 */
export type MonthlyDataType = MonthlyDataModel & MonthlyDataOptionParam & {
    // 
};

/**
 * {@link WorkerOptionInputParam - 説明}
 */
export type MonthlyDataOptionInputParam = ReplaceAnd<
    GetOptionObjectType<MonthlyDataOptionParam>,
    {
        // 
    }
>;

/**
 * {@link WorkerOptionParam - 説明}
 */
export type MonthlyDataOptionParam = {
    // 
};

export type GetMonthlyDataOptionParam = GetOptionParam<MonthlyDataType, MonthlyDataOptionParam, MonthlyDataOptionInputParam>;

// export type MonthlyDataCLType = ReplaceAnd<
//     MonthlyDataType,
//     {
//         date?: CustomDate;
//         sites?: CompanySiteListCLType;
//         arrangeableWorkers?: CompanyWorkerListCLType;
//     }
// >;

// export const toMonthlyDataCLType = (data?: MonthlyDataType): MonthlyDataCLType => {
//     return {
//         ...data,
//         date: data?.date ? toCustomDateFromTotalSeconds(data?.date) : undefined,
//         sites: data?.sites ? toCompanySiteListCLType(data.sites) : undefined,
//         arrangeableWorkers: data?.arrangeableWorkers ? toCompanyWorkerListCLType(data.arrangeableWorkers) : undefined,
//     } as MonthlyDataCLType;
// };
