import { CustomDate, toCustomDateFromTotalSeconds } from '../_others/CustomDate'
import { CommonListType, ReplaceAnd } from '../_others/Common'
import { CompanyCLType, CompanyType, toCompanyCLType } from './Company'
import { TotalSeconds } from '../_others/TotalSeconds'

export type GetCompanyListType = 'all'[]

export type CompanyListType = CommonListType<CompanyType> & {
    items?: CompanyType[]
}

export type CompanyListCLType = ReplaceAnd<
    CompanyListType,
    {
        items?: CompanyCLType[]
    }
>

export const toCompanyListCLType = (data?: CompanyListType): CompanyListCLType => {
    return {
        ...data,
        items: data?.items?.map((val) => toCompanyCLType(val)),
    }
}

export const toCompanyListType = (items?: CompanyType[], mode?: 'all' | 'none'): CompanyListType => {
    mode = mode ?? 'all'
    if (mode == 'none') {
        return {
            items,
        }
    }
    return {
        items,
    }
}

// service用
export type LastDealType = {
    requestOrderDate?: TotalSeconds
    requestReceiveDate?: TotalSeconds
    contractOrderDate?: TotalSeconds
    contractReceiveDate?: TotalSeconds
    latestLastDealDate?: TotalSeconds
}

// usecase用。serviceではCustomDateを使わない。
export type LastDealCLType = {
    requestOrderDate?: CustomDate
    requestReceiveDate?: CustomDate
    contractOrderDate?: CustomDate
    contractReceiveDate?: CustomDate
    latestLastDealDate?: CustomDate
}

export const toLastDealCLType = (data: LastDealType): LastDealCLType => {
    return {
        requestOrderDate: data?.requestOrderDate ? toCustomDateFromTotalSeconds(data.requestOrderDate, true) : undefined,
        requestReceiveDate: data?.requestReceiveDate ? toCustomDateFromTotalSeconds(data.requestReceiveDate, true) : undefined,
        contractOrderDate: data?.contractOrderDate ? toCustomDateFromTotalSeconds(data.contractOrderDate, true) : undefined,
        contractReceiveDate: data?.contractReceiveDate ? toCustomDateFromTotalSeconds(data.contractReceiveDate, true) : undefined,
        latestLastDealDate: data?.latestLastDealDate ? toCustomDateFromTotalSeconds(data.latestLastDealDate, true) : undefined,
    }
}
