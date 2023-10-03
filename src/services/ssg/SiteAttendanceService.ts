/* eslint-disable indent */
import { _callFunctions } from '../firebase/FunctionsService'

import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'
import { ID } from '../../models/_others/ID'
import { TotalSeconds } from '../../models/_others/TotalSeconds'
import { SiteAttendanceType } from '../../models/attendance/SiteAttendance'

/**
 * @require
 * @param companyId - 必須。会社ID
 * @param date - 必須。日付
 */
export type GetSiteAttendancesOfTargetCompanyParam = {
    companyId: ID
    date: TotalSeconds
}

export type getSiteAttendancesOfTargetCompanyResponse = SiteAttendanceType[] | undefined
/**
 * @remarks 指定した日の勤怠データを取得する。
 * @author kamiya
 * @param params - {@link GetSiteAttendancesOfTargetCompanyParam}
 * @returns - {@link getSiteAttendancesOfTargetCompanyResponse}
 */
export const _getSiteAttendancesOfTargetCompany = async (params: GetSiteAttendancesOfTargetCompanyParam): Promise<CustomResponse<getSiteAttendancesOfTargetCompanyResponse>> => {
    try {
        const result = await _callFunctions('ISiteAttendanceSSG-getSiteAttendancesOfTargetCompany', params)
        if (result.error) {
            throw { ...result }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}
