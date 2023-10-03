/* eslint-disable indent */

import { CustomResponse } from '../../models/_others/CustomResponse'
import { ID } from '../../models/_others/ID'
import { SiteArrangementType } from '../../models/arrangement/SiteArrangement'
import { TotalSeconds } from '../../models/_others/TotalSeconds'
import { _getSiteArrangement } from '../../services/ssg/SiteArrangementService'
import { getErrorMessage } from '../../services/_others/ErrorService'

/**
 * @require
 * @param companyId - 必須。会社ID
 * @param siteId - 必須。現場ID
 * @param date - 必須。日付
 */
export type _getSiteArrangementParam = {
    companyId?: ID
    siteId?: ID
    date?: TotalSeconds
}

export type getSiteArrangementResponse = SiteArrangementType | undefined
/**
 * @remarks 指定した現場の手配データを取得する。
 * @author kamiya
 * @param params - {@link _getSiteArrangementParam}
 * @returns - {@link getSiteArrangementResponse}
 */
export const getSiteArrangement = async (params: _getSiteArrangementParam): Promise<CustomResponse<getSiteArrangementResponse>> => {
    try {
        const { companyId, siteId, date } = params
        if (companyId == undefined) {
            throw {
                error: 'companyId がありません',
                errorCode: 'GET_SITE_ARRANGEMENT_ERROR',
            }
        }
        if (siteId == undefined) {
            throw {
                error: 'siteId がありません',
                errorCode: 'GET_SITE_ARRANGEMENT_ERROR',
            }
        }
        if (date == undefined) {
            throw {
                error: 'date がありません',
                errorCode: 'GET_SITE_ARRANGEMENT_ERROR',
            }
        }
        const result = await _getSiteArrangement({
            companyId,
            siteId,
            date,
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
