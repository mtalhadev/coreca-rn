import { uniq, uniqBy, uniqWith } from "lodash";
import { RoomRoleEnumType, RoomUserType } from "../../models/roomUser/RoomUser";
import { CustomResponse } from "../../models/_others/CustomResponse";
import {
    _createRoom,
    _getRoom,
    _getRoomListOfTargetWorker,
    _getRoomOfKeyId,
    _updateRoom
} from "../../services/room/RoomService";
import {
    _createRoomUser,
    _getOrderCompanyOfTargetProject,
    _getRoomUser,
    _getRoomUserListByProjectIds,
    _getRoomUserListOfTargetRoom,
    _getRoomUserListWithPagingOfTargetWorker,
    _getTargetWorkerOfTargetRoom,
    _deleteRoomUser,
    _updateRoomUser
} from "../../services/roomUser/RoomUserService";
import { getErrorMessage } from "../../services/_others/ErrorService";
import { _getWorker, _getWorkerListOfTargetCompany } from "../../services/worker/WorkerService";
import { toCompanyCLType } from "../../models/company/Company";
import { getUuidv4, getRandomName, getRandomImageColorHue } from "../../utils/Utils";
import { Create } from "../../models/_others/Common";
import { RoomModel, RoomType } from "../../models/room/Room";
import { __filterLeftWorker } from "./ChatBatchCase";
import { newCustomDate } from "../../models/_others/CustomDate";
import { WorkerType } from "../../models/worker/Worker";
import { RoomUserListType } from "../../models/roomUser/RoomUserListType";
import { getDistinctArrangedUsers } from "./ChatRoleCase"
import { _getSubConstructionListOfTargetContract } from "../../services/construction/ConstructionService";
import { WorkerUIType } from "../../components/organisms/chat/chatGroupMembers/SelectUsersForCustomGroup";

export type GetMembersListParam = {
    myWorkerId: string
    roomId?: string
}

export type GetMembersListResponse =
    | WorkerUIType[]
    | undefined

// Get members list for one-to-one chat

export const getMembersListForOnetooneChat = async(param: GetMembersListParam) : Promise<CustomResponse<GetMembersListResponse>> => {
    try {
        const { myWorkerId } = param

        const result = await _getRoomListOfTargetWorker({
            workerId: myWorkerId,
        })

        if (result.error) {
            throw {error: result.error}
        }
        console.log('_getRoomListOfTargetWorker: ', result.success?.items);
        
        let roomIds: string[] = result.success?.items?.map(room => {return room.roomId ?? 'no-id'}) ?? []
        roomIds = uniq(roomIds)
        console.log('roomIds: ',roomIds);
        
        let rtnList: WorkerUIType[] = []
        
        for (let i = 0; i < (roomIds.length ?? 0); i++) {
            const result2 = await _getRoomUserListOfTargetRoom({
                roomId: roomIds[i],
            });
            if (result2.error) {
                throw {error: result2.error}
            }
            const roomUsers: RoomUserType[] = result2.success?.items ?? [];
            // console.log('roomUsers: ', roomUsers);
            
            for (let j = 0; j < (roomUsers.length ?? 0); j++) {
                const workerUIResult = await toWorkerUIType(roomUsers[j]);
                if (workerUIResult.error) {
                    throw {error: workerUIResult.error}
                }
                const workerUI = workerUIResult.success ?? {} as WorkerUIType
                rtnList.push(workerUI);
            }
        }
        rtnList = uniqWith(rtnList, (itemA, itemB) => itemA.workerId === itemB.workerId);
        rtnList = rtnList.filter(worker => worker.workerId && worker.workerId != myWorkerId);

        let talked: string[] = [];
        for (let n = 0; n < (rtnList.length ?? 0); n++) {
            const worker = rtnList[n];
            if(worker.workerId){
                const resultGetRoom = await _getRoomOfKeyId({
                    keyId: worker.workerId
                });
                if (resultGetRoom.success?.roomId && resultGetRoom.success?.roomType === 'onetoone') {
                    console.log('Room exists with RoomId: ', resultGetRoom.success?.roomId);
                    talked.push(worker.workerId);
                }    
            }
        }
        if(talked.length>0)
            rtnList = rtnList.filter(worker => worker.workerId && !talked.includes(worker.workerId));


        return Promise.resolve( {
            success: rtnList
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

// Get members list for group chat

export const getMembersListForCustomGroup = async(param: GetMembersListParam) : Promise<CustomResponse<GetMembersListResponse>> => {
    try {
        const { myWorkerId, roomId } = param;

        const result = await _getRoomListOfTargetWorker({
            workerId: myWorkerId,
        })

        if (result.error) {
            throw {error: result.error}
        }
        console.log('_getRoomListOfTargetWorker: ', result.success?.items);
        
        let roomIds: string[] = result.success?.items?.map(room => {return room.roomId ?? 'no-id'}) ?? []
        roomIds = uniq(roomIds)
        console.log('roomIds: ',roomIds);
        
        let membersList: RoomUserType[] = []
        
        for (let i = 0; i < (roomIds.length ?? 0); i++) {
            const result2 = await _getRoomUserListOfTargetRoom({
                roomId: roomIds[i],
            });
            if (result2.error) {
                throw {error: result2.error}
            }
            const roomUsers: RoomUserType[] = result2.success?.items ?? [];
            console.log('roomUsers: ', roomUsers);
            for (let j = 0; j < roomUsers.length; j++) {
                const roomUser = roomUsers[j];
                if(membersList.findIndex(user => user.workerId === roomUser.workerId) < 0){
                    membersList.push(roomUser);
                }
            }
        }
        console.log('membersList: ',membersList);

        membersList = uniqWith(membersList, (itemA, itemB) => itemA.workerId === itemB.workerId);
        membersList = membersList.filter(worker => worker.workerId && worker.workerId != myWorkerId);

        if(roomId) {
            const resultGetRoomUserList = await _getRoomUserListOfTargetRoom({
                roomId: roomId,
                options: {
                    room: true
                }
            });
            if (resultGetRoomUserList.error) {
                throw {error: resultGetRoomUserList.error}
            }
            const roomUsersList = resultGetRoomUserList.success?.items ?? [];
            if(roomUsersList.length){
                const roomUserIds = roomUsersList.map(user => user.workerId);
                membersList = membersList.filter(worker => worker.workerId && !roomUserIds.includes(worker.workerId));
            }
        }
        
        const rtnList: WorkerUIType[] = [];
        for (let k = 0; k < (membersList.length ?? 0); k++) {
            const workerUIResult = await toWorkerUIType(membersList[k]);
            if (workerUIResult.error) {
                throw {error: workerUIResult.error}
            }
            const workerUI = workerUIResult.success ?? {} as WorkerUIType
            workerUI.roomRole = undefined
            rtnList.push(workerUI);
        }

        return Promise.resolve({
            success: rtnList
        })
        
    } catch (error) {
        return getErrorMessage(error)
    }
}
const toWorkerUIType = async (roomUser: RoomUserType): Promise<CustomResponse<WorkerUIType>> => {
    const workerId: string = roomUser.workerId ?? 'no-id';

    try {
        const result = await _getWorker({
            workerId: workerId,
            options: {
                company: true
            }
        })
        if (result.error) {
            throw {error: result.error}
        }
        const worker = result.success;
        // console.log({ worker });
        
        const rtnUI: WorkerUIType = {
            workerId: worker?.workerId,
            imageUrl: worker?.imageUrl,
            xsImageUrl: worker?.xsImageUrl,
            sImageUrl: worker?.sImageUrl,
            imageColorHue: worker?.imageColorHue,
            name: worker?.name,
            company: worker?.company,
            roomRole: roomUser.roomRole ?? 'general',
        }
        // console.log('comapny: ', rtnUI.company?.name);
        
        return Promise.resolve({
            success: rtnUI,
        })    
    } catch (error) {
        return getErrorMessage(error)
    }
}


export type CreateOnetooneRoomResponse = {
    roomId: string
    rootThreadId: string
    keyId?: string
    roomUserId1?: string
    roomUserId2?: string
} | undefined

// Create One-to-one Chat 

export const createOntooneRoom = async(workerId: string, myWorkerId: string): Promise<CustomResponse<CreateOnetooneRoomResponse>> => {
    try {
        const params: Create<RoomModel> = {
            roomType: 'onetoone',
            name: '',
            keyId: workerId,
            rootThreadId: getUuidv4(),
        }
        const resultCreateRoom = await _createRoom(params);
        if (resultCreateRoom.error) {
            throw {error: resultCreateRoom.error}
        }
        const roomId = resultCreateRoom.success;

        const resultCreateRoomUser1 = await _createRoomUser({
            roomId,
            roomRole: 'admin',
            index: 0,
            workerId: myWorkerId,
            unreadCount: 0,
            projectId: '',
        })
        if (resultCreateRoomUser1.error) {
            throw {error: resultCreateRoomUser1.error}
        }

        const resultCreateRoomUser2 = await _createRoomUser({
            roomId,
            roomRole: 'admin',
            index: 1,
            workerId: workerId,
            unreadCount: 0,
            projectId: '',
        })
        if (resultCreateRoomUser2.error) {
            throw {error: resultCreateRoomUser2.error}
        }
        return Promise.resolve({
            success: {
                roomId: roomId ?? 'no-id',
                rootThreadId: params.rootThreadId  ?? 'no-id',
                keyId: workerId ?? 'no-id',
                roomUserId1: resultCreateRoomUser1.success  ?? 'no-id',
                roomUserId2: resultCreateRoomUser2.success  ?? 'no-id'
            }
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export type CreateCustomGroupResponse = {
    roomId: string
    rootThreadId: string
    keyId?: string
    name?: string
} | undefined

// Create One-to-one Chat 

export const createCustomGroup = async(workerIds: string[], myWorkerId: string): Promise<CustomResponse<CreateCustomGroupResponse>> => {
    try {
        const params: Create<RoomModel> = {
            roomType: 'custom',
            name: getRandomName('グループ', 5),
            keyId: myWorkerId,
            rootThreadId: getUuidv4(),
            imageColorHue: getRandomImageColorHue() 
        }
        const resultCreateRoom = await _createRoom(params);
        if (resultCreateRoom.error) {
            throw {error: resultCreateRoom.error}
        }
        const roomId = resultCreateRoom.success;

        const resultCreateRoomUser1 = await _createRoomUser({
            roomId,
            roomRole: 'admin',
            index: 0,
            workerId: myWorkerId,
            unreadCount: 0,
            projectId: '',
        })
        if (resultCreateRoomUser1.error) {
            throw {error: resultCreateRoomUser1.error}
        }
        for (let i = 0; i < workerIds.length; i++) {
            const workerId = workerIds[i];
            const resultCreateRoomUser2 = await _createRoomUser({
                roomId,
                roomRole: 'general',
                index: i+1,
                workerId: workerId,
                unreadCount: 0,
                projectId: '',
            })
            if (resultCreateRoomUser2.error) {
                throw {error: resultCreateRoomUser2.error}
            }    
        }
        return Promise.resolve({
            success: {
                roomId: roomId ?? 'no-id',
                rootThreadId: params.rootThreadId  ?? 'no-id',
                keyId: params.keyId ?? 'no-id',
                name: params.name ?? ""
            }
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export const updateGroupMembers = async(workerIds: string[], roomId: string): Promise<CustomResponse> => {
    try {
        const resultGetRoomUserList = await _getRoomUserListOfTargetRoom({
            roomId: roomId,
        });
        if (resultGetRoomUserList.error) {
            throw {error: resultGetRoomUserList.error}
        }
        const roomUsersList = resultGetRoomUserList.success?.items ?? [];
        const startIndex = roomUsersList.length;
        const projectId = roomUsersList.length > 0 ? roomUsersList[0].projectId : undefined

        for (let i = 0; i < workerIds.length; i++) {
            const workerId = workerIds[i];
            const resultCreateRoomUser = await _createRoomUser({
                roomId,
                roomRole: 'general',
                index: i+startIndex,
                workerId: workerId,
                unreadCount: 0,
                projectId: projectId,
            })
            if (resultCreateRoomUser.error) {
                throw {error: resultCreateRoomUser.error}
            }    
        }
        return Promise.resolve({
            success: true
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const updateGroupName = async(roomId: string, groupName: string): Promise<CustomResponse> => {
    try {
        const resultUpdateRoom = await _updateRoom({
            roomId: roomId,
            name: groupName
        });
        if (resultUpdateRoom.error) {
            throw {error: resultUpdateRoom.error}
        }
        return Promise.resolve({
            success: true
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export const removeGroupMember = async(roomId: string, workerId: string): Promise<CustomResponse> => {
    try {
        const resultDeleteRoomUser = await _deleteRoomUser({
            roomId,
            workerId
        });
        if (resultDeleteRoomUser.error) {
            throw {error: resultDeleteRoomUser.error}
        }
        return Promise.resolve({
            success: true
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type getMemberListOfPCCOCParam = {
    myCompanyId: string
    myWorkerId: string
    roomId: string
}

export type GetMembersListOfPCCOCResponse =
    | WorkerType[]
    | undefined

export const getMemberListOfPCCOC = async(param: getMemberListOfPCCOCParam): Promise<CustomResponse<GetMembersListOfPCCOCResponse>> => {
    try {
        const { myCompanyId, myWorkerId, roomId } = param

        const roomResult = await _getRoom({roomId, options: {contract: true, construction: {contract: true}}})
        if (roomResult.error) {
            throw {error: roomResult.error}
        }

        const room = roomResult.success
        if (room?.roomType == 'project') {
            //上位
            if (room.contract?.receiveCompanyId == myCompanyId) {
                const resultList = await getAllMemberList({myCompanyId, roomId})
                if (resultList.error) {
                    throw {error: resultList.error}
                }

                const resultConstructions = await _getSubConstructionListOfTargetContract({contractId: room.keyId ?? 'no-id', options:{subContract: {receiveCompany: true}}})
                if (resultConstructions.error) {
                    throw {error: resultConstructions.error}
                }

                for (let i = 0; i < (resultConstructions.success?.items?.length ?? 0); i++) {
                    let item = resultConstructions.success?.items ? resultConstructions.success?.items[i] : {}
                    if (item.subContract?.receiveCompany != undefined) {
                        const resultList2 = await getOverManagerMemberList({myCompanyId: item.subContract.receiveCompanyId ?? 'no-id', roomId})
                        if (resultList2.error) {
                            throw {error: resultList2.error}
                        }

                        resultList.success = [...(resultList.success ?? []), ...(resultList2.success ?? []) ]
                    }
                }

                return Promise.resolve( {
                    success: resultList.success
                })
            }
            //下位
            else {
                return Promise.resolve( {
                    success: []
                })
            }
        }
        else if (room?.roomType == 'construction') {
            //上位
            if (room.construction?.contract?.receiveCompanyId == myCompanyId) {
                const resultList = await getDistinctArrangedUsers({constructionId: room.keyId, myCompanyId, myWorkerId})
                if (resultList.error) {
                    throw {error: resultList.error}
                }
                const resultList2 = await getOverManagerMemberList({myCompanyId: myCompanyId, roomId})
                if (resultList2.error) {
                    throw {error: resultList2.error}
                }

                let targetWorkerList = [...resultList.success?.workers ?? [], ...resultList2.success ?? []]
                targetWorkerList = uniqBy(targetWorkerList, 'workerId')


                const resultExistUsers = await _getRoomUserListOfTargetRoom({roomId: room.roomId ?? 'no-id', options: {worker: true}})
                if (resultExistUsers.error) {
                    throw {error: resultExistUsers.error}
                }

                const workers = targetWorkerList.filter(worker => {
                    return !checkSameWorker(worker.workerId ?? 'no-id', resultExistUsers.success?.items ?? [])
                }) ?? []

                // console.log(workers.length)
                return Promise.resolve( {
                    success: workers
                })
            }
            //下位
            else {
                return Promise.resolve( {
                    success: []
                })
            }
        }
        else if (room?.roomType == 'contract') {
            //上位
            if (room.contract?.orderCompanyId == myCompanyId) {
                const resultList = await getAllMemberList({myCompanyId, roomId})
                if (resultList.error) {
                    throw {error: resultList.error}
                }
                return Promise.resolve( {
                    success: resultList.success
                })
            }
            //下位
            else {
                const resultList = await getOverManagerMemberList({myCompanyId, roomId})
                if (resultList.error) {
                    throw {error: resultList.error}
                }
                return Promise.resolve( {
                    success: resultList.success
                })
            }
        }
        else if (room?.roomType == 'owner') {
            //上位
            if (room.construction?.contract?.orderCompanyId == myCompanyId) {
                const resultList = await getAllMemberList({myCompanyId, roomId})
                if (resultList.error) {
                    throw {error: resultList.error}
                }
                return Promise.resolve( {
                    success: resultList.success
                })
            }
            //下位
            else {
                const resultList = await getOverManagerMemberList({myCompanyId, roomId})
                if (resultList.error) {
                    throw {error: resultList.error}
                }
                return Promise.resolve( {
                    success: resultList.success
                })
            }
        }
        else if (room?.roomType == 'company') {
            //フラット
            const resultList = await getOverManagerMemberList({myCompanyId, roomId})
            if (resultList.error) {
                throw {error: resultList.error}
            }
            return Promise.resolve( {
                success: resultList.success
            })
        }
        
        return Promise.resolve( {
            success: []
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type getOverManagerMemberListParam = {
    myCompanyId: string
    roomId: string
}

export type getOverManagerMemberListtResponse =
    | WorkerType[]
    | undefined

export const getOverManagerMemberList = async(param: getOverManagerMemberListParam): Promise<CustomResponse<getOverManagerMemberListtResponse>> => {
    try {
        const { myCompanyId, roomId } = param

        const roomUserListResult = await _getRoomUserListOfTargetRoom({roomId, options: {worker: true}})
        if (roomUserListResult.error) {
            throw {error: roomUserListResult.error}
        }
        const existUsers = roomUserListResult.success?.items?.filter(user => user.worker?.companyId == myCompanyId) ?? []

        const resultWorkers = await _getWorkerListOfTargetCompany({companyId: myCompanyId, options:{ company: true}})
        if (resultWorkers.error) {
            throw {error: resultWorkers.error}
        }

        let workers = resultWorkers.success?.items?.filter(worker => __filterLeftWorker(worker, newCustomDate())).filter(worker => worker.companyRole == 'owner' || worker.companyRole == 'manager') ?? []
        workers = workers.filter(worker => !checkSameWorker(worker.workerId ?? 'no-id', existUsers)) ?? []

        return Promise.resolve( {
            success: workers
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type getAllMemberListParam = {
    myCompanyId: string
    roomId: string
}

export type getAllMemberListResponse =
    | WorkerType[]
    | undefined

export const getAllMemberList = async(param: getAllMemberListParam): Promise<CustomResponse<getAllMemberListResponse>> => {
    try {
        const { myCompanyId, roomId } = param

        const roomUserListResult = await _getRoomUserListOfTargetRoom({roomId, options: {worker: true}})
        if (roomUserListResult.error) {
            throw {error: roomUserListResult.error}
        }
        const existUsers = roomUserListResult.success?.items?.filter(user => user.worker?.companyId == myCompanyId) ?? []

        const resultWorkers = await _getWorkerListOfTargetCompany({companyId: myCompanyId, options:{ company: true}})
        if (resultWorkers.error) {
            throw {error: resultWorkers.error}
        }

        let workers = resultWorkers.success?.items?.filter(worker => __filterLeftWorker(worker, newCustomDate())) ?? []
        workers = workers.filter(worker => !checkSameWorker(worker.workerId ?? 'no-id', existUsers)) ?? []

        return Promise.resolve( {
            success: workers
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

const checkSameWorker = (workerId: string, existUsers: RoomUserType[]): boolean => {
    let hitFlag = false
    existUsers?.forEach(user => {
        if (user.worker?.workerId == workerId){
            hitFlag = true
        }
    })
    return hitFlag
}

export type getRoomInfoResponse = {
    room: RoomType,
    roomUsers: RoomUserType[]
    roomRole: RoomRoleEnumType
}

export const getRoomInfo = async(roomId: string, myWorkerId: string): Promise<CustomResponse<getRoomInfoResponse>> => {
    try {
        const result = await _getRoom({roomId})
        if (result.error) {
            throw {error: result.error}
        }

        const resultRoomUsers = await _getRoomUserListOfTargetRoom({roomId, options: {worker: {company: true}}})
        if (resultRoomUsers.error) {
            throw {error: resultRoomUsers.error}
        }

        const myRoomUser = resultRoomUsers.success?.items?.find(item=> item.workerId == myWorkerId)

        return Promise.resolve( {
            success: {
                room: result.success ?? {},
                roomUsers: resultRoomUsers.success?.items ?? [],
                roomRole: myRoomUser?.roomRole ?? 'general',
            }
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type getMemberListOfEditAdminParam = {
    myCompanyId: string
    myWorkerId: string
    roomId: string
}

export type GetMembersListOfEditAdminResponse =
    | RoomUserType[]
    | undefined

export const getMemberListOfEditAdmin = async(param: getMemberListOfEditAdminParam): Promise<CustomResponse<GetMembersListOfEditAdminResponse>> => {
    try {
        const { myCompanyId, myWorkerId, roomId } = param

        const roomResult = await _getRoom({roomId, options: {contract: true, construction: {contract: true}}})
        if (roomResult.error) {
            throw {error: roomResult.error}
        }

        const resultRoomUsers = await _getRoomUserListOfTargetRoom({roomId, options: {worker: {company: true}}})
        if (resultRoomUsers.error) {
            throw {error: resultRoomUsers.error}
        }

        const room = roomResult.success
        const roomUsers = resultRoomUsers.success?.items ?? []

        if (room?.roomType == 'project') {
            return Promise.resolve({
                success: roomUsers,
            })
        }
        else if (room?.roomType == 'construction') {
            return Promise.resolve( {
                success: roomUsers,
            })
        }
        else if (room?.roomType == 'contract') {
            //上位
            if (room.contract?.orderCompanyId == myCompanyId) {
                const filteredUsers = roomUsers.filter(user => user.worker?.companyId == myCompanyId)
                return Promise.resolve( {
                    success: filteredUsers
                })
            }
            //下位
            else {
                const filteredUsers = roomUsers.filter(user => user.worker?.companyId == myCompanyId)
                return Promise.resolve( {
                    success: filteredUsers
                })
            }
        }
        else if (room?.roomType == 'owner') {
            //上位
            if (room.construction?.contract?.orderCompanyId == myCompanyId) {
                const filteredUsers = roomUsers.filter(user => user.worker?.companyId == myCompanyId)
                return Promise.resolve( {
                    success: filteredUsers
                })
            }
            //下位
            else {
                const resultList = await getOverManagerMemberList({myCompanyId, roomId})
                const filteredUsers = roomUsers.filter(user => user.worker?.companyId == myCompanyId)
                return Promise.resolve( {
                    success: filteredUsers
                })
            }
        }
        else if (room?.roomType == 'company') {
            //フラット
            const filteredUsers = roomUsers.filter(user => user.worker?.companyId == myCompanyId)
            return Promise.resolve( {
                success: filteredUsers
            })
        }
        else if (room?.roomType == 'custom') {
            return Promise.resolve( {
                success: roomUsers
            })
        }

        return Promise.resolve( {
            success: []
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const updateChatAdminMembers = async(allUsers: WorkerUIType[], roomId: string): Promise<CustomResponse> => {
    try {
        
        for (let i = 0; i < allUsers.length; i++) {
            const workerUI = allUsers[i];

            const resultUpdateRoomUser = await _updateRoomUser({
                roomId,
                workerId: workerUI.workerId,
                roomRole: workerUI.roomRole,
            })
            if (resultUpdateRoomUser.error) {
                throw {error: resultUpdateRoomUser.error}
            }    
        }
        return Promise.resolve({
            success: true
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}


export type CanLeaveFromRoomParam = {
    myCompanyId: string
    myWorkerId: string
    roomId: string
}

export type CanLeaveFromRoomResponse = {
    can: boolean,
    errorMessage: string,
}
    
export const canLeaveFromRoom = async(param: CanLeaveFromRoomParam): Promise<CustomResponse<CanLeaveFromRoomResponse>> => {
    try {
        const { myCompanyId, myWorkerId, roomId } = param

        const roomResult = await _getRoom({roomId, options: {contract: true, construction: {contract: true}}})
        if (roomResult.error) {
            throw {error: roomResult.error}
        }

        const resultRoomUsers = await _getRoomUserListOfTargetRoom({roomId, options: {worker: {company: true}}})
        if (resultRoomUsers.error) {
            throw {error: resultRoomUsers.error}
        }

        const room = roomResult.success
        const roomUsers = resultRoomUsers.success?.items ?? []
        const myRoomUser = roomUsers.find(user => user.workerId == myWorkerId) ?? {}

        // console.log(room)

        let rtnCan: boolean = false
        let rtnMessage: string = ''

        if (room?.roomType == 'project') {
            if (room.contract?.receiveCompanyId == myCompanyId) {
                [rtnCan, rtnMessage] = canLeaveLocal(roomUsers, myRoomUser, myCompanyId)
            }
            else {
                rtnCan = true
            }
        }
        else if (room?.roomType == 'construction') {
            if (room.construction?.contract?.receiveCompanyId == myCompanyId) {
                [rtnCan, rtnMessage] = canLeaveLocal(roomUsers, myRoomUser, myCompanyId)
            }
            else {
                rtnCan = true
            }
        }
        else if (room?.roomType == 'contract') {
            //上位
            if (room.contract?.orderCompanyId == myCompanyId) {
                [rtnCan, rtnMessage] = canLeaveLocal(roomUsers, myRoomUser, myCompanyId)
            }
            //下位
            else {
                [rtnCan, rtnMessage] = canLeaveLocal(roomUsers, myRoomUser, myCompanyId)
            }
        }
        else if (room?.roomType == 'owner') {
            //上位
            if (room.construction?.contract?.orderCompanyId == myCompanyId) {
                [rtnCan, rtnMessage] = canLeaveLocal(roomUsers, myRoomUser, myCompanyId)
            }
            //下位
            else {
                [rtnCan, rtnMessage] = canLeaveLocal(roomUsers, myRoomUser, myCompanyId)
            }
        }
        else if (room?.roomType == 'company') {
            //フラット
            [rtnCan, rtnMessage] = canLeaveLocal(roomUsers, myRoomUser, myCompanyId)
        }
        else if (room?.roomType == 'onetoone') {
            rtnMessage = '１対１のルームからは退出できません'
        }
        else if (room?.roomType == 'custom') {
            const admins = roomUsers.filter(user => (user.roomRole == 'admin'))
            if (admins.length >= 2) {
                rtnCan = true
            }
            else if (admins.length >= 1 && myRoomUser?.roomRole != 'admin') {
                rtnCan = true
            }
            else {
                rtnMessage = '退出するには、管理者が一人以上残っている必要があります。'
            }
                    
        }
        

        return Promise.resolve({
            success: {
                can: rtnCan,
                errorMessage: rtnMessage,
            }
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

const canLeaveLocal = (roomUsers: RoomUserType[], myRoomUser: RoomUserType, myCompanyId: string): [boolean, string] => {
    let rtnCan: boolean = false
    let rtnMessage: string = ''

    const adminsMyCompany = roomUsers.filter(user => (user.worker?.companyId == myCompanyId && user.roomRole == 'admin'))
    if (adminsMyCompany.length >= 2) {
        rtnCan = true
    }
    else if (adminsMyCompany.length >= 1 && myRoomUser?.roomRole != 'admin') {
        rtnCan = true
    }
    else {
        rtnMessage = '退出するには、自社の管理者が一人以上残っている必要があります。'
    }

    return [rtnCan, rtnMessage]
}