import mockAxios from "../../../__mocks__/mockAxios";
import { _getSite } from "../../../__mocks__/services/SiteService";
import { _getWorker } from "../../../__mocks__/services/WorkerService";
import { __getEmulatorFunctionsURI } from "../../../src/services/firebase/FunctionsService";
import { getSiteWithManagerWorkerAndCompany } from "../../../src/usecases/site/CommonSiteCase";

afterEach(() => {
    mockAxios.reset();
    mockAxios.resetHistory();
});

const getSiteUrl = __getEmulatorFunctionsURI('ISite-getSite')
const updateSiteUrl = __getEmulatorFunctionsURI('ISite-updateSite')
const createSiteUrl = __getEmulatorFunctionsURI('ISite-createSite')
const deleteSiteUrl = __getEmulatorFunctionsURI('ISite-deleteSite')
const getWorkerUrl = __getEmulatorFunctionsURI('IWorker-getWorker')


describe('getSiteWithManagerWorkerAndCompany case', () => {
    
    it('siteId = undefined test', async() => {
        const res = await getSiteWithManagerWorkerAndCompany({ siteId: undefined })
        expect(res.error).toEqual('現場情報がありません。')
    })

    it('success test', async() => {

        _getSite({
            siteId: 'site-id',
            options: {
                siteNameData: true,
                managerWorker: true,
                construction: {
                    contract: {
                        orderCompany: true
                    }
                }
            }
        })
        _getWorker({ workerId: 'manage-worker-id', options: { account: true } })
    
        const res = await getSiteWithManagerWorkerAndCompany({ siteId: 'site-id' })
        console.log(res);
        
        expect(mockAxios.history.post[0].url).toEqual(getSiteUrl);
        expect(mockAxios.history.post[1].url).toEqual(getWorkerUrl);        
        expect(res.success?.site.siteId).toEqual('site-id')
        expect(res.success?.worker?.workerId).toEqual('manage-worker-id')
        expect(res.success?.construction?.constructionId).toEqual('construction-id')
        expect(res.success?.company?.companyId).toEqual('order-company-id')
      })

    it('error test 1', async () => {
        mockAxios.onPost(getSiteUrl).networkError();

        const res = await getSiteWithManagerWorkerAndCompany({ siteId: 'site-id' })

        expect(mockAxios.history.post[0].url).toEqual(getSiteUrl);
        expect(res.error).toEqual('現場情報を取得できません。');
      })

    it('error test 2', async () => {
        _getSite({
            siteId: 'site-id',
            options: {
                siteNameData: true,
                managerWorker: true,
                construction: {
                    contract: {
                        orderCompany: true
                    }
                }
            }
        })
        mockAxios.onPost(getWorkerUrl).networkError();

        const res = await getSiteWithManagerWorkerAndCompany({ siteId: 'site-id' })

        expect(mockAxios.history.post[0].url).toEqual(getSiteUrl);
        expect(mockAxios.history.post[1].url).toEqual(getWorkerUrl);        
        expect(res.error).toEqual('作業責任者情報を取得できません。');
      })

})
