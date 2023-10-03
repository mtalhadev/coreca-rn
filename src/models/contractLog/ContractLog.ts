import { CommonModel, Create, ReplaceAnd, Update } from '../_others/Common'
import { WorkerType } from '../worker/Worker'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'
import { ID } from '../_others/ID'
import { ContractModel, ContractType } from '../contract/Contract'

export type ContractLogStatusType = 'waiting' | 'approved' | 'rejected' | 'canceled' | 'created' | 'delete'

/**
 * editedAt: 編集された日時
 * updatedAt: 更新された日時(承認・非承認による更新を含む)
 */
export type ContractLogModel = Partial<{
    contractLogId: ID
    contractId: ID
    updateWorkerId: ID
    updatedAt: number
    contract: ContractModel
    updateCompanyId: ID //(こっちじゃない側が承認する）
    status: ContractLogStatusType
    editedAt: number
}> &
    CommonModel

export const initContractLog = (contractLog: Create<ContractLogModel> | Update<ContractLogModel>): Update<ContractLogModel> => {
    const newContractLog: Update<ContractLogModel> = {
        contractLogId: contractLog.contractLogId,
        contractId: contractLog.contractId,
        updateCompanyId: contractLog.updateCompanyId,
        updatedAt: contractLog.updatedAt,
        contract: contractLog.contract,
        updateWorkerId: contractLog.updateWorkerId,
        status: contractLog.status,
        editedAt: contractLog.editedAt,
    }
    return newContractLog
}

export type ContractLogOptionInputParam = ReplaceAnd<GetOptionObjectType<ContractLogOptionParam>, {}>

export type ContractLogOptionParam = {
    updateWorker?: WorkerType
    contract?: ContractType
}

export type GetContractLogOptionParam = GetOptionParam<ContractLogType, ContractLogOptionParam, ContractLogOptionInputParam>

export type ContractLogType = ContractLogModel & ContractLogOptionParam
