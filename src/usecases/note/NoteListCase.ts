import { ChatNoteUIType } from "../../components/organisms/chat/chatNote/ChatNoteList";
import { NoteType, toNoteCLType } from "../../models/note/Note";
import { NoteAttachmentType, toNoteAttachmentCLType } from "../../models/noteAttachment/NoteAttachment";
import { toNoteCommentCLType } from "../../models/noteComment/NoteComment";
import { NoteReactionType, toNoteReactionCLType } from "../../models/noteReaction/NoteReaction";
import { CustomResponse } from "../../models/_others/CustomResponse";
import { _getNoteListOfTargetRoom } from "../../services/note/NoteService";
import { _getNoteAttachmentListOfTargetNote } from "../../services/noteAttachment/NoteAttachmentService";
import { _getNoteCommentListOfTargetNote } from "../../services/noteComment/NoteCommentService";
import { _getNoteReactionListOfTargetNote } from "../../services/noteReaction/NoteReactionService";
import { getErrorMessage } from "../../services/_others/ErrorService";

export type GetNotesListParam = {
    roomId: string
    threadId: string
    greaterThan: number
}

export type GetNotesListResponse =
    | ChatNoteUIType[]
    | undefined

// Get Notes list for one-to-one chat

export const getNotesList = async(param: GetNotesListParam) : Promise<CustomResponse<GetNotesListResponse>> => {
    try {
        const { roomId, threadId, greaterThan } = param

        const result = await _getNoteListOfTargetRoom({
            roomId: roomId,
            threadId: threadId,
            greaterThan: greaterThan,
            limit: 30,
            options: {
                worker: true
            }
        })

        if (result.error) {
            throw {error: result.error}
        }
        // console.log('_getNoteListOfTargetRoom: ', result.success?.items);
        
        let notes: NoteType[] = result.success?.items ?? []
        // console.log('notes: ',notes);
        
        let rtnList: ChatNoteUIType[] = []
        
        for (let i = 0; i < (notes.length ?? 0); i++) {
            const note  = notes[i]
            const result2 = await _getNoteAttachmentListOfTargetNote({
                noteId: note.noteId ?? 'no-id',
            });
            if (result2.error) {
                throw {error: result2.error}
            }
            const noteAttachments: NoteAttachmentType[] = result2.success?.items ?? [];
            // console.log('noteAttachments: ', noteAttachments);

            const result3 = await _getNoteReactionListOfTargetNote({
                noteId: note.noteId ?? 'no-id',
            });
            if (result3.error) {
                throw {error: result3.error}
            }
            const noteReactions: NoteReactionType[] = result3.success?.items ?? [];
            // console.log('noteReactions: ', noteReactions);
            
            const result4 = await _getNoteCommentListOfTargetNote({
                noteId: note.noteId ?? 'no-id',
            });
            if (result4.error) {
                throw {error: result4.error}
            }
            const noteComments: NoteReactionType[] = result4.success?.items ?? [];
            // console.log('noteComments: ', noteComments);
            rtnList.push({
                note: toNoteCLType(note),
                attachments: noteAttachments.map(item  => toNoteAttachmentCLType(item)),
                comments: noteComments.map(item  => toNoteCommentCLType(item)),
                reactions: noteReactions.map(item  => toNoteReactionCLType(item))
            })
        }
        return Promise.resolve( {
            success: rtnList
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

