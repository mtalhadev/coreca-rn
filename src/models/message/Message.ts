import { ReactionType } from '../reaction/Reaction';
import { ReactionListCLType, ReactionListType, toReactionListCLType } from '../reaction/ReactionListType';
import { ReadType } from '../read/Read';
import { ReadListCLType, ReadListType, toReadListCLType } from '../read/ReadListType';
import { RoomCLType, RoomType, toRoomCLType } from '../room/Room';
import { ThreadHeadCLType, ThreadHeadType, toThreadHeadCLType } from '../threadHead/ThreadHead';
import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker';
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { ID } from '../_others/ID';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';


export type MessageEnumType = 'text' | 'picture' | 'movie' | 'note'

export type MessageModel = Partial<{
    messageId: ID;
    roomId: ID;
    threadId: ID;
    isThreadStart: boolean;
    extraRoomId: ID;
    index: number;
    workerId: ID;
    message: string;
    messageType: MessageEnumType;
    replyId: ID;
    attachmentUrl: string;
    sAttachmentUrl: string;
    xsAttachmentUrl: string;
    readCount: number;
    updateCount: number;
}> &
    CommonModel;

export const initMessage = (message: Create<MessageModel> | Update<MessageModel>): Update<MessageModel> => {
    const newMessage: Update<MessageModel> = {
        messageId: message.messageId,
        roomId: message.roomId,
        threadId: message.threadId,
        isThreadStart: message.isThreadStart,
        extraRoomId: message.extraRoomId,
        index: message.index,
        workerId: message.workerId,
        message: message.message,
        messageType: message.messageType,
        replyId: message.replyId,
        attachmentUrl: message.attachmentUrl,
        sAttachmentUrl: message.sAttachmentUrl,
        xsAttachmentUrl: message.xsAttachmentUrl,
        readCount: message.readCount,
        updateCount: message.updateCount,
    };
    return newMessage;
};

/**
 * {@link WorkerOptionInputParam - 説明}
 */
 export type MessageOptionInputParam = ReplaceAnd<
    GetOptionObjectType<MessageOptionParam>,
    {
        //
    }
>;

/**
 * {@link WorkerOptionParam - 説明}
 */
export type MessageOptionParam = {
    room?: RoomType;
    worker?: WorkerType;
    reads?: ReadListType;
    reactions?: ReactionListType;
    threadHead?: ThreadHeadType;
    reply?: MessageType;
};

export type MessageType = MessageModel & MessageOptionParam;
export type GetMessageOptionParam = GetOptionParam<MessageType, MessageOptionParam, MessageOptionInputParam>;




export type MessageCLType = ReplaceAnd<
  MessageType,
  {
    room?: RoomCLType;
    worker?: WorkerCLType;
    reads?: ReadListCLType;
    reactions?: ReactionListCLType;
    threadHead?: ThreadHeadCLType;
    reply?: MessageCLType;
  } & CommonCLType
>;

export const toMessageCLType = (data?: MessageType): MessageCLType => {
  return {
    ...data,
    ...toCommonCLType(data),
    room: data?.room ? toRoomCLType(data?.room) : undefined,
    worker: data?.worker ? toWorkerCLType(data?.worker) : undefined,
    reads: data?.reads ? toReadListCLType(data?.reads) : undefined,
    reactions: data?.reactions ? toReactionListCLType(data?.reactions) : undefined,
    threadHead: data?.threadHead ? toThreadHeadCLType(data?.threadHead) : undefined,
    reply: data?.reply ? toMessageCLType(data?.reply) : undefined,
    
  } as MessageCLType;
};