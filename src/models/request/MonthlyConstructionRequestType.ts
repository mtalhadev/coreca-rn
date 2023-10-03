import { CommonListType, CommonModel, Create, Update } from '../_others/Common'
import { ID } from '../_others/ID'
import { YYYYMMTotalSecondsParam } from '../_others/TotalSeconds'
import { ConstructionType } from '../construction/Construction'
import { ConstructionListType } from '../construction/ConstructionListType'

export type GetCompanyRequestListType = ('all' | 'receive' | 'order')[]
/**
 * - totalConstructions - その会社の常用依頼(した or された)現場を含む工事一覧の取得
 * - orderConstructions - その会社の常用依頼した現場を含む工事一覧の取得
 * - receiveConstructions - その会社の常用依頼された現場を含む工事一覧の取得
 */
export type ConstructionRequestListType = CommonListType<ConstructionType> & {
    totalConstructions?: ConstructionListType
    orderConstructions?: ConstructionListType
    receiveConstructions?: ConstructionListType
}

/**
 * 常用依頼の工事ごと月毎のデータを保存。SSG用
 */
export type MonthlyConstructionRequestModel = Partial<{
    monthlyConstructionRequestId: ID
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    companyId: ID
}> &
    ConstructionRequestListType &
    CommonModel
export const initMonthlyConstructionRequest = (
    monthlyConstructionRequest: Create<MonthlyConstructionRequestModel> | Update<MonthlyConstructionRequestModel>,
): Update<MonthlyConstructionRequestModel> => {
    const newMonthlyInvReservation: Update<MonthlyConstructionRequestModel> = {
        monthlyConstructionRequestId: monthlyConstructionRequest.monthlyConstructionRequestId,
        companyId: monthlyConstructionRequest.companyId,
        month: monthlyConstructionRequest.month,
        endOfMonth: monthlyConstructionRequest.endOfMonth,
        totalConstructions: monthlyConstructionRequest.totalConstructions,
        orderConstructions: monthlyConstructionRequest.orderConstructions,
        receiveConstructions: monthlyConstructionRequest.receiveConstructions,
    }
    return newMonthlyInvReservation
}
