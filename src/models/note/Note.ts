import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker';
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { ID } from '../_others/ID';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';



export type NoteModel = Partial<{
    noteId: ID;
    messageId: ID;
    workerId: ID;
    roomId: ID;
    threadId: ID;
    message: string
}> &
    CommonModel;

export const initNote = (note: Create<NoteModel> | Update<NoteModel>): Update<NoteModel> => {
    const newNote: Update<NoteModel> = {
        noteId: note.noteId,
        messageId: note.messageId,
        workerId: note.workerId,
        roomId: note.roomId,
        threadId: note.threadId,
        message: note.message,
    };
    return newNote;
};


/**
 * {@link WorkerOptionInputParam - 説明}
 */
 export type NoteOptionInputParam = ReplaceAnd<
    GetOptionObjectType<NoteOptionParam>,
    {
        //
    }
>;

/**
 * {@link WorkerOptionParam - 説明}
 */
export type NoteOptionParam = {
    worker?: WorkerType;
};

export type NoteType = NoteModel & NoteOptionParam;
export type GetNoteOptionParam = GetOptionParam<NoteType, NoteOptionParam, NoteOptionInputParam>;


export type NoteCLType = ReplaceAnd<
  NoteType,
  {
    worker?: WorkerCLType;
  } & CommonCLType
>;

export const toNoteCLType = (data?: NoteType): NoteCLType => {
  return {
    ...data,
    ...toCommonCLType(data),
    worker: data?.worker ? toWorkerCLType(data?.worker) : undefined,
  } as NoteCLType;
};
