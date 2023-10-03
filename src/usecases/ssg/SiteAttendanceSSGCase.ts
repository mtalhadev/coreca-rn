/* eslint-disable indent */

import { CustomResponse } from '../../models/_others/CustomResponse'
import { ID } from '../../models/_others/ID'
import { TotalSeconds } from '../../models/_others/TotalSeconds'
import { _getSiteArrangement } from '../../services/ssg/SiteArrangementService'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { SiteAttendanceType } from '../../models/attendance/SiteAttendance'
import { _getSiteAttendancesOfTargetCompany } from '../../services/ssg/SiteAttendanceService'

/**
 * @require
 * @param companyId - 必須。会社ID
 * @param date - 必須。日付
 */
export type GetSiteAttendancesOfTargetCompanyParam = {
    companyId: ID
    date: TotalSeconds
}

export type _getSiteAttendanceResponse = SiteAttendanceType[] | undefined
/**
 * @remarks 指定した日の勤怠データを取得する。
 * @author kamiya
 * @param params - {@link GetSiteAttendancesOfTargetCompanyParam}
 * @returns - {@link _getSiteAttendanceResponse}
 */
export const getSiteAttendanceOfTargetCompany = async (params: GetSiteAttendancesOfTargetCompanyParam): Promise<CustomResponse<_getSiteAttendanceResponse>> => {
    try {
        const { companyId, date } = params
        if (companyId == undefined) {
            throw {
                error: 'companyId がありません',
                errorCode: 'GET_SITE_ATTENDANCE_ERROR',
            }
        }
        if (date == undefined) {
            throw {
                error: 'date がありません',
                errorCode: 'GET_SITE_ATTENDANCE_ERROR',
            }
        }
        const result = await _getSiteAttendancesOfTargetCompany({
            companyId,
            date,
        })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}
