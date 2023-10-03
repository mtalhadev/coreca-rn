import { CommonListType, ReplaceAnd } from '../_others/Common'
import { NoteCommentType, NoteCommentCLType, toNoteCommentCLType } from './NoteComment'

export type GetNoteCommentListType = 'all'[]

export type NoteCommentListType = CommonListType<NoteCommentType> & {
    items?: NoteCommentType[]
}

export type NoteCommentListCLType = ReplaceAnd<
    NoteCommentListType,
    {
        items?: NoteCommentCLType[]
    }
>

export const toNoteCommentListCLType = (data?: NoteCommentListType): NoteCommentListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toNoteCommentCLType(val)) : undefined,
    }
}

export const toNoteCommentListType = (items?: NoteCommentType[], mode?: 'all' | 'none'): NoteCommentListType => {
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
