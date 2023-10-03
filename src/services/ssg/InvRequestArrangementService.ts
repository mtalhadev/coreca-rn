/* eslint-disable indent */
import { _callFunctions } from '../firebase/FunctionsService'

import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'
import { DateDataType } from '../../models/date/DateDataType'
import { ID } from '../../models/_others/ID'
import { SiteArrangementType } from '../../models/arrangement/SiteArrangement'
import { TotalSeconds } from '../../models/_others/TotalSeconds'
import { InvRequestArrangementType } from '../../models/invRequest/InvRequestArrangement'

/**
 * @require
 * @param companyId - 必須。会社ID
 * @param invRequestId - 必須。常用で送るID
 */
export type GetInvRequestArrangementParam = {
    companyId: ID
    invRequestId: ID
}

export type GetInvRequestArrangementResponse = InvRequestArrangementType[] | undefined
/**
 * @remarks 指定した常用手配データを取得する。
 * @author kamiya
 * @param params - {@link GetInvRequestArrangementParam}
 * @returns - {@link GetInvRequestArrangementResponse}
 */
export const _getInvRequestArrangement = async (params: GetInvRequestArrangementParam): Promise<CustomResponse<GetInvRequestArrangementResponse>> => {
    try {
        const result = await _callFunctions('IInvRequestArrangementSSG-getInvRequestArrangement', params)
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
