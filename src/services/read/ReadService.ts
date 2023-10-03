import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { ReadModel, GetReadOptionParam, ReadType } from '../../models/read/Read'
import { ReadListType } from '../../models/read/ReadListType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'

export const _createRead = async (read: Create<ReadModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IRead-createRead', read)
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

export type GetReadParam = {
    readId: string
    options?: GetReadOptionParam
}

export type GetReadResponse = ReadType | undefined

export const _getRead = async (params: GetReadParam): Promise<CustomResponse<GetReadResponse>> => {
    try {
        const result = await _callFunctions('IRead-getRead', params)
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

export const _updateRead = async (read: Update<ReadModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IRead-updateRead', read)
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

export const _deleteRead = async (readId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IRead-deleteRead', readId)
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




export type GetReadListOfTargetMessageParam = {
    messageId: string
    options?: GetReadOptionParam
}
export type GetReadListOfTargetMessageResponse = ReadListType | undefined
/**
 * @remarks メッセージに属する既読一覧取得。
 * @param params
 * @returns 
 */
export const _getReadListOfTargetMessage = async (params: GetReadListOfTargetMessageParam): Promise<CustomResponse<GetReadListOfTargetMessageResponse>> => {
    try {
        const result = await _callFunctions('IRead-getReadListOfTargetMessage', params)
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



export type CreateRecordsOfReadParam = {
    messageIds: string[]
    myWorkerId: string
    options?: GetReadOptionParam
}

/**
 * @remarks 既読フラグを追加、メッセージのreadCountインクリメント。
 * @param params
 * @returns 
 */
export const _createRecordsOfRead = async (params: CreateRecordsOfReadParam): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IRead-createRecordsOfRead', params)
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
