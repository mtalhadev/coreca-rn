import { _callFunctions } from '../firebase/FunctionsService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { FileDataType } from '../../models/_others/FileType'
import { getErrorMessage } from './ErrorService'
import { UserInfoForInquiryType } from '../../models/_others/Inquiry'
/**
 * @requires
 * - companyName - 顧客/取引先の名前
 */
type targetCompanyInvoiceType = {
    companyName: string
}
/**
 * @requires
 * - workerName - 明細対象の作業員の名前
 */
type workerInvoiceType = {
    workerName: string
}
/**
 * @requires
 * - today - 今日の日付
 * - myWorkerName - 自身。作成者を特定するため。
 * - month - 請求月
 * - title - メールタイトル
 */
type commonInvoiceType = {
    today: string
    myWorkerName: string
    month: string
    title: string
}
/**
 * @param targetCompanyInvoice - 顧客/取引先との明細メール記載に必要
 * @param workersInvoice - 作業員一覧での明細メール記載に必要
 * @param workerInvoice - 作業員個別での明細メール記載に必要
 * @param commonInvoice - 共通で明細メール記載に必要な情報
 */
export type MailInfoParam = {
    targetCompanyInvoice?: targetCompanyInvoiceType
    workerInvoice?: workerInvoiceType
    commonInvoice?: commonInvoiceType
}
/**
 * @param email - 送り主のメールアドレス
 * @param fileData - メールに添付するデータ
 * @param mailInfo - メールに記載する内容
 */
type _sendMailParam = {
    email: string
    fileData?: FileDataType[]
    mailInfo: MailInfoParam
}
/**
 * @remarks 送信するメールデータをデータベースに登録
 * @objective 明細データをメールで送付するため
 * @author  Kamiya
 * @param params - {@link _sendMailParam}
 * @returns - boolean
 */

export const _sendMail = async (params: _sendMailParam): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IMail-sendMail', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const _sendBillingInquiryMail = async (params: UserInfoForInquiryType): Promise<CustomResponse<any>> => {
    try {
        const result = await _callFunctions('IMail-sendBillingInquiryMail', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (e) {
        return getErrorMessage(e)
    }
}

export const _sendProblemInquiryMail = async (params: UserInfoForInquiryType): Promise<CustomResponse<any>>  => {
    try {
        const result = await _callFunctions('IMail-sendProblemInquiryMail', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (e) {
        return getErrorMessage(e)
    }
}
