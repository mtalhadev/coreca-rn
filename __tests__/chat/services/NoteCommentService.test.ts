import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { NoteCommentModel } from '../../../src/models/noteComment/NoteComment';
import { __getEmulatorFunctionsURI, _callFunctions } from "../../../src/services/firebase/FunctionsService";
import { getUuidv4 } from "../../../src/utils/Utils";

let mock: MockAdapter;

beforeAll(() => {
    mock = new MockAdapter(axios, { delayResponse: 2000 });
});
afterEach(() => {
    mock.reset();
    mock.resetHistory()
});

describe('_createNoteComment', () => {
    
    it('_createNoteComment success test', async() => {
        let noteComment: NoteCommentModel = {
            noteId: getUuidv4(),
            noteCommentId: getUuidv4(),
            workerId: getUuidv4(),
            commentType: 'text',
            message: "It's a test",
        }
        const url = __getEmulatorFunctionsURI('INoteComment-createNoteComment')
        mock.onPost(url).reply(200, {
            success: 'note-comment-id'
        })
        const result = await _callFunctions('INoteComment-createNoteComment', noteComment)

        expect(mock.history.post[0].url).toEqual(url);
        expect(result.success).toEqual('note-comment-id');
      })

    it('_createNoteComment error test', async () => {
        let note: NoteCommentModel = {
            noteId: getUuidv4(),
            noteCommentId: getUuidv4(),
            workerId: getUuidv4(),
            commentType: 'text',
            message: "It's a test",
        }
        const url = __getEmulatorFunctionsURI('INoteComment-createNoteComment')
        
        mock.onPost(url).networkError();
        
        const result = await _callFunctions('INoteComment-createNoteComment', note)
        console.log(result);
        
        expect(mock.history.post[0].url).toEqual(url);
        // expect(result).toEqual();
      })
})

describe('_getNoteComment', () => {
    
    it('_getNoteComment success test', async() => {
        const url = __getEmulatorFunctionsURI('INoteComment-getNoteComment')
        mock.onPost(url).reply(200, {
            success: 'note-comment-id'
        })
        const result = await _callFunctions('INoteComment-getNoteComment')

        expect(mock.history.post[0].url).toEqual(url);
        expect(result.success).toEqual('note-comment-id');
      })

    it('_getNoteComment error test', async() => {
        const url = __getEmulatorFunctionsURI('INoteComment-getNoteComment')
        
        mock.onPost(url).networkError();
        
        const result = await _callFunctions('INoteComment-getNoteComment')
        console.log(result);
        
        expect(mock.history.post[0].url).toEqual(url);
        expect(result.error).toEqual('Network Error');
      })
})