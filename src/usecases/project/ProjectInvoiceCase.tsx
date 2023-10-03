import { CustomResponse } from '../../models/_others/CustomResponse'
import { CreateFileType } from '../../models/_others/FileType'
import { _createProjectsInvoiceFileData } from '../../services/invoice/ProjectInvoiceService'
import { _sendInvoice } from '../../services/SendGridMail';
import { CustomDate, dayBaseText, getMonthlyFinalDay, getYYYYMMTotalSeconds, newCustomDate } from "../../models/_others/CustomDate"
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _checkCompanyPlan } from '../../services/_others/PlanTicketService'
import { DepartmentType } from '../../models/department/DepartmentType';
import { departmentsToText } from '../worker/CommonWorkerCase';
/**
 * @requires
 * - email - 送付先のメールアドレス
 * - type - 添付ファイルの形式指定（csv,excl,両方）
 * - companyId - 自社のId
 * - month - 請求月
 * - myWorkerName - 自身。作成者を特定するため。
 * - departments - 請求部署
 */
export type sendProjectsFileFileParams = {
    email: string
    type: CreateFileType
    month?: CustomDate
    myWorkerName?: string
    companyId?: string
    departments?: DepartmentType[]
}
/**
 * @summary 取引一覧明細データをメールに添付してデータベースに登録する。
 * @objective 明細データをメールに添付して送付するため
 * @error
 * - FILE_ERROR - 添付ファイルの作成に失敗した際
 * @author Kamiya
 * @param params - {@link sendProjectsFileFileParams}
 * @returns - boolean
 */
export const sendProjectsInvoiceFile = async (params: sendProjectsFileFileParams): Promise<CustomResponse> => {
    try {
        const { email, type, month, myWorkerName, companyId, departments } = params
        if (companyId == undefined) {
            throw {
                error: 'companyIdが存在しません。',
                errorCode: 'COMPANY_ID_ERROR',
            } as CustomResponse
        }
        if (month == undefined) {
            throw {
                error: '月が指定されていません。',
                errorCode: 'EMPTY_MONTH'
            }
        }
        const planResult = await _checkCompanyPlan({
            companyId,
            action: 'create-invoice'
        })
        if (planResult.error || planResult.success != true) {
            throw {
                error: 'ご利用のプランではこの機能は使用できません。',
                errorCode: 'PLAN_LOCK'
            }
        }

        const fileDataResult = await _createProjectsInvoiceFileData({ companyId, fileType: type, month: getYYYYMMTotalSeconds(month), endOfMonth: getMonthlyFinalDay(month).totalSeconds, timeZoneOffset: newCustomDate().timeZoneOffset, departments})
        if (fileDataResult.error) {
            throw {
                error: fileDataResult.error,
                errorCode: 'FILE_ERROR',
            } as CustomResponse
        }
        const result = await _sendInvoice({
            email,
            fileData: fileDataResult.success,
            mailInfo: {
                commonInvoice: {
                    title: month?.month + '月案件一覧明細',
                    month: month?.month + '月' ?? '',
                    today: dayBaseText(newCustomDate()),
                    myWorkerName: myWorkerName ?? '',
                    departments: departmentsToText(departments, '_')
                },
            },
        })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: true,
            error: undefined,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
