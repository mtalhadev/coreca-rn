import cloneDeep from 'lodash/cloneDeep'
import flatten from 'lodash/flatten'
import keys from 'lodash/keys'
import some from 'lodash/some'
import sum from 'lodash/sum'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'
import { _getCompanySiteListOfTargetCompanyAndDate, _getSite, _getSiteListByIds } from '../../services/site/SiteService'
import {
    CustomDate,
    dayBaseText,
    dayBaseTextWithoutDate,
    getDailyEndTime,
    getDailyStartTime,
    getMonthlyDays,
    getMonthlyFirstDay,
    getYYYYMMDDTotalSeconds,
    nextDay,
    toCustomDateFromTotalSeconds,
} from '../../models/_others/CustomDate'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import {
    ClearDailyArrangement,
    getArrangementDataOfTargetSite,
    makeInvRequestNotifications,
    makeNotifications,
    sendBulkNotification,
    setRequestConfirmed,
    setSiteConfirmed,
} from './SiteArrangementCase'
import { DateDataType, GetDateDataOptionParam } from '../../models/date/DateDataType'
import { _getDateData, _updateDateData } from '../../services/date/DateDataService'
import { HolidayType, _getHolidayList } from '../../services/_others/HolidaySercvice'
import { getSiteMeterOption } from '../../models/site/SiteMeterType'
import { getRequestMeterOption } from '../../models/request/RequestMeterType'
import { AccountType } from '../../models/account/Account'
import { SiteArrangementDataType } from '../../models/arrangement/SiteArrangementDataType'
import { SiteType } from '../../models/site/Site'
import { filterIndexArray } from '../../models/_others/Common'
import { _getInvRequestListByIds, _getInvRequestListOfTargetDateAndCompany } from '../../services/invRequest/InvRequestService'
import { setInvRequestApplication } from '../invRequest/InvRequestArrangementCase'
import { InvRequestType } from '../../models/invRequest/InvRequestType'
import { genKeyName, getCachedData, updateCachedData } from '../CachedDataCase'
import { ArrangementType } from '../../models/arrangement/Arrangement'
import { RequestType } from '../../models/request/Request'
import { WorkerListType } from '../../models/worker/WorkerListType'
import { DateInvRequestArrangementType, DateSiteArrangementType } from '../../screens/adminSide/date/DateArrangements'
import { _getRequestListByIds } from '../../services/request/RequestService'
import isEqual from 'lodash/isEqual'

export const getDateArrangementOption = (myCompanyId: string): GetDateDataOptionParam => ({
    sites: {
        params: {
            types: ['manage', 'fake-company-manage', 'requested'],
        },

        /**
         * 自社施工と仮会社施工の現場の集計取得。
         */
        ...getSiteMeterOption(myCompanyId),
        siteRelation: {
            params: {
                companyId: myCompanyId,
            },
        },
        siteNameData: true,

        /**
         * 常用現場の場合の集計取得に必要。
         */
        companyRequests: {
            params: {
                companyId: myCompanyId,
                types: ['receive'],
            },
            company: true,
            ...getRequestMeterOption(myCompanyId),
        },
        allArrangements: true,
    },
    arrangeableWorkers: true,
    invRequests: {
        workers: true,
        myCompany: true,
        targetCompany: true,
    },
})

export type GetDateArrangementDataParam = {
    myCompanyId?: string
    date?: CustomDate
}

export type GetDateArrangementDataResponse = DateDataType | undefined

export const getDateArrangementData = async (params: GetDateArrangementDataParam): Promise<CustomResponse<GetDateArrangementDataResponse>> => {
    try {
        const { myCompanyId, date } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }
        if (date == undefined) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        const _date = getDailyStartTime(date)
        /**
         * TZの問題があるので時間は0時に揃える
         */
        const [dateResult] = await Promise.all([
            _getDateData({
                companyId: myCompanyId,
                date: getYYYYMMDDTotalSeconds(_date),
                options: getDateArrangementOption(myCompanyId),
            }),
            // _getHolidayList(),
        ])

        if (dateResult.error) {
            throw {
                error: dateResult.error,
                errorCode: 'GET_DATE_DATA_ERROR',
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
                types: ['all'],
                options: {
                    workers: true,
                    attendances: true,
                    targetCompany: true,
                    myCompany: true,
                },
            })
            const invRequests = invRequestsResult.success
            if (invRequests?.totalInvRequests?.items != undefined && invRequests.totalInvRequests?.items?.length > 0) {
                const _dateData: DateDataType = {
                    companyId: myCompanyId,
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

export type GetDateArrangementDataSummaryDataParam = {
    dateData: DateDataType
}

export type GetDateArrangementDataSummaryDataResponse = DateDataType | undefined

export const getDateArrangementDataSummaryData = async (params: GetDateArrangementDataSummaryDataParam): Promise<CustomResponse<GetDateArrangementDataSummaryDataResponse>> => {
    try {
        const { dateData } = params
        const [holidaysResult] = await Promise.all([_getHolidayList()])
        if (holidaysResult.error) {
            throw {
                error: holidaysResult.error,
                errorCode: 'GET_HOLIDAYS_ERROR',
            }
        }
        const arrangedWorkersCount = getDateArrangedWorkersCount({
            data: dateData,
        })
        const _dateData: DateDataType = {
            ...dateData,
            arrangementSummary: {
                arrangedWorkersCount,
                sitesCount: dateData?.sites?.totalSites?.items?.length,
            },
        }
        return Promise.resolve({
            success: _dateData,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type SetSiteCertainInTargetDateParam = {
    sites?: SiteType[]
    requests?: RequestType[]
    invRequestIds?: string[]
    myCompanyId?: string
    signInUser?: AccountType
    date?: CustomDate
    isConfirmed?: boolean
}

export type SetSiteCertainInTargetDateResponse = boolean | undefined
/**
 * この関数内でエラーが発生すると、手配はしてあるけれど現場が確定していないという状況が発生する。
 */
export const setSiteCertainInTargetDate = async (params: SetSiteCertainInTargetDateParam): Promise<CustomResponse<SetSiteCertainInTargetDateResponse>> => {
    try {
        const { sites, requests, invRequestIds, myCompanyId, signInUser, date, isConfirmed } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }
        if (signInUser?.workerId == undefined) {
            throw {
                error: 'ログイン情報がありません。ログインし直してください。',
            } as CustomResponse
        }
        if (isConfirmed == undefined || date == undefined) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }

        //TODO:データを取得せずに渡す.ただ、応答手配してきているかなどの情報をSSGが瞬時に反映されない問題もある
        if (sites) {
            const results = await Promise.all([
                ...(sites.map((site) =>
                    setSiteConfirmed({
                        siteId: site.siteId,
                        isConfirmed,
                        myCompanyId,
                    }),
                ) ?? []),
                ...(sites.map(async (site) => {
                    const resultArrangement = await getArrangementDataOfTargetSite({
                        siteId: site.siteId ?? 'no-id',
                        myCompanyId,
                        myWorkerId: signInUser.workerId ?? 'no-id',
                    })

                    const siteArrangementData = resultArrangement.success?.siteArrangementData
                    const keepArrangementData = cloneDeep(siteArrangementData)
                    if (keepArrangementData) {
                        ClearDailyArrangement(keepArrangementData)
                    }

                    if (siteArrangementData && keepArrangementData) {
                        return makeNotifications(site, signInUser, siteArrangementData, keepArrangementData, false, '', true)
                    } else {
                        return {
                            success: false,
                        }
                    }
                }) ?? []),
            ])
            results.forEach((result) => {
                if (result?.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            })
        }

        if (requests) {
            const results = await Promise.all([
                ...(requests
                    ?.filter((request) => request.requestedCompanyId == myCompanyId && request?.isApplication == true && request?.isApproval == true)
                    .map((request) => {
                        setSiteConfirmed({
                            siteId: request?.siteId,
                            isConfirmed,
                            myCompanyId,
                        })
                        return setRequestConfirmed({
                            requestId: request.requestId,
                            isConfirmed,
                            myCompanyId,
                        })
                    }) ?? []),
                ...(requests
                    ?.filter((request) => request.requestedCompanyId == myCompanyId)
                    .map(async (request) => {
                        const resultArrangement = await getArrangementDataOfTargetSite({
                            siteId: request.siteId ?? 'no-id',
                            myCompanyId,
                            myWorkerId: signInUser.workerId ?? 'no-id',
                            respondRequestId: request.requestId,
                        })

                        const siteArrangementData = resultArrangement.success?.siteArrangementData
                        const keepArrangementData = cloneDeep(siteArrangementData)
                        if (keepArrangementData) {
                            ClearDailyArrangement(keepArrangementData)
                        }
                        if (request?.site && siteArrangementData && keepArrangementData) {
                            return makeNotifications(request.site, signInUser, siteArrangementData, keepArrangementData, true, request.requestId ?? '', true)
                        } else {
                            return {
                                success: false,
                            }
                        }
                    }) ?? []),
            ])
            results.forEach((result) => {
                if (result?.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            })
        }
        if (invRequestIds) {
            const invRequestsResult = await _getInvRequestListByIds({
                invRequestIds,
                options: {
                    targetCompany: true,
                    myCompany: true, //お知らせで利用
                    site: {
                        //お知らせで利用
                        companyRequests: {
                            params: {
                                companyId: myCompanyId,
                            },
                        },
                    },
                },
            })
            if (invRequestsResult.error) {
                throw {
                    error: invRequestsResult.error,
                    errorCode: invRequestsResult.errorCode,
                }
            }
            invRequestsResult.success?.items?.map((inv) => {
                if ((inv.workerIds == undefined || inv.workerIds?.length < 1) && inv.targetCompany?.isFake != true) {
                    throw {
                        error: '作業員が手配されていない常用申請があります。',
                        errorCode: 'SET_SITE_CERTAIN_DATE_ERROR',
                    }
                }
            })
            const results = await Promise.all([
                ...(invRequestsResult.success?.items?.map((invRequest) => {
                    if (invRequest?.targetCompany?.isFake == true) {
                        //仮会社へ送る場合は現場と依頼を確定
                        if (invRequest.site?.companyRequests?.receiveRequests?.items) {
                            setRequestConfirmed({
                                requestId: invRequest.site?.companyRequests?.receiveRequests?.items[0]?.requestId,
                                isConfirmed,
                                myCompanyId,
                            })
                        }
                        return setSiteConfirmed({
                            siteId: invRequest.site?.siteId,
                            isConfirmed,
                            myCompanyId,
                        })
                    } else {
                        //仮会社へ送る場合は常に申請も承認もtrueになるため除外
                        return setInvRequestApplication({
                            invRequestId: invRequest.invRequestId,
                            isApplication: true,
                            myCompanyId,
                            invRequest,
                            isDailyBundle: true,
                        })
                    }
                }) ?? []),
                ...(invRequestsResult.success?.items?.map((inv) => makeInvRequestNotifications(inv)) ?? []),
            ])
            results.forEach((result) => {
                if (result?.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            })
        }

        //まとめて確定を１通だけ通知
        await sendBulkNotification({ date, signInUser })

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * @param date - 日付
 * @param data - その日に手配可能な作業員の情報を含んだデータ
 * @param holidays - 祝日
 */
export type GetDateWorkersCountParam = {
    data?: DateDataType
    date: number
    holidays?: HolidayType
}
/**
 * @remarks 指定日に出勤できる自社作業員数を取得する。isOfficeWorkerを含まない
 * @objective 指定日の手配可能数、過不足を取得するため。
 * @author  Kamiya
 * @param params - {@link GetDateWorkersCountParam}
 * @returns - 指定日に出勤できる自社作業員の数。手配済みは考慮しない。
 */
export const getDateWorkersCount = (params: GetDateWorkersCountParam): number => {
    const { data, date, holidays } = params
    const _date = toCustomDateFromTotalSeconds(date)
    /**
     * 指定日が祝日かどうか判定する
     */
    const isHoliday = keys(holidays).includes(dayBaseTextWithoutDate(_date))
    /**
     * 退会済みを外す && 休日を外す && 祝日が休みの場合はずす && その他の休日を外す
     */
    const workersCount =
        data?.arrangeableWorkers?.workers?.items?.filter(
            (worker) =>
                !worker.isOfficeWorker &&
                !worker.offDaysOfWeek?.includes(_date?.dayOfWeekText) &&
                (isHoliday ? !worker.offDaysOfWeek?.includes('祝') : true) &&
                !some(worker.otherOffDays, ['dayBaseText', dayBaseText(_date)]) &&
                (worker.leftDate ? getDailyStartTime(toCustomDateFromTotalSeconds(worker.leftDate)).totalSeconds > getDailyStartTime(_date).totalSeconds : true),
        ).length ?? 0

    return workersCount
}
/**
 * @requires
 * @param data - その日に手配可能な作業員、現場の情報を含んだデータ
 */
export type GetDateArrangedWorkersCountParam = {
    data?: DateDataType
}
/**
 * @remarks 指定日に手配済み作業員の数+常用依頼数を取得
 * @param params - {@link GetDateArrangedWorkersCountParam}
 * @returns - 指定日に手配済み作業員の数
 */
export const getDateArrangedWorkersCount = (params: GetDateArrangedWorkersCountParam): number  => {
    const { data } = params
    const arrangedWorkerIds = uniq(
        [...flatten(
            data?.sites?.totalSites?.items
                ?.filter((site) => !(site.siteRelation == 'fake-company-manager' && site.fakeCompanyInvRequestId != undefined))
                .map((site) => site.allArrangements?.items?.filter(arr => arr.createCompanyId == data.companyId).map((arr) => arr.workerId)),
        )??[],
        ...flatten(data?.invRequests?.orderInvRequests?.items?.map(invRequest => invRequest.workerIds))??[]]
    ).filter(data => data != undefined)
    const requestCount = sum(
        [...data?.sites?.totalSites?.items?.map(site => sum(site.companyRequests?.orderRequests?.items?.map(req => req.requestCount ?? 0)))??[],
        ...data?.invRequests?.orderInvRequests?.items?.map(inv => sum(inv.site?.companyRequests?.orderRequests?.items?.map(req => req.requestCount ?? 0)))??[]
    ]
        )
    const arrangedCount = (arrangedWorkerIds.length ?? 0) + requestCount
    return arrangedCount
}

/**
 * @requires
 * @param date - 日付
 * @param data - その日に手配可能な作業員、現場の情報を含んだデータ
 * @param holidays - 祝日
 */
export type GetDateDeficiencyAndExcessParam = {
    data?: DateDataType
    date: number
    holidays?: HolidayType
}
/**
 * @requires
 * @param myCompanyId - 自社Id。
 * @param month - 手配情報を取得したい月
 */
export type getArrangementMonthlyDataParam = {
    myCompanyId: string
    month: CustomDate
}
/**
 * @param DateDataCLType[] - 指定月の日ごとに、現場と手配可能な作業員の情報が入った配列
 */
export type getArrangementMonthlyDataResponse = DateDataType[] | undefined
/**
 * @remarks 指定月の現場・手配を取得する。
 * @objective ArrangementHome.tsxにおいて現場・手配状況を取得するため
 * @error
 * - COMPANY_ERROR - 自社Idがなかった場合
 * - MONTH_ERROR - 月が指定されていなかった場合
 * - DATE_DATA_ERROR - 指定月の現場・手配情報の取得に失敗した場合
 * @author  Kamiya
 * @param params - {@link getArrangementMonthlyDataParam}
 * @returns - {@link getArrangementMonthlyDataResponse}
 */
export const getArrangementMonthlyData = async (params: getArrangementMonthlyDataParam): Promise<CustomResponse<getArrangementMonthlyDataResponse>> => {
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
                getDateArrangementData({
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
            success: dateDataListResult.map((result) => result.success).filter((data) => data != undefined) as DateDataType[],
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

// /**
//  * @requires
//  * @param date - 日付
//  * @param data - その日に手配可能な作業員、現場の情報を含んだデータ
//  * @param holidays - 祝日
//  */
// export type GetDateAlertParam = {
//     data: DateDataType
//     date: number
//     holidays: HolidayType
// }
// /**
//  * @remarks 手配に関するアラートを取得する。
//  * @objective ArrangementHome.tsxにおいてアラートを表示するため。
//  * スケジュール画面で取得しなければいけない情報が増えて、ロードに時間がかかるため、一旦保留中。使用する際は、実装済みの部分も含めて検証。
//  * @author Kamiya
//  * @param params - {@link GetDateAlertParam}
//  * @returns - AlertUIType[] アラートの配列
//  */
// export const getDateAlert = (params: GetDateAlertParam): AlertUIType[] => {
//     const { data, date, holidays } = params

//     const alerts: AlertUIType[] = []
//     /**
//      * 未通知の現場数を取得
//      */
//     const notConfirmCount = data?.sites?.totalSites?.items?.filter((site) => site.isConfirmed == false).length ?? 0
//     if (notConfirmCount > 0) {
//         alerts.push({
//             message: '手配未通知の現場があります。',
//             batchCount: notConfirmCount ?? 0,
//         })
//     }
//     /**
//      * 未手配の作業員数を取得
//      */
//     if (date) {
//         const { arrangeableWorkersCount } = getDateArrangeableWorkersCount({ data, date, holidays })
//         if (arrangeableWorkersCount > 0) {
//             alerts.push({
//                 message: 'この日未手配の作業員',
//                 batchCount: arrangeableWorkersCount ?? 0,
//             })
//         }
//     }
//     /**
//      * 手配不足の現場数を取得
//      */
//     const sitesDeficiencyAndExcess =
//         uniqBy(filterIndexArray(data?.sites?.totalSites?.items ?? [], data?.sites?.managerSites ?? []), 'siteId').filter((site) => getSiteDeficiencyAndExcess(site) < 0).length ?? 0
//     const requestedSitesDeficiencyAndExcess =
//         sum(
//             uniqBy(filterIndexArray(data?.sites?.totalSites?.items ?? [], data?.sites?.requestedSites ?? []), 'siteId').map(
//                 (site) => site.companyRequests?.receiveRequests?.items?.filter((req) => req?.requestCount && req?.subRespondCount && req.requestCount - req.subRespondCount < 0).length,
//             ),
//         ) ?? 0
//     const SitesDeficiencyAndExcess = sitesDeficiencyAndExcess + requestedSitesDeficiencyAndExcess
//     if (SitesDeficiencyAndExcess > 0) {
//         alerts.push({
//             message: '手配不足の現場',
//             batchCount: SitesDeficiencyAndExcess ?? 0,
//         })
//     }

//     // const dayRequestRequiredNum =
//     //     sum(
//     //         uniqBy(data?.sites?.totalSites?.items, 'siteId').map((site) => site.allRequests?.items?.map(req => req.requestCount)),
//     //     ) ?? 0

//     // const dayRequestRespondedNum = sum(uniqBy(data?.sites?.totalSites?.items, 'siteId').map((site) => site.allRequests?.items?.map(req => req.subRespondCount)))
//     // const waitingSiteCount = dayRequestRequiredNum - dayRequestRespondedNum
//     // if (waitingSiteCount > 0) {
//     //     alerts.push({
//     //         message: '依頼先会社の作業員の「手配待ち」があります。',
//     //         batchCount: waitingSiteCount ?? 0,
//     //     })
//     // }

//     //未実装のアラート
//     // 手配
//     // ・常用依頼への相手の応答待ち

//     // 勤怠
//     // ・常用依頼への相手の応答待ち
//     // ・未報告の勤怠
//     return alerts
// }

/**
 * @requires
 * @param data - 日付データ
 */
export type uploadDateDataParam = {
    data: DateDataType
}
/**
 * @remarks 日付管理で取得したデータでDateDataを更新する。
 * @objective より正しいので。
 * @author  Hiruma
 * @param params - {@link uploadDateDataParam}
 * @returns - 成功ならtrue。
 */
export const uploadDateData = async (params: uploadDateDataParam): Promise<CustomResponse<boolean>> => {
    try {
        const { data } = params
        const result = await _updateDateData({
            ...data,
            date: data.date,
        })

        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type UpdateDateArrangementsCacheParam = {
    siteArrangements?: DateSiteArrangementType[]
    invRequestArrangements?: DateInvRequestArrangementType[]
    date?: CustomDate
    myCompanyId?: string
    accountId?: string
    updatedAt?: number
}
/**
 * キャッシュの日付の手配情報を更新する
 * @author kamiya
 * @param params UpdateDateArrangementsCacheParam
 * @returns boolean
 */
export const updateDateArrangementsCache = async (params: UpdateDateArrangementsCacheParam): Promise<CustomResponse<boolean>> => {
    try {
        const { date, siteArrangements, invRequestArrangements, myCompanyId, accountId, updatedAt } = params
        // const cacheKey = genKeyName({
        //     screenName: 'DateArrangements',
        //     accountId: accountId ?? '',
        //     companyId: myCompanyId ?? '',
        //     /** "/" はKVSのキーに使えない文字のため "-" に置き換え */
        //     date: date ? dayBaseTextWithoutDate(date).replace(/\//g, '-') : '',
        // })
        const cacheKey = genKeyName({
            screenName: 'DateRouter',
            accountId: accountId ?? '',
            companyId: myCompanyId ?? '',
            /** "/" はKVSのキーに使えない文字のため "-" に置き換え */
            date: date ? dayBaseTextWithoutDate(date).replace(/\//g, '-') : '',
        })
        const dateArrangementCacheData = await getCachedData<DateDataType>(cacheKey)
        let _dateArrangementCacheData = cloneDeep(dateArrangementCacheData.success)
        if (_dateArrangementCacheData?.updatedAt) {
            _dateArrangementCacheData.updatedAt = updatedAt ?? Number(new Date())
        }
        const invPresentArrangements = flatten(
            invRequestArrangements?.map((iArr) =>
                flatten(
                    iArr.invRequestArrangementData?.selfSide?.map((self) => {
                        const _targetArrangement: ArrangementType = {
                            ...self.targetInvRequest,
                            worker: self.worker,
                        }
                        return _targetArrangement
                    }),
                ),
            ),
        ).filter((data) => data != undefined)

        const invPresentRequests = flatten(
            invRequestArrangements?.map((iArr) =>
                flatten(
                    iArr.invRequestArrangementData?.otherSide?.map((other) => {
                        const _targetRequest: RequestType = {
                            ...other.targetRequest,
                            siteId: other.targetRequest?.siteId ?? iArr.fakeSite?.siteId,
                            requestedCompany: other.requestedCompany,
                            isApplication: true,
                            isApproval: other.requestedCompany?.isFake ? true : other.targetRequest?.isApproval,
                        }
                        return _targetRequest
                    }),
                ),
            ),
        ).filter((data) => data != undefined && (data.requestCount ?? 0) > 0)
        const newInvRequests = invRequestArrangements?.map((invRequestArrangement) => invRequestArrangement.invRequest)
        const totalInvRequests = _dateArrangementCacheData?.invRequests?.totalInvRequests?.items?.map((invRequest) => {
            const targetInv = newInvRequests?.filter((inv) => inv?.invRequestId == invRequest?.invRequestId)[0]
            if (targetInv) {
                if (targetInv.site) {
                    const _targetInv: InvRequestType = {
                        ...invRequest,
                        workerIds: targetInv.workerIds,
                        workers: targetInv.workers as WorkerListType,
                        workerCount: targetInv.workerIds?.length ?? targetInv.workerCount,
                        site: {
                            ...invRequest.site,
                            companyRequests: {
                                ...invRequest.site?.companyRequests,
                                ...(invRequest.site?.companyRequests?.receiveRequests?.items
                                    ? {
                                          receiveRequests: {
                                              items: [
                                                  {
                                                      ...invRequest.site?.companyRequests?.receiveRequests?.items[0],
                                                      isConfirmed: true,
                                                  },
                                              ],
                                          },
                                      }
                                    : {}),
                                orderRequests: {
                                    items: invPresentRequests,
                                },
                            },
                            siteMeter: {
                                ...invRequest.site?.siteMeter,
                                companyPresentNum:
                                    invRequestArrangements?.filter((iArr) => iArr?.invRequestId == invRequest?.invRequestId)[0]?.localPresentNum ?? invRequest?.site?.siteMeter?.companyPresentNum,
                                presentArrangements: {
                                    items: invPresentArrangements,
                                },
                            },
                            isConfirmed: true,
                        },
                    }
                    return _targetInv
                } else {
                    const _targetInv: InvRequestType = {
                        ...invRequest,
                        workerIds: targetInv.workerIds,
                        workers: targetInv.workers as WorkerListType,
                        workerCount: targetInv.workerIds?.length ?? targetInv.workerCount,
                        isApplication: true,
                        isApproval: invRequest.isApplication == true && invRequest.isApproval == false && isEqual(invRequest.workerIds, targetInv?.workerIds) ? false : 'waiting',
                        //申請済みかつ拒否済みかつ変更なしの場合のみwaitingにはならない。それ以外はwaitingのはず
                        invRequestStatus: invRequest.isApplication == true && invRequest.isApproval == false && isEqual(invRequest.workerIds, targetInv?.workerIds) ? 'unauthorized' : 'waiting',
                    }
                    return _targetInv
                }
            } else {
                return invRequest
            }
        })
        const orderInvRequests = _dateArrangementCacheData?.invRequests?.orderInvRequests?.items?.map((invRequest) => {
            const targetInv = newInvRequests?.filter((inv) => inv?.invRequestId == invRequest?.invRequestId)[0]
            if (targetInv) {
                if (targetInv.site) {
                    const _targetInv: InvRequestType = {
                        ...invRequest,
                        workerIds: targetInv.workerIds,
                        workers: targetInv.workers as WorkerListType,
                        workerCount: targetInv.workerIds?.length ?? targetInv.workerCount,
                        site: {
                            ...invRequest.site,
                            companyRequests: {
                                ...invRequest.site?.companyRequests,
                                ...(invRequest.site?.companyRequests?.receiveRequests?.items
                                    ? {
                                          receiveRequests: {
                                              items: [
                                                  {
                                                      ...invRequest.site?.companyRequests?.receiveRequests?.items[0],
                                                      isConfirmed: true,
                                                  },
                                              ],
                                          },
                                      }
                                    : {}),
                                orderRequests: {
                                    items: invPresentRequests,
                                },
                            },
                            siteMeter: {
                                ...invRequest.site?.siteMeter,
                                companyPresentNum:
                                    invRequestArrangements?.filter((iArr) => iArr?.invRequestId == invRequest?.invRequestId)[0]?.localPresentNum ?? invRequest?.site?.siteMeter?.companyPresentNum,
                                presentArrangements: {
                                    items: invPresentArrangements,
                                },
                            },
                            isConfirmed: true,
                        },
                    }
                    return _targetInv
                } else {
                    const _targetInv: InvRequestType = {
                        ...invRequest,
                        workerIds: targetInv.workerIds,
                        workers: targetInv.workers as WorkerListType,
                        workerCount: targetInv.workerIds?.length ?? targetInv.workerCount,
                        isApplication: true,
                        isApproval: invRequest.isApplication == true && invRequest.isApproval == false && isEqual(invRequest.workerIds, targetInv?.workerIds) ? false : 'waiting',
                        //申請済みかつ拒否済みかつ変更なしの場合のみwaitingにはならない。それ以外はwaitingのはず
                        invRequestStatus: invRequest.isApplication == true && invRequest.isApproval == false && isEqual(invRequest.workerIds, targetInv?.workerIds) ? 'unauthorized' : 'waiting',
                    }
                    return _targetInv
                }
            } else {
                return invRequest
            }
        })

        _dateArrangementCacheData = {
            ..._dateArrangementCacheData,
            invRequests: {
                ..._dateArrangementCacheData?.invRequests,
                totalInvRequests: {
                    items: totalInvRequests as InvRequestType[],
                },
                orderInvRequests: {
                    //おそらく使ってはいないが念のため
                    items: orderInvRequests as InvRequestType[],
                },
            },
        }

        if (_dateArrangementCacheData?.arrangementSummary?.arrangedWorkersCount != undefined) {
            //手配数の更新
            _dateArrangementCacheData.arrangementSummary.arrangedWorkersCount = sum([
                ...(siteArrangements?.map((sArr) => sArr.siteArrangementData?.selfSide?.filter((side) => side?.targetArrangement?.arrangementId).length) ?? []),
                ...(invRequestArrangements?.map((iArr) => iArr.invRequestArrangementData?.selfSide?.filter((side) => side?.targetInvRequest?.invRequestId).length) ?? []),
                ...(siteArrangements?.map((sArr) => sum(sArr.siteArrangementData?.otherSide?.map((side) => side?.targetRequest?.requestCount ?? 0))) ?? []),
                ...(invRequestArrangements?.map((iArr) => sum(iArr.invRequestArrangementData?.otherSide?.map((side) => side?.targetRequest?.requestCount ?? 0))) ?? []),
            ])
        }
        const presentArrangements = flatten(
            siteArrangements?.map((sArr) =>
                flatten(
                    sArr.siteArrangementData?.selfSide?.map((self) => {
                        const _targetArrangement: ArrangementType = {
                            ...self.targetArrangement,
                            worker: self.worker,
                        }
                        return _targetArrangement
                    }),
                ),
            ),
        ).filter((data) => data != undefined)

        const presentRequests = flatten(
            siteArrangements?.map((sArr) =>
                flatten(
                    sArr.siteArrangementData?.otherSide?.map((other) => {
                        const _targetRequest: RequestType = {
                            ...other.targetRequest,
                            siteId: other.targetRequest?.siteId ?? sArr.siteId,
                            requestedCompany: other.requestedCompany,
                        }
                        return _targetRequest
                    }),
                ),
            ),
        ).filter((data) => data != undefined && (data.requestCount ?? 0) > 0)
        //手配情報を更新
        _dateArrangementCacheData = {
            ..._dateArrangementCacheData,
            sites: {
                ..._dateArrangementCacheData?.sites,
                totalSites: {
                    ..._dateArrangementCacheData?.sites?.totalSites,
                    items: uniqBy(
                        [
                            ...(_dateArrangementCacheData?.sites?.totalSites?.items?.map((site) => {
                                if (site.siteRelation == 'manager' || site.siteRelation == 'fake-company-manager') {
                                    const _site: SiteType = {
                                        ...site,
                                        siteMeter: {
                                            ...site.siteMeter,
                                            presentArrangements: {
                                                items: presentArrangements.filter((arr) => arr.siteId == site.siteId),
                                            },
                                            presentRequests: {
                                                items: presentRequests.filter((req) => req.siteId == site.siteId),
                                            },
                                        },
                                        isConfirmed: true,
                                    }
                                    return _site
                                } else {
                                    const _site: SiteType = {
                                        ...site,
                                        companyRequests: {
                                            receiveRequests: {
                                                ...site.companyRequests?.receiveRequests,
                                                items:
                                                    site.companyRequests?.receiveRequests?.items?.map((req) => {
                                                        const _request: RequestType = {
                                                            ...req,
                                                            isConfirmed: true,
                                                            requestMeter: {
                                                                ...req.requestMeter,
                                                                presentArrangements: {
                                                                    items: presentArrangements.filter((arr) => arr.siteId == site.siteId),
                                                                },
                                                                presentRequests: {
                                                                    items: presentRequests.filter((req) => req.siteId == site.siteId),
                                                                },
                                                                companyPresentNum:
                                                                    siteArrangements?.filter((sArr) => sArr.siteId == site.siteId)[0]?.localPresentNum ?? req.requestMeter?.companyPresentNum,
                                                            },
                                                        }
                                                        return _request
                                                    }) ?? [],
                                            },
                                        },
                                    }
                                    return _site
                                }
                            }) ?? []),
                            ...(dateArrangementCacheData.success?.sites?.totalSites?.items ?? []),
                        ],
                        'siteId',
                    ),
                },
            },
        }
        //メーター更新
        _dateArrangementCacheData?.sites?.totalSites?.items?.map((site) =>
            siteArrangements?.map((sArr) => {
                return sArr.siteId == site.siteId && site.siteMeter?.companyPresentNum ? (site.siteMeter.companyPresentNum = sArr?.localPresentNum) : null
            }),
        )
        const cachedResult = await updateCachedData({ key: cacheKey, value: _dateArrangementCacheData ?? {} })
        if (cachedResult.error) {
            throw {
                error: cachedResult.error,
                errorCode: cachedResult.errorCode,
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * キャッシュの日付の手配情報を更新する
 * @param diffCount 手配の増減差分
 * @author kamiya
 */
export type UpdateDateArrangementsFromSiteCacheParam = {
    siteArrangement?: SiteArrangementDataType
    date?: CustomDate
    myCompanyId?: string
    accountId?: string
    updatedAt?: number
    diffCount?: number
    siteId?: string
    localPresentNum?: number
}

// /**
//  * キャッシュの日付の手配情報を更新する
//  * @author kamiya
//  * @param params UpdateDateArrangementsFromSiteCacheParam
//  * @returns boolean
//  */
// export const updateDateArrangementsFromSiteCache = async (params: UpdateDateArrangementsFromSiteCacheParam): Promise<CustomResponse<boolean>> => {
//     try {
//         const { date, siteArrangement, myCompanyId, accountId, updatedAt, diffCount, siteId, localPresentNum } = params
//         const cacheKey = genKeyName({
//             screenName: 'DateArrangements',
//             accountId: accountId ?? '',
//             companyId: myCompanyId ?? '',
//             /** "/" はKVSのキーに使えない文字のため "-" に置き換え */
//             date: date ? dayBaseTextWithoutDate(date).replace(/\//g, '-') : '',
//         })
//         const dateArrangementCacheData = await getCachedData<DateDataType>(cacheKey)
//         let _dateArrangementCacheData = cloneDeep(dateArrangementCacheData.success)
//         if (_dateArrangementCacheData?.updatedAt != undefined) {
//             _dateArrangementCacheData.updatedAt = updatedAt ?? Number(new Date())
//         }

//         if (_dateArrangementCacheData?.arrangementSummary?.arrangedWorkersCount != undefined) {
//             //手配数の更新
//             const keepArrangedCount = cloneDeep(_dateArrangementCacheData?.arrangementSummary?.arrangedWorkersCount)
//             _dateArrangementCacheData.arrangementSummary.arrangedWorkersCount = keepArrangedCount + (diffCount ?? 0)
//         }
//         const presentArrangement = siteArrangement?.selfSide?.map((self) => self.targetArrangement as ArrangementType)
//         const presentRequest = siteArrangement?.otherSide?.map((self) => self.targetRequest as ArrangementType)

//         //手配情報を更新
//         _dateArrangementCacheData?.sites?.totalSites?.items?.map((site) => {
//             if (site.siteId == siteId) {
//                 const _site = {
//                     ...site,
//                     siteMeter: {
//                         ...site.siteMeter,
//                         presentArrangements: {
//                             items: presentArrangement,
//                         },
//                         presentRequests: {
//                             items: presentRequest,
//                         },
//                     },
//                 }
//                 return _site
//             } else {
//                 return site
//             }
//         })
//         //メーター更新
//         _dateArrangementCacheData?.sites?.totalSites?.items?.map((site) => {
//             return siteId == site.siteId && site.siteMeter?.companyPresentNum ? (site.siteMeter.companyPresentNum = localPresentNum) : null
//         })
//         const cachedResult = await updateCachedData({ key: cacheKey, value: _dateArrangementCacheData ?? {} })
//         if (cachedResult.error) {
//             throw {
//                 error: cachedResult.error,
//                 errorCode: cachedResult.errorCode,
//             }
//         }
//         return Promise.resolve({
//             success: true,
//         })
//     } catch (error) {
//         return getErrorMessage(error)
//     }
// }
