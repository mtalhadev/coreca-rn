import { _callFunctions } from '../firebase/FunctionsService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { CreateFileType, FileDataType } from '../../models/_others/FileType'
import { getErrorMessage } from '../_others/ErrorService'
import { YYYYMMTotalSecondsParam } from '../../models/_others/TotalSeconds'
import { ID } from '../../models/_others/ID'
import { DepartmentType } from '../../models/department/DepartmentType'

/**
 * @requires
 * - fileType - 添付するファイルのタイプ（csv, excel, 全て）
 * @partial
 * - otherCompanyId - 対象の会社Id
 * - companyId - 自社Id
 * - month - 請求月
 * - departments - 部署
 */
type createTargetCompanyInvoiceFileDataParam = {
    fileType: CreateFileType
    otherCompanyId?: string
    companyId?: string
    month?: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    timeZoneOffset?: number
    departments?: DepartmentType[]
}
/**
 * @remarks 顧客/取引先との明細データを取得して、エクセルやcsvのデータを作成
 * @objective 明細ダウンロードで使用する請求データの作成
 * @error
 * - CONTRACT_ERROR - contractの取得に失敗した際
 * - REQUEST_ERROR - requestの取得に失敗した際
 * @author  Kamiya
 * @param params - {@link createTargetCompanyInvoiceFileDataParam}
 * @returns - {@link FileDataType}[]
 */
export const _createTargetCompanyInvoiceFileData = async (params: createTargetCompanyInvoiceFileDataParam): Promise<CustomResponse<FileDataType[]>> => {
    try {
        const result = await _callFunctions('ITargetCompanyInvoice-createTargetCompanyInvoiceFileData', params)
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
