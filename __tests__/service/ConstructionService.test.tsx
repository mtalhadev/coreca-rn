import { _createConstruction, _deleteConstruction, _filterConstructionList, _getConstructionListOfTargetCompany, _getConstruction, _updateConstruction} from '../../src/services/construction/ConstructionService'
import { getUuidv4} from '../../src/utils/Utils'
import { CustomResponse } from '../../src/models/_others/CustomResponse'
import ENV from '../../env/env'
import { initializeFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { ConstructionType } from '../../src/models/construction/Construction'
import { initTestApp } from '../utils/testUtils'

let constructionIdArray: string[] = []

beforeAll(() => {
    initTestApp()
})

beforeEach(async()=> {
    let rtn: CustomResponse<string> = await _createConstruction({
        constructionId: getUuidv4(),
        orderCompanyId: '1234-abcd-aaffff',
        receiveCompanyId: '2345-abcd-aaffff',
        startDate: 123456,
        name: '工事A1',
    })
    constructionIdArray.push(rtn.success as string)

    rtn = await _createConstruction({
        constructionId: getUuidv4(),
        orderCompanyId: '1234-efgh-aaffff',
        receiveCompanyId: '2345-efgh-aaffff',
        startDate: 123457,
        name: '工事A2',
    })
    constructionIdArray.push(rtn.success as string)

    rtn = await _createConstruction({
        constructionId: getUuidv4(),
        orderCompanyId: '1234-efgh-bbffff',
        receiveCompanyId: '2345-efgh-aaffff',
        startDate: 123458,
        name: '工事B1',

    })
    constructionIdArray.push(rtn.success as string)

})


afterEach(() => {
    constructionIdArray.forEach(async(id) => {
        await _deleteConstruction(id)
    })
    constructionIdArray = []
})

describe('ConstructionService', () => {
    
    
    it('Insert test', async() => {
        let rtn: CustomResponse<string> = await _createConstruction({orderCompanyId: '1234-ijkl-aaafff', receiveCompanyId: '2345-ijkl-aaafff'})
        constructionIdArray.push(rtn.success as string) 
        expect(rtn.success).not.toBe(undefined)
    })
    
    it('Read test exist', async() => {
        let rtn: CustomResponse<ConstructionType | undefined> = await _getConstruction(constructionIdArray[0])
        expect(rtn.success?.orderCompanyId).toBe('1234-abcd-aaffff')
    })

    it('Read test not exist', async() => {
        let rtn: CustomResponse<ConstructionType | undefined> = await _getConstruction('1234-wxyz-aaffff')
        expect(rtn.success?.constructionId).toBe(undefined)
    })

    it('Update test', async() => {
        
        let rtn: CustomResponse<ConstructionType | undefined> = await _getConstruction(constructionIdArray[0])
        let construction: ConstructionType = rtn.success as ConstructionType
        construction.orderCompanyId = '2345-wxyz-aaffff'
        
        await _updateConstruction(construction)
        rtn = await _getConstruction(constructionIdArray[0])
        expect(rtn.success?.orderCompanyId).toBe('2345-wxyz-aaffff')
        
    })

    it('Update test not exist', async() => {
        
        let rtn: CustomResponse<ConstructionType | undefined> = await _getConstruction(constructionIdArray[0])
        let construction: ConstructionType = rtn.success as ConstructionType
        construction.constructionId = '1234-wxyz-aaffff'
        construction.orderCompanyId = '2345-wxyz-aaffff'
        
        let rtn2: CustomResponse = await _updateConstruction(construction)
        expect(rtn2.success).toBe(false)
        
    })

    it('Delete test exist', async() => {
        let rtn2: CustomResponse = await _deleteConstruction(constructionIdArray[0])
        expect(rtn2.success).toBe(true)
    })

    it('_getConstructionListOfTargetCompany test', async() => {
        let rtn2: CustomResponse<ConstructionType[]> = await _getConstructionListOfTargetCompany('2345-efgh-aaffff')
        let constructions: ConstructionType[] = rtn2.success as ConstructionType[]
        expect(constructions.length).toBe(2)
    })

    it('_filterConstructionList test', async() => {
        let rtn: CustomResponse<ConstructionType[]> = await _filterConstructionList('工事A')
        let constructions: ConstructionType[] = rtn.success as ConstructionType[]
        expect(constructions[0].name).toBe('工事A1')
        expect(constructions[1].name).toBe('工事A2')
        expect(constructions.length).toBe(2)
    })

})
