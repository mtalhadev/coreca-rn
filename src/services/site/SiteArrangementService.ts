/* eslint-disable indent */
import { _callFunctions } from '../firebase/FunctionsService'

import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'
import { SiteRelationType } from '../../models/site/SiteRelationType'
import { SiteArrangementDataType } from '../../models/arrangement/SiteArrangementDataType'
import { SiteAttendanceDataType } from '../../models/attendance/SiteAttendanceDataType'
import { TotalSeconds } from '../../models/_others/TotalSeconds'


/**
 * @requires
 * @param siteId -
 * @param companyId -
 * @param myWorkerId -
 * @param date - 取得したい日の00:00。その日の常用申請を取得するため
 */
export type GetSiteArrangementDataParam = {
    siteId: string
    myCompanyId: string
    myWorkerId: string
    date?: TotalSeconds

    // 最適化のため
    siteManagerCompanyId?: string
    siteRelation?: SiteRelationType
    dailySiteIds?: string[]
    respondRequestId?: string
    withAttendance?: boolean
}
export type GetSiteArrangementDataResponse = SiteArrangementDataType | undefined
/**
 * @remarks 手配周りの情報を集約してくれる関数。常用依頼の場合も同様の取得が可能。なぜならある会社において同じ現場へは関わりは一つしか持てないから。
 * @objective 複雑な手配周りの情報処理をシンプルかつ普遍化するため。
 * @param params - {@link GetSiteArrangementDataParam}
 * @returns 指定した現場の手配情報全般を整理して出力。主に手配画面で使用。{@link GetSiteArrangementDataResponse}
 */
export const _getSiteArrangementData = async (params: GetSiteArrangementDataParam): Promise<CustomResponse<GetSiteArrangementDataResponse>> => {
    try {
        const result = await _callFunctions('ISiteArrangement-getSiteArrangementData', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetSiteAttendanceDataParam = {
    siteId: string
    myCompanyId: string
    myWorkerId: string

    // 最適化のため
    siteManagerCompanyId?: string
    siteRelation?: SiteRelationType
    dailySiteIds?: string[]
    respondRequestId?: string
    siteArrangementData?: SiteArrangementDataType
}
export type GetSiteAttendanceDataResponse = SiteAttendanceDataType | undefined
/**
 * @param params - {@link GetSiteAttendanceDataParam}
 * @returns 指定した現場の手配情報全般を整理して出力。主に手配画面で使用。
 */
export const _getSiteAttendanceData = async (params: GetSiteAttendanceDataParam): Promise<CustomResponse<GetSiteAttendanceDataResponse>> => {
    try {
        const result = await _callFunctions('ISiteArrangement-getSiteAttendanceData', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}
