import { _callFunctions } from '../firebase/FunctionsService'
import { GetRequestOptionParam, initRequest, RequestCLType, RequestModel, RequestType, toRequestCLType } from '../../models/request/Request'
import { Create, Update } from '../../models/_others/Common'
import { getErrorMessage } from '../_others/ErrorService'
import { GetArrangementOptionParam } from '../../models/arrangement/Arrangement'
import { GetCompanyRequestListType, CompanyRequestListType } from '../../models/request/CompanyRequestListType'
import { RequestListType } from '../../models/request/RequestListType'
import { RequestMeterType } from '../../models/request/RequestMeterType'
import { RequestRelationType } from '../../models/request/RequestRelationType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { YYYYMMTotalSecondsParam } from '../../models/_others/TotalSeconds'

export type CreateRequestParam = {
    request: Create<RequestModel>
}
export type CreateRequestResponse = string
export const _createRequest = async (params: CreateRequestParam): Promise<CustomResponse<CreateRequestResponse>> => {
    try {
        const result = await _callFunctions('IRequest-createRequest', params)
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

export type GetRequestParam = {
    requestId: string
    options?: GetRequestOptionParam
}

export type GetRequestResponse = RequestType | undefined

/**
 *
 * @param params
 *  -
 *  - withoutSelf
 *  - company
 *  - requestedCompany
 *  - arrangements
 *  - requestedCompanyManager
 *  - requestRelation
 *  - site
 *  - updateWorker
 *  - superRequest
 *  - subRespond
 * @returns
 */
export const _getRequest = async (params: GetRequestParam): Promise<CustomResponse<GetRequestResponse>> => {
    try {
        const result = await _callFunctions('IRequest-getRequest', params)
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

export type GetRequestListByIdsParam = {
    requestIds: string[]
    options?: GetRequestOptionParam
}
export type GetRequestListByIdsResponse = RequestListType | undefined
export const _getRequestListByIds = async (params: GetRequestListByIdsParam): Promise<CustomResponse<GetRequestListByIdsResponse>> => {
    try {
        const result = await _callFunctions('IRequest-getRequestListByIds', params)
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

export type GetRequestByRequestIdParam = {
    requestId: string
    options?: GetRequestOptionParam
}
export type GetRequestByRequestIdResponse = RequestType | undefined
export const _getRequestByRespondRequestId = async (params: GetRequestByRequestIdParam): Promise<CustomResponse<GetRequestByRequestIdResponse>> => {
    try {
        const result = await _callFunctions('IRequest-getRequestByRespondRequestId', params)
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

export type UpdateRequestParam = {
    request: Update<RequestModel>
}
export type UpdateRequestResponse = boolean | undefined
export const _updateRequest = async (params: UpdateRequestParam): Promise<CustomResponse<UpdateRequestResponse>> => {
    try {
        const result = await _callFunctions('IRequest-updateRequest', params)
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

export type DeleteRequestParam = {
    requestId: string
}
export type DeleteRequestResponse = boolean | undefined
export const _deleteRequest = async (params: DeleteRequestParam): Promise<CustomResponse<DeleteRequestResponse>> => {
    try {
        const result = await _callFunctions('IRequest-deleteRequest', params)
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

export type GetRequestListOfTargetSiteParam = {
    siteId: string
    options?: GetRequestOptionParam
}
export type GetRequestListOfTargetSiteResponse = RequestListType | undefined
/**
 *
 * @param params
 * @returns 現場の手配を全て取得。常用手配＋手配
 */
export const _getRequestListOfTargetSite = async (params: GetRequestListOfTargetSiteParam): Promise<CustomResponse<GetRequestListOfTargetSiteResponse>> => {
    try {
        const result = await _callFunctions('IRequest-getRequestListOfTargetSite', params)
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

export type GetSubRequestListOfTargetRequestParam = {
    requestId: string
    options?: GetRequestOptionParam
}
export type GetSubRequestListOfTargetRequestResponse = RequestListType | undefined
/**
 *
 * @param params
 * @returns 指定した常用依頼へ応答した（下位の）常用依頼を全て取得。
 */
export const _getSubRequestListOfTargetRequest = async (params: GetSubRequestListOfTargetRequestParam): Promise<CustomResponse<GetSubRequestListOfTargetRequestResponse>> => {
    try {
        const result = await _callFunctions('IRequest-getSubRequestListOfTargetRequest', params)
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

export type GetSubRequestListOfTargetSiteParam = {
    siteId: string
    options?: GetRequestOptionParam
}
export type GetSubRequestListOfTargetSiteResponse = RequestListType | undefined
/**
 *
 * @param params
 * @returns 指定した常用依頼へ応答した（下位の）常用依頼を全て取得。
 */
export const _getSubRequestListOfTargetSite = async (params: GetSubRequestListOfTargetSiteParam): Promise<CustomResponse<GetSubRequestListOfTargetSiteResponse>> => {
    try {
        const result = await _callFunctions('IRequest-getSubRequestListOfTargetSite', params)
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

export type GetRequestListOfTargetSiteAndCompanyParam = {
    siteId: string
    companyId: string
    types?: GetCompanyRequestListType
    options?: GetRequestOptionParam
}
export type GetRequestListOfTargetSiteAndCompanyResponse = CompanyRequestListType | undefined
/**
 *
 * @param params
 * @returns ある現場において指定した会社が関連するすべての常用依頼を取得する。
 */
export const _getRequestListOfTargetSiteAndCompany = async (params: GetRequestListOfTargetSiteAndCompanyParam): Promise<CustomResponse<GetRequestListOfTargetSiteAndCompanyResponse>> => {
    try {
        const result = await _callFunctions('IRequest-getRequestListOfTargetSiteAndCompany', params)
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

export type GetRequestListOfTargetRequestAndCompanyParam = {
    requestId: string
    companyId: string
    types?: GetCompanyRequestListType
    options?: GetRequestOptionParam
}
export type GetRequestListOfTargetRequestAndCompanyResponse = CompanyRequestListType | undefined
/**
 *
 * @param params
 * @returns ある常用依頼において指定した会社が関連するすべての常用依頼を取得する。
 */
export const _getRequestListOfTargetRequestAndCompany = async (params: GetRequestListOfTargetRequestAndCompanyParam): Promise<CustomResponse<GetRequestListOfTargetRequestAndCompanyResponse>> => {
    try {
        const result = await _callFunctions('IRequest-getRequestListOfTargetRequestAndCompany', params)
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

export type GetRequestListOfTargetCompanyParam = {
    companyId: string
    types?: GetCompanyRequestListType
    options?: GetRequestOptionParam
}
export type GetRequestListOfTargetCompanyResponse = CompanyRequestListType | undefined
/**
 *
 * @param params
 * @returns 指定した会社が関連するすべての常用依頼を取得する。
 */
export const _getRequestListOfTargetCompany = async (params: GetRequestListOfTargetCompanyParam): Promise<CustomResponse<GetRequestListOfTargetCompanyResponse>> => {
    try {
        const result = await _callFunctions('IRequest-getRequestListOfTargetCompany', params)
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

export type GetRequestListOfTargetCompanyAndMonthParam = {
    companyId: string
    types?: GetCompanyRequestListType
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    options?: GetRequestOptionParam
}
export type GetRequestListOfTargetCompanyAndMonthResponse = CompanyRequestListType | undefined
/**
 *
 * @param params
 * @returns 指定した会社が関連する指定月の常用依頼を取得する。
 */
export const _getRequestListOfTargetCompanyAndMonth = async (params: GetRequestListOfTargetCompanyAndMonthParam): Promise<CustomResponse<GetRequestListOfTargetCompanyAndMonthResponse>> => {
    try {
        const result = await _callFunctions('IRequest-getRequestListOfTargetCompanyAndMonth', params)
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

export type GetRequestOfTargetSiteAndCompaniesParam = {
    siteId: string
    // respondRequestId?: string
    companyId: string
    requestedCompanyId: string
    options?: GetRequestOptionParam
}
export type GetRequestOfTargetSiteAndCompaniesResponse = RequestType | undefined
/**
 *
 * @param params
 * @returns ある現場において指定したそれぞれの会社と関係を持つ常用依頼を取得（１つのはず）
 */
export const _getRequestOfTargetSiteAndCompanies = async (params: GetRequestOfTargetSiteAndCompaniesParam): Promise<CustomResponse<GetRequestOfTargetSiteAndCompaniesResponse>> => {
    try {
        const result = await _callFunctions('IRequest-getRequestOfTargetSiteAndCompanies', params)
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

export type _GetRequestRelationFromTargetCompanyParam = {
    companyId: string
    requestId?: string
    request?: RequestType
}
export type _GetRequestRelationFromTargetCompanyResponse = RequestRelationType | undefined
/**
 *
 * @param params
 * @returns ある現場において指定したそれぞれの会社と関係を持つ常用依頼を取得（１つのはず）
 */
export const _getRequestRelationFromTargetCompany = async (params: _GetRequestRelationFromTargetCompanyParam): Promise<CustomResponse<_GetRequestRelationFromTargetCompanyResponse>> => {
    try {
        const result = await _callFunctions('IRequest-getRequestRelationFromTargetCompany', params)
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
 * - companyId - １つ目の対象会社のID
 * - targetCompanyId - ２つ目の対象会社のID
 * @partial
 * - types - 全て、受注、発注の指定
 * - options - 追加で取得したい情報
 */

export type _GetRequestListOfTargetCompaniesParam = {
    companyId: string
    targetCompanyId: string
    types?: GetCompanyRequestListType
    options?: GetRequestOptionParam
}
/**
 * @summary 指定したそれぞれの会社と関係を持つ常用依頼を取得
 * @objective 請求や、顧客/取引先との最終取引を取得するため
 * @author  Kamiya
 * @param params - {@link _GetRequestListOfTargetCompaniesParam}
 * @returns - CompanyRequestListType
 */
export const _getRequestListOfTargetCompanies = async (params: _GetRequestListOfTargetCompaniesParam): Promise<CustomResponse<CompanyRequestListType>> => {
    try {
        const result = await _callFunctions('IRequest-getRequestListOfTargetCompanies', params)
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
 * - companyId - １つ目の対象会社のID
 * - targetCompanyId - ２つ目の対象会社のID
 * - month - 取得したい月
 * @partial
 * - types - 全て、受注、発注の指定
 * - options - 追加で取得したい情報
 */

export type _GetRequestListOfTargetCompaniesAndMonthParam = {
    companyId: string
    targetCompanyId: string
    types?: GetCompanyRequestListType
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    options?: GetRequestOptionParam
}
/**
 * @summary 指定したそれぞれの会社と関係を持つ常用依頼を取得
 * @objective 請求や、顧客/取引先との最終取引を取得するため
 * @author  Kamiya
 * @param params - {@link _GetRequestListOfTargetCompaniesAndMonthParam}
 * @returns - CompanyRequestListType
 */
export const _getRequestListOfTargetCompaniesAndMonth = async (params: _GetRequestListOfTargetCompaniesAndMonthParam): Promise<CustomResponse<CompanyRequestListType>> => {
    try {
        const result = await _callFunctions('IRequest-getRequestListOfTargetCompaniesAndMonth', params)
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

// requestの時点で会社も確定してるので会社IDも必要ない。
export type GetCompanyPresentAndRequiredNumOfTargetSiteParam = {
    request?: RequestType
    requestId: string
    arrangementOptions?: GetArrangementOptionParam
    requestOptions?: GetRequestOptionParam
}
export type GetCompanyPresentAndRequiredNumOfTargetSiteResponse = RequestMeterType | undefined
/**
 *
 * @param params
 * @returns 指定した会社から見てこの現場への必要手配人数と手配済み人数を取得。
 */
export const _getRequestMeterOfTargetRequest = async (params: GetCompanyPresentAndRequiredNumOfTargetSiteParam): Promise<CustomResponse<GetCompanyPresentAndRequiredNumOfTargetSiteResponse>> => {
    try {
        const result = await _callFunctions('IRequest-getRequestMeterOfTargetRequest', params)
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

export type GetRequestListByReservationIdResponse = RequestListType | undefined

export type GetRequestListByReservationIdParam = {
    reservationId?: string
    options?: GetRequestOptionParam
}

/**
 * @summary 常用予約にひもづく常用依頼の情報を取得する
 * @param params - {@link GetRequestListByReservationIdParam}
 * @returns - GetRequestListByReservationIdResponse
 */
 export const _getRequestListByReservationId = async (params: GetRequestListByReservationIdParam): Promise<CustomResponse<GetRequestListByReservationIdResponse>> => {
    try {
        const result = await _callFunctions('IRequest-getRequestListByReservationId', params)
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
