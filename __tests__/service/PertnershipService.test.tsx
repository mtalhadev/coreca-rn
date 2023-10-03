import { _createPartnership, _deletePartnership, _getLastDealAtTargetCompanies, /*_getAllPartnershipListOfTargetCompany,*/ _getPartnership, _updatePartnership} from '../../src/services/partnership/PartnershipService'
import { CustomResponse } from '../../src/models/_others/CustomResponse'
import ENV from '../../env/env'
import { initializeFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { PartnershipType } from '../../src/models/partnership/Partnership'
import { _createContract, _deleteContract } from '../../src/services/contract/ContractService'
import { _createRequest, _deleteRequest } from '../../src/services/request/RequestService'
import { initTestApp } from '../utils/testUtils'

let partnershipIdArray: string[] = []
beforeAll(() => {
    initTestApp()
})
beforeEach(async()=> {

    let rtn: CustomResponse<string> = await _createPartnership({
        fromCompanyId: '1234-abcd-aaffff',
        toCompanyId: '2345-abcd-aaffff',
    })
    partnershipIdArray.push(rtn.success as string)

    rtn = await _createPartnership({
        fromCompanyId: '1234-efgh-aaffff',
        toCompanyId: '2345-efgh-aaffff',
    })
    partnershipIdArray.push(rtn.success as string)

    rtn = await _createPartnership({
        fromCompanyId: '1234-abcd-aaffff',
        toCompanyId: '2345-efgh-aaffff',
    })
    partnershipIdArray.push(rtn.success as string)

    rtn = await _createPartnership({
        fromCompanyId: '1234-efgh-aaffff',
        toCompanyId: '1234-abcd-aaffff',
    })
    partnershipIdArray.push(rtn.success as string)

})


afterEach(() => {
    partnershipIdArray.forEach(async(id) => {
        await _deletePartnership(id)
    })
    partnershipIdArray = []
})

describe('PartnershipService', () => {


    it('Insert test', async() => {
        let rtn: CustomResponse<string> = await _createPartnership({fromCompanyId: '1234-ijkl-aaafff', toCompanyId: '2345-ijkl-aaafff'})
        partnershipIdArray.push(rtn.success as string)
        expect(rtn.success).not.toBe(undefined)
    })

    it('Read test exist', async() => {
        let rtn: CustomResponse<PartnershipType | undefined> = await _getPartnership(partnershipIdArray[0])
        expect(rtn.success?.fromCompanyId).toBe('1234-abcd-aaffff')
    })

    it('Read test not exist', async() => {
        let rtn: CustomResponse<PartnershipType | undefined> = await _getPartnership('1234-wxyz-aaffff')
        expect(rtn.success?.partnershipId).toBe(undefined)
    })

    it('Update test', async() => {

        let rtn: CustomResponse<PartnershipType | undefined> = await _getPartnership(partnershipIdArray[0])
        let partnership: PartnershipType = rtn.success as PartnershipType
        partnership.fromCompanyId = '2345-wxyz-aaffff'

        await _updatePartnership(partnership)
        rtn = await _getPartnership(partnershipIdArray[0])
        expect(rtn.success?.fromCompanyId).toBe('2345-wxyz-aaffff')

    })

    it('Update test not exist', async() => {

        let rtn: CustomResponse<PartnershipType | undefined> = await _getPartnership(partnershipIdArray[0])
        let partnership: PartnershipType = rtn.success as PartnershipType
        partnership.partnershipId = '1234-wxyz-aaffff'
        partnership.fromCompanyId = '2345-wxyz-aaffff'

        let rtn2: CustomResponse = await _updatePartnership(partnership)
        expect(rtn2.success).toBe(false)

    })

    it('Delete test exist', async() => {
        let rtn2: CustomResponse = await _deletePartnership(partnershipIdArray[0])
        expect(rtn2.success).toBe(true)
    })
})
