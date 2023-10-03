import mockAxios from '../../../__mocks__/mockAxios'
import { _getAttendance, _getAttendance2, _getAttendance_newAttendances, _getArrangement_newAttendances, _createAttendance, _updateAttendance } from '../../../__mocks__/services/AttendanceService'
import { _getCompany } from '../../../__mocks__/services/CompanyService'
import { _getSite } from '../../../__mocks__/services/SiteService'
import { _getWorker } from '../../../__mocks__/services/WorkerService'
import { nextHour, nextMinute, toCustomDateFromTotalSeconds } from '../../../src/models/_others/CustomDate'
import { AttendanceModel } from '../../../src/models/attendance/Attendance'
import { __getEmulatorFunctionsURI } from '../../../src/services/firebase/FunctionsService'
import {
    GetAttendanceDetailParam,
    GetNewAttendanceParam,
    UpdateAttendanceByAdminParam,
    getAttendanceDetail,
    getNewAttendances,
    updateAttendanceByAdmin,
    approveAttendance,
} from '../../../src/usecases/attendance/CommonAttendanceCase'

afterEach(() => {
    mockAxios.reset()
    mockAxios.resetHistory()
})

const getAttendanceUrl = __getEmulatorFunctionsURI('IAttendance-getAttendance')
const getWorkerUrl = __getEmulatorFunctionsURI('IWorker-getWorker')
const getSiteUrl = __getEmulatorFunctionsURI('ISite-getSite')
const getCompanyUrl = __getEmulatorFunctionsURI('ICompany-getCompany')
const getArrangementUrl = __getEmulatorFunctionsURI('IArrangement-getArrangement')
const updateAttendanceUrl = __getEmulatorFunctionsURI('IAttendance-updateAttendance')
const createAttendanceUrl = __getEmulatorFunctionsURI('IAttendance-createAttendance')

let params: GetAttendanceDetailParam = {
    attendanceId: 'attendance-id',
    myWorkerId: 'my-worker-id',
    siteId: 'site-id',
    myCompanyId: 'my-company-id',
}
describe('getAttendanceDetail case', () => {
    it('attendanceId = undefined test', async () => {
        const res = await getAttendanceDetail({ ...params, attendanceId: undefined })
        expect(res.error).toEqual('情報が足りません。')
    })
    it('siteId = undefined test', async () => {
        const res = await getAttendanceDetail({ ...params, siteId: undefined })
        expect(res.error).toEqual('情報が足りません。')
    })
    it('myWorkerId = undefined test', async () => {
        const res = await getAttendanceDetail({ ...params, myWorkerId: undefined })
        expect(res.error).toEqual('自社情報がありません。ログインし直してください。')
    })

    it('success test', async () => {
        _getAttendance({
            attendanceId: params.attendanceId ?? 'attendance-id',
            options: {
                arrangement: true,
                invRequests: true,
            },
        })
        _getWorker({
            workerId: 'worker-id',
            options: {
                account: true,
                workerTags: {
                    params: {
                        myCompanyId: params.myCompanyId,
                        myWorkerId: params.myWorkerId,
                        siteId: params.siteId,
                    },
                },
                company: {
                    companyPartnership: {
                        params: {
                            companyId: params.myCompanyId,
                        },
                    },
                },
            },
        })
        _getSite({
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
        _getCompany({ companyId: 'company-id' })

        const res = await getAttendanceDetail({ ...params })

        expect(mockAxios.history.post.length).toEqual(4)
        expect(mockAxios.history.post[0].url).toEqual(getAttendanceUrl)
        expect(mockAxios.history.post[1].url).toEqual(getWorkerUrl)
        expect(mockAxios.history.post[2].url).toEqual(getSiteUrl)
        expect(mockAxios.history.post[3].url).toEqual(getCompanyUrl)
    })

    it('error test 1', async () => {
        mockAxios.onPost(getAttendanceUrl).networkError()

        const res = await getAttendanceDetail({ ...params })

        expect(mockAxios.history.post[0].url).toEqual(getAttendanceUrl)
        expect(res.error).toEqual('Network Error')
    })

    it('error test 2', async () => {
        _getAttendance({
            attendanceId: params.attendanceId ?? 'attendance-id',
            options: {
                arrangement: true,
                invRequests: true,
            },
        })
        mockAxios.onPost(getWorkerUrl).networkError()

        const res = await getAttendanceDetail({ ...params })

        expect(mockAxios.history.post[0].url).toEqual(getAttendanceUrl)
        expect(mockAxios.history.post[1].url).toEqual(getWorkerUrl)
        expect(res.error).toEqual('作業員: Network Error / 現場: Request failed with status code 404')
    })

    it('error test 3', async () => {
        _getAttendance({
            attendanceId: params.attendanceId ?? 'attendance-id',
            options: {
                arrangement: true,
                invRequests: true,
            },
        })
        _getWorker({
            workerId: 'worker-id',
            options: {
                account: true,
                workerTags: {
                    params: {
                        myCompanyId: params.myCompanyId,
                        myWorkerId: params.myWorkerId,
                        siteId: params.siteId,
                    },
                },
                company: {
                    companyPartnership: {
                        params: {
                            companyId: params.myCompanyId,
                        },
                    },
                },
            },
        })

        mockAxios.onPost(getSiteUrl).networkError()

        const res = await getAttendanceDetail({ ...params })

        expect(mockAxios.history.post[0].url).toEqual(getAttendanceUrl)
        expect(mockAxios.history.post[1].url).toEqual(getWorkerUrl)
        expect(mockAxios.history.post[2].url).toEqual(getSiteUrl)
        expect(res.error).toEqual('作業員: undefined / 現場: Network Error')
    })

    it('error test 4', async () => {
        _getAttendance({
            attendanceId: params.attendanceId ?? 'attendance-id',
            options: {
                arrangement: true,
                invRequests: true,
            },
        })
        _getWorker({
            workerId: 'worker-id',
            options: {
                account: true,
                workerTags: {
                    params: {
                        myCompanyId: params.myCompanyId,
                        myWorkerId: params.myWorkerId,
                        siteId: params.siteId,
                    },
                },
                company: {
                    companyPartnership: {
                        params: {
                            companyId: params.myCompanyId,
                        },
                    },
                },
            },
        })
        _getSite({
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

        mockAxios.onPost(getCompanyUrl).networkError()

        const res = await getAttendanceDetail({ ...params })

        expect(mockAxios.history.post[0].url).toEqual(getAttendanceUrl)
        expect(mockAxios.history.post[1].url).toEqual(getWorkerUrl)
        expect(mockAxios.history.post[2].url).toEqual(getSiteUrl)
        expect(mockAxios.history.post[3].url).toEqual(getCompanyUrl)
        expect(res.error).toEqual('Network Error')
    })
})

const _startDate = toCustomDateFromTotalSeconds(1686265200000)
const _endDate = toCustomDateFromTotalSeconds(1686297600000)

const newAttendanceParams: GetNewAttendanceParam = {
    arrangementId: 'arrangement-id',
    attendanceId: 'attendance-id',
    startDate: _startDate,
    endDate: _endDate,
    isStartNotEntered: false,
    isEndNotEntered: false,
    myCompanyId: 'my-company-id',
    editWorkerId: 'edit-worker-id',
    accountId: 'account-id',
    siteId: 'site-id',
    isAbsence: false,
    overtimeWork: undefined,
    earlyLeaveTime: undefined,
    midnightWorkTime: undefined,
    isHolidayWork: undefined,
    behindTime: undefined,
}

describe('getNewAttendances case', () => {
    describe('error case', () => {
        it('arrangementId = undefined && attendanceId = undefined test', async () => {
            const res = await getNewAttendances({ ...newAttendanceParams, arrangementId: undefined, attendanceId: undefined })

            expect(res.error).toEqual('情報が足りません。')
        })
        it('startDate > endDate  test', async () => {
            const res = await getNewAttendances({ ...newAttendanceParams, startDate: toCustomDateFromTotalSeconds(_endDate.totalSeconds + 3600000) }) // startDate = endDate + 1h

            expect(res.error).toEqual('作業終了は作業開始以降にする必要があります。')
        })
    })

    describe('success case', () => {
        it('attendanceId == undefined test', async () => {
            _getArrangement_newAttendances({
                arrangementId: newAttendanceParams.arrangementId ?? 'no-id',
                options: {
                    attendance: true,
                },
            })

            const res = await getNewAttendances({ ...newAttendanceParams, attendanceId: undefined })

            expect(res.success?.startDate).toEqual(_startDate.totalSeconds)
            expect(res.success?.endDate).toEqual(_endDate.totalSeconds)

            expect(mockAxios.history.post.length).toEqual(1)
            expect(mockAxios.history.post[0].url).toEqual(getArrangementUrl)
        })

        it('attendanceId exists  test', async () => {
            _getAttendance_newAttendances({
                attendanceId: newAttendanceParams.attendanceId ?? 'attendance-id',
            })

            const res = await getNewAttendances({ ...newAttendanceParams })

            expect(mockAxios.history.post.length).toEqual(1)
            expect(mockAxios.history.post[0].url).toEqual(getAttendanceUrl)

            expect(res.success?.attendanceId).toEqual('attendance-id')
            expect(res.success?.startDate).toEqual(_startDate.totalSeconds)
            expect(res.success?.endDate).toEqual(_endDate.totalSeconds)
            expect(res.success?.startEditWorkerId).toEqual('edit-worker-id')
            expect(res.success?.endEditWorkerId).toEqual('edit-worker-id')
        })

        describe('optional params test', () => {
            const optionalParams = {
                behindTime: nextHour(_startDate, 1),
                overtimeWork: nextHour(_endDate, 2),
                isHolidayWork: true,
            }

            it('isAbsent = true  test', async () => {
                _getAttendance_newAttendances({
                    attendanceId: newAttendanceParams.attendanceId ?? 'attendance-id',
                })

                const res = await getNewAttendances({ ...newAttendanceParams, ...optionalParams, isAbsence: true })

                expect(res.success?.isAbsence).toEqual(true)
                expect(res.success?.startDate).toEqual(undefined)
                expect(res.success?.endDate).toEqual(undefined)
                expect(res.success?.behindTime).toEqual(undefined)
                expect(res.success?.overtimeWork).toEqual(undefined)
                expect(res.success?.isHolidayWork).toEqual(undefined)
            })

            it('behindTime, overtimeWork, isHolidayWork  test', async () => {
                _getAttendance_newAttendances({
                    attendanceId: newAttendanceParams.attendanceId ?? 'attendance-id',
                })

                const res = await getNewAttendances({ ...newAttendanceParams, ...optionalParams })

                expect(res.success?.behindTime).not.toBeNaN()
                expect(res.success?.overtimeWork).not.toBeNaN()
                expect(res.success?.isHolidayWork).toEqual(true)
            })

            it('earlyLeaveTime  test', async () => {
                _getAttendance_newAttendances({
                    attendanceId: newAttendanceParams.attendanceId ?? 'attendance-id',
                })

                const res = await getNewAttendances({ ...newAttendanceParams, earlyLeaveTime: nextMinute(_endDate, -30) })

                expect(res.success?.earlyLeaveTime).not.toBeNaN()
            })
        })
    })
})

const updateAttendanceByAdminParams: UpdateAttendanceByAdminParam = {
    arrangementId: 'arrangement-id',
    attendanceId: 'attendance-id',
    startDate: _startDate,
    endDate: _endDate,
    isStartNotEntered: false,
    isEndNotEntered: false,
    editWorkerId: 'edit-worker-id',
    isAbsence: false,
    overtimeWork: undefined,
    earlyLeaveTime: undefined,
    midnightWorkTime: undefined,
    isHolidayWork: undefined,
    behindTime: undefined,
}

describe('updateAttendanceByAdmin case', () => {
    describe('error case', () => {
        it('arrangementId = undefined && attendanceId = undefined test', async () => {
            const res = await updateAttendanceByAdmin({ ...updateAttendanceByAdminParams, arrangementId: undefined, attendanceId: undefined })

            expect(res.error).toEqual('情報が足りません。')
        })
        it('startDate > endDate  test', async () => {
            const res = await updateAttendanceByAdmin({ ...updateAttendanceByAdminParams, startDate: toCustomDateFromTotalSeconds(_endDate.totalSeconds + 3600000) }) // startDate = endDate + 1h

            expect(res.error).toEqual('作業終了は作業開始以降にする必要があります。')
        })
    })

    describe('success case', () => {
        it('attendanceId == undefined test', async () => {
            _getArrangement_newAttendances({
                arrangementId: updateAttendanceByAdminParams.arrangementId ?? 'no-id',
                options: {
                    attendance: true,
                },
            })

            /**
             * undefinedを渡すとエラーになるう
             */
            _createAttendance({
                isHolidayWork: false,
                startDate: 1686265200000,
                endDate: 1686297600000,
                startEditWorkerId: 'edit-worker-id',
                endEditWorkerId: 'edit-worker-id',
                isApprove: true,
                //   earlyLeaveTime: undefined,
                //   midnightWorkTime: undefined,
                //   behindTime: undefined,
                //   isAbsence: undefined,
            } as AttendanceModel)

            const res = await updateAttendanceByAdmin({ ...updateAttendanceByAdminParams, attendanceId: undefined })

            expect(res.success).toEqual(true)
            expect(mockAxios.history.post.length).toEqual(2)
            expect(mockAxios.history.post[0].url).toEqual(getArrangementUrl)
            expect(mockAxios.history.post[1].url).toEqual(createAttendanceUrl)
        })

        it('attendanceId exists  test', async () => {
            _getAttendance_newAttendances({
                attendanceId: updateAttendanceByAdminParams.attendanceId ?? 'attendance-id',
            })

            /**
             * undefinedを渡すとエラーになる
             */
            _updateAttendance({
                attendanceId: updateAttendanceByAdminParams.attendanceId,
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

            const res = await updateAttendanceByAdmin({ ...updateAttendanceByAdminParams })

            expect(res.success).toEqual(true)
            expect(mockAxios.history.post.length).toEqual(2)
            expect(mockAxios.history.post[0].url).toEqual(getAttendanceUrl)
            expect(mockAxios.history.post[1].url).toEqual(updateAttendanceUrl)
        })
    })
})

describe('approveAttendance case', () => {
    describe('error case', () => {
        it('attendanceId = undefined test', async () => {
            const res = await approveAttendance({ attendanceId: undefined })

            expect(res.error).toEqual('情報が足りません。')
        })

    })

    describe('success case', () => {
        it('success case', async () => {
            const _attendanceId = 'attendance-id'
            _updateAttendance({
                attendanceId: _attendanceId,
                isApprove: true,
            } as AttendanceModel)

            const res = await approveAttendance({ attendanceId: _attendanceId })

            expect(res.success).toEqual(true)
            expect(mockAxios.history.post.length).toEqual(1)
            expect(mockAxios.history.post[0].url).toEqual(updateAttendanceUrl)
        })
    })
})