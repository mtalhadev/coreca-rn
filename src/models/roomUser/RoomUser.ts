import { CompanyType } from '../company/Company';
import { ProjectCLType, ProjectType } from '../project/Project';
import { RoomCLType, RoomType, toRoomCLType } from '../room/Room';
import { toWorkerCLType, WorkerCLType, WorkerOptionParam, WorkerType } from '../worker/Worker';
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { ID } from '../_others/ID';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';


export type RoomRoleEnumType = 'admin'| 'general'

export type RoomUserModel = Partial<{
    roomId: ID;
    roomRole: RoomRoleEnumType
    index: number;
    workerId: ID;
    unreadCount: number;
    projectId: ID;
}> &
    CommonModel;

export const initRoomUser = (roomUser: Create<RoomUserModel> | Update<RoomUserModel>): Update<RoomUserModel> => {
    const newRoomUser: Update<RoomUserModel> = {
        roomId: roomUser.roomId,
        roomRole: roomUser.roomRole,
        index: roomUser.index,
        workerId: roomUser.workerId,
        unreadCount: roomUser.unreadCount,
        projectId: roomUser.projectId
    };
    return newRoomUser;
};

/**
 * {@link WorkerOptionInputParam - 説明}
 */
 export type RoomUserOptionInputParam = ReplaceAnd<
    GetOptionObjectType<RoomUserOptionParam>,
    {
    }
>;

/**
 * {@link WorkerOptionParam - 説明}
 */
export type RoomUserOptionParam = {
  room?: RoomType;
  worker?: WorkerType;
  project?: ProjectType;
};

export type RoomUserType = RoomUserModel & RoomUserOptionParam;
export type GetRoomUserOptionParam = GetOptionParam<RoomUserType, RoomUserOptionParam, RoomUserOptionInputParam>;



export type RoomUserCLType = ReplaceAnd<
  RoomUserType,
  {
    worker?: WorkerCLType;
    room?: RoomCLType;
    project?: ProjectCLType;
  } & CommonCLType
>;

export const toRoomUserCLType = (data?: RoomUserType): RoomUserCLType => {
  return {
    ...data,
    ...toCommonCLType(data),
    worker: data?.worker ? toWorkerCLType(data?.worker) : undefined,
    room: data?.room ? toRoomCLType(data?.room) : undefined,
  } as RoomUserCLType;
};

