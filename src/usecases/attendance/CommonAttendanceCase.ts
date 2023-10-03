import { AttendanceReportEnumType, ReportType } from '../../components/organisms/attendance/DatePickButton'
import { AttendanceCLType, AttendanceType, toAttendanceCLType } from '../../models/attendance/Attendance'
import { Update } from '../../models/_others/Common'
import { _getArrangement } from '../../services/arrangement/ArrangementService'
import { _createAttendance, _getAttendance, _updateAttendance } from '../../services/attendance/AttendanceService'
import { _getCompany } from '../../services/company/CompanyService'
import { _getSite, _getSiteNameData } from '../../services/site/SiteService'
import { _getWorker } from '../../services/worker/WorkerService'
import { CustomDate, dayBaseTextWithoutDate, getHHmmTotalSeconds, toCustomDateFromTotalSeconds } from '../../models/_others/CustomDate'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { SiteType } from '../../models/site/Site'
import { deleteFieldParam } from '../../services/firebase/FirestoreService'
import { AttendanceModificationType } from '../../models/attendanceModification/AttendanceModification'
import { genKeyName, getCachedData, updateCachedData } from '../CachedDataCase'
import { SiteAttendanceModel } from '../../models/attendance/SiteAttendance'
import { AllSiteAttendancesMangeCacheDataType } from '../../screens/adminSide/attendance/AllSiteAttendancesManage'
import { add, flatten, sum, uniqBy } from 'lodash'
import { ID } from '../../models/_others/ID'
import { SiteAttendanceCompanyType, SiteAttendanceWorkerType } from '../../models/attendance/SiteAttendanceDataType'
import { RequestType } from '../../models/request/Request'
import { CompanyType } from '../../models/company/Company'
import { InvRequestType } from '../../models/invRequest/InvRequestType'
import { ArrangementType } from '../../models/arrangement/Arrangement'
import { SiteArrangementDataType } from '../../models/arrangement/SiteArrangementDataType'

export type GetAttendanceDetailParam = {
    attendanceId?: string
    myWorkerId?: string
    siteId?: string
    myCompanyId?: string
}

export type GetAttendanceDetailResponse =
    | {
          attendance?: AttendanceType
          site?: SiteType
          attendanceModification?: AttendanceModificationType
      }
    | undefined

export const toReportType = (attendance?: AttendanceType | AttendanceCLType, side?: AttendanceReportEnumType): ReportType => {
    if (side == 'start') {
        if (attendance?.isAbsence) {
            return 'absence'
        } else {
            if (typeof attendance?.startDate == 'number') {
                return toCustomDateFromTotalSeconds(attendance?.startDate)
            } else {
                return attendance?.startDate
            }
        }
    } else {
        if (typeof attendance?.endDate == 'number') {
            return toCustomDateFromTotalSeconds(attendance?.endDate)
        } else {
            return attendance?.endDate
        }
    }
}

export const getAttendanceDetail = async (params: GetAttendanceDetailParam): Promise<CustomResponse<GetAttendanceDetailResponse>> => {
    try {
        const { attendanceId, myWorkerId, siteId, myCompanyId } = params
        if (attendanceId == undefined || siteId == undefined) {
            throw {
                error: '情報が足りません。',
            }
        }
        if (siteId == undefined || myWorkerId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }
        const attendanceResult = await _getAttendance({
            attendanceId,
            options: {
                arrangement: true,
                invRequests: true,
            },
        })
        if (attendanceResult.error) {
            throw {
                error: attendanceResult.error,
            }
        }

        const attendance = attendanceResult.success
        const results = await Promise.all([
            _getWorker({
                workerId: attendance?.workerId ?? 'no-id',
                options: {
                    account: true,
                    workerTags: {
                        params: {
                            myCompanyId,
                            myWorkerId,
                            siteId,
                        },
                    },
                    company: {
                        companyPartnership: {
                            params: {
                                companyId: myCompanyId,
                            },
                        },
                    },
                },
            }),
            _getSite({
                siteId,
                options: {
                    siteNameData: true,
                    construction: {
                        contract: {
                            receiveDepartments: true,
                        },
                    },
                },
            }),
        ])
        const workerResult = results[0]
        const siteResult = results[1]
        if (workerResult.error || siteResult.error) {
            throw {
                error: `作業員: ${workerResult.error} / 現場: ${siteResult.error}`,
            }
        }

        const companyResult = await _getCompany({ companyId: workerResult.success?.companyId ?? 'no-id' })
        if (companyResult.error) {
            throw {
                error: companyResult.error,
            }
        }

        return Promise.resolve({
            success: {
                attendance: {
                    ...attendance,
                    worker: workerResult.success,
                },
                site: siteResult.success,
                attendanceModification: attendanceResult.success?.arrangement?.attendanceModification,
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const checkIsNotEntered = (attendance?: AttendanceCLType): boolean => {
    return attendance != undefined && attendance?.startDate == undefined && attendance?.endDate == undefined && attendance?.isAbsence != true
}

export type UpdateAttendanceByAdminParam = {
    arrangementId?: string
    // 最適化用
    attendanceId?: string
    /**
     * 未入力かどうか
     */
    isStartNotEntered?: boolean
    isEndNotEntered?: boolean
    /**
     * 作業員未確定かどうか
     */
    isUnconfirmed?: boolean
    editWorkerId?: string
} & AttendanceCLType

export type UpdateAttendanceByAdminResponse = boolean | undefined

export const updateAttendanceByAdmin = async (params: UpdateAttendanceByAdminParam): Promise<CustomResponse<UpdateAttendanceByAdminResponse>> => {
    try {
        const {
            arrangementId,
            isStartNotEntered,
            isEndNotEntered,
            editWorkerId,
            attendanceId,
            isUnconfirmed,
            isAbsence,
            startDate,
            endDate,
            behindTime,
            overtimeWork,
            earlyLeaveTime,
            midnightWorkTime,
            isHolidayWork,
        } = params

        if (arrangementId == undefined && attendanceId == undefined) {
            throw {
                error: '情報が足りません。',
            }
        }

        if (startDate && endDate) {
            if (startDate.totalSeconds > endDate.totalSeconds) {
                throw {
                    error: '作業終了は作業開始以降にする必要があります。',
                }
            }
        }

        let attendance = undefined as AttendanceType | undefined

        if (attendanceId == undefined) {
            const arrangementResult = await _getArrangement({
                arrangementId: arrangementId ?? 'no-id',
                options: {
                    attendance: true,
                },
            })
            if (arrangementResult.error) {
                throw {
                    error: arrangementResult.error,
                }
            }
            attendance = arrangementResult.success?.attendance
        } else {
            const attendanceResult = await _getAttendance({
                attendanceId,
            })
            if (attendanceResult.error) {
                throw attendanceResult.error
            }
            attendance = attendanceResult.success
        }

        /**
         * attendanceが存在しないなら、空を入力。
         */
        const update: Update<AttendanceType> = {
            ...attendance,
            isApprove: true,
            overtimeWork:
                isAbsence || overtimeWork == undefined || (overtimeWork?.hour == 0 && overtimeWork.minute == 0) || isNaN(overtimeWork.totalSeconds)
                    ? deleteFieldParam()
                    : getHHmmTotalSeconds(overtimeWork),
            earlyLeaveTime:
                isAbsence || earlyLeaveTime == undefined || (earlyLeaveTime?.hour == 0 && earlyLeaveTime.minute == 0) || isNaN(earlyLeaveTime.totalSeconds)
                    ? deleteFieldParam()
                    : getHHmmTotalSeconds(earlyLeaveTime),
            midnightWorkTime:
                isAbsence || midnightWorkTime == undefined || (midnightWorkTime?.hour == 0 && midnightWorkTime.minute == 0) || isNaN(midnightWorkTime.totalSeconds)
                    ? deleteFieldParam()
                    : getHHmmTotalSeconds(midnightWorkTime),
            isHolidayWork: isAbsence ? deleteFieldParam() : isHolidayWork ?? false,
            behindTime:
                isAbsence || behindTime == undefined || (behindTime?.hour == 0 && behindTime.minute == 0) || isNaN(behindTime.totalSeconds) ? deleteFieldParam() : getHHmmTotalSeconds(behindTime),
            isAbsence: isAbsence ? true : deleteFieldParam(),
            //isAbsence:  !isAbsence && isStartNotEntered ? deleteFieldParam() : isAbsence,
            startDate: isAbsence || isStartNotEntered ? deleteFieldParam() : startDate?.totalSeconds,
            endDate: isAbsence || isEndNotEntered ? deleteFieldParam() : endDate?.totalSeconds,
            startEditWorkerId:
                attendance?.isAbsence != isAbsence || (attendance?.startDate == undefined) != isStartNotEntered || attendance?.startDate != startDate?.totalSeconds ? editWorkerId : undefined,
            endEditWorkerId: (attendance?.endDate == undefined) != isEndNotEntered || attendance?.endDate != endDate?.totalSeconds ? editWorkerId : undefined,
        }

        if (attendance != undefined) {
            const result = await _updateAttendance(update)
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            return Promise.resolve({
                success: true,
            })
        } else {
            update['attendanceId'] = attendanceId

            const result = await _createAttendance(update as AttendanceType)
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            return Promise.resolve({
                success: true,
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type ApproveAttendanceParam = {
    attendanceId?: string
}
/**
 * 作業員の勤怠を承認する
 * @author kamiya
 * @param params
 * @returns boolean
 */
export const approveAttendance = async (params: ApproveAttendanceParam): Promise<CustomResponse<boolean>> => {
    try {
        const { attendanceId } = params
        if (attendanceId == undefined) {
            throw {
                error: '情報が足りません。',
                errorCode: 'APPROVE_ATTENDANCE_ERROR',
            }
        }

        const update: AttendanceType = {
            attendanceId: attendanceId,
            isApprove: true,
        }

        const result = await _updateAttendance(update)
        if (result.error) {
            throw {
                error: result.error,
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetNewAttendanceParam = {
    arrangementId?: string
    // 最適化用
    attendanceId?: string
    /**
     * 未入力かどうか
     */
    isStartNotEntered?: boolean
    isEndNotEntered?: boolean
    /**
     * 作業員未確定かどうか
     */
    isUnconfirmed?: boolean
    editWorkerId?: string
    myCompanyId?: string
    accountId?: string
    siteId?: string
} & AttendanceCLType

export type GetNewAttendanceResponse = AttendanceType | undefined

export const getNewAttendances = async (params: GetNewAttendanceParam): Promise<CustomResponse<GetNewAttendanceResponse>> => {
    try {
        const {
            arrangementId,
            isStartNotEntered,
            isEndNotEntered,
            editWorkerId,
            attendanceId,
            isAbsence,
            startDate,
            endDate,
            behindTime,
            overtimeWork,
            earlyLeaveTime,
            midnightWorkTime,
            isHolidayWork,
        } = params

        if (arrangementId == undefined && attendanceId == undefined) {
            throw {
                error: '情報が足りません。',
            }
        }

        if (startDate && endDate) {
            if (startDate.totalSeconds > endDate.totalSeconds) {
                throw {
                    error: '作業終了は作業開始以降にする必要があります。',
                }
            }
        }

        let attendance = undefined as AttendanceType | undefined

        if (attendanceId == undefined) {
            const arrangementResult = await _getArrangement({
                arrangementId: arrangementId ?? 'no-id',
                options: {
                    attendance: true,
                },
            })
            if (arrangementResult.error) {
                throw {
                    error: arrangementResult.error,
                }
            }
            attendance = arrangementResult.success?.attendance
        } else {
            const attendanceResult = await _getAttendance({
                attendanceId,
            })
            if (attendanceResult.error) {
                throw attendanceResult.error
            }
            attendance = attendanceResult.success
        }

        /**
         * attendanceが存在しないなら、空を入力。
         */
        const update: Update<AttendanceType> = {
            ...attendance,
            overtimeWork:
                isAbsence || overtimeWork == undefined || (overtimeWork?.hour == 0 && overtimeWork.minute == 0) || isNaN(overtimeWork.totalSeconds)
                    ? deleteFieldParam()
                    : getHHmmTotalSeconds(overtimeWork),
            earlyLeaveTime:
                isAbsence || earlyLeaveTime == undefined || (earlyLeaveTime?.hour == 0 && earlyLeaveTime.minute == 0) || isNaN(earlyLeaveTime.totalSeconds)
                    ? deleteFieldParam()
                    : getHHmmTotalSeconds(earlyLeaveTime),
            midnightWorkTime:
                isAbsence || midnightWorkTime == undefined || (midnightWorkTime?.hour == 0 && midnightWorkTime.minute == 0) || isNaN(midnightWorkTime.totalSeconds)
                    ? deleteFieldParam()
                    : getHHmmTotalSeconds(midnightWorkTime),
            isHolidayWork: isAbsence ? deleteFieldParam() : isHolidayWork ?? false,
            behindTime:
                isAbsence || behindTime == undefined || (behindTime?.hour == 0 && behindTime.minute == 0) || isNaN(behindTime.totalSeconds) ? deleteFieldParam() : getHHmmTotalSeconds(behindTime),
            isAbsence: !isAbsence && isStartNotEntered ? deleteFieldParam() : isAbsence,
            startDate: isAbsence || isStartNotEntered ? deleteFieldParam() : startDate?.totalSeconds,
            endDate: isAbsence || isEndNotEntered ? deleteFieldParam() : endDate?.totalSeconds,
            startEditWorkerId:
                attendance?.isAbsence != isAbsence || (attendance?.startDate == undefined) != isStartNotEntered || attendance?.startDate != startDate?.totalSeconds ? editWorkerId : undefined,
            endEditWorkerId: (attendance?.endDate == undefined) != isEndNotEntered || attendance?.endDate != endDate?.totalSeconds ? editWorkerId : undefined,
        }

        if (attendance != undefined) {
            return Promise.resolve({
                success: update as AttendanceType,
            })
        } else {
            update['attendanceId'] = attendanceId
            return Promise.resolve({
                success: update as AttendanceType,
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type OnUpdateAttendanceUpdateSiteAttendanceCacheParam = {
    newAttendances: AttendanceType[]
    myCompanyId?: string
    accountId?: string
    siteId?: string
}
export const onUpdateAttendanceUpdateSiteAttendanceCache = async (params: OnUpdateAttendanceUpdateSiteAttendanceCacheParam): Promise<CustomResponse> => {
    try {
        const { newAttendances, myCompanyId, accountId, siteId } = params

        if (accountId == undefined || siteId == undefined || myCompanyId == undefined) {
            return Promise.resolve({ success: undefined })
        }
        newAttendances?.forEach((newAttendance) => {
            if (JSON.stringify(newAttendance.overtimeWork) == JSON.stringify({ _type: 'delete' })) {
                delete newAttendance.overtimeWork
            }
            if (JSON.stringify(newAttendance.earlyLeaveTime) == JSON.stringify({ _type: 'delete' })) {
                delete newAttendance.earlyLeaveTime
            }
            if (JSON.stringify(newAttendance.midnightWorkTime) == JSON.stringify({ _type: 'delete' })) {
                delete newAttendance.midnightWorkTime
            }
            if (JSON.stringify(newAttendance.behindTime) == JSON.stringify({ _type: 'delete' })) {
                delete newAttendance.behindTime
            }
            if (JSON.stringify(newAttendance.isAbsence) == JSON.stringify({ _type: 'delete' })) {
                delete newAttendance.isAbsence
            }
            if (JSON.stringify(newAttendance.endDate) == JSON.stringify({ _type: 'delete' })) {
                delete newAttendance.endDate
            }
            if (JSON.stringify(newAttendance.endDate) == JSON.stringify({ _type: 'delete' })) {
                delete newAttendance.endDate
            }
        })
        const siteAttendanceCacheKey = genKeyName({
            screenName: 'SiteAttendanceManage',
            accountId: accountId,
            siteId: siteId,
            companyId: myCompanyId,
        })
        const siteAttendanceCacheData = await getCachedData<SiteAttendanceModel>(siteAttendanceCacheKey)
        if (siteAttendanceCacheData.success) {
            if (siteAttendanceCacheData.success?.siteAttendanceData?.siteCompanies) {
                const newSiteCompanies = siteAttendanceCacheData.success?.siteAttendanceData?.siteCompanies?.map((siteCompany) => {
                    const newArrangedWorkers = siteCompany.arrangedWorkers?.map((worker) => {
                        const newAttendance = newAttendances?.find((attendance) => attendance.attendanceId == worker.attendanceId)
                        if (newAttendance && worker.attendanceId == newAttendance.attendanceId) {
                            newAttendance.isReported = newAttendance?.isAbsence || (newAttendance?.startDate != undefined && newAttendance?.endDate != undefined)
                            worker.attendance = newAttendance
                            if (worker.arrangement) worker.arrangement.attendance = newAttendance
                        }
                        return worker
                    })
                    siteCompany.arrangedWorkers = newArrangedWorkers
                    return siteCompany
                })
                siteAttendanceCacheData.success.siteAttendanceData.siteCompanies = newSiteCompanies
                siteAttendanceCacheData.success.siteAttendanceData.unReportedCount = sum(
                    newSiteCompanies.map((siteCompany) => siteCompany.arrangedWorkers?.filter((worker) => !worker.attendance?.isReported).length),
                )
                siteAttendanceCacheData.success.updatedAt = Number(new Date())
                await updateCachedData({ key: siteAttendanceCacheKey, value: siteAttendanceCacheData.success ?? {} })
            }
        }

        return Promise.resolve({ success: undefined })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * 手配を更新した時に、siteAttendanceCacheを更新する
 * addAttendances - 追加した勤務
 * myCompanyId - 自社ID
 * accountId - アカウントID
 * siteId - 現場ID
 * invRequestId - 依頼ID
 * deleteArrangementIds - 削除した手配ID
 * myCompany - 自社情報
 * site - 現場情報(新規キャッシュ作成のため)
 * invRequest - 依頼情報(新規キャッシュ作成のため)
 * siteArrangementData - 現場の手配情報(新規キャッシュ作成のため)
 * myCompany - InvRequestの手配データでは自社が取れないため
 */
export type OnUpdateArrangementUpdateSiteAttendanceCacheParam = {
    addAttendances?: AttendanceType[]
    myCompanyId?: ID
    accountId?: ID
    siteId?: ID
    invRequestId?: ID
    deleteArrangementIds?: ID[]
    site?: SiteType
    invRequest?: InvRequestType
    siteArrangementData?: SiteArrangementDataType
    myCompany?: CompanyType
}
export const onUpdateArrangementUpdateSiteAttendanceCache = (params: OnUpdateArrangementUpdateSiteAttendanceCacheParam): CustomResponse<SiteAttendanceModel> => {
    try {
        const { addAttendances, myCompanyId, accountId, siteId, invRequestId, deleteArrangementIds, site, invRequest, siteArrangementData } = params

        const myCompany = params.myCompany ?? siteArrangementData?.selfSide?.filter((self) => self.worker?.companyId == myCompanyId).map((self) => self.worker?.company)[0]

        if (accountId == undefined || (siteId == undefined && invRequestId == undefined) || myCompanyId == undefined) {
            return { success: undefined }
        }
        const siteAttendanceCacheKey = genKeyName({
            screenName: 'SiteAttendanceManage',
            accountId: accountId,
            siteId: siteId ?? (invRequestId as string),
            companyId: myCompanyId,
        })
        const subRequests =
            (siteArrangementData?.otherSide
                ?.map((data) => {
                    const _request: RequestType = {
                        ...data.targetRequest,
                        requestedCompany: data.requestedCompany,
                        subRespondCount: data.requestedCompany?.isFake ? data.targetRequest?.requestCount : data.targetRequest?.isApproval == true ? data.targetRequest?.subRespondCount : 0,
                        subAttendances: {
                            items:
                                data.targetRequest?.isApproval == true
                                    ? [
                                          ...(data.targetRequest?.subAttendances?.items?.filter((att) => att.arrangementId && !deleteArrangementIds?.includes(att.arrangementId)) ?? []),
                                          ...((addAttendances?.filter((att) => att.arrangement?.createCompanyId == data?.targetRequest?.requestedCompanyId) as AttendanceType[]) ?? []),
                                      ]
                                    : [],
                        },
                    }
                    return _request
                })
                .filter((data) => (data?.requestCount ?? 0) > 0) as RequestType[]) ?? []

        //siteArrangementData?.subRequestsにはsubAttendancesが含まれている。ただし情報が古い。
        //subRequestsには、subArrangementsとその先のattendanceが含まれていない。ただし情報が新しい。含まれていない情報はaddAttendanceで補える。
        //以上を念頭に実装

        //siteArrangementData?.subRequests?.itemsを優先で、追加した依頼を反映する。
        const _subRequests = subRequests?.map((req) => {
            const _req = siteArrangementData?.subRequests?.items?.find((data) => data.requestId == req.requestId)
            const _request: RequestType = {
                ...req,
                //古いsubAttendancesを入れて、削除された分はフィルター。追加分は後ほど追加
                subAttendances: {
                    items: [
                        ...(_req?.subAttendances?.items?.filter((att) => att.arrangementId && !deleteArrangementIds?.includes(att.arrangementId)) ?? []),
                        ...(addAttendances?.filter((att) => att.arrangement?.createCompanyId == req.requestedCompanyId) ?? []),
                    ],
                },
            }
            return _request
        })
        //キャッシュはないけれど、既に手配や勤怠のデータがある場合に対応する。
        //これで完全上書きすれば良いデータ。
        const newSiteCompanies = [
            ...(_subRequests
                ?.filter((req) => (req?.requestCount ?? 0) > 0)
                ?.map((req) => {
                    const subReqAttIds = flatten(req.subRequests?.items?.map((req) => req.initialStockedAttendanceIds))
                    const subReqAttIdsSet = new Set(subReqAttIds)
                    const siteCompany: SiteAttendanceCompanyType = {
                        company: subRequests?.find((_req) => _req.requestedCompanyId == req.requestedCompanyId)?.requestedCompany,
                        arrangedWorkers: [
                            ...(req.subAttendances?.items
                                ?.filter((subAtt) => subAtt.arrangementId != 'unconfirmed' || subReqAttIdsSet.has(subAtt.attendanceId))
                                .map((subAtt, index) => {
                                    const arrangedWorker: SiteAttendanceWorkerType = {
                                        attendanceId: subAtt.attendanceId,
                                        worker: subAtt.worker,
                                        attendance: subAtt,
                                        arrangement: subAtt.arrangement,
                                        isConfirmed: subAtt.worker && subAtt ? true : false,
                                    }
                                    return arrangedWorker
                                }) ?? []),
                        ],
                        request: req,
                    }
                    return siteCompany
                }) ?? []),
            //自社作業員分
            ...((siteArrangementData?.selfSide?.filter((data) => data.targetArrangement != undefined || data.targetInvRequest != undefined).length ?? 0) > 0
                ? [
                      {
                          company: myCompany,
                          arrangedWorkers: siteArrangementData?.selfSide
                              ?.filter((data) => (data.targetArrangement != undefined || data.targetInvRequest != undefined) && invRequest == undefined) //連携済みへ送る場合の確定は常に手配済み０
                              .map((data) => {
                                  if (data.targetArrangement != undefined) {
                                      const arrangedWorker: SiteAttendanceWorkerType = {
                                          attendanceId: data.targetArrangement?.attendanceId ?? addAttendances?.find((att) => att.arrangementId == data.targetArrangement?.arrangementId)?.attendanceId,
                                          worker: data?.worker,
                                          attendance: data.targetArrangement?.attendance ?? addAttendances?.find((att) => att.arrangementId == data.targetArrangement?.arrangementId),
                                          arrangement: data.targetArrangement,
                                          isConfirmed: true,
                                      }
                                      return arrangedWorker
                                  }
                                  if (data.targetInvRequest != undefined) {
                                      //仮会社へ送る場合のみ
                                      const arrangedWorker: SiteAttendanceWorkerType = {
                                          attendanceId:
                                              data.targetInvRequest.attendances?.find((att) => att.workerId == data.worker?.workerId)?.attendanceId ??
                                              addAttendances?.find((att) => att.arrangement?.workerId == data.worker?.workerId)?.attendanceId,
                                          worker: data?.worker,
                                          attendance:
                                              data.targetInvRequest.attendances?.find((att) => att.workerId == data.worker?.workerId) ??
                                              addAttendances?.find((att) => att.arrangement?.workerId == data.worker?.workerId),
                                          arrangement:
                                              data.targetInvRequest.attendances?.find((att) => att.workerId == data.worker?.workerId)?.arrangement ??
                                              addAttendances?.find((att) => att.arrangement?.workerId == data.worker?.workerId)?.arrangement,
                                          isConfirmed: true,
                                      }
                                      return arrangedWorker
                                  }
                              })
                              .filter((data) => data != undefined) as SiteAttendanceWorkerType[],
                      },
                  ]
                : []),
        ]

        const siteAttendance: SiteAttendanceModel = {
            date: site?.siteDate ?? invRequest?.date,
            companyId: myCompanyId,
            siteId: site?.siteId ?? invRequest?.invRequestId,
            siteAttendanceData: {
                date: site?.siteDate ?? invRequest?.date,
                targetAttendances: {
                    items: uniqBy(
                        [
                            //selfSideとaddAttendanceの内容が一部かぶるため。
                            ...((siteArrangementData?.selfSide
                                ?.filter((data) => data.targetArrangement != undefined)
                                .map((data) => data.targetArrangement?.attendance)
                                .filter((data) => data != undefined) as AttendanceType[]) ?? []),
                            ...(flatten(
                                siteArrangementData?.subRequests?.items?.map(
                                    (req) =>
                                        req.subAttendances?.items?.filter(
                                            (data) => data != undefined && data.attendanceId && !req.stockedAttendanceIds?.includes(data.attendanceId),
                                        ) as AttendanceType[],
                                ),
                            ) ?? []),
                            ...(addAttendances ?? []),
                        ],
                        'attendanceId',
                    ),
                },
                // 会社ごとに手配された作業員一覧
                siteCompanies: newSiteCompanies,
                siteRelation: site?.siteRelation,
                siteManageCompanyId: site?.managerWorker?.companyId,
                subArrangements: {
                    items: uniqBy(
                        [
                            //selfSideとaddAttendanceの内容が一部かぶるため。
                            ...((siteArrangementData?.selfSide
                                ?.filter((data) => data.targetArrangement != undefined)
                                .map((data) => data.targetArrangement)
                                .filter((data) => data != undefined) as ArrangementType[]) ?? []),
                            ...((siteArrangementData?.selfSide
                                ?.filter((data) => data.targetInvRequest != undefined)
                                .map(
                                    (data) =>
                                        data.targetInvRequest?.attendances?.find((att) => att.workerId == data.worker?.workerId)?.arrangement ??
                                        addAttendances?.find((att) => att.arrangement?.workerId == data.worker?.workerId)?.arrangement,
                                )
                                .filter((data) => data != undefined) as ArrangementType[]) ?? []),
                            ...((addAttendances?.map((att) => att.arrangement)?.filter((data) => data != undefined && data.createCompanyId == myCompanyId) as ArrangementType[]) ?? []),
                        ],
                        'arrangementId',
                    ),
                },
                subRequests: { items: subRequests },
                subRespondCount: sum(subRequests?.filter((req) => req.requestedCompany?.isFake == true || req.isApproval == true).map((req) => req.requestCount)) ?? 0,
                unReportedCount: sum(newSiteCompanies.map((siteCompany) => siteCompany.arrangedWorkers?.filter((worker) => !worker.attendance?.isReported).length)),
                waitingCount: sum(subRequests?.filter((req) => req.requestedCompany?.isFake != true).map((req) => (req?.requestCount ?? 0) - (req?.subRespondCount ?? 0))),
                actualWorkerCount: sum(newSiteCompanies.map((siteCompany) => siteCompany.arrangedWorkers?.length ?? 0)),
            },
            site,
            invRequest,
            updatedAt: Number(new Date()),
        }
        updateCachedData({ key: siteAttendanceCacheKey, value: siteAttendance })

        return { success: siteAttendance }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type OnUpdateAttendanceUpdateAllSiteAttendancesCacheParam = {
    newAttendances: AttendanceType[]
    myCompanyId?: string
    accountId?: string
    date?: CustomDate
}
export const onUpdateAttendanceUpdateAllSiteAttendancesCache = async (params: OnUpdateAttendanceUpdateAllSiteAttendancesCacheParam): Promise<CustomResponse> => {
    try {
        const { newAttendances, myCompanyId, accountId, date } = params

        if (accountId == undefined || date == undefined || myCompanyId == undefined) {
            return Promise.resolve({ success: undefined })
        }
        const _newAttendances = newAttendances?.map((newAttendance) => {
            if (JSON.stringify(newAttendance.overtimeWork) == JSON.stringify({ _type: 'delete' })) {
                delete newAttendance.overtimeWork
            }
            if (JSON.stringify(newAttendance.earlyLeaveTime) == JSON.stringify({ _type: 'delete' })) {
                delete newAttendance.earlyLeaveTime
            }
            if (JSON.stringify(newAttendance.midnightWorkTime) == JSON.stringify({ _type: 'delete' })) {
                delete newAttendance.midnightWorkTime
            }
            if (JSON.stringify(newAttendance.behindTime) == JSON.stringify({ _type: 'delete' })) {
                delete newAttendance.behindTime
            }
            if (JSON.stringify(newAttendance.isAbsence) == JSON.stringify({ _type: 'delete' })) {
                delete newAttendance.isAbsence
            }
            if (JSON.stringify(newAttendance.endDate) == JSON.stringify({ _type: 'delete' })) {
                delete newAttendance.endDate
            }
            if (JSON.stringify(newAttendance.endDate) == JSON.stringify({ _type: 'delete' })) {
                delete newAttendance.endDate
            }

            return newAttendance
        })

        const allSiteAttendancesCacheKey = genKeyName({
            screenName: 'AllSiteAttendancesManage',
            accountId: accountId,
            companyId: myCompanyId,
            /** "/" はKVSのキーに使えない文字のため "-" に変換 */
            date: date ? dayBaseTextWithoutDate(date).replace(/\//g, '-') : '',
        })

        const allSiteAttendancesCacheData = await getCachedData<AllSiteAttendancesMangeCacheDataType>(allSiteAttendancesCacheKey)
        if (allSiteAttendancesCacheData.success) {
            const newAllSiteAttendances = allSiteAttendancesCacheData.success?.allSiteAttendances?.map((siteAttendance) => {
                if (siteAttendance) {
                    const newSiteCompanies = siteAttendance?.siteCompanies?.map((siteCompany) => {
                        const newArrangedWorkers = siteCompany.arrangedWorkers?.map((worker) => {
                            const newAttendance = _newAttendances?.find((attendance) => attendance.attendanceId == worker.attendanceId)
                            if (newAttendance && worker.attendanceId == newAttendance.attendanceId) {
                                newAttendance.isReported = newAttendance?.isAbsence || (newAttendance?.startDate != undefined && newAttendance?.endDate != undefined)
                                worker.attendance = newAttendance
                                if (worker.arrangement) worker.arrangement.attendance = newAttendance
                            }

                            return worker
                        })
                        siteCompany.arrangedWorkers = newArrangedWorkers

                        return siteCompany
                    })

                    siteAttendance.siteCompanies = newSiteCompanies
                    siteAttendance.unReportedCount = sum(newSiteCompanies?.map((siteCompany) => siteCompany.arrangedWorkers?.filter((worker) => !worker.attendance?.isReported)?.length ?? 0))
                }

                return siteAttendance
            })

            allSiteAttendancesCacheData.success.allSiteAttendances = newAllSiteAttendances
            allSiteAttendancesCacheData.success.updatedAt = Number(new Date())

            await updateCachedData({ key: allSiteAttendancesCacheKey, value: allSiteAttendancesCacheData.success ?? {} })
        }

        return Promise.resolve({ success: undefined })
    } catch (error) {
        return getErrorMessage(error)
    }
}
