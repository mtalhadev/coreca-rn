import { ConstructionModel, ConstructionType } from "../../src/models/construction/Construction"
import { GetConstructionParam, GetConstructionRelationTypeParam, GetConstructionResponse, GetProjectConstructionListOfTargetProjectParam } from "../../src/services/construction/ConstructionService"
import { __getEmulatorFunctionsURI, _callFunctions } from "../../src/services/firebase/FunctionsService"
import mockAxios from "../mockAxios"


export const _createConstruction = (construction: ConstructionModel) => {
    
    const createConstructionUrl = __getEmulatorFunctionsURI('IConstruction-createConstruction')
    const newConstruction: ConstructionType = {
        constructionId: construction.constructionId,
        contractId: construction.contractId,
        name: construction.name,
        offDaysOfWeek: construction.offDaysOfWeek,
        otherOffDays: construction.otherOffDays,
        requiredWorkerNum: construction.requiredWorkerNum,
        remarks: construction.remarks,
        siteMeetingTime: construction.siteMeetingTime,
        siteStartTime: construction.siteStartTime,
        siteStartTimeIsNextDay: construction.siteStartTimeIsNextDay,
        siteEndTime: construction.siteEndTime,
        siteEndTimeIsNextDay: construction.siteEndTimeIsNextDay,
        siteRequiredNum: construction.siteRequiredNum,
        siteAddress: construction.siteAddress,
        siteBelongings: construction.siteBelongings,
        siteRemarks: construction.siteRemarks,
        updateWorkerId: construction.updateWorkerId,
        projectId: construction.projectId,
        /**
         * 仮会社へ常用で送った場合に、自動作成される工事と紐づくInvReservationのId
         */
        fakeCompanyInvReservationId: construction.fakeCompanyInvReservationId,
        }

    mockAxios
    .onPost(createConstructionUrl, newConstruction)
    .reply(200, {
        success: construction.constructionId
    })
}

export const _updateConstruction = (construction: ConstructionModel) => {
    
    const updateConstructionUrl = __getEmulatorFunctionsURI('IConstruction-updateConstruction')
    const newConstruction: ConstructionType = {
        constructionId: construction.constructionId,
        contractId: construction.contractId,
        name: construction.name,
        offDaysOfWeek: construction.offDaysOfWeek,
        otherOffDays: construction.otherOffDays,
        requiredWorkerNum: construction.requiredWorkerNum,
        remarks: construction.remarks,
        siteMeetingTime: construction.siteMeetingTime,
        siteStartTime: construction.siteStartTime,
        siteStartTimeIsNextDay: construction.siteStartTimeIsNextDay,
        siteEndTime: construction.siteEndTime,
        siteEndTimeIsNextDay: construction.siteEndTimeIsNextDay,
        siteRequiredNum: construction.siteRequiredNum,
        siteAddress: construction.siteAddress,
        siteBelongings: construction.siteBelongings,
        siteRemarks: construction.siteRemarks,
        updateWorkerId: construction.updateWorkerId,
        projectId: construction.projectId,
        fakeCompanyInvReservationId: construction.fakeCompanyInvReservationId,
    }
    mockAxios
    .onPost(updateConstructionUrl, newConstruction)
    .reply(200, {
        success: construction.constructionId
    })
}

export const _getConstruction = (params: GetConstructionParam) => {
    
    const getConstructionUrl = __getEmulatorFunctionsURI('IConstruction-getConstruction')
    
    mockAxios
    .onPost(getConstructionUrl, { ...params })
    .reply(200, {
        success: {
            "endDate": 1668153600000,
            "contractId": "contract-id",
            "name": "Test",
            "updateWorkerId": "",
            "constructionId": params.constructionId,
            "projectId": "",
            "startDate": 1665471600000,
            "createdAt": 1668062487000,
            "requiredWorkerNum": 10,
            "updatedAt": 1684778410000,
            "siteMeetingTime": 1665471600000,
            "project": {
                "imageColorHue": 189,
                "endDate": 1668153600000,
                "name": "ABC",
                "createCompanyId": "",
                "updateWorkerId": "",
                "projectId": "",
                "startDate": 1665471600000,
                "isFakeCompanyManage": false,
                "createdAt": 1665553113000,
                "updatedAt": 1665553119000
            },
            "contract": {
                "contractAt": 1665553109000,
                "contractId": "",
                "orderCompanyId": "",
                "receiveCompanyId": "",
                "projectId": "",
                "createdAt": 1665553116000,
                "updatedAt": 1665553121000,
                "orderDepartments": null
            },
            "constructionRelation": "owner",
            "displayName": "ABC / Test"
        }
    })
}

export const _deleteConstruction = (constructionId: string) => {
    
    const Url = __getEmulatorFunctionsURI('IConstruction-deleteConstruction')
    
    mockAxios
    .onPost(Url, constructionId)
    .reply(200, {
        success: true
    })
}

export const _getConstructionRelationType = async (params: GetConstructionRelationTypeParam) => {
    
    const Url = __getEmulatorFunctionsURI('IConstruction-getConstructionRelationType')
    
    mockAxios
    .onPost(Url, params)
    .reply(200, {
        "success": "manager"
    })
}

export const _getProjectConstructionListOfTargetProject = async (
    params: GetProjectConstructionListOfTargetProjectParam,
) => {
    const Url = __getEmulatorFunctionsURI('IConstruction-getProjectConstructionListOfTargetProject')
    mockAxios
    .onPost(Url, params)
    .reply(200, {
        "success": {
            totalConstructions: [],
            topConstruction: 1,
            intermediateConstructions:[],
            bottomConstructions:[],  
        }
    })
}
