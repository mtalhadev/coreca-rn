import { CommonListType, ReplaceAnd } from '../_others/Common'
import { CompanyType } from './Company'
import { CompanyListCLType, CompanyListType, toCompanyListCLType } from './CompanyListType'

export type ProjectCompanyListType = CommonListType<CompanyType> & {
    companies?: CompanyListType
    ownerCompanies?: CompanyListType
    managerCompanies?: CompanyListType
    intermediationCompanies?: CompanyListType
}

export type ProjectCompanyListCLType = ReplaceAnd<
    ProjectCompanyListType,
    {
        companies?: CompanyListCLType
        ownerCompanies?: CompanyListCLType
        managerCompanies?: CompanyListCLType
        intermediationCompanies?: CompanyListCLType
    }
>

export const toProjectCompanyListCLType = (data?: ProjectCompanyListType): ProjectCompanyListCLType => {
    return {
        ...data,
        companies: data?.companies ? toCompanyListCLType(data?.companies) : undefined,
        intermediationCompanies: data?.intermediationCompanies ? toCompanyListCLType(data?.intermediationCompanies) : undefined,
        ownerCompanies: data?.ownerCompanies ? toCompanyListCLType(data?.ownerCompanies) : undefined,
        managerCompanies: data?.managerCompanies ? toCompanyListCLType(data?.managerCompanies) : undefined,
    }
}
