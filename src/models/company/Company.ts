import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common'
import { CompanyPartnershipType } from './CompanyPartnershipType'
import { CompanyContractListCLType, CompanyContractListType, GetCompanyContractListType, toCompanyContractListCLType } from '../contract/CompanyContractListType'
import { CompanyListCLType, CompanyListType, LastDealCLType, LastDealType, toCompanyListCLType, toLastDealCLType } from './CompanyListType'
import { toWorkerListCLType, WorkerListCLType, WorkerListType } from '../worker/WorkerListType'
import { GetOptionObjectType, GetOptionParam, OptionType } from '../_others/Option'
import { ConstructionListType, ConstructionListCLType, toConstructionListCLType } from '../construction/ConstructionListType'
import { CompanyConstructionListCLType, CompanyConstructionListType, toCompanyConstructionListCLType } from '../construction/CompanyConstructionListType'
import { PlanTicketCLType, PlanTicketType, toPlanTicketCLType } from '../_others/PlanTicket'
import { ID } from '../_others/ID'
import { DepartmentListType } from '../department/DepartmentListType'

/**
 * @param paidPlan - プレミアム。undefinedなら無料プラン。
 * @param isAdmin - 運営かどうか。運営権限限定の機能を使えるように。
 */
export type CompanyModel = Partial<{
    companyId: ID
    name: string
    address: string
    industry: string
    phoneNumber: string
    ownerName: string
    ownerPhoneNumber: string
    ownerEmail: string
    imageUrl: string
    sImageUrl: string
    xsImageUrl: string
    imageColorHue: number
    isFake: boolean
    isAdmin: boolean
    planTicketId: ID
    connectedCompanyId: ID
    updateWorkerId: ID
}> &
    CommonModel

export const initCompany = (company: Create<CompanyModel> | Update<CompanyModel>): Update<CompanyModel> => {
    const newCompany: Update<CompanyModel> = {
        companyId: company.companyId,
        name: company.name,
        address: company.address,
        industry: company.industry,
        phoneNumber: company.phoneNumber,
        ownerName: company.ownerName,
        ownerPhoneNumber: company.ownerPhoneNumber,
        ownerEmail: company.ownerEmail,
        imageUrl: company.imageUrl,
        sImageUrl: company.sImageUrl,
        xsImageUrl: company.xsImageUrl,
        imageColorHue: company.imageColorHue,
        isFake: company.isFake,
        connectedCompanyId: company.connectedCompanyId,
        updateWorkerId: company.updateWorkerId,
        planTicketId: company.planTicketId,
    }
    return newCompany
}

/**
 * {@link WorkerOptionInputParam - 説明}
 */
export type CompanyOptionInputParam = ReplaceAnd<
    GetOptionObjectType<CompanyOptionParam>,
    {
        connectedCompany?: OptionType<{
            myCompanyId?: ID
        }>
        companyContracts?: OptionType<{
            otherCompanyId?: ID
            types?: GetCompanyContractListType
        }>
        lastDeal?: OptionType<{
            myCompanyId?: ID
        }>
        companyPartnership?: OptionType<{
            companyId?: ID
        }>
    }
>

/**
 * {@link WorkerOptionParam - 説明}
 */
export type CompanyOptionParam = {
    workers?: WorkerListType
    connectedCompany?: CompanyType
    partnerCompanies?: CompanyListType
    constructions?: ConstructionListType
    companyConstructions?: CompanyConstructionListType
    companyPartnership?: CompanyPartnershipType
    companyContracts?: CompanyContractListType
    lastDeal?: LastDealType
    planTicket?: PlanTicketType
    departments?: DepartmentListType
}

export type CompanyType = CompanyModel & CompanyOptionParam 
export type GetCompanyOptionParam = GetOptionParam<CompanyType, CompanyOptionParam, CompanyOptionInputParam>

export type CompanyCLType = ReplaceAnd<
    CompanyType,
    {
        workers?: WorkerListCLType
        connectedCompany?: CompanyCLType
        partnerCompanies?: CompanyListCLType
        constructions?: ConstructionListCLType
        companyConstructions?: CompanyConstructionListCLType
        companyContracts?: CompanyContractListCLType
        lastDeal?: LastDealCLType
        planTicket?: PlanTicketCLType
    } & CommonCLType
>

export const toCompanyCLType = (data?: CompanyType): CompanyCLType => {
    if (data == undefined) {
        return {}
    }
    return {
        ...data,
        ...toCommonCLType(data),
        workers: data?.workers ? toWorkerListCLType(data?.workers) : undefined,
        connectedCompany: data?.connectedCompany ? toCompanyCLType(data?.connectedCompany) : undefined,
        partnerCompanies: data?.partnerCompanies ? toCompanyListCLType(data?.partnerCompanies) : undefined,
        constructions: data?.constructions ? toConstructionListCLType(data?.constructions) : undefined,
        companyConstructions: data?.companyConstructions ? toCompanyConstructionListCLType(data?.companyConstructions) : undefined,
        companyContracts: data?.companyContracts ? toCompanyContractListCLType(data?.companyContracts) : undefined,
        lastDeal: data?.lastDeal ? toLastDealCLType(data?.lastDeal) : undefined,
        planTicket: data?.planTicket ? toPlanTicketCLType(data?.planTicket) : undefined,
    } as CompanyCLType
}
