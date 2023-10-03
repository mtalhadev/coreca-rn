import { CompanyType } from "../../models/company/Company";
import { ConstructionType } from "../../models/construction/Construction";
import { ContractType } from "../../models/contract/Contract";
import { MessageCLType, MessageType } from "../../models/message/Message";
import { WorkerType } from "../../models/worker/Worker";
import { compareWithAnotherDate, CustomDate, newCustomDate, toCustomDateFromTotalSeconds } from "../../models/_others/CustomDate";
import { CustomResponse } from "../../models/_others/CustomResponse";
import { _getAllCompanies, _getPartnerCompaniesOfTargetCompany } from "../../services/company/CompanyService";
import {  GetConstructionListOfTargetContractResponse, _getSubConstructionListOfTargetContract } from "../../services/construction/ConstructionService";
import { _getContractListOfTargetCompany } from "../../services/contract/ContractService";
import { _createMessage, _updateMessage } from "../../services/message/MessageService";
import { _getPartnershipOfTargetCompanies } from "../../services/partnership/PartnershipService";
import { _createReadRecords, _createRecordsOfRead } from "../../services/read/ReadService";
import { _createRoom, _getRoom, _getRoomOfKeyId, _getRoomsCount, _updateRoom } from "../../services/room/RoomService";
import { _createRoomUser, _getRoomUserListOfTargetRoom, _updateRoomUser } from "../../services/roomUser/RoomUserService";
import { _createThreadHead, _getThreadHead, _getThreadHeadByMessageId, _updateThreadHead } from "../../services/threadHead/ThreadHeadService";
import { _createThreadLog } from "../../services/threadLog/ThreadLogService";
import { _getWorkerListOfTargetCompany } from "../../services/worker/WorkerService";
import { getErrorMessage } from "../../services/_others/ErrorService";
import { getUuidv4 } from "../../utils/Utils";


type checkPartnership = {
    fromCompanyId: string
    toCompanyId: string
}

export const makeAllRoomForChat = async(): Promise<CustomResponse<boolean>> => {
    try {

        
        const resultRoomsCount = await _getRoomsCount()
        if (resultRoomsCount.error) {
            throw {error: resultRoomsCount.error}
        }
        

        if ((resultRoomsCount.success ?? 0) > 0 ) {
            throw {
                error: '既にトークルームは作成済みです。',
            } as CustomResponse
        }
        

        const resultAllCompanies = await _getAllCompanies()
        if (resultAllCompanies.error) {
            throw {error: resultAllCompanies.error}
        }

        let checkPartnerships: checkPartnership[] = []
        for (let i = 0; i < (resultAllCompanies.success?.items?.length ?? 0); i++) {    
            let company: CompanyType = resultAllCompanies.success?.items ? resultAllCompanies.success?.items[i] : {isFake: true}
            if (company.isFake) {
                continue
            }

            const resultCompanies = await _getPartnerCompaniesOfTargetCompany({companyId: company.companyId ?? 'no-id'})
            if (resultCompanies.error) {
                throw {error: resultCompanies.error}
            }
    
            for (let j = 0; j < (resultCompanies.success?.items?.length ?? 0); j++) {
                let company2: CompanyType = resultCompanies.success?.items ? resultCompanies.success?.items[j] : {isFake: true}
                if (company2.isFake ) {
                    continue
                }
                if (isExistPartnerRoom(company.companyId ?? 'no-id', company2.companyId ?? 'no-id', checkPartnerships) == false) {
                    const resultPartner = await createRoomForPartner(company.companyId ?? 'no-id', company2.companyId ?? 'no-id')
                    if (resultPartner.error) {
                        throw {error: resultPartner.error}
                    }
                }
            }
            
        }


        let funcsOrder: any[] = []
        let funcsReceive: any[] = []
        let contracts: ContractType[] = []

        for (let i = 0; i < (resultAllCompanies.success?.items?.length ?? 0); i++) {    
            let company: CompanyType = resultAllCompanies.success?.items ? resultAllCompanies.success?.items[i] : {isFake: true}
            if (company.isFake) {
                continue
            }

            const resultContractsOrder = await _getContractListOfTargetCompany({companyId: company.companyId ?? 'no-id', types: ['order']})
            resultContractsOrder.success?.totalContracts?.items?.forEach((contract) => {
                //contracts.push(contract)
                funcsOrder.push(_getSubConstructionListOfTargetContract({
                    contractId: contract.contractId ?? 'no-id',
                    options: {
                        contract: {project: true},
                        subContract: {project: true},
                        constructionRelation: {
                            params: {
                                companyId: company.companyId,
                            }
                        },
                    }
                }))
            })


            const resultContracts = await _getContractListOfTargetCompany({companyId: company.companyId ?? 'no-id', types: ['receive']})
            resultContracts.success?.totalContracts?.items?.forEach((contract) => {
                contracts.push(contract)
                funcsReceive.push(_getSubConstructionListOfTargetContract({
                    contractId: contract.contractId ?? 'no-id',
                    options: {
                        contract: true,
                        subContract: {project: true, orderCompany: true, receiveCompany: true},
                        constructionRelation: {
                            params: {
                                companyId: company.companyId,
                            }
                        },
                    }
                }))
            })
        }


        let constructionsOwner: ConstructionType[] = []
        let constructionsOMF: ConstructionType[] = []
        let constructionsIOO: ConstructionType[] = []

        const resultConstructionsOrder = (await Promise.all(funcsOrder)) as CustomResponse<GetConstructionListOfTargetContractResponse>[]
        resultConstructionsOrder.forEach((result) => {
            if (result.error) {
                throw {error: result.error}
            }
        })
        
        resultConstructionsOrder.forEach(resultConstruct => {
            resultConstruct?.success?.items?.forEach(construct => {
                if (construct.constructionRelation == 'owner') {
                    // console.log(construct)
                    constructionsOwner.push(construct)
                }
            })
        })


        const resultConstructionsReceive = (await Promise.all(funcsReceive)) as CustomResponse<GetConstructionListOfTargetContractResponse>[]
        resultConstructionsReceive.forEach((result) => {
            if (result.error) {
                throw {error: result.error}
            }
        })

        resultConstructionsReceive.forEach(resultConstruct => {
            resultConstruct?.success?.items?.forEach(construct => {
                if (construct.constructionRelation == 'owner' || construct.constructionRelation == 'manager' || construct.constructionRelation == 'fake-company-manager') {
                    constructionsOMF.push(construct)
                }
                else if (construct.constructionRelation == 'intermediation' || construct.constructionRelation == 'order-children' || construct.constructionRelation == 'other-company') {
                    constructionsIOO.push(construct)
                }
            })
        })


        // console.log('length')
        // console.log(constructionsOMF.length)
        // console.log(constructionsIOO.length)


        let funcs2: any[] = []
        contracts.forEach((contract) => {
            funcs2.push(createRoomForProject(contract))
        })

        constructionsOwner.forEach((construction) => {
            funcs2.push(createRoomForConstructionTypeOwner(construction))
        })

        constructionsOMF.forEach((construction) => {
            funcs2.push(createRoomForConstructionTypeOMF(construction))
        })

        constructionsIOO.forEach((construction) => {
            funcs2.push(createRoomForConstructionTypeIOO(construction))
        })

        const results = (await Promise.all(funcs2)) as CustomResponse[]
        results.forEach((result) => {
            if (result.error) {
                throw {error: result.error}
            }
        })

        return Promise.resolve( {
            success: true
        })


    } catch (error) {
        return getErrorMessage(error)
    }

}

export const createRoomForPartner = async(companyId1: string, companyId2: string): Promise<CustomResponse> => {
    try{
        const resultPartner = await _getPartnershipOfTargetCompanies({companyId: companyId1, companyId2})
        if (resultPartner.error) {
            throw {error: resultPartner.error}
        }

        const resultCreateRoom = await _createRoom({
            roomType: 'company',
            name: 'No name',
            keyId: resultPartner.success?.partnershipId,
            rootThreadId: getUuidv4(),

        })

    
        const resultWorkers1 = await _getWorkerListOfTargetCompany({companyId: companyId1})
        if (resultWorkers1.error) {
            throw {error: resultWorkers1.error}
        }

        const workers1 = resultWorkers1.success?.items?.filter(worker => __filterLeftWorker(worker, newCustomDate())).filter(worker => worker.companyRole == 'owner' || worker.companyRole == 'manager') ?? []

        let funcsRoomUser: any[] = []
        workers1.forEach(async(worker, index) => {
            funcsRoomUser.push(_createRoomUser({
                roomId: resultCreateRoom.success,
                roomRole: worker.companyRole == 'owner' ? 'admin' : 'general',
                index,
                workerId: worker.workerId,
                unreadCount: 0,
                projectId: '',
            }))
        })

        const resultWorkers2 = await _getWorkerListOfTargetCompany({companyId: companyId2})
        if (resultWorkers2.error) {
            throw {error: resultWorkers2.error}
        }

        const workers2 = resultWorkers2.success?.items?.filter(worker => __filterLeftWorker(worker, newCustomDate())).filter(worker => worker.companyRole == 'owner' || worker.companyRole == 'manager') ?? []

        workers2.forEach(async(worker, index) => {
            funcsRoomUser.push(_createRoomUser({
                roomId: resultCreateRoom.success,
                roomRole: worker.companyRole == 'owner' ? 'admin' : 'general',
                index: workers1.length + index,
                workerId: worker.workerId,
                unreadCount: 0,
                projectId: '',
            }))
        })


        const results = (await Promise.all(funcsRoomUser)) as CustomResponse<string>[]
        results.forEach((result) => {
            if (result.error) {
                throw {error: result.error}
            }
        })


        return Promise.resolve( {
            success: true
        })


    } catch (error) {
        return getErrorMessage(error)
    }
}

const isExistPartnerRoom = (companyId1: string, companyId2: string, checkPartnerships: checkPartnership[]): boolean => {
    let hitFlag: boolean = false

    checkPartnerships.forEach(cp => {
        if (cp.fromCompanyId == companyId1 && cp.toCompanyId == companyId2){
            hitFlag = true
        }
        if (cp.fromCompanyId == companyId2 && cp.toCompanyId == companyId1){
            hitFlag = true
        }
    })

    if (hitFlag == false) {
        checkPartnerships.push({fromCompanyId: companyId1, toCompanyId: companyId2})
    }

    return hitFlag
}

export const createRoomForProject = async(contract: ContractType): Promise<CustomResponse> => {
    try {
        const resultCreateRoom = await _createRoom({
            roomType: 'project',
            name: '案件',
            keyId: contract.contractId,
            rootThreadId: getUuidv4(),

        })

        const resultWorkers = await _getWorkerListOfTargetCompany({companyId: contract.receiveCompanyId ?? 'no-id'})
        if (resultWorkers.error) {
            throw {error: resultWorkers.error}
        }

        const workers = resultWorkers.success?.items?.filter(worker => __filterLeftWorker(worker, newCustomDate())).filter(worker => worker.companyRole == 'owner' || worker.companyRole == 'manager') ?? []

        let funcsRoomUser: any[] = []
        workers.forEach(async(worker, index) => {
            funcsRoomUser.push(_createRoomUser({
                roomId: resultCreateRoom.success,
                roomRole: worker.companyRole == 'owner' ? 'admin' : 'general',
                index,
                workerId: worker.workerId,
                unreadCount: 0,
                projectId: contract.projectId,
            }))
        })

        const results = (await Promise.all(funcsRoomUser)) as CustomResponse<string>[]
        results.forEach((result) => {
            if (result.error) {
                throw {error: result.error}
            }
        })

        return Promise.resolve( {
            success: true
        })
    
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const createRoomForConstructionTypeOwner = async(construction: ConstructionType): Promise<CustomResponse> => {
    try {
        const roomRootThreadId = getUuidv4()
        const resultCreateRoom = await _createRoom({
            roomType: 'owner',
            name: construction.name,
            keyId: construction.constructionId,
            rootThreadId: roomRootThreadId,

        })

    
        const resultWorkers = await _getWorkerListOfTargetCompany({companyId: construction.contract?.orderCompanyId ?? 'no-id'})
        if (resultWorkers.error) {
            throw {error: resultWorkers.error}
        }

        const workers = resultWorkers.success?.items?.filter(worker => __filterLeftWorker(worker, newCustomDate())).filter(worker => worker.companyRole == 'owner' || worker.companyRole == 'manager') ?? []

        let orderOwnerWorkerId: string = 'no-id'
        let funcsRoomUser: any[] = []
        workers.forEach((worker, index) => {
            funcsRoomUser.push(_createRoomUser({
                roomId: resultCreateRoom.success,
                roomRole: worker.companyRole == 'owner' ? 'admin' : 'general',
                index,
                workerId: worker.workerId,
                unreadCount: 0,
                projectId: construction.contract?.projectId,
            }))

            if (worker.companyRole == 'owner') {
                orderOwnerWorkerId = worker.workerId ?? 'no-id'
            }

        })

        const results = (await Promise.all(funcsRoomUser)) as CustomResponse<string>[]
        results.forEach((result) => {
            if (result.error) {
                throw {error: result.error}
            }
        })


        const resultWorkers2 = await _getWorkerListOfTargetCompany({companyId: construction.contract?.receiveCompanyId ?? 'no-id'})
        if (resultWorkers.error) {
            throw {error: resultWorkers.error}
        }

        const workers2 = resultWorkers2.success?.items?.filter(worker => __filterLeftWorker(worker, newCustomDate())).filter(worker => worker.companyRole == 'owner' || worker.companyRole == 'manager') ?? []

        let funcsRoomUser2: any[] = []
        workers2.forEach((worker, index) => {
            funcsRoomUser2.push(_createRoomUser({
                roomId: resultCreateRoom.success,
                roomRole: worker.companyRole == 'owner' ? 'admin' : 'general',
                index: workers.length + index,
                workerId: worker.workerId,
                unreadCount: 0,
                projectId: construction.contract?.projectId,
            }))

        })

        const results2 = (await Promise.all(funcsRoomUser2)) as CustomResponse<string>[]
        results2.forEach((result) => {
            if (result.error) {
                throw {error: result.error}
            }
        })


        const resultPartner = await _getPartnershipOfTargetCompanies({companyId: construction?.contract?.orderCompanyId ?? 'no-id', companyId2: construction.contract?.receiveCompanyId ?? 'no-id'})
        if (resultPartner.error) {
            throw {error: resultPartner.error}
        }

        const resultRoom = await _getRoomOfKeyId({keyId: resultPartner.success?.partnershipId ?? 'no-id'})
        if (resultRoom.error) {
            throw {error: resultRoom.error}
        }

        const resultMessage = await _createMessage({
            roomId: resultRoom.success?.roomId ?? 'no-id',
            threadId: resultRoom.success?.rootThreadId ?? 'no-id',
            isThreadStart: true,
            extraRoomId: resultCreateRoom.success ?? 'no-id',
            workerId: orderOwnerWorkerId,
            message: '案件：' + construction.contract?.project?.name,
            messageType: 'text',
            readCount: 0,
            updateCount: 0,
        })
        
        if (resultMessage.error) {
            throw {error: resultMessage.error}
        }

        const resultMessage2 = await _createMessage({
            roomId: resultCreateRoom.success ?? 'no-id',
            threadId: roomRootThreadId,
            workerId: orderOwnerWorkerId,
            message: '案件：' + construction.contract?.project?.name,
            messageType: 'text',
            readCount: 0,
            updateCount: 0,
        })
        
        if (resultMessage2.error) {
            throw {error: resultMessage2.error}
        }


        const resultThreadHead = await _createThreadHead({
            threadId: roomRootThreadId,
            messageId: resultMessage.success,
            messageCount: 1,
            isExtra: true,
            lastMessageId: resultMessage2.success,
        })
        
        if (resultThreadHead.error) {
            throw {error: resultThreadHead.error}
        }

        return Promise.resolve( {
            success: true
        })
    
    } catch (error) {
        return getErrorMessage(error)
    }
}



export const createRoomForConstructionTypeOMF = async(construction: ConstructionType): Promise<CustomResponse> => {
    try {
        const roomRootThreadId = getUuidv4()
        const resultCreateRoom = await _createRoom({
            roomType: 'construction',
            name: construction.name,
            keyId: construction.constructionId,
            rootThreadId: roomRootThreadId,

        })

    
        const resultWorkers = await _getWorkerListOfTargetCompany({companyId: construction.contract?.receiveCompanyId ?? 'no-id'})
        if (resultWorkers.error) {
            throw {error: resultWorkers.error}
        }

        const workers = resultWorkers.success?.items?.filter(worker => __filterLeftWorker(worker, newCustomDate())).filter(worker => worker.companyRole == 'owner' || worker.companyRole == 'manager') ?? []

        let receiveOwnerWorkerId: string = 'no-id'
        let funcsRoomUser: any[] = []
        workers.forEach((worker, index) => {
            funcsRoomUser.push(_createRoomUser({
                roomId: resultCreateRoom.success,
                roomRole: worker.companyRole == 'owner' ? 'admin' : 'general',
                index,
                workerId: worker.workerId,
                unreadCount: 0,
                projectId: construction.contract?.projectId,
            }))

            if (worker.companyRole == 'owner') {
                receiveOwnerWorkerId = worker.workerId ?? 'no-id'
            }

        })

        const results = (await Promise.all(funcsRoomUser)) as CustomResponse<string>[]
        results.forEach((result) => {
            if (result.error) {
                throw {error: result.error}
            }
        })


        return Promise.resolve( {
            success: true
        })
    
    } catch (error) {
        return getErrorMessage(error)
    }
}


export const createRoomForConstructionTypeIOO = async(construction: ConstructionType): Promise<CustomResponse> => {
    try {
        const roomRootThreadId = getUuidv4()
        const roomId = getUuidv4()

        if (construction.subContract?.receiveCompany?.isFake == true) {
            return Promise.resolve( {
                success: true
            })
        }

        const resultCreateRoom = await _createRoom({
            roomType: 'contract',
            name: construction.name,
            keyId: construction.subContract?.contractId,
            rootThreadId: roomRootThreadId,

        })

    
        let funcsRoomUser: any[] = []
        const resultWorkers1 = await _getWorkerListOfTargetCompany({companyId: construction.subContract?.orderCompanyId ?? 'no-id'})
        if (resultWorkers1.error) {
            throw {error: resultWorkers1.error}
        }

        const workers1 = resultWorkers1.success?.items?.filter(worker => __filterLeftWorker(worker, newCustomDate())).filter(worker => worker.companyRole == 'owner' || worker.companyRole == 'manager') ?? []

        workers1.forEach((worker, index) => {
            funcsRoomUser.push(_createRoomUser({
                roomId: resultCreateRoom.success,
                roomRole: worker.companyRole == 'owner' ? 'admin' : 'general',
                index,
                workerId: worker.workerId,
                unreadCount: 0,
                projectId: construction.subContract?.projectId,
            }))
        })

        let receiveOwnerWorkerId: string = 'no-id'

        const resultWorkers2 = await _getWorkerListOfTargetCompany({companyId: construction.subContract?.receiveCompanyId ?? 'no-id'})
        if (resultWorkers2.error) {
            throw {error: resultWorkers2.error}
        }

        const workers2 = resultWorkers2.success?.items?.filter(worker => __filterLeftWorker(worker, newCustomDate())).filter(worker => worker.companyRole == 'owner' || worker.companyRole == 'manager') ?? []


        workers2.forEach((worker, index) => {
            funcsRoomUser.push(_createRoomUser({
                roomId: resultCreateRoom.success,
                roomRole: worker.companyRole == 'owner' ? 'admin' : 'general',
                index,
                workerId: worker.workerId,
                unreadCount: 0,
                projectId: construction.subContract?.projectId,
            }))

            if (worker.companyRole == 'owner') {
                receiveOwnerWorkerId = worker.workerId ?? 'no-id'
            }
        })

        const results = (await Promise.all(funcsRoomUser)) as CustomResponse<string>[]
        results.forEach((result) => {
            if (result.error) {
                throw {error: result.error}
            }
        })

        const resultPartner = await _getPartnershipOfTargetCompanies({companyId: construction.subContract?.orderCompanyId ?? 'no-id', companyId2: construction.subContract?.receiveCompanyId ?? 'no-id'})
        if (resultPartner.error) {
            throw {error: resultPartner.error}
        }

        const resultRoom = await _getRoomOfKeyId({keyId: resultPartner.success?.partnershipId ?? 'no-id'})
        if (resultRoom.error) {
            throw {error: resultRoom.error}
        }

        const resultMessage = await _createMessage({
            roomId: resultRoom.success?.roomId ?? 'no-id',
            threadId: resultRoom.success?.rootThreadId ?? 'no-id',
            isThreadStart: true,
            extraRoomId: resultCreateRoom.success ?? 'no-id',
            workerId: receiveOwnerWorkerId,
            message: '案件：' + construction.subContract?.project?.name,
            messageType: 'text',
            readCount: 0,
            updateCount: 0,
        })
        
        if (resultMessage.error) {
            throw {error: resultMessage.error}
        }

        const resultMessage2 = await _createMessage({
            roomId: resultCreateRoom.success ?? 'no-id',
            threadId: roomRootThreadId,
            workerId: receiveOwnerWorkerId,
            message: '案件：' + construction.subContract?.project?.name,
            messageType: 'text',
            readCount: 0,
            updateCount: 0,
        })
        
        if (resultMessage2.error) {
            throw {error: resultMessage2.error}
        }
        
        const resultThreadHead = await _createThreadHead({
            threadId: roomRootThreadId,
            messageId: resultMessage.success,
            messageCount: 1,
            isExtra: true,
            lastMessageId: resultMessage2.success,
        })
        
        if (resultThreadHead.error) {
            throw {error: resultThreadHead.error}
        }

        return Promise.resolve( {
            success: true
        })
    
    } catch (error) {
        return getErrorMessage(error)
    }
}


/**
 * @remarks 退会済みの作業員をフィルタする。
 * @param worker 
 * @param date 
 * @returns 退会済みでないならtrue。退会済みならfalse
 */
 export const __filterLeftWorker = (worker: WorkerType, date: CustomDate): boolean => {
    if (worker.leftDate == undefined) {
        return true
    }
    return (compareWithAnotherDate(toCustomDateFromTotalSeconds(worker.leftDate), (date)).totalMilliseconds ?? 0) < 0
}



export type createNewThreadParam = {
    message: MessageCLType,
    myWorkerId: string,
}



export const createNewThread = async(param: createNewThreadParam): Promise<CustomResponse<string>> => {
    try {
        const {message, myWorkerId} = param
        const newTheadId = getUuidv4()

        const resultUpdate = await _updateMessage({...message, isThreadStart: true, createdAt: newCustomDate().totalSeconds, updatedAt: newCustomDate().totalSeconds, lockedAt: undefined })
        if (resultUpdate.error) {
            throw {error: resultUpdate.error}
        }

        message.threadId = newTheadId
        const resultMessage = await createNewMessage({message: {...message, messageId: undefined}, myWorkerId})
        if (resultMessage.error) {
            throw {error: resultMessage.error}
        }
        
        const resultThreadHead = await _createThreadHead({
            threadId: newTheadId,
            messageId: message.messageId,
            lastMessageId: resultMessage.success,
            messageCount: 1,
        })
        if (resultThreadHead.error) {
            throw {error: resultThreadHead.error}
        }

        return Promise.resolve( {
            success: newTheadId
        })
        

    } catch (error) {
        return getErrorMessage(error)
    }
}

export type createNewMessageParam = {
    message: MessageCLType,
    myWorkerId: string,
}

export const createNewMessage = async(param: createNewMessageParam): Promise<CustomResponse<string>> => {
    try {
        const {message, myWorkerId} = param

        const resultMessage = await _createMessage({...message, createdAt: message.createdAt?.totalSeconds, updatedAt: message.updatedAt?.totalSeconds, lockedAt: undefined })
        if (resultMessage.error) {
            throw {error: resultMessage.error}
        }

        const resultRoom = await _updateRoom({
            roomId: message.roomId ?? 'no-id',
            lastMessage: message.message,
        })
        if (resultRoom.error) {
            throw {error: resultRoom.error}
        }

        const resultUsers = await _getRoomUserListOfTargetRoom({
            roomId: message.roomId ?? 'no-id',
        })
        if (resultUsers.error) {
            throw {error: resultUsers.error}
        }

        resultUsers.success?.items?.forEach(async(roomUser) => {
            if (roomUser.workerId == myWorkerId) {
                return
            }
            await _updateRoomUser({
                roomId: roomUser.roomId,
                workerId: roomUser.workerId,
                unreadCount: (roomUser.unreadCount ?? 0) + 1,
            })

            // console.log(roomUser.roomId?.substring(0,8) + "@" + roomUser.workerId?.substring(0,8) + "@" + ((roomUser.unreadCount ?? 0) + 1))

        })


        const resultThreadHead = await _getThreadHead({threadId: message.threadId ?? 'no-id'})
        if (resultThreadHead.error) {
            throw {error: resultThreadHead.error}
        }

        if (resultThreadHead.success != undefined) {
            const resultUpdateThreadHead = await _updateThreadHead({
                threadId: resultThreadHead.success?.threadId,
                lastMessageId: resultMessage.success,
                messageCount: (resultThreadHead.success?.messageCount ?? 0)+ 1
            })
            if (resultUpdateThreadHead.error) {
                throw {error: resultUpdateThreadHead.error}
            }
        }


        const resultReadRoom = await _getRoom({
            roomId: message.roomId ?? 'no-id',
        })
        if (resultReadRoom.error) {
            throw {error: resultReadRoom.error}
        }

        resultUsers.success?.items?.forEach(async(roomUser) => {
            if (roomUser.workerId == myWorkerId) {
                return
            }
            await _createThreadLog({
                threadId: message.threadId,
                workerId: roomUser.workerId,
                roomId: message.roomId,
                messageId: resultMessage.success,
                
            })

        })

        return Promise.resolve( {
            success: resultMessage.success
        })

    } catch (error) {
        return getErrorMessage(error)
    }
}

export type createMessageReadParam = {
    messages: MessageType[],
    myWorkerId: string,
}

export const createMessageRead = async(param: createMessageReadParam): Promise<CustomResponse> => {
    try {
        const {messages, myWorkerId} = param

        const messageIds: string[] = []
        messages.forEach((msg) => {
            if (msg.workerId != myWorkerId) {
                messageIds.push(msg.messageId ?? 'no-id')
            }
        })

        const resultCreate = await _createRecordsOfRead({messageIds, myWorkerId})
        if (resultCreate.error) {
            throw {error: resultCreate.error}
        }


        return Promise.resolve( {
            success: true
        })

    } catch (error) {
        return getErrorMessage(error)
    }
}

