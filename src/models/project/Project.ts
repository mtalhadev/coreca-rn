import { ProjectCompanyListCLType, ProjectCompanyListType, toProjectCompanyListCLType } from '../company/ProjectCompanyListType';
import { CustomDate, toCustomDateFromTotalSeconds, YYYYMMDateType } from '../_others/CustomDate';
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { CompanyCLType, CompanyType, toCompanyCLType } from '../company/Company';
import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker';
import { CompanyContractListCLType, CompanyContractListType, toCompanyContractListCLType } from '../contract/CompanyContractListType';
import { GetOptionObjectType, GetOptionParam, OptionType } from '../_others/Option';
import { ContractListType, ContractListCLType, toContractListCLType } from '../contract/ContractListType';
import { ProjectContractListCLType, ProjectContractListType } from '../contract/ProjectContractListType';
import { ProjectConstructionListType, ProjectConstructionListCLType, toProjectConstructionListCLType } from '../construction/ProjectConstructionListType';
import { TotalSeconds } from '../_others/TotalSeconds';
import { ID } from '../_others/ID';

/**
 * @param isFakeCompanyManage - 仮会社常用用案件かどうか=仮会社からの常用依頼のための案件
 * @param projectRelatedCompanyIds - SSG用。関連会社が入力される。
 */
export type ProjectModel = Partial<{
    projectId: ID;
    name: string;
    startDate: TotalSeconds;
    endDate: TotalSeconds;
    createCompanyId: ID;
    updateWorkerId: ID;
    imageUrl: string;
    sImageUrl: string;
    xsImageUrl: string;
    imageColorHue: number;
    siteAddress?: string;
    isFakeCompanyManage: boolean;
    projectRelatedCompanyIds: ID[]
    /**
     * 仮会社へ常用で送った場合に、自動作成される案件と紐づくInvReservationのId
     */
    fakeCompanyInvReservationId: ID;
}> &
    CommonModel;

export const initProject = (project: Create<ProjectModel> | Update<ProjectModel>): Update<ProjectModel> => {
    const newProject: Update<ProjectModel> = {
        projectId: project.projectId,
        name: project.name,
        startDate: project.startDate,
        endDate: project.endDate,
        createCompanyId: project.createCompanyId,
        updateWorkerId: project.updateWorkerId,
        imageUrl: project.imageUrl,
        sImageUrl: project.sImageUrl,
        xsImageUrl: project.xsImageUrl,
        imageColorHue: project.imageColorHue,
        isFakeCompanyManage: project.isFakeCompanyManage,
        siteAddress: project.siteAddress,
        projectRelatedCompanyIds: project.projectRelatedCompanyIds,
        fakeCompanyInvReservationId: project.fakeCompanyInvReservationId
    };
    return newProject;
};

/**
 * {@link WorkerOptionInputParam - 説明}
 */
export type ProjectOptionInputParam = ReplaceAnd<
    GetOptionObjectType<ProjectOptionParam>,
    {
        projectConstructions?: OptionType<{
            companyId?: ID;
        }>;
        companyContracts?: OptionType<{
            companyId?: ID;
        }>;
    }
>;

export type GetProjectOptionParam = GetOptionParam<ProjectType, ProjectOptionParam, ProjectOptionInputParam>;

/**
 * {@link WorkerOptionParam - 説明}
 *  @param contracts - 案件ないの契約すべて
 *  @param projectContracts - 案件内の契約全て（関係図で整理）
 *  @param companyContracts - 会社が関わる契約（受注or発注）
 *  @param projectCompanies - 案件に関わるすべての会社
 */
export type ProjectOptionParam = {
    updateWorker?: WorkerType;
    projectConstructions?: ProjectConstructionListType;
    contracts?: ContractListType;
    projectContracts?: ProjectContractListType;
    companyContracts?: CompanyContractListType;
    projectCompanies?: ProjectCompanyListType;
    createCompany?: CompanyType;
};

export type ProjectType = ProjectModel & ProjectOptionParam;

export type ProjectCLType = ReplaceAnd<
    ProjectType,
    {
        updateWorker?: WorkerCLType;
        projectConstructions?: ProjectConstructionListCLType;
        contracts?: ContractListCLType;
        projectContracts?: ProjectContractListCLType;
        companyContracts?: CompanyContractListCLType;
        projectCompanies?: ProjectCompanyListCLType;
        createCompany?: CompanyCLType;
        startDate?: CustomDate;
        endDate?: CustomDate;
    } & CommonCLType
>;

export const toProjectCLType = (data?: ProjectType): ProjectCLType => {
    return {
        ...data,
        ...toCommonCLType(data),
        updateWorker: data?.updateWorker ? toWorkerCLType(data?.updateWorker) : undefined,
        projectConstructions: data?.projectConstructions ? toProjectConstructionListCLType(data?.projectConstructions) : undefined,
        contracts: data?.contracts ? toContractListCLType(data?.contracts) : undefined,
        projectContracts: data?.projectContracts ? toContractListCLType(data.projectContracts) : undefined,
        companyContracts: data?.companyContracts ? toCompanyContractListCLType(data.companyContracts) : undefined,
        projectCompanies: data?.projectCompanies ? toProjectCompanyListCLType(data?.projectCompanies) : undefined,
        createCompany: data?.createCompany ? toCompanyCLType(data?.createCompany) : undefined,
        startDate: data?.startDate ? toCustomDateFromTotalSeconds(data?.startDate, true) : undefined,
        endDate: data?.endDate ? toCustomDateFromTotalSeconds(data?.endDate, true) : undefined,
    } as ProjectCLType;
};
