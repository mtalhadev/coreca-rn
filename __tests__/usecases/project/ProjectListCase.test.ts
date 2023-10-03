import mockAxios from "../../../__mocks__/mockAxios";
import { _getPartnerCompaniesOfTargetCompany } from "../../../__mocks__/services/CompanyService";
import { _createConstruction, _getProjectConstructionListOfTargetProject } from "../../../__mocks__/services/ConstructionService";
import { _createContract, _getContractListOfTargetCompany } from "../../../__mocks__/services/ContractService";
import { _checkCompanyPlan } from "../../../__mocks__/services/PlanTicketService";
import { _createProject, _getProject, _getProjectListByIds, _getProjectListOfTargetCompany, _updateProject } from "../../../__mocks__/services/ProjectService";
import { getDailyStartTime, newCustomDate, toCustomDateFromTotalSeconds } from "../../../src/models/_others/CustomDate";
import { ProjectModel } from "../../../src/models/project/Project";
import { __getEmulatorFunctionsURI } from "../../../src/services/firebase/FunctionsService";
import { writeMyProjectParam, writeMyProject, getMyCompanyProjects } from "../../../src/usecases/project/MyProjectCase";
import { getProjectListOfTargetCompany } from "../../../src/usecases/project/ProjectListCase";

const getPartnerCompaniesUrl = __getEmulatorFunctionsURI('ICompany-getPartnerCompaniesOfTargetCompany')
const getContractListUrl = __getEmulatorFunctionsURI('IContract-getContractListOfTargetCompany')
const getProjectListByIdsUrl = __getEmulatorFunctionsURI('IProject-getProjectListByIds')

afterEach(() => {
    mockAxios.reset();
    mockAxios.resetHistory()
});

describe('writeMyProject case', () => {
    
    it('companyId = undefined test', async() => {
        const res = await getProjectListOfTargetCompany({ companyId: undefined })
        expect(res.error).toEqual('idが足りません。')
    })


    it('success test', async() => {

        _getPartnerCompaniesOfTargetCompany({
            companyId: 'company-id',
        })        
        _getContractListOfTargetCompany({
            companyId: 'company-id',
            types: ['all'],
            options: {
                orderCompany: {
                    companyPartnership: {
                        params: {
                            companyId: 'company-id',
                        },
                    },
                },
                receiveCompany: {
                    companyPartnership: {
                        params: {
                            companyId: 'company-id',
                        },
                    },
                },
            },
        })
        _getProjectListByIds({
            projectIds: ['project-id'],
            options: {
                projectConstructions: {
                    constructionRelation: {
                        params: {
                            companyId: 'company-id',
                        },
                    },
                    constructionMeter: { params: { companyId: 'company-id' } },
                    displayName: true,
                },
            },
        })
        
        const res = await getProjectListOfTargetCompany({ companyId: 'company-id' })
        
        expect(mockAxios.history.post.length).toEqual(3);
        expect(mockAxios.history.post[0].url).toEqual(getPartnerCompaniesUrl);
        expect(mockAxios.history.post[1].url).toEqual(getContractListUrl);
        expect(mockAxios.history.post[2].url).toEqual(getProjectListByIdsUrl);
      })

    it('error test 1', async () => {
       mockAxios.onPost(getPartnerCompaniesUrl).networkError();

       const res = await getProjectListOfTargetCompany({ companyId: 'company-id' })

        expect(mockAxios.history.post[0].url).toEqual(getPartnerCompaniesUrl);
        expect(res.error).toEqual('Network Error');
      })

    it('error test 2', async () => {
        _getPartnerCompaniesOfTargetCompany({
            companyId: 'company-id',
        })        
        mockAxios.onPost(getContractListUrl).networkError();

        const res = await getProjectListOfTargetCompany({ companyId: 'company-id' })

        expect(mockAxios.history.post[0].url).toEqual(getPartnerCompaniesUrl);
        expect(res.error).toEqual('Network Error');
      })

    it('error test 3', async () => {
        _getPartnerCompaniesOfTargetCompany({
            companyId: 'company-id',
        })       
        _getContractListOfTargetCompany({
            companyId: 'company-id',
            types: ['all'],
            options: {
                orderCompany: {
                    companyPartnership: {
                        params: {
                            companyId: 'company-id',
                        },
                    },
                },
                receiveCompany: {
                    companyPartnership: {
                        params: {
                            companyId: 'company-id',
                        },
                    },
                },
            },
        })
 
        mockAxios.onPost(getProjectListByIdsUrl).networkError();

        const res = await getProjectListOfTargetCompany({ companyId: 'company-id' })

        expect(mockAxios.history.post[0].url).toEqual(getPartnerCompaniesUrl);
        expect(res.error).toEqual('Network Error');
      })
})

