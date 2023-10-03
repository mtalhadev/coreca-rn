import { _callFunctions } from '../firebase/FunctionsService'
import { DateDataModel, DateDataType, GetDateDataOptionParam } from '../../models/date/DateDataType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'
import { YYYYMMDDTotalSecondsParam, YYYYMMTotalSecondsParam } from '../../models/_others/TotalSeconds'
import { ID } from '../../models/_others/ID'
import { Create, Update } from '../../models/_others/Common'


/**
 * @require
 * @param companyId - 必須。会社ID
 * @param date - 必須。日付
 */
export type _getDateDataOfTargetDateAndCompanyParam = {
    companyId: ID
    date: number
    endDate?: number
}
/**
 * DateDataTypeまたはundefinedを返す
 */
export type _getDateDataOfTargetDateAndCompanyResponse = DateDataType[] | undefined
/**
 * @remarks 指定した日付と会社の日付データを取得する。
 * @objective 日付データをID取得する需要はないので、日付と会社での取得を最下層のGET APIとする。
 * @author Hiruma
 * @param params - {@link _getDateDataOfTargetDateAndCompanyParam}
 * @returns - {@link _getDateDataOfTargetDateAndCompanyResponse}
 */
export const _getDateDataOfTargetDateAndCompany = async (params: _getDateDataOfTargetDateAndCompanyParam): Promise<CustomResponse<_getDateDataOfTargetDateAndCompanyResponse>> => {
    try {
        const result = await _callFunctions('IDateData-getDateDataOfTargetDateAndCompany', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}


/**
 * @remarks 日付データを作成する
 * @param dateData 
 * @returns 作成したデータのID
 */
export const _createDateData = async (dateData: Create<DateDataModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IDateData-createDateData', dateData)
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
 * @remarks 日付と会社から日付データを更新する。
 * @param dateData 
 * @returns 日付データが存在すればtrueを返す。
 */
export const _updateDateData = async (dateData: Update<DateDataModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IDateData-updateDateData', dateData)
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
 * @remarks 日付データを削除する
 * @param dateDataId 
 * @returns 削除成功ならtrue。
 */
export const _deleteDateData = async (dateDataId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IDateData-deleteDateData', dateDataId)
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

export type GetDateDataParam = {
    companyId: ID
    date: YYYYMMDDTotalSecondsParam
    endDate?: YYYYMMDDTotalSecondsParam
    options?: GetDateDataOptionParam
}

export type GetDateDataResponse = DateDataType | undefined
export const _getDateData = async (params: GetDateDataParam): Promise<CustomResponse<GetDateDataResponse>> => {
    try {
        const result = await _callFunctions('IDateData-getDateData', params)
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

export type _getDateSiteDataParam = {
    myCompanyId?: string
    date?: YYYYMMDDTotalSecondsParam
}

export type _getDateSiteDataResponse = DateDataType | undefined

export const _getDateSiteData = async (params: _getDateSiteDataParam): Promise<CustomResponse<_getDateSiteDataResponse>> => {
    try {
        const result = await _callFunctions('IDateData-getDateSiteData', params)
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
 * @param myCompanyId - 自社Id。
 * @param month - 手配情報を取得したい月
 */
export type _getAdminHomeDataParam = {
    myCompanyId: string
    month: YYYYMMTotalSecondsParam
    dayCount?: number
}
/**
 * @param DateDataType[] - 指定月の日ごとに、現場と手配可能な作業員の情報が入った配列
 */
export type _getAdminHomeDataResponse = DateDataType[] | undefined
/**
 * @remarks 指定月の現場・手配を取得する。
 * @objective ArrangementHome.tsxにおいて現場・手配状況を取得するため
 * @error
 * - COMPANY_ERROR - 自社Idがなかった場合
 * - MONTH_ERROR - 月が指定されていなかった場合
 * - DATE_DATA_ERROR - 指定月の現場・手配情報の取得に失敗した場合
 * @author Hiruma
 * @param params - {@link _getAdminHomeDataParam}
 * @returns - {@link _getAdminHomeDataResponse}
 */
export const _getAdminHomeData = async (params: _getAdminHomeDataParam): Promise<CustomResponse<_getAdminHomeDataResponse>> => {
    try {
        const result = await _callFunctions('IDateData-getAdminHomeData', params)
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
 * @param myCompanyId - 自社Id。
 * @param month - 手配情報を取得したい月
 * @param weekNumber - 取得したい週の番号。初週は0。デフォルト0
 */
export type _getAdminHomeDataWeeklyParam = {
    myCompanyId: string
    month: YYYYMMTotalSecondsParam
    weekNumber: number
}
/**
 * @param DateDataType[] - 指定週の日ごとに、現場と手配可能な作業員の情報が入った配列
 */
export type _getAdminHomeDataWeeklyResponse = DateDataType[] | undefined
/**
 * @remarks 指定月の現場・手配を取得する。
 * @objective ArrangementHome.tsxにおいて現場・手配状況を取得するため
 * @error
 * - COMPANY_ERROR - 自社Idがなかった場合
 * - MONTH_ERROR - 月が指定されていなかった場合
 * - DATE_DATA_ERROR - 指定月の現場・手配情報の取得に失敗した場合
 * @author Hiruma
 * @param params - {@link _getAdminHomeDataParam}
 * @returns - {@link _getAdminHomeDataResponse}
 */
export const _getAdminHomeDataWeekly = async (params: _getAdminHomeDataWeeklyParam): Promise<CustomResponse<_getAdminHomeDataWeeklyResponse>> => {
    try {
        const result = await _callFunctions('IDateData-getAdminHomeDataWeekly', params)
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

