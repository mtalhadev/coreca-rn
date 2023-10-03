import { MessageCLType, MessageType, toMessageCLType } from '../message/Message';
import { RoomCLType, RoomType, toRoomCLType } from '../room/Room';
import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker';
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { ID } from '../_others/ID';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';


export type ThreadLogModel = Partial<{
    threadLogId: ID;
    threadId: ID;
    workerId: ID;
    roomId: ID;
    messageId: ID;
}> &
    CommonModel;

export const initThreadLog = (threadLog: Create<ThreadLogModel> | Update<ThreadLogModel>): Update<ThreadLogModel> => {
    const newThreadLog: Update<ThreadLogModel> = {
        threadLogId: threadLog.threadLogId,
        threadId: threadLog.threadId,
        workerId: threadLog.workerId,
        roomId: threadLog.roomId,
        messageId: threadLog.messageId,
    };
    return newThreadLog;
};

/**
 * {@link WorkerOptionInputParam - 説明}
 */
 export type ThreadLogOptionInputParam = ReplaceAnd<
    GetOptionObjectType<ThreadLogOptionParam>,
    {
        //
    }
>;

/**
 * {@link WorkerOptionParam - 説明}
 */
export type ThreadLogOptionParam = {
    worker?: WorkerType;
    room?: RoomType;
    message?: MessageType;
};

export type ThreadLogType = ThreadLogModel & ThreadLogOptionParam;
export type GetThreadLogOptionParam = GetOptionParam<ThreadLogType, ThreadLogOptionParam, ThreadLogOptionInputParam>;



export type ThreadLogCLType = ReplaceAnd<
  ThreadLogType,
  {
    worker?: WorkerCLType;
    room?: RoomCLType;
    message?: MessageCLType;
  } & CommonCLType
>;

export const toThreadLogCLType = (data?: ThreadLogType): ThreadLogCLType => {
  return {
    ...data,
    ...toCommonCLType(data),
    worker: data?.worker ? toWorkerCLType(data?.worker) : undefined,
    room: data?.room ? toRoomCLType(data?.room) : undefined,
    message: data?.message ? toMessageCLType(data?.message) : undefined,
  } as ThreadLogCLType;
};

