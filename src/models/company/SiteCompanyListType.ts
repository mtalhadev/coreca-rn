import { CommonListType, ReplaceAnd } from '../_others/Common'
import { CompanyCLType, CompanyType, toCompanyCLType } from './Company'
import { CompanyListCLType, CompanyListType, toCompanyListCLType } from './CompanyListType'

export type GetSiteCompanyListType = ('all' | 'order' | 'manager' | 'requested')[]

/**
 * 現場に関わる全ての会社を取得。
 * @param managerCompany - 施工会社
 * @param orderCompanies - 上位の発注会社リスト（オーナー含む）。上を辿っていく。配列の[0]が真上。
 * @param requestedCompanies - 常用依頼された会社リスト
 */
export type SiteCompanyListType = CommonListType<CompanyType> & {
    companies?: CompanyListType
    managerCompany?: CompanyType
    orderCompanies?: CompanyListType
    requestedCompanies?: CompanyListType
}

export type SiteCompanyListCLType = ReplaceAnd<
    SiteCompanyListType,
    {
        companies?: CompanyListCLType
        managerCompany?: CompanyCLType
        orderCompanies?: CompanyListCLType
        requestedCompanies?: CompanyListCLType
    }
>

export const toSiteCompanyListCLType = (data?: SiteCompanyListType): SiteCompanyListCLType => {
    return {
        ...data,
        companies: data?.companies ? toCompanyListCLType(data?.companies) : undefined,
        orderCompanies: data?.orderCompanies ? toCompanyListCLType(data?.orderCompanies) : undefined,
        managerCompany: data?.managerCompany ? toCompanyCLType(data?.managerCompany) : undefined,
        requestedCompanies: data?.requestedCompanies ? toCompanyListCLType(data?.requestedCompanies) : undefined,
    }
}
