import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { NoteModel } from '../../../src/models/note/Note';
import { __getEmulatorFunctionsURI, _callFunctions } from "../../../src/services/firebase/FunctionsService";

let mock: MockAdapter;

beforeAll(() => {
    mock = new MockAdapter(axios, { delayResponse: 2000 });
});
afterEach(() => {
    mock.reset();
    mock.resetHistory()
});

describe('_createNote', () => {
    
    it('_createNote success test', async() => {
        let note: NoteModel = {
            roomId: 'roomId',
            threadId: 'threadId',
            workerId: 'workerId',
            messageId: 'messageId',
            message: "It's a test",
        }
        const url = __getEmulatorFunctionsURI('INote-createNote')
        mock.onPost(url).reply(200, {
            success: 'note-id'
        })
        const result = await _callFunctions('INote-createNote', note)

        expect(mock.history.post[0].url).toEqual(url);
        expect(result.success).toEqual('note-id');
      })

    it('_createNote error test', async () => {
        let note: NoteModel = {
            roomId: 'roomId',
            threadId: 'threadId',
            workerId: 'workerId',
            messageId: 'messageId',
            message: "It's a test",
        }
        const url = __getEmulatorFunctionsURI('INote-createNote')
        
        mock.onPost(url).networkError();
        
        const result = await _callFunctions('INote-createNote', note)
        console.log(result);
        
        expect(mock.history.post[0].url).toEqual(url);
        // expect(result).toEqual();
      })
})

describe('_getNote', () => {
    
    it('_getNote success test', async() => {
        const url = __getEmulatorFunctionsURI('INote-getNote')
        mock.onPost(url).reply(200, {
            success: 'note-id'
        })
        const result = await _callFunctions('INote-getNote')

        expect(mock.history.post[0].url).toEqual(url);
        expect(result.success).toEqual('note-id');
      })

    it('_getNote error test', async() => {
        const url = __getEmulatorFunctionsURI('INote-getNote')
        
        mock.onPost(url).networkError();
        
        const result = await _callFunctions('INote-getNote')
        console.log(result);
        
        expect(mock.history.post[0].url).toEqual(url);
        expect(result.error).toEqual('Network Error');
      })
})