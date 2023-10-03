import mockAxios from "../../../__mocks__/mockAxios";
import { _createCompany, _getCompany, _getPartnerCompaniesOfTargetCompany, _updateCompany } from "../../../__mocks__/services/CompanyService";
import { CompanyModel } from "../../../src/models/company/Company";
import { __getEmulatorFunctionsURI } from "../../../src/services/firebase/FunctionsService";
import { WriteMyCompanyParam, getMyCompany, writeMyCompany } from "../../../src/usecases/company/MyCompanyCase";

afterEach(() => {
    mockAxios.reset();
    mockAxios.resetHistory();
});

let params: WriteMyCompanyParam = {
    myCompanyId: "my-company-id", 
    image: { uri: 'https://image', width: 100, height: 100, cancelled: false }, 
    name: 'Test', 
    address: 'ABCD', 
    imageColorHue: 232, 
    industry: "ABC", 
    phoneNumber: '0123456789',
    myWorkerId: 'my-worker-id',
}

describe('writeMyCompany case', () => {
    
    it('myCompanyId = undefined test', async() => {
        const res = await writeMyCompany({ ...params, myCompanyId: undefined })
        expect(res.error).toEqual('自社情報がありません。ログインし直してください。')
    })

    it('empty name test', async() => {
        const res = await writeMyCompany({ ...params, name: "" })
        expect(res.error).toEqual('情報が足りません。')
    })

    it('success test', async() => {

        _getCompany({ companyId: params.myCompanyId || 'no-id' })
        _createCompany({ ...params } as CompanyModel)
        _updateCompany({ ...params } as CompanyModel)

        const getCompanyUrl = __getEmulatorFunctionsURI('ICompany-getCompany')
        const updateCompanyUrl = __getEmulatorFunctionsURI('ICompany-updateCompany')
        const createCompanyUrl = __getEmulatorFunctionsURI('ICompany-createCompany')

        const res = await writeMyCompany(params)
        console.log(res);
        
        expect(mockAxios.history.post.length).toEqual(2);
        expect(mockAxios.history.post[0].url).toEqual(getCompanyUrl);
        expect(mockAxios.history.post[1].url).toEqual(updateCompanyUrl);
      })

    it('error test 1', async () => {
        const getCompanyUrl = __getEmulatorFunctionsURI('ICompany-getCompany')

        mockAxios.onPost(getCompanyUrl).networkError();

        const res = await writeMyCompany(params)

        expect(mockAxios.history.post[0].url).toEqual(getCompanyUrl);
        expect(res.error).toEqual('会社の作成に失敗しました。');
      })

    it('error test 2', async () => {
        const getCompanyUrl = __getEmulatorFunctionsURI('ICompany-getCompany')
        const updateCompanyUrl = __getEmulatorFunctionsURI('ICompany-updateCompany')

        _getCompany({ companyId: params.myCompanyId || 'no-id' })

        mockAxios.onPost(updateCompanyUrl).networkError();

        const res = await writeMyCompany(params)

        expect(mockAxios.history.post[0].url).toEqual(getCompanyUrl);
        expect(mockAxios.history.post[1].url).toEqual(updateCompanyUrl);
        expect(res.error).toEqual('会社のアップデートに失敗しました。');
      })
})


describe('getMyCompany case', () => {
    
    it('myCompanyId = undefined test', async() => {
        const res = await getMyCompany({ myCompanyId: undefined })
        expect(res.error).toEqual('自社情報がありません。ログインし直してください。')
    })

    it('success test', async() => {

        _getCompany({ companyId: params.myCompanyId || 'no-id' })

        const getCompanyUrl = __getEmulatorFunctionsURI('ICompany-getCompany')

        const res = await getMyCompany({ myCompanyId: params.myCompanyId })
        console.log(res);
        
        expect(mockAxios.history.post[0].url).toEqual(getCompanyUrl);
        expect(res.success?.name).toEqual('Test')
      })

    it('error test', async () => {
        const getCompanyUrl = __getEmulatorFunctionsURI('ICompany-getCompany')

        mockAxios.onPost(getCompanyUrl).networkError();

        const res = await getMyCompany({ myCompanyId: params.myCompanyId })

        expect(mockAxios.history.post[0].url).toEqual(getCompanyUrl);
        expect(res.error).toEqual('Network Error');
      })

})


