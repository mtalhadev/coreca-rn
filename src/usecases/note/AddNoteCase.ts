import { NoteModel } from "../../models/note/Note";
import { NoteAttachmentType } from "../../models/noteAttachment/NoteAttachment";
import { NoteCommentType } from "../../models/noteComment/NoteComment";
import { Create } from "../../models/_others/Common";
import { newCustomDate } from "../../models/_others/CustomDate";
import { CustomResponse } from "../../models/_others/CustomResponse";
import { _createNote } from "../../services/note/NoteService";
import { _createNoteAttachment } from "../../services/noteAttachment/NoteAttachmentService";
import { _createNoteComment } from "../../services/noteComment/NoteCommentService";
import { getErrorMessage } from "../../services/_others/ErrorService";
import { createNewMessage } from "../chat/ChatBatchCase";

export const createNewNote = async(roomId: string, threadId: string, workerId: string, message: string) : Promise<CustomResponse<string>> => {
    try {
        const createMsgResult = await createNewMessage({
            message: {
                roomId,
                threadId,
                isThreadStart: false,
                workerId: workerId,
                message: message,
                messageType: 'note',
                readCount: 0,
                updateCount: 0,
                createdAt: newCustomDate(),
                updatedAt: newCustomDate(),
            },
            myWorkerId: workerId ?? 'no-id',
        })
        if (createMsgResult.error) {
            throw {error: createMsgResult.error}
        }

        const messageId = createMsgResult.success

        if(!messageId) {
            throw {error: 'Unable to create message!'}
        }
        const note: Create<NoteModel> = {
            roomId: roomId,
            threadId: threadId,
            workerId: workerId,
            messageId: messageId,
            message: message,
        }

        const result = await _createNote(note)

        if (result.error) {
            throw {error: result.error}
        }
        console.log('_createNote: ', result.success);

        const attachmentResult: Create<NoteModel> = {
            roomId: roomId,
            threadId: threadId,
            workerId: workerId,
            messageId: messageId,
            message: message,
        }

        return Promise.resolve({
            success: result.success
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export const createNewNoteAttachment = async(attachemnt: NoteAttachmentType) : Promise<CustomResponse<string>> => {
    try {
        const result = await _createNoteAttachment(attachemnt)

        if (result.error) {
            throw {error: result.error}
        }
        console.log('_createNoteAttachment: ', result.success);

        return Promise.resolve({
            success: result.success
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const createNewNoteComment = async(comment: NoteCommentType) : Promise<CustomResponse<string>> => {
    try {
        const result = await _createNoteComment(comment)

        if (result.error) {
            throw {error: result.error}
        }
        console.log('_createNoteComment: ', result.success);

        return Promise.resolve({
            success: result.success
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

