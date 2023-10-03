import mockAxios from '../../../__mocks__/mockAxios'
import { CustomDate, getDailyStartTime, getYYYYMMDDTotalSeconds, newCustomDate } from '../../../src/models/_others/CustomDate'
import { GetDateDataParam } from '../../../src/services/date/DateDataService'
import { __getEmulatorFunctionsURI } from '../../../src/services/firebase/FunctionsService'
import { GetDateArrangementDataSummaryDataParam, getDateArrangementData, getDateArrangementDataSummaryData, getDateArrangementOption } from '../../../src/usecases/arrangement/DateArrangementCase'

afterEach(() => {
    mockAxios.reset()
    mockAxios.resetHistory()
})

const getDateDataUrl = __getEmulatorFunctionsURI('IDateData-getDateData')
const getHolidayListUrl = __getEmulatorFunctionsURI('IHoliday-getHolidayList')

let date: CustomDate = newCustomDate()
let params: GetDateDataParam = {
    companyId: 'my-company-id',
    date: getYYYYMMDDTotalSeconds(getDailyStartTime(date)),
    options: getDateArrangementOption('my-company-id'),
}

describe('getDateArrangementData case', () => {
    it('myCompanyId = undefined test', async () => {
        const res = await getDateArrangementData({ myCompanyId: undefined })
        expect(res.error).toEqual('自社情報がありません。ログインし直してください。')
    })

    it('date = undefined test', async () => {
        const res = await getDateArrangementData({ myCompanyId: 'my-company-id', date: undefined })
        expect(res.error).toEqual('情報が足りません。')
    })

    it('success test', async () => {
        mockAxios.onPost(getDateDataUrl, params).reply(200, {
            success: {
                dateDataId: 'date-data-id',
                date: params.date,
                companyId: params.companyId,
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
        const res = await getDateArrangementData({ myCompanyId: 'my-company-id', date: date })
        console.log(res)

        expect(mockAxios.history.post[0].url).toEqual(getDateDataUrl)
        expect(res.success?.dateDataId).toEqual('date-data-id')
        expect(res.success?.companyId).toEqual('my-company-id')
    })

    it('error test', async () => {
        mockAxios.onPost(getDateDataUrl).networkError()

        const res = await getDateArrangementData({ myCompanyId: 'my-company-id', date: date })

        expect(mockAxios.history.post[0].url).toEqual(getDateDataUrl)
        expect(res.error).toEqual('Network Error')
    })
})

let params2: GetDateArrangementDataSummaryDataParam = {
    dateData: {
        dateDataId: 'date-data-id',
        date: params.date,
        companyId: 'company-id',
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
}
describe('getDateArrangementDataSummaryData case', () => {
    it('success test', async () => {
        mockAxios.onPost(getHolidayListUrl).reply(200, {
            success: {
                '2018/12/23': '天皇誕生日',
                '2018/11/23': '勤労感謝の日',
                '2018/12/24': '天皇誕生日 振替休日',
                '2018/08/11': '山の日',
                '2018/09/24': '秋分の日 振替休日',
                '2018/11/03': '文化の日',
                '2018/09/23': '秋分の日',
                '2018/04/30': '昭和の日 振替休日',
                '2018/10/08': '体育の日',
            },
        })
        const res = await getDateArrangementDataSummaryData(params2)
        console.log(res)

        expect(mockAxios.history.post[0].url).toEqual(getHolidayListUrl)
        expect(res.success?.dateDataId).toEqual('date-data-id')
        expect(res.success?.companyId).toEqual('company-id')
    })

    it('error test', async () => {
        mockAxios.onPost(getHolidayListUrl).networkError()

        const res = await getDateArrangementDataSummaryData(params2)

        expect(mockAxios.history.post[0].url).toEqual(getHolidayListUrl)
        expect(res.error).toEqual('Network Error')
    })
})
