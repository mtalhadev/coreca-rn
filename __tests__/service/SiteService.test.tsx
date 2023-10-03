import { _createSite, _deleteSite, _getPastSiteList, _getSite, _getSiteListOfTargetConstruction, _getSiteListOfTargetWorker, _updateSite} from '../../src/services/site/SiteService'
import { CustomResponse } from '../../src/models/_others/CustomResponse'
import ENV from '../../env/env'
import { initializeFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { SiteType } from '../../src/models/site/Site'
import { ResponseSiteType } from '../../src/models/ResponseSite'
import { _createArrangement, _deleteArrangement } from '../../src/services/arrangement/ArrangementService'
import { initTestApp } from '../utils/testUtils'

let siteIdArray: string[] = []
let arrangementIdArray: string[] = []
beforeAll(() => {
    initTestApp()
})

beforeEach(async()=> {
    let rtn: CustomResponse<string> = await _createSite({
        constructionId: '2345-abcd-aaffff',
        startDate: 123456,
        endDate: 155456,
        requiredNum: 5,
    })
    siteIdArray.push(rtn.success as string)

    rtn = await _createSite({
        constructionId: '2345-efgh-aaffff',
        startDate: 123456,
        endDate: 155456,
        requiredNum: 5,
    })
    siteIdArray.push(rtn.success as string)

    rtn = await _createSite({
        constructionId: '2345-efgh-aaffff',
        startDate: 123478,
        endDate: 155456,
        requiredNum: 7,
    })
    siteIdArray.push(rtn.success as string)


    let rtn2: CustomResponse<string> = await _createArrangement({
        siteId: siteIdArray[0],
        workerId: '2222-efgh-aaffff',
    })
    arrangementIdArray.push(rtn2.success as string)

    rtn2 = await _createArrangement({
        siteId: siteIdArray[0],
        workerId: '2222-ijkl-aaffff',
    })
    arrangementIdArray.push(rtn2.success as string)

    rtn2 = await _createArrangement({
        siteId: siteIdArray[1],
        workerId: '2222-efgh-aaffff',
    })
    arrangementIdArray.push(rtn2.success as string)

})


afterEach(() => {
    siteIdArray.forEach(async(id) => {
        await _deleteSite(id)
    })
    siteIdArray = []

    arrangementIdArray.forEach(async(id) => {
        await _deleteArrangement(id)
    })
    arrangementIdArray = []
})

describe('SiteService', () => {
    
    
    it('Insert test', async() => {
        let rtn: CustomResponse<string> = await _createSite({siteId: '1234-ijkl-aaafff', constructionId: '2345-ijkl-aaafff'})
        siteIdArray.push(rtn.success as string) 
        expect(rtn.success).not.toBe(undefined)
    })
    
    it('Read test exist', async() => {
        let rtn: CustomResponse<SiteType | undefined> = await _getSite(siteIdArray[0])
        expect(rtn.success?.constructionId).toBe('2345-abcd-aaffff')
    })

    it('Read test not exist', async() => {
        let rtn: CustomResponse<SiteType | undefined> = await _getSite('1234-wxyz-aaffff')
        expect(rtn.success?.siteId).toBe(undefined)
    })

    it('Update test', async() => {
        
        let rtn: CustomResponse<SiteType | undefined> = await _getSite(siteIdArray[0])
        let site: SiteType = rtn.success as SiteType
        site.constructionId = '2345-wxyz-aaffff'
        
        await _updateSite(site)
        rtn = await _getSite(siteIdArray[0])
        expect(rtn.success?.constructionId).toBe('2345-wxyz-aaffff')
        
    })

    it('Update test not exist', async() => {
        
        let rtn: CustomResponse<SiteType | undefined> = await _getSite(siteIdArray[0])
        let site: SiteType = rtn.success as SiteType
        site.siteId = '1234-wxyz-aaffff'
        site.constructionId = '2345-wxyz-aaffff'
        
        let rtn2: CustomResponse = await _updateSite(site)
        expect(rtn2.success).toBe(false)
        
    })

    it('Delete test exist', async() => {
        let rtn2: CustomResponse = await _deleteSite(siteIdArray[0])
        expect(rtn2.success).toBe(true)
    })

    it('_getSiteListOfTargetConstruction test', async() => {
        const rtn2 = await _getSiteListOfTargetConstruction('2345-efgh-aaffff')
        let respSite: ResponseSiteType = rtn2.success as ResponseSiteType
        expect(respSite.sites?.length).toBe(2)
        expect(respSite.totalRequiredNum).toBe(12)

    })

    
    it('_getSitesOfTargetWorker test', async() => {
        let rtn2: CustomResponse<SiteType[]> = await _getSiteListOfTargetWorker('2222-efgh-aaffff')
        expect(rtn2.success?.length).toBe(2)

    })

    it('_getPastSiteList test', async() => {
        let rtn2: CustomResponse<SiteType[]> = await _getPastSiteList(siteIdArray)
        expect(rtn2.success?.length).toBe(3)

    })

})
