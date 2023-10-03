import mockAxios from "../../../__mocks__/mockAxios";
import { _getSiteOfTargetFakeCompanyInvRequestId } from "../../../__mocks__/services/SiteService";
import { __getEmulatorFunctionsURI } from "../../../src/services/firebase/FunctionsService";
import { getSiteListOfTargetInvRequestIds } from "../../../src/usecases/site/SiteListCase";

const getSiteOfTargetFakeCompanyInvRequestIdUrl = __getEmulatorFunctionsURI('ISite-getSiteOfTargetFakeCompanyInvRequestId')

afterEach(() => {
    mockAxios.reset();
    mockAxios.resetHistory()
});

describe('getSiteListOfTargetInvRequestIds case', () => {
    
    it('invRequestIds = undefined test', async() => {
        const res = await getSiteListOfTargetInvRequestIds({ invRequestIds: undefined })
        expect(res.error).toEqual('invRequestIdsがありません')
    })


    it('success test', async() => {
        _getSiteOfTargetFakeCompanyInvRequestId({ fakeCompanyInvRequestId: 'inv-request-id' })
        
        const res = await getSiteListOfTargetInvRequestIds({ invRequestIds: ['inv-request-id'] })
        
        expect(mockAxios.history.post.length).toEqual(1);
        expect(mockAxios.history.post[0].url).toEqual(getSiteOfTargetFakeCompanyInvRequestIdUrl);
      })

    it('error test', async () => {
       mockAxios.onPost(getSiteOfTargetFakeCompanyInvRequestIdUrl).networkError();
        
       const res = await getSiteListOfTargetInvRequestIds({ invRequestIds: ['inv-request-id'] })

        expect(mockAxios.history.post[0].url).toEqual(getSiteOfTargetFakeCompanyInvRequestIdUrl);
        expect(res.error).toEqual('Network Error');
      })
})

