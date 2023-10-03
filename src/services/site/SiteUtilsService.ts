import sum from 'lodash/sum'
import { ArrangementType } from '../../models/arrangement/Arrangement'
import { AttendanceType } from '../../models/attendance/Attendance'
import { getRequestMeterOption, getRequestMeterWithAttendanceOption, RequestMeterCLType, RequestMeterType } from '../../models/request/RequestMeterType'
import { getSiteMeterOption, getSiteMeterWithAttendanceOption, SiteMeterCLType, SiteMeterType } from '../../models/site/SiteMeterType'

/**
 * SiteUtilsService
 * @remarks 現場に関する補助的なAPIやユーティリティを提供する。
 */

/**
 * @param meter - {@link getSiteMeterOption}または{@link getRequestMeterOption}が必要。
 */
export type _getSubActualRespondCountParam = {
    meter: SiteMeterType | RequestMeterType | SiteMeterCLType | RequestMeterCLType
}
/**
 *
 * @param params
 * @returns 稼働数を取得する。
 */
export const _getSubActualRespondCount = (params: _getSubActualRespondCountParam): number => {
    const { meter } = params
    return (meter?.presentArrangements?.items?.length ?? 0) + sum(meter?.presentRequests?.items?.map((request) => request.subRespondCount ?? 0))
}

/**
 * @param meter - {@link getSiteMeterOption}または{@link getRequestMeterOption}が必要。
 */
export type _getSubWaitingCountParam = {
    meter: SiteMeterType | RequestMeterType | SiteMeterCLType | RequestMeterCLType
}
/**
 *
 * @param params
 * @returns 応答待ちを取得する。
 */
export const _getSubWaitingRespondCount = (params: _getSubWaitingCountParam): number => {
    const { meter } = params
    return sum(meter.presentRequests?.items?.map((request) => Math.max(0, (request.requestCount ?? 0) - (request.subRespondCount ?? 0))))
}

/**
 * @param meter - {@link getSiteMeterWithAttendanceOption}または{@link getRequestMeterWithAttendanceOption}が必要。
 */
export type _getSubUnReportedCountParam = {
    meter: SiteMeterType | RequestMeterType | SiteMeterCLType | RequestMeterCLType
}
/**
 *
 * @param params
 * @returns 未報告を取得する。
 */
export const _getSubUnReportedRespondCount = (params: _getSubUnReportedCountParam): number => {
    const { meter } = params
    return (
        ((meter.presentArrangements?.items as ArrangementType[])?.filter((arr) => !arr.attendance?.isReported).length ?? 0) +
        sum(meter.presentRequests?.items?.map((request) => (request.subAttendances?.items as AttendanceType[])?.filter((att) => att.arrangementId != 'unconfirmed' && !att?.isReported).length ?? 0))
    )
}
/**
 * @param meter - {@link getSiteMeterWithAttendanceOption}または{@link getRequestMeterWithAttendanceOption}が必要。
 */
export type _getSubUnApprovedCountParam = {
    meter: SiteMeterType | RequestMeterType | SiteMeterCLType | RequestMeterCLType
}
/**
 *
 * @param params
 * @returns 未承認勤怠を取得する。
 */
export const _getSubUnApprovedCount = (params: _getSubUnApprovedCountParam): number => {
    const { meter } = params
    return (
        ((meter.presentArrangements?.items as ArrangementType[])?.filter((arr) => arr.attendance?.isApprove != true).length ?? 0) +
        sum(meter.presentRequests?.items?.map((request) => (request.subAttendances?.items as AttendanceType[])?.filter((att) => att.arrangementId != 'unconfirmed' && att?.isApprove != true).length ?? 0))
    )
}