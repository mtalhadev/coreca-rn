import { CustomDate, toCustomDateFromTotalSeconds } from '../_others/CustomDate';
import { GetArrangementOptionParam } from '../arrangement/Arrangement';
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { ConstructionCLType, ConstructionType, toConstructionCLType } from '../construction/Construction';
import { GetRequestOptionParam } from '../request/Request';
import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker';
import { SiteRelationType } from './SiteRelationType';
import { SiteNameDataType, SiteNameDataCLType, toSiteNameDataClient } from './SiteNameDataType';
import { CompanyWorkerListCLType, CompanyWorkerListType, toCompanyWorkerListCLType } from '../worker/CompanyWorkerListType';
import { ArrangementListCLType, ArrangementListType, toArrangementListCLType } from '../arrangement/ArrangementListType';
import { CompanyRequestListCLType, CompanyRequestListType, GetCompanyRequestListType, toCompanyRequestListCLType } from '../request/CompanyRequestListType';
import { GetOptionObjectType, GetOptionParam, OptionType } from '../_others/Option';
import { RequestListType, RequestListCLType, toRequestListCLType } from '../request/RequestListType';
import { SiteArrangementDataCLType, SiteArrangementDataType, toSiteArrangementDataCLType } from '../arrangement/SiteArrangementDataType';
import { GetSiteCompanyListType, SiteCompanyListCLType, SiteCompanyListType, toSiteCompanyListCLType } from '../company/SiteCompanyListType';
import { SiteMeterCLType, SiteMeterType, toSiteMeterCLType } from './SiteMeterType';
import { SiteAttendanceDataCLType, SiteAttendanceDataType, toSiteAttendanceDataCLType } from '../attendance/SiteAttendanceDataType';
import { ConstructionRelationType } from '../construction/ConstructionRelationType';
import { TotalSeconds, YYYYMMDDTotalSecondsParam } from '../_others/TotalSeconds';
import { ID } from '../_others/ID';

/**
 * @remarks 仮会社施工現場の場合が特殊なので注意。
 *  - requiredNumと仮会社常用requestのrequestCountと揃える必要がある。
 *  - 仮会社常用requestのstockedAttendanceIdsは常に空になる。\
 * つまり、依頼された瞬間に自動応答しているということ。\
 * stockedAttendanceIdsにためる必要がなく、依頼数と応答数の差分で対応を変える必要もない。
 * @param requiredNum - 現場の必要作業員人数。仮会社施工現場の場合は、仮会社常用requestのrequestCountと揃える必要がある。
 * @param siteDate - サーバーサイドにて日付のデータとして必要。meetingDateのYYYYMMDD型
 * @param relatedCompanyIds - 関係会社一覧。現場削除時の日付データ更新用に必要。日付データ作成時に自動追加。
 * @param address - 現場住所。案件住所を参照。
 */
export type SiteModel = Partial<{
    siteId: ID;
    constructionId: ID;
    startDate: TotalSeconds;
    endDate: TotalSeconds;
    meetingDate: TotalSeconds;
    requiredNum: number;
    managerWorkerId: ID;
    address: string;
    belongings: string;
    isConfirmed: boolean;
    remarks: string;
    updateWorkerId: ID;
    siteDate: YYYYMMDDTotalSecondsParam
    relatedCompanyIds: ID[]
    /**
     * 仮会社に常用で送る際に、invRequestと対をなす。
     */
    fakeCompanyInvRequestId: string
}> &
    CommonModel;

export const initSite = (site: Create<SiteModel> | Update<SiteModel>): Update<SiteModel> => {
    const newSite: Update<SiteModel> = {
        siteId: site.siteId,
        constructionId: site.constructionId,
        startDate: site.startDate,
        endDate: site.endDate,
        meetingDate: site.meetingDate,
        requiredNum: site.requiredNum,
        managerWorkerId: site.managerWorkerId,
        address: site.address,
        belongings: site.belongings,
        isConfirmed: site.isConfirmed,
        remarks: site.remarks,
        updateWorkerId: site.updateWorkerId,
        siteDate: site.siteDate,
        relatedCompanyIds: site.relatedCompanyIds,
        fakeCompanyInvRequestId: site.fakeCompanyInvRequestId
    };

    return newSite;
};

/**
 * {@link WorkerOptionInputParam - 説明}
 */
export type SiteOptionInputParam = ReplaceAnd<
    GetOptionObjectType<SiteOptionParam>,
    {
        siteArrangementData: OptionType<{
            companyId?: ID;
            requestId?: ID;
            myWorkerId?: ID;
            dailySiteIds?: ID[];
            siteRelation?: SiteRelationType;
            siteManagerCompanyId?: ID;
            date?: TotalSeconds
        }>;
        siteAttendanceData: OptionType<{
            companyId?: ID;
            requestId?: ID;
            myWorkerId?: ID;
            dailySiteIds?: ID[];
            siteRelation?: SiteRelationType;
            siteManagerCompanyId?: ID;
        }>;
        companyRequests?: OptionType<{
            companyId: ID;
            types?: GetCompanyRequestListType;
        }>;
        siteNameData?: OptionType<{
            sites?: SiteType[];
        }>;
        arrangeableWorkers?: OptionType<{
            companyId: ID;
        }>;
        siteRelation?: OptionType<{
            companyId: ID;
            constructionRelation?: ConstructionRelationType;
        }>;
        siteCompanies?: OptionType<{
            types?: GetSiteCompanyListType;
        }>;
        siteMeter?: OptionType<{
            companyId: ID;
            requestId?: ID;
            siteRelation?: SiteRelationType;
            siteManagerCompanyId?: ID;
            arrangementOptions?: GetArrangementOptionParam;
            requestOptions?: GetRequestOptionParam;
        }>;
    }
>;

/**
 * {@link WorkerOptionParam - 説明}
 * #### 基本は下のsub群を使う。
 * @param allArrangements - 現場に関連する全ての手配を取得
 * @param allRequests - 現場に関連する全ての常用依頼を取得
 * ---
 * #### 現場への手配や常用依頼を取得したい
 * @param subArrangements - 現場直下の手配を取得。arrangement.respondRequestId == 'top'
 * @param subRequest - 現場直下の常用依頼を取得。request.respondRequestId == 'top'
 * @param subRespondCount - 現場直下の応答数=現場手配数をカウント。応答という意味合いは薄いがrequestと統一するためにこの名称にしている。指定するとsubArrangementsとsubRequestを取得する。
 * @param subActualRespondCount - 現場直下の稼働数をカウント。手配したうちの常用依頼において応答されているものを取得。meterの条件に注意。
 * @param subUnreportedCount - 直下の未報告数をカウント。meterの条件に注意。
 * @param subWaitingCount - 直下の応答待ちをカウント。meterの条件に注意。presentRequestsでsubRespondCount必須
 *
 * #### 手配周りの集計が欲しいならこれだけで十分
 * @param siteMeter - 現場の依頼数（必要数）とそれへの手配数や常用依頼数を集計したデータ。手配データや常用依頼データも取得できるのでそのまま使用する。
 *
 * ---
 * #### 常用現場の自社への常用依頼を取得する際に使用する。
 * @param companyRequests - 現場に関わる会社ごとの常用依頼データ。自社発注と自社受注で分類している。常用現場から自社への常用依頼にアクセスする際に使用する。
 * receiveRequestsは現場においては一つしか存在しないはず。
 *
 */
export type SiteOptionParam = {
    allArrangements?: ArrangementListType;
    allRequests?: RequestListType;
    subArrangements?: ArrangementListType;
    subRequests?: RequestListType;
    subRespondCount?: number;
    subActualRespondCount?: number;
    subUnreportedCount?: number;
    subWaitingCount?: number;
    companyRequests?: CompanyRequestListType;
    siteArrangementData?: SiteArrangementDataType;
    siteAttendanceData?: SiteAttendanceDataType;
    siteCompanies?: SiteCompanyListType;
    managerWorker?: WorkerType;
    siteNameData?: SiteNameDataType;
    construction?: ConstructionType;
    updateWorker?: WorkerType;
    arrangeableWorkers?: CompanyWorkerListType;
    siteRelation?: SiteRelationType;
    siteMeter?: SiteMeterType;
    isInstruction?: boolean
};

export type SiteType = SiteModel & SiteOptionParam;
export type GetSiteOptionParam = GetOptionParam<SiteType, SiteOptionParam, SiteOptionInputParam>;

export type SiteCLType = ReplaceAnd<
    SiteType,
    {
        allArrangements?: ArrangementListCLType;
        allRequests?: RequestListCLType;
        subArrangements?: ArrangementListCLType;
        subRequests?: RequestListCLType;
        companyRequests?: CompanyRequestListCLType;
        siteArrangementData?: SiteArrangementDataCLType;
        siteAttendanceData?: SiteAttendanceDataCLType;
        siteCompanies?: SiteCompanyListCLType;
        managerWorker?: WorkerCLType;
        siteNameData?: SiteNameDataCLType;
        construction?: ConstructionCLType;
        updateWorker?: WorkerCLType;
        arrangeableWorkers?: CompanyWorkerListCLType;
        startDate?: CustomDate;
        endDate?: CustomDate;
        meetingDate?: CustomDate;
        siteMeter?: SiteMeterCLType;
    } & CommonCLType
>;

export const toSiteCLType = (data?: SiteType): SiteCLType => {
    return {
        ...data,
        ...toCommonCLType(data),
        allArrangements: data?.allArrangements ? toArrangementListCLType(data?.allArrangements) : undefined,
        allRequests: data?.allRequests ? toRequestListCLType(data?.allRequests) : undefined,
        subArrangements: data?.subArrangements ? toArrangementListCLType(data?.subArrangements) : undefined,
        subRequests: data?.subRequests ? toRequestListCLType(data?.subRequests) : undefined,
        companyRequests: data?.companyRequests ? toCompanyRequestListCLType(data?.companyRequests) : undefined,
        siteArrangementData: data?.siteArrangementData ? toSiteArrangementDataCLType(data?.siteArrangementData) : undefined,
        siteAttendanceData: data?.siteAttendanceData ? toSiteAttendanceDataCLType(data?.siteAttendanceData) : undefined,
        siteCompanies: data?.siteCompanies ? toSiteCompanyListCLType(data?.siteCompanies) : undefined,
        managerWorker: data?.managerWorker ? toWorkerCLType(data?.managerWorker) : undefined,
        siteNameData: data?.siteNameData ? toSiteNameDataClient(data.siteNameData) : undefined,
        construction: data?.construction ? toConstructionCLType(data?.construction) : undefined,
        updateWorker: data?.updateWorker ? toWorkerCLType(data?.updateWorker) : undefined,
        arrangeableWorkers: data?.arrangeableWorkers ? toCompanyWorkerListCLType(data?.arrangeableWorkers) : undefined,
        startDate: data?.startDate ? toCustomDateFromTotalSeconds(data?.startDate, true) : undefined,
        endDate: data?.endDate ? toCustomDateFromTotalSeconds(data?.endDate, true) : undefined,
        meetingDate: data?.meetingDate ? toCustomDateFromTotalSeconds(data?.meetingDate, true) : undefined,
        siteMeter: data?.siteMeter ? toSiteMeterCLType(data?.siteMeter) : undefined,
    } as SiteCLType;
};
