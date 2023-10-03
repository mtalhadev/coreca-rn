import { CommonListType, ReplaceAnd } from '../_others/Common'
import { NoteAttachmentType, NoteAttachmentCLType, toNoteAttachmentCLType } from './NoteAttachment'

export type GetNoteAttachmentListType = 'all'[]

export type NoteAttachmentListType = CommonListType<NoteAttachmentType> & {
    items?: NoteAttachmentType[]
}

export type NoteAttachmentListCLType = ReplaceAnd<
    NoteAttachmentListType,
    {
        items?: NoteAttachmentCLType[]
    }
>

export const toNoteAttachmentListCLType = (data?: NoteAttachmentListType): NoteAttachmentListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toNoteAttachmentCLType(val)) : undefined,
    }
}

export const toNoteAttachmentListType = (items?: NoteAttachmentType[], mode?: 'all' | 'none'): NoteAttachmentListType => {
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
