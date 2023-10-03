import { CommonListType, ReplaceAnd } from '../_others/Common'
import { CompanyCLType, CompanyType, toCompanyCLType } from './Company'
import { CompanyListCLType, CompanyListType, toCompanyListCLType } from './CompanyListType'

export type GetConstructionCompanyListType = ('all' | 'order' | 'manager')[]

/**
 * 工事に関わる全ての会社を取得。
 * @param managerCompany - 施工会社
 * @param orderCompanies - 上位の発注会社リスト（オーナー含む）。上を辿っていく。配列の[0]が真上。
 */
export type ConstructionCompanyListType = CommonListType<CompanyType> & {
    companies?: CompanyListType
    managerCompany?: CompanyType
    orderCompanies?: CompanyListType
}

export type ConstructionCompanyListCLType = ReplaceAnd<
    ConstructionCompanyListType,
    {
        companies?: CompanyListCLType
        managerCompany?: CompanyCLType
        orderCompanies?: CompanyListCLType
    }
>

export const toConstructionCompanyListCLType = (data?: ConstructionCompanyListType): ConstructionCompanyListCLType => {
    return {
        ...data,
        companies: data?.companies ? toCompanyListCLType(data?.companies) : undefined,
        orderCompanies: data?.orderCompanies ? toCompanyListCLType(data?.orderCompanies) : undefined,
        managerCompany: data?.managerCompany ? toCompanyCLType(data?.managerCompany) : undefined,
    }
}
