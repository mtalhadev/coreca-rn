import mockAxios from '../../../__mocks__/mockAxios'
import {
    _getAttendance,
    _getAttendance2,
    _getAttendanceListFromAttendanceIds,
    _getAttendanceListFromAttendanceIds_BundleAttendance,
    _getAttendance_newAttendances,
    _updateAttendance,
} from '../../../__mocks__/services/AttendanceService'
import { _getCompany } from '../../../__mocks__/services/CompanyService'
import { _getInvRequest, _getInvRequestListOfTargetDateAndCompany } from '../../../__mocks__/services/InvRequestService'
import { _getSite, _getSite_BundleAttendance } from '../../../__mocks__/services/SiteService'
import { _getWorker } from '../../../__mocks__/services/WorkerService'
import { AttendanceModel } from '../../../src/models/attendance/Attendance'
import { __getEmulatorFunctionsURI } from '../../../src/services/firebase/FunctionsService'
import {
    AutoCreateAttendanceOfSelectedWorkerParam,
    GetAttendanceDataOfTargetInvRequestParam,
    GetAttendanceDataOfTargetSiteParam,
    autoCreateAttendanceOfSelectedWorker,
    getAttendanceDataOfTargetInvRequest,
    getAttendanceDataOfTargetSite,
    getSiteForEditBundleAttendance,
} from '../../../src/usecases/attendance/SiteAttendanceCase'
import { toCustomDateFromTotalSeconds } from '../../../src/models/_others/CustomDate'
import { _getArrangementListOfTargetConstruction } from '../../../src/services/arrangement/ArrangementService'
import { _getArrangementListOfTargetSite } from '../../../__mocks__/services/ArrangementService'

afterEach(() => {
    mockAxios.reset()
    mockAxios.resetHistory()
})

const getSiteUrl = __getEmulatorFunctionsURI('ISite-getSite')
const getInvRequestUrl = __getEmulatorFunctionsURI('IInvRequest-getInvRequest')
const getAttendanceListUrl = __getEmulatorFunctionsURI('IAttendance-getAttendanceListFromAttendanceIds')
const getArrangementListOfTargetSiteUrl = __getEmulatorFunctionsURI('IArrangement-getArrangementListOfTargetSite')
const getAttendanceUrl = __getEmulatorFunctionsURI('IAttendance-getAttendance')
const updateAttendanceUrl = __getEmulatorFunctionsURI('IAttendance-updateAttendance')

let params: GetAttendanceDataOfTargetSiteParam = {
    siteId: 'site-id',
    myCompanyId: 'my-company-id',
    myWorkerId: 'my-worker-id',
    requestId: 'request-id',
}

describe('getAttendanceDataOfTargetSite case', () => {
    it('success test', async () => {
        _getSite({
            siteId: 'site-id',
            options: {
                siteAttendanceData: {
                    params: {
                        companyId: 'my-company-id',
                        requestId: 'request-id',
                        myWorkerId: 'my-worker-id',
                    },
                },
            },
        })

        const res = await getAttendanceDataOfTargetSite({ ...params })

        expect(mockAxios.history.post.length).toEqual(1)
        expect(mockAxios.history.post[0].url).toEqual(getSiteUrl)
    })

    it('error test', async () => {
        mockAxios.onPost(getSiteUrl).networkError()
        const res = await getAttendanceDataOfTargetSite({ ...params })

        expect(mockAxios.history.post[0].url).toEqual(getSiteUrl)
        expect(res.error).toEqual('Network Error')
    })
})

let params2: GetAttendanceDataOfTargetInvRequestParam = {
    invRequestId: 'inv-request-id',
    myCompanyId: 'my-company-id',
    myWorkerId: 'my-worker-id',
}

describe('getAttendanceDataOfTargetInvRequest case', () => {
    it('success test', async () => {
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

        expect(mockAxios.history.post.length).toEqual(2)
        expect(mockAxios.history.post[0].url).toEqual(getInvRequestUrl)
        expect(mockAxios.history.post[1].url).toEqual(getAttendanceListUrl)
    })

    it('error test 1', async () => {
        mockAxios.onPost(getInvRequestUrl).networkError()

        const res = await getAttendanceDataOfTargetInvRequest(params2)

        expect(mockAxios.history.post[0].url).toEqual(getInvRequestUrl)
        expect(res.error).toEqual('Network Error')
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

        mockAxios.onPost(getAttendanceListUrl).networkError()

        const res = await getAttendanceDataOfTargetInvRequest(params2)

        expect(mockAxios.history.post[0].url).toEqual(getInvRequestUrl)
        expect(mockAxios.history.post[1].url).toEqual(getAttendanceListUrl)
        expect(res.error).toEqual('Network Error')
    })
})

const _attendance = {
    overtimeWork: undefined,
    earlyLeaveTime: undefined,
    midnightWorkTime: undefined,
    isHolidayWork: false,
    behindTime: undefined,
    isAbsence: false,
    startDate: 1686265200000,
    endDate: 1686297600000,
    startEditWorkerId: 'edit-worker-id',
    endEditWorkerId: 'edit-worker-id',
    attendanceId: undefined,
}

const _startDate = toCustomDateFromTotalSeconds(1686265200000)
const _endDate = toCustomDateFromTotalSeconds(1686297600000)

const autoCreateAttendanceOfSelectedWorkerParams = {
    startDate: _startDate,
    endDate: _endDate,
    companyId: 'my-company-id',
    myWorkerId: 'my-worker-id',
    earlyLeaveTime: undefined,
    isHolidayWork: undefined,
    behindTime: undefined,
    overtimeWork: undefined,
    midnightWorkTime: undefined,
    isAbsence: undefined,
    editWorkerId: 'edit-worker-id',
    selectedAttendanceIds: ['attendance-id'],
    attendances: [_attendance],
} as AutoCreateAttendanceOfSelectedWorkerParam

describe('autoCreateAttendancesOfSelectedWorker case', () => {
    describe('error case', () => {
        it('companyId = undefined test', async () => {
            const res = await autoCreateAttendanceOfSelectedWorker({ ...autoCreateAttendanceOfSelectedWorkerParams, companyId: undefined })

            expect(res.error).toEqual('自社情報がありません。')
        })
        it('myWorkerId = undefined test', async () => {
            const res = await autoCreateAttendanceOfSelectedWorker({ ...autoCreateAttendanceOfSelectedWorkerParams, myWorkerId: undefined })

            expect(res.error).toEqual('作業員情報がありません。')
        })
        it('selectedAttendanceIds = undefined test', async () => {
            const res = await autoCreateAttendanceOfSelectedWorker({ ...autoCreateAttendanceOfSelectedWorkerParams, selectedAttendanceIds: undefined })

            expect(res.error).toEqual('作業員情報がありません。')
        })
    })

    describe('success case', () => {
        it('success', async () => {
            _getAttendance_newAttendances({
                attendanceId: 'attendance-id',
            })

            /**
             * undefinedを渡すとエラーになる
             */
            _updateAttendance({
                attendanceId: 'attendance-id',
                createdAt: 1688367803000,
                isReported: false,
                updatedAt: 1688367809000,
                workerId: 'worker-id',
                isHolidayWork: false,
                startDate: 1686265200000,
                endDate: 1686297600000,
                startEditWorkerId: 'edit-worker-id',
                endEditWorkerId: 'edit-worker-id',
                isApprove: true,
                // overtimeWork: undefined,
                // earlyLeaveTime: undefined,
                // midnightWorkTime: undefined,
                // behindTime: undefined,
                // isAbsence: undefined,
            } as AttendanceModel)

            const res = await autoCreateAttendanceOfSelectedWorker({ ...autoCreateAttendanceOfSelectedWorkerParams })

            expect(res.success).toEqual(true)

            expect(mockAxios.history.post.length).toEqual(2)
            expect(mockAxios.history.post[0].url).toEqual(getAttendanceUrl)
            expect(mockAxios.history.post[1].url).toEqual(updateAttendanceUrl)
        })
    })
})

describe('getSiteForEditBundleAttendance case', () => {
    describe('error case', () => {
        it('siteId = undefined test', async () => {
            const res = await getSiteForEditBundleAttendance({ siteId: undefined })

            expect(res.error).toEqual('現場情報がありません。')
        })
    })

    describe('success case', () => {
        it('success test', async () => {
            _getSite_BundleAttendance({
                siteId: 'site-id',
                options: {
                    siteNameData: true,
                    construction: {
                        contract: {
                            receiveDepartments: true,
                        },
                    },
                },
            })
            _getArrangementListOfTargetSite({
                siteId: 'site-id',
            })

            const _attendanceIds = ['attendance-id', 'attendance-id2']
            _getAttendanceListFromAttendanceIds_BundleAttendance({
                attendanceIds: _attendanceIds,
                options: {
                    invRequests: true,
                },
            })

            const res = await getSiteForEditBundleAttendance({ siteId: 'site-id' })

            expect(res.success?.site?.siteId).toEqual('site-id')
            expect(res.success?.attendances?.length).toEqual(_attendanceIds.length)

            expect(mockAxios.history.post.length).toEqual(3)
            expect(mockAxios.history.post[0].url).toEqual(getSiteUrl)
            expect(mockAxios.history.post[1].url).toEqual(getArrangementListOfTargetSiteUrl)
            expect(mockAxios.history.post[2].url).toEqual(getAttendanceListUrl)
        })
    })
})
