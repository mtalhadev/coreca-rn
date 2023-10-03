import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { ThreadHeadModel, GetThreadHeadOptionParam, ThreadHeadType } from '../../models/threadHead/ThreadHead'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'

export const _createThreadHead = async (threadHead: Create<ThreadHeadModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IThreadHead-createThreadHead', threadHead)
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

export type GetThreadHeadParam = {
    threadId: string
    options?: GetThreadHeadOptionParam
}

export type GetThreadHeadResponse = ThreadHeadType | undefined

export const _getThreadHead = async (params: GetThreadHeadParam): Promise<CustomResponse<GetThreadHeadResponse>> => {
    try {
        const result = await _callFunctions('IThreadHead-getThreadHead', params)
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

export const _updateThreadHead = async (threadHead: Update<ThreadHeadModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IThreadHead-updateThreadHead', threadHead)
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

export const _deleteThreadHead = async (threadHeadId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IThreadHead-deleteThreadHead', threadHeadId)
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


export type GetThreadHeadByMessageIdParam = {
    messageId: string
    options?: GetThreadHeadOptionParam
}
export type GetThreadHeadByMessageIdResponse = ThreadHeadType | undefined

export const _getThreadHeadByMessageId = async (params: GetThreadHeadByMessageIdParam): Promise<CustomResponse<GetThreadHeadByMessageIdResponse>> => {
    try {
        const result = await _callFunctions('IThreadHead-getThreadHeadByMessageId', params)
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