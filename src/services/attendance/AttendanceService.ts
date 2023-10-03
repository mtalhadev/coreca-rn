import { _callFunctions } from '../firebase/FunctionsService'
import { AttendanceModel, AttendanceType, GetAttendanceOptionParam, initAttendance } from '../../models/attendance/Attendance'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { Create, Update } from '../../models/_others/Common'
import { getErrorMessage } from '../_others/ErrorService'
import { AttendanceListType } from '../../models/attendance/AttendanceListType'
import { RequestType } from '../../models/request/Request'

export const _createAttendance = async (attendance: Create<AttendanceModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IAttendance-createAttendance', {...attendance})
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


export const _updateAttendance = async (attendance: Update<AttendanceModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IAttendance-updateAttendance', {...attendance})
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


export type GetAttendanceParam = {
    attendanceId: string
    options?: GetAttendanceOptionParam
}
// export type GetAttendanceOptionParam = {
//     withoutSelf?: AttendanceType
//     withArrangement?: GetArrangementOptionParam
// }
export type GetAttendanceResponse = AttendanceType | undefined
/**
 * 
 * @param params 
 * @param
 * @param withoutSelf?: AttendanceType
    - withArrangement?: OptionParam<GetArrangementOptionParam>
 * @returns 
 */
export const _getAttendance = async (params: GetAttendanceParam): Promise<CustomResponse<GetAttendanceResponse>> => {
    try {
        const result = await _callFunctions('IAttendance-getAttendance', params)
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

export const _deleteAttendance = async (docId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IAttendance-deleteAttendance', docId)
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

export type GetAttendanceListOfTargetSiteParam = {
    siteId: string
    options?: GetAttendanceOptionParam
}
export type GetAttendanceListOfTargetSiteResponse = AttendanceType[] | undefined
export const _getAttendanceListOfTargetSite = async (params: GetAttendanceListOfTargetSiteParam): Promise<CustomResponse<GetAttendanceListOfTargetSiteResponse>> => {
    try {
        const result = await _callFunctions('IAttendance-getAttendanceListOfTargetSite', params)
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

export type GetAttendanceListOfTargetSiteAndWorkerParam = {
    siteId: string
    workerId: string
    options?: GetAttendanceOptionParam
}
export type GetAttendanceListOfTargetSiteAndWorkerResponse = AttendanceType[] | undefined
export const _getAttendanceListOfTargetSiteAndWorker = async (params: GetAttendanceListOfTargetSiteAndWorkerParam): Promise<CustomResponse<GetAttendanceListOfTargetSiteAndWorkerResponse>> => {
    try {
        const result = await _callFunctions('IAttendance-getAttendanceListOfTargetSiteAndWorker', params)
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

export type GetAttendanceListFromAttendanceIdsParam = {
    attendanceIds: string[]
    options?: GetAttendanceOptionParam
}
export type GetAttendanceListFromAttendanceIdsResponse = AttendanceType[] | undefined
export const _getAttendanceListFromAttendanceIds = async (params: GetAttendanceListFromAttendanceIdsParam): Promise<CustomResponse<GetAttendanceListFromAttendanceIdsResponse>> => {
    try {
        const result = await _callFunctions('IAttendance-getAttendanceListFromAttendanceIds', params)
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

export type getConfirmedRespondAttendanceListOfTargetRequestParam = {
    requestId: string
    options?: GetAttendanceOptionParam
    request?: RequestType
}
export type getConfirmedRespondAttendanceListOfTargetRequestResponse = AttendanceListType | undefined
/**
 * @remarks 指定した常用依頼の常用確定した勤怠データを取得する。常用確定の判定は、勤怠が存在し、かつ、手配も存在するか。
 * @param params - {@link getConfirmedRespondAttendanceListOfTargetRequestParam}
 * @returns - {@link getConfirmedRespondAttendanceListOfTargetRequestParam}
 */
export const _getConfirmedRespondAttendanceListOfTargetRequest = async (
    params: getConfirmedRespondAttendanceListOfTargetRequestParam,
): Promise<CustomResponse<getConfirmedRespondAttendanceListOfTargetRequestResponse>> => {
    try {
        const result = await _callFunctions('IAttendance-getConfirmedRespondAttendanceListOfTargetRequest', params)
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

export type getUnconfirmedRespondAttendanceListOfTargetRequestParam = {
    requestId: string
    options?: GetAttendanceOptionParam
    request?: RequestType
}
export type getUnconfirmedRespondAttendanceListOfTargetRequestResponse = AttendanceListType | undefined
/**
 * @remarks 指定した常用依頼の作業員未確定な勤怠データを取得する。arrangementId == 'unconfirmed' or undefined
 * @param params - {@link getConfirmedRespondAttendanceListOfTargetRequestParam}
 * @returns - {@link getConfirmedRespondAttendanceListOfTargetRequestParam}
 */
export const _getUnconfirmedRespondAttendanceListOfTargetRequest = async (
    params: getUnconfirmedRespondAttendanceListOfTargetRequestParam,
): Promise<CustomResponse<getUnconfirmedRespondAttendanceListOfTargetRequestResponse>> => {
    try {
        const result = await _callFunctions('IAttendance-getUnconfirmedRespondAttendanceListOfTargetRequest', params)
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

export type getSubAttendanceListOfTargetRequestParam = {
    requestId: string
    options?: GetAttendanceOptionParam
}
export type getSubAttendanceListOfTargetRequestResponse = AttendanceListType | undefined
/**
 * @remarks 指定した常用依頼の配下の勤怠データを取得する。initialStockから取得。
 * @param params - {@link getSubAttendanceListOfTargetRequestParam}
 * @returns - {@link getSubAttendanceListOfTargetRequestResponse}
 */
export const _getSubAttendanceListOfTargetRequest = async (params: getSubAttendanceListOfTargetRequestParam): Promise<CustomResponse<getSubAttendanceListOfTargetRequestResponse>> => {
    try {
        const result = await _callFunctions('IAttendance-getSubAttendanceListOfTargetRequest', params)
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
