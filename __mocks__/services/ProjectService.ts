import { ProjectModel, ProjectType } from "../../src/models/project/Project"
import { GetProjectListByIdsParam, GetProjectListOfTargetCompanyParam, GetProjectParam, GetProjectResponse } from "../../src/services/project/ProjectService"
import { __getEmulatorFunctionsURI, _callFunctions } from "../../src/services/firebase/FunctionsService"
import mockAxios from "../mockAxios"


export const _createProject = (project: ProjectModel) => {
    
    const createProjectUrl = __getEmulatorFunctionsURI('IProject-createProject')

    mockAxios
    .onPost(createProjectUrl, project)
    .reply(200, {
        success: project.projectId
    })
}

export const _updateProject = (project: ProjectModel) => {
    
    const updateProjectUrl = __getEmulatorFunctionsURI('IProject-updateProject')

    mockAxios
    .onPost(updateProjectUrl, project)
    .reply(200, {
        success: project.projectId
    })
}

export const _getProject = (params: GetProjectParam) => {
    
    const getProjectUrl = __getEmulatorFunctionsURI('IProject-getProject')
    
    mockAxios
    .onPost(getProjectUrl, params)
    .reply(200, {
        success: {
            "projectId": params.projectId,
            "imageColorHue": 114,
            "name": "Test",
            "createCompanyId": "company-id",
            "updateWorkerId": "worker-id",
            "startDate": 1670684400000,
            "isFakeCompanyManage": false,
            "createdAt": 1670736223000,
            "projectRelatedCompanyIds": [
                "company-id-2"
            ],
            "endDate": 1676041200000,
            "updatedAt": 1673425181000
        }
    })
}


export const _deleteProject = (projectId: string) => {
    
    const Url = __getEmulatorFunctionsURI('IProject-deleteProject')
    
    mockAxios
    .onPost(Url, projectId)
    .reply(200, {
        success: true
    })
}

export const _getProjectListOfTargetCompany = async (params: GetProjectListOfTargetCompanyParam) => {
    const Url = __getEmulatorFunctionsURI('IProject-getProjectListOfTargetCompany')

    mockAxios
    .onPost(Url, params)
    .reply(200, {
        success: [
            {
                "imageColorHue": 42,
                "endDate": 1679065200000,
                "name": "Test",
                "createCompanyId": "create-company-id",
                "updateWorkerId": "updateWorkerId",
                "projectId": "project-id",
                "createdAt": 1676681765000,
                "startDate": 1673967600000,
                "projectRelatedCompanyIds": [
                    "projectRelatedCompanyId1",
                    "projectRelatedCompanyId2"
                ],
                "updatedAt": 1677282991000
            },
        ]
    })

}

export const _getProjectListByIds = (params: GetProjectListByIdsParam) => {
    const Url = __getEmulatorFunctionsURI('IProject-getProjectListByIds')

    mockAxios
    .onPost(Url, params)
    .reply(200, {
        success: params.projectIds.map((projectId,i) => ({
                "projectId": projectId,
                "name": "Test "+i,
                "createCompanyId": "create-company-id",
                "updateWorkerId": "update-worker-id",
                "startDate": 1673967600000,
                "endDate": 1679065200000,
                "projectRelatedCompanyIds": [
                    "projectRelatedCompanyId1",
                    "projectRelatedCompanyId2"
                ],
            })
        )
    })

}