import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { NoteCommentModel, GetNoteCommentOptionParam, NoteCommentType } from '../../models/noteComment/NoteComment'
import { NoteCommentListType } from '../../models/noteComment/NoteCommentListType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'

export const _createNoteComment = async (noteComment: Create<NoteCommentModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('INoteComment-createNoteComment', noteComment)
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

export type GetNoteCommentParam = {
    noteCommentId: string
    options?: GetNoteCommentOptionParam
}

export type GetNoteCommentResponse = NoteCommentType | undefined

export const _getNoteComment = async (params: GetNoteCommentParam): Promise<CustomResponse<GetNoteCommentResponse>> => {
    try {
        const result = await _callFunctions('INoteComment-getNoteComment', params)
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

export const _updateNoteComment = async (noteComment: Update<NoteCommentModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('INoteComment-updateNoteComment', noteComment)
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

export const _deleteNoteComment = async (noteCommentId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('INoteComment-deleteNoteComment', noteCommentId)
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




export type GetNoteCommentListOfTargetNoteParam = {
    noteId: string
    options?: GetNoteCommentOptionParam
}
export type GetNoteCommentListOfTargetNoteResponse = NoteCommentListType | undefined
/**
 *
 * @param params
 * @returns ノートに属するノートコメント一覧取得。
 */
 export const _getNoteCommentListOfTargetNote = async (params: GetNoteCommentListOfTargetNoteParam): Promise<CustomResponse<GetNoteCommentListOfTargetNoteResponse>> => {
    try {
        const result = await _callFunctions('INoteComment-getNoteCommentListOfTargetNote', params)
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
