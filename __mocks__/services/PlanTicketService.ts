import { PlanTicketModel, PlanTicketType } from "../../src/models/_others/PlanTicket"
import { CheckCompanyPlanParam, GetPlanTicketParam, GetPlanTicketResponse, } from "../../src/services/_others/PlanTicketService"
import { GetPartnerCompaniesOfTargetCompanyParam } from "../../src/services/company/CompanyService"
import { __getEmulatorFunctionsURI, _callFunctions } from "../../src/services/firebase/FunctionsService"
import mockAxios from "../mockAxios"


export const _createPlanTicket = (planTicket: PlanTicketModel) => {
    
    const createPlanTicketUrl = __getEmulatorFunctionsURI('IPlanTicket-createPlanTicket')

    mockAxios
    .onPost(createPlanTicketUrl, planTicket)
    .reply(200, {
        success: planTicket.planTicketId
    })
}

export const _updatePlanTicket = (planTicket: PlanTicketModel) => {
    
    const updatePlanTicketUrl = __getEmulatorFunctionsURI('IPlanTicket-updatePlanTicket')
    mockAxios
    .onPost(updatePlanTicketUrl, planTicket)
    .reply(200, {
        success: planTicket.planTicketId
    })
}

export const _getPlanTicket = (params: GetPlanTicketParam) => {
    
    const getPlanTicketUrl = __getEmulatorFunctionsURI('IPlanTicket-getPlanTicket')
    
    mockAxios
    .onPost(getPlanTicketUrl, params)
    .reply(200, {
        success: {
            "planTicketId": params.planTicketId,
            "imageColorHue": 226,
            "name": "Test",
            "isFake": true,
            "createdAt": 1680685040000,
            "updatedAt": 1684346409000,
            "displayName": "Test PlanTicket"
        }
    })
}

export const _checkCompanyPlan = (params: CheckCompanyPlanParam) => {
    const Url = __getEmulatorFunctionsURI('IPlanTicket-checkCompanyPlan')

    mockAxios
    .onPost(Url, params)
    .reply(200, {
        success: true
    })
}