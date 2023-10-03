import { Create, Update } from '../../models/_others/Common'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { PaidAction, PlanTicketModel, PlanTicketType } from '../../models/_others/PlanTicket'
import { getErrorMessage } from './ErrorService'
import { _getCurrentUser, _signInWithEmailAndPassword } from '../firebase/AuthService'
import { _callFunctions } from '../firebase/FunctionsService'
import ENV from '../../../env/env'

export const _createPlanTicket = async (planTicket: Create<PlanTicketModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IPlanTicket-createPlanTicket', planTicket)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetPlanTicketParam = {
    planTicketId: string
}

export type GetPlanTicketResponse = PlanTicketType | undefined

export const _getPlanTicket = async (params: GetPlanTicketParam): Promise<CustomResponse<GetPlanTicketResponse>> => {
    try {
        const result = await _callFunctions('IPlanTicket-getPlanTicket', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export const _updatePlanTicket = async (planTicket: Update<PlanTicketModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IPlanTicket-updatePlanTicket', planTicket)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export const _deletePlanTicket = async (planTicketId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IPlanTicket-deletePlanTicket', planTicketId)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type CheckCompanyPlanParam = {
    companyId: string
    action: PaidAction
}

export const _checkCompanyPlan = async (params: CheckCompanyPlanParam): Promise<CustomResponse<boolean>> => {
    try {
        if (ENV.IS_PLAN_TICKET_AVAILABLE) {
            const result = await _callFunctions('IPlanTicket-checkCompanyPlan', params)
            if (result.error) {
                throw {...result}
            }
            return Promise.resolve({
                success: result.success
            })    
        } else {
            return Promise.resolve({
                success: true
            })    
        }
    } catch (error: any) {
        return getErrorMessage(error)
    }
}