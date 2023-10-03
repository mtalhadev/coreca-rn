import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ReactionType, ReactionCLType, toReactionCLType } from './Reaction'

export type GetReactionListType = 'all'[]

export type ReactionListType = CommonListType<ReactionType> & {
    items?: ReactionType[]
}

export type ReactionListCLType = ReplaceAnd<
    ReactionListType,
    {
        items?: ReactionCLType[]
    }
>

export const toReactionListCLType = (data?: ReactionListType): ReactionListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toReactionCLType(val)) : undefined,
    }
}

export const toReactionListType = (items?: ReactionType[], mode?: 'all' | 'none'): ReactionListType => {
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
