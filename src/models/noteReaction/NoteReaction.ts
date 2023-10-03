import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker';
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { ID } from '../_others/ID';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';


export type NoteReactionEnumType = 'text' | 'picture' | 'movie'

export type NoteReactionModel = Partial<{
    noteId: ID;
    workerId: ID;
    reactionChar: string;
}> &
    CommonModel;

export const initNoteReaction = (noteReaction: Create<NoteReactionModel> | Update<NoteReactionModel>): Update<NoteReactionModel> => {
    const newNoteReaction: Update<NoteReactionModel> = {
        noteId: noteReaction.noteId,
        workerId: noteReaction.workerId,
        reactionChar: noteReaction.reactionChar,
    };
    return newNoteReaction;
};

/**
 * {@link WorkerOptionInputParam - 説明}
 */
 export type NoteReactionOptionInputParam = ReplaceAnd<
    GetOptionObjectType<NoteReactionOptionParam>,
    {
        //
    }
>;

/**
 * {@link WorkerOptionParam - 説明}
 */
export type NoteReactionOptionParam = {
    worker?: WorkerType;
};

export type NoteReactionType = NoteReactionModel & NoteReactionOptionParam;
export type GetNoteReactionOptionParam = GetOptionParam<NoteReactionType, NoteReactionOptionParam, NoteReactionOptionInputParam>;




export type NoteReactionCLType = ReplaceAnd<
  NoteReactionType,
  {
    worker?: WorkerCLType;
  } & CommonCLType
>;

export const toNoteReactionCLType = (data?: NoteReactionType): NoteReactionCLType => {
  return {
    ...data,
    ...toCommonCLType(data),
    worker: data?.worker ? toWorkerCLType(data?.worker) : undefined,
    
  } as NoteReactionCLType;
};