import { ContractModel, ContractType } from "../../src/models/contract/Contract"
import { GetContractListOfTargetCompanyParam, GetContractParam, GetContractResponse } from "../../src/services/contract/ContractService"
import { __getEmulatorFunctionsURI, _callFunctions } from "../../src/services/firebase/FunctionsService"
import mockAxios from "../mockAxios"


export const _createContract = (contract: ContractModel) => {
    
    const createContractUrl = __getEmulatorFunctionsURI('IContract-createContract')

    mockAxios
    .onPost(createContractUrl, contract)
    .reply(200, {
        success: contract.contractId
    })
}

export const _updateContract = (contract: ContractModel) => {
    
    const updateContractUrl = __getEmulatorFunctionsURI('IContract-updateContract')

    mockAxios
    .onPost(updateContractUrl, contract)
    .reply(200, {
        success: contract.contractId
    })
}

export const _getContract = (params: GetContractParam) => {
    
    const getContractUrl = __getEmulatorFunctionsURI('IContract-getContract')
    
    mockAxios
    .onPost(getContractUrl, params)
    .reply(200, {
        success: {
            "contractId": params.contractId,
            "contractAt": 1668287841000,
            "orderCompanyId": "order-company-id",
            "receiveCompanyId": "receive-company-id",
            "projectId": "project-id",
            "createdAt": 1668287844000,
            "updatedAt": 1670198226000,
            // "remarks": "remarks",
            // "orderDepartmentIds": ["order-department-id"],  
            // "receiveDepartmentIds": ["receive-department-id"],
            // "status": "waiting",
        }
    })
}


export const _deleteContract = (contractId: string) => {
    
    const Url = __getEmulatorFunctionsURI('IContract-deleteContract')
    
    mockAxios
    .onPost(Url, contractId)
    .reply(200, {
        success: true
    })
}

export const _getContractListOfTargetCompany = (params: GetContractListOfTargetCompanyParam) => {
    
    const Url = __getEmulatorFunctionsURI('IContract-getContractListOfTargetCompany')
    
    if(params.types && params.types[0] == 'receive')
        mockAxios.onPost(Url, params)
        .reply(200, {
            "success": {
                "totalContracts": {
                    "items": [
                        {
                            "contractId": "contract-id",
                            "orderCompanyId": "order-company",
                            "receiveCompanyId": params.companyId,
                            "projectId": "project-id",
                            "orderCompany": {
                                "companyId": "order-company",
                                "name": "Test 1",
                            },
                            "receiveCompany": {
                                "companyId": params.companyId,
                                "name": "Test 2",
                            }
                            // "remarks": "remarks",
                            // "orderDepartmentIds": ["order-department-id"],  
                            // "receiveDepartmentIds": ["receive-department-id"],
                            // "status": "waiting",
                        }
                    ]
                },
                "orderContracts": [],
                "receiveContracts": [0]
            },
            "error": null
        })
    else if(params.types && params.types[0] == 'all')
        mockAxios.onPost(Url, params)
        .reply(200, {
            "success": {
                "totalContracts": {
                    "items": [
                        {
                            "contractId": "contract-id-1",
                            "orderCompanyId": "order-company-id1",
                            "receiveCompanyId": params.companyId,
                            "projectId": "project-id-1",
                            "orderCompany": {
                                "companyId": "order-company-id1",
                                "name": "Test 1",
                            },
                            "receiveCompany": {
                                "companyId": params.companyId,
                                "name": "Test 2",
                            }
                            // "remarks": "remarks",
                            // "orderDepartmentIds": ["order-department-id"],  
                            // "receiveDepartmentIds": ["receive-department-id"],
                            // "status": "waiting",
                        },
                        {
                            "contractId": "contract-id-2",
                            "orderCompanyId": params.companyId,
                            "receiveCompanyId": 'receive-company-id',
                            "projectId": "project-id-2",
                            "orderCompany": {
                                "companyId": params.companyId,
                                "name": "Test 2",
                            },
                            "receiveCompany": {
                                "companyId": 'receive-company-id',
                                "name": "Test 4",
                            }
                            // "remarks": "remarks",
                            // "orderDepartmentIds": ["order-department-id"],  
                            // "receiveDepartmentIds": ["receive-department-id"],
                            // "status": "waiting",
                        }
                    ]
                },
                "orderContracts": [1],
                "receiveContracts": [0]
            },
            "error": null
        })
}