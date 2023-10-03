import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { RoomModel, GetRoomOptionParam, RoomType } from '../../models/room/Room'
import { RoomListType } from '../../models/room/RoomListType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'

export const _createRoom = async (room: Create<RoomModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IRoom-createRoom', room)
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

export type GetRoomParam = {
    roomId: string
    options?: GetRoomOptionParam
}

export type GetRoomResponse = RoomType | undefined

export const _getRoom = async (params: GetRoomParam): Promise<CustomResponse<GetRoomResponse>> => {
    try {
        const result = await _callFunctions('IRoom-getRoom', params)
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

export const _updateRoom = async (room: Update<RoomModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IRoom-updateRoom', room)
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

export const _deleteRoom = async (roomId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IRoom-deleteRoom', roomId)
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




export type GetRoomListOfTargetWorkerParam = {
    workerId: string
    options?: GetRoomOptionParam
}
export type GetRoomListOfTargetWorkerResponse = RoomListType | undefined
/**
 * @remarks 対象ワーカーに対するトークルーム一覧取得。
 * @param params
 * @returns 
 */
export const _getRoomListOfTargetWorker = async (params: GetRoomListOfTargetWorkerParam): Promise<CustomResponse<GetRoomListOfTargetWorkerResponse>> => {
    try {
        const result = await _callFunctions('IRoom-getRoomListOfTargetWorker', params)
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


export type GetRoomDetailParam = {
    roomId: string
    myCompanyId: string
    myWorkerId: string
    options?: GetRoomOptionParam
}
export type GetRoomDetailResponse = RoomType | undefined
/**
 * @remark 指定したトークルーム詳細を取得する。optionsを渡すことで、周辺情報も取得する。
 * @param options -
 *  
 *  - withoutSelf - 自身を取得しない。周辺情報が欲しい場合に使用。
 *  - account - トークルームの対象アカウントを取得。
 * @returns 
 */
export const _getRoomDetail = async (params: GetRoomDetailParam): Promise<CustomResponse<GetRoomDetailResponse>> => {
    try {
        const result = await _callFunctions('IRoom-getRoomDetail', params)
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
 * @remark 全トークルーム数を取得する。
 * @returns 
 */
export const _getRoomsCount = async (): Promise<CustomResponse<number>> => {
    try {
        const result = await _callFunctions('IRoom-getRoomsCount', {})
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



export type GetRoomOfKeyIdParam = {
    keyId: string
    isTypeOwner?: boolean
    options?: GetRoomOptionParam
}
export type GetRoomOfKeyIdResponse = RoomType | undefined
/**
 * @remarks 対象keyIdに対するトークルーム一覧取得。
 * @param params
 * @returns 
 */
export const _getRoomOfKeyId = async (params: GetRoomOfKeyIdParam): Promise<CustomResponse<GetRoomOfKeyIdResponse>> => {
    try {
        const result = await _callFunctions('IRoom-getRoomOfKeyId', params)
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
