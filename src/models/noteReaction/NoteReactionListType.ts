import { CommonListType, ReplaceAnd } from '../_others/Common'
import { NoteReactionType, NoteReactionCLType, toNoteReactionCLType } from './NoteReaction'

export type GetNoteReactionListType = 'all'[]

export type NoteReactionListType = CommonListType<NoteReactionType> & {
    items?: NoteReactionType[]
}

export type NoteReactionListCLType = ReplaceAnd<
    NoteReactionListType,
    {
        items?: NoteReactionCLType[]
    }
>

export const toNoteReactionListCLType = (data?: NoteReactionListType): NoteReactionListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toNoteReactionCLType(val)) : undefined,
    }
}

export const toNoteReactionListType = (items?: NoteReactionType[], mode?: 'all' | 'none'): NoteReactionListType => {
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
