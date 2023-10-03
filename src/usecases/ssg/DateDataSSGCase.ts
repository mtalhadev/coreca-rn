/* eslint-disable indent */

import { CustomResponse } from '../../models/_others/CustomResponse'
import { ID } from '../../models/_others/ID'
import { DateDataType } from '../../models/date/DateDataType'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _getDateDataOfTargetDateAndCompany } from '../../services/date/DateDataService'
import { _getInvRequestArrangement } from '../../services/ssg/InvRequestArrangementService'

/**
 * @require
 * @param companyId - 必須。会社ID
 * @param date - 必須。日付
 */
export type _getDateDataOfTargetDateAndCompanyParam = {
    companyId?: ID
    date?: number
    endDate?: number
}
/**
 * DateDataTypeまたはundefinedを返す
 */
export type _getDateDataOfTargetDateAndCompanyResponse = DateDataType | undefined
/**
 * @remarks 指定した日付と会社の日付データを取得する。
 * @objective 日付データをID取得する需要はないので、日付と会社での取得を最下層のGET APIとする。
 * @author Hiruma
 * @param params - {@link _getDateDataOfTargetDateAndCompanyParam}
 * @returns - {@link _getDateDataOfTargetDateAndCompanyResponse}
 */
export const getDateDataOfTargetDateAndCompany = async (params: _getDateDataOfTargetDateAndCompanyParam): Promise<CustomResponse<_getDateDataOfTargetDateAndCompanyResponse>> => {
    try {
        const { companyId, date, endDate } = params
        if (companyId == undefined) {
            throw {
                error: 'companyId がありません',
                errorCode: 'GET_DATE_DATA_ERROR',
            }
        }
        if (date == undefined) {
            throw {
                error: 'date がありません',
                errorCode: 'GET_DATE_DATA_ERROR',
            }
        }
        if (endDate == undefined) {
            throw {
                error: 'endDate がありません',
                errorCode: 'GET_DATE_DATA_ERROR',
            }
        }
        const result = await _getDateDataOfTargetDateAndCompany({
            companyId,
            date,
            endDate,
        })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: result.success ? result.success[0] : undefined,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}
