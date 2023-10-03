import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common'
import { CompanyCLType, CompanyType, toCompanyCLType } from '../company/Company'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'
import { ID } from '../_others/ID'

/**
 * fromCompanyId - 招待した会社
 * toCompanyId - 招待された会社
 */
export type PartnershipModel = Partial<{
    partnershipId: ID
    fromCompanyId: ID
    toCompanyId: ID
    isAccepted: boolean
}> &
    CommonModel

export const initPartnership = (partnership: Create<PartnershipModel> | Update<PartnershipModel>): Update<PartnershipModel> => {
    const newPartnership: Update<PartnershipModel> = {
        partnershipId: partnership.partnershipId,
        fromCompanyId: partnership.fromCompanyId,
        toCompanyId: partnership.toCompanyId,
        isAccepted: partnership.isAccepted,
    }
    return newPartnership
}

/**
 * {@link WorkerOptionInputParam - 説明}
 */
export type PartnershipOptionInputParam = ReplaceAnd<
    GetOptionObjectType<PartnershipOptionParam>,
    {
        //
    }
>

export type GetPartnershipOptionParam = GetOptionParam<PartnershipType, PartnershipOptionParam, PartnershipOptionInputParam>

/**
 * {@link WorkerOptionParam - 説明}
 */
export type PartnershipOptionParam = {
    fromCompany?: CompanyType
    toCompany?: CompanyType
}

export type PartnershipType = PartnershipModel & PartnershipOptionParam
export type PartnershipCLType = ReplaceAnd<
    PartnershipType,
    {
        fromCompany?: CompanyCLType
        toCompany?: CompanyCLType
    } & CommonCLType
>

export const toPartnershipCLType = (data?: PartnershipType): PartnershipCLType => {
    return {
        ...data,
        ...toCommonCLType(data),
        fromCompany: data?.fromCompany ? toCompanyCLType(data?.fromCompany) : undefined,
        toCompany: data?.toCompany ? toCompanyCLType(data?.toCompany) : undefined,
    } as PartnershipCLType
}
