import { isNoValueObject } from '../../utils/Utils'
import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ID } from '../_others/ID'
import { RequestType } from './Request'
import { RequestListCLType, RequestListType, toRequestListCLType, toRequestListType } from './RequestListType'

export type GetCompanyRequestListType = ('all' | 'receive' | 'order')[]

export type CompanyRequestListType = CommonListType<RequestType> & {
    orderRequests?: RequestListType
    receiveRequests?: RequestListType
    totalRequests?: RequestListType
}

export type CompanyRequestListCLType = ReplaceAnd<
    CompanyRequestListType,
    {
        orderRequests?: RequestListCLType
        receiveRequests?: RequestListCLType
        totalRequests?: RequestListCLType
    }
>

export const toCompanyRequestListCLType = (data?: CompanyRequestListType): CompanyRequestListCLType => {
    return {
        ...data,
        totalRequests: data?.totalRequests ? toRequestListCLType(data?.totalRequests) : undefined,
        orderRequests: data?.orderRequests ? toRequestListCLType(data?.orderRequests) : undefined,
        receiveRequests: data?.receiveRequests ? toRequestListCLType(data?.receiveRequests) : undefined,
    } as CompanyRequestListCLType
}

export const toCompanyRequestListType = (requests?: RequestType[], companyId?: ID, mode?: 'all' | 'none'): CompanyRequestListType => {
    mode = mode ?? 'all'
    if (mode == 'none') {
        return {
            totalRequests: toRequestListType(requests),
        }
    }
    return {
        totalRequests: requests,
        orderRequests: toRequestListType(filterOrderRequests(requests, companyId)),
        receiveRequests: toRequestListType(filterReceiveRequests(requests, companyId)),
    } as CompanyRequestListType
}

export const filterOrderRequests = (requests?: RequestType[], companyId?: ID): RequestType[] => {
    return requests?.filter((request) => isOrderRequest(request, companyId)).filter((data) => !isNoValueObject(data)) as RequestType[]
}
export const isOrderRequest = (request?: RequestType, companyId?: ID): boolean => {
    return request?.companyId == companyId
}

export const filterReceiveRequests = (requests?: RequestType[], companyId?: ID): RequestType[] => {
    return requests?.filter((request) => isReceiveRequest(request, companyId)).filter((data) => !isNoValueObject(data)) as RequestType[]
}
export const isReceiveRequest = (request?: RequestType, companyId?: ID): boolean => {
    return request?.requestedCompanyId == companyId
}
