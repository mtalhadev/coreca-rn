import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { __getEmulatorFunctionsURI, _callFunctions } from "../../../src/services/firebase/FunctionsService";
import { GetCompanyParam } from "../../../src/services/company/CompanyService";
import { GetWorkerParam } from "../../../src/services/worker/WorkerService";
import { GetOwnerWorkerOfTargetCompanyParam } from "../../../src/services/worker/WorkerService";

let mock: MockAdapter;

beforeAll(() => {
    mock = new MockAdapter(axios, { delayResponse: 2000 });
});
afterEach(() => {
    mock.reset();
    mock.resetHistory()
});

let companyId='company-id', 
myCompanyId='my-company-id', 
workerId='worker-id',
myWorkerId='worker-id';

describe('getAnyCompany case', () => {
    
    it('getAnyCompany success test', async() => {

        const getCompanyUrl = __getEmulatorFunctionsURI('ICompany-getCompany')
        mock.onPost(getCompanyUrl).reply(200, {
            success: {
                companyId: 'company-id',
            }
        })
        const getWorkerUrl = __getEmulatorFunctionsURI('IWorker-getWorker')
        mock.onPost(getWorkerUrl).reply(200, {
            success: {
                workerId: 'worker-id',
            }
        })

        let params: GetCompanyParam = {
            companyId: companyId,
            options: { companyPartnership: { params: { companyId: myCompanyId } } }
        }
        const result = await _callFunctions('ICompany-getCompany', params)

        let params2: GetWorkerParam = {
            workerId: workerId
        }
        const result2 = await _callFunctions('IWorker-getWorker', params2)

        expect(mock.history.post[0].url).toEqual(getCompanyUrl);
        expect(result.success.companyId).toEqual(companyId);
        expect(mock.history.post[1].url).toEqual(getWorkerUrl);
        expect(result2.success.workerId).toEqual(workerId);
      })

    it('getAnyCompany error test', async () => {
        const getCompanyUrl = __getEmulatorFunctionsURI('ICompany-getCompany')
        const getWorkerUrl = __getEmulatorFunctionsURI('IWorker-getWorker')

        mock.onPost(getCompanyUrl).networkError();
        mock.onPost(getWorkerUrl).networkError();
        
        let params: GetCompanyParam = {
            companyId: 'company-id'
        }
        const result = await _callFunctions('ICompany-getCompany', params)

        let params2: GetWorkerParam = {
            workerId: 'worker-id'
        }
        const result2 = await _callFunctions('IWorker-getWorker', params2)
        
        expect(mock.history.post[0].url).toEqual(getCompanyUrl);
        expect(result.error).toEqual('Network Error');
        expect(mock.history.post[1].url).toEqual(getWorkerUrl);
        expect(result2.error).toEqual('Network Error');
      })
})

describe('getAnyCompanyProfileWithOwnerWorker case', () => {
    
    it('getAnyCompanyProfileWithOwnerWorker success test', async() => {
        
        const getWorkerUrl = __getEmulatorFunctionsURI('IWorker-getOwnerWorkerOfTargetCompany')
        mock.onPost(getWorkerUrl).reply(200, {
            success: {
                workerId: 'worker-id',
            }
        })
        const getCompanyUrl = __getEmulatorFunctionsURI('ICompany-getCompany')
        mock.onPost(getCompanyUrl).reply(200, {
            success: {
                companyId: 'company-id',
            }
        })

        let params: GetOwnerWorkerOfTargetCompanyParam = {
                companyId,
                options: {
                    workerTags: {
                        params: {
                            myCompanyId,
                            myWorkerId,
                        },
                    },
                    account: true,
                },
        }
        const result = await _callFunctions('IWorker-getOwnerWorkerOfTargetCompany', params)

        let params2: GetCompanyParam = {
                companyId,
                options: {
                    companyPartnership: { params: { companyId: myCompanyId } },
                    connectedCompany: {
                        params: { myCompanyId },
                        companyPartnership: {
                            params: {
                                companyId: myCompanyId,
                            },
                        },
                    },
                    lastDeal: {
                    params: {
                        myCompanyId,
                    },
                },
                planTicket: true,
                departments: true,
            },
        }
        const result2 = await _callFunctions('ICompany-getCompany', params2)

        const ownerResult = result
        const companyResult = result2

        expect(mock.history.post[0].url).toEqual(getWorkerUrl);
        expect(ownerResult.success.workerId).toEqual(workerId);
        expect(mock.history.post[1].url).toEqual(getCompanyUrl);
        expect(companyResult.success.companyId).toEqual(companyId);
      })

    it('getAnyCompanyProfileWithOwnerWorker error test', async () => {
        const getWorkerUrl = __getEmulatorFunctionsURI('IWorker-getOwnerWorkerOfTargetCompany')
        const getCompanyUrl= __getEmulatorFunctionsURI('ICompany-getCompany')

        mock.onPost(getWorkerUrl).networkError();
        mock.onPost(getCompanyUrl).networkError();
        
        let params: GetOwnerWorkerOfTargetCompanyParam = {
            companyId,
            options: {
                workerTags: {
                    params: {
                        myCompanyId,
                        myWorkerId,
                    },
                },
                account: true,
            },
        }
        const result = await _callFunctions('IWorker-getOwnerWorkerOfTargetCompany', params)

        let params2: GetCompanyParam = {
                companyId,
                options: {
                    companyPartnership: { params: { companyId: myCompanyId } },
                    connectedCompany: {
                        params: { myCompanyId },
                        companyPartnership: {
                            params: {
                                companyId: myCompanyId,
                            },
                        },
                    },
                    lastDeal: {
                    params: {
                        myCompanyId,
                    },
                },
                planTicket: true,
                departments: true,
            },
        }
        const result2 = await _callFunctions('ICompany-getCompany', params2)
        
        const ownerResult = result
        const companyResult = result2

        expect(mock.history.post[0].url).toEqual(getWorkerUrl);
        expect(ownerResult.error).toEqual('Network Error');
        expect(mock.history.post[1].url).toEqual(getCompanyUrl);
        expect(companyResult.error).toEqual('Network Error');
    })
})