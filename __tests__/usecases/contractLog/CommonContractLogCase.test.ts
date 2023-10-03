import mockAxios from '../../../__mocks__/mockAxios'
import { _createConstruction, _getConstruction } from '../../../__mocks__/services/ConstructionService'
import { _createContractLog, _getContractLogListOfTargetContract } from '../../../__mocks__/services/ContractLogService'
import { _createContract, _deleteContract, _getContract, _updateContract } from '../../../__mocks__/services/ContractService'
import { __getEmulatorFunctionsURI } from '../../../src/services/firebase/FunctionsService'
import { GetContractLogListParam, getContractLogList } from '../../../src/usecases/contractLog/CommonContractLogCase'

afterEach(() => {
    mockAxios.reset()
    mockAxios.resetHistory()
})

let params: GetContractLogListParam = {
    contractId: 'contract-id',
}

const getContractUrl = __getEmulatorFunctionsURI('IContract-getContract')
const getContractLogUrl = __getEmulatorFunctionsURI('IContractLog-getContractLogListOfTargetContract')

describe('writeContract case', () => {
    it('contractId = undefined test', async () => {
        const res = await getContractLogList({ ...params, contractId: undefined })
        expect(res.error).toEqual('contractIdがありません')
    })

    it('success test', async () => {
        _getContractLogListOfTargetContract({
            contractId: params.contractId as string,
            options: {
                updateWorker: true,
            },
        })
        _getContract({
            contractId: params.contractId as string,
            options: {
                orderCompany: true,
                orderDepartments: true,
                receiveCompany: true,
                receiveDepartments: true,
            },
        })

        const res = await getContractLogList({ ...params })
        console.log(res)

        expect(mockAxios.history.post.length).toEqual(2)
        expect(mockAxios.history.post[0].url).toEqual(getContractLogUrl)
        expect(mockAxios.history.post[1].url).toEqual(getContractUrl)
    })
})
