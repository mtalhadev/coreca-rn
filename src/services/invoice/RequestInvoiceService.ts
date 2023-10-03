import { _callFunctions } from '../firebase/FunctionsService'
import { RequestType } from '../../models/request/Request'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'
import { YYYYMMTotalSecondsParam } from '../../models/_others/TotalSeconds'

/**
 * - orderRequests - その月の顧客/取引先への発注依頼のリスト
 * - receiveRequests - その月の顧客/取引先からの受注依頼のリスト
 */
export type getRequestInvoiceOfMonthResponse = {
    orderRequests?: RequestType[]
    receiveRequests?: RequestType[]
}
/**
 * @requires
 * - otherCompanyId - 顧客/取引先のId
 * - companyId - 自社
 * - month - 請求を取得したい月
 */
export type getRequestInvoiceOfMonthParam = {
    otherCompanyId?: string
    companyId?: string
    month?: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
}
/**
 * @remarks 月別にオブジェクト化された顧客/取引先との間に受発注依頼を持つ工事のリスト
 * @objective CompanyInvoice.tsxにおいて顧客/取引先との間の受発注依頼を持つ工事を取得するため
 * @error
 * - OTHER_COMPANY_ERROR - 対象会社のIdがなかった場合
 * - COMPANY_ERROR - 自社のIdがなかった場合
 * - MONTH_ERROR - 請求月が指定されなかった場合
 * - REQUEST_ERROR - 依頼の取得に失敗した場合
 * - REQUEST_DETAIL_ERROR - 依頼詳細の取得に失敗した場合
 * @author  Kamiya
 * @param params - {@link getRequestInvoiceOfMonthParam}
 * @returns - {@link getRequestInvoiceOfMonthResponse}
 */
export const _getRequestInvoiceOfMonth = async (params: getRequestInvoiceOfMonthParam): Promise<CustomResponse<getRequestInvoiceOfMonthResponse>> => {
    try {
        const result = await _callFunctions('IRequestInvoice-getRequestInvoiceOfMonth', params)
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
