import { _createWorker, _deleteWorker, _getWorker, _getWorkerListOfTargetCompany, _getWorkerListOfTargetSite, _updateWorker} from '../../src/services/worker/WorkerService'
import { getUuidv4} from '../../src/utils/Utils'
import { CustomResponse } from '../../src/models/_others/CustomResponse'
import ENV from '../../env/env'
import { initializeFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { WorkerType } from '../../src/models/worker/Worker'
import { CompanyType } from '../../src/models/company/Company'
import { _createArrangement, _deleteArrangement } from '../../src/services/arrangement/ArrangementService'
import { _createCompany, _deleteCompany } from '../../src/services/company/CompanyService'
import { ResponseWorkerType } from '../../src/models/ResponseWorker'
import { initTestApp } from '../utils/testUtils'

let workerIdArray: string[] = []
let arrangementIdArray: string[] = []
let companyIdArray: string[] = []
beforeAll(() => {
    initTestApp()
})
beforeEach(async()=> {

    let rtn3: CustomResponse<string> = await _createCompany({
        companyId: getUuidv4(),
        name: '株式会社ABC',
    })
    companyIdArray.push(rtn3.success as string)

    rtn3 = await _createCompany({
        companyId: getUuidv4(),
        name: '株式会社EFG',
    })
    companyIdArray.push(rtn3.success as string)

    let rtn: CustomResponse<string> = await _createWorker({
        workerId: getUuidv4(),
        name: 'コレカ太郎',
        companyId: companyIdArray[0],
    })
    workerIdArray.push(rtn.success as string)

    rtn = await _createWorker({
        workerId: getUuidv4(),
        name: 'コレカ三郎',
        companyId: companyIdArray[1],
    })
    workerIdArray.push(rtn.success as string)

    rtn = await _createWorker({
        workerId: getUuidv4(),
        name: 'コレカ花子',
        companyId: companyIdArray[1],
    })
    workerIdArray.push(rtn.success as string)

    let rtn2: CustomResponse<string> = await _createArrangement({
        arrangementId: getUuidv4(),
        siteId: '7777-aaaa-bbcccc',
        workerId: workerIdArray[0],
    })
    arrangementIdArray.push(rtn2.success as string)

    rtn2 = await _createArrangement({
        arrangementId: getUuidv4(),
        siteId: '7777-aaaa-bbcccc',
        workerId: workerIdArray[2],
    })
    arrangementIdArray.push(rtn2.success as string)

    rtn2 = await _createArrangement({
        arrangementId: getUuidv4(),
        siteId: '8888-aaaa-bbcccc',
        workerId: workerIdArray[2],
    })
    arrangementIdArray.push(rtn2.success as string)



})


afterEach(() => {
    workerIdArray.forEach(async(id) => {
        await _deleteWorker(id)
    })
    workerIdArray = []

    arrangementIdArray.forEach(async(id) => {
        await _deleteArrangement(id)
    })
    arrangementIdArray = []

    companyIdArray.forEach(async(id) => {
        await _deleteCompany(id)
    })
    companyIdArray = []

})

describe('WorkerService', () => {
    
    
    it('Insert test', async() => {
        let rtn: CustomResponse<string> = await _createWorker({name: 'コレカ花子', companyId: '2345-ijkl-aaafff'})
        workerIdArray.push(rtn.success as string) 
        expect(rtn.success).not.toBe(undefined)
    })
    
    it('Read test exist', async() => {
        let rtn: CustomResponse<WorkerType | undefined> = await _getWorker(workerIdArray[0])
        expect(rtn.success?.name).toBe('コレカ太郎')
    })

    it('Read test not exist', async() => {
        let rtn: CustomResponse<WorkerType | undefined> = await _getWorker('1234-wxyz-aaffff')
        expect(rtn.success?.workerId).toBe(undefined)
    })

    it('Update test', async() => {
        
        let rtn: CustomResponse<WorkerType | undefined> = await _getWorker(workerIdArray[0])
        let worker: WorkerType = rtn.success as WorkerType
        worker.name = 'コレカ光輝'
        
        await _updateWorker(worker)
        rtn = await _getWorker(workerIdArray[0])
        expect(rtn.success?.name).toBe('コレカ光輝')
        
    })

    it('Update test not exist', async() => {
        
        let rtn: CustomResponse<WorkerType | undefined> = await _getWorker(workerIdArray[0])
        let worker: WorkerType = rtn.success as WorkerType
        worker.workerId = '1234-wxyz-aaffff'
        worker.name = '2345-wxyz-aaffff'
        
        let rtn2: CustomResponse = await _updateWorker(worker)
        expect(rtn2.success).toBe(false)
        
    })

    it('Delete test exist', async() => {
        let rtn2: CustomResponse = await _deleteWorker(workerIdArray[0])
        expect(rtn2.success).toBe(true)
    })

    it('_getWorkerListOfTargetCompany test', async() => {
        let rtn2: CustomResponse<WorkerType[]> = await _getWorkerListOfTargetCompany(companyIdArray[1])
        expect(rtn2.success?.length).toBe(2)
    })

    it('_getWorkerListOfTargetSite test', async() => {
        let rtn2: CustomResponse<ResponseWorkerType> = await _getWorkerListOfTargetSite('7777-aaaa-bbcccc')
        let workers: WorkerType[] = rtn2.success?.workers as WorkerType[]
        let companies: CompanyType[] = rtn2.success?.companies as CompanyType[]
        
        expect(workers.length).toBe(2)
        expect(companies.length).toBe(2)
    })

})
