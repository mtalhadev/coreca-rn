import { CompanyInvRequestListType, GetCompanyInvRequestListType } from '../../models/invRequest/CompanyInvRequestListType'
import { InvRequestListType } from '../../models/invRequest/InvRequestListType'
import { GetInvRequestOptionParam, InvRequestModel, InvRequestType } from '../../models/invRequest/InvRequestType'
import { Create, Update } from '../../models/_others/Common'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { TotalSeconds, YYYYMMTotalSecondsParam } from '../../models/_others/TotalSeconds'
import { _callFunctions } from '../firebase/FunctionsService'
import { getErrorMessage } from '../_others/ErrorService'

export type CreateInvRequestParam = {
    invRequest: Create<InvRequestModel>
}
export type CreateInvRequestResponse = string

export const _createInvRequest = async (params: CreateInvRequestParam): Promise<CustomResponse<CreateInvRequestResponse>> => {
    try {
        const result = await _callFunctions('IInvRequest-createInvRequest', params)
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

export type GetInvRequestParam = {
    invRequestId: string
    options?: GetInvRequestOptionParam
}

export type GetInvRequestResponse = InvRequestType | undefined
export const _getInvRequest = async (params: GetInvRequestParam): Promise<CustomResponse<GetInvRequestResponse>> => {
    try {
        const result = await _callFunctions('IInvRequest-getInvRequest', params)
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

export type GetInvRequestListByIdsParam = {
    invRequestIds: string[]
    options?: GetInvRequestOptionParam
}
export type GetInvRequestListByIdsResponse = InvRequestListType | undefined
export const _getInvRequestListByIds = async (params: GetInvRequestListByIdsParam): Promise<CustomResponse<GetInvRequestListByIdsResponse>> => {
    try {
        const result = await _callFunctions('IInvRequest-getInvRequestListByIds', params)
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

export type UpdateInvRequestParam = {
    invRequest: Update<InvRequestType>
}
export type UpdateInvRequestResponse = boolean | undefined
export const _updateInvRequest = async (params: UpdateInvRequestParam): Promise<CustomResponse<UpdateInvRequestResponse>> => {
    try {
        const result = await _callFunctions('IInvRequest-updateInvRequest', params)
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

export type DeleteInvRequestParam = {
    invRequestId: string
}
export type DeleteInvRequestResponse = boolean | undefined
export const _deleteInvRequest = async (params: DeleteInvRequestParam): Promise<CustomResponse<DeleteInvRequestResponse>> => {
    try {
        const result = await _callFunctions('IInvRequest-deleteInvRequest', params)
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

export type GetInvRequestListOfTargetSiteParam = {
    invReservationId: string
    options?: GetInvRequestOptionParam
}
export type GetInvRequestListOfTargetSiteResponse = InvRequestListType | undefined
/**
 *
 * @param params
 * @returns 同一のinvReservationに紐づくinvRequestのリストを取得
 */
export const _getInvRequestListOfTargetInvReservation = async (params: GetInvRequestListOfTargetSiteParam): Promise<CustomResponse<GetInvRequestListOfTargetSiteResponse>> => {
    try {
        const result = await _callFunctions('IInvRequest-getInvRequestListOfTargetInvReservation', params)
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

export type GetInvRequestListOfTargetSiteAndMonthParam = {
    invReservationId: string
    month: TotalSeconds
    endOfMonth: TotalSeconds
    options?: GetInvRequestOptionParam
}
export type GetInvRequestListOfTargetSiteAndMonthResponse = InvRequestListType | undefined
/**
 *
 * @param params
 * @returns 同一のinvReservationに紐づくinvRequestのリストを取得
 */
export const _getInvRequestListOfTargetInvReservationAndMonth = async (params: GetInvRequestListOfTargetSiteAndMonthParam): Promise<CustomResponse<GetInvRequestListOfTargetSiteAndMonthResponse>> => {
    try {
        const result = await _callFunctions('IInvRequest-getInvRequestListOfTargetInvReservationAndMonth', params)
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
/**
 * date その日の最初に時刻
 */
export type GetInvRequestListOfTargetDateAndCompanyParam = {
    date: TotalSeconds
    companyId: string
    types?: ('order' | 'receive' | 'all')[]
    isApplication?: boolean
    options?: GetInvRequestOptionParam
}
export type GetInvRequestListOfTargetDateAndCompanyResponse = CompanyInvRequestListType | undefined
/**
 *
 * @param params
 * @returns 特定の日の会社に関わるinvRequestのリストを取得
 */
export const _getInvRequestListOfTargetDateAndCompany = async (params: GetInvRequestListOfTargetDateAndCompanyParam): Promise<CustomResponse<GetInvRequestListOfTargetDateAndCompanyResponse>> => {
    try {
        const result = await _callFunctions('IInvRequest-getInvRequestListOfTargetDateAndCompany', params)
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

export type GetInvRequestListOfTargetCompaniesAndMonthParam = {
    companyId: string
    targetCompanyId: string
    types?: GetCompanyInvRequestListType
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    options?: GetInvRequestOptionParam
}
export type GetInvRequestListOfTargetCompaniesAndMonthResponse = CompanyInvRequestListType | undefined
/**
 *
 * @param params
 * @returns 特定の月の2会社間に関わるinvRequestのリストを取得
 */
export const _getInvRequestListOfTargetCompaniesAndMonth = async (params: GetInvRequestListOfTargetCompaniesAndMonthParam): Promise<CustomResponse<CompanyInvRequestListType>> => {
    try {
        const result = await _callFunctions('IInvRequest-getInvRequestListOfTargetCompaniesAndMonth', params)
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

export type DeleteInvRequestsForSpanParam = {
    invReservationId: string
    startDate: number
    endDate: number
}
/**
 *
 * @param params - DeleteInvRequestsForSpanParam
 * @returns 期間内のInvRequestを削除する
 */
export const _deleteInvRequestsForSpan = async (params: DeleteInvRequestsForSpanParam): Promise<CustomResponse<number>> => {
    try {
        const result = await _callFunctions('IInvRequest-deleteInvRequestsForSpan', params)
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
/**
 * types 送ってる側がorder,送られる側がreceive
 */
export type GetInvRequestListOfTargeCompanyParam = {
    companyId: string
    types?: ("order" | "receive" | "all")[]
    isApplication?: boolean
    options?: GetInvRequestOptionParam
}
export type GetInvRequestListOfTargetCompanyResponse = CompanyInvRequestListType | undefined
/**
 *
 * @param params
 * @returns 特定の会社に関わるinvRequestのリストを取得
 */
export const _getInvRequestListOfTargetCompany = async (params: GetInvRequestListOfTargeCompanyParam): Promise<CustomResponse<GetInvRequestListOfTargetDateAndCompanyResponse>> => {
    try {
        const result = await _callFunctions('IInvRequest-deleteInvRequestsForSpan', params)
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
