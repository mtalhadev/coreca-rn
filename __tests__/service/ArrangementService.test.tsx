import {
    _createArrangement,
    _deleteArrangement,
    _getArrangement,
    _getArrangementListOfTargetSite,
    _getArrangementListOfTargetWorker,
    _updateArrangement,
} from '../../src/services/arrangement/ArrangementService'
import { CustomResponse } from '../../src/models/_others/CustomResponse'
import ENV from '../../env/env'
import { ArrangementType } from '../../src/models/arrangement/Arrangement'
import axios from "axios";
import MockAdapter from "axios-mock-adapter";
import { getUuidv4 } from '../../src/utils/Utils';
import { __getEmulatorFunctionsURI } from '../../src/services/firebase/FunctionsService';

let mock: MockAdapter;

beforeAll(() => {
    mock = new MockAdapter(axios, { delayResponse: 2000 });
});
afterEach(() => {
    mock.reset();
    mock.resetHistory()
});

let arrangementIdArray: string[] = []
// beforeAll(() => {
//     initTestApp()
// })
// beforeEach(async () => {
//     // const arrangement:ArrangementType = {
//     //     siteId: '1234-abcd-aaffff',
//     //     workerId: '2345-abcd-aaffff',
//     //     arrangementId: 'arrangementId-1',
//     // }
//     // let rtn: CustomResponse<string> = await _createArrangement({arrangement})
//     // arrangementIdArray.push(rtn.success as string)
//     // rtn = await _createArrangement({
//     //     siteId: '1234-efgh-aaffff',
//     //     workerId: '2345-efgh-aaffff',
//     // })
//     // arrangementIdArray.push(rtn.success as string)
//     // rtn = await _createArrangement({
//     //     siteId: '1234-efgh-aaffff',
//     //     workerId: '2345-ijkl-aaffff',
//     // })
//     // arrangementIdArray.push(rtn.success as string)
//     // rtn = await _createArrangement({
//     //     siteId: '1234-xyzw-aaffff',
//     //     workerId: '2345-efgh-aaffff',
//     // })
//     // arrangementIdArray.push(rtn.success as string)
// })

// afterEach(() => {
//     // arrangementIdArray.forEach(async(id) => {
//     //     await _deleteArrangement({arrangementId:id})
//     // })
//     // arrangementIdArray = []
// })

//yarn test ./ArrangementService.test.tsx
describe('ArrangementService', () => {
    const arrangement: ArrangementType = {
        siteId: 'siteId1',
        workerId: 'workerId1',
        arrangementId: 'arrangementId-test',
    }
    it('Insert test', async () => {

        const url = __getEmulatorFunctionsURI('IArrangement-createArrangement')
        mock.onPost(url).reply(200, {
            success: arrangement.arrangementId
        })

        const result = await _createArrangement({arrangement})

        expect(mock.history.post[0].url).toEqual(url);
        expect(result.success).toEqual(arrangement.arrangementId);
    })

    it('Read test exist', async() => {
        const url = __getEmulatorFunctionsURI('IArrangement-getArrangement')
        mock.onPost(url).reply(200, {
            success: arrangement
        })

        const result = await _getArrangement({arrangementId: arrangement.arrangementId ?? ''})

        expect(mock.history.post[0].url).toEqual(url);
        expect(result.success).toEqual(arrangement);
    })

    // it('Read test not exist', async() => {
    //     let rtn: CustomResponse<ArrangementType | undefined> = await _getArrangement('1234-wxyz-aaffff')
    //     expect(rtn.success?.arrangementId).toBe(undefined)
    // })

    // it('Update test', async() => {

    //     let rtn: CustomResponse<ArrangementType | undefined> = await _getArrangement(arrangementIdArray[0])
    //     let arrangement: ArrangementType = rtn.success as ArrangementType
    //     arrangement.siteId = '2345-wxyz-aaffff'

    //     await _updateArrangement(arrangement)
    //     rtn = await _getArrangement(arrangementIdArray[0])
    //     expect(rtn.success?.siteId).toBe('2345-wxyz-aaffff')

    // })

    // it('Update test not exist', async() => {

    //     let rtn: CustomResponse<ArrangementType | undefined> = await _getArrangement(arrangementIdArray[0])
    //     let arrangement: ArrangementType = rtn.success as ArrangementType
    //     arrangement.arrangementId = '1234-wxyz-aaffff'
    //     arrangement.siteId = '2345-wxyz-aaffff'

    //     let rtn2: CustomResponse = await _updateArrangement(arrangement)
    //     expect(rtn2.success).toBe(false)

    // })

    it('Delete test exist', async() => {
        const url = __getEmulatorFunctionsURI('IArrangement-deleteArrangement')
        mock.onPost(url).reply(200, {
            success: arrangement
        })

        const result = await _deleteArrangement({arrangementId: arrangement.arrangementId ?? ''})
        //TODO: ここでarrangementが帰ってくる。booleanのはずなのに

        expect(mock.history.post[0].url).toEqual(url);
        expect(result.success).toEqual(true);
    })

    // it('_getArrangementListOfTargetSite test', async() => {
    //     let rtn2: CustomResponse<ArrangementType[]> = await _getArrangementListOfTargetSite('1234-efgh-aaffff')
    //     expect(rtn2.success?.length).toBe(2)
    // })

    // it('_getArrangementListOfTargetWorker test', async() => {
    //     let rtn2: CustomResponse<ArrangementType[]> = await _getArrangementListOfTargetWorker('2345-efgh-aaffff')
    //     expect(rtn2.success?.length).toBe(2)
    // })
})
