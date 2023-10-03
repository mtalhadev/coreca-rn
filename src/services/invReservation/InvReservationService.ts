import { CompanyInvReservationListType, GetCompanyInvReservationListType } from "../../models/invReservation/CompanyInvReservationListType"
import { GetInvReservationOptionParam, InvReservationModel, InvReservationType } from "../../models/invReservation/InvReservation"
import { Create, Update } from "../../models/_others/Common"
import { CustomResponse } from "../../models/_others/CustomResponse"
import { TotalSeconds } from "../../models/_others/TotalSeconds"
import { _callFunctions } from "../firebase/FunctionsService"
import { getErrorMessage } from "../_others/ErrorService"

export const _createInvReservation = async (params: Create<InvReservationModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IInvReservation-createInvReservation', params)
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

export type GetInvReservationParam = {
    invReservationId: string
    options?: GetInvReservationOptionParam
}

export type GetReservationResponse = InvReservationType | undefined
export const _getInvReservation = async (params: GetInvReservationParam): Promise<CustomResponse<GetReservationResponse>> => {
    try {
        const result = await _callFunctions('IInvReservation-getInvReservation', params)
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

export const _updateInvReservation = async (params: Update<InvReservationModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IInvReservation-updateInvReservation', params)
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
export const _deleteInvReservation = async (params: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IInvReservation-deleteInvReservation', params)
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
type GetReservationListOfTargetCompanyAndMonthParams = {
    companyId: string
    month: TotalSeconds
    endOfMonth: TotalSeconds,
    types?: GetCompanyInvReservationListType
    options?: GetInvReservationOptionParam
}
/**
 * - allInvReservations - その会社の常用で送る(or 送られた)予定一覧の取得
 * - orderInvReservations - その会社の常用で送る予定一覧の取得
 * - receiveInvReservations - その会社の常用でくる予定一覧の取得
 */
export const _getInvReservationListOfTargetCompanyAndMonth = async (params: GetReservationListOfTargetCompanyAndMonthParams): Promise<CustomResponse<CompanyInvReservationListType>> => {
    try {
        const result = await _callFunctions('IInvReservation-getInvReservationListOfTargetCompanyAndMonth', params)
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

type GetInvReservationListOfTargetCompaniesAndMonthParams = {
    companyId: string
    targetCompanyId: string
    month: TotalSeconds
    endOfMonth: TotalSeconds,
    types?: GetCompanyInvReservationListType
    options?: GetInvReservationOptionParam
}
/**
 * - allInvReservations - その会社の常用で送る(or 送られた)予定一覧の取得
 * - orderInvReservations - その会社の常用で送る予定一覧の取得
 * - receiveInvReservations - その会社の常用でくる予定一覧の取得
 */
export const _getInvReservationListOfTargetCompaniesAndMonth = async (params: GetInvReservationListOfTargetCompaniesAndMonthParams): Promise<CustomResponse<CompanyInvReservationListType>> => {
    try {
        const result = await _callFunctions('IInvReservation-getInvReservationListOfTargetCompaniesAndMonth', params)
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