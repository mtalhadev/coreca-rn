import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { NoteModel, GetNoteOptionParam, NoteType } from '../../models/note/Note'
import { NoteListType } from '../../models/note/NoteListType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'

export const _createNote = async (note: Create<NoteModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('INote-createNote', note)
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

export type GetNoteParam = {
    noteId: string
    options?: GetNoteOptionParam
}

export type GetNoteResponse = NoteType | undefined

export const _getNote = async (params: GetNoteParam): Promise<CustomResponse<GetNoteResponse>> => {
    try {
        const result = await _callFunctions('INote-getNote', params)
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

export const _updateNote = async (note: Update<NoteModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('INote-updateNote', note)
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

export const _deleteNote = async (noteId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('INote-deleteNote', noteId)
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




export type GetNoteListOfTargetRoomParam = {
    roomId: string
    threadId: string
    greaterThan: number
    limit: number
    options?: GetNoteOptionParam
}
export type GetNoteListOfTargetRoomResponse = NoteListType | undefined
/**
 *
 * @param params
 * @returns トークルームに属するメッセージ一覧取得。
 */
 export const _getNoteListOfTargetRoom = async (params: GetNoteListOfTargetRoomParam): Promise<CustomResponse<GetNoteListOfTargetRoomResponse>> => {
    try {
        const result = await _callFunctions('INote-getNoteListOfTargetRoom', params)
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
