import mockAxios from "../../../__mocks__/mockAxios";
import { _createConstruction, _getProjectConstructionListOfTargetProject } from "../../../__mocks__/services/ConstructionService";
import { _createContract } from "../../../__mocks__/services/ContractService";
import { _checkCompanyPlan } from "../../../__mocks__/services/PlanTicketService";
import { _createProject, _getProject, _getProjectListOfTargetCompany, _updateProject } from "../../../__mocks__/services/ProjectService";
import { getDailyStartTime, newCustomDate, toCustomDateFromTotalSeconds } from "../../../src/models/_others/CustomDate";
import { ProjectModel } from "../../../src/models/project/Project";
import { __getEmulatorFunctionsURI } from "../../../src/services/firebase/FunctionsService";
import { writeMyProjectParam, writeMyProject, getMyCompanyProjects } from "../../../src/usecases/project/MyProjectCase";

const getProjectUrl = __getEmulatorFunctionsURI('IProject-getProject')
const getProjectRelationTypeUrl = __getEmulatorFunctionsURI('IProject-getProjectRelationType')
const updateProjectUrl = __getEmulatorFunctionsURI('IProject-updateProject')
const createProjectUrl = __getEmulatorFunctionsURI('IProject-createProject')
const checkCompanyPlanUrl = __getEmulatorFunctionsURI('IPlanTicket-checkCompanyPlan')
const getProjectConstructionListOfTargetProjectUrl = __getEmulatorFunctionsURI('IConstruction-getProjectConstructionListOfTargetProject')
const getProjectListOfTargetCompanyUrl = __getEmulatorFunctionsURI('IProject-getProjectListOfTargetCompany')


afterEach(() => {
    mockAxios.reset();
    mockAxios.resetHistory()
});

let params: writeMyProjectParam = {
    projectId: "project-id",
    myCompanyId: "my-company-id",
    myWorkerId: "my-worker-id",
    name: "Test",
    imageColorHue: 114,
    startDate: toCustomDateFromTotalSeconds(1670684400000),
    endDate: toCustomDateFromTotalSeconds(1676041200000),
    orderCompanyId:  "my-company-id",
    receiveCompanyId:  "receiveCompanyId",
    constructionName:  "ABC",
    imageUrl:  "",
    sImageUrl:  "",
    xsImageUrl:  "",
    image: { uri: 'https://image', width: 100, height: 100, cancelled: false }, 
    siteAddress: "",
    receiveDepartmentIds: [],

    // 外部指定用。なければ自動付与
    contractId:  "",
    constructionId:  "",

    // 速度改善のために案件・工事・現場作成フロー時のみチャット・ルームを遅らせて作成
    mode:  "",
}

const newProject: ProjectModel = {
    projectId: "project-id",
    updateWorkerId: "my-worker-id",
    name: 'Test',
    startDate: getDailyStartTime(params.startDate ?? newCustomDate()).totalSeconds,
    endDate: getDailyStartTime(params.endDate ?? newCustomDate()).totalSeconds,
    imageUrl:  "",
    sImageUrl:  "",
    xsImageUrl:  "",
    imageColorHue: 114,
    siteAddress: "",
}

describe('writeMyProject case', () => {
    
    it('myCompanyId = undefined test', async() => {
        const res = await writeMyProject({ ...params, myCompanyId: undefined })
        expect(res.error).toEqual('自社情報がありません。ログインし直してください。')
    })

    it('myWorkerId = undefined test', async() => {
        const res = await writeMyProject({ ...params, myWorkerId: undefined })
        expect(res.error).toEqual('自社情報がありません。ログインし直してください。')
    })


    it('mode === undefined || mode !== create success test', async() => {

        _getProject({ projectId: params.projectId || 'no-id' })
        _getProjectConstructionListOfTargetProject({ projectId: 'project-id' })
        _checkCompanyPlan({
            companyId: 'my-company-id',
            action: 'create-project',
        })        
        // _getSiteListOfTargetProject({ projectId: params.projectId || 'no-id' })
        // _createProject({ ...params } as ProjectModel)
        _updateProject({ ...params } as ProjectModel)

        const res = await writeMyProject(params)
        console.log(res);
        
        expect(mockAxios.history.post.length).toEqual(3);
        expect(mockAxios.history.post[0].url).toEqual(getProjectConstructionListOfTargetProjectUrl);
        expect(mockAxios.history.post[1].url).toEqual(getProjectUrl);
        expect(mockAxios.history.post[2].url).toEqual(updateProjectUrl);
      })

    it('mode === create success test', async() => {

        _getProject({ projectId: params.projectId || 'no-id' })
        _getProjectConstructionListOfTargetProject({ projectId: 'project-id' })
        _checkCompanyPlan({
            companyId: 'my-company-id',
            action: 'create-project',
        })        
        _createProject({ ...newProject, createCompanyId: params.myCompanyId })
        const res = await writeMyProject({ ...params, mode: 'create' })
        console.log(res);
        
        expect(mockAxios.history.post.length).toEqual(1);
        expect(mockAxios.history.post[0].url).toEqual(createProjectUrl);
      })

    it('error test 1', async () => {
        _getProject({ projectId: params.projectId || 'no-id' })
        _getProjectConstructionListOfTargetProject({ projectId: 'project-id' })
        
       mockAxios.onPost(createProjectUrl).networkError();

       const res = await writeMyProject({ ...params, mode: 'create' })

        // expect(mockAxios.history.post[0].url).toEqual(createProjectUrl);
        expect(res.error).toEqual('Network Error');
      })

    it('error test 2', async () => {
        _getProject({ projectId: params.projectId || 'no-id' })
        _getProjectConstructionListOfTargetProject({ projectId: 'project-id' })
        _checkCompanyPlan({
            companyId: 'my-company-id',
            action: 'create-project',
        })        
       _createProject({ ...newProject, createCompanyId: params.myCompanyId })

        const res = await writeMyProject({ ...params, mode: 'create', orderCompanyId: undefined })

        // expect(mockAxios.history.post[0].url).toEqual(createProjectUrl);
        expect(res.error).toEqual('CompanyIdがありません。');
      })
})


describe('getMyCompanyProjects case', () => {
    
    it('success test', async() => {

        _getProjectListOfTargetCompany({ companyId: params.myCompanyId || 'no-id' })

        const res = await getMyCompanyProjects({ myCompanyId: params.myCompanyId || 'no-id' })
        console.log(res);
        
        expect(mockAxios.history.post[0].url).toEqual(getProjectListOfTargetCompanyUrl);
        expect(res.success).toBeDefined()
        if(res.success) {
            expect(res.success.length).toEqual(1)
            expect(res.success[0].name).toEqual('Test')
        }
      })

    it('error test', async () => {
        mockAxios.onPost(getProjectListOfTargetCompanyUrl).networkError();

        const res = await getMyCompanyProjects({ myCompanyId: params.myCompanyId || 'no-id' })

        expect(mockAxios.history.post[0].url).toEqual(getProjectListOfTargetCompanyUrl);
        expect(res.error).toEqual('Network Error');
      })

})


