import { _callFunctions } from '../firebase/FunctionsService'
import { WorkerCLType } from '../../models/worker/Worker'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { CreateFileType, FileDataType } from '../../models/_others/FileType'
import { getErrorMessage } from '../_others/ErrorService'
import { YYYYMMTotalSecondsParam } from '../../models/_others/TotalSeconds'
import { ID } from '../../models/_others/ID'
import { DepartmentType } from '../../models/department/DepartmentType'

/**
 * - workers - その月の作業員の勤怠リスト
 */
export type getWorkersInvoiceOfMonthResponse = {
    workers?: WorkerCLType[]
}
/**
 * @requires
 * - companyId - 自社
 * - month - 請求を取得したい月
 */
export type getWorkersInvoiceOfMonthParam = {
    companyId?: string
    month?: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
}

/**
 * @remarks 指定月の作業員の勤怠のリスト（作業員一覧）
 * @objective MyCompanyWorkerList.tsxにおいて自社作業員の勤怠を取得するため
 * @error
 * - COMPANY_ERROR - 自社のIdがなかった場合
 * - MONTH_ERROR - 請求月が指定されなかった場合
 * - WORKERS_ERROR - 作業員の取得に失敗した場合
 * @author  Kamiya
 * @param params - {@link getWorkersInvoiceOfMonthParam}
 * @returns - {@link getWorkersInvoiceOfMonthResponse}
 */
export const _getWorkersInvoiceOfMonth = async (params: getWorkersInvoiceOfMonthParam): Promise<CustomResponse<getWorkersInvoiceOfMonthResponse>> => {
    try {
        const result = await _callFunctions('IWorkersInvoice-getWorkersInvoiceOfMonth', params)
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

/**
 * @requires
 * - fileType - 添付するファイルのタイプ（csv, excel, 全て）
 * - companyId - 自社Id
 * @partial
 * - month - 請求月
 * - departments - 部署
 */
type createWorkersInvoiceFileDataParam = {
    fileType: CreateFileType
    companyId?: string
    month?: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    timeZoneOffset?: number
    departments?: DepartmentType[]
}
/**
 * @remarks 全作業員の明細データを取得して、エクセルやcsvのデータを作成
 * @objective 明細ダウンロードで使用する請求データの作成
 * @error
 * - ATTENDANCE_ERROR - 作業員の勤怠の取得に失敗した際
 * @author  Kamiya
 * @param params - {@link createWorkersInvoiceFileDataParam}
 * @returns - {@link FileDataType}[]
 */
export const _createWorkersInvoiceFileData = async (params: createWorkersInvoiceFileDataParam): Promise<CustomResponse<FileDataType[]>> => {
    try {
        const result = await _callFunctions('IWorkersInvoice-createWorkersInvoiceFileData', params)
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
