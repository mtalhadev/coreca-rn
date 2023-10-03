import { CommonListType, ReplaceAnd } from '../_others/Common'
import { NoteType, NoteCLType, toNoteCLType } from './Note'

export type GetNoteListType = 'all'[]

export type NoteListType = CommonListType<NoteType> & {
    items?: NoteType[]
}

export type NoteListCLType = ReplaceAnd<
    NoteListType,
    {
        items?: NoteCLType[]
    }
>

export const toNoteListCLType = (data?: NoteListType): NoteListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toNoteCLType(val)) : undefined,
    }
}

export const toNoteListType = (items?: NoteType[], mode?: 'all' | 'none'): NoteListType => {
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
