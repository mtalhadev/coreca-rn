import { _callFunctions } from '../firebase/FunctionsService'
import { ProjectCLType } from '../../models/project/Project'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { CreateFileType, FileDataType } from '../../models/_others/FileType'
import { getErrorMessage } from '../_others/ErrorService'
import { YYYYMMTotalSecondsParam } from '../../models/_others/TotalSeconds'
import { DepartmentType } from '../../models/department/DepartmentType'

/**
 * - projects - その月の案件リスト
 */
export type getProjectsInvoiceOfMonthResponse = {
    projects?: ProjectCLType[]
}
/**
 * @requires
 * - companyId - 自社
 * - month - 請求を取得したい月
 */
export type getProjectsInvoiceOfMonthParam = {
    companyId?: string
    month?: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
}
/**
 * @summary 指定月の対象の会社の案件リスト
 * @objective ContractingProjectList.tsxにおいて案件に一覧を取得するため
 * @error
 * - COMPANY_ERROR - 自社のIdがなかった場合
 * - MONTH_ERROR - 請求月が指定されなかった場合
 * - PROJECTS_ERROR - 案件の取得に失敗した場合
 * @author  Kamiya
 * @param params - {@link getProjectsInvoiceOfMonthParam}
 * @returns - {@link getProjectsInvoiceOfMonthResponse}
 */
export const _getProjectsInvoiceOfMonth = async (params: getProjectsInvoiceOfMonthParam): Promise<CustomResponse<getProjectsInvoiceOfMonthResponse>> => {
    try {
        const result = await _callFunctions('IProjectInvoice-getProjectsInvoiceOfMonth', params)
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
 * @param departments - 請求部署
 */
type createProjectsInvoiceFileDataParam = {
    fileType: CreateFileType
    companyId?: string
    month?: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    timeZoneOffset?: number
    departments?: DepartmentType[]
}
/**
 * @summary 取引一覧の明細データを取得して、エクセルやcsvのデータを作成
 * @objective 明細ダウンロードで使用する請求データの作成
 * @error
 * - PROJECTS_ERROR - 案件の取得に失敗した際
 * @author  Kamiya
 * @param params - {@link createProjectsInvoiceFileDataParam}
 * @returns - {@link FileDataType}[]
 */
export const _createProjectsInvoiceFileData = async (params: createProjectsInvoiceFileDataParam): Promise<CustomResponse<FileDataType[]>> => {
    try {
        const result = await _callFunctions('IProjectInvoice-createProjectsInvoiceFileData', params)
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
