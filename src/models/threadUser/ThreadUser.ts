import { RoomCLType, RoomType, toRoomCLType } from '../room/Room';
import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker';
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { ID } from '../_others/ID';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';


export type ThreadUserModel = Partial<{
    threadId: ID;
    workerId: ID;
}> &
    CommonModel;

export const initThreadUser = (threadUser: Create<ThreadUserModel> | Update<ThreadUserModel>): Update<ThreadUserModel> => {
    const newThreadUser: Update<ThreadUserModel> = {
        threadId: threadUser.threadId,
        workerId: threadUser.workerId,
    };
    return newThreadUser;
};

/**
 * {@link WorkerOptionInputParam - 説明}
 */
 export type ThreadUserOptionInputParam = ReplaceAnd<
    GetOptionObjectType<ThreadUserOptionParam>,
    {
        //
    }
>;

/**
 * {@link WorkerOptionParam - 説明}
 */
export type ThreadUserOptionParam = {
};

export type ThreadUserType = ThreadUserModel & ThreadUserOptionParam;
export type GetThreadUserOptionParam = GetOptionParam<ThreadUserType, ThreadUserOptionParam, ThreadUserOptionInputParam>;



export type ThreadUserCLType = ReplaceAnd<
  ThreadUserType,
  {
  } & CommonCLType
>;

export const toThreadUserCLType = (data?: ThreadUserType): ThreadUserCLType => {
  return {
    ...data,
    ...toCommonCLType(data),
  } as ThreadUserCLType;
};

