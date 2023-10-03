import { CustomDate, getDailyStartTime, getMonthlyDays, getMonthlyFirstDay, getYYYYMMDDTotalSeconds, nextDay } from '../../models/_others/CustomDate'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import cloneDeep from 'lodash/cloneDeep'
import flatten from 'lodash/flatten'
import sum from 'lodash/sum'
import { DateDataCLType, DateDataType, GetDateDataOptionParam, toDateDataCLType } from '../../models/date/DateDataType'
import { _getDateData } from '../../services/date/DateDataService'
import { getSiteMeterWithAttendanceOption } from '../../models/site/SiteMeterType'
import { getRequestMeterWithAttendanceOption } from '../../models/request/RequestMeterType'
import { _getSubActualRespondCount, _getSubUnApprovedCount, _getSubUnReportedRespondCount, _getSubWaitingRespondCount } from '../../services/site/SiteUtilsService'
import { filterIndexArray } from '../../models/_others/Common'
import { AttendanceType } from '../../models/attendance/Attendance'
import { _getInvRequestListOfTargetDateAndCompany } from '../../services/invRequest/InvRequestService'
import { SiteType } from '../../models/site/Site'
import { ArrangementType } from '../../models/arrangement/Arrangement'
import { ArrangementListType } from '../../models/arrangement/ArrangementListType'

export const getDateAttendanceOption = (myCompanyId: string): GetDateDataOptionParam => ({
    sites: {
        params: {
            types: ['manage', 'fake-company-manage', 'requested'],
        },

        /**
         * 自社施工と仮会社施工の現場の集計取得。
         */
        ...getSiteMeterWithAttendanceOption(myCompanyId),
        siteRelation: {
            params: {
                companyId: myCompanyId,
            },
        },
        siteNameData: true,
        subActualRespondCount: true,
        subUnreportedCount: true,
        subWaitingCount: true,
        /**
         * 常用現場の場合の集計取得に必要。
         */
        companyRequests: {
            params: {
                companyId: myCompanyId,
                types: ['receive'],
            },
            company: true,
            subActualRespondCount: true,
            subUnreportedCount: true,
            subWaitingCount: true,
            ...getRequestMeterWithAttendanceOption(myCompanyId),
        },
    },
    arrangeableWorkers: true,
    invRequests: {
        attendances: true,
        workers: true,
    },
})

/**
 * @requires
 * @param myCompanyId - 自社
 * @param date - 勤怠を取得したい日
 */
export type getDateAttendanceDataParam = {
    myCompanyId: string
    date: CustomDate
}

export type getDateAttendanceDataResponse = DateDataType | undefined
/**
 * @remarks 指定日の現場の勤怠を取得
 * @objective  DateAttendances.tsxにおいて指定日の勤怠を取得するため
 * @error
 * - COMPANY_ERROR - 自社Idがなかった場合
 * - DATE_ERROR - 日付が指定されなかった場合
 * - SITE_ERROR - 現場の取得が失敗した場合
 * @author Kamiya
 * @param params - {@link getDateAttendanceDataParam}
 * @returns - {@link getDateAttendanceDataResponse}
 */

export const getDateAttendanceData = async (params: getDateAttendanceDataParam): Promise<CustomResponse<getDateAttendanceDataResponse>> => {
    try {
        const { myCompanyId, date } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
                errorCode: 'COMPANY_ERROR',
            } as CustomResponse
        }
        if (date == undefined) {
            throw {
                error: '情報が足りません。',
                errorCode: 'DATE_ERROR',
            } as CustomResponse
        }

        const _date = getDailyStartTime(date)

        const dateResult = await _getDateData({
            companyId: myCompanyId,
            date: getYYYYMMDDTotalSeconds(_date),
            options: getDateAttendanceOption(myCompanyId),
        })
        if (dateResult.error) {
            throw {
                error: dateResult.error,
            }
        }

        const dateData = dateResult.success
        if (dateData == undefined || dateData == null) {
            /**
             * invRequestのSSGを取り入れるまでの回避策。こうしておかないと、現場がない日にdateDataが取得できず、invRequestsも取得できない
             */
            const invRequestsResult = await _getInvRequestListOfTargetDateAndCompany({
                companyId: myCompanyId ?? 'no-id',
                date: _date.totalSeconds,
                types: ['order'],
                options: {
                    workers: true,
                    attendances: true,
                },
            })
            const invRequests = invRequestsResult.success
            if (invRequests?.totalInvRequests?.items != undefined && invRequests.totalInvRequests?.items?.length > 0) {
                const _dateData: DateDataType = {
                    invRequests: invRequests,
                    date: _date.totalSeconds,
                }
                return Promise.resolve({
                    success: _dateData,
                })
            }
        }
        return Promise.resolve({
            success: dateData,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * @param dateData - 勤怠サマリーを取得したいデータ
 */
export type getDateAttendanceDataSummaryDataParam = {
    dateData: DateDataType
}

export type getDateAttendanceDataSummaryDataResponse = DateDataType | undefined
/**
 * @remarks 指定した日付データの勤怠サマリーを取得
 * @objective  DateAttendances.tsxにおいて指定日の勤怠を取得するため
 * @error
 * @author Hiruma
 * @param params - {@link getDateAttendanceDataSummaryDataParam}
 * @returns - {@link getDateAttendanceDataSummaryDataResponse}
 */

export const getDateAttendanceDataSummaryData = async (params: getDateAttendanceDataSummaryDataParam): Promise<CustomResponse<getDateAttendanceDataSummaryDataResponse>> => {
    try {
        const { dateData } = params

        const _dateData = {
            ...dateData,
            attendanceSummary: {
                arrangedWorkersCount: getDateAttendanceActualWorkersCount({
                    data: dateData,
                }),
                waitingWorkersCount: getDateAttendanceWaitingWorkersCount({
                    data: dateData,
                }),
                unReportedWorkersCount: getDateAttendanceUnReportedWorkersCount({
                    data: dateData,
                }),
                attendanceModificationRequestCount: getDateAttendanceModificationRequestCount({
                    data: dateData,
                }),
                sitesCount: dateData?.sites?.totalSites?.items?.length,
            },
        } as DateDataType

        return Promise.resolve({
            success: _dateData,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * @param data - {@link getDateAttendanceOption}が必要。
 */
export type GetDateAttendanceWorkersCountParam = {
    data?: DateDataType
}
/**
 * @remarks 指定日の稼働数の取得。稼働数 := 現場への手配数 + 応答された常用依頼数。
 * @objective AttendanceHome.tsxにおいて指定日の稼働数を取得するため。
 * @author Kamiya
 * @param params - {@link GetDateAttendanceWorkersCountParam}
 * @returns - 指定日の稼働数
 */
export const getDateAttendanceActualWorkersCount = (params: GetDateAttendanceWorkersCountParam): number => {
    const { data } = params

    /**
     * 仮会社施工と自社施工の場合
     */
    const arrangeWorkersCountAtManagerSite = sum(
        [
            ...(filterIndexArray(data?.sites?.totalSites?.items ?? [], data?.sites?.managerSites ?? []) ?? []),
            ...(filterIndexArray(data?.sites?.totalSites?.items ?? [], data?.sites?.fakeCompanyMangerSites ?? []) ?? []),
        ].map((site) => {
            return site.siteMeter ? _getSubActualRespondCount({ meter: site.siteMeter }) : 0
        }),
    )
    /**
     * 常用現場の場合
     */
    const arrangeWorkersCountAtRequestedSite = sum(
        filterIndexArray(data?.sites?.totalSites?.items ?? [], data?.sites?.requestedSites ?? [])
            ?.filter((site) => site.fakeCompanyInvRequestId == undefined && site.siteRelation != 'fake-company-manager')
            ?.map((site) => (site.companyRequests?.receiveRequests?.items ?? [])[0])
            ?.map((request) => {
                return request?.requestMeter ? _getSubActualRespondCount({ meter: request?.requestMeter }) : 0
            }),
    )
    /**
     * 現場に手配されたら稼働数に常用申請を追加。受注側は追加すると自社手配と二重で加算してしまうので、発注側のみ。
     */
    const arrangeWorkersCountAtInvRequests = sum(
        data?.invRequests?.orderInvRequests?.items
            ?.filter((inv) => inv.targetCompany?.isFake == false)
            ?.map((inv) => inv.attendanceIds?.length)
            .filter((data) => data != undefined) as number[],
    )
    return arrangeWorkersCountAtManagerSite + arrangeWorkersCountAtRequestedSite + arrangeWorkersCountAtInvRequests
}

/**
 * @requires
 * @param data - {@link getDateAttendanceOption}が必要。
 */
export type GetDateAttendanceWaitingWorkersCountParam = {
    data?: DateDataType
}
/**
 * @remarks 指定日の応答待ちの取得
 * @objective AttendanceHome.tsxにおいて指定日の応答待ちを取得するため。
 * @author Hiruma
 * @param params - {@link GetDateAttendanceWaitingWorkersCountParam}
 * @returns - 指定日の応答待ち
 */
export const getDateAttendanceWaitingWorkersCount = (params: GetDateAttendanceWaitingWorkersCountParam): number => {
    const { data } = params
    /**
     * 仮会社施工と自社施工の場合
     */
    const waitingWorkersCountAtManagerSite = sum(
        [
            ...(filterIndexArray(data?.sites?.totalSites?.items ?? [], data?.sites?.managerSites ?? []) ?? []),
            ...(filterIndexArray(data?.sites?.totalSites?.items ?? [], data?.sites?.fakeCompanyMangerSites ?? []) ?? []),
        ].map((site) =>
            /**
             * 依頼数と応答数の差分の合計
             */
            site.siteMeter ? _getSubWaitingRespondCount({ meter: site.siteMeter }) : 0,
        ),
    )

    /**
     * 常用現場の場合
     */
    const waitingWorkersCountAtRequestedSite = sum(
        filterIndexArray(data?.sites?.totalSites?.items ?? [], data?.sites?.requestedSites ?? [])
            ?.filter((site) => site.fakeCompanyInvRequestId == undefined && site.siteRelation != 'fake-company-manager')
            ?.map((site) => (site.companyRequests?.receiveRequests?.items ?? [])[0])
            ?.map((request) =>
                /**
                 * 依頼数と応答数の差分の合計
                 */
                request?.requestMeter ? _getSubWaitingRespondCount({ meter: request?.requestMeter }) : 0,
            ),
    )
    return waitingWorkersCountAtManagerSite + waitingWorkersCountAtRequestedSite
}

/**
 * @requires
 * @param data - {@link getDateAttendanceOption}が必要。
 */
export type GetDateAttendanceUnReportedWorkersCountParam = {
    data?: DateDataType
}
/**
 * @remarks 指定日の未報告の取得
 * @objective AttendanceHome.tsxにおいて指定日の未報告を取得するため。
 * @author Hiruma
 * @param params - {@link GetDateAttendanceUnReportedWorkersCountParam}
 * @returns - 指定日の未報告
 */
export const getDateAttendanceUnReportedWorkersCount = (params: GetDateAttendanceUnReportedWorkersCountParam): number => {
    const { data } = params
    const unReportedCountAtManagerSite = sum(
        [
            ...(filterIndexArray(data?.sites?.totalSites?.items ?? [], data?.sites?.managerSites ?? []) ?? []),
            ...(filterIndexArray(data?.sites?.totalSites?.items ?? [], data?.sites?.fakeCompanyMangerSites ?? []) ?? []),
        ]?.map((site) =>
            site.siteMeter
                ? _getSubUnReportedRespondCount({
                      meter: site.siteMeter,
                  })
                : 0,
        ) ?? 0,
    )
    /**
     * 常用現場の場合
     */
    const unReportedCountAtRequestedSite =
        sum(
            filterIndexArray(data?.sites?.totalSites?.items ?? [], data?.sites?.requestedSites ?? [])
                ?.filter((site) => site.fakeCompanyInvRequestId == undefined && site.siteRelation != 'fake-company-manager')
                ?.map((site) => (site.companyRequests?.receiveRequests?.items ?? [])[0])
                ?.map((request) =>
                    request?.requestMeter
                        ? _getSubUnReportedRespondCount({
                              meter: request?.requestMeter,
                          })
                        : 0,
                ),
        ) ?? 0
    /**
     * 常用申請の場合
     */
    const invRequestAttendances = flatten(data?.invRequests?.orderInvRequests?.items?.filter((inv) => inv.targetCompany?.isFake == false)?.map((inv) => inv.attendances)).filter(
        (data) => data != undefined,
    ) as AttendanceType[]
    const unReportedCountAtInvRequests = sum(invRequestAttendances.map((att) => !att.isReported))
    return unReportedCountAtManagerSite + unReportedCountAtRequestedSite + unReportedCountAtInvRequests
}
/**
 * @requires
 * @param data - {@link getDateAttendanceOption}が必要。
 */
export type GetDateAttendanceUnApprovedWorkersCountParam = {
    data?: DateDataType
}
/**
 * @remarks 指定日の勤怠未承認の取得
 * @objective 指定日の勤怠未承認を取得して、日付管理画面にて表示モードを切り替えるため
 * @author kamiya
 * @param params - {@link GetDateAttendanceUnApprovedWorkersCountParam}
 * @returns - 指定日の勤怠未承認
 */
export const getDateAttendanceUnApprovedWorkersCount = (params: GetDateAttendanceUnApprovedWorkersCountParam): number => {
    const { data } = params
    const unReportedCountAtManagerSite = sum(
        [
            ...(filterIndexArray(data?.sites?.totalSites?.items ?? [], data?.sites?.managerSites ?? []) ?? []),
            ...(filterIndexArray(data?.sites?.totalSites?.items ?? [], data?.sites?.fakeCompanyMangerSites ?? []) ?? []),
        ]?.map((site) =>
            site.siteMeter
                ? _getSubUnApprovedCount({
                      meter: site.siteMeter,
                  })
                : 0,
        ) ?? 0,
    )
    /**
     * 常用現場の場合
     */
    const unReportedCountAtRequestedSite =
        sum(
            filterIndexArray(data?.sites?.totalSites?.items ?? [], data?.sites?.requestedSites ?? [])
                ?.filter((site) => site.fakeCompanyInvRequestId == undefined && site.siteRelation != 'fake-company-manager')
                ?.map((site) => (site.companyRequests?.receiveRequests?.items ?? [])[0])
                ?.map((request) =>
                    request?.requestMeter
                        ? _getSubUnApprovedCount({
                              meter: request?.requestMeter,
                          })
                        : 0,
                ),
        ) ?? 0
    /**
     * 常用申請の場合
     */
    const invRequestAttendances = flatten(data?.invRequests?.orderInvRequests?.items?.filter((inv) => inv.targetCompany?.isFake == false)?.map((inv) => inv.attendances)).filter(
        (data) => data != undefined,
    ) as AttendanceType[]
    const unApprovedCountAtInvRequests = sum(invRequestAttendances.map((att) => att.isApprove != true))
    return unReportedCountAtManagerSite + unReportedCountAtRequestedSite + unApprovedCountAtInvRequests
}
/**
 * @requires
 * @param myCompanyId - 自社
 * @param month - 勤怠を取得したい月
 */
export type GetAttendanceMonthlyDataParam = {
    myCompanyId: string
    month: CustomDate
}
/**
 * - DateDataCLType[] - 対象月の勤怠情報を含んだ現場の日毎のリスト
 */
export type GetAttendanceMonthlyDataResponse = DateDataCLType[] | undefined
/**
 * @remarks 指定月の勤怠一覧を取得する
 * @objective AttendanceHome.tsxにおいて自指定月の勤怠一覧を取得するため。
 * @error
 * - COMPANY_ERROR - 自社Idがなかった場合
 * - MONTH_ERROR - 月が指定されなかった場合
 * - DATE_DATA_ERROR - 指定日のデータが取得できなかった場合
 * @author  Kamiya
 * @param params - {@link GetAttendanceMonthlyDataParam}
 * @return  - {@link GetAttendanceMonthlyDataResponse}
 */
export const getAttendanceMonthlyData = async (params: GetAttendanceMonthlyDataParam): Promise<CustomResponse<GetAttendanceMonthlyDataResponse>> => {
    try {
        const { myCompanyId, month } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
                errorCode: 'COMPANY_ERROR',
            } as CustomResponse
        }
        if (month == undefined) {
            throw {
                error: '情報が足りません。',
                errorCode: 'MONTH_ERROR',
            } as CustomResponse
        }
        /**
         * 指定月の初日から最終日までを配列に入れる
         */
        const monthlyDays = getMonthlyDays(month)
        const dateList: CustomDate[] = []
        let dateNow = cloneDeep(getMonthlyFirstDay(month))
        for (let index = 0; index < monthlyDays; index++) {
            dateList.push(dateNow)
            dateNow = nextDay(dateNow)
        }
        /**
         * 指定月の初日から最終日までのデータを取得する
         */
        const dateDataListResult = await Promise.all(
            dateList.map((date) =>
                getDateAttendanceData({
                    date,
                    myCompanyId,
                }),
            ),
        )

        dateDataListResult.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: 'DATE_DATA_ERROR',
                }
            }
        })

        return Promise.resolve({
            success: dateDataListResult.map((result) => result.success).filter((data) => data != undefined) as DateDataCLType[],
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * @param data - {@link getDateAttendanceOption}が必要。
 */
export type GetDateAttendanceModificationRequestCountParam = {
    data?: DateDataType
}

/**
 * @remarks 指定日の勤怠修正依頼数の取得
 * @objective DateAttendances.tsxにおいて指定日の勤怠修正依頼数を取得するため。
 * @param params - {@link GetDateAttendanceModificationRequestCountParam}
 * @returns - 指定日の勤怠修正依頼数
 */
export const getDateAttendanceModificationRequestCount = (params: GetDateAttendanceModificationRequestCountParam): number => {
    const { data } = params
    const attendanceModificationRequestCount = sum(
        data?.sites?.totalSites?.items?.map((site) => {
            const siteAttendanceModificationRequestCount = sum(
                site.allArrangements?.items?.map((arrangement) => (arrangement.attendanceModification?.status == 'created' || arrangement.attendanceModification?.status == 'edited' ? 1 : 0)),
            )
            return siteAttendanceModificationRequestCount
        }),
    )
    return attendanceModificationRequestCount
}

/**
 * @requires
 * @param data - {@link getDateAttendanceOption}が必要。
 */
export type GetAttendanceModificationRequestCountParam = {
    arrangements?: ArrangementListType
}

/**
 * @remarks 指定手配リストの勤怠修正依頼数の取得
 * @objective DateAttendance.tsxにおいて指定日の勤怠修正依頼数を取得するため。
 * @param params - {@link GetDateAttendanceModificationRequestCountParam}
 * @returns - 指定手配リストの勤怠修正依頼数
 */
export const getAttendanceModificationRequestCount = (params: GetAttendanceModificationRequestCountParam): number => {
    const { arrangements } = params
    const siteAttendanceModificationRequestCount = sum(
        arrangements?.items?.map((arrangement) => (arrangement.attendanceModification?.status == 'created' || arrangement.attendanceModification?.status == 'edited' ? 1 : 0)),
    )
    return siteAttendanceModificationRequestCount
}
