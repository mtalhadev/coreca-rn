import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ReadType, ReadCLType, toReadCLType } from './Read'

export type GetReadListType = 'all'[]

export type ReadListType = CommonListType<ReadType> & {
    items?: ReadType[]
}

export type ReadListCLType = ReplaceAnd<
    ReadListType,
    {
        items?: ReadCLType[]
    }
>

export const toReadListCLType = (data?: ReadListType): ReadListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toReadCLType(val)) : undefined,
    }
}

export const toReadListType = (items?: ReadType[], mode?: 'all' | 'none'): ReadListType => {
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
