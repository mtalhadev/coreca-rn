import { MessageCLType, MessageType, toMessageCLType } from '../message/Message';
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { ID } from '../_others/ID';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';



export type ThreadHeadModel = Partial<{
    threadId: ID;
    messageId: ID;
    lastMessageId: ID;
    messageCount: number;
    isExtra: boolean;
}> &
    CommonModel;

export const initThreadHead = (threadHead: Create<ThreadHeadModel> | Update<ThreadHeadModel>): Update<ThreadHeadModel> => {
    const newThreadHead: Update<ThreadHeadModel> = {
        threadId: threadHead.threadId,
        messageId: threadHead.messageId,
        lastMessageId: threadHead.lastMessageId,
        messageCount: threadHead.messageCount,
        isExtra: threadHead.isExtra,
    };
    return newThreadHead;
};

/**
 * {@link WorkerOptionInputParam - 説明}
 */
 export type ThreadHeadOptionInputParam = ReplaceAnd<
    GetOptionObjectType<ThreadHeadOptionParam>,
    {
        //
    }
>;

/**
 * {@link WorkerOptionParam - 説明}
 */
export type ThreadHeadOptionParam = {
    message?: MessageType;
    lastMessage?: MessageType;
};

export type ThreadHeadType = ThreadHeadModel & ThreadHeadOptionParam;
export type GetThreadHeadOptionParam = GetOptionParam<ThreadHeadType, ThreadHeadOptionParam, ThreadHeadOptionInputParam>;

export type ThreadHeadCLType = ReplaceAnd<
  ThreadHeadType,
  {
    message?: MessageCLType;
    lastMessage?: MessageCLType;
  } & CommonCLType
>;

export const toThreadHeadCLType = (data?: ThreadHeadType): ThreadHeadCLType => {
  return {
    ...data,
    ...toCommonCLType(data),
    message: data?.message ? toMessageCLType(data?.message) : undefined,
    lastMessage: data?.lastMessage ? toMessageCLType(data?.lastMessage) : undefined,
  } as ThreadHeadCLType;
};


