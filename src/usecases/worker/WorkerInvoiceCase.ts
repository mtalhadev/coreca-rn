import { CustomResponse } from '../../models/_others/CustomResponse'
import { CreateFileType } from '../../models/_others/FileType'
import { _createWorkerInvoiceFileData } from '../../services/invoice/WorkerInvoiceService'
import { _createWorkersInvoiceFileData } from '../../services/invoice/WorkersInvoiceService'
import { _getWorker } from '../../services/worker/WorkerService'
import { _sendInvoice } from '../../services/SendGridMail';
import { CustomDate, dayBaseText, getMonthlyFinalDay, getYYYYMMTotalSeconds, newCustomDate } from "../../models/_others/CustomDate"
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _checkCompanyPlan } from '../../services/_others/PlanTicketService'
import { DepartmentType } from '../../models/department/DepartmentType'
import { departmentsToText } from './CommonWorkerCase'
/**
 * @requires
 * - email - 送付先のメールアドレス
 * - type - 添付ファイルの形式指定（csv,excl,両方）
 * - companyId - 自社のId
 * - month - 請求月
 * - myWorkerName - 自身。作成者を特定するため。
 * - departmentIds - 部署で絞りこむ場合
 */
export type sendWorkersFileFileParams = {
    email: string
    type: CreateFileType
    month?: CustomDate
    myWorkerName?: string
    companyId?: string
    departments?: DepartmentType[]
}
/**
 * @remarks 作業員(一覧)明細データをメールに添付してデータベースに登録する。
 * @objective 明細データをメールに添付して送付するため
 * @error
 * - FILE_ERROR - 添付ファイルの作成に失敗した際
 * - MONTH_ERROR - monthがなかった時
 * @author Kamiya
 * @param params - {@link sendWorkersFileFileParams}
 * @returns - boolean
 */
export const sendWorkersInvoiceFile = async (params: sendWorkersFileFileParams): Promise<CustomResponse> => {
    try {
        const { email, type, month, myWorkerName, companyId, departments } = params
        if (companyId == undefined) {
            throw {
                error: 'companyIdが存在しません。',
                errorCode: 'COMPANY_ID_ERROR',
            } as CustomResponse
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
        if (month == undefined) {
            throw {
                error: 'ダウンロードする月が指定されていません',
                errorCode: 'MONTH_ERROR'
            }
        }
        const fileDataResult = await _createWorkersInvoiceFileData({ companyId, fileType: type, month: getYYYYMMTotalSeconds(month), endOfMonth: getMonthlyFinalDay(month).totalSeconds, timeZoneOffset: newCustomDate().timeZoneOffset, departments, })
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
                    title: month?.month + `月${departmentsToText(departments, '_')}作業員一覧明細`,
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
/**
 * @requires
 * - email - 送付先のメールアドレス
 * - type - 添付ファイルの形式指定（csv,excl,両方）
 * - workerId - 対象の作業員のId
 * - month - 請求月
 * - myWorkerName - 自身。作成者を特定するため。
 * - departments - 請求部署
 */
export type sendWorkerFileFileParams = {
    email: string
    type: CreateFileType
    month?: CustomDate
    myWorkerName?: string
    workerId?: string
    companyId?: string
    departments?: DepartmentType[]
}
/**
 * @remarks 作業員(個別)明細データをメールに添付してデータベースに登録する。
 * @objective 明細データをメールに添付して送付するため
 * @error
 * - WORKER_ID_ERROR - 作業員Idがなかった場合
 * - WORKER_ERROR - 作業員の情報取得に失敗した場合
 * - FILE_ERROR - 添付ファイルの作成に失敗した際
 * - MONTH_ERROR - monthがなかった時
 * @author Kamiya
 * @param params - {@link sendWorkerFileFileParams}
 * @returns - boolean
 */
export const sendWorkerInvoiceFile = async (params: sendWorkerFileFileParams): Promise<CustomResponse> => {
    try {
        const { email, type, month, myWorkerName, workerId, companyId, departments } = params
        if (companyId == undefined) {
            throw {
                error: 'companyIdが存在しません。',
                errorCode: 'COMPANY_ID_ERROR',
            } as CustomResponse
        }
        const planResult = await _checkCompanyPlan({
            companyId: companyId,
            action: 'create-invoice'
        })
        if (planResult.error || planResult.success != true) {
            throw {
                error: 'ご利用のプランではこの機能は使用できません。',
                errorCode: 'PLAN_LOCK'
            }
        }

        if (workerId == undefined) {
            throw {
                error: '作業員の情報がありません。',
                errorCode: 'WORKER_ID_ERROR',
            } as CustomResponse
        }
        const workerResult = await _getWorker({ workerId })
        if (workerResult.error) {
            throw {
                error: '作業員の情報がありません。',
                errorCode: 'WORKER_ERROR',
            } as CustomResponse
        }
        if (month == undefined) {
            throw {
                error: 'ダウンロードする月が指定されていません',
                errorCode: 'MONTH_ERROR'
            }
        }
        const fileDataResult = await _createWorkerInvoiceFileData({ worker: workerResult.success, fileType: type, month: getYYYYMMTotalSeconds(month), endOfMonth: getMonthlyFinalDay(month).totalSeconds, timeZoneOffset: newCustomDate().timeZoneOffset })
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
                workerInvoice: {
                    workerName: workerResult?.success?.name ?? '',
                },
                commonInvoice: {
                    title: month?.month + '月' + workerResult?.success?.name + '明細',
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
