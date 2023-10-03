import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { MessageModel, GetMessageOptionParam, MessageType } from '../../models/message/Message'
import { MessageListType } from '../../models/message/MessageListType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'

export const _createMessage = async (message: Create<MessageModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IMessage-createMessage', message)
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

export type GetMessageParam = {
    messageId: string
    options?: GetMessageOptionParam
}

export type GetMessageResponse = MessageType | undefined

export const _getMessage = async (params: GetMessageParam): Promise<CustomResponse<GetMessageResponse>> => {
    try {
        const result = await _callFunctions('IMessage-getMessage', params)
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

export const _updateMessage = async (message: Update<MessageModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IMessage-updateMessage', message)
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

export const _deleteMessage = async (messageId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IMessage-deleteMessage', messageId)
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




export type GetMessageListOfTargetRoomParam = {
    roomId: string
    threadId: string
    greaterThan: number
    limit: number
    options?: GetMessageOptionParam
}
export type GetMessageListOfTargetRoomResponse = MessageListType | undefined
/**
 *
 * @param params
 * @returns トークルームに属するメッセージ一覧取得。
 */
export const _getMessageListOfTargetRoom = async (params: GetMessageListOfTargetRoomParam): Promise<CustomResponse<GetMessageListOfTargetRoomResponse>> => {
    try {
        const result = await _callFunctions('IMessage-getMessageListOfTargetRoom', params)
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
