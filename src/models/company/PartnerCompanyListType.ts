import { CommonModel, Create, ReplaceAnd, Update } from '../_others/Common';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';
import { ID } from '../_others/ID';
import { CompanyCLType } from './Company';

/**
 * 顧客/取引先一覧データを保存。SSG用
 */
export type PartnerCompanyListModel = Partial<{
    partnerCompanyListId: ID;
    companyId: ID
    companies: CompanyCLType[]
}> & CommonModel;

export const initPartnerCompanyList = (partnerCompanyList: Create<PartnerCompanyListModel> | Update<PartnerCompanyListModel>): Update<PartnerCompanyListModel> => {
    const newPartnerCompanyList: Update<PartnerCompanyListModel> = {
        partnerCompanyListId: partnerCompanyList.partnerCompanyListId,
        companyId: partnerCompanyList.companyId,
        companies: partnerCompanyList.companies
    };
    return newPartnerCompanyList;
};

/**
 * {@link PartnerCompanyListOptionParam - 説明}
 */
export type PartnerCompanyListOptionInputParam = ReplaceAnd<
    GetOptionObjectType<PartnerCompanyListOptionParam>,
    {
        // 
    }
>;

export type GetPartnerCompanyListOptionParam = GetOptionParam<PartnerCompanyListType, PartnerCompanyListOptionParam, PartnerCompanyListOptionInputParam>;

/**
 * 
 */
export type PartnerCompanyListOptionParam = {
    // 
};

export type PartnerCompanyListType = PartnerCompanyListModel & PartnerCompanyListOptionParam;