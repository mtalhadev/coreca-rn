import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { NoteAttachmentModel, GetNoteAttachmentOptionParam, NoteAttachmentType } from '../../models/noteAttachment/NoteAttachment'
import { NoteAttachmentListType } from '../../models/noteAttachment/NoteAttachmentListType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'

export const _createNoteAttachment = async (noteAttachment: Create<NoteAttachmentModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('INoteAttachment-createNoteAttachment', noteAttachment)
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

export type GetNoteAttachmentParam = {
    noteAttachmentId: string
    options?: GetNoteAttachmentOptionParam
}

export type GetNoteAttachmentResponse = NoteAttachmentType | undefined

export const _getNoteAttachment = async (params: GetNoteAttachmentParam): Promise<CustomResponse<GetNoteAttachmentResponse>> => {
    try {
        const result = await _callFunctions('INoteAttachment-getNoteAttachment', params)
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

export const _updateNoteAttachment = async (noteAttachment: Update<NoteAttachmentModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('INoteAttachment-updateNoteAttachment', noteAttachment)
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

export const _deleteNoteAttachment = async (noteAttachmentId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('INoteAttachment-deleteNoteAttachment', noteAttachmentId)
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




export type GetNoteAttachmentListOfTargetNoteParam = {
    noteId: string
    options?: GetNoteAttachmentOptionParam
}
export type GetNoteAttachmentListOfTargetNoteResponse = NoteAttachmentListType | undefined
/**
 *
 * @param params
 * @returns ノートに属するアタッチメント一覧取得。
 */
 export const _getNoteAttachmentListOfTargetNote = async (params: GetNoteAttachmentListOfTargetNoteParam): Promise<CustomResponse<GetNoteAttachmentListOfTargetNoteResponse>> => {
    try {
        const result = await _callFunctions('INoteAttachment-getNoteAttachmentListOfTargetNote', params)
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
