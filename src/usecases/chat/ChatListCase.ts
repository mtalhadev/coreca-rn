import { sortBy, uniq } from "lodash";
import { RoomListCLType } from "../../models/room/RoomListType";
import { RoomUserCLType, RoomUserType } from "../../models/roomUser/RoomUser";
import { RoomUserListCLType, toRoomUserListCLType, toRoomUserListType } from "../../models/roomUser/RoomUserListType";
import { ThreadLogType } from "../../models/threadLog/ThreadLog";
import { WorkerType } from "../../models/worker/Worker";
import { newCustomDate, toCustomDateFromTotalSeconds } from "../../models/_others/CustomDate";
import { CustomResponse } from "../../models/_others/CustomResponse";
import { ProjectConstructionUIType, RoomUserUIType } from "../../components/organisms/chat/chatList/ChatProjectList";
import { _getRoom } from "../../services/room/RoomService";
import { _getOrderCompanyOfTargetProject, _getRoomUserListByProjectIds, _getRoomUserListWithPagingOfTargetWorker, _getTargetWorkerOfTargetRoom } from "../../services/roomUser/RoomUserService";
import { _getThreadLogListOfTargetWorker } from "../../services/threadLog/ThreadLogService";
import { getErrorMessage } from "../../services/_others/ErrorService";
import { ThreadLogUIType } from "../../components/organisms/chat/chatList/ThreadList";

export type GetProjectConstructionParam = {
    myWorkerId: string
    myCompanyId: string
    beforeSecond: number
}

export type GetProjectConstructionResponse = {
    projectConstructionList: ProjectConstructionUIType[]
    lastRoomUser?: RoomUserType
}

export const getProjectConstractionList = async(param: GetProjectConstructionParam) : Promise<CustomResponse<GetProjectConstructionResponse>> => {
    try {
        const { myWorkerId, myCompanyId, beforeSecond } = param

        const result = await _getRoomUserListWithPagingOfTargetWorker({
            workerId: myWorkerId,
            isProject: true,
            beforeSecond: beforeSecond,
            limit: 100,
        })

        if (result.error) {
            throw {error: result.error}
        }

        let projectIds: string[] = result.success?.items?.map(roomUser => {return roomUser.projectId ?? 'no-id'}) ?? []
        projectIds = uniq(projectIds)
        let rtnLastRoomUser 
        if (result.success?.items) {
            rtnLastRoomUser = result.success?.items[result.success.items.length-1]
        }
        else {
            rtnLastRoomUser = undefined
        }

        const result2 = await _getRoomUserListByProjectIds({
            projectIds, 
            workerId: myWorkerId,
            options: {
                project: true,
                room: {
                    contract: {
                        receiveCompany: true,
                    },
                    construction: {contract: {receiveCompany: true}},
                }
            }})


        const rtnList: ProjectConstructionUIType[] = []
        let prevProjectId: string = ''

        for (let i = 0; i < projectIds.length ; i++) {
            const array = result2.success?.items?.filter(item => item.projectId == projectIds[i]) ?? []
            const projectConstractionResult = await toProjectConstructionUIType(array[0], myCompanyId)
            if (projectConstractionResult.error) {
                throw {error: projectConstractionResult.error}
            }

            const tempProjectConstruction = projectConstractionResult.success ?? {} as ProjectConstructionUIType

            array.forEach(roomUser => {
                const rtnAdd = toRoomUserUIType(roomUser, myCompanyId)
                if (rtnAdd[0] == true) {
                    tempProjectConstruction.roomUsers.push(rtnAdd[1])
                }
            })

            const sortedArray = sortBy(tempProjectConstruction.roomUsers, (item) => item.updatedAt?.totalSeconds)
            console.log('sortedArray: ',sortedArray);
            
            tempProjectConstruction.lastMessage = sortedArray[sortedArray.length-1].lastMessage;

            rtnList.push(tempProjectConstruction)
        }

        return Promise.resolve( {
            success: {
                projectConstructionList: rtnList,
                lastRoomUser: rtnLastRoomUser,
            }
        })


    } catch (error) {
        return getErrorMessage(error)
    }

}
const toProjectConstructionUIType = async(roomUser: RoomUserType, myCompanyId: string): Promise<CustomResponse<ProjectConstructionUIType>> => {
    try {
        const rtnUI: ProjectConstructionUIType = {
            projectId: roomUser.projectId ?? 'no-id',
            name: roomUser.project?.name ?? 'no-name',
            project: roomUser.project ?? {},
            roomUsers: [],
            companyName: ''
        }
        
        const companyResult = await getOrderCompanyName(roomUser.projectId ?? 'no-id', myCompanyId)
        if (companyResult.error) {
            throw {error: companyResult.error}
        }
        rtnUI.companyName = companyResult.success ?? 'no-name'
        
        return Promise.resolve({
            success: rtnUI,
        })
    } catch (error) {
        return getErrorMessage(error)
    }

}

const toRoomUserUIType = (roomUser: RoomUserType, myCompanyId: string): [boolean, RoomUserUIType] => {
    let rtnBool = true
    const rtnUI: RoomUserUIType = {
        roomId: roomUser.roomId ?? 'no-id',
        rootThreadId: roomUser.room?.rootThreadId ?? 'no-id',
        roomType: roomUser.room?.roomType ?? 'construction',
        lastMessage: roomUser.room?.lastMessage,
        unreadCount: roomUser.unreadCount,
        updatedAt: toCustomDateFromTotalSeconds(roomUser.updatedAt ?? 0),

    }

    if (roomUser.room?.roomType == 'owner') {
        rtnUI.name = roomUser.room.construction?.name + ' ' + roomUser.room.construction?.contract?.receiveCompany?.name
    }
    if (roomUser.room?.roomType == 'construction') {
        rtnUI.name = roomUser.room.construction?.name + ' 自社'
    }
    if (roomUser.room?.roomType == 'project') {
        rtnUI.name = roomUser.project?.name
    }
    if (roomUser.room?.roomType == 'contract') {
        rtnUI.name = roomUser.room?.name
        rtnUI.companyName = roomUser.room.contract?.receiveCompany?.name
        if (roomUser.room.contract?.receiveCompanyId == myCompanyId) {
            rtnBool = false
        }
    }

    return [rtnBool, rtnUI]
}


export type GetDmListParam = {
    myWorkerId: string
    myCompanyId: string
    beforeSecond: number
}

export type GetDMListResponse =
    | RoomUserUIType[]
    | undefined

export const getDmList = async(param: GetDmListParam) : Promise<CustomResponse<GetDMListResponse>> => {
    try {
        const { myWorkerId, myCompanyId, beforeSecond } = param

        const result = await _getRoomUserListWithPagingOfTargetWorker({
            workerId: myWorkerId,
            isProject: false,
            beforeSecond: beforeSecond,
            limit: 100,
            options: {
                room: {companyA: true, companyB: true},
            }
        })

        if (result.error) {
            throw {error: result.error}
        }
        //console.log('DM List: ', result.success?.items);
        const rtnList: RoomUserUIType[] = []
        for (let i = 0; i < (result.success?.items ? result.success.items.length : 0) ; i++){
            const roomUser: RoomUserType = result.success?.items ? result.success?.items[i]: {}
            const tempUI: RoomUserUIType = {
                roomId: roomUser.roomId ?? 'no-id',
                rootThreadId: roomUser.room?.rootThreadId ?? 'no-id',
                roomType: roomUser.room?.roomType ?? 'company',
                lastMessage: roomUser.room?.lastMessage,
                unreadCount: roomUser.unreadCount,
                updatedAt: toCustomDateFromTotalSeconds(roomUser.updatedAt ?? 0),
            }

            if (roomUser.room?.roomType == 'company') {
                const companyResult = await getTargetCompanyName(roomUser.roomId ?? 'no-id', myCompanyId)
                if (companyResult.error) {
                    throw {error: companyResult.error}
                }
                tempUI.name = companyResult.success
                if (roomUser.room.companyA?.companyId != myCompanyId) {
                    tempUI.company = roomUser.room.companyA
                }
                else {
                    tempUI.company = roomUser.room.companyB
                }
            }
            if (roomUser.room?.roomType == 'onetoone') {
                const userResult = await getTargetUser(roomUser.roomId ?? 'no-id', myWorkerId)
                if (userResult.error) {
                    throw {error: userResult.error}
                }
                tempUI.name = userResult.success ? userResult.success.name : 'no-name'
                tempUI.worker = userResult.success 
            }
            if (roomUser.room?.roomType == 'custom') {
                tempUI.name = roomUser.room?.name
                tempUI.room = roomUser.room
            }
            rtnList.push(tempUI)

        }

        
        return Promise.resolve( {
            success: rtnList
        })


    } catch (error) {
        return getErrorMessage(error)
    }

}

const getOrderCompanyName = async(projectId: string, myCompanyId: string): Promise<CustomResponse<string>> => {
    try {
        const result = await _getOrderCompanyOfTargetProject({projectId, myCompanyId})
        if (result.error) {
            throw {error: result.error}
        }

        return Promise.resolve( {
            success: result.success?.name ?? 'オーナー'
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

const getTargetCompanyName = async(roomId: string, myCompanyId: string): Promise<CustomResponse<string>> => {
    try {
        const result = await _getRoom({roomId, options: {companyA: true, companyB: true}})
        if (result.error) {
            throw {error: result.error}
        }

        if (result.success?.companyA?.companyId != myCompanyId) {
            return Promise.resolve( {
                success: result.success?.companyA?.name ?? 'no-name'
            })
        }
        else {
            return Promise.resolve( {
                success: result.success?.companyB?.name ?? 'no-name'
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

const getTargetUser = async(roomId: string, myWorkerId: string): Promise<CustomResponse<WorkerType>> => {
    try {
        const result = await _getTargetWorkerOfTargetRoom({roomId, myWorkerId})
        if (result.error) {
            throw {error: result.error}
        }

        return Promise.resolve( {
            success: (result.success ?? {}) as WorkerType
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}


export type GetThreadListParam = {
    myWorkerId: string
    myCompanyId: string
}

export type GetThreadListResponse =
    | ThreadLogUIType[]
    | undefined

export const getThreadList = async(param: GetThreadListParam) : Promise<CustomResponse<GetThreadListResponse>> => {
    try {
        const { myWorkerId, myCompanyId } = param

        const result = await _getThreadLogListOfTargetWorker({
            workerId: myWorkerId,
            beforeSecond: newCustomDate().totalSeconds,
            limit: 100,
            options: {
                room: {
                    contract: {receiveCompany: true, project: true},
                    construction: {contract: {receiveCompany: true}},
                    companyA: true, 
                    companyB: true
                },
                message: {worker: true, reactions: true, reply: true},
            }
        })

        if (result.error) {
            throw {error: result.error}
        }

        const rtnList: ThreadLogType[] = []

        for (let i = 0 ; i < (result.success?.items?.length ?? 0); i++) {
            const threadLog = result.success?.items ? result.success?.items[i] : {}
            if (threadLog.room?.roomType == 'owner') {
                threadLog.room.name = threadLog.room.construction?.name + ' ' + threadLog.room.construction?.contract?.receiveCompany?.name
            }
            if (threadLog.room?.roomType == 'construction') {
                threadLog.room.name = threadLog.room.construction?.name + ' 自社'
            }
            if (threadLog.room?.roomType == 'project') {
                threadLog.room.name = threadLog.room.contract?.project?.name
            }
            if (threadLog.room?.roomType == 'contract') {
                threadLog.room.name = threadLog.room?.name
                //threadLog.room.companyName = threadLog.room.contract?.receiveCompany?.name
            }
            if (threadLog.room?.roomType == 'company') {
                if (threadLog.room.companyA?.companyId == myCompanyId) {
                    threadLog.room.name = threadLog.room?.companyB?.name
                }
                else {
                    threadLog.room.name = threadLog.room?.companyA?.name
                }
            }
            if (threadLog.room?.roomType == 'custom') {

            }
            if (threadLog.room?.roomType == 'onetoone') {
                const resultUser = await getTargetUser(threadLog.roomId ?? 'no-id', myWorkerId)
                if (resultUser.error) {
                    throw {error: resultUser.error}
                }
        
                threadLog.room.name = resultUser.success?.name
            }

            rtnList.push(threadLog)
    
        }

        // console.log(rtnList)

        return Promise.resolve( {
            success: rtnList
        })


    } catch (error) {
        return getErrorMessage(error)
    }

}