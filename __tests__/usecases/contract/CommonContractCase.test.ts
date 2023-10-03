import mockAxios from '../../../__mocks__/mockAxios'
import { _createConstruction, _getConstruction } from '../../../__mocks__/services/ConstructionService'
import { _createContractLog, _updateContractLog } from '../../../__mocks__/services/ContractLogService'
import { _createContract, _deleteContract, _getContract, _updateContract } from '../../../__mocks__/services/ContractService'
import { newCustomDate } from '../../../src/models/_others/CustomDate'
import { CompanyCLType, CompanyType } from '../../../src/models/company/Company'
import { ContractModel } from '../../../src/models/contract/Contract'
import { ContractLogType } from '../../../src/models/contractLog/ContractLog'
import { __getEmulatorFunctionsURI } from '../../../src/services/firebase/FunctionsService'
import { DeleteTargetContractParam, WriteContractParam, deleteTargetContract, getContract, getContractForEdit, writeContract } from '../../../src/usecases/contract/CommonContractCase'

afterEach(() => {
    mockAxios.reset()
    mockAxios.resetHistory()
})

let params: WriteContractParam = {
    myCompanyId: 'my-company-id',
    myWorkerId: 'my-worker-id',
    contractId: 'contract-id',
    orderCompanyId: 'order-company-id',
    receiveCompanyId: 'receive-company-id',
    superConstructionId: 'super-construction-id',
    remarks: '',
    projectId: 'project-id',
    updateWorkerId: 'worker-id',
    contractAt: newCustomDate(),
    orderDepartmentIds: [],
    orderCompany: {
        companyId: 'order-company-id',
        isFake: false,
    } as CompanyCLType,
}

const targetContractLog:ContractLogType = {
    contractLogId: 'contract-log-id',
    contractId: params.contractId,
    contract: {
        contractId: params.contractId,
        orderCompanyId: params.orderCompanyId,
        receiveCompanyId: params.receiveCompanyId,
        superConstructionId: params.superConstructionId,
        remarks: params.remarks,
        projectId: params.projectId,
        updateWorkerId: params.updateWorkerId,
        contractAt: params.contractAt?.totalSeconds,
        orderDepartmentIds: params.orderDepartmentIds,
    },
    status: 'created',
    updateWorkerId: params.updateWorkerId,
    updateCompanyId: params.myCompanyId,
    editedAt: params.contractAt?.totalSeconds,
}

let deleteParams: DeleteTargetContractParam = {
    contract: targetContractLog?.contract,
    status: 'created',
    myCompanyId: 'my-company-id',
    myWorkerId: 'my-worker-id',
    latestContractLogId: 'contract-log-id'
}

const deleteRequestParams: DeleteTargetContractParam = {
    ...deleteParams,
    status: 'waiting',
}

const getContractUrl = __getEmulatorFunctionsURI('IContract-getContract')
const updateContractUrl = __getEmulatorFunctionsURI('IContract-updateContract')
const createContractUrl = __getEmulatorFunctionsURI('IContract-createContract')
const getConstructionUrl = __getEmulatorFunctionsURI('IConstruction-getConstruction')
const createConstructionUrl = __getEmulatorFunctionsURI('IConstruction-createConstruction')
const deleteContractUrl = __getEmulatorFunctionsURI('IContract-deleteContract')
const createContractLogUrl = __getEmulatorFunctionsURI('IContractLog-createContractLog')
const updateContractLogUrl = __getEmulatorFunctionsURI('IContractLog-updateContractLog')

describe('writeContract case', () => {
    it('myCompanyId = undefined test', async () => {
        const res = await writeContract({ ...params, myCompanyId: undefined })
        expect(res.error).toEqual('自社情報がありません。ログインし直してください。')
    })

    it('contractId = undefined test', async () => {
        const res = await writeContract({ ...params, contractId: undefined })
        expect(res.error).toEqual('契約情報がありません。')
    })

    it('projectId = undefined test', async () => {
        const res = await writeContract({ ...params, projectId: undefined })
        expect(res.error).toEqual('案件情報が足りません。')
    })

    it('orderCompanyId = undefined test', async () => {
        const res = await writeContract({ ...params, orderCompanyId: undefined })
        expect(res.error).toEqual('CompanyIdがありません。')
    })

    it('orderCompanyId == receiveCompanyId test', async () => {
        const res = await writeContract({ ...params, orderCompanyId: 'company-id', receiveCompanyId: 'company-id' })
        expect(res.error).toEqual('発注会社と受注会社は同じにできません。')
    })

    it('orderCompanyId != myCompanyId && receiveCompanyId != myCompanyId test', async () => {
        const res = await writeContract({ ...params })
        expect(res.error).toEqual('顧客か受注会社のどちらかを自社にする必要があります。')
    })

    it('success test', async () => {
        _getContract({ contractId: 'contract-id' })
        _updateContract({ ...params, orderCompanyId: 'my-company-id' } as ContractModel)

        const res = await writeContract({ ...params, orderCompanyId: 'my-company-id' })
        //console.log(res)

        expect(mockAxios.history.post.length).toEqual(2)
        expect(mockAxios.history.post[0].url).toEqual(getContractUrl)
        expect(mockAxios.history.post[1].url).toEqual(updateContractUrl)
    })

    it('error test', async () => {
        _getConstruction({
            constructionId: params.superConstructionId || 'no-id',
            options: {
                sites: true,
            },
        })
        _createContract({ ...params, orderCompanyId: 'my-company-id' } as ContractModel)
        _createConstruction({
            constructionId: 'construction-id',
            contractId: 'contract-id',
            updateWorkerId: 'worker-id',
        })

        mockAxios.onPost(getContractUrl).networkError()

        const res = await writeContract({ ...params, orderCompanyId: 'my-company-id' })

        expect(mockAxios.history.post.length).toEqual(3)
        expect(mockAxios.history.post[0].url).toEqual(getContractUrl)
        expect(mockAxios.history.post[1].url).toEqual(getConstructionUrl)
        expect(mockAxios.history.post[2].url).toEqual(createContractUrl)
    })
})

describe('getContract case', () => {
    it('myContractId = undefined test', async () => {
        const res = await getContract({ contractId: undefined })
        expect(res.error).toEqual('idがありません。')
    })

    it('success test', async () => {
        _getContract({ contractId: params.contractId || 'no-id' })

        const getContractUrl = __getEmulatorFunctionsURI('IContract-getContract')

        const res = await getContract({ contractId: params.contractId })
        //console.log(res)

        expect(mockAxios.history.post[0].url).toEqual(getContractUrl)
        // expect(res.success?.contractId).toEqual(params.contractId)
    })

    it('error test', async () => {
        const getContractUrl = __getEmulatorFunctionsURI('IContract-getContract')

        mockAxios.onPost(getContractUrl).networkError()

        const res = await getContract({ contractId: params.contractId })

        expect(mockAxios.history.post[0].url).toEqual(getContractUrl)
        expect(res.error).toEqual('Network Error')
    })
})

describe('deleteTargetContract case', () => {
    it('contractId = undefined test', async () => {
        const res = await getContract({ contractId: undefined })
        expect(res.error).toEqual('idがありません。')
    })

    it('success delete test', async () => {
        _deleteContract(params.contractId || 'no-id')
        const res = await deleteTargetContract(deleteParams)
        //console.log(res)

        expect(mockAxios.history.post[0].url).toEqual(deleteContractUrl)
        expect(res.success).toEqual(true)
    })

    it('success delete orderCompany fake test', async () => {
        _deleteContract(params.contractId || 'no-id')
        const res = await deleteTargetContract({...deleteParams, orderCompany: { ...deleteParams?.orderCompany, isFake: true}})
        //console.log(res)

        expect(mockAxios.history.post[0].url).toEqual(deleteContractUrl)
        expect(res.success).toEqual(true)
    })

    it('success delete receiveCompany fake test', async () => {
        _deleteContract(params.contractId || 'no-id')
        const res = await deleteTargetContract({...deleteParams, receiveCompany: { ...deleteParams?.receiveCompany, isFake: true}})
        //console.log(res)

        expect(mockAxios.history.post[0].url).toEqual(deleteContractUrl)
        expect(res.success).toEqual(true)
    })

    it('contract = undefined test', async () => {
        mockAxios.onPost(deleteContractUrl).networkError()

        const res = await deleteTargetContract({...deleteParams, contract: undefined})
        expect(res.error).toEqual('idがありません。')
    })

    it('error delete test', async () => {
        mockAxios.onPost(deleteContractUrl).networkError()

        const res = await deleteTargetContract(deleteParams)

        expect(mockAxios.history.post[0].url).toEqual(deleteContractUrl)
        expect(res.error).toEqual('Network Error')
    })

    it('success delete request status waiting test', async () => {

        _updateContractLog({
            contractLogId: deleteRequestParams.latestContractLogId,
            status: 'canceled',
        })
        _createContractLog({
            contractId: deleteRequestParams?.contract?.contractId,
            updateWorkerId: deleteRequestParams?.myWorkerId,
            contract: deleteRequestParams?.contract,
            updateCompanyId: deleteRequestParams?.myCompanyId,
            status: 'delete',
            editedAt: newCustomDate().totalSeconds,
        })
        _updateContract({
            contractId: deleteRequestParams?.contract?.contractId,
            status: 'edited',
        })
        const res = await deleteTargetContract({...deleteRequestParams, status: 'waiting'})
        //console.log(res)

        expect(mockAxios.history.post.length).toEqual(3)
        expect(mockAxios.history.post[0].url).toEqual(updateContractLogUrl)
        expect(mockAxios.history.post[1].url).toEqual(createContractLogUrl)
        expect(mockAxios.history.post[2].url).toEqual(updateContractUrl)
        expect(res.success).toEqual(true)
    })

    it('success delete request status approved test', async () => {
        _createContractLog({
            contractId: deleteRequestParams?.contract?.contractId,
            updateWorkerId: deleteRequestParams?.myWorkerId,
            contract: deleteRequestParams?.contract,
            updateCompanyId: deleteRequestParams?.myCompanyId,
            status: 'delete',
            editedAt: newCustomDate().totalSeconds,
        })
        _updateContract({
            contractId: deleteRequestParams?.contract?.contractId, status: 'edited'
        })

        const res = await deleteTargetContract({...deleteRequestParams, status: 'approved'})
        //console.log(res)

        expect(mockAxios.history.post.length).toEqual(2)
        expect(mockAxios.history.post[0].url).toEqual(createContractLogUrl)
        expect(mockAxios.history.post[1].url).toEqual(updateContractUrl)
        expect(res.success).toEqual(true)
    })

    it('error delete request test', async () => {
        mockAxios.onPost(updateContractLogUrl).networkError()

        const res = await deleteTargetContract(deleteRequestParams)

        expect(mockAxios.history.post[0].url).toEqual(updateContractLogUrl)
        expect(res.error).toEqual('Network Error')
    })
})


describe('getContractForEdit case', () => {
    it('contractId = undefined test', async () => {
        const res = await getContractForEdit({ myCompanyId: 'my-company-id', contractId: undefined })
        expect(res.error).toEqual('idがありません。')
    })
    it('myCompanyId = undefined test', async () => {
        const res = await getContractForEdit({ myCompanyId: undefined, contractId: 'contract-id' })
        expect(res.error).toEqual('自社情報がありません。ログインし直してください。')
    })

    it('success test', async () => {
        _getContract({
            contractId: 'contract-id',
            options: {
                orderDepartments: true,
                superConstruction: {
                    displayName: true,
                    constructionRelation: {
                        params: {
                            companyId: 'my-company-id',
                        },
                    },
                },
                orderCompany: {
                    companyPartnership: {
                        params: {
                            companyId: 'my-company-id',
                        },
                    },
                    lastDeal: {
                        params: {
                            myCompanyId: 'my-company-id',
                        },
                    },
                },
                receiveCompany: {
                    companyPartnership: {
                        params: {
                            companyId: 'my-company-id',
                        },
                    },
                },
                project: true,
            },
        })

        const res = await getContractForEdit({ contractId: 'contract-id', myCompanyId: 'my-company-id' })
        //console.log(res)

        expect(mockAxios.history.post[0].url).toEqual(getContractUrl)
        // expect(res.success?.contractId).toEqual('contract-id')
    })

    it('error test', async () => {
        mockAxios.onPost(getContractUrl).networkError()

        const res = await getContractForEdit({ contractId: 'contract-id', myCompanyId: 'my-company-id' })

        expect(mockAxios.history.post[0].url).toEqual(getContractUrl)
        expect(res.error).toEqual('Network Error')
    })
})
