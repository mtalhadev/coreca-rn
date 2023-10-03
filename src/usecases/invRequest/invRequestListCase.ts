import { InvRequestType } from "../../models/invRequest/InvRequestType"
import { CustomDate, getMonthlyFinalDay, getYYYYMMTotalSeconds } from "../../models/_others/CustomDate"
import { CustomResponse } from "../../models/_others/CustomResponse"
import { ID } from "../../models/_others/ID"
import { _getInvRequestListOfTargetInvReservation, _getInvRequestListOfTargetInvReservationAndMonth } from "../../services/invRequest/InvRequestService"
import { getErrorMessage } from "../../services/_others/ErrorService"

export type GetInvRequestListOfTargetInvReservationAndMonthParam = {
    invReservationId?: string
    month?: CustomDate
    myCompanyId?: ID
}

export const getInvRequestListOfTargetInvReservationAndMonth = async (params: GetInvRequestListOfTargetInvReservationAndMonthParam): Promise<CustomResponse<InvRequestType[]>> => {
    try {
        const { invReservationId, month, myCompanyId } = params
        if (invReservationId == undefined) {
            throw {
                error: '常用申請情報がありません。',
            } as CustomResponse
        }
        if (month == undefined) {
            throw {
                error: '月情報がありません。',
            } as CustomResponse
        }

        const invRequestsResult = await _getInvRequestListOfTargetInvReservationAndMonth({
                invReservationId,
                month: getYYYYMMTotalSeconds(month),
                endOfMonth: getMonthlyFinalDay(month).totalSeconds,
                options:{
                    workers: true,
                    site: {
                        companyRequests: {
                            params: {
                                companyId: myCompanyId ?? 'no-id',
                                types: ['order'],
                            },
                            requestedCompany: true
                        }
                    }
                }
            })

        if (invRequestsResult.error) {
            throw {
                error: invRequestsResult.error,
            } as CustomResponse
        }
        return Promise.resolve({
            success: invRequestsResult.success?.items,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}