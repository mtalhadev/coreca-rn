import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ThreadUserType, ThreadUserCLType, toThreadUserCLType } from './ThreadUser'

export type GetThreadUserListType = 'all'[]

export type ThreadUserListType = CommonListType<ThreadUserType> & {
    items?: ThreadUserType[]
}

export type ThreadUserListCLType = ReplaceAnd<
    ThreadUserListType,
    {
        items?: ThreadUserCLType[]
    }
>

export const toThreadUserListCLType = (data?: ThreadUserListType): ThreadUserListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toThreadUserCLType(val)) : undefined,
    }
}

export const toThreadUserListType = (items?: ThreadUserType[], mode?: 'all' | 'none'): ThreadUserListType => {
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
