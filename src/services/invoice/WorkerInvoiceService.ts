import { _callFunctions } from '../firebase/FunctionsService'
import { WorkerType, WorkerCLType } from '../../models/worker/Worker'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { CreateFileType, FileDataType } from '../../models/_others/FileType'
import { getErrorMessage } from '../_others/ErrorService'
import { YYYYMMTotalSecondsParam } from '../../models/_others/TotalSeconds'

/**
 * - worker - その月の作業員の勤怠リスト
 */
export type getWorkerInvoiceOfMonthResponse = {
    worker?: WorkerCLType
}
/**
 * @requires
 * - worker - 作業員
 * - month - 請求を取得したい月
 */
export type getWorkerInvoiceOfMonthParam = {
    worker?: WorkerType
    month?: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
}
/**
 * @remarks 指定月の作業員の勤怠のリスト（作業員個別用）
 * @objective WorkerAttendanceList.tsxにおいて自社作業員の勤怠を取得するため
 * @error
 * - WORKER_ID_ERROR - 作業員のIdがなかった場合
 * - MONTH_ERROR - 請求月が指定されなかった場合
 * - WORKER_ERROR - 作業員の取得に失敗した場合
 * @author  Kamiya
 * @param params - {@link getWorkerInvoiceOfMonthParam}
 * @returns - {@link getWorkerInvoiceOfMonthResponse}
 */
export const _getWorkerInvoiceOfMonth = async (params: getWorkerInvoiceOfMonthParam): Promise<CustomResponse<getWorkerInvoiceOfMonthResponse>> => {
    try {
        const result = await _callFunctions('IWorkerInvoice-getWorkerInvoiceOfMonth', params)
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
 * - worker - 作業員
 * @partial
 * - month - 請求月
 */
type createWorkerInvoiceFileDataParam = {
    fileType: CreateFileType
    worker?: WorkerType
    month?: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    timeZoneOffset?: number
}
/**
 * @remarks 作業員の明細データを取得して、エクセルやcsvのデータを作成
 * @objective 明細ダウンロードで使用する請求データの作成
 * @error
 * - ATTENDANCE_ERROR - 作業員の勤怠の取得に失敗した際
 * @author  Kamiya
 * @param params - {@link createWorkerInvoiceFileDataParam}
 * @returns - {@link FileDataType}[]
 */
export const _createWorkerInvoiceFileData = async (params: createWorkerInvoiceFileDataParam): Promise<CustomResponse<FileDataType[]>> => {
    try {
        const result = await _callFunctions('IWorkerInvoice-createWorkerInvoiceFileData', params)
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
