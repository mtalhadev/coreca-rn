import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { ReactionModel, GetReactionOptionParam, ReactionType } from '../../models/reaction/Reaction'
import { ReactionListType } from '../../models/reaction/ReactionListType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'

export const _createReaction = async (reaction: Create<ReactionModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IReaction-createReaction', reaction)
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

export type GetReactionParam = {
    messageId: string
    workerId: string
    reactionChar: string
    options?: GetReactionOptionParam
}

export type GetReactionResponse = ReactionType | undefined

export const _getReaction = async (params: GetReactionParam): Promise<CustomResponse<GetReactionResponse>> => {
    try {
        const result = await _callFunctions('IReaction-getReaction', params)
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

export const _updateReaction = async (reaction: Update<ReactionModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IReaction-updateReaction', reaction)
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

export type DeleteReactionParam = {
    messageId: string
    workerId: string
    reactionChar: string
}

/**
 * @remarks リアクションを削除する。
 * @param params 
 * @returns 削除が成功ならtrue
 */
export const _deleteReaction = async (params: DeleteReactionParam): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IReaction-deleteReaction', params)
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




export type GetReactionListOfTargetMessageParam = {
    messageId: string
    options?: GetReactionOptionParam
}
export type GetReactionListOfTargetMessageResponse = ReactionListType | undefined
/**
 * @remarks メッセージに属するリアクション一覧取得。
 * @param params
 * @returns 
 */
export const _getReactionListOfTargetMessage = async (params: GetReactionListOfTargetMessageParam): Promise<CustomResponse<GetReactionListOfTargetMessageResponse>> => {
    try {
        const result = await _callFunctions('IReaction-getReactionListOfTargetMessage', params)
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


export type AddOrDeleteReactionParam = {
    messageId: string
    workerId: string
    reactionChar: string
}

/**
 * @remarks リアクションを削除する。
 * @param params 
 * @returns 削除が成功ならtrue
 */
export const _addOrDeleteReactionOfTargetMessage = async (params: AddOrDeleteReactionParam): Promise<CustomResponse> => {
    try {
        console.log('********** _addOrDeleteReactionOfTargetMessage ********');
        
        const result = await _callFunctions('IReaction-addOrDeleteReactionOfTargetMessage', params)
        if (result.error) {
            throw {...result}
        }
        console.log('=> result: ', result.success);
        
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}