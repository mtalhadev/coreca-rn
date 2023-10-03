import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ThreadLogType, ThreadLogCLType, toThreadLogCLType } from './ThreadLog'

export type GetThreadLogListType = 'all'[]

export type ThreadLogListType = CommonListType<ThreadLogType> & {
    items?: ThreadLogType[]
}

export type ThreadLogListCLType = ReplaceAnd<
    ThreadLogListType,
    {
        items?: ThreadLogCLType[]
    }
>

export const toThreadLogListCLType = (data?: ThreadLogListType): ThreadLogListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toThreadLogCLType(val)) : undefined,
    }
}

export const toThreadLogListType = (items?: ThreadLogType[], mode?: 'all' | 'none'): ThreadLogListType => {
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
