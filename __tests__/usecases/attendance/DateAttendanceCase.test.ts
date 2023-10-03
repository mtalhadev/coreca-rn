import mockAxios from '../../../__mocks__/mockAxios'
import { _getAttendance, _getAttendance2, _updateAttendance } from '../../../__mocks__/services/AttendanceService'
import { _getCompany } from '../../../__mocks__/services/CompanyService'
import { _getInvRequestListOfTargetDateAndCompany } from '../../../__mocks__/services/InvRequestService'
import { _getSite } from '../../../__mocks__/services/SiteService'
import { _getWorker } from '../../../__mocks__/services/WorkerService'
import { CustomDate, getDailyStartTime, getYYYYMMDDTotalSeconds, newCustomDate } from '../../../src/models/_others/CustomDate'
import { __getEmulatorFunctionsURI } from '../../../src/services/firebase/FunctionsService'
import { getDateAttendanceData, getDateAttendanceDataParam, getDateAttendanceOption } from '../../../src/usecases/attendance/DateAttendanceCase'

afterEach(() => {
    mockAxios.reset()
    mockAxios.resetHistory()
})

const getDateDataUrl = __getEmulatorFunctionsURI('IDateData-getDateData')

let _date: CustomDate = newCustomDate()
let params: getDateAttendanceDataParam = {
    myCompanyId: 'my-company-id',
    date: _date,
}

describe('getDateAttendanceData case', () => {
    it('success test', async () => {
        mockAxios
            .onPost(getDateDataUrl, {
                companyId: params.myCompanyId,
                date: getYYYYMMDDTotalSeconds(getDailyStartTime(_date)),
                options: getDateAttendanceOption(params.myCompanyId),
            })
            .reply(200, {
                success: {
                    dateDataId: 'date-data-id',
                    date: params.date,
                    companyId: params.myCompanyId,
                    sites: [],
                    invRequests: [],
                    arrangementSummary: {
                        arrangedWorkersCount: 0,
                        sitesCount: 0,
                    },
                    attendanceSummary: {
                        sitesCount: 0,
                        arrangedWorkersCount: 0,
                        waitingWorkersCount: 0,
                        unReportedWorkersCount: 0,
                        attendanceModificationRequestCount: 0,
                    },
                },
            })
        const res = await getDateAttendanceData({ ...params })
        console.log(res)

        expect(mockAxios.history.post.length).toEqual(1)
        expect(mockAxios.history.post[0].url).toEqual(getDateDataUrl)
    })

    it('error test', async () => {
        mockAxios.onPost(getDateDataUrl).networkError()
        const res = await getDateAttendanceData({ ...params })

        expect(mockAxios.history.post[0].url).toEqual(getDateDataUrl)
        expect(res.error).toEqual('Network Error')
    })
})
