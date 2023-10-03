import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { ID } from '../_others/ID';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';


export type NoteAttachmentEnumType = 'picture' | 'movie'

export type NoteAttachmentModel = Partial<{
    noteId: ID;
    index: number;
    attachmentType: NoteAttachmentEnumType
    attachmentUrl: string;
    sAttachmentUrl: string;
    xsAttachmentUrl: string;
}> &
    CommonModel;

export const initNoteAttachment = (noteAttachment: Create<NoteAttachmentModel> | Update<NoteAttachmentModel>): Update<NoteAttachmentModel> => {
    const newNoteAttachment: Update<NoteAttachmentModel> = {
        noteId: noteAttachment.noteId,
        index: noteAttachment.index,
        attachmentType: noteAttachment.attachmentType,
        attachmentUrl: noteAttachment.attachmentUrl,
        sAttachmentUrl: noteAttachment.sAttachmentUrl,
        xsAttachmentUrl: noteAttachment.xsAttachmentUrl,
    };
    return newNoteAttachment;
};

/**
 * {@link WorkerOptionInputParam - 説明}
 */
 export type NoteAttachmentOptionInputParam = ReplaceAnd<
    GetOptionObjectType<NoteAttachmentOptionParam>,
    {
        //
    }
>;

/**
 * {@link WorkerOptionParam - 説明}
 */
export type NoteAttachmentOptionParam = {
};

export type NoteAttachmentType = NoteAttachmentModel & NoteAttachmentOptionParam;
export type GetNoteAttachmentOptionParam = GetOptionParam<NoteAttachmentType, NoteAttachmentOptionParam, NoteAttachmentOptionInputParam>;




export type NoteAttachmentCLType = ReplaceAnd<
  NoteAttachmentType,
  {
  } & CommonCLType
>;

export const toNoteAttachmentCLType = (data?: NoteAttachmentType): NoteAttachmentCLType => {
  return {
    ...data,
    ...toCommonCLType(data),
    
  } as NoteAttachmentCLType;
};