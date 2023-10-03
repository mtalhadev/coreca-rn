/* eslint-disable indent */
import { _callFunctions } from '../firebase/FunctionsService'

import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'
import { DateDataType } from '../../models/date/DateDataType'
import { ID } from '../../models/_others/ID'
import { SiteArrangementType } from '../../models/arrangement/SiteArrangement'
import { TotalSeconds } from '../../models/_others/TotalSeconds'

/**
 * @require
 * @param companyId - 必須。会社ID
 * @param siteId - 必須。現場ID
 * @param date - 必須。日付
 */
export type _getSiteArrangementParam = {
    companyId: ID
    siteId: ID
    date: TotalSeconds
}

export type _getSiteArrangementResponse = SiteArrangementType[] | undefined
/**
 * @remarks 指定した現場の手配データを取得する。
 * @author kamiya
 * @param params - {@link _getSiteArrangementParam}
 * @returns - {@link _getSiteArrangementResponse}
 */
export const _getSiteArrangement = async (params: _getSiteArrangementParam): Promise<CustomResponse<_getSiteArrangementResponse>> => {
    try {
        const result = await _callFunctions('ISiteArrangementSSG-getSiteArrangement', params)
        if (result.error) {
            throw { ...result }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}
