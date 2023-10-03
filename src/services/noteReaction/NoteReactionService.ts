import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { NoteReactionModel, GetNoteReactionOptionParam, NoteReactionType } from '../../models/noteReaction/NoteReaction'
import { NoteReactionListType } from '../../models/noteReaction/NoteReactionListType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'

export const _createNoteReaction = async (noteReaction: Create<NoteReactionModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('INoteReaction-createNoteReaction', noteReaction)
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

export type GetNoteReactionParam = {
    noteReactionId: string
    options?: GetNoteReactionOptionParam
}

export type GetNoteReactionResponse = NoteReactionType | undefined

export const _getNoteReaction = async (params: GetNoteReactionParam): Promise<CustomResponse<GetNoteReactionResponse>> => {
    try {
        const result = await _callFunctions('INoteReaction-getNoteReaction', params)
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

export const _updateNoteReaction = async (noteReaction: Update<NoteReactionModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('INoteReaction-updateNoteReaction', noteReaction)
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

export const _deleteNoteReaction = async (noteReactionId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('INoteReaction-deleteNoteReaction', noteReactionId)
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




export type GetNoteReactionListOfTargetNoteParam = {
    noteId: string
    options?: GetNoteReactionOptionParam
}
export type GetNoteReactionListOfTargetNoteResponse = NoteReactionListType | undefined
/**
 *
 * @param params
 * @returns メッセージに属するリアクション一覧取得。
 */
 export const _getNoteReactionListOfTargetNote = async (params: GetNoteReactionListOfTargetNoteParam): Promise<CustomResponse<GetNoteReactionListOfTargetNoteResponse>> => {
    try {
        const result = await _callFunctions('INoteReaction-getNoteReactionListOfTargetNote', params)
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


export type AddOrDeleteNoteReactionParam = {
    noteId: string
    workerId: string
    reactionChar: string
}
/**
 *
 * @param params
 * @returns メッセージに属するリアクション一覧取得。
 */
 export const _addOrDeleteNoteReactionOfTargetNote = async (params: AddOrDeleteNoteReactionParam): Promise<CustomResponse<boolean>> => {
    try {
        const result = await _callFunctions('INoteReaction-addOrDeleteNoteReactionOfTargetNote', params)
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
