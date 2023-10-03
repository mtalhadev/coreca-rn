import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { ReservationModel, ReservationType, GetReservationOptionParam } from '../../models/reservation/Reservation'
import { getErrorMessage } from '../_others/ErrorService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { ReservationListType } from '../../models/reservation/ReservationListType'
import { _getSite } from '../site/SiteService'
import { _getWorker } from '../worker/WorkerService'
import { YYYYMMDDTotalSecondsParam } from '../../models/_others/TotalSeconds'
import { CompanyReservationListType, GetCompanyReservationListType } from '../../models/reservation/CompanyRequestListType'
import { ID } from '../../models/_others/ID'


/**
 *
 * @param reservation {@link ReservationModel}
 * @returns
 */
export const _createReservation = async (reservation: Create<ReservationModel>): Promise<CustomResponse<ID>> => {
    try {
        const result = await _callFunctions('IReservation-createReservation', reservation)
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

export type GetReservationParam = {
    reservationId: string
    options?: GetReservationOptionParam
}

export type GetReservationResponse = ReservationType | undefined

export const _getReservation = async (params: GetReservationParam): Promise<CustomResponse<GetReservationResponse>> => {
    try {
        const result = await _callFunctions('IReservation-getReservation', params)
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

export const _updateReservation = async (reservation: Update<ReservationModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IReservation-updateReservation', reservation)
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
export const _deleteReservation = async (reservationId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IReservation-deleteReservation', reservationId)
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

export type GetReservationListByIdsParam = {
    reservationIds: string[]
    options?: GetReservationOptionParam
}
export type GetReservationListByIdsResponse = ReservationListType | undefined
export const _getReservationListByIds = async (params: GetReservationListByIdsParam): Promise<CustomResponse<GetReservationListByIdsResponse>> => {
    try {
        const result = await _callFunctions('IReservation-getReservationListByIds', params)
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

export type GetReservationListOfTargetSiteOrDateParam = {
    siteId?: string
    date?: YYYYMMDDTotalSecondsParam
    myCompanyId?: string
    targetCompanyId?: string
    options?: GetReservationOptionParam
}
export type GetReservationListOfTargetSiteOrDateResponse = ReservationListType | undefined
/**
 *
 * @param siteId - siteIdがdateのどちらかを入力
 * @param date - 存在する場合siteIdは無視される。
 * @param myCompanyId - 存在する場合myCompanyIdでフィルター
 * @param targetCompanyId - 存在する場合targetCompanyIdでフィルター。myCompanyIdと同時に存在可能でその場合両方でフィルター。
 * @returns 指定日付か現場の開始日時の指定した会社への（からの）常用予約をすべて取得する。
 */
export const _getReservationListOfTargetSiteDateAndCompany = async (params: GetReservationListOfTargetSiteOrDateParam): Promise<CustomResponse<GetReservationListOfTargetSiteOrDateResponse>> => {
    try {
        const result = await _callFunctions('IReservation-getReservationListOfTargetSiteDateAndCompany', params)
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

export type GetReservationOfTargetConstructionAndCompaniesParam = {
    constructionId: string
    myCompanyId: string
    targetCompanyId: string
    options?: GetReservationOptionParam
}
export type GetReservationOfTargetConstructionAndCompaniesResponse = ReservationType | undefined
/**
 * @remarks ある工事において指定したそれぞれの会社と関係を持つ常用予約を取得（１つのはず）
 * @param params
 * @returns 
 */
export const _getReservationOfTargetConstructionAndCompanies = async (params: GetReservationOfTargetConstructionAndCompaniesParam): Promise<CustomResponse<GetReservationOfTargetConstructionAndCompaniesResponse>> => {
    try {
        const result = await _callFunctions('IReservation-getReservationOfTargetConstructionAndCompanies', params)
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

export type GetReservationListOfTargetCompanyParam = {
    companyId: string
    types?: GetCompanyReservationListType
    options?: GetReservationOptionParam
}
export type GetReservationListOfTargetCompanyResponse = CompanyReservationListType | undefined
/**
 * @remarks 指定した会社が関連するすべての常用依頼予約を取得する。
 * @param params
 * @returns 
 */
export const _getReservationListOfTargetCompany = async (params: GetReservationListOfTargetCompanyParam): Promise<CustomResponse<GetReservationListOfTargetCompanyResponse>> => {
    try {
        const result = await _callFunctions('IReservation-getReservationListOfTargetCompany', params)
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
