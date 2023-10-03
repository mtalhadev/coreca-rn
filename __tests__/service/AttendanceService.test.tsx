import { _createAttendance, _deleteAttendance, _getAttendance, _getAttendanceOfTargetArrangement, _getAttendanceListOfTargetSite, _getAttendanceListOfTargetWorkerWithSummary, _getNotReportedAttendanceList, _updateAttendance} from '../../src/services/attendance/AttendanceService'
import { _createArrangement, _deleteArrangement } from '../../src/services/arrangement/ArrangementService'
import { CustomResponse } from '../../src/models/_others/CustomResponse'
import ENV from '../../env/env'
import { initializeFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import { AttendanceType } from '../../src/models/attendance/Attendance'
import { ResponseAttendanceType } from '../../src/models/ResponseAttendance'
import { _createSite, _deleteSite } from '../../src/services/site/SiteService'
import { initTestApp } from '../utils/testUtils'

let attendanceIdArray: string[] = []
let arrangementIdArray: string[] = []
let siteIdArray: string[] = []

beforeAll(() => {
    initTestApp()
})
beforeEach(async()=> {

    let rtn3: CustomResponse<string> = await _createSite({
        startDate: 123456,
        endDate: 127777,
    })
    siteIdArray.push(rtn3.success as string)
    
    rtn3 = await _createSite({
        startDate: 125678,
        endDate: 128888,
    })
    siteIdArray.push(rtn3.success as string)
    
    rtn3 = await _createSite({
        startDate: 126789,
        endDate: 129999,
    })
    siteIdArray.push(rtn3.success as string)
    

    let rtn2: CustomResponse<string> = await _createArrangement({
        siteId: siteIdArray[0],
        workerId: '5555-abcd-aaffff',
    })
    arrangementIdArray.push(rtn2.success as string)

    rtn2 = await _createArrangement({
        siteId: siteIdArray[0],
        workerId: '5555-abcd-aaffff',
    })
    arrangementIdArray.push(rtn2.success as string)

    rtn2 = await _createArrangement({
        siteId: siteIdArray[0],
        workerId: '5555-ijkl-aaffff',
    })
    arrangementIdArray.push(rtn2.success as string)

    rtn2 = await _createArrangement({
        siteId: siteIdArray[0],
        workerId: '5555-mnop-aaffff',
    })
    arrangementIdArray.push(rtn2.success as string)

    rtn2 = await _createArrangement({
        siteId: siteIdArray[2],
        workerId: '5555-mnop-aaffff',
    })
    arrangementIdArray.push(rtn2.success as string)



    let rtn: CustomResponse<string> = await _createAttendance({
        arrangementId: arrangementIdArray[0],
        startDate: 123456,
        endDate: 123999,
        isReported: true,
    })
    attendanceIdArray.push(rtn.success as string)

    rtn = await _createAttendance({
        arrangementId: arrangementIdArray[1],
        startDate: 333333,
        endDate: 333999,
        isReported: false,
    })
    attendanceIdArray.push(rtn.success as string)

    rtn = await _createAttendance({
        arrangementId: arrangementIdArray[0],
        startDate: 333999,
        endDate: 444999,
        isReported: true,
    })
    attendanceIdArray.push(rtn.success as string)

    rtn = await _createAttendance({
        arrangementId: arrangementIdArray[2],
        startDate: 234567,
        endDate: 234999,
        isReported: true,
    })
    attendanceIdArray.push(rtn.success as string)

    rtn = await _createAttendance({
        arrangementId: arrangementIdArray[3],
        startDate: 234567,
        endDate: 234999,
        isReported: true,
    })
    attendanceIdArray.push(rtn.success as string)

    rtn = await _createAttendance({
        arrangementId: arrangementIdArray[4],
        startDate: 234567,
        endDate: 234999,
        isReported: true,
    })
    attendanceIdArray.push(rtn.success as string)

})


afterEach(() => {
    attendanceIdArray.forEach(async(id) => {
        await _deleteAttendance(id)
    })
    attendanceIdArray = []

    arrangementIdArray.forEach(async(id) => {
        await _deleteArrangement(id)
    })
    arrangementIdArray = []

    siteIdArray.forEach(async(id) => {
        await _deleteSite(id)
    })
    siteIdArray = []

})

describe('AttendanceService', () => {
    
    
    it('Insert test', async() => {
        let rtn: CustomResponse<string> = await _createAttendance({arrangementId: '5555-ijkl-aaafff', startDate: 345678})
        attendanceIdArray.push(rtn.success as string) 
        expect(rtn.success).not.toBe(undefined)
    })
    
    it('Read test exist', async() => {
        let rtn: CustomResponse<AttendanceType | undefined> = await _getAttendance(attendanceIdArray[0])
        expect(rtn.success?.arrangementId).toBe(arrangementIdArray[0])
    })

    it('Read test not exist', async() => {
        let rtn: CustomResponse<AttendanceType | undefined> = await _getAttendance('5555-wxyz-aaffff')
        expect(rtn.success?.attendanceId).toBe(undefined)
    })

    it('Update test', async() => {
        
        let rtn: CustomResponse<AttendanceType | undefined> = await _getAttendance(attendanceIdArray[0])
        let attendance: AttendanceType = rtn.success as AttendanceType
        attendance.arrangementId = '5555-wxyz-aaffff'
        
        await _updateAttendance(attendance)
        rtn = await _getAttendance(attendanceIdArray[0])
        expect(rtn.success?.arrangementId).toBe('5555-wxyz-aaffff')
        
    })

    it('Update test not exist', async() => {
        
        let rtn: CustomResponse<AttendanceType | undefined> = await _getAttendance(attendanceIdArray[0])
        let attendance: AttendanceType = rtn.success as AttendanceType
        attendance.attendanceId = '5566-wxyz-aaffff'
        attendance.startDate = 24680
        
        let rtn2: CustomResponse = await _updateAttendance(attendance)
        expect(rtn2.success).toBe(false)
        
    })

    it('Delete test exist', async() => {
        let rtn2: CustomResponse = await _deleteAttendance(attendanceIdArray[0])
        expect(rtn2.success).toBe(true)
    })


    
    it('_getAttendanceListOfTargetArrangement test', async() => {
        let rtn2: CustomResponse<AttendanceType[]> = await _getAttendanceOfTargetArrangement(arrangementIdArray[1])
        expect(rtn2.success?.length).toBe(1)

    })
    
    it('_getAttendanceListOfTargetSite test', async() => {
        let rtn2: CustomResponse<AttendanceType[]> = await _getAttendanceListOfTargetSite(siteIdArray[0])
        expect(rtn2.success?.length).toBe(5)

    })

    it('_getAttendanceListOfTargetWorkerWithSummary test', async() => {
        let rtn2: CustomResponse<ResponseAttendanceType> = await _getAttendanceListOfTargetWorkerWithSummary('5555-mnop-aaffff')
        expect(rtn2.success?.attendances?.length).toBe(2)

    })
    
    it('_getAttendanceListOfTargetWorkerWithSummary test2', async() => {
        let rtn2: CustomResponse<ResponseAttendanceType> = await _getAttendanceListOfTargetWorkerWithSummary('5555-mnop-aaffff')
        expect(rtn2.success?.totalMinutes).toBe(Math.ceil(432/60) * 2)

    })

    it('_getNotReportedAttendanceList test', async() => {
        let rtn2: CustomResponse<AttendanceType[]> = await _getNotReportedAttendanceList('5555-abcd-aaffff')
        expect(rtn2.success?.length).toBe(1)
    })
    
})
