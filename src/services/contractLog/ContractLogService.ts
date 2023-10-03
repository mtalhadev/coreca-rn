import { _callFunctions } from '../firebase/FunctionsService'
import { ContractLogModel, GetContractLogOptionParam, ContractLogType } from '../../models/contractLog/ContractLog'
import { Create, Update } from '../../models/_others/Common'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'
import { ContractLogListType } from '../../models/contractLog/ContractLogListType'

/**
 *
 */
export const _createContractLog = async (contractLog: Create<ContractLogModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IContractLog-createContractLog', contractLog)
        if (result.error) {
            throw { ...result }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetContractLogParam = {
    contractLogId: string
    options?: GetContractLogOptionParam
}

export type GetContractLogResponse = ContractLogType | undefined

export const _getContractLog = async (params: GetContractLogParam): Promise<CustomResponse<GetContractLogResponse>> => {
    try {
        const result = await _callFunctions('IContractLog-getContractLog', params)
        if (result.error) {
            throw { ...result }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export const _updateContractLog = async (contractLog: Update<ContractLogModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IContractLog-updateContractLog', contractLog)
        if (result.error) {
            throw { ...result }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export const _deleteContractLog = async (contractLogId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IContractLog-deleteContractLog', contractLogId)
        if (result.error) {
            throw { ...result }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetContractLogListOfTargetContractParam = {
    contractId: string
    options?: GetContractLogOptionParam
}
/**
 * 契約に紐づく契約履歴を取得する
 * @param params {@link GetContractLogListOfTargetContractParam}
 * @returns ContractLogListType
 */
export const _getContractLogListOfTargetContract = async (params: GetContractLogListOfTargetContractParam): Promise<CustomResponse<ContractLogListType>> => {
    try {
        const result = await _callFunctions('IContractLog-getContractLogListOfTargetContract', params)
        if (result.error) {
            throw { ...result }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}
