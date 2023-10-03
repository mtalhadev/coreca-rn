import mockAxios from "../../../__mocks__/mockAxios";
import { _getCompany, _getPartnerCompaniesOfTargetCompany } from "../../../__mocks__/services/CompanyService";
import { __getEmulatorFunctionsURI } from "../../../src/services/firebase/FunctionsService";
import { getMyPartnershipCompanies, getMyPartnershipCompaniesWithMyCompany } from "../../../src/usecases/company/CompanyListCase";

afterEach(() => {
    mockAxios.reset();
    mockAxios.resetHistory()
});

let companyId='company-id', 
myCompanyId='my-company-id', 
workerId='worker-id',
myWorkerId='worker-id';

describe('getMyPartnershipCompaniesWithMyCompany case', () => {
    
    it('myCompanyId = undefined test', async() => {
        const res = await getMyPartnershipCompaniesWithMyCompany({ myCompanyId: undefined })
        expect(res.error).toEqual('自社情報がありません。ログインし直してください。')
    })

    it('success test', async() => {

        _getPartnerCompaniesOfTargetCompany({
            companyId: myCompanyId,
            options: { companyPartnership: { params: { companyId: myCompanyId } }, connectedCompany: { params: { myCompanyId }, companyPartnership: { params: { companyId: myCompanyId } } } },
        })
        _getCompany({ companyId: myCompanyId })

        const getPartnerCompaniesUrl = __getEmulatorFunctionsURI('ICompany-getPartnerCompaniesOfTargetCompany')
        const getCompanyUrl = __getEmulatorFunctionsURI('ICompany-getCompany')

        const result = await getMyPartnershipCompaniesWithMyCompany({ myCompanyId })
        const companies = result.success || []

        expect(mockAxios.history.post[0].url).toEqual(getPartnerCompaniesUrl);
        expect(mockAxios.history.post[1].url).toEqual(getCompanyUrl);
        expect(companies.length).toEqual(2);
        expect(companies[0].name).toEqual('Test');
        expect(companies[1].name).toEqual('NARUTO');
      })

    it('error test', async () => {
        const getPartnerCompaniesUrl = __getEmulatorFunctionsURI('ICompany-getPartnerCompaniesOfTargetCompany')
        const getCompanyUrl = __getEmulatorFunctionsURI('ICompany-getCompany')

        mockAxios.onPost(getPartnerCompaniesUrl).networkError();
        mockAxios.onPost(getCompanyUrl).networkError();
        
        const result = await getMyPartnershipCompaniesWithMyCompany({ myCompanyId })
        const companies = result.success || []
        
        expect(mockAxios.history.post[0].url).toEqual(getPartnerCompaniesUrl);
        expect(mockAxios.history.post[1].url).toEqual(getCompanyUrl);
        expect(result.error).toEqual('顧客/取引先または自社情報を取得できません。');
      })
})

describe('getMyPartnershipCompanies case', () => {
    
    it('myCompanyId = undefined test', async() => {
        const res = await getMyPartnershipCompanies({ myCompanyId: undefined })
        expect(res.error).toEqual('自社情報がありません。ログインし直してください。')
    })

    it('success test', async() => {

        _getPartnerCompaniesOfTargetCompany({
            companyId: myCompanyId,
            options: { companyPartnership: { params: { companyId: myCompanyId } }, connectedCompany: { params: { myCompanyId }, companyPartnership: { params: { companyId: myCompanyId } } } },
        })

        const getPartnerCompaniesUrl = __getEmulatorFunctionsURI('ICompany-getPartnerCompaniesOfTargetCompany')

        const result = await getMyPartnershipCompanies({ myCompanyId })
        const companies = result.success || []

        expect(mockAxios.history.post[0].url).toEqual(getPartnerCompaniesUrl);
        expect(companies.length).toEqual(1);
        expect(companies[0].name).toEqual('NARUTO');
      })

    it('error test', async () => {
        const getPartnerCompaniesUrl = __getEmulatorFunctionsURI('ICompany-getPartnerCompaniesOfTargetCompany')

        mockAxios.onPost(getPartnerCompaniesUrl).networkError();
        
        const result = await getMyPartnershipCompanies({ myCompanyId })
        const companies = result.success || []
        
        expect(mockAxios.history.post[0].url).toEqual(getPartnerCompaniesUrl);
        expect(result.error).toEqual('顧客/取引先を取得できません。');
      })
})

