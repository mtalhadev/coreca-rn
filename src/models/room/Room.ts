import { CompanyCLType, CompanyType, toCompanyCLType } from '../company/Company';
import { ConstructionCLType, ConstructionType, toConstructionCLType } from '../construction/Construction';
import { ContractCLType, ContractType, toContractCLType } from '../contract/Contract';
import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker';
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { ID } from '../_others/ID';
import { GetOptionObjectType, GetOptionParam, OptionType } from '../_others/Option';


export type RoomEnumType = 'project' | 'company' | 'contract' | 'construction'| 'custom'| 'onetoone'| 'owner'

export type RoomModel = Partial<{
    roomId: ID;
    roomType: RoomEnumType
    name: string;
    keyId: ID;
    lastMessage: string;
    rootThreadId: string,
    imageUrl: string;
    sImageUrl: string;
    xsImageUrl: string;
    imageColorHue: number;
}> &
    CommonModel;

export const initRoom = (room: Create<RoomModel> | Update<RoomModel>): Update<RoomModel> => {
    const newRoom: Update<RoomModel> = {
        roomId: room.roomId,
        roomType: room.roomType,
        name: room.name,
        keyId: room.keyId,
        lastMessage: room.lastMessage,
        rootThreadId: room.rootThreadId,
        imageUrl: room.imageUrl,
        sImageUrl: room.sImageUrl,
        xsImageUrl: room.xsImageUrl,
        imageColorHue: room.imageColorHue,
    };
    return newRoom;
};


/**
 * {@link WorkerOptionInputParam - 説明}
 */
 export type RoomOptionInputParam = ReplaceAnd<
    GetOptionObjectType<RoomOptionParam>,
    {
        //
    }
>;

/**
 * {@link WorkerOptionParam - 説明}
 */
export type RoomOptionParam = {
    companyA?: CompanyType
    companyB?: CompanyType
    contract?: ContractType
    construction?: ConstructionType
    worker?: WorkerType
};


export type RoomType = RoomModel & RoomOptionParam;
export type GetRoomOptionParam = GetOptionParam<RoomType, RoomOptionParam, RoomOptionInputParam>;




export type RoomCLType = ReplaceAnd<
  RoomType,
  {
    companyA?: CompanyCLType;
    companyB?: CompanyCLType;
    contract?: ContractCLType;
    construction?: ConstructionCLType;
    worker?: WorkerCLType;
  } & CommonCLType
>;

export const toRoomCLType = (data?: RoomType): RoomCLType => {
  return {
    ...data,
    ...toCommonCLType(data),
    companyA: data?.companyA ? toCompanyCLType(data?.companyA) : undefined,
    companyB: data?.companyB ? toCompanyCLType(data?.companyB) : undefined,
    contract: data?.contract ? toContractCLType(data?.contract) : undefined,
    construction: data?.construction ? toConstructionCLType(data?.construction) : undefined,
    worker: data?.worker ? toWorkerCLType(data?.worker) : undefined,
  } as RoomCLType;
};
