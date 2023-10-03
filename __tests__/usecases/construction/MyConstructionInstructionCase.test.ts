import mockAxios from "../../../__mocks__/mockAxios";
import { _createConstruction, _getConstruction, _getConstructionRelationType, _updateConstruction } from "../../../__mocks__/services/ConstructionService";
import { _getProject, _updateProject } from "../../../__mocks__/services/ProjectService";
import { _getSiteListOfTargetConstruction } from "../../../__mocks__/services/SiteService";
import { toCustomDateFromTotalSeconds } from "../../../src/models/_others/CustomDate";
import { ConstructionModel } from "../../../src/models/construction/Construction";
import { __getEmulatorFunctionsURI } from "../../../src/services/firebase/FunctionsService";
import { getMyTotalConstruction, writeMyConstruction } from "../../../src/usecases/construction/MyConstructionCase";
import { WriteMyConstructionInstructionParam, writeMyConstructionInstruction } from "../../../src/usecases/construction/MyConstructionInstructionCase";

afterEach(() => {
    mockAxios.reset();
    mockAxios.resetHistory()
});

let params: WriteMyConstructionInstructionParam = {
    instructionId: 'instruction-id',
    constructionId: 'construction-id',
    updateWorkerId: 'worker-id',
    myCompanyId: 'my-company-id',
    contractId: 'contract-id',
    construction: {
        "contractId": "contract-id",
        "name": "Test",
        "updateWorkerId": "worker-id",
        "constructionId": "construction-id",
        "projectId": "project-id",
        "requiredWorkerNum": 10,
    },
    project: {
        'projectId': 'project-id',
        "imageColorHue": 189,
        "endDate": toCustomDateFromTotalSeconds(1668153600000),
        "name": "ABC",
        "createCompanyId": "",
        "updateWorkerId": "",
        "startDate": toCustomDateFromTotalSeconds(1665471600000),
        "isFakeCompanyManage": false,
    },
}

const getConstructionUrl = __getEmulatorFunctionsURI('IConstruction-getConstruction')
const getConstructionRelationTypeUrl = __getEmulatorFunctionsURI('IConstruction-getConstructionRelationType')
const updateConstructionUrl = __getEmulatorFunctionsURI('IConstruction-updateConstruction')
const createConstructionUrl = __getEmulatorFunctionsURI('IConstruction-createConstruction')
const getSiteListOfTargetConstructionUrl = __getEmulatorFunctionsURI('ISite-getSiteListOfTargetConstruction')
const getProjectUrl = __getEmulatorFunctionsURI('IProject-getProject')
const updateProjectUrl = __getEmulatorFunctionsURI('IProject-updateProject')

describe('writeMyConstructionInstruction case', () => {
    
    it('constructionId = undefined test', async() => {
        const res = await writeMyConstructionInstruction({ ...params, constructionId: undefined })
        expect(res.error).toEqual('idがありません。')
    })

    it('myCompanyId = undefined test', async() => {
        const res = await writeMyConstructionInstruction({ ...params, myCompanyId: undefined })
        expect(res.error).toEqual('自社情報がありません。ログインし直してください。')
    })

    it('success test', async() => {

        _getConstruction({ constructionId: params.constructionId || 'no-id' })
        _getConstructionRelationType({ constructionId: params.constructionId || 'no-id', companyId: params.myCompanyId || 'no-id' })
        _getSiteListOfTargetConstruction({ constructionId: params.constructionId || 'no-id' })
        _getProject({ projectId: params.project?.projectId || 'no-id' })
        _updateProject({ projectId: params.project?.projectId || 'no-id', startDate: params.project?.startDate?.totalSeconds, endDate: params.project?.endDate?.totalSeconds })
        _createConstruction({ ...params } as ConstructionModel)
        _updateConstruction({ ...params } as ConstructionModel)

        const res = await writeMyConstructionInstruction(params)
        console.log(res);

        expect(mockAxios.history.post.length).toEqual(7);
        expect(mockAxios.history.post[0].url).toEqual(getSiteListOfTargetConstructionUrl);
        expect(mockAxios.history.post[1].url).toEqual(getProjectUrl);
        expect(mockAxios.history.post[2].url).toEqual(updateProjectUrl);
        expect(mockAxios.history.post[3].url).toEqual(getConstructionUrl);
        expect(mockAxios.history.post[4].url).toEqual(getConstructionRelationTypeUrl);
      })

    it('error test 1', async () => {
        mockAxios.onPost(getSiteListOfTargetConstructionUrl).networkError();

        const res = await writeMyConstructionInstruction(params)

        expect(mockAxios.history.post[0].url).toEqual(getSiteListOfTargetConstructionUrl);
        expect(res.error).toEqual('Network Error');
      })

    it('error test 2', async () => {

        _getSiteListOfTargetConstruction({ constructionId: params.constructionId || 'no-id' })
        _getProject({ projectId: params.project?.projectId || 'no-id' })
        _updateProject({ projectId: params.project?.projectId || 'no-id', startDate: params.project?.startDate?.totalSeconds, endDate: params.project?.endDate?.totalSeconds })

        mockAxios.onPost(getConstructionUrl).networkError();

        const res = await writeMyConstructionInstruction(params)

        expect(mockAxios.history.post[0].url).toEqual(getSiteListOfTargetConstructionUrl);
        expect(mockAxios.history.post[1].url).toEqual(getProjectUrl);
        expect(mockAxios.history.post[2].url).toEqual(updateProjectUrl);
        expect(mockAxios.history.post[3].url).toEqual(getConstructionUrl);
        expect(res.error).toEqual('指示の作成に失敗しました。');
      })
})


describe('getMyTotalConstruction case', () => {
    
    it('id = undefined test', async() => {
        const res = await getMyTotalConstruction({ id: undefined })
        expect(res.error).toEqual('idが足りません。')
    })

    it('success test', async() => {

        _getConstruction({
            constructionId: 'construction-id',
            options: {
                project: true,
                sites: true,
                displayName: true,
                constructionRelation: {
                    params: {
                        companyId: 'my-company-id',
                    },
                },
                updateWorker: {
                    company: true,
                },
                contract: {
                    orderCompany: {
                        companyPartnership: {
                            params: {
                                companyId: 'my-company-id',
                            },
                        },
                    },
                    receiveCompany: {
                        companyPartnership: {
                            params: {
                                companyId: 'my-company-id',
                            },
                        },
                    },
                    superConstruction: {
                        displayName: true,
                        constructionRelation: {
                            params: {
                                companyId: 'my-company-id',
                            },
                        },
                        contract: {
                            orderDepartments: true,
                        },
                    },
                    orderDepartments: true,
                    receiveDepartments: true,
                },
                constructionMeter: { params: { companyId: 'my-company-id' } },
                subContract: {
                    orderCompany: {
                        companyPartnership: {
                            params: {
                                companyId: 'my-company-id',
                            },
                        },
                    },
                    receiveCompany: {
                        companyPartnership: {
                            params: {
                                companyId: 'my-company-id',
                            },
                        },
                    },
                    orderDepartments: true,
                    receiveDepartments: true,
                },
            },
        })

        const res = await getMyTotalConstruction({ id: params.constructionId || 'no-id' })
        console.log(res);
        
        expect(mockAxios.history.post[0].url).toEqual(getConstructionUrl);
      })

    it('error test', async () => {
        
        const getConstructionUrl = __getEmulatorFunctionsURI('IConstruction-getConstruction')

        mockAxios.onPost(getConstructionUrl).networkError();

        const res = await getMyTotalConstruction({ id: params.constructionId })

        expect(mockAxios.history.post[0].url).toEqual(getConstructionUrl);
        expect(res.error).toEqual('工事がありません。');
      })

})


