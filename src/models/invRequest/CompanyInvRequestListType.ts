import { isNoValueObject } from '../../utils/Utils'
import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ID } from '../_others/ID'
import { InvRequestListCLType, InvRequestListType, toInvRequestListCLType, toInvRequestListType } from './InvRequestListType'
import { InvRequestType } from './InvRequestType'

export type GetCompanyInvRequestListType = ('all' | 'receive' | 'order')[]

export type CompanyInvRequestListType = CommonListType<InvRequestType> & {
    orderInvRequests?: InvRequestListType
    receiveInvRequests?: InvRequestListType
    totalInvRequests?: InvRequestListType
}

export type CompanyInvRequestListCLType = ReplaceAnd<
    CompanyInvRequestListType,
    {
        orderInvRequests?: InvRequestListCLType
        receiveInvRequests?: InvRequestListCLType
        totalInvRequests?: InvRequestListCLType
    }
>

export const toCompanyInvRequestListCLType = (data?: CompanyInvRequestListType): CompanyInvRequestListCLType => {
    return {
        ...data,
        totalInvRequests: data?.totalInvRequests ? toInvRequestListCLType(data?.totalInvRequests) : undefined,
        orderInvRequests: data?.orderInvRequests ? toInvRequestListCLType(data?.orderInvRequests) : undefined,
        receiveInvRequests: data?.receiveInvRequests ? toInvRequestListCLType(data?.receiveInvRequests) : undefined,
    } as CompanyInvRequestListCLType
}

export const toCompanyInvRequestListType = (invRequests?: InvRequestType[], companyId?: ID, mode?: 'all' | 'none'): CompanyInvRequestListType => {
    mode = mode ?? 'all'
    if (mode == 'none') {
        return {
            totalInvRequests: toInvRequestListType(invRequests),
        }
    }
    return {
        totalInvRequests: invRequests,
        orderInvRequests: toInvRequestListType(filterOrderInvRequests(invRequests, companyId)),
        receiveInvRequests: toInvRequestListType(filterReceiveInvRequests(invRequests, companyId)),
    } as CompanyInvRequestListType
}

export const filterOrderInvRequests = (invRequests?: InvRequestType[], companyId?: ID): InvRequestType[] => {
    return invRequests?.filter((invRequest) => isOrderInvRequest(invRequest, companyId)).filter((data) => !isNoValueObject(data)) as InvRequestType[]
}
export const isOrderInvRequest = (invRequest?: InvRequestType, companyId?: ID): boolean => {
    return invRequest?.myCompanyId == companyId
}

export const filterReceiveInvRequests = (invRequests?: InvRequestType[], companyId?: ID): InvRequestType[] => {
    return invRequests?.filter((invRequest) => isReceiveInvRequest(invRequest, companyId)).filter((data) => !isNoValueObject(data)) as InvRequestType[]
}
export const isReceiveInvRequest = (invRequest?: InvRequestType, companyId?: ID): boolean => {
    return invRequest?.targetCompanyId == companyId
}
