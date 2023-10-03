import mockAxios from "../../../__mocks__/mockAxios";
import { _getArrangement } from "../../../__mocks__/services/ArrangementService";
import { _getAttendance, _getAttendance2, _getAttendanceListFromAttendanceIds, _updateAttendance } from "../../../__mocks__/services/AttendanceService";
import { _getCompany } from "../../../__mocks__/services/CompanyService";
import { _getInvRequest, _getInvRequestListOfTargetDateAndCompany } from "../../../__mocks__/services/InvRequestService";
import { _getSite } from "../../../__mocks__/services/SiteService";
import { _getWorker } from "../../../__mocks__/services/WorkerService";
import { CustomDate, getDailyStartTime, getYYYYMMDDTotalSeconds, newCustomDate } from "../../../src/models/_others/CustomDate";
import { __getEmulatorFunctionsURI } from "../../../src/services/firebase/FunctionsService";
import { getDateAttendanceOption } from "../../../src/usecases/attendance/DateAttendanceCase";
import { GetAttendanceDataOfTargetInvRequestParam, GetAttendanceDataOfTargetSiteParam, getAttendanceDataOfTargetInvRequest, getAttendanceDataOfTargetSite } from "../../../src/usecases/attendance/SiteAttendanceCase";
import { GetSiteAndAttendanceParam } from "../../../src/usecases/attendance/WorkerAttendanceCase";
import { getSiteAndAttendanceModification } from "../../../src/usecases/attendance/WorkerAttendanceModificationCase";

afterEach(() => {
    mockAxios.reset();
    mockAxios.resetHistory();
});

const getArrangementUrl = __getEmulatorFunctionsURI('IArrangement-getArrangement')
const getAttendanceUrl = __getEmulatorFunctionsURI('IAttendance-getAttendance')
const getSiteUrl = __getEmulatorFunctionsURI('ISite-getSite')
const getInvRequestUrl = __getEmulatorFunctionsURI('IInvRequest-getInvRequest')
const getAttendanceListUrl = __getEmulatorFunctionsURI('IAttendance-getAttendanceListFromAttendanceIds')

let params: GetSiteAndAttendanceParam = {
    attendanceId: "attendance-id",
    arrangementId: "arrangement-id"
}
describe('getSiteAndAttendanceModification case', () => {
    it('attendanceId == undefined && arrangementId == undefined test', async () => {
        const res = await getSiteAndAttendanceModification({ attendanceId: undefined, arrangementId: undefined })
        expect(res.error).toEqual('勤怠情報がありません。');
      })

    it('attendanceId == undefined success test', async() => {
        _getArrangement({
            arrangementId: 'arrangement-id',
            options: {
                attendance: true,
                worker: true,
                site: {
                    siteNameData: true,
                },
            },
        })
        const res = await getSiteAndAttendanceModification({ ...params, attendanceId: undefined })
        console.log(res);
        
        expect(mockAxios.history.post.length).toEqual(1);
        expect(mockAxios.history.post[0].url).toEqual(getArrangementUrl);
      })

    it('success test', async() => {
        _getAttendance({
            attendanceId: params.attendanceId || "attendance-id",
            options: {
                arrangement: {
                    worker: true,
                },
            },
        })
        _getSite({
            siteId: 'site-id',
            options: {
                siteNameData: true,
            },
        })
        const res = await getSiteAndAttendanceModification({ ...params })
        console.log(res);
        
        expect(mockAxios.history.post.length).toEqual(2);
        expect(mockAxios.history.post[0].url).toEqual(getAttendanceUrl);
        expect(mockAxios.history.post[1].url).toEqual(getSiteUrl);
      })

    it('error test 1', async () => {
        mockAxios.onPost(getArrangementUrl).networkError();
        const res = await getSiteAndAttendanceModification({ ...params, attendanceId: undefined })
        expect(mockAxios.history.post[0].url).toEqual(getArrangementUrl);
        expect(res.error).toEqual('Network Error');
      })
    it('error test 2', async () => {
        mockAxios.onPost(getAttendanceUrl).networkError();
        const res = await getSiteAndAttendanceModification({ ...params })
        expect(mockAxios.history.post[0].url).toEqual(getAttendanceUrl);
        expect(res.error).toEqual('Network Error');
      })
    it('error test 3', async () => {
        _getAttendance({
            attendanceId: params.attendanceId || "attendance-id",
            options: {
                arrangement: {
                    worker: true,
                },
            },
        })
        mockAxios.onPost(getSiteUrl).networkError();
        const res = await getSiteAndAttendanceModification({ ...params })
        expect(mockAxios.history.post[0].url).toEqual(getAttendanceUrl);
        expect(mockAxios.history.post[1].url).toEqual(getSiteUrl);
        expect(res.error).toEqual('Network Error');
    })
})

let params2: GetAttendanceDataOfTargetInvRequestParam = {
    invRequestId: 'inv-request-id',
    myCompanyId: "my-company-id",
    myWorkerId: "my-worker-id",
}

describe('getAttendanceDataOfTargetInvRequest case', () => {
    it('success test', async() => {
        _getInvRequest({
            invRequestId: 'inv-request-id',
            options: {
                myCompany: true,
                workers: true,
                site: true,
            },
        })
        _getAttendanceListFromAttendanceIds({
            attendanceIds: ['attendance-id'],
            options: {
                arrangement: true,
            },
        })
        const res = await getAttendanceDataOfTargetInvRequest(params2)
        console.log(res);
        
        expect(mockAxios.history.post.length).toEqual(2);
        expect(mockAxios.history.post[0].url).toEqual(getInvRequestUrl);
        expect(mockAxios.history.post[1].url).toEqual(getAttendanceListUrl);
      })

    it('error test 1', async () => {
        mockAxios.onPost(getInvRequestUrl).networkError();

        const res = await getAttendanceDataOfTargetInvRequest(params2)

        expect(mockAxios.history.post[0].url).toEqual(getInvRequestUrl);
        expect(res.error).toEqual('Network Error');
      })

    it('error test 2', async () => {
        _getInvRequest({
            invRequestId: 'inv-request-id',
            options: {
                myCompany: true,
                workers: true,
                site: true,
            },
        })

        mockAxios.onPost(getAttendanceListUrl).networkError();

        const res = await getAttendanceDataOfTargetInvRequest(params2)

        expect(mockAxios.history.post[0].url).toEqual(getInvRequestUrl);
        expect(mockAxios.history.post[1].url).toEqual(getAttendanceListUrl);
        expect(res.error).toEqual('Network Error');
      })
})