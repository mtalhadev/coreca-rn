import uniqBy from 'lodash/uniqBy'
import flatten from 'lodash/flatten'
import { SiteCLType, SiteType, toSiteCLType } from '../../models/site/Site'
import { AttendanceType, toAttendanceCLType } from '../../models/attendance/Attendance'
import { _getArrangement, _getArrangementListOfTargetSite } from '../../services/arrangement/ArrangementService'
import { _createAttendance, _getAttendance, _getAttendanceListFromAttendanceIds, _getAttendanceListOfTargetSite } from '../../services/attendance/AttendanceService'
import { _getCompany, _getCompanyListOfTargetSite } from '../../services/company/CompanyService'
import { _getSite } from '../../services/site/SiteService'
import { _getWorker } from '../../services/worker/WorkerService'
import { CustomDate, toCustomDateFromTotalSeconds } from '../../models/_others/CustomDate'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { SiteAttendanceCompanyType, SiteAttendanceDataCLType, SiteAttendanceDataType, SiteAttendanceWorkerType, toSiteAttendanceDataCLType } from '../../models/attendance/SiteAttendanceDataType'
import { updateAttendanceByAdmin } from './CommonAttendanceCase'
import { _getSiteAttendanceData } from '../../services/site/SiteArrangementService'
import { SiteArrangementDataCLType, SiteArrangementDataType } from '../../models/arrangement/SiteArrangementDataType'
import { InvRequestCLType, toInvRequestCLType } from '../../models/invRequest/InvRequestType'
import { _getInvRequest } from '../../services/invRequest/InvRequestService'
import { toAttendanceListType } from '../../models/attendance/AttendanceListType'
import { ID } from '../../models/_others/ID'

export type GetAttendanceDataOfTargetSiteParam = {
    siteId?: string
    myCompanyId?: string
    myWorkerId?: string
    requestId?: string
    /**
     * 最適化のため
     */
    siteArrangementData?: SiteArrangementDataCLType | SiteArrangementDataType
}

export type GetAttendanceDataOfTargetSiteResponse =
    | {
          siteAttendanceData?: SiteAttendanceDataType
          site?: SiteType
      }
    | undefined

/**
 *  - 施工現場
 *      - 自社作業員
 *      - 仮会社常用: 応答表示
 *      - 連携他社常用
 *          - 自社作業員
 *          - 仮会社常用: 応答表示
 *          - 連携他社常用: 応答表示
 *  - 仮会社施工現場
 *      - 自社作業員
 *      - 仮会社常用: 応答表示
 *      - 連携他社常用
 *          - 自社作業員
 *          - 仮会社常用: 応答表示
 *          - 連携他社常用: 応答表示
 *  - 管理現場（オーナー、仲介、発注管理下）
 *      - 自社作業員=施工主作業員
 *      - 仮会社常用: 応答表示
 *      - 連携他社常用
 *          - 自社作業員
 *          - 仮会社常用: 応答表示
 *          - 連携他社常用: 応答表示
 *  - 他社常用現場
 *      - 自社作業員
 *      - 仮会社常用: 応答表示
 *      - 連携他社常用
 *          - 自社作業員
 *          - 仮会社常用: 応答表示
 *          - 連携他社常用: 応答表示
 *  - 管理常用現場
 *      - 自社作業員
 *      - 仮会社常用: 応答表示
 *      - 連携他社常用
 *          - 自社作業員
 *          - 仮会社常用: 応答表示
 *          - 連携他社常用: 応答表示
 *  - 応答表示とは - 常用依頼作業員を作業員として使用すること
 *  - まとめ
 *      - 全ての現場において
 *          - 自社作業員、連携他社常用の自社作業員は通常表示
 *          - 仮会社常用、連携他社常用の仮会社常用と連携他社常用は応答表示
 *      - 管理会社の自社作業員=施工主作業員
 * @param params
 * @returns
 */
export const getAttendanceDataOfTargetSite = async (params: GetAttendanceDataOfTargetSiteParam): Promise<CustomResponse<GetAttendanceDataOfTargetSiteResponse>> => {
    try {
        const { siteId, myCompanyId, myWorkerId, requestId, siteArrangementData } = params
        if (siteId == undefined) {
            throw {
                error: '現場情報がありません。',
            } as CustomResponse
        }

        if (myCompanyId == undefined || myWorkerId == undefined) {
            throw {
                error: '自社情報がありません。',
            } as CustomResponse
        }

        const siteResult = await _getSite({
            siteId,
            options: {
                siteAttendanceData: {
                    params: {
                        companyId: myCompanyId,
                        requestId: requestId,
                        myWorkerId,
                    },
                },
            },
        })
        if (siteResult.error) {
            throw {
                error: siteResult.error,
            }
        }
        return Promise.resolve({
            success: {
                site: siteResult.success,
                siteAttendanceData: siteResult.success?.siteAttendanceData,
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export type GetAttendanceDataOfTargetInvRequestParam = {
    invRequestId?: ID
    myWorkerId?: ID
    myCompanyId?: ID
}

export type GetAttendanceDataOfTargetInvRequestResponse =
    | {
          siteAttendanceData?: SiteAttendanceDataCLType
          invRequest?: InvRequestCLType
          site?: SiteCLType
      }
    | undefined
export const getAttendanceDataOfTargetInvRequest = async (params: GetAttendanceDataOfTargetInvRequestParam): Promise<CustomResponse<GetAttendanceDataOfTargetInvRequestResponse>> => {
    try {
        const { invRequestId, myWorkerId, myCompanyId } = params
        if (invRequestId == undefined) {
            throw {
                error: '常用申請情報がありません。',
            } as CustomResponse
        }

        if (myWorkerId == undefined) {
            throw {
                error: '会社情報がありません。',
            } as CustomResponse
        }

        const invRequestResult = await _getInvRequest({
            invRequestId,
            options: {
                myCompany: true,
                workers: true,
                site: true,
            },
        })
        if (invRequestResult.error) {
            throw {
                error: invRequestResult.error,
            }
        }
        if (invRequestResult.success?.site?.fakeCompanyInvRequestId != undefined) {
            /**
             * 仮会社へ常用で送っている場合は現場のデータを返す
             */
            const result = await getAttendanceDataOfTargetSite({
                siteId: invRequestResult.success?.site.siteId,
                myCompanyId,
                myWorkerId,
            })
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            return Promise.resolve({
                success: {
                    site: toSiteCLType(result.success?.site),
                    siteAttendanceData: toSiteAttendanceDataCLType(result.success?.siteAttendanceData),
                },
            })
        }
        const attendanceResults = await _getAttendanceListFromAttendanceIds({
            attendanceIds: invRequestResult.success?.attendanceIds ?? [],
            options: {
                arrangement: true,
            },
        })
        if (attendanceResults.error) {
            throw {
                error: attendanceResults.error,
            }
        }
        const arrangedAttendances = attendanceResults.success?.filter((att) => att.workerId != undefined)
        const siteAttendanceCompany: SiteAttendanceCompanyType = {
            company: invRequestResult.success?.myCompany,
            request: undefined,
            /**
             * 手配がある作業員のみに絞る。でないと、現場未確定として手配してない手配可能作業員が表示されてしまう。
             */
            arrangedWorkers: arrangedAttendances?.map((att) => {
                const _worker = invRequestResult.success?.workers?.items?.filter((worker) => worker.workerId == att.workerId)[0]
                return {
                    worker: _worker,
                    arrangement: att.arrangement,
                    attendance: att,
                    attendanceId: att?.attendanceId,
                    isConfirmed: true,
                }
            }),
        } as SiteAttendanceCompanyType
        const siteAttendanceData: SiteAttendanceDataType = {
            date: invRequestResult.success?.date,
            targetAttendances: toAttendanceListType(arrangedAttendances) ?? [],
            siteCompanies: [siteAttendanceCompany],
            // siteRelation?: SiteRelationType
            // siteManageCompanyId?: ID

            // subArrangements?: ArrangementListType
            // subRequests?: RequestListType
            // subRespondCount?: number
            unReportedCount: arrangedAttendances?.filter((att) => !att.isReported)?.length,
            // waitingCount?: number
            actualWorkerCount: arrangedAttendances?.length,
        }
        return Promise.resolve({
            success: {
                invRequest: toInvRequestCLType(invRequestResult.success),
                siteAttendanceData: toSiteAttendanceDataCLType(siteAttendanceData),
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export type GetSiteForEditBundleAttendanceResponse = {
    site: SiteCLType
    attendances: AttendanceType[]
}
export type GetSiteForEditBundleAttendanceParam = {
    siteId?: string
}
export const getSiteForEditBundleAttendance = async (params: GetSiteForEditBundleAttendanceParam): Promise<CustomResponse<GetSiteForEditBundleAttendanceResponse>> => {
    try {
        const { siteId } = params

        if (siteId == undefined) {
            throw {
                error: '現場情報がありません。',
            } as CustomResponse
        }

        const siteResult = await _getSite({
            siteId: siteId as string,
            options: {
                siteNameData: true,
                construction: {
                    contract: {
                        receiveDepartments: true,
                    },
                },
            },
        })
        if (siteResult.error) {
            throw {
                error: siteResult.error,
            }
        }
        const arrangementsResult = await _getArrangementListOfTargetSite({ siteId: siteId as string })
        if (arrangementsResult.error) {
            throw {
                error: arrangementsResult.error,
            }
        }
        const attendancesResult = await _getAttendanceListFromAttendanceIds({
            attendanceIds: arrangementsResult.success?.items?.map((arr) => arr?.attendanceId).filter((data) => data != undefined) as string[],
            options: { invRequests: true },
        })
        if (attendancesResult.error) {
            throw {
                error: attendancesResult.error,
            }
        }
        return {
            success: {
                site: toSiteCLType(siteResult.success),
                attendances: attendancesResult.success ?? [],
            },
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type CountAutoCreateAttendanceOfSiteParam = {
    siteId?: string
    requestId?: string
    companyId?: string
    myWorkerId?: string
}

export const countAutoCreateAttendanceOfSite = async (params: CountAutoCreateAttendanceOfSiteParam): Promise<CustomResponse<number>> => {
    try {
        const { siteId, requestId, companyId, myWorkerId } = params
        if (siteId == undefined) {
            throw {
                error: '現場情報がありません。',
            } as CustomResponse
        }

        if (companyId == undefined) {
            throw {
                error: '自社情報がありません。',
            } as CustomResponse
        }

        if (myWorkerId == undefined) {
            throw {
                error: '作業員情報がありません。',
            } as CustomResponse
        }

        const result = await _getSiteAttendanceData({ siteId, respondRequestId: requestId, myCompanyId: companyId, myWorkerId })
        if (result.error) {
            throw {
                error: result.error,
            }
        }
        return {
            success: result.success?.unReportedCount,
        } as CustomResponse<number>
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type AutoCreateAttendanceOfSiteParam = {
    siteId?: string
    requestId?: string
    startDate?: CustomDate
    endDate?: CustomDate
    isStartNotEntered?: boolean
    isEndNotEntered?: boolean
    isAbsence?: boolean
    companyId?: string
    myWorkerId?: string
    overtimeWork?: CustomDate
    earlyLeaveTime?: CustomDate
    midnightWorkTime?: CustomDate
    isHolidayWork?: boolean
    behindTime?: CustomDate
    editWorkerId?: string
}

export const autoCreateAttendanceOfSite = async (params: AutoCreateAttendanceOfSiteParam): Promise<CustomResponse> => {
    try {
        const {
            siteId,
            requestId,
            startDate,
            endDate,
            isAbsence,
            isStartNotEntered,
            isEndNotEntered,
            companyId,
            myWorkerId,
            overtimeWork,
            earlyLeaveTime,
            midnightWorkTime,
            isHolidayWork,
            behindTime,
            editWorkerId,
        } = params
        if (siteId == undefined) {
            throw {
                error: '現場情報がありません。',
            } as CustomResponse
        }

        if (companyId == undefined) {
            throw {
                error: '自社情報がありません。',
            } as CustomResponse
        }

        if (myWorkerId == undefined) {
            throw {
                error: '作業員情報がありません。',
            } as CustomResponse
        }
        const result = await _getSiteAttendanceData({ siteId, respondRequestId: requestId, myCompanyId: companyId, myWorkerId })
        if (result.error) {
            throw {
                error: result.error,
            }
        }

        const unReportAttendances = uniqBy(
            flatten(result.success?.siteCompanies?.map((company) => company.arrangedWorkers?.map((worker) => worker.attendance))).filter((data) => data != undefined && !data.isReported),
            (att) => att?.attendanceId,
        ) as AttendanceType[]

        const results = await Promise.all(
            unReportAttendances.map((_attendance) =>
                updateAttendanceByAdmin({
                    attendanceId: _attendance.attendanceId,
                    startDate: startDate,
                    endDate: endDate,
                    isStartNotEntered,
                    isEndNotEntered,
                    isAbsence,
                    overtimeWork,
                    earlyLeaveTime,
                    midnightWorkTime,
                    isHolidayWork,
                    behindTime,
                    isUnconfirmed: _attendance.worker == undefined || _attendance.arrangement == undefined,
                    editWorkerId,
                }),
            ),
        )

        results.forEach((_result) => {
            if (_result.error) {
                throw _result.error
            }
        })

        return {
            success: true,
        } as CustomResponse
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type AutoCreateAttendanceOfSelectedWorkerParam = {
    startDate?: CustomDate
    endDate?: CustomDate
    isStartNotEntered?: boolean
    isEndNotEntered?: boolean
    isAbsence?: boolean
    companyId?: ID
    myWorkerId?: ID
    overtimeWork?: CustomDate
    earlyLeaveTime?: CustomDate
    midnightWorkTime?: CustomDate
    isHolidayWork?: boolean
    behindTime?: CustomDate
    editWorkerId?: ID
    selectedAttendanceIds?: ID[]
}

/**
 * 選択した作業員の勤怠の登録・更新（勤怠報告済みの場合も含む）
 */
export const autoCreateAttendanceOfSelectedWorker = async (params: AutoCreateAttendanceOfSelectedWorkerParam): Promise<CustomResponse> => {
    try {
        const { startDate, endDate, isAbsence, companyId, myWorkerId, overtimeWork, earlyLeaveTime, midnightWorkTime, isHolidayWork, behindTime, editWorkerId, selectedAttendanceIds } = params

        if (companyId == undefined) {
            throw {
                error: '自社情報がありません。',
            } as CustomResponse
        }

        if (myWorkerId == undefined) {
            throw {
                error: '作業員情報がありません。',
            } as CustomResponse
        }

        if (selectedAttendanceIds == undefined) {
            throw {
                error: '作業員情報がありません。',
            } as CustomResponse
        }

        const results = await Promise.all(
            selectedAttendanceIds.map((attendanceId) => {
                return updateAttendanceByAdmin({
                    attendanceId,
                    startDate: startDate,
                    endDate: endDate,
                    isStartNotEntered: startDate == undefined,
                    isEndNotEntered: endDate == undefined,
                    isAbsence,
                    overtimeWork,
                    earlyLeaveTime,
                    midnightWorkTime,
                    isHolidayWork,
                    behindTime,
                    editWorkerId,
                })
            }),
        )

        results.forEach((_result) => {
            if (_result.error) {
                throw _result.error
            }
        })

        return {
            success: true,
        } as CustomResponse
    } catch (error) {
        return getErrorMessage(error)
    }
}
export type UpdateAttendanceWithDefaultSiteSettingParams = {
    attendance?: AttendanceType
    site?: SiteType
}
/**
 * 現場のデフォルト設定で勤怠を登録する。
 * 既に勤怠が登録されている場合は、不足分のみ追加更新する。
 * @param params UpdateAttendanceWithDefaultSiteSettingParams
 * @returns CustomResponse
 * @author kamiya
 */
export const updateAttendanceWithDefaultSiteSetting = async (params: UpdateAttendanceWithDefaultSiteSettingParams): Promise<CustomResponse> => {
    try {
        const { attendance, site } = params

        if (attendance?.attendanceId == undefined) {
            throw {
                error: '作業員情報がありません。',
                errorCode: 'UPDATE_ATTENDANCE_WITH_DEFAULT_SITE_SETTING_ERROR'
            } as CustomResponse
        }
        if ((attendance?.startDate ?? site?.startDate) == undefined || (attendance?.endDate ?? site?.endDate) == undefined) {
            throw {
                error: '現場情報がありません。',
                errorCode: 'UPDATE_ATTENDANCE_WITH_DEFAULT_SITE_SETTING_ERROR'
            } as CustomResponse
        }

        const result = await updateAttendanceByAdmin({
            attendanceId: attendance.attendanceId,
            startDate: toCustomDateFromTotalSeconds(attendance?.startDate ?? site?.startDate as number),
            endDate: toCustomDateFromTotalSeconds(attendance?.endDate ?? site?.endDate as number),
        })

        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }

        return {
            success: true,
        } as CustomResponse
    } catch (error) {
        return getErrorMessage(error)
    }
}

//TODO:作業員のIDとSite Idから、現場に手配されている特定の作業員の勤怠を取得する。
// export type GetAttendanceDataOfTargetInvRequestParam = {
//     siteIds?: string[]
//     myCompanyId?: string
//     myWorkerIds?: string[]
//     /**
//      * 最適化のため
//      */
//     siteArrangementData?: SiteArrangementDataCLType | SiteArrangementDataType
// }

// export type GetAttendanceDataOfTargetInvRequestResponse =
//     | {
//           siteAttendanceData?: SiteAttendanceDataCLType
//           site?: SiteCLType
//       }
//     | undefined

// /**
//  *  - 施工現場
//  *      - 自社作業員
//  *      - 仮会社常用: 応答表示
//  *      - 連携他社常用
//  *          - 自社作業員
//  *          - 仮会社常用: 応答表示
//  *          - 連携他社常用: 応答表示
//  *  - 仮会社施工現場
//  *      - 自社作業員
//  *      - 仮会社常用: 応答表示
//  *      - 連携他社常用
//  *          - 自社作業員
//  *          - 仮会社常用: 応答表示
//  *          - 連携他社常用: 応答表示
//  *  - 管理現場（オーナー、仲介、発注管理下）
//  *      - 自社作業員=施工主作業員
//  *      - 仮会社常用: 応答表示
//  *      - 連携他社常用
//  *          - 自社作業員
//  *          - 仮会社常用: 応答表示
//  *          - 連携他社常用: 応答表示
//  *  - 他社常用現場
//  *      - 自社作業員
//  *      - 仮会社常用: 応答表示
//  *      - 連携他社常用
//  *          - 自社作業員
//  *          - 仮会社常用: 応答表示
//  *          - 連携他社常用: 応答表示
//  *  - 管理常用現場
//  *      - 自社作業員
//  *      - 仮会社常用: 応答表示
//  *      - 連携他社常用
//  *          - 自社作業員
//  *          - 仮会社常用: 応答表示
//  *          - 連携他社常用: 応答表示
//  *  - 応答表示とは - 常用依頼作業員を作業員として使用すること
//  *  - まとめ
//  *      - 全ての現場において
//  *          - 自社作業員、連携他社常用の自社作業員は通常表示
//  *          - 仮会社常用、連携他社常用の仮会社常用と連携他社常用は応答表示
//  *      - 管理会社の自社作業員=施工主作業員
//  * @param params
//  * @returns
//  */
