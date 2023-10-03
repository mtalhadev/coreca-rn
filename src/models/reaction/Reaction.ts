import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker';
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { ID } from '../_others/ID';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';



export type ReactionModel = Partial<{
    messageId: ID;
    workerId: ID;
    reactionChar: string
}> &
    CommonModel;

export const initReaction = (reaction: Create<ReactionModel> | Update<ReactionModel>): Update<ReactionModel> => {
    const newReaction: Update<ReactionModel> = {
        messageId: reaction.messageId,
        workerId: reaction.workerId,
        reactionChar: reaction.reactionChar,
    };
    return newReaction;
};


/**
 * {@link WorkerOptionInputParam - 説明}
 */
 export type ReactionOptionInputParam = ReplaceAnd<
    GetOptionObjectType<ReactionOptionParam>,
    {
        //
    }
>;

/**
 * {@link WorkerOptionParam - 説明}
 */
export type ReactionOptionParam = {
    worker?: WorkerType;
};

export type ReactionType = ReactionModel & ReactionOptionParam;
export type GetReactionOptionParam = GetOptionParam<ReactionType, ReactionOptionParam, ReactionOptionInputParam>;


export type ReactionCLType = ReplaceAnd<
  ReactionType,
  {
    worker?: WorkerCLType;
  } & CommonCLType
>;

export const toReactionCLType = (data?: ReactionType): ReactionCLType => {
  return {
    ...data,
    ...toCommonCLType(data),
    worker: data?.worker ? toWorkerCLType(data?.worker) : undefined,
  } as ReactionCLType;
};
