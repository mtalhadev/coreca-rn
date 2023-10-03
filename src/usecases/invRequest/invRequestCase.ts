import { InvRequestCLType, InvRequestType, toInvRequestCLType } from '../../models/invRequest/InvRequestType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { _getAccountOverManagerOfTargetCompany } from '../../services/account/AccountService'
import { _getCompany } from '../../services/company/CompanyService'
import {
    DeleteInvRequestParam,
    DeleteInvRequestResponse,
    _createInvRequest,
    _deleteInvRequest,
    _getInvRequest,
    _getInvRequestListByIds,
    _getInvRequestListOfTargetInvReservation,
    _getInvRequestListOfTargetInvReservationAndMonth,
    _updateInvRequest,
} from '../../services/invRequest/InvRequestService'
import { _createNotification } from '../../services/notification/NotificationService'
import { _createSite, _deleteSite, _getSiteListOfTargetConstruction, _getSiteOfTargetFakeCompanyInvRequestId, _updateSite } from '../../services/site/SiteService'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { getSiteMeterOption } from '../../models/site/SiteMeterType'
import { ID } from '../../models/_others/ID'
import { TotalSeconds } from '../../models/_others/TotalSeconds'
import { getUuidv4 } from '../../utils/Utils'
import {
    combineTimeAndDay,
    CustomDate,
    dayBaseTextWithoutDate,
    getDailyEndTime,
    getDailyStartTime,
    getMonthlyFinalDay,
    getMonthlyFirstDay,
    getYYYYMMDDTotalSeconds,
    nextDay,
    toCustomDateFromTotalSeconds,
} from '../../models/_others/CustomDate'
import { _createRequest, _updateRequest } from '../../services/request/RequestService'
import { _getInvReservation, _updateInvReservation } from '../../services/invReservation/InvReservationService'
import { _updateProject } from '../../services/project/ProjectService'
import { InvReservationCLType } from '../../models/invReservation/InvReservation'
import { newDate, WeekOfDay } from '../../utils/ext/Date.extensions'
import { checkEmptyDay } from '../construction/MyConstructionCase'
import { DEFAULT_SITE_END_TIME, DEFAULT_SITE_START_TIME } from '../../utils/Constants'
import { RequestType } from '../../models/request/Request'

/**
 * @requires
 * - invRequestId
 * - myCompanyId 申請先会社との関係性を取得するため
 */
export type GetInvRequestDetailParam = {
    invRequestId?: string
    myCompanyId?: string
}

export type GetInvRequestDetailResponse = InvRequestCLType
/**
 * @summary 常用で送る、受ける情報の取得
 * @objective 常用で送る、受けるの詳細と編集のため
 * @error
 * @author Kamiya
 * @param params - {@link GetInvRequestDetailParam}
 * @returns - {@link GetInvRequestDetailResponse}
 */
export const getInvRequestDetail = async (props: GetInvRequestDetailParam): Promise<CustomResponse<GetInvRequestDetailResponse>> => {
    try {
        const { invRequestId, myCompanyId } = props
        const result = await _getInvRequest({
            invRequestId: invRequestId ?? 'no-id',
            options: {
                invReservation: {
                    construction: true,
                },
                targetCompany: {
                    lastDeal: {
                        params: {
                            myCompanyId,
                        },
                    },
                    companyPartnership: {
                        params: {
                            companyId: myCompanyId,
                        },
                    },
                },
                myCompany: {
                    lastDeal: {
                        params: {
                            myCompanyId,
                        },
                    },
                    companyPartnership: {
                        params: {
                            companyId: myCompanyId,
                        },
                    },
                },
                site: {
                    construction: true,
                    ...getSiteMeterOption(myCompanyId ?? 'no-id'),
                    siteRelation: {
                        params: {
                            companyId: myCompanyId ?? 'no-id',
                        },
                    },
                    siteNameData: true,
                },
            },
        })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: toInvRequestCLType(result.success),
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @summary 常用で送る、受ける情報の取得
 * @requires
 * - invRequestId
 * @param params - {invRequestId?: string}
 * @returns - {@link InvRequestType}
 * @author kamiya
 */
export const getInvRequest = async (props: {invRequestId?: string}): Promise<CustomResponse<InvRequestType>> => {
    try {
        const { invRequestId } = props
        const result = await _getInvRequest({
            invRequestId: invRequestId ?? 'no-id',
            options: {
                targetCompany: true,
            },
        })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: (result.success),
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type WriteInvRequestParam = {
    invRequestId?: string
    invRequestIds?: string[]
    workerCount?: number
    isFakeCompany?: boolean
    myCompanyId?: ID
}
/**
 * 常用申請の編集。
 * まとめて編集する場合、個別に編集されていた場合でも更新される仕様としている。個別編集なのか、初期設定なのか区別がつかないため。
 * 申請済みの申請を除く
 * @param params {@link WriteInvRequestParam}
 * @returns
 */
export const writeInvRequest = async (params: WriteInvRequestParam): Promise<CustomResponse<string>> => {
    try {
        const { invRequestId, invRequestIds, workerCount, isFakeCompany, myCompanyId } = params
        if (isFakeCompany && myCompanyId == undefined) {
            throw {
                error: '会社IDがありません',
                errorCode: 'WRITE_INV_REQUEST_ERROR',
            }
        }
        if (invRequestIds) {
            const getResults = await _getInvRequestListByIds({ invRequestIds, options: { targetCompany: true } })
            if (getResults.error) {
                throw {
                    error: getResults.error,
                    errorCode: getResults.errorCode,
                }
            }
            const updateInvRequestIds = getResults.success?.items?.filter((inv) => inv.isApplication == false || inv.targetCompany?.isFake).map((inv) => inv.invRequestId) ?? []
            const results = await Promise.all(
                updateInvRequestIds?.map((id) =>
                    _updateInvRequest({
                        invRequest: {
                            invRequestId: id,
                            workerCount,
                        },
                    }),
                ) ?? [],
            )
            results.forEach((result) => {
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            })
            if (isFakeCompany) {
                const getSiteResults = await Promise.all(
                    updateInvRequestIds?.map((id) =>
                        _getSiteOfTargetFakeCompanyInvRequestId({
                            fakeCompanyInvRequestId: id ?? 'no-id',
                            options: {
                                companyRequests: {
                                    params: {
                                        companyId: myCompanyId ?? 'no-id',
                                        types: ['receive'],
                                    },
                                },
                            },
                        }),
                    ) ?? [],
                )
                getSiteResults.forEach((result) => {
                    if (result.error) {
                        throw {
                            error: result.error,
                            errorCode: result.errorCode,
                        }
                    }
                })
                const sites = getSiteResults.map((result) => result.success).filter((site) => site != undefined)
                const updateSiteResults = await Promise.all(
                    sites?.map((site) =>
                        _updateSite({
                            ...site,
                            requiredNum: workerCount,
                        }),
                    ) ?? [],
                )
                updateSiteResults.forEach((result) => {
                    if (result.error) {
                        throw { error: result.error }
                    }
                })
                const requests = sites
                    .map((site) => site?.companyRequests?.totalRequests?.items?.filter((req) => req.requestedCompanyId == myCompanyId)[0])
                    .filter((data) => data != undefined) as RequestType[]
                const updateRequestResults = await Promise.all(
                    requests?.map((req) =>
                        _updateRequest({
                            request: {
                                ...req,
                                requestCount: workerCount,
                            },
                        }),
                    ) ?? [],
                )
                updateRequestResults.forEach((result) => {
                    if (result.error) {
                        throw {
                            error: result.error,
                            errorCode: result.errorCode,
                        }
                    }
                })
            }
        } else {
            const result = await _updateInvRequest({
                invRequest: {
                    invRequestId,
                    workerCount,
                    isApplication: isFakeCompany ? true : false,
                    isApproval: isFakeCompany ? true : 'waiting',
                },
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            if (isFakeCompany) {
                const getSiteResult = await _getSiteOfTargetFakeCompanyInvRequestId({
                    fakeCompanyInvRequestId: invRequestId ?? 'no-id',
                    options: {
                        companyRequests: {
                            params: {
                                companyId: myCompanyId ?? 'no-id',
                                types: ['receive'],
                            },
                        },
                    },
                })
                if (getSiteResult.error) {
                    throw {
                        error: getSiteResult.error,
                        errorCode: getSiteResult.errorCode,
                    }
                }
                if (getSiteResult.success?.requiredNum != workerCount) {
                    const updateSiteResult = await _updateSite({
                        ...getSiteResult.success,
                        requiredNum: workerCount,
                    })
                    if (updateSiteResult.error) {
                        throw {
                            error: updateSiteResult.error,
                        }
                    }
                }
                const targetRequest = getSiteResult.success?.companyRequests?.totalRequests?.items?.filter((req) => req.requestedCompanyId == myCompanyId).map((req) => req)[0]
                if (targetRequest?.requestCount != workerCount) {
                    const updateRequestResult = await _updateRequest({
                        request: {
                            ...targetRequest,
                            requestCount: workerCount,
                        },
                    })
                    if (updateRequestResult.error) {
                        throw {
                            error: updateRequestResult.error,
                            errorCode: updateRequestResult.errorCode,
                        }
                    }
                }
            }
        }
        return Promise.resolve({
            success: 'success',
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * invRequestが削除される。invRequestに紐づいた仮会社施工の現場や依頼はサーバー側でinvRequestの削除をトリガーに削除される
 * @param params invRequestId - 削除したいinvRequestId
 * @returns
 */
export const deleteInvRequest = async (params: DeleteInvRequestParam): Promise<CustomResponse<DeleteInvRequestResponse>> => {
    try {
        const { invRequestId } = params
        if (invRequestId == undefined) {
            throw {
                error: '常用申請IDがありません。',
            } as CustomResponse
        }

        const result = await _deleteInvRequest({ invRequestId })
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
export type ApproveInvRequestParam = {
    invRequestId: string
    isApproval: boolean
}
export type ApproveInvRequestResponse = boolean
/**
 * @summary 常用申請を承認・拒否する
 * @errors
 * GET_INVREQUEST_ERROR - 常用申請IDまたはisApprovalがなかった場合
 * APPLICATION_ERROR - 常用申請が取り消されていた場合
 * @param params - {@link ApproveInvRequestParam}
 * @returns  - {@link ApproveInvRequestResponse}
 */
export const approveInvRequest = async (params: ApproveInvRequestParam): Promise<CustomResponse<ApproveInvRequestResponse>> => {
    try {
        const { invRequestId, isApproval } = params
        if (invRequestId == undefined || isApproval == undefined) {
            throw {
                error: '常用申請情報がありません。',
                errorCode: 'GET_INVREQUEST_ERROR',
            } as CustomResponse
        }
        const getResult = await _getInvRequest({
            invRequestId,
        })
        if (getResult.error) {
            throw {
                error: getResult.error,
                errorCode: getResult.errorCode,
            }
        }
        if (getResult.success?.isApplication == undefined || getResult.success?.isApplication == false) {
            throw {
                error: '常用申請が取り消されています',
                errorCode: 'APPLICATION_ERROR',
            }
        }
        const result = await _updateInvRequest({
            invRequest: {
                invRequestId,
                isApproval,
            },
        })
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

/**
 * 常用申請元と常用申請先の管理者に常用申請承認通知
 * @param invRequest
 * @param isApproval - 常用申請の承認・拒否
 * @returns なし
 */
export const makeInvRequestApproveNotifications = async (invRequest?: InvRequestType | InvRequestCLType, isApproval?: boolean): Promise<CustomResponse> => {
    try {
        if (invRequest == undefined) {
            return {
                success: false,
            }
        }
        const myCompanyResult = await _getCompany({ companyId: invRequest.myCompanyId ?? 'no-id' })
        const targetCompanyResult = await _getCompany({ companyId: invRequest.targetCompanyId ?? 'no-id' })

        let description = `常用が${isApproval ? '承認' : '非承認'}されました。¥n¥n`
        let title = `常用が${isApproval ? '承認' : '非承認'}されました。`

        const myCompanyAccountResult = await _getAccountOverManagerOfTargetCompany({ companyId: myCompanyResult.success?.companyId ?? 'no-id' })
        const targetCompanyAccountResult = await _getAccountOverManagerOfTargetCompany({ companyId: targetCompanyResult.success?.companyId ?? 'no-id' })

        myCompanyAccountResult.success?.forEach((account) => {
            _createNotification({
                accountId: account.accountId,
                title: title,
                description: description,
                transitionParams: {
                    screenName: 'InvRequestDetail',
                    param: invRequest.invRequestId as string,
                    param2: 'order',
                },
                isAlreadyRead: false,
                side: 'admin',
                isNotificationCreated: false,
                contentsType: 'others',
            })
        })
        targetCompanyAccountResult.success?.forEach((account) => {
            _createNotification({
                accountId: account.accountId,
                title: title,
                description: description,
                transitionParams: {
                    screenName: 'InvRequestDetail',
                    param: invRequest.invRequestId as string,
                    param2: 'receive',
                },
                isAlreadyRead: false,
                side: 'admin',
                isNotificationCreated: false,
                contentsType: 'others',
            })
        })
        return {
            success: true,
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}
type makeInvRequestEditNotificationsParam = {
    invReservation?: InvRequestCLType
    invRequest?: InvRequestCLType
    workerCount?: number
}
/**
 * 常用申請元と常用申請済みならば常用申請先の管理者に変更通知
 * {@link makeInvRequestEditNotificationsParam}
 * @returns boolean
 */
export const makeInvRequestEditNotifications = async (params: makeInvRequestEditNotificationsParam): Promise<CustomResponse> => {
    try {
        const { invRequest, invReservation, workerCount } = params
        if (invRequest == undefined && invReservation == undefined) {
            return {
                success: false,
            }
        }
        if (invRequest) {
            const myCompanyResult = await _getCompany({ companyId: invRequest.myCompanyId ?? 'no-id' })
            let description = `常用で送る人数¥n`
            description += `【変更前】 ${invRequest.workerCount}名¥n`
            description += `【変更後】 ${workerCount}名¥n`
            let title = `常用が編集されました。`
            const myCompanyAccountResult = await _getAccountOverManagerOfTargetCompany({ companyId: myCompanyResult.success?.companyId ?? 'no-id' })
            myCompanyAccountResult.success?.forEach((account) => {
                _createNotification({
                    accountId: account.accountId,
                    title: title,
                    description: description,
                    transitionParams: {
                        screenName: 'InvRequestDetail',
                        param: invRequest.invRequestId as string,
                        param2: 'order',
                    },
                    isAlreadyRead: false,
                    side: 'admin',
                    isNotificationCreated: false,
                    contentsType: 'transaction',
                })
            })
        } else if (invReservation) {
            const myCompanyResult = await _getCompany({ companyId: invReservation.myCompanyId ?? 'no-id' })
            const description = `常用で送る人数 ${workerCount}名¥n`
            const title = `常用がまとめて編集されました。`
            const myCompanyAccountResult = await _getAccountOverManagerOfTargetCompany({ companyId: myCompanyResult.success?.companyId ?? 'no-id' })
            myCompanyAccountResult.success?.forEach((account) => {
                _createNotification({
                    accountId: account.accountId,
                    title: title,
                    description: description,
                    transitionParams: {
                        screenName: 'InvReservationDetailRouter',
                        param: invReservation.invReservationId as string,
                        param2: 'order',
                    },
                    isAlreadyRead: false,
                    side: 'admin',
                    isNotificationCreated: false,
                    contentsType: 'transaction',
                })
            })
        }
        return {
            success: true,
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * invRequestId
 * invReservationId
 * targetCompanyId
 * myCompanyId
 * date
 * constructionId
 * @partial
 * siteId
 */
export type CreateInvRequestToFakeCompanyParam = {
    invRequestId?: ID
    invReservationId?: ID
    targetCompanyId?: ID
    myCompanyId?: ID
    date?: TotalSeconds
    constructionId?: ID
    siteId?: ID
}

/**
 * 仮会社へ常用で送る場合にInvRequestとsiteとrequestを作成する。
 * 既にある仮会社施工工事に追加する。
 * InvReservationの期間外に作成した場合は、期間を延ばす。
 * @error CREATE_INV_REQUEST_ERROR - パラメータの不足
 * @param params {@link CreateInvRequestToFakeCompanyParam}
 * @returns boolean
 */
export const createInvRequestToFakeCompany = async (params: CreateInvRequestToFakeCompanyParam): Promise<CustomResponse> => {
    try {
        const { invRequestId, invReservationId, targetCompanyId, myCompanyId, date, constructionId, siteId } = params
        if (invRequestId == undefined || invReservationId == undefined || targetCompanyId == undefined || myCompanyId == undefined || date == undefined) {
            throw {
                error: '情報が足りません',
                errorCode: 'CREATE_INV_REQUEST_ERROR',
            }
        }
        /**
         * InvReservationの期間外の場合に期間を延ばす
         */
        const invReservationResult = await _getInvReservation({
            invReservationId,
            options: {
                project: true,
                construction: true,
                monthlyInvRequests: {
                    params: {
                        month: getMonthlyFirstDay(toCustomDateFromTotalSeconds(date)).totalSeconds,
                        endOfMonth: getMonthlyFinalDay(toCustomDateFromTotalSeconds(date)).totalSeconds,
                    },
                },
            },
        })

        if (invReservationResult.error) {
            throw {
                error: invReservationResult.error,
                errorCode: invReservationResult.errorCode,
            }
        }
        const extraDatesSet = new Set(invReservationResult.success?.extraDates?.map((date) => getDailyStartTime(toCustomDateFromTotalSeconds(date)).totalSeconds))
        if (invReservationResult.success?.startDate && invReservationResult.success?.startDate > date && !extraDatesSet.has(getDailyStartTime(toCustomDateFromTotalSeconds(date)).totalSeconds)) {
            const updateResult = await _updateInvReservation({
                invReservationId,
                startDate: getDailyStartTime(toCustomDateFromTotalSeconds(date)).totalSeconds,
            })
            if (updateResult.error) {
                throw {
                    error: updateResult.error,
                    errorCode: updateResult.errorCode,
                }
            }
            const updateProjectResult = await _updateProject({
                projectId: invReservationResult.success?.project?.projectId,
                startDate: getDailyStartTime(toCustomDateFromTotalSeconds(date)).totalSeconds,
            })
            if (updateProjectResult.error) {
                throw {
                    error: updateProjectResult.error,
                    errorCode: updateProjectResult.errorCode,
                }
            }
        }
        if (invReservationResult.success?.endDate && !extraDatesSet.has(getDailyStartTime(toCustomDateFromTotalSeconds(date)).totalSeconds) && invReservationResult.success?.endDate < date) {
            const updateResult = await _updateInvReservation({
                invReservationId,
                endDate: getDailyEndTime(toCustomDateFromTotalSeconds(date)).totalSeconds,
            })
            if (updateResult.error) {
                throw {
                    error: updateResult.error,
                    errorCode: updateResult.errorCode,
                }
            }
            const updateProjectResult = await _updateProject({
                projectId: invReservationResult.success?.project?.projectId,
                endDate: getDailyEndTime(toCustomDateFromTotalSeconds(date)).totalSeconds,
            })
            if (updateProjectResult.error) {
                throw {
                    error: updateProjectResult.error,
                    errorCode: updateProjectResult.errorCode,
                }
            }
        }
        const existDates =
            (invReservationResult.success?.monthlyInvRequests?.items
                ?.map((inv) => inv.date && dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(inv.date)))
                .filter((data) => data != undefined) as string[]) ?? []
        const dateString = dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(date))
        if (existDates.includes(dateString)) {
            throw {
                error: '既に現場が存在しています',
                errorCode: 'CREATE_FAKE_SITE_ERROR',
            }
        }
        const createInvRequestResult = await _createInvRequest({
            invRequest: {
                invRequestId,
                invReservationId,
                targetCompanyId,
                myCompanyId,
                date: date ? getDailyStartTime(toCustomDateFromTotalSeconds(date)).totalSeconds : undefined,
                isApplication: true,
                isApproval: true,
            },
        })
        if (createInvRequestResult.error) {
            throw {
                error: createInvRequestResult.error,
                errorCode: createInvRequestResult.errorCode,
            }
        }
        const _siteId = siteId ?? getUuidv4()
        const siteMeetingTime: number | undefined = invReservationResult.success?.construction?.siteMeetingTime
        const siteStartTime: number = invReservationResult.success?.construction?.siteStartTime ?? DEFAULT_SITE_START_TIME.totalSeconds
        const siteEndTime: number = invReservationResult.success?.construction?.siteEndTime ?? DEFAULT_SITE_END_TIME.totalSeconds
        const meetingDate = siteMeetingTime ? combineTimeAndDay(toCustomDateFromTotalSeconds(siteMeetingTime), toCustomDateFromTotalSeconds(date))?.totalSeconds : undefined
        const siteResult = await _createSite({
            siteId: _siteId,
            constructionId,
            startDate:
                combineTimeAndDay(toCustomDateFromTotalSeconds(siteStartTime), nextDay(toCustomDateFromTotalSeconds(date), invReservationResult.success?.construction?.siteStartTimeIsNextDay ? 1 : 0))
                    ?.totalSeconds ?? DEFAULT_SITE_START_TIME.totalSeconds,
            endDate:
                combineTimeAndDay(toCustomDateFromTotalSeconds(siteEndTime), nextDay(toCustomDateFromTotalSeconds(date), invReservationResult.success?.construction?.siteEndTimeIsNextDay ? 1 : 0))
                    ?.totalSeconds ?? DEFAULT_SITE_END_TIME.totalSeconds,
            meetingDate,
            fakeCompanyInvRequestId: invRequestId,
            requiredNum: invReservationResult.success?.construction?.siteRequiredNum,
            address: invReservationResult.success?.construction?.siteAddress,
            belongings: invReservationResult.success?.construction?.siteBelongings,
            remarks: invReservationResult.success?.construction?.siteRemarks,
            siteDate: getYYYYMMDDTotalSeconds(toCustomDateFromTotalSeconds(date)),
        })
        if (siteResult.error) {
            await _deleteInvRequest({ invRequestId })
            throw {
                error: siteResult.error,
                errorCode: siteResult.errorCode,
            }
        }
        const requestResult = await _createRequest({
            request: {
                companyId: targetCompanyId,
                requestedCompanyId: myCompanyId,
                siteId: _siteId,
                requestCount: 0,
                isFakeCompanyRequest: true,
                isApplication: true,
                isApproval: true,
            },
        })
        if (requestResult.error) {
            await _deleteInvRequest({ invRequestId })
            await _deleteSite(_siteId)
            throw {
                error: requestResult.error,
                errorCode: requestResult.errorCode,
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
 * isToFakeCompany - 仮会社へ送る場合true
 * invRequest - 追加するinvRequest
 * invReservation - 仮会社へ送る場合、工事情報なども必要なので必須
 */
export type AddInvRequestParams = {
    isToFakeCompany?: boolean
    invRequest?: InvRequestCLType
    invReservation?: InvReservationCLType
}
/**
 * invRequest作成。仮会社へ送る場合は、現場と依頼も作成する。
 * @param params {@link - AddInvRequestParams}
 * @author kamiya
 * @returns boolean
 */
export const addInvRequest = async (params: AddInvRequestParams): Promise<CustomResponse> => {
    try {
        const { isToFakeCompany, invRequest, invReservation } = params
        if (invRequest?.date == undefined) {
            throw {
                error: '日付情報がありません',
                errorCode: 'ADD_INV_REQUEST_ERROR',
            }
        }
        if (invRequest?.invReservationId == undefined) {
            throw {
                error: '常用で送る予定ID情報がありません',
                errorCode: 'ADD_INV_REQUEST_ERROR',
            }
        }
        const existInvRequestsResult = await _getInvRequestListOfTargetInvReservationAndMonth({
            invReservationId: invRequest.invReservationId,
            month: getMonthlyFirstDay(invRequest.date).totalSeconds,
            endOfMonth: getMonthlyFinalDay(invRequest.date).totalSeconds,
        })
        if (existInvRequestsResult.error) {
            throw {
                error: existInvRequestsResult.error,
                errorCode: existInvRequestsResult.errorCode,
            }
        }
        const existDates = existInvRequestsResult.success?.items
            ?.map((inv) => (inv.date ? dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(inv.date)) : undefined))
            .filter((data) => data != undefined) as string[]
        const existDatesSet = new Set(existDates)
        if (existDatesSet.has(dayBaseTextWithoutDate(invRequest.date))) {
            throw {
                error: '既に作成済みです',
                errorCode: 'ADD_INV_REQUEST_ERROR',
            }
        }
        if (isToFakeCompany) {
            const result = await createInvRequestToFakeCompany({
                invRequestId: invRequest?.invRequestId,
                invReservationId: invRequest?.invReservationId,
                targetCompanyId: invRequest?.targetCompanyId,
                myCompanyId: invRequest?.myCompanyId,
                date: getDailyStartTime(invRequest?.date).totalSeconds,
                constructionId: invReservation?.construction?.constructionId,
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        } else {
            if (invRequest?.invReservationId == undefined) {
                throw {
                    error: 'invReservationIdがありません',
                    errorCode: 'ADD_INV_REQUEST_ERROR',
                }
            }
            /**
             * InvReservationの期間外の場合に期間を延ばす
             */
            const invReservationResult = await _getInvReservation({
                invReservationId: invRequest?.invReservationId,
                options: {
                    monthlyInvRequests: {
                        params: {
                            month: getMonthlyFirstDay(toCustomDateFromTotalSeconds(invRequest.date.totalSeconds)).totalSeconds,
                            endOfMonth: getMonthlyFinalDay(toCustomDateFromTotalSeconds(invRequest.date.totalSeconds)).totalSeconds,
                        },
                    },
                },
            })

            if (invReservationResult.error) {
                throw {
                    error: invReservationResult.error,
                    errorCode: invReservationResult.errorCode,
                }
            }
            const extraDatesSet = new Set(invReservationResult.success?.extraDates?.map((date) => getDailyStartTime(toCustomDateFromTotalSeconds(date)).totalSeconds))
            if (
                invReservationResult.success?.startDate &&
                !extraDatesSet.has(getDailyStartTime(invRequest.date).totalSeconds) &&
                invReservationResult.success?.startDate > invRequest.date.totalSeconds
            ) {
                const updateResult = await _updateInvReservation({
                    invReservationId: invRequest?.invReservationId,
                    startDate: getDailyStartTime(toCustomDateFromTotalSeconds(invRequest.date.totalSeconds)).totalSeconds,
                })
                if (updateResult.error) {
                    throw {
                        error: updateResult.error,
                        errorCode: updateResult.errorCode,
                    }
                }
            }
            if (invReservationResult.success?.endDate && !extraDatesSet.has(getDailyStartTime(invRequest.date).totalSeconds) && invReservationResult.success?.endDate < invRequest.date.totalSeconds) {
                const updateResult = await _updateInvReservation({
                    invReservationId: invRequest?.invReservationId,
                    endDate: getDailyEndTime(toCustomDateFromTotalSeconds(invRequest.date.totalSeconds)).totalSeconds,
                })
                if (updateResult.error) {
                    throw {
                        error: updateResult.error,
                        errorCode: updateResult.errorCode,
                    }
                }
            }
            const result = await _createInvRequest({
                invRequest: {
                    invRequestId: invRequest.invRequestId,
                    invReservationId: invRequest.invReservationId,
                    targetCompanyId: invRequest?.targetCompanyId,
                    myCompanyId: invRequest.myCompanyId,
                    isApproval: invRequest?.isApproval,
                    isApplication: invRequest?.isApplication,
                    workerIds: invRequest?.workerIds,
                    date: invRequest?.date.totalSeconds,
                    workerCount: invRequest?.workerCount,
                    updateWorkerId: invRequest?.updateWorkerId,
                    attendanceIds: invRequest?.attendanceIds,
                    relatedInvRequestIds: invRequest?.relatedInvRequestIds,
                },
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
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
 * invReservation - 仮会社へ送る場合は、invReservation.constructionが必須
 */
export type writeInvRequestsForSpanParams = {
    invReservation?: InvReservationCLType
    startDate?: CustomDate
    endDate?: CustomDate
    offDaysOfWeek?: WeekOfDay[]
    otherOffDays?: CustomDate[]
    holidays: { [x: string]: string }
    workerCount?: number
}
export const writeInvRequestsForSpan = async (params: writeInvRequestsForSpanParams): Promise<CustomResponse<number>> => {
    try {
        const { invReservation, startDate, endDate, offDaysOfWeek, otherOffDays, holidays, workerCount } = params
        if (startDate == undefined) {
            throw {
                error: '追加する最初の日が足りません。',
            } as CustomResponse
        }
        if (endDate == undefined) {
            throw {
                error: '追加する最後の日が足りません。',
            } as CustomResponse
        }
        if (invReservation?.invReservationId == undefined) {
            throw {
                error: 'invReservationIdがありません。',
                errorCode: 'WRITE_INV_RESERVATION_FOR_SPAN',
            } as CustomResponse
        }

        const allInvRequestsResult = await _getInvRequestListOfTargetInvReservation({ invReservationId: invReservation.invReservationId })
        if (allInvRequestsResult.error) {
            throw {
                error: '既存の現場取得に失敗しました。',
            } as CustomResponse
        }

        const allInvRequestDays: CustomDate[] = []
        allInvRequestsResult.success?.items?.forEach((inv: InvRequestType) => {
            if (inv.date) allInvRequestDays.push(getDailyStartTime(toCustomDateFromTotalSeconds(inv.date)) as CustomDate)
        })

        //00:00.00 にする
        let workDate: CustomDate = newDate({ year: startDate.year, month: startDate.month, day: startDate.day, hour: 0, minute: 0, second: 0 }).toCustomDate()
        let createCount = 0
        for (;;) {
            if (workDate.totalSeconds > endDate.totalSeconds) {
                break
            }

            const checkEmptyResult = await checkEmptyDay({ offDaysOfWeek, otherOffDays, targetDay: workDate, allSiteDays: allInvRequestDays, holidays })
            if (checkEmptyResult.error) {
                throw {
                    error: '現場を設定可能な日の取得に失敗しました。',
                } as CustomResponse
            }

            if (checkEmptyResult.success == false) {
                workDate = nextDay(workDate, 1)
                continue
            }

            const newInvRequest: InvRequestType = {
                invRequestId: getUuidv4(),
                invReservationId: invReservation.invReservationId,
                targetCompanyId: invReservation?.targetCompanyId,
                myCompanyId: invReservation.myCompanyId,
                isApproval: invReservation?.targetCompany?.isFake ? true : 'waiting',
                isApplication: invReservation?.targetCompany?.isFake ? true : false,
                workerIds: [],
                date: workDate.totalSeconds,
                workerCount: workerCount,
                attendanceIds: [],
                relatedInvRequestIds: [],
            }
            const result = await addInvRequest({
                isToFakeCompany: invReservation?.targetCompany?.isFake,
                invRequest: toInvRequestCLType(newInvRequest),
                invReservation: invReservation,
            })

            if (result.error) {
                throw {
                    error: '常用の作成に失敗しました。',
                } as CustomResponse
            }
            createCount += 1
            workDate = nextDay(workDate, 1)
        }

        return Promise.resolve({
            success: createCount,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
