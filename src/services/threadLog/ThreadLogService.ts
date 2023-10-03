import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { ThreadLogModel, GetThreadLogOptionParam, ThreadLogType } from '../../models/threadLog/ThreadLog'
import { ThreadLogListType } from '../../models/threadLog/ThreadLogListType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'

export const _createThreadLog = async (threadLog: Create<ThreadLogModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IThreadLog-createThreadLog', threadLog)
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

export type GetThreadLogParam = {
    threadLogId: string
    options?: GetThreadLogOptionParam
}

export type GetThreadLogResponse = ThreadLogType | undefined

export const _getThreadLog = async (params: GetThreadLogParam): Promise<CustomResponse<GetThreadLogResponse>> => {
    try {
        const result = await _callFunctions('IThreadLog-getThreadLog', params)
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

export const _updateThreadLog = async (threadLog: Update<ThreadLogModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IThreadLog-updateThreadLog', threadLog)
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

export type DeleteThreadLogParam = {
    threadLogId: string
}

/**
 * @remarks スレッドログを削除する。
 * @param param 
 * @returns 削除が成功ならtrue
 */
export const _deleteThreadLog = async (param: DeleteThreadLogParam): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IThreadLog-deleteThreadLog', param)
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




export type GetThreadLogListOfTargetWorkerParam = {
    workerId: string
    beforeSecond: number
    limit: number
    options?: GetThreadLogOptionParam
}
export type GetThreadLogListOfTargetWorkerResponse = ThreadLogListType | undefined
/**
 * @remarks ワーカーに属するスレッドログ一覧取得。
 * @param params
 * @returns 
 */
export const _getThreadLogListOfTargetWorker = async (params: GetThreadLogListOfTargetWorkerParam): Promise<CustomResponse<GetThreadLogListOfTargetWorkerResponse>> => {
    try {
        const result = await _callFunctions('IThreadLog-getThreadLogListOfTargetWorker', params)
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
