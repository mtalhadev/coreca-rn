import { CustomResponse } from '../../models/_others/CustomResponse'
import { _getContract, _getContractListOfTargetCompanies } from '../contract/ContractService'
import { ContractType } from '../../models/contract/Contract'
import { getErrorMessage } from '../_others/ErrorService'
import { _callFunctions } from '../firebase/FunctionsService'
import { YYYYMMTotalSecondsParam } from '../../models/_others/TotalSeconds'

/**
 * - orderContracts - その月の顧客/取引先との間に発注契約を持つ契約のリスト
 * - receiveContracts - その月の顧客/取引先との間に受注契約を持つ契約のリスト
 */
export type _GetInvoiceOfMonthResponse = {
    orderContracts?: ContractType[]
    receiveContracts?: ContractType[]
}
/**
 * @requires
 * - otherCompanyId - 顧客/取引先のId
 * - companyId - 自社
 * - month - 請求を取得したい月
 */
export type _GetContractInvoiceOfMonthParam = {
    otherCompanyId?: string
    companyId?: string
    month?: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
}
/**
 * @remarks その月の顧客/取引先との間に受発注契約を持つ契約のリストを取得
 * @objective createTargetCompanyInvoiceFileDataにおいて請求情報を取得するため。
 * @error
 * - OTHER_COMPANY_ERROR - 対象会社のIdがなかった場合
 * - COMPANY_ERROR - 自社のIdがなかった場合
 * - MONTH_ERROR - 請求月が指定されなかった場合
 * - CONTRACT_ERROR - 契約の取得に失敗した場合
 * - CONTRACT_DETAIL_ERROR - 詳細な契約の取得に失敗した場合
 * @author  Kamiya
 * @param params - {@link _GetContractInvoiceOfMonthParam}
 * @returns - {@link _GetInvoiceOfMonthResponse}
 */

export const _getContractInvoiceOfMonth = async (params: _GetContractInvoiceOfMonthParam): Promise<CustomResponse<_GetInvoiceOfMonthResponse>> => {
    try {
        const result = await _callFunctions('IContractInvoice-getContractInvoiceOfMonth', params)
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
