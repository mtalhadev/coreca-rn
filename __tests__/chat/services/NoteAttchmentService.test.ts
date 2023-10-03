import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { NoteAttachmentModel } from '../../../src/models/noteAttachment/NoteAttachment';
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

describe('_createNoteAttachment', () => {
    
    it('_createNoteAttachment success test', async() => {
        let noteAttachment: NoteAttachmentModel = {
            noteId: getUuidv4(),
            index: 1,
            attachmentType: 'picture',
            attachmentUrl: "https://attachment-url",
            sAttachmentUrl: "https://attachment-url",
            xsAttachmentUrl: "https://attachment-url",
        }
        const url = __getEmulatorFunctionsURI('INoteAttachment-createNoteAttachment')
        mock.onPost(url).reply(200, {
            success: 'note-id'
        })
        const result = await _callFunctions('INoteAttachment-createNoteAttachment', noteAttachment)

        expect(mock.history.post[0].url).toEqual(url);
        expect(result.success).toEqual('note-id');
      })

    it('_createNoteAttachment error test', async () => {
        let note: NoteAttachmentModel = {
            noteId: getUuidv4(),
            index: 1,
            attachmentType: 'picture',
            attachmentUrl: "https://attachment-url",
            sAttachmentUrl: "https://attachment-url",
            xsAttachmentUrl: "https://attachment-url",
        }
        const url = __getEmulatorFunctionsURI('INoteAttachment-createNoteAttachment')
        
        mock.onPost(url).networkError();
        
        const result = await _callFunctions('INoteAttachment-createNoteAttachment', note)
        console.log(result);
        
        expect(mock.history.post[0].url).toEqual(url);
        // expect(result).toEqual();
      })
})

describe('_getNoteAttachment', () => {
    
    it('_getNoteAttachment success test', async() => {
        const url = __getEmulatorFunctionsURI('INoteAttachment-getNoteAttachment')
        mock.onPost(url).reply(200, {
            success: 'note-id'
        })
        const result = await _callFunctions('INoteAttachment-getNoteAttachment')

        expect(mock.history.post[0].url).toEqual(url);
        expect(result.success).toEqual('note-id');
      })

    it('_getNoteAttachment error test', async() => {
        const url = __getEmulatorFunctionsURI('INoteAttachment-getNoteAttachment')
        
        mock.onPost(url).networkError();
        
        const result = await _callFunctions('INoteAttachment-getNoteAttachment')
        console.log(result);
        
        expect(mock.history.post[0].url).toEqual(url);
        expect(result.error).toEqual('Network Error');
      })
})