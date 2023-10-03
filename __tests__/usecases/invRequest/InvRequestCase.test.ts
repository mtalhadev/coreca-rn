import mockAxios from "../../../__mocks__/mockAxios";
import { _deleteInvRequest, _getInvRequest, _updateInvRequest } from "../../../__mocks__/services/InvRequestService";
import { getSiteMeterOption } from "../../../src/models/site/SiteMeterType";
import { __getEmulatorFunctionsURI } from "../../../src/services/firebase/FunctionsService";
import { WriteInvRequestParam, deleteInvRequest, getInvRequestDetail, writeInvRequest } from "../../../src/usecases/invRequest/invRequestCase";

afterEach(() => {
    mockAxios.reset();
    mockAxios.resetHistory();
});

let params: WriteInvRequestParam = {
    invRequestId: 'inv-request-id',
    workerCount: 10,
    isFakeCompany: false,
    myCompanyId: 'my-company-id'

}
const getInvRequestUrl = __getEmulatorFunctionsURI('IInvRequest-getInvRequest')
const updateInvRequestUrl = __getEmulatorFunctionsURI('IInvRequest-updateInvRequest')
const createInvRequestUrl = __getEmulatorFunctionsURI('IInvRequest-createInvRequest')
const deleteInvRequestUrl = __getEmulatorFunctionsURI('IInvRequest-deleteInvRequest')
const getInvRequestListOfTargetInvRequestUrl = __getEmulatorFunctionsURI('IInvRequest-getInvRequestListOfTargetInvRequest')
const updateProjectUrl = __getEmulatorFunctionsURI('IProject-updateProject')
const updateConstructionUrl = __getEmulatorFunctionsURI('IConstruction-updateConstruction')

describe('writeInvRequest case', () => {
    
    it('success test', async() => {
        _updateInvRequest({
            invRequest: {
                invRequestId: params.invRequestId,
                workerCount: params.workerCount,
                isApplication: params.isFakeCompany ? true : false,
                isApproval: params.isFakeCompany ? true : 'waiting',
            },
        })        
        const res = await writeInvRequest(params)

        expect(mockAxios.history.post.length).toEqual(1);
        expect(mockAxios.history.post[0].url).toEqual(updateInvRequestUrl);
      })

    it('error test 1', async () => {

        mockAxios.onPost(updateInvRequestUrl).networkError();

        const res = await writeInvRequest(params)

        expect(mockAxios.history.post[0].url).toEqual(updateInvRequestUrl);
        expect(res.error).toEqual('Network Error');
      })
})


describe('getInvRequestDetail case', () => {
    
    it('success test', async() => {

        _getInvRequest({
            invRequestId: params.invRequestId ?? 'no-id',
            options: {
                invReservation: {
                    construction: true,
                },
                targetCompany: {
                    lastDeal: {
                        params: {
                            myCompanyId: params.myCompanyId,
                        },
                    },
                    companyPartnership: {
                        params: {
                            companyId: params.myCompanyId,
                        },
                    },
                },
                myCompany: {
                    lastDeal: {
                        params: {
                            myCompanyId: params.myCompanyId,
                        },
                    },
                    companyPartnership: {
                        params: {
                            companyId: params.myCompanyId,
                        },
                    },
                },
                site: {
                    construction: true,
                    ...getSiteMeterOption(params.myCompanyId ?? 'no-id'),
                    siteRelation: {
                        params: {
                            companyId: params.myCompanyId ?? 'no-id',
                        },
                    },
                    siteNameData: true,
                },
            },
        })

        const res = await getInvRequestDetail({ invRequestId: params.invRequestId, myCompanyId: params.myCompanyId })
        console.log(res);
        
        expect(mockAxios.history.post[0].url).toEqual(getInvRequestUrl);
        expect(res.success?.invRequestId).toEqual(params.invRequestId)
      })

    it('error test', async () => {
        mockAxios.onPost(getInvRequestUrl).networkError();

        const res = await getInvRequestDetail({ invRequestId: params.invRequestId, myCompanyId: params.myCompanyId })

        expect(mockAxios.history.post[0].url).toEqual(getInvRequestUrl);
        expect(res.error).toEqual('Network Error');
      })

})

describe('deleteInvRequest case', () => {
    
    it('success test', async() => {

        _deleteInvRequest({ invRequestId: params.invRequestId || 'no-id'})

        const res = await deleteInvRequest({ invRequestId: params.invRequestId || 'no-id' })
        console.log(res);
        
        expect(mockAxios.history.post[0].url).toEqual(deleteInvRequestUrl);
        expect(res.success).toEqual(true)
      })

    it('error test', async () => {
        mockAxios.onPost(deleteInvRequestUrl).networkError();

        const res = await deleteInvRequest({ invRequestId: params.invRequestId || 'no-id' })

        expect(mockAxios.history.post[0].url).toEqual(deleteInvRequestUrl);
        expect(res.error).toEqual('Network Error');
      })

})

