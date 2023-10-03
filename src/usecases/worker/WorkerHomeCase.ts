import { ArrangementCLType } from '../../models/arrangement/Arrangement'
import { AttendanceCLType } from '../../models/attendance/Attendance'
import { SiteCLType, toSiteCLType } from '../../models/site/Site'
import { GetArrangementListOfTargetWorkerResponse, _getArrangementListOfTargetWorker } from '../../services/arrangement/ArrangementService'
import { _getAttendanceListFromAttendanceIds } from '../../services/attendance/AttendanceService'
import { _getSiteListByIds, _getSiteNameData } from '../../services/site/SiteService'
import { getDailyStartTime, newCustomDate } from '../../models/_others/CustomDate'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { toArrangementListCLType } from '../../models/arrangement/ArrangementListType'

/**
 * myCompanyIdは、管理側のみ現場への遷移でrequestIdを使う可能性があるため必要。
 */
export type getUnreportedAttendanceListOfTargetWorkerParam = {
    workerId: string
    companyId?: string
}

/**
 * unreportedSites - 未報告の過去の現場
 * unReportedAttendances - 未報告の過去の勤怠
 * sites - 今日以降の手配された現場
 * arrangements - 今日以降の手配
 */
export type getUnreportedAttendanceListOfTargetWorkerResponse = {
    unreportedSites: SiteCLType[]
    unReportedAttendances: AttendanceCLType[]
    sites: SiteCLType[]
    arrangements: ArrangementCLType[]
}
/**
 * 指定作業員の勤怠スケジュールを取得
 * @params {@link getUnreportedAttendanceListOfTargetWorkerParam}
 * @returns {@link getUnreportedAttendanceListOfTargetWorkerResponse}
 */
export const getUnreportedAttendanceListOfTargetWorker = async (param: getUnreportedAttendanceListOfTargetWorkerParam): Promise<CustomResponse<getUnreportedAttendanceListOfTargetWorkerResponse>> => {
    try {
        const { workerId, companyId } = param

        const arrangementsResult: CustomResponse<GetArrangementListOfTargetWorkerResponse> = await _getArrangementListOfTargetWorker({
            workerId,
            options: {
                site: {
                    siteNameData: true,
                    companyRequests: {
                        params: {
                            companyId: companyId ?? 'no-id',
                            types: ['receive'],
                        },
                    },
                },
                attendance: true,
            },
        })
        if (arrangementsResult.error) {
            throw {
                error: arrangementsResult.error,
            } as CustomResponse
        }

        /**
         * 手配をもとに、現場と勤怠と手配の配列を準備
         */
        const _sites = (arrangementsResult.success?.items?.map((arr) => toSiteCLType(arr.site)).filter((data) => data != undefined) as SiteCLType[]) ?? []
        const sites = _sites.sort((a, b) => ((a.meetingDate?.totalSeconds as number) ?? a.startDate?.totalSeconds) - ((b.meetingDate?.totalSeconds as number) ?? b.startDate?.totalSeconds))
        const arrangements = (toArrangementListCLType(arrangementsResult.success).items?.filter((data) => data != undefined) as ArrangementCLType[]) ?? []
        /**
         * 今日以降の現場
         */
        const today = getDailyStartTime(newCustomDate()).totalSeconds
        const futureSites = sites.filter((site) =>
            site.siteDate ? site.siteDate >= today : (site.meetingDate || site.startDate) && (site.meetingDate?.totalSeconds ?? (site.startDate?.totalSeconds as number) >= today),
        )
        const futureArrangements = arrangements.filter((arr) =>
            arr.site?.siteDate
                ? arr.site.siteDate >= today
                : (arr.site?.meetingDate || arr.site?.startDate) && (arr.site.meetingDate?.totalSeconds ?? (arr.site.startDate?.totalSeconds as number)) >= today,
        )
        /**
         * 過去の現場
         */
        const pastSites = sites.filter((site) =>
            site.siteDate ? site.siteDate < today : (site.meetingDate || site.startDate) && (site.meetingDate?.totalSeconds ?? (site.startDate?.totalSeconds as number)) < today,
        )
        const pastArrangements = arrangements.filter((arr) =>
            arr.site?.siteDate
                ? arr.site.siteDate < today
                : (arr.site?.meetingDate || arr.site?.startDate) && (arr.site.meetingDate?.totalSeconds ?? (arr.site.startDate?.totalSeconds as number)) < today,
        )
        /**
         * 過去の未報告の現場
         */
        const unReportedArrangements = pastArrangements.filter((arr) => arr.attendance?.isReported == false && arr.attendance?.isAbsence != true)
        const _unReportedAttendances = (unReportedArrangements.map((arr) => arr.attendance).filter((data) => data != undefined) as AttendanceCLType[]) ?? []
        const unreportedSiteIds = unReportedArrangements.map((arr) => arr.siteId).filter((data) => data != undefined) as string[]
        const unreportedSites = pastSites.filter((site) => unreportedSiteIds.some((id) => id == site.siteId))

        const unReportedAttendances = _unReportedAttendances.map((att) => {
            const _arrangement = unReportedArrangements.filter((arr) => arr.attendanceId == att.attendanceId)[0]
            return {
                ...att,
                arrangement: _arrangement,
            } as AttendanceCLType
        })

        const rtnObj: getUnreportedAttendanceListOfTargetWorkerResponse = {
            unreportedSites: unreportedSites,
            unReportedAttendances: unReportedAttendances,
            sites: futureSites,
            arrangements: futureArrangements,
        }

        return Promise.resolve({ success: rtnObj })
    } catch (error) {
        return getErrorMessage(error)
    }
}
