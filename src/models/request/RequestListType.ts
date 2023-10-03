import { CommonListType, ReplaceAnd } from '../_others/Common'
import { RequestType, RequestCLType, toRequestCLType } from './Request'

export type GetRequestListType = 'all'[]

export type RequestListType = CommonListType<RequestType> & {
    items?: RequestType[]
}

export type RequestListCLType = ReplaceAnd<
    RequestListType,
    {
        items?: RequestCLType[]
    }
>

export const toRequestListCLType = (data?: RequestListType): RequestListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toRequestCLType(val)) : undefined,
    }
}

export const toRequestListType = (items?: RequestType[], mode?: 'all' | 'none'): RequestListType => {
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
