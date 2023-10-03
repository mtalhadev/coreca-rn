import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { NoteReactionModel } from '../../../src/models/noteReaction/NoteReaction';
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

describe('_createNoteReaction', () => {
    
    it('_createNoteReaction success test', async() => {
        let noteReaction: NoteReactionModel = {
            noteId: getUuidv4(),
            workerId: getUuidv4(),
            reactionChar: "test",
        }
        const url = __getEmulatorFunctionsURI('INoteReaction-createNoteReaction')
        mock.onPost(url).reply(200, {
            success: 'note-reaction-id'
        })
        const result = await _callFunctions('INoteReaction-createNoteReaction', noteReaction)

        expect(mock.history.post[0].url).toEqual(url);
        expect(result.success).toEqual('note-reaction-id');
      })

    it('_createNoteReaction error test', async () => {
        let note: NoteReactionModel = {
            noteId: getUuidv4(),
            workerId: getUuidv4(),
            reactionChar: "test",
        }
        const url = __getEmulatorFunctionsURI('INoteReaction-createNoteReaction')
        
        mock.onPost(url).networkError();
        
        const result = await _callFunctions('INoteReaction-createNoteReaction', note)
        console.log(result);
        
        expect(mock.history.post[0].url).toEqual(url);
        // expect(result).toEqual();
      })
})

describe('_getNoteReaction', () => {
    
    it('_getNoteReaction success test', async() => {
        const url = __getEmulatorFunctionsURI('INoteReaction-getNoteReaction')
        mock.onPost(url).reply(200, {
            success: 'note-reaction-id'
        })
        const result = await _callFunctions('INoteReaction-getNoteReaction')

        expect(mock.history.post[0].url).toEqual(url);
        expect(result.success).toEqual('note-reaction-id');
      })

    it('_getNoteReaction error test', async() => {
        const url = __getEmulatorFunctionsURI('INoteReaction-getNoteReaction')
        
        mock.onPost(url).networkError();
        
        const result = await _callFunctions('INoteReaction-getNoteReaction')
        console.log(result);
        
        expect(mock.history.post[0].url).toEqual(url);
        expect(result.error).toEqual('Network Error');
      })
})