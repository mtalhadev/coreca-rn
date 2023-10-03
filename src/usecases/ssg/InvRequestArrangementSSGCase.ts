/* eslint-disable indent */

import { CustomResponse } from '../../models/_others/CustomResponse'
import { ID } from '../../models/_others/ID'
import { InvRequestArrangementType } from '../../models/invRequest/InvRequestArrangement'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _getInvRequestArrangement } from '../../services/ssg/InvRequestArrangementService'

/**
 * @require
 * @param companyId - 必須。会社ID
 * @param invRequestId - 必須。常用で送るID
 */
export type GetInvRequestArrangementParam = {
    companyId?: ID
    invRequestId?: ID
}

export type GetInvRequestArrangementResponse = InvRequestArrangementType | undefined
/**
 * @remarks 指定した常用手配データを取得する。
 * @author kamiya
 * @param params - {@link GetInvRequestArrangementParam}
 * @returns - {@link GetInvRequestArrangementResponse}
 */
export const getInvRequestArrangement = async (params: GetInvRequestArrangementParam): Promise<CustomResponse<GetInvRequestArrangementResponse>> => {
    try {
        const { companyId, invRequestId } = params
        if (companyId == undefined) {
            throw {
                error: 'companyId がありません',
                errorCode: 'GET_INV_REQUEST_ARRANGEMENT_ERROR',
            }
        }
        if (invRequestId == undefined) {
            throw {
                error: 'invRequestId がありません',
                errorCode: 'GET_INV_REQUEST_ARRANGEMENT_ERROR',
            }
        }
        const result = await _getInvRequestArrangement({
            companyId,
            invRequestId,
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
