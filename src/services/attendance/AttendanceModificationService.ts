import { _callFunctions } from '../firebase/FunctionsService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { Create, Update } from '../../models/_others/Common'
import { getErrorMessage } from '../_others/ErrorService'
import { AttendanceModificationListType } from '../../models/attendanceModification/AttendanceModificationListType'
import { RequestType } from '../../models/request/Request'
import { AttendanceModificationModel } from '../../models/attendanceModification/AttendanceModification'

export const _createAttendanceModification = async (attendanceModification: Create<AttendanceModificationModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IAttendanceModification-createAttendanceModification', {...attendanceModification})
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


export const _updateAttendanceModification = async (attendanceModification: Update<AttendanceModificationModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IAttendanceModification-updateAttendanceModification', {...attendanceModification})
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


export type GetAttendanceModificationParam = {
    attendanceModificationId: string
}

export type GetAttendanceModificationResponse = AttendanceModificationModel | undefined
/**
 * 
 * @param params 
 * @param
 * @param withoutSelf?: AttendanceModificationType
    - withArrangement?: OptionParam<GetArrangementOptionParam>
 * @returns 
 */
export const _getAttendanceModification = async (params: GetAttendanceModificationParam): Promise<CustomResponse<GetAttendanceModificationResponse>> => {
    try {
        const result = await _callFunctions('IAttendanceModification-getAttendanceModification', params)
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

export const _deleteAttendanceModification = async (docId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IAttendanceModification-deleteAttendanceModification', docId)
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

export type GetAttendanceModificationListOfTargetSiteParam = {
    siteId: string
}
export type GetAttendanceModificationListOfTargetSiteResponse = AttendanceModificationModel[] | undefined
export const _getAttendanceModificationListOfTargetSite = async (params: GetAttendanceModificationListOfTargetSiteParam): Promise<CustomResponse<GetAttendanceModificationListOfTargetSiteResponse>> => {
    try {
        const result = await _callFunctions('IAttendanceModification-getAttendanceModificationListOfTargetSite', params)
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

export type GetAttendanceModificationListOfTargetSiteAndWorkerParam = {
    siteId: string
    workerId: string
}
export type GetAttendanceModificationListOfTargetSiteAndWorkerResponse = AttendanceModificationModel[] | undefined
export const _getAttendanceModificationListOfTargetSiteAndWorker = async (params: GetAttendanceModificationListOfTargetSiteAndWorkerParam): Promise<CustomResponse<GetAttendanceModificationListOfTargetSiteAndWorkerResponse>> => {
    try {
        const result = await _callFunctions('IAttendanceModification-getAttendanceModificationListOfTargetSiteAndWorker', params)
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

export type GetAttendanceModificationListFromAttendanceModificationIdsParam = {
    attendanceModificationIds: string[]
}
export type GetAttendanceModificationListFromAttendanceModificationIdsResponse = AttendanceModificationModel[] | undefined
export const _getAttendanceModificationListFromAttendanceModificationIds = async (params: GetAttendanceModificationListFromAttendanceModificationIdsParam): Promise<CustomResponse<GetAttendanceModificationListFromAttendanceModificationIdsResponse>> => {
    try {
        const result = await _callFunctions('IAttendanceModification-getAttendanceModificationListFromAttendanceModificationIds', params)
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

export type getConfirmedRespondAttendanceModificationListOfTargetRequestParam = {
    requestId: string
    request?: RequestType
}
export type getConfirmedRespondAttendanceModificationListOfTargetRequestResponse = AttendanceModificationListType | undefined
/**
 * @remarks 指定した常用依頼の常用確定した勤怠データを取得する。常用確定の判定は、勤怠が存在し、かつ、手配も存在するか。
 * @param params - {@link getConfirmedRespondAttendanceModificationListOfTargetRequestParam}
 * @returns - {@link getConfirmedRespondAttendanceModificationListOfTargetRequestParam}
 */
export const _getConfirmedRespondAttendanceModificationListOfTargetRequest = async (
    params: getConfirmedRespondAttendanceModificationListOfTargetRequestParam,
): Promise<CustomResponse<getConfirmedRespondAttendanceModificationListOfTargetRequestResponse>> => {
    try {
        const result = await _callFunctions('IAttendanceModification-getConfirmedRespondAttendanceModificationListOfTargetRequest', params)
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

export type getUnconfirmedRespondAttendanceModificationListOfTargetRequestParam = {
    requestId: string
    request?: RequestType
}
export type getUnconfirmedRespondAttendanceModificationListOfTargetRequestResponse = AttendanceModificationListType | undefined
/**
 * @remarks 指定した常用依頼の作業員未確定な勤怠データを取得する。arrangementId == 'unconfirmed' or undefined
 * @param params - {@link getConfirmedRespondAttendanceModificationListOfTargetRequestParam}
 * @returns - {@link getConfirmedRespondAttendanceModificationListOfTargetRequestParam}
 */
export const _getUnconfirmedRespondAttendanceModificationListOfTargetRequest = async (
    params: getUnconfirmedRespondAttendanceModificationListOfTargetRequestParam,
): Promise<CustomResponse<getUnconfirmedRespondAttendanceModificationListOfTargetRequestResponse>> => {
    try {
        const result = await _callFunctions('IAttendanceModification-getUnconfirmedRespondAttendanceModificationListOfTargetRequest', params)
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

export type getSubAttendanceModificationListOfTargetRequestParam = {
    requestId: string
}
export type getSubAttendanceModificationListOfTargetRequestResponse = AttendanceModificationListType | undefined
/**
 * @remarks 指定した常用依頼の配下の勤怠データを取得する。initialStockから取得。
 * @param params - {@link getSubAttendanceModificationListOfTargetRequestParam}
 * @returns - {@link getSubAttendanceModificationListOfTargetRequestResponse}
 */
export const _getSubAttendanceModificationListOfTargetRequest = async (params: getSubAttendanceModificationListOfTargetRequestParam): Promise<CustomResponse<getSubAttendanceModificationListOfTargetRequestResponse>> => {
    try {
        const result = await _callFunctions('IAttendanceModification-getSubAttendanceModificationListOfTargetRequest', params)
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

export type UpdateAttendanceModificationParam = {
    attendanceModificationId?: string,
    targetAttendanceId?: string,
}

export const _approveAttendanceModification = async (params: UpdateAttendanceModificationParam): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IAttendanceModification-approveAttendanceModification', params)
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

export const _unApproveAttendanceModification = async (params: UpdateAttendanceModificationParam): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IAttendanceModification-unApproveAttendanceModification', params)
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