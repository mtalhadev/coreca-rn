import mockAxios from "../../../__mocks__/mockAxios";
import { _getCompanyListOfTargetConstruction } from "../../../__mocks__/services/CompanyService";
import { _createConstruction, _getConstruction } from "../../../__mocks__/services/ConstructionService";
import { _getRequest } from "../../../__mocks__/services/RequestService";
import { _createSite, _deleteSite, _getSite, _getSiteListOfTargetConstructionAndDate, _getSiteMeterOfTargetSite, _updateSite } from "../../../__mocks__/services/SiteService";
import { combineTimeAndDay, getYYYYMMDDTotalSeconds, newCustomDate, nextDay, toCustomDateFromTotalSeconds } from "../../../src/models/_others/CustomDate";
import { __getEmulatorFunctionsURI } from "../../../src/services/firebase/FunctionsService";
import { WriteConstructionSiteParam, deleteConstructionSite, getConstructionSiteForEdit, getSiteDetail, writeConstructionSite } from "../../../src/usecases/site/MySiteCase";
import { GetSiteDetailParam } from "../../../src/usecases/site/MySiteInstructionCase";
import { DEFAULT_SITE_END_TIME, DEFAULT_SITE_START_TIME } from "../../../src/utils/Constants";

afterEach(() => {
    mockAxios.reset();
    mockAxios.resetHistory();
});

let params: WriteConstructionSiteParam = {
    siteId: "site-id", 
    myCompanyId: 'my-company-id',
    constructionId: "construction-id",
    date: toCustomDateFromTotalSeconds(1665529245000),
    startTime: toCustomDateFromTotalSeconds(1665529245000),
    siteStartTimeIsNextDay: false,
    endTime: toCustomDateFromTotalSeconds(1665561645000),
    siteEndTimeIsNextDay: false,
    meetingTime: toCustomDateFromTotalSeconds(1665529245000),
    requiredNum: 1,
    managerWorkerId: "manager-worker-id",
    address: "",
    belongings: "",
    remarks: "",
    constructionRelation: "manager"
}

const getSiteUrl = __getEmulatorFunctionsURI('ISite-getSite')
const updateSiteUrl = __getEmulatorFunctionsURI('ISite-updateSite')
const createSiteUrl = __getEmulatorFunctionsURI('ISite-createSite')
const getConstructionUrl = __getEmulatorFunctionsURI('IConstruction-getConstruction')
const createConstructionUrl = __getEmulatorFunctionsURI('IConstruction-createConstruction')
const deleteSiteUrl = __getEmulatorFunctionsURI('ISite-deleteSite')
const deleteSiteForSpanUrl = __getEmulatorFunctionsURI('ISite-deleteSiteForSpan')
const getSiteListUrl = __getEmulatorFunctionsURI('ISite-getSiteListOfTargetConstructionAndDate')
const getCompanyListUrl = __getEmulatorFunctionsURI('ICompany-getCompanyListOfTargetConstruction')
const getRequestUrl = __getEmulatorFunctionsURI('IRequest-getRequest')
const getSiteMeterOfTargetSiteUrl = __getEmulatorFunctionsURI('ISite-getSiteMeterOfTargetSite')

// describe('writeConstructionSite case', () => {
    
//     it('myCompanyId = undefined test', async() => {
//         const res = await writeConstructionSite({ ...params, myCompanyId: undefined })
//         expect(res.error).toEqual('自社情報がありません。')
//     })

//     it('siteId = undefined test', async() => {
//         const res = await writeConstructionSite({ ...params, siteId: undefined })
//         expect(res.error).toEqual('現場IDがありません。')
//     })

//     it('constructionId = undefined test', async() => {
//         const res = await writeConstructionSite({ ...params, constructionId: undefined })
//         expect(res.error).toEqual('工事情報がありません。')
//     })

//     it('date = undefined test', async() => {
//         const res = await writeConstructionSite({ ...params, date: undefined })
//         expect(res.error).toEqual('情報が足りません。')
//     })

//     it('success test', async() => {
//         _getSiteListOfTargetConstructionAndDate({ constructionId: "construction-id", date: getYYYYMMDDTotalSeconds(params.date || newCustomDate()) })
//         _getCompanyListOfTargetConstruction({
//             constructionId: 'construction-id',
//             types: ['manager'],
//         }),
//         _updateSite({ 
//             siteId: params.siteId,
//             constructionId: params.constructionId,
//             startDate: combineTimeAndDay(params.startTime ?? DEFAULT_SITE_START_TIME, nextDay(params.date||newCustomDate(), params.siteStartTimeIsNextDay ? 1 : 0))?.totalSeconds,
//             endDate: combineTimeAndDay(params.endTime ?? DEFAULT_SITE_END_TIME, nextDay(params.date||newCustomDate(), params.siteEndTimeIsNextDay ? 1 : 0))?.totalSeconds,
//             meetingDate: combineTimeAndDay(params.meetingTime, params.date)?.totalSeconds,
//             requiredNum: params.requiredNum,
//             managerWorkerId: params.managerWorkerId,
//             address: params.address,
//             belongings: params.belongings,
//             remarks: params.remarks,
//             siteDate: combineTimeAndDay(params.meetingTime, params.date)?.totalSeconds,
//          })

//         const res = await writeConstructionSite({ ...params })
//         console.log(res);
        
//         expect(mockAxios.history.post.length).toEqual(3);
//         expect(mockAxios.history.post[0].url).toEqual(getSiteListUrl);
//         expect(mockAxios.history.post[1].url).toEqual(getCompanyListUrl);
//         expect(mockAxios.history.post[2].url).toEqual(updateSiteUrl);
//       })

//     it('error test', async () => {
//         mockAxios.onPost(getSiteListUrl).networkError();

//         const res = await writeConstructionSite({ ...params })

//         expect(mockAxios.history.post[0].url).toEqual(getSiteListUrl);
//         expect(res.error).toEqual(`工事: undefined /現場: Network Error / 会社: Request failed with status code 404`);
//       })

//     it('error test 2', async () => {
//         _getSiteListOfTargetConstructionAndDate({ constructionId: "construction-id", date: getYYYYMMDDTotalSeconds(params.date || newCustomDate()) })
//         _getCompanyListOfTargetConstruction({
//             constructionId: 'construction-id',
//             types: ['manager'],
//         }),
//         mockAxios.onPost(updateSiteUrl).networkError();

//         const res = await writeConstructionSite({ ...params })

//         expect(mockAxios.history.post[0].url).toEqual(getSiteListUrl);
//         expect(res.error).toEqual(`現場のアップデートに失敗しました。`);
//       })
// })


describe('deleteConstructionSite case', () => {
    
    it('siteId = undefined test', async() => {
        const res = await deleteConstructionSite({ siteId: undefined })
        expect(res.error).toEqual('現場IDがありません。')
    })

    it('success test', async() => {

        _deleteSite(params.siteId || 'no-id')

        const res = await deleteConstructionSite({ siteId: 'site-id' })
        console.log(res);
        
        expect(mockAxios.history.post[0].url).toEqual(deleteSiteUrl);
        expect(res.success).toEqual(true)
      })

    it('error test', async () => {
        mockAxios.onPost(deleteSiteUrl).networkError();

        const res = await deleteConstructionSite({ siteId: 'site-id' })

        expect(mockAxios.history.post[0].url).toEqual(deleteSiteUrl);
        expect(res.error).toEqual('Network Error');
      })

})

describe('getConstructionSiteForEdit case', () => {
    
    it('siteId = undefined test', async() => {
        const res = await getConstructionSiteForEdit({ siteId: undefined })
        expect(res.error).toEqual('現場IDがありません。')
    })

    it('success test', async() => {

        _getSite({
            siteId: 'site-id',
            options: {
                construction: {
                    contract: {
                        orderDepartments: true,
                        receiveDepartments: true,
                    },
                },
            },
        })
        const res = await getConstructionSiteForEdit({ siteId: params.siteId })
        console.log(res);
        
        expect(mockAxios.history.post[0].url).toEqual(getSiteUrl);
      })

    it('error test', async () => {
        mockAxios.onPost(getSiteUrl).networkError();

        const res = await getConstructionSiteForEdit({ siteId: params.siteId })

        expect(mockAxios.history.post[0].url).toEqual(getSiteUrl);
        expect(res.error).toEqual('Network Error');
      })

})

const siteDetailParams: GetSiteDetailParam = {
    siteId: 'site-id',
    myCompanyId: "my-company-id",
    myWorkerId: "my-worker-id",
    requestId: "request-id",
}
describe('getSiteDetail case', () => {
    
    it('siteId = undefined test', async() => {
        const res = await getSiteDetail({ ...siteDetailParams, siteId: undefined })
        expect(res.error).toEqual('現場IDがありません。')
    })
    it('myWorkerId = undefined test', async() => {
        const res = await getSiteDetail({ ...siteDetailParams, myWorkerId: undefined })
        expect(res.error).toEqual('認証情報がありません。')
    })
    it('myCompanyId = undefined test', async() => {
        const res = await getSiteDetail({ ...siteDetailParams, myCompanyId: undefined})
        expect(res.error).toEqual('自社IDがありません。')
    })

    it('success test', async() => {
        _getRequest({
            requestId: 'request-id',
            options: {
                company: {
                    companyPartnership: {
                        params: {
                            companyId: 'my-company-id',
                        },
                    },
                },
                requestMeter: true,
            },
        })
        _getSite({
            siteId: 'site-id',
            options: {
                siteRelation: {
                    params: {
                        companyId: 'my-company-id',
                    },
                },
                siteNameData: true,
                managerWorker: {
                    account: true,
                },
                construction: {
                    constructionRelation: { params: { companyId: 'my-company-id' } },
                    displayName: true,
                    constructionMeter: { params: { companyId: 'my-company-id' } },
                    project: true,
                    contract: {
                        receiveDepartments: true,
                    }
                },
                siteCompanies: {
                    companyPartnership: {
                        params: {
                            companyId: 'my-company-id',
                        },
                    },
                    params: {
                        types: ['order', 'manager'],
                    },
                },
            },
        })
        _getSiteMeterOfTargetSite({
            siteId: 'site-id',
            companyId: 'my-company-id',
        })

        const res = await getSiteDetail({ ...siteDetailParams })
        console.log(res);
        
        expect(mockAxios.history.post.length).toEqual(3);
        expect(mockAxios.history.post[0].url).toEqual(getRequestUrl);
        expect(mockAxios.history.post[1].url).toEqual(getSiteUrl);
        expect(mockAxios.history.post[2].url).toEqual(getSiteMeterOfTargetSiteUrl);
        expect(res.success?.site?.siteId).toEqual('site-id')
      })

    it('error test', async () => {
        mockAxios.onPost(getRequestUrl).networkError();

        const res = await getSiteDetail({ ...siteDetailParams })

        expect(mockAxios.history.post[0].url).toEqual(getRequestUrl);
        expect(res.error).toEqual('Network Error');
      })
})


