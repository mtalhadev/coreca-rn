import { __getEmulatorFunctionsURI, _callFunctions } from '../../src/services/firebase/FunctionsService'
import { GetAttendanceListFromAttendanceIdsParam, GetAttendanceParam } from '../../src/services/attendance/AttendanceService'
import mockAxios from '../mockAxios'
import { AttendanceModel } from '../../src/models/attendance/Attendance'
import { GetArrangementParam } from '../../src/services/arrangement/ArrangementService'

export const _getAttendance = (params: GetAttendanceParam) => {
    const Url = __getEmulatorFunctionsURI('IAttendance-getAttendance')

    mockAxios.onPost(Url, params).reply(200, {
        success: {
            arrangementId: 'arrangement-id',
            workerId: 'worker-id',
            attendanceId: params.attendanceId,
            createdAt: 1674372993000,
            startStampDate: 1674373011000,
            behindTime: -2208990240000,
            isHolidayWork: false,
            startDate: 1674373008200,
            isAbsence: false,
            startLocationInfo: {
                longitudeDelta: 0.01,
                latitudeDelta: 0.01,
            },
            endDate: 1674373016099,
            endLocationInfo: {
                longitudeDelta: 0.01,
                latitudeDelta: 0.01,
            },
            earlyLeaveTime: -2209019820000,
            endStampDate: 1674373018000,
            updatedAt: 1674373018000,
            arrangement: {
                arrangementId: 'arrangement-id',
                respondRequestId: 'top',
                workerId: 'worker-id',
                workerBelongingCompanyId: 'company-id',
                createCompanyId: 'company-id',
                siteId: 'site-id',
                updateWorkerId: 'worker-id',
                attendanceId: params.attendanceId,
                createdAt: 1674372994000,
                date: 1674313200000,
                updatedAt: 1685124134000,
                attendanceModification: {
                    attendanceModificationId: 'attendance-modification-id',
                    targetAttendanceId: params.attendanceId,
                    originInfo: {
                        arrangementId: 'arrangement-id',
                        startStampDate: 1674373011000,
                        workerId: 'worker-id',
                        behindTime: -2208990240000,
                        endDate: 1674373016099,
                        endLocationInfo: {
                            longitudeDelta: 0.01,
                            latitudeDelta: 0.01,
                        },
                        isHolidayWork: false,
                        earlyLeaveTime: -2209019820000,
                        attendanceId: params.attendanceId,
                        createdAt: 1674372993000,
                        endStampDate: 1674373018000,
                        isReported: true,
                        startDate: 1674373008200,
                        startLocationInfo: {
                            longitudeDelta: 0.01,
                            latitudeDelta: 0.01,
                        },
                        updatedAt: 1674373018000,
                        isAbsence: false,
                    },
                    status: 'edited',
                    modificationInfo: {
                        arrangementId: 'arrangement-id',
                        startStampDate: 1674376433000,
                        workerId: 'worker-id',
                        behindTime: -2209017600000,
                        endDate: 1674374432000,
                        endLocationInfo: {
                            longitudeDelta: 0.01,
                            latitudeDelta: 0.01,
                        },
                        isHolidayWork: false,
                        attendanceId: params.attendanceId,
                        createdAt: 1674372993000,
                        endStampDate: 1674373018000,
                        startDate: 1674345632000,
                        isReported: true,
                        isAbsence: false,
                        updatedAt: 1674373018000,
                        startLocationInfo: {
                            longitudeDelta: 0.01,
                            latitudeDelta: 0.01,
                        },
                    },
                },
            },
            invRequests: {
                items: [],
            },
            isReported: true,
        },
    })
}

export const _getAttendance2 = (params: GetAttendanceParam) => {
    const Url = __getEmulatorFunctionsURI('IAttendance-getAttendance')

    mockAxios.onPost(Url, params).reply(200, {
        success: {
            arrangementId: 'arrangement-id',
            workerId: 'worker-id',
            attendanceId: 'attendance-id',
            createdAt: 1669709650000,
            overtimeWork: -2209017600000,
            behindTime: -2209017600000,
            endDate: 1669798843000,
            endEditWorkerId: 'edit-worker-id',
            isHolidayWork: true,
            startEditWorkerId: 'edit-worker-id',
            earlyLeaveTime: -2209017600000,
            midnightWorkTime: -2209017600000,
            startDate: 1669762843000,
            isAbsence: false,
            updatedAt: 1669711353000,
        },
    })
}

export const _updateAttendance = async (attendance: AttendanceModel) => {
    const updateAttendanceUrl = __getEmulatorFunctionsURI('IAttendance-updateAttendance')
    mockAxios.onPost(updateAttendanceUrl, attendance).reply(200, {
        success: true,
    })
}

export const _createAttendance = async (attendance: AttendanceModel) => {
    const createAttendanceUrl = __getEmulatorFunctionsURI('IAttendance-createAttendance')
    mockAxios.onPost(createAttendanceUrl, attendance).reply(200, {
        success: attendance.attendanceId,
    })
}

export const _getAttendanceListFromAttendanceIds = async (params: GetAttendanceListFromAttendanceIdsParam) => {
    const getAttendanceListUrl = __getEmulatorFunctionsURI('IAttendance-getAttendanceListFromAttendanceIds')
    mockAxios.onPost(getAttendanceListUrl, params).reply(200, {
        success: [
            {
                arrangementId: 'arrangement-id',
                workerId: 'worker-id',
                attendanceId: params.attendanceIds[0],
                createdAt: 1674372993000,
                startStampDate: 1674373011000,
                behindTime: -2208990240000,
                isHolidayWork: false,
                startDate: 1674373008200,
                isAbsence: false,
                startLocationInfo: {
                    longitudeDelta: 0.01,
                    latitudeDelta: 0.01,
                },
                endDate: 1674373016099,
                endLocationInfo: {
                    longitudeDelta: 0.01,
                    latitudeDelta: 0.01,
                },
                earlyLeaveTime: -2209019820000,
                endStampDate: 1674373018000,
                updatedAt: 1674373018000,
                arrangement: {
                    arrangementId: 'arrangement-id',
                    respondRequestId: 'top',
                    workerId: 'worker-id',
                    workerBelongingCompanyId: 'company-id',
                    createCompanyId: 'company-id',
                    siteId: 'site-id',
                    updateWorkerId: 'worker-id',
                    attendanceId: params.attendanceIds[0],
                    createdAt: 1674372994000,
                    date: 1674313200000,
                    updatedAt: 1685124134000,
                    attendanceModification: {
                        attendanceModificationId: 'attendance-modification-id',
                        targetAttendanceId: params.attendanceIds[0],
                        originInfo: {
                            arrangementId: 'arrangement-id',
                            startStampDate: 1674373011000,
                            workerId: 'worker-id',
                            behindTime: -2208990240000,
                            endDate: 1674373016099,
                            endLocationInfo: {
                                longitudeDelta: 0.01,
                                latitudeDelta: 0.01,
                            },
                            isHolidayWork: false,
                            earlyLeaveTime: -2209019820000,
                            attendanceId: params.attendanceIds[0],
                            createdAt: 1674372993000,
                            endStampDate: 1674373018000,
                            isReported: true,
                            startDate: 1674373008200,
                            startLocationInfo: {
                                longitudeDelta: 0.01,
                                latitudeDelta: 0.01,
                            },
                            updatedAt: 1674373018000,
                            isAbsence: false,
                        },
                        status: 'edited',
                        modificationInfo: {
                            arrangementId: 'arrangement-id',
                            startStampDate: 1674376433000,
                            workerId: 'worker-id',
                            behindTime: -2209017600000,
                            endDate: 1674374432000,
                            endLocationInfo: {
                                longitudeDelta: 0.01,
                                latitudeDelta: 0.01,
                            },
                            isHolidayWork: false,
                            attendanceId: params.attendanceIds[0],
                            createdAt: 1674372993000,
                            endStampDate: 1674373018000,
                            startDate: 1674345632000,
                            isReported: true,
                            isAbsence: false,
                            updatedAt: 1674373018000,
                            startLocationInfo: {
                                longitudeDelta: 0.01,
                                latitudeDelta: 0.01,
                            },
                        },
                    },
                },
            },
        ],
    })
}

export const _getAttendanceListFromAttendanceIds_BundleAttendance = async (params: GetAttendanceListFromAttendanceIdsParam) => {
    const getAttendanceListUrl = __getEmulatorFunctionsURI('IAttendance-getAttendanceListFromAttendanceIds')
    mockAxios.onPost(getAttendanceListUrl, params).reply(200, {
        success: [
            {
                arrangementId: 'a5dbd397-a7eb-43ed-8913-8dd19f8aecd1',
                attendanceId: params.attendanceIds[0],
                //attendanceId: '3b14e276-45e9-409a-a4d8-61a86064760b',
                createdAt: 1688184452000,
                endDate: 1688371200000,
                endEditWorkerId: '736604d1-95e0-489a-b38e-aa89582912cf',
                invRequests: { items: [Array] },
                isHolidayWork: false,
                isReported: true,
                startDate: 1688338800000,
                startEditWorkerId: '736604d1-95e0-489a-b38e-aa89582912cf',
                updatedAt: 1688347674000,
                workerId: 'b4389a30-c549-4e96-b972-8c75748968ee',
            },
            {
                arrangementId: '4eaea153-54a7-41b6-b41c-0e02f1d34eed',
                attendanceId: params.attendanceIds[1],
                //attendanceId: '7c2f6d5f-becf-4573-8de7-53b40cb21f8a',
                createdAt: 1688449453000,
                invRequests: { items: [Array] },
                isReported: false,
                updatedAt: 1688449463000,
                workerId: '2fc283cc-1dd2-4e2a-a5c7-2d98bdd61241',
            },
        ],
    })
}

export const _getAttendance_newAttendances = (params: GetAttendanceParam) => {
    const Url = __getEmulatorFunctionsURI('IAttendance-getAttendance')
    mockAxios.onPost(Url, params).reply(200, {
        success: {
            attendanceId: params.attendanceId,
            createdAt: 1688367803000,
            isReported: false,
            updatedAt: 1688367809000,
            workerId: 'worker-id',
        },
    })
}
export const _getArrangement_newAttendances = (params: GetArrangementParam) => {
    const Url = __getEmulatorFunctionsURI('IArrangement-getArrangement')

    mockAxios.onPost(Url, params).reply(200, {
        success: {
            arrangementId: params.arrangementId,
            createdAt: 1688184452000,
            isReported: false,
            updatedAt: 1688184458000,
            workerId: 'worker-id',
        },
    })
}
