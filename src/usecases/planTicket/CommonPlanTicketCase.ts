import { _getLocationPermission, _getPushPermission } from '../../services/_others/PermissionService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { PlanTicketCLType, PlanTicketModel } from '../../models/_others/PlanTicket'
import { _getCompany, _updateCompany } from '../../services/company/CompanyService'
import { CustomDate, newCustomDate, toCustomDateFromString, toCustomDateFromTotalSeconds } from "../../models/_others/CustomDate"
import { _createPlanTicket, _getPlanTicket, _updatePlanTicket } from '../../services/_others/PlanTicketService'
import { isNoValueObject } from '../../utils/Utils'
import { deleteFieldParam } from '../../services/firebase/FirestoreService'

export type WritePlanTicketParam = {
    myCompanyId?: string
    myWorkerId?: string

    /**
     * 開発中は自動的にプレミアムチケットが発行される。
     */
    forDev?: boolean
} & PlanTicketCLType

export type WritePlanTicketResponse = 'update' | 'create' | undefined

export const writePlanTicket = async (params: WritePlanTicketParam): Promise<CustomResponse<WritePlanTicketResponse>> => {
    try {
        const { myCompanyId, myWorkerId, paidPlan, forDev, planEndDate, planStartDate, planTicketId } = params
        if (!forDev && myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }
        if (planTicketId == undefined || paidPlan == undefined || planStartDate == undefined) {
            throw {
                error: '情報が足りません。',
                errorCode: 'LESS_INFO'
            } as CustomResponse
        }

        if (!forDev) {
            const myCompanyResult = await _getCompany({
                companyId: myCompanyId ?? 'no-id'
            })
            if (myCompanyResult.error) {
                throw {
                    error: myCompanyResult.error,
                    errorCode: 'GET_MY_COMPANY_ERROR'
                }
            }
        }
        
        const hasPlanEndDate = planEndDate != undefined
        if (hasPlanEndDate && planStartDate.totalSeconds >= planEndDate.totalSeconds) {
            throw {
                error: '開始は終了よりも前にする必要があります。',
                errorCode: 'DATE_ERROR'
            }
        }

        const exist = await _getPlanTicket({ planTicketId })
        
        if (exist.error) {
            throw {
                error: exist.error,
                errorCode: 'GET_PLAN_TICKET_ERROR'
            }
        }
        const newPlanTicket: PlanTicketModel = {
            planTicketId,
            paidPlan,
            planStartDate: planStartDate.totalSeconds,
            planEndDate: planEndDate?.totalSeconds
        }

        if (!isNoValueObject(exist.success)) {
            const companyResult = await _updatePlanTicket(newPlanTicket)
            if (companyResult.error) {
                throw {
                    error: companyResult.error,
                    errorCode: 'UPDATE_PLAN_TICKET_ERROR'
                }
            }
            return Promise.resolve({
                success: 'update',
            })
        } else {
            const companyResult = await _createPlanTicket(newPlanTicket)
            if (companyResult.error) {
                throw {
                    error: companyResult.error,
                    errorCode: 'CREATE_PLAN_TICKET_ERROR'
                }
            }
            return Promise.resolve({
                success: 'create',
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}



export type ApplyPlanTicketParam = {
    myCompanyId?: string
    planTicketId: string
}

export const applyPlanTicket = async (params: ApplyPlanTicketParam): Promise<CustomResponse> => {
    try {
        const { myCompanyId, planTicketId } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }
        if (planTicketId == undefined) {
            throw {
                error: '情報が足りません。',
                errorCode: 'LESS_INFO'
            } as CustomResponse
        }

        const [myCompanyResult, planTicketResult] = await Promise.all([_getCompany({
            companyId: myCompanyId
        }), _getPlanTicket({
            planTicketId
        })])
        if (myCompanyResult.error) {
            throw {
                error: myCompanyResult.error,
                errorCode: 'GET_MY_COMPANY_ERROR'
            }
        }
        if (planTicketResult.error) {
            throw {
                error: planTicketResult.error,
                errorCode: 'GET_PLAN_TICKET_ERROR'
            }
        }
        if (myCompanyResult.success == undefined || planTicketResult.success == undefined) {
            throw {
                error: 'データが存在しません。',
                errorCode: 'DATA_ERROR'
            }
        }
        if (planTicketResult.success.companyId != undefined) {
            throw {
                error: 'このプランチケットはすでに使用されています。',
                errorCode: 'TICKET_USED'
            }
        }

        const [companyResult, ticketResult, preTicketResult] = await Promise.all([_updateCompany({
            planTicketId,
            companyId: myCompanyId
        }), _updatePlanTicket({
            planTicketId,
            companyId: myCompanyId
        }), 
        /**
         * すでにプランを適用していた場合元のプランの会社IDを消す。そうすることで再度使用できるようになる。
         */
        myCompanyResult.success.planTicketId != undefined ? _updatePlanTicket({
            planTicketId: myCompanyResult.success.planTicketId,
            companyId: deleteFieldParam()
        }) : undefined])
        if (companyResult.error) {
            throw {
                error: companyResult.error,
                errorCode: 'APPLY_ERROR'
            }
        }
        if (ticketResult.error) {
            throw {
                error: ticketResult.error,
                errorCode: 'APPLY_ERROR'
            }
        }
        if (preTicketResult?.error) {
            throw {
                error: preTicketResult.error,
                errorCode: 'PRE_TICKET_ERROR'
            }
        }
        
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}


export type CheckPlanTicketValidParam = {
    planTicketId: string
}

export const checkPlanTicketValid = async (params: CheckPlanTicketValidParam): Promise<CustomResponse<boolean>> => {
    try {
        const { planTicketId } = params
        if (planTicketId == undefined) {
            throw {
                error: '情報が足りません。',
                errorCode: 'LESS_INFO'
            } as CustomResponse
        }

        const result = await _getPlanTicket({
            planTicketId
        })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: 'GET_TICKET_ERROR'
            }
        }
        const planTicket = result.success
        if (planTicket == undefined) {
            return Promise.resolve({
                success: false
            })
        }
        /**
         * 有効期限チェック
         */
        const today = newCustomDate()
        const planStartDateText = planTicket.planStartDate ? toCustomDateFromTotalSeconds(planTicket.planStartDate) : undefined
        if (planStartDateText == undefined) {
            throw {
                error: 'planStartDateがありません',
                errorCode: 'TICKET_DATA_ERROR'
            }
        }
        const planEndDateText = planTicket.planEndDate ? toCustomDateFromTotalSeconds(planTicket.planEndDate) : undefined
        if (planEndDateText) {
            if (planStartDateText?.totalSeconds <= today.totalSeconds && today.totalSeconds <= planEndDateText?.totalSeconds) {
                return Promise.resolve({
                    success: true,
                })
            }
        } else {
            if (planStartDateText?.totalSeconds <= today.totalSeconds) {
                return Promise.resolve({
                    success: true,
                })
            }
        }
        return Promise.resolve({
            success: false
        })
        
    } catch (error) {
        return getErrorMessage(error)
    }
}