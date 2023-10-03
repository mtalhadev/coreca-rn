import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { RoomModel } from '../../../src/models/room/Room';
import { getUuidv4 } from '../../../src/utils/Utils';
import { __getEmulatorFunctionsURI, _callFunctions } from "../../../src/services/firebase/FunctionsService";

let mock: MockAdapter;

beforeAll(() => {
    mock = new MockAdapter(axios, { delayResponse: 2000 });
});
afterEach(() => {
    mock.reset();
    mock.resetHistory()
});

describe('_createRoom', () => {
    
    it('_createRoom success test', async() => {
        let room: RoomModel = {
            roomType: 'company',
            name: 'No name',
            keyId: getUuidv4(),
            rootThreadId: getUuidv4(),    
        }
        const url = __getEmulatorFunctionsURI('IRoom-createRoom')
        mock.onPost(url).reply(200, {
            success: 'room-id'
        })
        const result = await _callFunctions('IRoom-createRoom', room)

        expect(mock.history.post[0].url).toEqual(url);
        expect(result.success).toEqual('room-id');
      })

    it('_createRoom error test', async () => {
        let room: RoomModel = {
            roomType: 'company',
            name: 'No name',
            keyId: getUuidv4(),
            rootThreadId: getUuidv4(),
        }
        const url = __getEmulatorFunctionsURI('IRoom-createRoom')
        
        mock.onPost(url).networkError();
        
        const result = await _callFunctions('IRoom-createRoom', room)
        console.log(result);
        
        expect(mock.history.post[0].url).toEqual(url);
        // expect(result).toEqual();
      })
})

describe('_getRoom', () => {
    
    it('_getRoom success test', async() => {
        let room: RoomModel = {
            roomType: 'company',
            name: 'No name',
            keyId: getUuidv4(),
            rootThreadId: getUuidv4(),    
        }
        const url = __getEmulatorFunctionsURI('IRoom-getRoom')
        mock.onPost(url).reply(200, {
            success: 'room-id'
        })
        const result = await _callFunctions('IRoom-getRoom')

        expect(mock.history.post[0].url).toEqual(url);
        expect(result.success).toEqual('room-id');
      })

    it('_getRoom error test', async() => {
        let room: RoomModel = {
            roomType: 'company',
            name: 'No name',
            keyId: getUuidv4(),
            rootThreadId: getUuidv4(),    
        }
        const url = __getEmulatorFunctionsURI('IRoom-getRoom')
        
        mock.onPost(url).networkError();
        
        const result = await _callFunctions('IRoom-getRoom')
        console.log(result);
        
        expect(mock.history.post[0].url).toEqual(url);
        expect(result.error).toEqual('Network Error');
      })
})
