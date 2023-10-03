import { CommonModel, Create, ReplaceAnd, Update } from '../_others/Common';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';
import { YYYYMMTotalSecondsParam } from '../_others/TotalSeconds';
import { ID } from '../_others/ID';
import { initProject, ProjectModel, ProjectType } from './Project';

/**
 * 月毎の案件データを保存。SSG用
 */
export type MonthlyProjectModel = Partial<{
    monthlyProjectId: ID;
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    companyId: ID
    projects: ProjectType[]
}> & CommonModel;

export const initMonthlyProject = (monthlyProject: Create<MonthlyProjectModel> | Update<MonthlyProjectModel>): Update<MonthlyProjectModel> => {
    const newMonthlyProject: Update<MonthlyProjectModel> = {
        monthlyProjectId: monthlyProject.monthlyProjectId,
        companyId: monthlyProject.companyId,
        month: monthlyProject.month,
        endOfMonth: monthlyProject.endOfMonth,
        projects: monthlyProject.projects
    };
    return newMonthlyProject;
};

/**
 * {@link WorkerOptionInputParam - 説明}
 */
export type MonthlyProjectOptionInputParam = ReplaceAnd<
    GetOptionObjectType<MonthlyProjectOptionParam>,
    {
        // 
    }
>;

export type GetMonthlyProjectOptionParam = GetOptionParam<MonthlyProjectType, MonthlyProjectOptionParam, MonthlyProjectOptionInputParam>;

/**
 * 
 */
export type MonthlyProjectOptionParam = {
    // 
};

export type MonthlyProjectType = MonthlyProjectModel & MonthlyProjectOptionParam;

// export type MonthlyProjectCLType = ReplaceAnd<
//     MonthlyProjectType,
//     {
//         updateWorker?: WorkerCLType;
//         monthlyProjectConstructions?: MonthlyProjectConstructionListCLType;
//         contracts?: ContractListCLType;
//         monthlyProjectContracts?: MonthlyProjectContractListCLType;
//         companyContracts?: CompanyContractListCLType;
//         monthlyProjectCompanies?: MonthlyProjectCompanyListCLType;
//         createCompany?: CompanyCLType;
//         startDate?: CustomDate;
//         endDate?: CustomDate;
//     } & CommonCLType
// >;

// export const toMonthlyProjectCLType = (data?: MonthlyProjectType): MonthlyProjectCLType => {
//     return {
//         ...data,
//         ...toCommonCLType(data),
//         updateWorker: data?.updateWorker ? toWorkerCLType(data?.updateWorker) : undefined,
//         monthlyProjectConstructions: data?.monthlyProjectConstructions ? toMonthlyProjectConstructionListCLType(data?.monthlyProjectConstructions) : undefined,
//         contracts: data?.contracts ? toContractListCLType(data?.contracts) : undefined,
//         monthlyProjectContracts: data?.monthlyProjectContracts ? toContractListCLType(data.monthlyProjectContracts) : undefined,
//         companyContracts: data?.companyContracts ? toCompanyContractListCLType(data.companyContracts) : undefined,
//         monthlyProjectCompanies: data?.monthlyProjectCompanies ? toMonthlyProjectCompanyListCLType(data?.monthlyProjectCompanies) : undefined,
//         createCompany: data?.createCompany ? toCompanyCLType(data?.createCompany) : undefined,
//         startDate: data?.startDate ? toCustomDateFromTotalSeconds(data?.startDate, true) : undefined,
//         endDate: data?.endDate ? toCustomDateFromTotalSeconds(data?.endDate, true) : undefined,
//     } as MonthlyProjectCLType;
// };
