import { InvReservationModel } from "../../src/models/invReservation/InvReservation"
import { __getEmulatorFunctionsURI } from "../../src/services/firebase/FunctionsService"
import { GetInvReservationParam } from "../../src/services/invReservation/InvReservationService"
import mockAxios from "../mockAxios"


export const _createInvReservation = async (params: InvReservationModel) => {
    
    const createInvReservationUrl = __getEmulatorFunctionsURI('IInvReservation-createInvReservation')

    mockAxios
    .onPost(createInvReservationUrl, params)
    .reply(200, {
        success: params.invReservationId
    })
}

export const _updateInvReservation = async (params: InvReservationModel) => {
    
    const updateInvReservationUrl = __getEmulatorFunctionsURI('IInvReservation-updateInvReservation')
    mockAxios
    .onPost(updateInvReservationUrl, params)
    .reply(200, {
        success: params.invReservationId
    })
}

export const _getInvReservation = (params: GetInvReservationParam) => {
    
    const getInvReservationUrl = __getEmulatorFunctionsURI('IInvReservation-getInvReservation')
    
    mockAxios
    .onPost(getInvReservationUrl, params)
    .reply(200, {
        success: {
            invReservationId: params.invReservationId,
            targetCompanyId: "target-company-id",
            myCompanyId: "my-company-id",
            isApproval: true,
            isApplication: true,//申請準備
            workerIds: [],
            date: 1686322800000,
            workerCount: 10,
            updateWorkerId: "",
            attendanceIds: [],
            relatedInvReservationIds: [],   
        }
    })
}

export const _deleteInvReservation = (InvReservationId: string) => {
    
    const Url = __getEmulatorFunctionsURI('IInvReservation-deleteInvReservation')
    
    mockAxios
    .onPost(Url, InvReservationId)
    .reply(200, {
        success: true
    })
}
