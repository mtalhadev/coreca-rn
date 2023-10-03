import { CommonListType, ReplaceAnd } from '../_others/Common'
import { InvRequestType, InvRequestCLType, toInvRequestCLType } from './InvRequestType'

export type GetInvRequestListType = 'all'[]

export type InvRequestListType = CommonListType<InvRequestType> & {
    items?: InvRequestType[]
}

export type InvRequestListCLType = ReplaceAnd<
    InvRequestListType,
    {
        items?: InvRequestCLType[]
    }
>

export const toInvRequestListCLType = (data?: InvRequestListType): InvRequestListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toInvRequestCLType(val)) : undefined,
    }
}

export const toInvRequestListType = (items?: InvRequestType[], mode?: 'all' | 'none'): InvRequestListType => {
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
