import { ChatNoteUIType } from "../../components/organisms/chat/chatNote/ChatNoteList";
import { NoteType, toNoteCLType } from "../../models/note/Note";
import { NoteAttachmentType, toNoteAttachmentCLType } from "../../models/noteAttachment/NoteAttachment";
import { NoteCommentCLType, NoteCommentType, toNoteCommentCLType } from "../../models/noteComment/NoteComment";
import { NoteReactionType, toNoteReactionCLType } from "../../models/noteReaction/NoteReaction";
import { CustomResponse } from "../../models/_others/CustomResponse";
import { _getNoteListOfTargetRoom } from "../../services/note/NoteService";
import { _getNoteAttachmentListOfTargetNote } from "../../services/noteAttachment/NoteAttachmentService";
import { _getNoteCommentListOfTargetNote } from "../../services/noteComment/NoteCommentService";
import { _getNoteReactionListOfTargetNote } from "../../services/noteReaction/NoteReactionService";
import { getErrorMessage } from "../../services/_others/ErrorService";

export type GetCommentListResponse =
    | NoteCommentCLType[]
    | undefined

// Get Notes list for one-to-one chat

export const getCommentList = async(noteId: string) : Promise<CustomResponse<GetCommentListResponse>> => {
    try {
        const result = await _getNoteCommentListOfTargetNote({
            noteId: noteId,
            options: {
                worker: true
            }
        })

        if (result.error) {
            throw {error: result.error}
        }
        // console.log('_getNoteListOfTargetRoom: ', result.success?.items);
        
        let noteComments: NoteCommentType[] = result.success?.items ?? []
        // console.log('notes: ',notes);
                
        return Promise.resolve( {
            success: noteComments.map(comment => toNoteCommentCLType(comment))
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

