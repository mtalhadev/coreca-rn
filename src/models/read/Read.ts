import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker';
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { ID } from '../_others/ID';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';



export type ReadModel = Partial<{
    messageId: ID;
    workerId: ID;
}> &
    CommonModel;

export const initRead = (read: Create<ReadModel> | Update<ReadModel>): Update<ReadModel> => {
    const newRead: Update<ReadModel> = {
        messageId: read.messageId,
        workerId: read.workerId,
    };
    return newRead;
};


/**
 * {@link WorkerOptionInputParam - 説明}
 */
 export type ReadOptionInputParam = ReplaceAnd<
    GetOptionObjectType<ReadOptionParam>,
    {
        //
    }
>;

/**
 * {@link WorkerOptionParam - 説明}
 */
export type ReadOptionParam = {
    worker?: WorkerType;
};

export type ReadType = ReadModel & ReadOptionParam;
export type GetReadOptionParam = GetOptionParam<ReadType, ReadOptionParam, ReadOptionInputParam>;


export type ReadCLType = ReplaceAnd<
  ReadType,
  {
    worker?: WorkerCLType;
  } & CommonCLType
>;

export const toReadCLType = (data?: ReadType): ReadCLType => {
  return {
    ...data,
    ...toCommonCLType(data),
    worker: data?.worker ? toWorkerCLType(data?.worker) : undefined,
  } as ReadCLType;
};


