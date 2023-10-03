import { CustomResponse } from '../../models/_others/CustomResponse'
import { ContractType } from '../../models/contract/Contract'
import { ContractLogListType } from '../../models/contractLog/ContractLogListType'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _getContract } from '../../services/contract/ContractService'
import { _getContractLogListOfTargetContract } from '../../services/contractLog/ContractLogService'

export type GetContractLogListResponse = {
    contractLogList?: ContractLogListType
    contract?: ContractType
}
export type GetContractLogListParam = {
    contractId?: string
}
/**
 * ContractLogListで利用するデータを取得する
 * @author kamiya
 * @param params {@link GetContractLogListParam  GetContractLogListParam}
 * @returns ContractLogListType
 */
export const getContractLogList = async (params: GetContractLogListParam): Promise<CustomResponse<GetContractLogListResponse>> => {
    try {
        const { contractId } = params
        if (contractId == undefined) {
            throw {
                error: 'contractIdがありません',
                errorCode: 'GET_CONTRACT_LOG_LIST_ERROR',
            }
        }
        const result = await _getContractLogListOfTargetContract({
            contractId: contractId,
            options: {
                updateWorker: true,
            },
        })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        const contract = result.success?.totalContractLogs?.items ? result.success?.totalContractLogs?.items[0]?.contract : undefined
        const contractResult = await _getContract({
            contractId: contractId,
            options: {
                ...(contract ? { withoutSelf: contract } : {}),
                orderCompany: true,
                orderDepartments: true,
                receiveCompany: true,
                receiveDepartments: true,
            },
        })
        if (contractResult.error) {
            throw {
                error: contractResult.error,
                errorCode: contractResult.errorCode,
            }
        }
        return Promise.resolve({
            success: {
                contractLogList: result.success,
                contract: contractResult.success,
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
