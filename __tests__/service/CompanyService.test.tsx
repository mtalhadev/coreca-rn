import { FilterCompanyListResponse, GetCompanyListByIdsResponse, _createCompany, _deleteCompany, _filterCompanyList, _getCompany, _getCompanyListByIds, _getLastDealAtTargetCompany, _updateCompany} from '../../src/services/company/CompanyService'
import { CustomResponse } from '../../src/models/_others/CustomResponse'
import { CompanyType } from '../../src/models/company/Company'
import { _createConstruction, _deleteConstruction } from '../../src/services/construction/ConstructionService'
import { _createSite, _deleteSite } from '../../src/services/site/SiteService'
import { _createRequest, _deleteRequest } from '../../src/services/request/RequestService'
import { _createContract, _deleteContract } from '../../src/services/contract/ContractService'
import { initTestApp } from '../utils/testUtils'
import { LastDealType } from '../../src/models/company/CompanyListType'
import { _createProject, _deleteProject } from '../../src/services/project/ProjectService'

let companyIdArray: string[] = []
let projectIdArray: string[] = []
let constructionIdArray: string[] = []
let siteIdArray: string[] = []
let contractIdArray: string[] = []
let requestIdArray: string[] = []

beforeAll(() => {
    initTestApp()
})
beforeEach(async()=> {
    let rtn: CustomResponse<string> = await _createCompany({
        name: 'ABC株式会社',
        address: '東京都渋谷区神南2-3-12',
    })
    companyIdArray.push(rtn.success as string)

    rtn = await _createCompany({
        name: 'GHI株式会社',
        address: '東京都港区浜松町３−15-1',
    })
    companyIdArray.push(rtn.success as string)

    rtn = await _createCompany({
        name: 'GHI商事',
        address: '東京都港区汐留4-12-1',
    })
    companyIdArray.push(rtn.success as string)

    rtn = await _createProject({
        name: 'testProject',
        startDate:1646075040423,
        endDate:1646976440423,
        createCompanyId: companyIdArray[0],
    })
    projectIdArray.push(rtn.success as string)

    rtn = await _createProject({
        name: 'testProject2',
        startDate:1646075040423,
        endDate:1646976440423,
        createCompanyId: companyIdArray[1],
    })
    projectIdArray.push(rtn.success as string)

    rtn = await _createContract({
        receiveCompanyId: companyIdArray[1],
        orderCompanyId: companyIdArray[0],
        contractAt: 1650660468745,
        remarks: 'テスト',
        projectId: projectIdArray[0],
    })
    contractIdArray.push(rtn.success as string)
    rtn = await _createContract({
        receiveCompanyId: companyIdArray[0],
        orderCompanyId: companyIdArray[1],
        contractAt: 1646223070246,
        remarks: 'テスト',
        projectId: projectIdArray[1],
    })
    contractIdArray.push(rtn.success as string)

    let rtn2: CustomResponse<string> = await _createConstruction({
        contractId: contractIdArray[0],
        name: '工事A',
        startDate:1646275440423,
        endDate:1646276440423
    })
    constructionIdArray.push(rtn2.success as string)

    rtn2 = await _createConstruction({
        contractId: contractIdArray[1],
        name: '工事B',
        startDate:1646275440423,
        endDate:1646276440423
    })
    constructionIdArray.push(rtn2.success as string)


    let rtn3: CustomResponse<string> = await _createSite({
        constructionId: constructionIdArray[0],
        startDate:1646275440423,
        endDate:1646276440423,
        meetingDate: 1646275450423,
    })
    siteIdArray.push(rtn3.success as string)

    rtn3 = await _createSite({
        constructionId: constructionIdArray[1],
        startDate:1646275440423,
        endDate:1646276440423,
        meetingDate: 1646275450423,
    })
    siteIdArray.push(rtn3.success as string)


    rtn = await _createRequest({
        request: {
            companyId: companyIdArray[1],
            requestedCompanyId: companyIdArray[0],
            createdAt: 1646275440423,
            siteId: siteIdArray[0]
        }
    })
    requestIdArray.push(rtn.success as string)
    rtn = await _createRequest({
        request:{
            companyId: companyIdArray[0],
            requestedCompanyId: companyIdArray[1],
            siteId: siteIdArray[1],
            createdAt: 1646637379932
        }
    })
    requestIdArray.push(rtn.success as string)
})


afterEach(() => {
    companyIdArray.forEach(async(id) => {
        await _deleteCompany(id)
    })
    companyIdArray = []

    constructionIdArray.forEach(async(id) => {
        await _deleteConstruction(id)
    })
    constructionIdArray = []

    siteIdArray.forEach(async(id) => {
        await _deleteSite(id)
    })
    siteIdArray = []

    contractIdArray.forEach(async(id) => {
        await _deleteContract(id)
    })
    contractIdArray = []
    requestIdArray.forEach(async(id) => {
        await _deleteRequest({requestId: id})
    })
    requestIdArray = []
    projectIdArray.forEach(async(id) => {
        await _deleteProject(id)
    })
    projectIdArray = []
})

describe('CompanyService', () => {

    it('Read test exist', async() => {
        const rtn: CustomResponse<CompanyType | undefined> = await _getCompany({companyId: companyIdArray[0]})
        expect(rtn.success?.name).toBe('ABC株式会社')
    })

    it('Read test not exist', async() => {
        const rtn: CustomResponse<CompanyType | undefined> = await _getCompany({companyId: '1234-abcd-aaffff'})
        expect(rtn.success?.companyId).toBe(undefined)
    })

    it('_filterCompanyList test', async() => {
        const rtn: CustomResponse<FilterCompanyListResponse> = await _filterCompanyList({keyword: 'GHI'})
        const companies = rtn.success?.items as CompanyType[]
        expect(companies[0].name).toBe('GHI商事')
        expect(companies[1].name).toBe('GHI株式会社')
        expect(companies.length).toBe(2)
    })

    it('LastDeal test exist', async() => {
        const rtn3: CustomResponse<LastDealType> = await _getLastDealAtTargetCompany({companyId: companyIdArray[0],targetCompanyId: companyIdArray[1]})
        expect(rtn3.success?.contractOrderDate).toBe(1650660468745)
        expect(rtn3.success?.contractReceiveDate).toBe(1646223070246)
        expect(rtn3.success?.latestLastDealDate).toBe(1650660468745)
        //以下の２つはtest実施時のみ、createdAtが反映されるようinitRequestに変更を加える必要がある
        // expect(rtn3.success?.requestOrderDate).toBe(1646637379932)
        // expect(rtn3.success?.requestReceiveDate).toBe(1646275440423)
    })

    it('_getCompanyListByIds test', async() => {
        const rtn: CustomResponse<GetCompanyListByIdsResponse> = await _getCompanyListByIds({companyIds: companyIdArray})

        const companies = rtn.success?.items as CompanyType[]

        expect(companies[0].name).toBe('ABC株式会社')
        expect(companies[1].name).toBe('GHI商事')
    })

    // it('_getOrderCompanyOfSite test ', async() => {
    //     let rtn: CustomResponse<CompanyType | undefined> = await _getOrderCompanyOfSite(siteIdArray[0])

    //     let company: CompanyType = rtn.success as CompanyType
    //     expect(company.name).toBe('ABC株式会社')
    // })

    it('Insert test', async() => {
        const rtn: CustomResponse<string> = await _createCompany({name: 'aaaa'})
        companyIdArray.push(rtn.success as string)
        expect(rtn.success).not.toBe(undefined)
    })

    it('Update test', async() => {
        let rtn: CustomResponse<CompanyType | undefined> = await _getCompany({companyId: companyIdArray[0]})
        const company: CompanyType = rtn.success as CompanyType
        company.name = 'XYZ株式会社'
        await _updateCompany(company)
        rtn = await _getCompany({companyId: companyIdArray[0]})
        expect(rtn.success?.name).toBe('XYZ株式会社')
    })

    it('Update test not exist', async() => {
        const rtn: CustomResponse<CompanyType | undefined> = await _getCompany({companyId: companyIdArray[0]})
        const company: CompanyType = rtn.success as CompanyType
        company.companyId = '1234-abcd-aaffff'
        company.name = 'XYZ株式会社'

        const rtn2: CustomResponse = await _updateCompany(company)
        expect(rtn2.success).toBe(false)
    })

    it('Delete test exist', async() => {
        const rtn2: CustomResponse = await _deleteCompany(companyIdArray[0])
        expect(rtn2.success).toBe(true)
    })
})