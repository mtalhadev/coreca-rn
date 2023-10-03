import { ConstructionType, toConstructionCLType } from '../../models/construction/Construction'
import { ContractCLType, ContractModel, ContractType, GetContractOptionParam, toContractCLType } from '../../models/contract/Contract'
import { _createConstruction, _getConstruction, _getSubConstructionListOfTargetContract } from '../../services/construction/ConstructionService'
import { _createContract, _deleteContract, _getContract, _updateContract } from '../../services/contract/ContractService'
import { _getProject, _updateProject, _createProject, _deleteProject } from '../../services/project/ProjectService'
import { getUuidv4, isNoValueObject, stringFieldValue } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _deleteSite } from '../../services/site/SiteService'
import { _getCompany } from '../../services/company/CompanyService'
import { createRoomForProject, createRoomForConstructionTypeIOO } from '../chat/ChatBatchCase'
import { _deleteRoom, _getRoomOfKeyId } from '../../services/room/RoomService'
import { _createContractLog, _getContractLogListOfTargetContract, _updateContractLog } from '../../services/contractLog/ContractLogService'
import { newCustomDate } from '../../models/_others/CustomDate'
import { ContractLogStatusType, ContractLogType } from '../../models/contractLog/ContractLog'
import { ID } from '../../models/_others/ID'
import { CompanyCLType } from '../../models/company/Company'
import { Create, Update } from '../../models/_others/Common'

export type WriteContractParam = {
    myCompanyId?: string
    myWorkerId?: string
} & ContractCLType

export type WriteContractResponse = 'update' | 'create' | undefined

export const writeContract = async (params: WriteContractParam): Promise<CustomResponse<WriteContractResponse>> => {
    try {
        const {
            myCompanyId,
            myWorkerId,
            contractAt,
            projectId,
            remarks,
            contractId,
            superConstructionId: superConstructionId,
            orderCompanyId,
            receiveCompanyId,
            orderDepartmentIds,
            receiveDepartmentIds,
            orderCompany,
            receiveCompany,
        } = params
        if (myCompanyId == undefined || myWorkerId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        if (contractId == undefined) {
            throw {
                error: '契約情報がありません。',
            }
        }
        if (projectId == undefined) {
            throw {
                error: '案件情報が足りません。',
            }
        }
        if (contractAt == undefined) {
            throw {
                error: '契約日時が足りません。',
            }
        }

        if (orderCompanyId == undefined || receiveCompanyId == undefined) {
            throw {
                error: 'CompanyIdがありません。',
            }
        }
        if (orderCompanyId == receiveCompanyId) {
            throw {
                error: '発注会社と受注会社は同じにできません。',
            }
        }
        if (orderCompanyId != myCompanyId && receiveCompanyId != myCompanyId) {
            throw {
                error: '顧客か受注会社のどちらかを自社にする必要があります。',
            }
        }
        const exist = await _getContract({ contractId })
        if (exist.success?.status == 'edited' || exist.success?.status == 'created') {
            /**
             * 既に編集中の場合
             */
            const contractLogResult = await _getContractLogListOfTargetContract({ contractId })
            if (contractLogResult.error) {
                throw {
                    error: contractLogResult.error,
                    errorCode: contractLogResult.errorCode,
                }
            }
            const latestContractLog =
                contractLogResult.success?.totalContractLogs?.items && contractLogResult.success.latestContractLog != undefined
                    ? contractLogResult.success?.totalContractLogs?.items[contractLogResult.success.latestContractLog]
                    : undefined
            if (latestContractLog == undefined) {
                throw {
                    error: '契約の履歴がありません。',
                    errorCode: 'WRITE_CONTRACT_ERROR',
                }
            }
            if (latestContractLog.updateCompanyId == myCompanyId) {
                /**
                 * 自社が最後に編集した場合
                 * 既に承認待ちの場合は、承認待ちをキャンセルする
                 */
                const result = await _updateContractLog({
                    contractLogId: latestContractLog.contractLogId,
                    status: 'canceled',
                })
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            } else {
                /**
                 * 自社以外が最後に編集した場合
                 */
                throw {
                    error: '承認待ちの変更があります。',
                    errorCode: 'WRITE_CONTRACT_ERROR',
                }
            }
        }

        const isUpdate = !isNoValueObject(exist.success)
        const newContract = {
            contractId,
            projectId,
            contractAt: contractAt?.totalSeconds,
            superConstructionId: superConstructionId,
            orderCompanyId,
            receiveCompanyId,
            updateWorkerId: myWorkerId,
            remarks: stringFieldValue({ isUpdate, value: remarks }),
            orderDepartmentIds,
            receiveDepartmentIds,
            //承認ずみ
            //仮会社が相手の場合
            //承認待ち
            //既に承認待ちだった場合、または承認済みだった場合
            //承認待ち（発注）
            //既に承認待ち（発注）または今回が初回の発注の場合
            status: orderCompany?.isFake || receiveCompany?.isFake ? 'approved' : exist.success?.status == 'edited' || exist.success?.status == 'approved' ? 'edited' : 'created',
        } as Update<ContractModel>

        if (isUpdate) {
            const result = await _updateContract(
                orderCompany?.isFake || receiveCompany?.isFake || exist.success?.status == 'created'
                    ? newContract
                    : {
                          contractId,
                          status: 'edited',
                      },
            )
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            const contractLogResult = await _createContractLog({
                contractId: contractId,
                updateWorkerId: myWorkerId,
                contract: newContract as ContractModel,
                updateCompanyId: myCompanyId,
                status: orderCompany?.isFake || receiveCompany?.isFake ? 'approved' : exist.success?.status == 'created' ? 'created' : 'waiting',
                editedAt: newCustomDate().totalSeconds,
            })
            if (contractLogResult.error) {
                throw {
                    error: contractLogResult.error,
                    errorCode: contractLogResult.errorCode,
                }
            }
            return Promise.resolve({
                success: 'update',
            })
        } else {
            if (superConstructionId == undefined) {
                throw {
                    error: '発注する対象となる工事がありません。',
                }
            }
            const superResult = await _getConstruction({
                constructionId: superConstructionId,
                options: {
                    sites: true,
                },
            })
            if (superResult.error) {
                throw {
                    error: superResult.error,
                }
            }
            if (superResult.success == undefined) {
                throw {
                    error: '発注する対象となる工事がありません。',
                }
            }

            const contractResult = await _createContract(newContract as Create<ContractModel>)
            if (contractResult.error) {
                throw {
                    error: contractResult.error,
                    errorCode: contractResult.errorCode,
                }
            }
            const contractLogResult = await _createContractLog({
                contractId: contractResult.success ?? 'no-id',
                updateWorkerId: myWorkerId,
                contract: newContract as ContractModel,
                updateCompanyId: myCompanyId,
                status: orderCompany?.isFake || receiveCompany?.isFake ? 'approved' : 'created',
                editedAt: newCustomDate().totalSeconds,
            })
            if (contractLogResult.error) {
                throw {
                    error: contractLogResult.error,
                    errorCode: contractLogResult.errorCode,
                }
            }
            const constructionId = getUuidv4()
            const constructionResult = await _createConstruction({
                ...superResult.success,
                constructionId,
                contractId,
                updateWorkerId: myWorkerId,
            })
            if (constructionResult.error) {
                throw {
                    error: constructionResult.error,
                }
            }
            const siteDeleteResults = await Promise.all(superResult.success?.sites?.items?.map((site) => (site.siteId ? _deleteSite(site.siteId) : undefined)) ?? [])
            siteDeleteResults.forEach((result) => {
                if (result?.error) {
                    throw {
                        error: result.error,
                    }
                }
            })

            //chat
            const contractReadResult = await _getContract({
                contractId: contractResult.success ?? 'no-id',
                options: {
                    project: true,
                    orderCompany: true,
                    receiveCompany: true,
                },
            })
            if (contractReadResult.error) {
                throw {
                    error: contractReadResult.error,
                }
            }

            if (contractReadResult.success?.receiveCompany?.isFake != true) {
                const roomProjectResult = await createRoomForProject(contractReadResult.success as ContractType)
                if (roomProjectResult.error) {
                    throw {
                        error: roomProjectResult.error,
                    }
                }
            }

            const superConstruction = superResult.success as ConstructionType
            superConstruction.subContract = contractReadResult.success as ContractType

            const roomOMFReadResult = await _getRoomOfKeyId({ keyId: superConstruction.constructionId ?? 'no-id', isTypeOwner: false })
            if (roomOMFReadResult.error) {
                throw {
                    error: roomOMFReadResult.error,
                }
            }

            const deleteResult = await _deleteRoom(roomOMFReadResult.success?.roomId ?? 'no-id')
            if (deleteResult.error) {
                throw {
                    error: deleteResult.error,
                }
            }

            const roomIOOResult = await createRoomForConstructionTypeIOO(superConstruction)
            if (roomIOOResult.error) {
                throw {
                    error: roomIOOResult.error,
                }
            }

            return Promise.resolve({
                success: 'create',
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetContractParam = {
    contractId?: string
    options?: GetContractOptionParam
}

export type GetContractResponse = ContractCLType | undefined

export const getContract = async (params: GetContractParam): Promise<CustomResponse<GetContractResponse>> => {
    try {
        const { contractId, options } = params
        if (contractId == undefined) {
            throw {
                error: 'idがありません。',
            }
        }
        const contractResult = await _getContract({
            contractId,
            options,
        })
        if (contractResult.error) {
            throw {
                error: contractResult.error,
            }
        }
        return Promise.resolve({
            success: toContractCLType(contractResult.success),
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type DeleteTargetContractParam = {
    contract?: ContractType
    status?: ContractLogStatusType
    myCompanyId?: string
    myWorkerId?: string
    latestContractLogId?: string
    orderCompany?: CompanyCLType
    receiveCompany?: CompanyCLType
}

export type DeleteTargetContractResponse = boolean | undefined

export const deleteTargetContract = async (params: DeleteTargetContractParam): Promise<CustomResponse<DeleteTargetContractResponse>> => {
    try {
        const { status, contract, myCompanyId, myWorkerId, latestContractLogId, orderCompany, receiveCompany } = params
        if (contract?.contractId == undefined) {
            throw {
                error: 'idがありません。',
            }
        }

        if (status == 'created' || orderCompany?.isFake == true || receiveCompany?.isFake == true) {
            const result = await _deleteContract(contract?.contractId)
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: 'DELETE_CONTRACT_LOG_ERROR',
                }
            }
        } else {
            if (status == 'waiting') {
                const result = await _updateContractLog({
                    contractLogId: latestContractLogId,
                    status: 'canceled',
                })
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: 'DELETE_CONTRACT_LOG_ERROR',
                    }
                }
            }
            //直接削除せずに、削除フラグを立てるようにする
            const contractLogResult = await _createContractLog({
                contractId: contract?.contractId,
                updateWorkerId: myWorkerId,
                contract: contract,
                updateCompanyId: myCompanyId,
                status: 'delete',
                editedAt: newCustomDate().totalSeconds,
            })
            if (contractLogResult.error) {
                throw {
                    error: contractLogResult.error,
                    errorCode: 'DELETE_CONTRACT_LOG_ERROR',
                }
            }
            const result = await _updateContract({ contractId: contract?.contractId, status: 'edited' })

            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetContractForEditParam = {
    myCompanyId?: string
    contractId?: string
}

export type GetContractForEditResponse = ContractCLType | undefined

export const getContractForEdit = async (params: GetContractForEditParam): Promise<CustomResponse<GetContractForEditResponse>> => {
    try {
        const { myCompanyId, contractId } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }
        if (contractId == undefined) {
            throw {
                error: 'idがありません。',
            }
        }
        const contractResult = await _getContract({
            contractId,
            options: {
                contractLog: true,
                receiveDepartments: true,
                orderDepartments: true,
                superConstruction: {
                    displayName: true,
                    constructionRelation: {
                        params: {
                            companyId: myCompanyId,
                        },
                    },
                    contract: {
                        orderDepartments: true,
                        receiveDepartments: true,
                    },
                },
                orderCompany: {
                    companyPartnership: {
                        params: {
                            companyId: myCompanyId,
                        },
                    },
                    lastDeal: {
                        params: {
                            myCompanyId,
                        },
                    },
                },
                receiveCompany: {
                    companyPartnership: {
                        params: {
                            companyId: myCompanyId,
                        },
                    },
                    lastDeal: {
                        params: {
                            myCompanyId,
                        },
                    },
                },
                project: true,
            },
        })
        if (contractResult.error) {
            throw {
                error: contractResult.error,
            }
        }
        return Promise.resolve({
            success: toContractCLType(contractResult.success),
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * 契約の承認・非承認を更新するパラメーター
 * @typedef UpdateApproveContractParam
 * @property {string} contractId - 契約ID
 * @property {string} myCompanyId - 自社ID
 * @property {boolean} isApproved - 承認・非承認
 * @property {string[]} receiveDepartmentIds - 受注部署ID
 */
export type UpdateApproveContractParam = {
    contractId?: ID
    myCompanyId?: ID
    isApproved?: boolean
    receiveDepartmentIds?: ID[]
}

export type UpdateApproveContractResponse = boolean | undefined
/**
 * 契約の承認・非承認を更新する
 * @author kamiya
 * @param - {@link UpdateApproveContractParam UpdateApproveContractParam}
 * @returns - {@link UpdateApproveContractResponse UpdateApproveContractResponse}
 */
export const updateApproveContract = async (params: UpdateApproveContractParam): Promise<CustomResponse<UpdateApproveContractResponse>> => {
    const { contractId, myCompanyId, isApproved, receiveDepartmentIds } = params
    if (contractId == undefined) {
        throw {
            error: 'contractIdがありません。',
            errorCode: 'UPDATE_APPROVE_CONTRACT_ERROR',
        }
    }
    if (isApproved == undefined) {
        throw {
            error: 'isApprovedがありません。',
            errorCode: 'UPDATE_APPROVE_CONTRACT_ERROR',
        }
    }
    if (myCompanyId == undefined) {
        throw {
            error: 'myCompanyIdがありません。',
            errorCode: 'UPDATE_APPROVE_CONTRACT_ERROR',
        }
    }
    try {
        const contractLogResult = await _getContractLogListOfTargetContract({ contractId })
        if (contractLogResult.error) {
            throw {
                error: contractLogResult.error,
                errorCode: contractLogResult.errorCode,
            }
        }
        //editedAtでソート
        const latestContractLog =
            contractLogResult.success?.totalContractLogs?.items && contractLogResult.success.latestContractLog != undefined
                ? contractLogResult.success?.totalContractLogs?.items[contractLogResult.success.latestContractLog]
                : undefined
        if (latestContractLog == undefined) {
            throw {
                error: '契約がありません。',
                errorCode: 'UPDATE_APPROVE_CONTRACT_ERROR',
            }
        }
        if (latestContractLog.status === 'approved') {
            throw {
                error: 'すでに承認されています。',
                errorCode: 'UPDATE_APPROVE_CONTRACT_ERROR',
            }
        } else if (latestContractLog.status === 'rejected') {
            throw {
                error: 'すでに非承認されています。',
                errorCode: 'UPDATE_APPROVE_CONTRACT_ERROR',
            }
        }
        if (latestContractLog.updateCompanyId == myCompanyId) {
            throw {
                error: '自社の承認はできません。',
                errorCode: 'UPDATE_APPROVE_CONTRACT_ERROR',
            }
        }
        const newContract: ContractType = {
            ...latestContractLog.contract,
            status: 'approved',
            /**
             * 初回承認時には受注部署を更新する(自社受注のみ)
             */
            receiveDepartmentIds:
                receiveDepartmentIds != undefined && latestContractLog.contract?.receiveCompanyId == myCompanyId ? receiveDepartmentIds : latestContractLog.contract?.receiveDepartmentIds,
        }
        const newContractLog: ContractLogType = {
            ...latestContractLog,
            contract: newContract,
            status: isApproved ? 'approved' : 'rejected',
        }
        /**
         * 契約ログを更新する
         */
        const updateLogResult = await _updateContractLog(newContractLog)
        if (updateLogResult.error) {
            throw {
                error: updateLogResult.error,
                errorCode: updateLogResult.errorCode,
            }
        }
        if (isApproved) {
            /**
             * 契約を承認して更新する
             */
            const updateContractResult = await _updateContract(newContract)
            if (updateContractResult.error) {
                throw {
                    error: updateContractResult.error,
                    errorCode: updateContractResult.errorCode,
                }
            }
        } else if (latestContractLog.status == 'created') {
            /**
             * オーナー案件の場合は案件を削除する
             */
            if (latestContractLog.contract?.superConstructionId == undefined && latestContractLog.contract?.projectId != undefined) {
                const result = await _deleteProject(latestContractLog.contract?.projectId)
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            } else {
                /**
                 * 初回発注の契約を非承認したら、契約を削除する
                 */
                const deleteContractResult = await _deleteContract(contractId)
                if (deleteContractResult.error) {
                    throw {
                        error: deleteContractResult.error,
                        errorCode: deleteContractResult.errorCode,
                    }
                }
            }
        } else {
            /**
             * 契約を非承認して更新する
             */
            const updateContractResult = await _updateContract({
                contractId,
                status: 'approved',
            })
            if (updateContractResult.error) {
                throw {
                    error: updateContractResult.error,
                    errorCode: updateContractResult.errorCode,
                }
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type UpdateApproveContractDeleteParam = {
    contractId?: string
    myCompanyId?: string
    isApproved?: boolean
}

export type UpdateApproveContractDeleteResponse = boolean | undefined
/**
 * 契約の承認・非承認を更新する
 * @author kamiya
 * @param - {@link UpdateApproveContractDeleteParam UpdateApproveContractDeleteParam}
 * @returns - {@link UpdateApproveContractDeleteResponse UpdateApproveContractDeleteResponse}
 */
export const updateApproveContractDelete = async (params: UpdateApproveContractDeleteParam): Promise<CustomResponse<UpdateApproveContractDeleteResponse>> => {
    const { contractId, myCompanyId, isApproved } = params
    if (contractId == undefined) {
        throw {
            error: 'contractIdがありません。',
            errorCode: 'UPDATE_APPROVE_CONTRACT_ERROR',
        }
    }
    if (isApproved == undefined) {
        throw {
            error: 'isApprovedがありません。',
            errorCode: 'UPDATE_APPROVE_CONTRACT_ERROR',
        }
    }
    if (myCompanyId == undefined) {
        throw {
            error: 'myCompanyIdがありません。',
            errorCode: 'UPDATE_APPROVE_CONTRACT_ERROR',
        }
    }
    try {
        if (isApproved) {
            /**
             * 契約を承認して削除する
             */
            const deleteContractResult = await _deleteContract(contractId)
            if (deleteContractResult.error) {
                throw {
                    error: deleteContractResult.error,
                    errorCode: deleteContractResult.errorCode,
                }
            }
        } else {
            /**
             * 削除を非承認して更新する
             */
            const logUpdateResult = await updateApproveContract({
                contractId,
                myCompanyId,
                isApproved: false,
            })
            if (logUpdateResult.error) {
                throw {
                    error: logUpdateResult.error,
                    errorCode: logUpdateResult.errorCode,
                }
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type CancelContractLogParam = {
    contractLogId?: string
    contractId?: string
}
/**
 * 契約の変更をキャンセルする
 * @author kamiya
 * @param params CancelContractLogParam
 * @returns boolean
 */
export const cancelContractLog = async (params: CancelContractLogParam): Promise<CustomResponse<boolean>> => {
    try {
        const { contractLogId, contractId } = params
        if (contractLogId == undefined) {
            throw {
                error: 'contractLogIdがありません。',
                errorCode: 'CANCEL_CONTRACT_LOG_ERROR',
            }
        }
        if (contractId == undefined) {
            throw {
                error: 'contractIdがありません。',
                errorCode: 'CANCEL_CONTRACT_LOG_ERROR',
            }
        }
        const contractLogResult = await _updateContractLog({ contractLogId, status: 'canceled' })

        if (contractLogResult.error) {
            throw {
                error: contractLogResult.error,
                errorCode: contractLogResult.errorCode,
            }
        }
        const contractResult = await _updateContract({ contractId, status: 'approved' })
        if (contractResult.error) {
            throw {
                error: contractResult.error,
                errorCode: contractResult.errorCode,
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
