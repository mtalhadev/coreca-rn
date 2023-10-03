import { ContractLogModel, ContractLogType } from '../../src/models/contractLog/ContractLog'
import { GetContractLogListOfTargetContractParam, GetContractLogParam, GetContractLogResponse } from '../../src/services/contractLog/ContractLogService'
import { __getEmulatorFunctionsURI, _callFunctions } from '../../src/services/firebase/FunctionsService'
import mockAxios from '../mockAxios'

export const _createContractLog = (contractLog: ContractLogModel) => {
    const createContractLogUrl = __getEmulatorFunctionsURI('IContractLog-createContractLog')

    mockAxios.onPost(createContractLogUrl, contractLog).reply(200, {
        success: contractLog.contractLogId,
    })
}

export const _updateContractLog = (contractLog: ContractLogModel) => {
    const updateContractLogUrl = __getEmulatorFunctionsURI('IContractLog-updateContractLog')

    mockAxios.onPost(updateContractLogUrl, contractLog).reply(200, {
        success: contractLog.contractLogId,
    })
}

export const _getContractLog = (params: GetContractLogParam) => {
    const getContractLogUrl = __getEmulatorFunctionsURI('IContractLog-getContractLog')

    mockAxios.onPost(getContractLogUrl, params).reply(200, {
        success: {
            contractLogId: params.contractLogId,
            contractLogAt: 1668287841000,
            updatedAt: 1670198226000,
            contractId: 'contract-id',
            contract: {
                contractId: 'contract-id',
                contractAt: 1668287841000,
                orderCompanyId: 'order-company-id',
                receiveCompanyId: 'receive-company-id',
                projectId: 'project-id',
                createdAt: 1668287844000,
                updatedAt: 1670198226000,
            },
            updateCompanyId: 'update-company-id',
            status: 'waiting',
            editedAt: 1668287841000,
        },
    })
}

export const _deleteContractLog = (contractLogId: string) => {
    const Url = __getEmulatorFunctionsURI('IContractLog-deleteContractLog')

    mockAxios.onPost(Url, contractLogId).reply(200, {
        success: true,
    })
}

/**
 * 契約に紐づく契約履歴を取得する
 * @param params {@link GetContractLogListOfTargetContractParam}
 * @returns ContractLogListType
 */
export const _getContractLogListOfTargetContract = async (params: GetContractLogListOfTargetContractParam) => {
    const getContractLogUrl = __getEmulatorFunctionsURI('IContractLog-getContractLogListOfTargetContract')

    mockAxios.onPost(getContractLogUrl, params).reply(200, {
        success: {
            latestContractLog: 0,
            totalContractLogs: {
                items: [
                    {
                        contractLogId: 'contractLog-Id',
                        contractLogAt: 1668287841000,
                        updatedAt: 1670198226000,
                        contractId: params.contractId,
                        contract: {
                            contractId: params.contractId,
                            contractAt: 1668287841000,
                            orderCompanyId: 'order-company-id',
                            receiveCompanyId: 'receive-company-id',
                            projectId: 'project-id',
                            createdAt: 1668287844000,
                            updatedAt: 1670198226000,
                        },
                        updateCompanyId: 'update-company-id',
                        status: 'waiting',
                        editedAt: 1668287841000,
                    },
                    {
                        contractLogId: 'contractLog-Id-2',
                        contractLogAt: 1668287841000,
                        updatedAt: 1670198226000,
                        contractId: params.contractId,
                        contract: {
                            contractId: params.contractId,
                            contractAt: 1668287841000,
                            orderCompanyId: 'order-company-id',
                            receiveCompanyId: 'receive-company-id',
                            projectId: 'project-id',
                            createdAt: 1668287844000,
                            updatedAt: 1670198226000,
                        },
                        updateCompanyId: 'update-company-id',
                        status: 'approved',
                        editedAt: 1668287841000,
                    },
                ],
            },
        },
    })
}
