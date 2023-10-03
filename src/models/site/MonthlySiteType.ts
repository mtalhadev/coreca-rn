import { CommonModel, Create, ReplaceAnd, Update } from '../_others/Common';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';
import { YYYYMMTotalSecondsParam } from '../_others/TotalSeconds';
import { ID } from '../_others/ID';
import { SiteListType } from './SiteListType';

/**
 * 工事の月毎の現場データを保存。SSG用
 */
export type MonthlySiteModel = Partial<{
    monthlySiteId: ID;
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    companyId: ID
    constructionId: ID
    sites: SiteListType
}> & CommonModel;

export const initMonthlySite = (monthlySite: Create<MonthlySiteModel> | Update<MonthlySiteModel>): Update<MonthlySiteModel> => {
    const newMonthlySite: Update<MonthlySiteModel> = {
        monthlySiteId: monthlySite.monthlySiteId,
        companyId: monthlySite.companyId,
        constructionId: monthlySite.constructionId,
        month: monthlySite.month,
        endOfMonth: monthlySite.endOfMonth,
        sites: monthlySite.sites
    };
    return newMonthlySite;
};

/**
 * {@link WorkerOptionInputParam - 説明}
 */
export type MonthlySiteOptionInputParam = ReplaceAnd<
    GetOptionObjectType<MonthlySiteOptionParam>,
    {
        // 
    }
>;

export type GetMonthlySiteOptionParam = GetOptionParam<MonthlySiteType, MonthlySiteOptionParam, MonthlySiteOptionInputParam>;

/**
 * 
 */
export type MonthlySiteOptionParam = {
    // 
};

export type MonthlySiteType = MonthlySiteModel & MonthlySiteOptionParam;