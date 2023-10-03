import { CommonListType, ReplaceAnd } from '../_others/Common'
import { PartnershipCLType, PartnershipType, toPartnershipCLType } from './Partnership'

export type GetPartnershipListType = 'all'[]

export type PartnershipListType = CommonListType<PartnershipType> & {
    items?: PartnershipType[]
}

export type PartnershipListCLType = ReplaceAnd<
    PartnershipListType,
    {
        items?: PartnershipCLType[]
    }
>

export const toPartnershipListCLType = (data?: PartnershipListType): PartnershipListCLType => {
    return {
        ...data,
        items: data?.items?.map((val) => toPartnershipCLType(val)),
    }
}

export const toPartnershipListType = (items?: PartnershipType[], mode?: 'all' | 'none'): PartnershipListType => {
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
