const invert = require('lodash/invert')
import { match } from 'ts-pattern'
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from './Common'
import { CustomDate, toCustomDateFromTotalSeconds } from './CustomDate'
import { TotalSeconds } from './TotalSeconds'
import { ID } from './ID'

/**
 * @param paidPlan - 課金プラン
 * @param planStartDateText - プラン開始日（例： '2020/08/01'）。必ず存在する。
 * @param planEndDateText - プラン終了日（例： '2020/09/01'）。存在しない場合は続いていく。
 * @param companyId - 使用している会社Id。存在すれば使用中となり、存在しなければ使用していないとする。一度に1社しか使用できない。
 */
export type PlanTicketModel = Partial<{
    planTicketId: ID
    paidPlan: PaidPlanType
    planStartDate: TotalSeconds
    planEndDate: TotalSeconds
    companyId: ID
}> &
    CommonModel

export const initPlanTicket = (planTicket: Create<PlanTicketModel> | Update<PlanTicketModel>): Update<PlanTicketModel> => {
    const newPlanTicket: Update<PlanTicketModel> = {
        planTicketId: planTicket.planTicketId,
        paidPlan: planTicket.paidPlan,
        planStartDate: planTicket.planStartDate,
        planEndDate: planTicket.planEndDate,
        companyId: planTicket.companyId,
    }
    return newPlanTicket
}

export type PlanTicketType = PlanTicketModel & {
    //
}
export type PlanTicketCLType = ReplaceAnd<
    PlanTicketType,
    {
        planStartDate?: CustomDate
        planEndDate?: CustomDate
    } & CommonCLType
>

export const toPlanTicketCLType = (data?: PlanTicketType): PlanTicketCLType => {
    if (data == undefined) {
        return {}
    }
    return {
        ...data,
        ...toCommonCLType(data),
        planStartDate: data?.planStartDate ? toCustomDateFromTotalSeconds(data?.planStartDate, true) : undefined,
        planEndDate: data?.planEndDate ? toCustomDateFromTotalSeconds(data?.planEndDate, true) : undefined,
    } as PlanTicketCLType
}

// ============================================

export const paidPlanObj = {
    paid: 'プレミアム',
} as const
export const freePlanText = 'フリー'
export const paidPlanObjInvert = invert(paidPlanObj)
export const paidPlanList = Object.keys(paidPlanObj)
export type PaidPlanType = typeof paidPlanList[number]

export const getPaidPlanText = (plan: PaidPlanType | undefined): string => {
    return match(plan)
        .with('paid', () => paidPlanObj['paid'])
        .otherwise(() => freePlanText)
}

export const getPaidPlanTextList = (): string[] => {
    return paidPlanList.map((plan) => getPaidPlanText(plan))
}

export const getPaidPlanFromText = (text: string): PaidPlanType => {
    return paidPlanObjInvert[text]
}

/**
 * 有料機能を定義
 */
export type PaidAction = 'create-project' | 'create-invoice'
