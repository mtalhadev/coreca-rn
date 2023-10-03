import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { RoomUserModel, GetRoomUserOptionParam, RoomUserType } from '../../models/roomUser/RoomUser'
import { RoomUserListType } from '../../models/roomUser/RoomUserListType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'
import { CompanyType, GetCompanyOptionParam } from '../../models/company/Company'
import { GetWorkerOptionParam, WorkerType } from '../../models/worker/Worker'

export const _createRoomUser = async (roomUser: Create<RoomUserModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IRoomUser-createRoomUser', roomUser)
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

export type GetRoomUserParam = {
    roomUserId: string
    options?: GetRoomUserOptionParam
}

export type GetRoomUserResponse = RoomUserType | undefined

export const _getRoomUser = async (params: GetRoomUserParam): Promise<CustomResponse<GetRoomUserResponse>> => {
    try {
        const result = await _callFunctions('IRoomUser-getRoomUser', params)
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

export const _updateRoomUser = async (roomUser: Update<RoomUserModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IRoomUser-updateRoomUser', roomUser)
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


export type DeleteRoomUserParam = {
    roomId: string
    workerId: string
}
/**
 * @remarks ルームユーザーを削除する。
 * @param param
 * @returns 削除が成功ならtrue
 */
export const _deleteRoomUser = async (param: DeleteRoomUserParam): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IRoomUser-deleteRoomUser', param)
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




export type GetRoomUserListOfTargetRoomParam = {
    roomId: string
    options?: GetRoomUserOptionParam
}
export type GetRoomUserListOfTargetRoomResponse = RoomUserListType | undefined
/**
 * @remarks ルームに属するユーザ一覧取得。
 * @param params
 * @returns 
 */
export const _getRoomUserListOfTargetRoom = async (params: GetRoomUserListOfTargetRoomParam): Promise<CustomResponse<GetRoomUserListOfTargetRoomResponse>> => {
    try {
        const result = await _callFunctions('IRoomUser-getRoomUserListOfTargetRoom', params)
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

export type GetRoomUserListOfTargetWorkerParam = {
    workerId: string
    options?: GetRoomUserOptionParam
}
export type GetRoomUserListOfTargetWorkerResponse = RoomUserListType | undefined
/**
 * @remarks ワーカーに属するルームユーザ一覧取得。
 * @param params
 * @returns 
 */
export const _getRoomUserListOfTargetWorker = async (params: GetRoomUserListOfTargetWorkerParam): Promise<CustomResponse<GetRoomUserListOfTargetWorkerResponse>> => {
    try {
        const result = await _callFunctions('IRoomUser-getRoomUserListOfTargetWorker', params)
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


export type GetTargetCompanyOfTargetRoomParam = {
    myCompanyId: string
    roomId: string
    options?: GetCompanyOptionParam
}
export type GetTargetCompanyOfTargetRoomResponse = CompanyType | undefined
/**
 * @remarks roomIdとmyCompanyIdから相手の会社を取得。
 * @param params
 * @returns 
 */
export const _getTargetCompanyOfTargetRoom = async (params: GetTargetCompanyOfTargetRoomParam): Promise<CustomResponse<GetTargetCompanyOfTargetRoomResponse>> => {
    try {
        const result = await _callFunctions('IRoomUser-getTargetCompanyOfTargetRoom', params)
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


export type GetTargetWorkerOfTargetRoomParam = {
    myWorkerId: string
    roomId: string
    options?: GetWorkerOptionParam
}
export type GetTargetWorkerOfTargetRoomResponse = WorkerType | undefined
/**
 * @remarks contractIdとmyWorkerIdから相手のワーカー情報を取得。
 * @param params
 * @returns 
 */
export const _getTargetWorkerOfTargetRoom = async (params: GetTargetWorkerOfTargetRoomParam): Promise<CustomResponse<GetTargetWorkerOfTargetRoomResponse>> => {
    try {
        const result = await _callFunctions('IRoomUser-getTargetWorkerOfTargetRoom', params)
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


export type GetRoomUserListWithPagingOfTargetWorkerParam = {
    workerId: string
    isProject: boolean
    beforeSecond: number
    limit: number
    options?: GetRoomUserOptionParam
}
export type GetRoomUserListWithPagingOfTargetWorkerResponse = RoomUserListType | undefined
/**
 * @remarks ワーカーに属するルームユーザ一覧取得。（ページング、案件・工事か、それ以外かでフィルター）
 * @param params
 * @returns 
 */
export const _getRoomUserListWithPagingOfTargetWorker = async (params: GetRoomUserListWithPagingOfTargetWorkerParam): Promise<CustomResponse<GetRoomUserListWithPagingOfTargetWorkerResponse>> => {
    try {
        const result = await _callFunctions('IRoomUser-getRoomUserListWithPagingOfTargetWorker', params)
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

export type GetRoomUserListByProjectIdsParam = {
    projectIds: string[];
    workerId: string;
    options?: GetRoomUserOptionParam;
};
export type GetRoomUserListByProjectIdsResponse = RoomUserListType | undefined;
/**
 * @remarks 指定した案件IDに当てはまるルームユーザリストを取得。
 * @param params 
 * @returns 
 */
export const _getRoomUserListByProjectIds = async (
    params: GetRoomUserListByProjectIdsParam
): Promise<CustomResponse<GetRoomUserListByProjectIdsResponse>> => {
    try {
        const result = await _callFunctions('IRoomUser-getRoomUserListByProjectIds', params)
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


export type GetOrderCompanyOfTargetProjectParam = {
    projectId: string
    myCompanyId: string
    options?: GetWorkerOptionParam
}
export type GetOrderCompanyOfTargetProjectResponse = CompanyType | undefined
/**
 * @remarks projectIdとmyCompanyIdからcontractのorderCompany情報を取得。
 * @param params
 * @returns 
 */
export const _getOrderCompanyOfTargetProject = async (
    params: GetOrderCompanyOfTargetProjectParam
): Promise<CustomResponse<GetOrderCompanyOfTargetProjectResponse>> => {
    try {
        const result = await _callFunctions('IRoomUser-getOrderCompanyOfTargetProject', params)
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