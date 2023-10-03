import { InvRequestType } from "../../src/models/invRequest/InvRequestType"
import { __getEmulatorFunctionsURI } from "../../src/services/firebase/FunctionsService"
import { CreateInvRequestParam, DeleteInvRequestParam, GetInvRequestListOfTargetDateAndCompanyParam, GetInvRequestListOfTargetSiteParam, GetInvRequestParam, UpdateInvRequestParam } from "../../src/services/invRequest/InvRequestService"
import mockAxios from "../mockAxios"


export const _createInvRequest = async (params: CreateInvRequestParam) => {
    
    const createInvRequestUrl = __getEmulatorFunctionsURI('IInvRequest-createInvRequest')

    mockAxios
    .onPost(createInvRequestUrl, params)
    .reply(200, {
        success: params.invRequest.invRequestId
    })
}

export const _updateInvRequest = async (params: UpdateInvRequestParam) => {
    
    const updateInvRequestUrl = __getEmulatorFunctionsURI('IInvRequest-updateInvRequest')
    mockAxios
    .onPost(updateInvRequestUrl, params)
    .reply(200, {
        success: params.invRequest.invRequestId
    })
}

export const _getInvRequest = (params: GetInvRequestParam) => {
    
    const getInvRequestUrl = __getEmulatorFunctionsURI('IInvRequest-getInvRequest')
    
    mockAxios
    .onPost(getInvRequestUrl, params)
    .reply(200, {
        success: {
            invRequestId: params.invRequestId,
            invReservationId: "in-reservation-id",
            targetCompanyId: "target-company-id",
            myCompanyId: "my-company-id",
            isApproval: true,
            isApplication: true,//申請準備
            workerIds: [],
            date: 1686322800000,
            workerCount: 10,
            updateWorkerId: "",
            attendanceIds: [],
            relatedInvRequestIds: [],   
        } as InvRequestType
    })
}

export const _deleteInvRequest = (params: DeleteInvRequestParam) => {
    
    const Url = __getEmulatorFunctionsURI('IInvRequest-deleteInvRequest')
    
    mockAxios
    .onPost(Url, params)
    .reply(200, {
        success: true
    })
}

export const _getInvRequestListOfTargetInvReservation = (params: GetInvRequestListOfTargetSiteParam) => {
    
    const getInvRequestUrl = __getEmulatorFunctionsURI('IInvRequest-getInvRequestListOfTargetInvReservation')
    
    mockAxios
    .onPost(getInvRequestUrl, params)
    .reply(200, {
        success: {
            items: [
                {
                    invRequestId: 'inv-request-id',
                    invReservationId: params.invReservationId,
                    targetCompanyId: "target-company-id",
                    myCompanyId: "my-company-id",
                    isApproval: true,
                    isApplication: true,//申請準備
                    workerIds: [],
                    date: 1671684400000,
                    workerCount: 10,
                    updateWorkerId: "",
                    attendanceIds: [],
                    relatedInvRequestIds: [],   
        
                }
            ]
        }
    })
}

export const _getInvRequestListOfTargetDateAndCompany = (params: GetInvRequestListOfTargetDateAndCompanyParam) => {
    
    const getInvRequestUrl = __getEmulatorFunctionsURI('IInvRequest-getInvRequestListOfTargetDateAndCompany')
    
    mockAxios
    .onPost(getInvRequestUrl, params)
    .reply(200, {
        success: {
            items: [
                {
                    invRequestId: 'inv-request-id',
                    invReservationId: 'inv-reservation-id',
                    targetCompanyId: "target-company-id",
                    myCompanyId: "my-company-id",
                    isApproval: true,
                    isApplication: true,//申請準備
                    workerIds: [],
                    date: 1671684400000,
                    workerCount: 10,
                    updateWorkerId: "",
                    attendanceIds: [],
                    relatedInvRequestIds: [],   
        
                }
            ]
        }
    })
}
