import { ConstructionRelationType } from './ConstructionRelationType';
import { WeekOfDay } from '../../utils/ext/Date.extensions';
import { CustomDate, toCustomDateFromTotalSeconds } from '../_others/CustomDate';
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { ContractCLType, ContractType, toContractCLType } from '../contract/Contract';
import { ProjectCLType, ProjectType, toProjectCLType } from '../project/Project';
import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker';
import { GetOptionObjectType, GetOptionParam, OptionType } from '../_others/Option';
import { SiteListType, SiteListCLType, toSiteListCLType } from '../site/SiteListType';
import { ConstructionMeterCLType, ConstructionMeterType, toConstructionMeterCLType } from './ConstructionMeterType';
import { ConstructionCompanyListCLType, ConstructionCompanyListType, toConstructionCompanyListCLType } from '../company/ConstructionCompanyListType';
import { TotalSeconds } from '../_others/TotalSeconds';
import { ID } from '../_others/ID';

/**
 * @param contractId - この工事の元になる契約
 * @param projectId - 非正規化項目。この工事の案件。契約上のprojectIdがマスター。
 * @param startDate - *案件に統一するので使用しない。
 * @param endDate - *案件に統一するので使用しない。
 */
export type ConstructionModel = Partial<{
    constructionId: ID;
    contractId: ID;
    name: string;
    offDaysOfWeek: WeekOfDay[];
    otherOffDays: number[];
    requiredWorkerNum: number;
    remarks: string;
    siteMeetingTime: TotalSeconds;
    siteStartTime: TotalSeconds;
    siteStartTimeIsNextDay: boolean;
    siteEndTime: TotalSeconds;
    siteEndTimeIsNextDay: boolean;
    siteRequiredNum: number;
    siteAddress: string;
    siteBelongings: string;
    siteRemarks: string;
    updateWorkerId: ID;
    projectId: ID;
    /**
     * 仮会社へ常用で送った場合に、自動作成される工事と紐づくInvReservationのId
     */
    fakeCompanyInvReservationId: ID;
}> &
    CommonModel;

export const initConstruction = (construction: Create<ConstructionModel> | Update<ConstructionModel>): Update<ConstructionModel> => {
    const newConstruction: Update<ConstructionModel> = {
        constructionId: construction.constructionId,
        contractId: construction.contractId,
        name: construction.name,
        offDaysOfWeek: construction.offDaysOfWeek,
        otherOffDays: construction.otherOffDays,
        requiredWorkerNum: construction.requiredWorkerNum,
        remarks: construction.remarks,
        siteMeetingTime: construction.siteMeetingTime,
        siteStartTime: construction.siteStartTime,
        siteStartTimeIsNextDay: construction.siteStartTimeIsNextDay,
        siteEndTime: construction.siteEndTime,
        siteEndTimeIsNextDay: construction.siteEndTimeIsNextDay,
        siteRequiredNum: construction.siteRequiredNum,
        siteAddress: construction.siteAddress,
        siteBelongings: construction.siteBelongings,
        siteRemarks: construction.siteRemarks,
        updateWorkerId: construction.updateWorkerId,
        projectId: construction.projectId,
        fakeCompanyInvReservationId: construction.fakeCompanyInvReservationId,
    };
    return newConstruction;
};

/**
 * {@link WorkerOptionInputParam - 説明}
 */
export type ConstructionOptionInputParam = ReplaceAnd<
    GetOptionObjectType<ConstructionOptionParam>,
    {
        constructionRelation?: OptionType<{
            companyId?: ID;
        }>;
        constructionMeter?: OptionType<{
            companyId: ID;
        }>;
    }
>;

/**
 * {@link WorkerOptionParam - 説明}
 */
export type ConstructionOptionParam = {
    sites?: SiteListType;
    project?: ProjectType;
    contract?: ContractType;
    subContract?: ContractType;
    constructionRelation?: ConstructionRelationType;
    constructionCompanies?: ConstructionCompanyListType;
    updateWorker?: WorkerType;
    displayName?: string;
    constructionMeter?: ConstructionMeterType;
};

/**
 * contract - この工事の元になる契約（上位）
 * subContract - この工事を発注した場合の契約（下位）
 * displayName - 表示用の工事名。nameではなくこちらを使用する。
 */
export type ConstructionType = ConstructionModel & ConstructionOptionParam;

export type GetConstructionOptionParam = GetOptionParam<ConstructionType, ConstructionOptionParam, ConstructionOptionInputParam>;

export type ConstructionCLType = ReplaceAnd<
    ConstructionType,
    {
        sites?: SiteListCLType;
        project?: ProjectCLType;
        contract?: ContractCLType;
        subContract?: ContractCLType;
        updateWorker?: WorkerCLType;
        siteMeetingTime?: CustomDate;
        siteStartTime?: CustomDate;
        siteStartTimeIsNextDay?: boolean;
        siteEndTime?: CustomDate;
        siteEndTimeIsNextDay?: boolean;
        offDaysOfWeek?: WeekOfDay[];
        otherOffDays?: CustomDate[];
        constructionMeter?: ConstructionMeterCLType;
        constructionCompanies?: ConstructionCompanyListCLType;
    } & CommonCLType
>;

export const toConstructionCLType = (data?: ConstructionType): ConstructionCLType => {
    return {
        ...data,
        ...toCommonCLType(data),
        sites: data?.sites ? toSiteListCLType(data.sites) : undefined,
        project: data?.project ? toProjectCLType(data?.project) : undefined,
        contract: data?.contract ? toContractCLType(data?.contract) : undefined,
        subContract: data?.subContract ? toContractCLType(data?.subContract) : undefined,
        updateWorker: data?.updateWorker ? toWorkerCLType(data?.updateWorker) : undefined,
        siteMeetingTime: data?.siteMeetingTime ? toCustomDateFromTotalSeconds(data?.siteMeetingTime, true) : undefined,
        siteStartTime: data?.siteStartTime ? toCustomDateFromTotalSeconds(data?.siteStartTime, true) : undefined,
        siteEndTime: data?.siteEndTime ? toCustomDateFromTotalSeconds(data?.siteEndTime, true) : undefined,
        offDaysOfWeek: data?.offDaysOfWeek ? (data?.offDaysOfWeek as WeekOfDay[]) : undefined,
        otherOffDays: data?.otherOffDays ? data?.otherOffDays?.map((val) => toCustomDateFromTotalSeconds(val, true)) : undefined,
        constructionMeter: data?.constructionMeter ? toConstructionMeterCLType(data?.constructionMeter) : undefined,
        constructionCompanies: data?.constructionCompanies ? toConstructionCompanyListCLType(data?.constructionCompanies) : undefined,
    } as ConstructionCLType;
};
