import { GetContractListOfTargetCompaniesParam, GetContractListOfTargetCompaniesResponse, _createContract, _deleteContract, _getContractListOfTargetCompanies} from '../../src/services/contract/ContractService'
import { getUuidv4, CustomResponse} from '../../src/utils/Utils'
import ENV from '../../env/env'
import { initializeFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { ContractType } from '../../src/models/Contract'
import { initTestApp } from '../utils/testUtils'

let contractIdArray: string[] = []
beforeAll(() => {
    initTestApp()
})
beforeEach(async()=> {
    let rtn: CustomResponse<string> = await _createContract({
        contractId: getUuidv4(),
        orderCompanyId: 'dummyCompany-A',
        receiveCompanyId: 'dummyCompany-B',
        remarks: 'AからBへ請負'
    })
    contractIdArray.push(rtn.success as string)
    rtn = await _createContract({
        contractId: getUuidv4(),
        orderCompanyId: 'dummyCompany-A',
        receiveCompanyId: 'dummyCompany-B',
        remarks: 'AからBへ請負'
    })
    contractIdArray.push(rtn.success as string)
    rtn = await _createContract({
        contractId: getUuidv4(),
        orderCompanyId: 'dummyCompany-B',
        receiveCompanyId: 'dummyCompany-A',
        remarks: 'BからAへ請負'
    })
    contractIdArray.push(rtn.success as string)
    rtn = await _createContract({
        contractId: getUuidv4(),
        orderCompanyId: 'dummyCompany-B',
        receiveCompanyId: 'dummyCompany-A',
        remarks: 'BからAへ請負'
    })
    contractIdArray.push(rtn.success as string)

})


afterEach(() => {
    contractIdArray.forEach(async(id) => {
        await _deleteContract(id)
    })
    contractIdArray = []
})

describe('ContractService', () => {

    it('_getContractListOfTargetCompanies test', async() => {
        const params:GetContractListOfTargetCompaniesParam = {
            companyId: 'dummyCompany-A',
            myCompanyId: 'dummyCompany-B',
            type: 'payment',
        }
        const rtn: CustomResponse<GetContractListOfTargetCompaniesResponse> = await _getContractListOfTargetCompanies(params)
        const contracts: ContractType[] = rtn.success as ContractType[]

        expect(contracts[0].remarks).toBe('BからAへ請負')
        expect(contracts.length).toBe(2)

        const params2:GetContractListOfTargetCompaniesParam = {
            companyId: 'dummyCompany-A',
            myCompanyId: 'dummyCompany-B',
            type: 'claim',
        }
        const rtn2: CustomResponse<GetContractListOfTargetCompaniesResponse> = await _getContractListOfTargetCompanies(params2)
        const contracts2: ContractType[] = rtn2.success as ContractType[]

        expect(contracts2[0].remarks).toBe('AからBへ請負')
        expect(contracts2.length).toBe(2)
    })

})
