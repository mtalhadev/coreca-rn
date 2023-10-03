import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker';
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { ID } from '../_others/ID';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';


export type NoteCommentEnumType = 'text' | 'picture' | 'movie'

export type NoteCommentModel = Partial<{
    noteCommentId: ID;
    noteId: ID;
    workerId: ID;
    commentType: NoteCommentEnumType
    message: string;
    attachmentUrl: string;
    sAttachmentUrl: string;
    xsAttachmentUrl: string;
}> &
    CommonModel;

export const initNoteComment = (noteComment: Create<NoteCommentModel> | Update<NoteCommentModel>): Update<NoteCommentModel> => {
    const newNoteComment: Update<NoteCommentModel> = {
        noteCommentId: noteComment.noteCommentId,
        noteId: noteComment.noteId,
        workerId: noteComment.workerId,
        commentType: noteComment.commentType,
        message: noteComment.message,
        attachmentUrl: noteComment.attachmentUrl,
        sAttachmentUrl: noteComment.sAttachmentUrl,
        xsAttachmentUrl: noteComment.xsAttachmentUrl,
    };
    return newNoteComment;
};

/**
 * {@link WorkerOptionInputParam - 説明}
 */
 export type NoteCommentOptionInputParam = ReplaceAnd<
    GetOptionObjectType<NoteCommentOptionParam>,
    {
        //
    }
>;

/**
 * {@link WorkerOptionParam - 説明}
 */
export type NoteCommentOptionParam = {
    worker?: WorkerType;
};

export type NoteCommentType = NoteCommentModel & NoteCommentOptionParam;
export type GetNoteCommentOptionParam = GetOptionParam<NoteCommentType, NoteCommentOptionParam, NoteCommentOptionInputParam>;




export type NoteCommentCLType = ReplaceAnd<
  NoteCommentType,
  {
    worker?: WorkerCLType;
  } & CommonCLType
>;

export const toNoteCommentCLType = (data?: NoteCommentType): NoteCommentCLType => {
  return {
    ...data,
    ...toCommonCLType(data),
    worker: data?.worker ? toWorkerCLType(data?.worker) : undefined,
    
  } as NoteCommentCLType;
};