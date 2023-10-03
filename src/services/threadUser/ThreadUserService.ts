import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { ThreadUserModel, GetThreadUserOptionParam, ThreadUserType } from '../../models/threadUser/ThreadUser'
import { ThreadUserListType } from '../../models/threadUser/ThreadUserListType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'

export const _createThreadUser = async (threadUser: Create<ThreadUserModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IThreadUser-createThreadUser', threadUser)
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

export type GetThreadUserParam = {
    threadUserId: string
    options?: GetThreadUserOptionParam
}

export type GetThreadUserResponse = ThreadUserType | undefined

export const _getThreadUser = async (params: GetThreadUserParam): Promise<CustomResponse<GetThreadUserResponse>> => {
    try {
        const result = await _callFunctions('IThreadUser-getThreadUser', params)
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

export const _updateThreadUser = async (threadUser: Update<ThreadUserModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IThreadUser-updateThreadUser', threadUser)
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

export type DeleteThreadUserParam = {
    threadUserId: string
}

/**
 * @remarks スレッドログを削除する。
 * @param param 
 * @returns 削除が成功ならtrue
 */
export const _deleteThreadUser = async (param: DeleteThreadUserParam): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IThreadUser-deleteThreadUser', param)
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




export type GetThreadUserListOfTargetWorkerParam = {
    workerId: string
    options?: GetThreadUserOptionParam
}
export type GetThreadUserListOfTargetWorkerResponse = ThreadUserListType | undefined
/**
 * @remarks ワーカーに属するスレッドログ一覧取得。
 * @param params
 * @returns 
 */
export const _getThreadUserListOfTargetWorker = async (params: GetThreadUserListOfTargetWorkerParam): Promise<CustomResponse<GetThreadUserListOfTargetWorkerResponse>> => {
    try {
        const result = await _callFunctions('IThreadUser-getThreadUserListOfTargetWorker', params)
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
