import _ from 'lodash'
import { LockType } from '../../src/models/lock/lock'
import { GetLockResponse, _createLock, _deleteLock, _getLock, _updateLock } from '../../src/services/_others/LockService'
import { _createWorker, _deleteWorker } from '../../src/services/worker/WorkerService'
import { CustomResponse } from '../../src/models/_others/CustomResponse'
import { CustomDate } from "../../src/models/_others/CustomDate"
import { initTestApp } from '../utils/testUtils'


let lockIdArray: string[] = []
let workerIdArray: string[] = []

beforeAll(() => {
    initTestApp()
})
beforeEach(async()=> {
    const rtn: CustomResponse<string> = await _createWorker({
        workerId: 'worker-123',
        name: 'コレカ太郎',
        companyId: 'company-123',
    })
    workerIdArray.push(rtn.success as string)
    const rtn2: CustomResponse<string> = await _createWorker({
        workerId: 'worker-456',
        name: 'コレカ次郎',
        companyId: 'company-123'
    })
    workerIdArray.push(rtn2.success as string)

    const rtn3: CustomResponse<string> = await _createLock({
        lockedAt: 595959,
        lockedBy: 'worker-123',
        modelType: 'worker',
        targetId: 'worker-123'
    })
    lockIdArray.push(rtn3.success as string)
})


afterEach(() => {
    lockIdArray.forEach(async(id) => {
        await _deleteLock(id)
    })
    lockIdArray = []
    lockIdArray.forEach(async(id) => {
        await _deleteWorker(id)
    })
    workerIdArray = []
})

describe('LockService', () => {
    it('Read test exist', async() => {
        const rtn: CustomResponse<GetLockResponse> = await _getLock({lockId: lockIdArray[0]})
        expect(rtn.success?.lockId).toBe(lockIdArray[0])
    })

    it('Read test not exist', async() => {
        const rtn: CustomResponse<GetLockResponse> = await _getLock({lockId: 'no-id'})
        expect(rtn.success).toBe(undefined)
    })

    it('Update test', async() => {
        const rtn: CustomResponse<GetLockResponse> = await _getLock({lockId: lockIdArray[0]})
        const newLock: LockType = _.cloneDeep(rtn.success) as LockType
        newLock.lockedAt = 565656
        await _updateLock(newLock)
        const rtn2: CustomResponse<GetLockResponse> = await _getLock({lockId: lockIdArray[0]})
        expect(rtn2.success?.lockedAt).toBe(565656)
    })

    it('Insert test', async() => {
        const rtn: CustomResponse<string> = await _createLock({
            lockedAt: new CustomDate().totalSeconds,
            lockedBy: 'worker-456',
            modelType: 'worker',
            targetId: 'worker-456'
        })
        lockIdArray.push(rtn.success as string)
        expect(rtn.success).not.toBe(undefined)
    })

    it('Delete test exist', async() => {
        const rtn2: CustomResponse = await _deleteLock(lockIdArray[0])
        expect(rtn2.success).toBe(true)
    })
})
