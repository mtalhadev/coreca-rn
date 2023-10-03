import uniqBy from 'lodash/uniqBy'
import cloneDeep from 'lodash/cloneDeep'
import min from 'lodash/min'
import max from 'lodash/max'
import uniq from 'lodash/uniq'
import sum from 'lodash/sum'
import { SiteType } from '../../models/site/Site'
import {
    _getArrangementOfTargetWorkerAndSite,
    _updateArrangement,
    _getArrangement,
    _getArrangementListByIds,
    _getLocalArrangement,
    _writeLocalSiteArrangement,
    _deleteLocalSiteArrangement,
    _writeLocalSiteArrangements,
    _getLocalArrangements,
    _deleteLocalSiteArrangements,
} from '../../services/arrangement/ArrangementService'
import { _getCompany, _getCompanyListByIds } from '../../services/company/CompanyService'
import { _getConstruction } from '../../services/construction/ConstructionService'
import { _getSite, _getSiteMeterOfTargetSite, _getSiteNameData, _getSiteOfTargetFakeCompanyInvRequestId, _getSiteRelationType, _updateSite } from '../../services/site/SiteService'
import { _createWorker, _getArrangeableWorkersOfTargetSiteAndCompany, _getWorker, _getWorkerListOfTargetCompany, _updateWorker } from '../../services/worker/WorkerService'
import { CustomDate, dayBaseText, getDailyStartTime, newCustomDate, timeBaseText, timeText, toCustomDateFromTotalSeconds } from '../../models/_others/CustomDate'
import { getUuidv4 } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _deleteRequest, _getRequest, _getRequestMeterOfTargetRequest, _getRequestOfTargetSiteAndCompanies, _updateRequest } from '../../services/request/RequestService'
import { LocalSiteArrangementDataType, SiteArrangementCompanyType, SiteArrangementDataType, SiteArrangementWorkerType } from '../../models/arrangement/SiteArrangementDataType'
import { RequestType } from '../../models/request/Request'
import { _createAttendance } from '../../services/attendance/AttendanceService'
import { SiteRelationType } from '../../models/site/SiteRelationType'
import { WorkerType } from '../../models/worker/Worker'
import { ReservationType } from '../../models/reservation/Reservation'
import { _createReservation, _getReservation } from '../../services/reservation/ReservationService'
import { _addInsideWorkersArrangement, _addOutsideWorkerRequest, _deleteInsideWorkerArrangement, _deleteOutsideWorkerRequest } from '../../services/site/SiteArrangementUpdateService'
import { SiteMeterType } from '../../models/site/SiteMeterType'
import { RequestMeterType } from '../../models/request/RequestMeterType'
import { _getRandomIds } from '../../services/_others/UtilsService'
import { AccountType } from '../../models/account/Account'
import { ArrangementType } from '../../models/arrangement/Arrangement'
import { _getAccountOfTargetWorker, _getAccountOverManagerOfTargetCompany } from '../../services/account/AccountService'
import { _createNotification } from '../../services/notification/NotificationService'
import { InvRequestType } from '../../models/invRequest/InvRequestType'
import { _getInvRequest } from '../../services/invRequest/InvRequestService'
import { _getInvRequestArrangementData } from '../../services/invRequest/InvRequestArrangement'
import { _getInvReservation } from '../../services/invReservation/InvReservationService'
import { InvReservationType } from '../../models/invReservation/InvReservation'
import { ID } from '../../models/_others/ID'
import { getSiteListOfTargetInvRequestIds } from '../site/SiteListCase'
import { ArrangementWorkerType } from '../../models/worker/ArrangementWorkerListType'
import {
    _addInvRequestLocalInsideWorker,
    _addLocalInsideWorker,
    _addLocalOutsideWorker,
    _deleteInvRequestLocalInsideWorker,
    _deleteLocalInsideWorkerForTargetSite,
    _deleteLocalOutsideWorker,
} from '../../components/template/ArrangementManageUtils'
import { WorkerTagType } from '../../models/worker/WorkerTagType'
import flatten from 'lodash/flatten'
import { checkMyDepartment } from '../department/DepartmentCase'
import { genKeyName, getCachedData, updateCachedData } from '../CachedDataCase'
import { SiteArrangementModel } from '../../models/arrangement/SiteArrangement'
import { TFunction } from 'react-i18next'
import { Alert } from 'react-native'
import { ToastMessage, setToastMessage } from '../../stores/UtilSlice'
import { Dispatch } from 'react'
import { updateLockOfTarget } from '../lock/CommonLockCase'
import { InvRequestArrangementModel } from '../../models/invRequest/InvRequestArrangement'
import { _sendRequestInfo } from '../../services/SendGridMail'
import { AttendanceType } from '../../models/attendance/Attendance'
import { DateInvRequestArrangementType, DateSiteArrangementType } from '../../screens/adminSide/date/DateArrangements'

/**
 * @requires
 * @param myCompanyId - 自社
 * @param siteId - 手配する現場
 * @param workerIds - 手配する自社作業員リスト。
 * @param myWorkerId - 自身。作成者を特定するため。
 * @partial
 * @param respondRequestId - 常用現場の時のみ入力必須
 * @param newArrangementIds - 手配IDリストの外部指定用。indexはworkerIdsと揃える。
 * @param workers - 自社作業員リスト。入力すると所属確認を省略できる。
 * @param fakeCompanyInvRequestId - 仮会社への「常用で送る」に紐づく現場手配の場合の、自社から仮会社へ向けてのinvRequestId
 * @param isFakeCompanyManageSite - 仮会社施工現場かどうか。応答する常用依頼先respondRequestIdが必要。\
 * 特殊な対応が必要。
 * - respondRequestIdが必須になる
 * - 依頼数と応答数を比較しない
 * - 勤怠IDは応答先のstockを使わず自動作成
 * - 応答先の常用依頼更新は、勤怠IDのinitialStockへの追加。
 */
export type AddInsideWorkersArrangementParam = {
    myCompanyId: string
    siteId: string
    workerIds: string[]
    myWorkerId: string
    respondRequestId?: string
    newArrangementIds?: string[]
    workers?: WorkerType[]
    isFakeCompanyManageSite?: boolean
    fakeCompanyInvRequestId?: string
}

/**
 * 成否を返す。
 */
export type AddInsideWorkersArrangementResponse = AttendanceType[] | undefined
/**
 * @remarks 自社作業員を現場や常用依頼に手配する。複数入力対応。
 * @objective SiteArrangementManage.tsxにおいて自社作業員を手配をするため。
 * 複数入力対応の目的は、応答手配時の常用依頼の残り勤怠IDsという配列操作で不整合を起こさせないようにするため。
 * @error
 * - REQUEST_ERROR - requestの取得に失敗した際
 * - OVER_RESPONSE - 依頼数以上に応答した場合
 * - WORKER_ERROR - 作業員取得に失敗した場合
 * - ARRANGE_ERROR - 手配の作成に失敗した場合
 * - ATTEND_ERROR - 勤怠の作成に失敗した場合
 * - WRONG_IDS - 勤怠と手配、勤怠と入力された作業員数が一致しない時。
 * - REQUEST_UPDATE_ERROR - 応答先常用依頼の残り勤怠IDアップデートに失敗した場合。
 * - FAKE_COMPANY_ID_ERROR - 仮会社施工指定なのに応答先respondRequestIdがない場合。
 * @author Hiruma
 * @param params - {@link AddInsideWorkersArrangementParam}
 * @returns - 作成したAttendanceを返す。{@link AddInsideWorkersArrangementResponse}
 */
export const addInsideWorkersArrangement = async (params: AddInsideWorkersArrangementParam): Promise<CustomResponse<AddInsideWorkersArrangementResponse>> => {
    try {
        const { myCompanyId, siteId, workerIds, myWorkerId, isFakeCompanyManageSite, respondRequestId, newArrangementIds, workers, fakeCompanyInvRequestId } = params

        const result = await _addInsideWorkersArrangement({
            myCompanyId,
            siteId,
            workerIds,
            myWorkerId,
            respondRequestId,
            newArrangementIds,
            workers,
            isFakeCompanyManageSite,
            fakeCompanyInvRequestId,
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
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * @param siteId - 対象の現場
 * @param workerIds - 対象の自社作業員リスト。_targetArrangementId==undefinedの場合に使う。
 * @param myCompanyId - isFakeCompanyManageSite == trueの時に使用する。
 * @partial
 * @param targetArrangementIds - 削除する自社作業員の手配ID。検索するコストを省ける。workerIdsとindexは揃える。
 * @param site - 対象の現場。現場の取得コストを下げる。作業員が現場責任者の場合の責任者の削除のため。
 * @param respondRequestId - 常用依頼への応答の場合。
 * @param isFakeCompanyManageSite - 仮会社施工現場かどうか。応答する常用依頼先respondRequestIdが必要。\
 * 特殊な対応が必要。
 * - respondRequestIdが必須になる
 * - 応答先の常用依頼更新は、勤怠IDのinitialStockからの削除。
 */
export type DeleteInsideWorkerParam = {
    siteId: string
    workerIds: string[]
    myCompanyId: string

    respondRequestId?: string
    site?: SiteType
    targetArrangementIds?: string[]
    isFakeCompanyManageSite?: boolean
}

/**
 *  - isManager - 現場責任者の場合。UI側でローカルの変更があるため。
 */
export type DeleteInsideWorkerResponse = boolean | undefined
/**
 * @remarks 自社作業員の手配を削除する際に使用。自社かどうかはチェックしないので注意。
 * @objective SiteArrangementManage.tsxにおいて自社作業員の手配削除するため。
 * 複数入力対応の目的は、応答手配時の常用依頼の残り勤怠IDsという配列操作で不整合を起こさせないようにするため。
 * @error
 *  - GET_ARRANGEMENT_ERROR - 手配情報取得失敗時
 *  - ARRANGEMENT_ID_ERROR - 取得した手配IDが存在しない場合
 *  - NO_ARRANGEMENT - 取得後手配が存在しない場合
 *  - SITE_ERROR - 現場情報取得失敗時
 *  - DELETE_ERROR - 手配削除失敗時
 *  - ATTENDANCE_UPDATE_ERROR - 手配削除に伴う勤怠更新時失敗
 *  - FAKE_COMPANY_ID_ERROR - 仮会社施工指定なのに応答先respondRequestIdがない場合。
 * @author Hiruma
 * @param params - {@link DeleteInsideWorkerParam}
 * @returns - {@link DeleteInsideWorkerResponse}
 */
export const deleteInsideWorkerArrangement = async (params: DeleteInsideWorkerParam): Promise<CustomResponse<DeleteInsideWorkerResponse>> => {
    try {
        const { siteId, workerIds, targetArrangementIds, isFakeCompanyManageSite, myCompanyId, respondRequestId, site } = params

        const result = await _deleteInsideWorkerArrangement({
            siteId,
            workerIds,
            targetArrangementIds,
            respondRequestId,
            myCompanyId,
            site,
            isFakeCompanyManageSite,
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
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * @param myCompanyId - 自社
 * @param siteId - 対象の現場
 * @param requestedCompanyId - 常用を依頼する会社
 * @param myWorkerId - 自身
 * @param addCount - 常用依頼を追加する数。0より大きい必要がある。
 * @param reservationId - 常用予約。減らす。reservation.requestedCompanyIdがrequestedCompanyIdと一致する必要あり。
 * @param targetRequestId - 常用依頼ID。request.requestedCompanyIdがrequestedCompanyIdと一致する必要あり。存在すればUpdateなければCreate。
 * @partial
 * @param respondRequestId - 常用現場の時のみ入力必須
 * @param reservation - 常用予約。取得コストを減らす。
 * @param isFakeCompanyManageSite - 仮会社施工現場かどうか。応答する常用依頼先respondRequestIdが必要。\
 * 特殊な対応が必要。
 * - respondRequestIdが必須になる
 * - 依頼数と応答数を比較しない
 * - 勤怠IDは応答先のstockを使わず自動作成
 * - 応答先の常用依頼更新は、勤怠IDのinitialStockへの追加。
 * @param isFakeRequestedCompany - 仮会社への常用依頼かどうか。requestedCompanyIdが仮会社かどうか。仮会社の場合は応答手配も作成する。
 * @param attendanceIds - 最適化兼、同時処理時の不整合防止用
 */
export type AddOutSideWorkerParam = {
    myCompanyId: string
    siteId: string
    requestedCompanyId: string
    myWorkerId: string
    addCount: number
    reservationId: string
    targetRequestId: string

    reservation?: ReservationType
    respondRequestId?: string
    isFakeCompanyManageSite?: boolean
    isFakeRequestedCompany?: boolean
}

export type AddOutSideWorkerResponse = AttendanceType[] | undefined
/**
 * @remarks 他社に常用依頼する場合。一人ずつ追加する度に使用することは想定されていないので、まとめて更新するようにする。
 * @objective
 * @error
 *  - FAKE_COMPANY_ID_ERROR - 仮会社施工指定なのに応答先respondRequestIdがない場合。
 * @author Hiruma
 * @param params - {@link AddOutSideWorkerParam}
 * @returns 作成したAttendanceを返す。{@link AddOutSideWorkerResponse}
 */
export const addOutsideWorkerRequest = async (params: AddOutSideWorkerParam): Promise<CustomResponse<AddOutSideWorkerResponse>> => {
    try {
        const { myCompanyId, siteId, isFakeRequestedCompany, isFakeCompanyManageSite, reservationId, reservation, myWorkerId, addCount, requestedCompanyId, respondRequestId, targetRequestId } = params
        const result = await _addOutsideWorkerRequest({
            myCompanyId,
            siteId,
            reservationId,
            reservation,
            myWorkerId,
            addCount,
            requestedCompanyId,
            respondRequestId,
            targetRequestId,
            isFakeCompanyManageSite,
            isFakeRequestedCompany,
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
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * @param deleteCount - 常用依頼を減らす数。１以上の整数である必要がある。
 * @param myWorkerId - 自身。
 * @param targetRequestId - 対象となる常用依頼
 * @param reservationId - 常用予約。leftCountを増やす。
 * @param siteId - isFakeRequestedCompanyの場合に使用する。
 * @param myCompanyId - isFakeRequestedCompanyの場合に使用する。
 * @partial
 * @param reservation - 常用予約。効率化のため。
 * @param respondRequestId - 応答する常用依頼があれば入力必須。
 * @param isFakeCompanyManageSite - 仮会社施工現場かどうか。応答する常用依頼先respondRequestIdが必要。\
 * 特殊な対応が必要。
 * - respondRequestIdが必須になる
 * - 応答先の常用依頼更新は、勤怠IDのinitialStockからの削除。
 * @param isFakeRequestedCompany - 仮会社への常用依頼かどうか。requestedCompanyIdが仮会社かどうか。仮会社の場合は応答手配も作成する。
 *
 */
export type DeleteOutSideWorkerParam = {
    myWorkerId: string
    targetRequestId: string
    deleteCount: number
    siteId: string
    myCompanyId: string

    respondRequestId?: string
    isFakeCompanyManageSite?: boolean
    isFakeRequestedCompany?: boolean
}

export type DeleteOutSideWorkerResponse = ID[] | undefined
/**
 *
 * @param params - {@link DeleteOutSideWorkerParam}
 * @returns - {@link DeleteOutSideWorkerResponse}
 */
export const deleteOutsideWorkerRequest = async (params: DeleteOutSideWorkerParam): Promise<CustomResponse<DeleteOutSideWorkerResponse>> => {
    try {
        const { deleteCount, myWorkerId, myCompanyId, siteId, isFakeRequestedCompany, targetRequestId, isFakeCompanyManageSite, respondRequestId } = params
        const result = await _deleteOutsideWorkerRequest({
            deleteCount,
            myWorkerId,
            targetRequestId,
            myCompanyId,
            siteId,
            respondRequestId,
            isFakeCompanyManageSite,
            isFakeRequestedCompany,
        })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode + ',DELETE_OUTSIDE',
            }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * @param siteId -
 * @param myCompanyId -
 * @param myWorkerId -
 * @partial
 * @param respondRequestId -
 * @param dailySiteIds -
 * @param siteManagerCompanyId -
 * @param siteRelation -
 */
export type GetArrangementDataOfTargetSiteParam = {
    siteId: string
    myCompanyId: string
    myWorkerId: string

    respondRequestId?: string
    dailySiteIds?: string[]
    siteManagerCompanyId?: string
    siteRelation?: SiteRelationType
}

export type GetArrangementDataOfTargetSiteResponse =
    | {
          siteArrangementData?: SiteArrangementDataType
          site?: SiteType
          request?: RequestType
          targetMeter?: SiteMeterType | RequestMeterType
      }
    | undefined

/**
 *
 * @param params
 * @returns
 */
export const getArrangementDataOfTargetSite = async (params: GetArrangementDataOfTargetSiteParam): Promise<CustomResponse<GetArrangementDataOfTargetSiteResponse>> => {
    try {
        const { siteId, myCompanyId, respondRequestId, myWorkerId, dailySiteIds, siteManagerCompanyId, siteRelation } = params
        const siteResults = await Promise.all([
            _getSite({
                siteId,
            }),
            /**
             * これで仮会社施工以外の常用依頼は取得できる。
             */
            respondRequestId != undefined
                ? _getRequest({
                      requestId: respondRequestId,
                  })
                : undefined,
        ])
        const siteResult = siteResults[0]
        const respondRequestResult = siteResults[1]
        if (siteResult.error) {
            throw {
                error: siteResult.error,
                errorCode: 'GET_SITE_ERROR',
            }
        }
        if (respondRequestResult?.error) {
            throw {
                error: respondRequestResult.error,
                errorCode: 'GET_RESPOND_REQUEST_ERROR',
            }
        }
        /**
         * dailyInvRequestsを正確に取得するため、dateが必要なので、site取得後に再度withOutSelfを使いつつSiteを取得している。
         * 別のやり方としては、この関数を使っている箇所で日付を指定する方法がある。
         * その場合、routeで日付を渡す必要があるので、serverのnotificationのparamも変更する必要がある。
         * しかし影響範囲が広く、漏れが起こりやすいので、前者の方法で実装。
         */
        const siteResult2 = await _getSite({
            siteId,
            options: {
                withoutSelf: siteResult.success,
                siteNameData: true,
                siteArrangementData: {
                    params: {
                        companyId: myCompanyId,
                        requestId: respondRequestId,
                        myWorkerId,
                        siteManagerCompanyId,
                        siteRelation,
                        dailySiteIds,
                        date: siteResult.success?.meetingDate ? getDailyStartTime(toCustomDateFromTotalSeconds(siteResult.success?.meetingDate)).totalSeconds : siteResult.success?.siteDate,
                    },
                },
                construction: {
                    constructionMeter: { params: { companyId: myCompanyId } },
                    contract: {
                        orderDepartments: true,
                    },
                },
                siteRelation: {
                    params: {
                        companyId: myCompanyId,
                    },
                },
            },
        })
        let request = respondRequestResult?.success
        const siteArrangementData = siteResult2.success?.siteArrangementData
        const [meterResult, fakeCompanyRequestResult] = await Promise.all([
            respondRequestId == undefined
                ? _getSiteMeterOfTargetSite({
                      siteId,
                      companyId: myCompanyId,
                      siteRelation: siteArrangementData?.siteRelation,
                      siteManagerCompanyId: siteArrangementData?.siteManageCompanyId,
                  })
                : siteArrangementData?.siteRelation != 'fake-company-manager'
                ? _getRequestMeterOfTargetRequest({
                      requestId: respondRequestId,
                      request,
                  })
                : undefined,
            siteArrangementData?.siteRelation == 'fake-company-manager' && siteArrangementData.siteManageCompanyId != undefined
                ? _getRequestOfTargetSiteAndCompanies({
                      siteId,
                      companyId: siteArrangementData.siteManageCompanyId,
                      requestedCompanyId: myCompanyId,
                  })
                : undefined,
        ])
        if (meterResult?.error) {
            throw {
                error: meterResult?.error,
            }
        }
        if (fakeCompanyRequestResult?.error) {
            throw {
                error: fakeCompanyRequestResult.error,
            }
        }
        let meter = meterResult?.success
        if (fakeCompanyRequestResult?.success?.requestId) {
            const fakeCompanyMeterResult = await _getRequestMeterOfTargetRequest({
                requestId: fakeCompanyRequestResult?.success?.requestId,
            })
            if (fakeCompanyMeterResult.error) {
                throw {
                    error: fakeCompanyMeterResult.error,
                    errorCode: 'GET_FAKE_COMPANY_METER_ERROR',
                }
            }
            meter = fakeCompanyMeterResult.success
        }

        request = request ?? fakeCompanyRequestResult?.success
        return {
            success: {
                site: siteResult2.success,
                siteArrangementData,
                request,
                /**
                 * SiteMeterとRequestMeterTypeは構造が同じ。
                 */
                targetMeter: meter,
            },
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type SetWorkerToSiteManagerParam = {
    myCompanyId?: string
    siteId?: string
    workerId?: string
}

export type SetWorkerToSiteManagerResponse = boolean | undefined

export const setWorkerToSiteManager = async (params: SetWorkerToSiteManagerParam): Promise<CustomResponse<SetWorkerToSiteManagerResponse>> => {
    try {
        const { myCompanyId, workerId, siteId } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
                errorCode: 'SET_WORKER_TO_SITE_MANAGER',
            } as CustomResponse
        }

        if (siteId == undefined || workerId == undefined) {
            throw {
                error: '情報が足りません。',
                errorCode: 'SET_WORKER_TO_SITE_MANAGER',
            } as CustomResponse
        }

        const results = await Promise.all([
            _getArrangementOfTargetWorkerAndSite({ workerId, siteId }),
            _getWorker({ workerId }),
            _getSite({
                siteId,
                options: {
                    siteRelation: {
                        params: {
                            companyId: myCompanyId,
                        },
                    },
                },
            }),
        ])
        const existArrangementsResult = results[0]
        const workerResult = results[1]
        const siteResult = results[2]
        if (existArrangementsResult.error || workerResult.error || siteResult.error) {
            throw {
                error: `手配: ${existArrangementsResult.error} / 作業員: ${workerResult.error} / 現場: ${siteResult.error}`,
            }
        }

        if (existArrangementsResult.success == undefined) {
            throw {
                error: 'この作業員は現場に手配されていません。',
            }
        }
        if (siteResult.success?.siteRelation != 'manager') {
            throw {
                error: '自社施工現場でしか責任者を設定できません。',
            }
        }

        const result = await _updateSite({
            siteId,
            managerWorkerId: workerId,
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

export type SetSiteConfirmedParam = {
    siteId?: string
    isConfirmed?: boolean
    myCompanyId?: string
}

export type SetSiteConfirmedResponse = boolean | undefined

export const setSiteConfirmed = async (params: SetSiteConfirmedParam): Promise<CustomResponse<SetSiteConfirmedResponse>> => {
    try {
        const { siteId, isConfirmed, myCompanyId } = params
        if (siteId == undefined) {
            throw {
                error: '情報が足りません。',
                errorCode: 'SITE_CONFIRMED',
            } as CustomResponse
        }
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。',
                errorCode: 'SITE_CONFIRMED',
            } as CustomResponse
        }

        const siteResult = await _getSite({
            siteId,
            options: {
                siteRelation: {
                    params: {
                        companyId: myCompanyId,
                    },
                },
            },
        })
        if (siteResult.success?.siteRelation != 'manager' && siteResult.success?.siteRelation != 'fake-company-manager') {
            throw {
                error: '自社施工現場か仮会社施工現場の場合のみ編集できます。',
                errorCode: 'SITE_CONFIRMED',
            }
        }

        const result = await _updateSite({
            siteId,
            isConfirmed: isConfirmed == undefined || isConfirmed == true ? true : false,
        })

        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode + ',SITE_CONFIRMED',
            }
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type SetRequestConfirmedParam = {
    requestId?: string
    isConfirmed?: boolean
    myCompanyId?: string
}

export type SetRequestConfirmedResponse = boolean | undefined

export const setRequestConfirmed = async (params: SetRequestConfirmedParam): Promise<CustomResponse<SetRequestConfirmedResponse>> => {
    try {
        const { requestId, isConfirmed, myCompanyId } = params
        if (requestId == undefined) {
            throw {
                error: '情報が足りません。',
                errorCode: 'REQUEST_CONFIRMED',
            } as CustomResponse
        }
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。',
                errorCode: 'REQUEST_CONFIRMED',
            } as CustomResponse
        }

        const requestResult = await _getRequest({
            requestId,
        })
        if (requestResult.success?.requestedCompanyId != myCompanyId) {
            throw {
                error: '常用依頼された会社のみ確定できます。',
                errorCode: 'REQUEST_CONFIRMED',
            }
        }

        const result = await _updateRequest({
            request: {
                requestId,
                isConfirmed: isConfirmed == undefined || isConfirmed == true ? true : false,
            },
        })

        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode + ',REQUEST_CONFIRMED',
            }
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type SetPreviousArrangementsParam = {
    siteId: string
    myCompanyId: string
    myWorkerId: string

    respondRequestId?: string
    targetArrange: SiteArrangementDataType
    keepArrange: SiteArrangementDataType
    targetMeter?: SiteMeterType | RequestMeterType
    site?: SiteType
}

export type SetPreviousArrangementsResponse =
    | {
          addArrangements: ArrangementType[]
          deleteArrangementIds: string[]
      }
    | undefined
/**
 * 前回の現場手配を複製してLocalに下書き保存する。
 * @param params {@link SetPreviousArrangementsParam}
 * @returns - {@link SetPreviousArrangementsResponse}
 */
export const setPreviousArrangements = async (params: SetPreviousArrangementsParam): Promise<CustomResponse<SetPreviousArrangementsResponse>> => {
    try {
        const { siteId, myCompanyId, respondRequestId, myWorkerId, targetArrange, keepArrange, site, targetMeter } = params
        if (site == undefined || targetMeter == undefined) {
            throw {
                error: '現場情報がありません。',
                errorCode: 'PREVIOUS_ARRANGEMENT_ERROR',
            }
        }
        const sitesResult = await _getSiteNameData({
            siteId,
            withSites: true,
        })
        if (sitesResult.error) {
            throw {
                error: sitesResult.error,
                errorCode: 'PREVIOUS_ARRANGEMENT_ERROR',
            }
        }
        if (sitesResult.success?.siteNumber == undefined || sitesResult.success?.sites == undefined) {
            throw {
                error: '現場番号がありません。',
                errorCode: 'PREVIOUS_ARRANGEMENT_ERROR',
            }
        }

        if ((sitesResult.success?.sites?.items?.length ?? 0) <= 1 || sitesResult.success?.siteNumber <= 1) {
            throw {
                error: '前の現場がありません。',
                errorCode: 'PREVIOUS_ARRANGEMENT_ERROR',
            }
        }
        const previousSite = sitesResult.success?.sites?.items?.sort((a, b) => (a.meetingDate ?? a.siteDate ?? 0) - (b.meetingDate ?? b.siteDate ?? 0))[sitesResult.success?.siteNumber - 2]
        if (previousSite == undefined || previousSite.siteDate == undefined || previousSite.siteId == undefined) {
            throw {
                error: '前の現場情報がありません。',
                errorCode: 'PREVIOUS_ARRANGEMENT_ERROR',
            }
        }
        const preArrangeResult = await getArrangementDataOfTargetSite({
            siteId: previousSite.siteId,
            myCompanyId,
            myWorkerId,
            respondRequestId: respondRequestId,
        })

        if (preArrangeResult.error || targetArrange == undefined) {
            throw {
                error: `前回: ${preArrangeResult.error} / 今回: ${targetArrange}`,
                errorCode: 'PREVIOUS_ARRANGEMENT_ERROR',
            }
        }
        const preArrange = preArrangeResult.success?.siteArrangementData
        /**
         * 前回と今回の手配された作業員のID
         */
        const preArrangeInsideWorkerIds = preArrange?.selfSide
            ?.filter((selfSide) => selfSide.worker?.workerId && selfSide.targetArrangement != undefined)
            .map((data) => data.worker?.workerId)
            .filter((data) => data != undefined) as string[]
        const targetArrangeInsideWorkerIds = targetArrange?.selfSide
            ?.filter((selfSide) => selfSide.worker?.workerId && selfSide.targetArrangement != undefined)
            .map((data) => data.worker?.workerId)
            .filter((data) => data != undefined) as string[]
        const targetArrangeInsideWorkerIdsSet = new Set(targetArrangeInsideWorkerIds)
        const preArrangeInsideWorkerIdsSet = new Set(preArrangeInsideWorkerIds)

        const addArrangements: ArrangementType[] = []
        const deleteArrangementIds: string[] = []
        /**
         * 自社作業員追加差分。前回手配されていて、今回されていない作業員。
         */
        const insideAddWorkerIdsDiff = preArrangeInsideWorkerIds.filter((workerId) => !targetArrangeInsideWorkerIdsSet.has(workerId))
        insideAddWorkerIdsDiff.map((workerId) => {
            //preArrangeではなくtargetArrangeを使うのは、退会や手配不可、常用で送られてきて、この日には送られていない場合にはworkerをundefinedにするため
            const worker = targetArrange.selfSide?.filter((self) => self.worker?.workerId == workerId)[0]
            if (worker) {
                //退会や手配不可、常用で送られてきて、この日には送られていない場合にはworkerがundefinedになる
                const localArrangement = worker.targetArrangement
                _addLocalInsideWorker(worker, workerId, site, myCompanyId, targetMeter, localArrangement)
                if (worker.targetArrangement) {
                    addArrangements.push(worker.targetArrangement)
                }
            }
        })
        /**
         * 自社作業員削除差分。前回手配されておらず、今回されている作業員。
         */
        const insideDeleteWorkerIdsDiff = targetArrangeInsideWorkerIds.filter((workerId) => !preArrangeInsideWorkerIdsSet.has(workerId))
        insideDeleteWorkerIdsDiff.map((workerId) => {
            const worker = targetArrange?.selfSide?.filter((self) => self.worker?.workerId == workerId)[0]
            if (worker) {
                if (worker.targetArrangement?.arrangementId) {
                    deleteArrangementIds.push(worker.targetArrangement?.arrangementId)
                }
                //退会や手配不可、常用で送られてきて、前回現場には送られていない場合にはworkerがundefinedになる
                _deleteLocalInsideWorkerForTargetSite(worker, workerId, siteId, targetMeter)
            }
        })
        /**
         * 前回と今回の手配された常用依頼
         */
        const preArrangeRequests = preArrange?.otherSide?.map((otherSide) => otherSide.targetRequest).filter((data) => data != undefined) as RequestType[]
        /**
         * Localでは依頼数が0になってもRequestを削除しないので、依頼数0のRequestを省く
         */
        const targetArrangeRequests = targetArrange?.otherSide
            ?.map((otherSide) => otherSide.targetRequest)
            .filter((data) => data != undefined && data?.requestCount && data?.requestCount > 0) as RequestType[]

        /**
         * 常用依頼追加差分。
         */
        const addRequestsDiff = preArrangeRequests.filter(
            (request) => request?.requestCount && request.requestCount > (targetArrangeRequests.filter((req) => req.requestedCompanyId == request.requestedCompanyId)[0]?.requestCount ?? 0),
        )
        /**
         * 常用依頼削除差分。
         */
        const deleteRequestsDiff = targetArrangeRequests.filter(
            (request) => request?.requestCount && request.requestCount > (preArrangeRequests.filter((req) => req.requestedCompanyId == request.requestedCompanyId)[0]?.requestCount ?? 0),
        )
        /**
         * 追加依頼を下書きに反映する
         */
        if (addRequestsDiff.length > 0) {
            await Promise.all(
                addRequestsDiff
                    .filter((preRequest) => preRequest.requestedCompanyId && preRequest?.requestCount && preRequest.reservationId)
                    .map((preRequest) => {
                        //同じ会社へ依頼している現在の依頼
                        const siteArrangementCompany = targetArrange?.otherSide?.filter((other) => other.requestedCompany?.companyId == preRequest.requestedCompanyId)[0]
                        if (siteArrangementCompany) {
                            /**
                             *  その会社への初の常用依頼の場合は常用依頼IDはあらかじめ設定しておく。
                             */
                            const _requestId = siteArrangementCompany?.targetRequest?.requestId ?? getUuidv4()
                            const addCount = (preRequest.requestCount ?? 1) - (siteArrangementCompany.targetRequest?.requestCount ?? 0)
                            siteArrangementCompany.targetRequest = {
                                ...siteArrangementCompany?.targetRequest,
                                requestId: _requestId,
                            }
                            const keepRequest = keepArrange?.otherSide?.find((other) => other.targetRequest?.requestedCompanyId == preRequest.requestedCompanyId)?.targetRequest
                            _addLocalOutsideWorker(siteArrangementCompany, targetMeter, addCount, keepRequest)
                        }
                    }),
            )
        }
        /**
         * 削除差分依頼を下書きに反映する
         */
        if (deleteRequestsDiff.length > 0) {
            await Promise.all(
                deleteRequestsDiff
                    .filter((request) => request.requestedCompanyId && request?.requestCount && request.reservationId)
                    .map((request) => {
                        const siteArrangementCompany = targetArrange?.otherSide?.filter((other) => other.requestedCompany?.companyId == request.requestedCompanyId)[0]
                        if (siteArrangementCompany) {
                            const preRequest = preArrangeRequests.filter((req) => req.requestedCompanyId == request.requestedCompanyId)[0]
                            const deleteRequestCount = (request.requestCount ?? 0) - (preRequest?.requestCount ?? 0)
                            const keepRequest = keepArrange?.otherSide?.find((other) => other.targetRequest?.requestedCompanyId == request.requestedCompanyId)?.targetRequest
                            _deleteLocalOutsideWorker(siteArrangementCompany, targetMeter, deleteRequestCount, keepRequest)
                        }
                    }),
            )
        }
        return Promise.resolve({
            success: {
                addArrangements,
                deleteArrangementIds,
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type SetWorkerToHolidayParam = {
    workerId?: string
    date?: number
}

export type SetWorkerToHolidayResponse = boolean | undefined

export const setWorkerToHoliday = async (params: SetWorkerToHolidayParam): Promise<CustomResponse<SetWorkerToHolidayResponse>> => {
    try {
        const { workerId, date } = params
        if (workerId == undefined) {
            throw {
                error: '作業員を指定してください。',
                errorCode: 'SET_WORKER_TO_HOLIDAY',
            } as CustomResponse
        }

        if (date == undefined) {
            throw {
                error: '日付が足りません。',
                errorCode: 'SET_WORKER_TO_HOLIDAY',
            } as CustomResponse
        }

        const workerResult = await _getWorker({ workerId })
        if (workerResult.error) {
            throw {
                error: workerResult.error,
            }
        }

        /**
         * 日付のだぶりを削除
         */
        const _otherOffDays = uniqBy([...(workerResult.success?.otherOffDays ?? []), date], (item) => dayBaseText(toCustomDateFromTotalSeconds(item)))

        const updateResult = await _updateWorker({
            workerId: workerResult.success?.workerId,
            otherOffDays: _otherOffDays,
        })
        if (updateResult.error) {
            throw {
                error: updateResult.error,
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const makeNotifications = async (
    site: SiteType,
    signInUser: AccountType,
    currentArrangements: SiteArrangementDataType,
    keepArrangements: SiteArrangementDataType,
    isRequest: boolean,
    requestId: string,
    isBulkUpdate: boolean,
): Promise<CustomResponse> => {
    try {
        //自社
        currentArrangements.selfSide?.forEach(async (data) => {
            //手配あり
            data.dailyArrangements?.items?.forEach(async (item) => {
                if (item.siteId == site.siteId) {
                    await checkSelfSideArrangementAdd(site, signInUser, item, keepArrangements)
                }
            })
        })

        //自社
        keepArrangements.selfSide?.forEach(async (data) => {
            //手配あり
            data.dailyArrangements?.items?.forEach(async (item) => {
                if (item.siteId == site.siteId) {
                    await checkSelfSideArrangementDelete(site, signInUser, item, currentArrangements)
                }
            })
        })

        //常用
        currentArrangements.otherSide?.forEach(async (data) => {
            await checkOtherSideRequestAdd(site, signInUser, data, keepArrangements, isBulkUpdate)
        })

        //常用
        keepArrangements.otherSide?.forEach(async (data) => {
            await checkOtherSideRequestDelete(site, signInUser, data, currentArrangements, isBulkUpdate)
        })

        //常用依頼モードでの応答手配
        if (isRequest) {
            await checkRespondArrangement(site, signInUser, keepArrangements, currentArrangements, requestId, isBulkUpdate)
        }

        return {
            success: true,
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * 常用申請元と常用申請先の管理者に通知
 * 手配されている作業員自体には現場が確定していないのでまだ通知しない。
 */
export const makeInvRequestNotifications = async (invRequest?: InvRequestType): Promise<CustomResponse> => {
    try {
        if (invRequest == undefined) {
            return {
                success: false,
            }
        }

        const arrangedNum = (invRequest?.workerIds?.length ?? 0) + sum(invRequest.site?.companyRequests?.orderRequests?.items?.map((req) => req?.requestCount ?? 0))

        let description = `${invRequest?.targetCompany?.name}への常用で送る¥n`
        description += `作成日時： ${timeBaseText(newCustomDate())}¥n`
        description += `常用で送る日： ${invRequest?.date ? dayBaseText(toCustomDateFromTotalSeconds(invRequest.date)) : '--'}¥n`
        /**
         * workerCountは、申請確定時の人数を優先して変更されるのでworkerIdsの数にする
         */
        description += `常用で送る人数：${arrangedNum}名¥n`
        description += `常用で送る会社：${invRequest?.myCompany?.name}¥n`
        description += `常用で受ける会社：${invRequest?.targetCompany?.name}¥n`

        let title = `常用で${arrangedNum}名の作業員が手配がされました`

        const myCompanyAccountResult = await _getAccountOverManagerOfTargetCompany({ companyId: invRequest?.myCompany?.companyId ?? 'no-id' })
        const targetCompanyAccountResult = await _getAccountOverManagerOfTargetCompany({ companyId: invRequest?.targetCompany?.companyId ?? 'no-id' })

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

/**
 * 常用で送るをまとめて確定した際に、申請元と申請先の管理者以上に通知
 */
export const makeInvReservationNotifications = async (invReservation?: InvReservationType): Promise<CustomResponse> => {
    try {
        if (invReservation == undefined) {
            return {
                success: false,
            }
        }
        const myCompanyResult = await _getCompany({ companyId: invReservation.myCompanyId ?? 'no-id' })
        const targetCompanyResult = await _getCompany({ companyId: invReservation.targetCompanyId ?? 'no-id' })

        let description = `${targetCompanyResult.success?.name}への常用で送る¥n`
        description += `作成日時： ${timeBaseText(newCustomDate())}¥n`
        description += `常用で送る開始日： ${invReservation.startDate ? dayBaseText(toCustomDateFromTotalSeconds(invReservation.startDate)) : '--'}¥n`
        description += `常用で送る終了日： ${invReservation.endDate ? dayBaseText(toCustomDateFromTotalSeconds(invReservation.endDate)) : '--'}¥n`
        description += `特定の常用で送る日： ${invReservation.extraDates?.map((date) => dayBaseText(toCustomDateFromTotalSeconds(date))).join(',  ')}¥n`
        description += `常用で送る元会社：${myCompanyResult.success?.name}¥n`
        description += `常用で送る先会社：${targetCompanyResult.success?.name}¥n`

        let title = `常用で送るがされました`

        const myCompanyAccountResult = await _getAccountOverManagerOfTargetCompany({ companyId: myCompanyResult.success?.companyId ?? 'no-id' })
        const targetCompanyAccountResult = await _getAccountOverManagerOfTargetCompany({ companyId: targetCompanyResult.success?.companyId ?? 'no-id' })

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
                contentsType: 'others',
            })
        })
        targetCompanyAccountResult.success?.forEach((account) => {
            _createNotification({
                accountId: account.accountId,
                title: title,
                description: description,
                transitionParams: {
                    screenName: 'InvReservationDetailRouter',
                    param: invReservation.invReservationId as string,
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

const checkSelfSideArrangementAdd = async (site: SiteType, signInUser: AccountType, currArrangement: ArrangementType, keepArrangements: SiteArrangementDataType): Promise<CustomResponse> => {
    try {
        keepArrangements.selfSide?.forEach(async (data) => {
            if (data.worker?.workerId == currArrangement.workerId && countSameSiteArrangement(site, data.dailyArrangements?.items ?? []) == 0) {
                let description = `手配日時： ${timeBaseText(newCustomDate())}¥n`
                description += `集合日時：${site.meetingDate ? timeBaseText(toCustomDateFromTotalSeconds(site.meetingDate)) : '未定'}¥n`
                description += `作業時間：${site.startDate ? timeText(toCustomDateFromTotalSeconds(site.startDate)) : '未定'}〜${
                    site.endDate ? timeText(toCustomDateFromTotalSeconds(site.endDate)) : '未定'
                }¥n`
                description += `現場住所：${site.address ?? ''}¥n`
                description += `手配者：${signInUser.worker?.name}¥n`
                const accountResult = await _getAccountOfTargetWorker({ workerId: data.worker?.workerId ?? 'no-id' })

                if (accountResult.success?.accountId) {
                    //アカウントIDがある時だけに絞らないと未登録の作業員を手配した際にエラーが起きてしまう。
                    _createNotification({
                        accountId: accountResult.success?.accountId,
                        title: `${site.siteNameData?.name}へ手配されました`,
                        description: description,
                        transitionParams: {
                            screenName: 'WorkerHome', //'WSiteRouter',
                            param: site.siteId as string,
                            param2: site.siteNameData?.name,
                        },
                        isAlreadyRead: false,
                        side: 'worker',
                        isNotificationCreated: false,
                        contentsType: 'site',
                    })
                }
            }
        })

        return {
            success: true,
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

const checkSelfSideArrangementDelete = async (site: SiteType, signInUser: AccountType, keepArrangement: ArrangementType, currentArrangements: SiteArrangementDataType): Promise<CustomResponse> => {
    try {
        currentArrangements.selfSide?.forEach(async (data) => {
            if (data.worker?.workerId == keepArrangement.workerId && countSameSiteArrangement(site, data.dailyArrangements?.items ?? []) == 0) {
                let description = `削除日時： ${timeBaseText(newCustomDate())}¥n`
                description += `集合日時：${site.meetingDate ? timeBaseText(toCustomDateFromTotalSeconds(site.meetingDate)) : '未定'}¥n`
                description += `作業時間：${site.startDate ? timeText(toCustomDateFromTotalSeconds(site.startDate)) : '未定'}〜${
                    site.endDate ? timeText(toCustomDateFromTotalSeconds(site.endDate)) : '未定'
                }¥n`
                description += `現場住所：${site.address ?? ''}¥n`
                description += `削除者：${signInUser.worker?.name}¥n`
                const accountResult = await _getAccountOfTargetWorker({ workerId: data.worker?.workerId ?? 'no-id' })
                if (accountResult.success?.accountId) {
                    //アカウントIDがある時だけに絞らないと未登録の作業員を手配した際にエラーが起きてしまう。
                    _createNotification({
                        accountId: accountResult.success?.accountId,
                        title: `${site.siteNameData?.name}への手配が削除されました`,
                        description: description,
                        transitionParams: {
                            screenName: 'WorkerHome',
                            param: site.siteId as string,
                            param2: site.siteNameData?.name,
                        },
                        isAlreadyRead: false,
                        side: 'worker',
                        isNotificationCreated: false,
                        contentsType: 'site',
                    })
                }
            }
        })

        return {
            success: true,
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

const countSameSiteArrangement = (site: SiteType, arrangements: ArrangementType[]): number => {
    let rtnCount = 0
    arrangements.forEach((item) => {
        if (item.siteId == site.siteId) {
            rtnCount += 1
        }
    })
    return rtnCount
}

export const checkOtherSideRequestAdd = async (
    site: SiteType,
    signInUser: AccountType,
    companyArrangement: SiteArrangementCompanyType,
    keepArrangements: SiteArrangementDataType,
    isBulkUpdate: boolean,
): Promise<CustomResponse> => {
    try {
        let hitFlag = false

        let companyResult = undefined
        companyResult = await _getCompany({ companyId: keepArrangements.mainDisplayCompanyId ?? 'no-id' })

        const companyName: string | undefined = companyResult?.success?.name

        keepArrangements.otherSide?.forEach(async (data) => {
            if (data.requestedCompany?.companyId == companyArrangement.requestedCompany?.companyId) {
                hitFlag = true
                if (
                    companyArrangement.requestedCompany?.isFake == false &&
                    data.targetRequest?.requestCount != companyArrangement.targetRequest?.requestCount &&
                    (companyArrangement.targetRequest?.requestCount ?? 0) != 0 &&
                    (data.targetRequest?.requestCount ?? 0) != 0
                ) {
                    //まとめて確定の時はスルー
                    if (isBulkUpdate && signInUser.worker?.companyId == data.requestedCompany?.companyId) {
                        return
                    }

                    let description = `${companyName}から${site.siteNameData?.name}への常用依頼数変更¥n`
                    description += `依頼日時： ${timeBaseText(newCustomDate())}¥n`
                    description += `依頼人数：${companyArrangement.targetRequest?.requestCount}名¥n`
                    description += `集合日時：${site.meetingDate ? timeBaseText(toCustomDateFromTotalSeconds(site.meetingDate)) : '未定'}¥n`
                    description += `作業時間：${site.startDate ? timeText(toCustomDateFromTotalSeconds(site.startDate)) : '未定'}〜${
                        site.endDate ? timeText(toCustomDateFromTotalSeconds(site.endDate)) : '未定'
                    }¥n`
                    description += `現場住所：${site.address ?? ''}¥n`
                    description += `依頼元会社：${companyName}¥n`

                    let title = `常用依頼が${data.targetRequest?.requestCount}名から${companyArrangement.targetRequest?.requestCount}名に変更されました`
                    const accountResult = await _getAccountOverManagerOfTargetCompany({ companyId: data.requestedCompany?.companyId ?? 'no-id' })

                    accountResult.success?.forEach((account) => {
                        _createNotification({
                            accountId: account.accountId,
                            title: title,
                            description: description,
                            transitionParams: {
                                screenName: 'SiteDetail',
                                param: site.siteId as string,
                                param2: site.siteNameData?.name,
                                param3: data.targetRequest?.requestId,
                            },
                            isAlreadyRead: false,
                            side: 'admin',
                            isNotificationCreated: false,
                            contentsType: 'site',
                        })
                    })
                }
                //一度右上に追加して、削除した場合に対応
                if (
                    companyArrangement.requestedCompany?.isFake == false &&
                    data.targetRequest?.requestCount != companyArrangement.targetRequest?.requestCount &&
                    (companyArrangement.targetRequest?.requestCount ?? 0) != 0 &&
                    (data.targetRequest?.requestCount ?? 0) == 0
                ) {
                    hitFlag = false
                }
            }
        })

        if (hitFlag == false && companyArrangement.requestedCompany?.isFake == false) {
            let description = `${companyName}から${site.siteNameData?.name}へ常用依頼されました¥n`
            description += `依頼日時： ${timeBaseText(newCustomDate())}¥n`
            description += `依頼人数：${companyArrangement.targetRequest?.requestCount}名¥n`
            description += `集合日時：${site.meetingDate ? timeBaseText(toCustomDateFromTotalSeconds(site.meetingDate)) : '未定'}¥n`
            description += `作業時間：${site.startDate ? timeText(toCustomDateFromTotalSeconds(site.startDate)) : '未定'}〜${
                site.endDate ? timeText(toCustomDateFromTotalSeconds(site.endDate)) : '未定'
            }¥n`
            description += `現場住所：${site.address ?? ''}¥n`
            description += `依頼元会社：${companyName}¥n`

            let title = `${companyArrangement.targetRequest?.requestCount}名の常用依頼をされました`
            const accountResult = await _getAccountOverManagerOfTargetCompany({ companyId: companyArrangement.requestedCompany?.companyId ?? 'no-id' })

            accountResult.success?.forEach((account) => {
                if (account.email) _sendRequestInfo(account.email, companyName || '', site, companyArrangement.targetRequest?.requestCount || 0)
                _createNotification({
                    accountId: account.accountId,
                    title: title,
                    description: description,
                    transitionParams: {
                        screenName: 'SiteDetail',
                        param: site.siteId as string,
                        param2: site.siteNameData?.name,
                        param3: companyArrangement.targetRequest?.requestId,
                    },
                    isAlreadyRead: false,
                    side: 'admin',
                    isNotificationCreated: false,
                    contentsType: 'site',
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

export const checkOtherSideRequestDelete = async (
    site: SiteType,
    signInUser: AccountType,
    companyArrangement: SiteArrangementCompanyType,
    currentArrangements: SiteArrangementDataType,
    isBulkUpdate: boolean,
): Promise<CustomResponse> => {
    try {
        let companyResult = undefined
        companyResult = await _getCompany({ companyId: currentArrangements.mainDisplayCompanyId ?? 'no-id' })

        const companyName: string | undefined = companyResult?.success?.name

        currentArrangements.otherSide?.forEach(async (data) => {
            if (
                data.requestedCompany?.companyId == companyArrangement.requestedCompany?.companyId &&
                (companyArrangement.targetRequest?.requestCount ?? 0) != 0 &&
                (data.targetRequest?.requestCount ?? 0) == 0
            ) {
                if (companyArrangement.requestedCompany?.isFake == true) {
                    return
                }

                //まとめて確定の時はスルー
                if (isBulkUpdate && signInUser.worker?.companyId == companyArrangement.requestedCompany?.companyId) {
                    return
                }

                let description = `${companyName}から${site.siteNameData?.name}への常用依頼取り消し¥n`
                description += `取り消し日時： ${timeBaseText(newCustomDate())}¥n`
                description += `集合日時：${site.meetingDate ? timeBaseText(toCustomDateFromTotalSeconds(site.meetingDate)) : '未定'}¥n`
                description += `作業時間：${site.startDate ? timeText(toCustomDateFromTotalSeconds(site.startDate)) : '未定'}〜${
                    site.endDate ? timeText(toCustomDateFromTotalSeconds(site.endDate)) : '未定'
                }¥n`
                description += `現場住所：${site.address ?? ''}¥n`
                description += `依頼元会社：${companyName}¥n`

                let title = '常用依頼が取り消されました'
                const accountResult = await _getAccountOverManagerOfTargetCompany({ companyId: companyArrangement.requestedCompany?.companyId ?? 'no-id' })

                accountResult.success?.forEach((account) => {
                    _createNotification({
                        accountId: account.accountId,
                        title: title,
                        description: description,
                        transitionParams: {
                            screenName: 'SiteDetail',
                            param: site.siteId as string,
                            param2: site.siteNameData?.name,
                            param3: companyArrangement.targetRequest?.requestId,
                        },
                        isAlreadyRead: false,
                        side: 'admin',
                        isNotificationCreated: false,
                        contentsType: 'site',
                    })
                })
            }
        })

        return {
            success: true,
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

const checkRespondArrangement = async (
    site: SiteType,
    signInUser: AccountType,
    keepArrangements: SiteArrangementDataType,
    currentArrangements: SiteArrangementDataType,
    requestId: string,
    isBulkUpdate: boolean,
): Promise<CustomResponse> => {
    try {
        let keepCount = 0
        let currentCount = 0

        keepArrangements.selfSide?.forEach((data) => {
            keepCount += countSameSiteArrangement(site, data.dailyArrangements?.items ?? [])
        })

        keepArrangements.otherSide?.forEach((data) => {
            keepCount += data.targetRequest?.requestCount ?? 0
        })

        currentArrangements.selfSide?.forEach((data) => {
            currentCount += countSameSiteArrangement(site, data.dailyArrangements?.items ?? [])
        })

        currentArrangements.otherSide?.forEach((data) => {
            currentCount += data.targetRequest?.requestCount ?? 0
        })

        const requestResult = await _getRequest({ requestId })
        const companyResult = await _getCompany({ companyId: requestResult.success?.requestedCompanyId ?? 'no-id' })

        //まとめて確定の時はスルー
        if (isBulkUpdate && signInUser.worker?.companyId == requestResult.success?.companyId) {
            return { success: true }
        }

        if (keepCount == 0 && currentCount > 0) {
            let description = `${companyResult.success?.name}への${site.siteNameData?.name}への常用依頼¥n`
            description += `応答日時： ${timeBaseText(newCustomDate())}¥n`
            description += `応答人数：${currentCount}名¥n`
            description += `集合日時：${site.meetingDate ? timeBaseText(toCustomDateFromTotalSeconds(site.meetingDate)) : '未定'}¥n`
            description += `作業時間：${site.startDate ? timeText(toCustomDateFromTotalSeconds(site.startDate)) : '未定'}〜${
                site.endDate ? timeText(toCustomDateFromTotalSeconds(site.endDate)) : '未定'
            }¥n`
            description += `現場住所：${site.address ?? ''}¥n`
            description += `依頼先会社：${companyResult.success?.name}¥n`

            let title = `常用依頼に${currentCount}名の応答手配をされました`

            const accountResult = await _getAccountOverManagerOfTargetCompany({ companyId: requestResult.success?.companyId ?? 'no-id' })
            const siteResult = await _getSite({
                siteId: site.siteId ?? 'no-id',
                options: {
                    companyRequests: {
                        params: {
                            companyId: requestResult.success?.companyId ?? 'no-id',
                            types: ['receive'],
                        },
                    },
                },
            })
            const requestId = siteResult.success?.companyRequests?.receiveRequests?.items && siteResult.success?.companyRequests?.receiveRequests?.items[0]?.requestId
            accountResult.success?.forEach((account) => {
                _createNotification({
                    accountId: account.accountId,
                    title: title,
                    description: description,
                    transitionParams: {
                        screenName: 'SiteDetail',
                        param: site.siteId as string,
                        param2: site.siteNameData?.name,
                        param3: requestId,
                    },
                    isAlreadyRead: false,
                    side: 'admin',
                    isNotificationCreated: false,
                    contentsType: 'site',
                })
            })
        } else if (keepCount > 0 && currentCount == 0) {
            let description = `${companyResult.success?.name}への${site.siteNameData?.name}への常用依頼`
            description += `取り消し日時： ${timeBaseText(newCustomDate())}¥n`
            description += `集合日時：${site.meetingDate ? timeBaseText(toCustomDateFromTotalSeconds(site.meetingDate)) : '未定'}¥n`
            description += `作業時間：${site.startDate ? timeText(toCustomDateFromTotalSeconds(site.startDate)) : '未定'}〜${
                site.endDate ? timeText(toCustomDateFromTotalSeconds(site.endDate)) : '未定'
            }¥n`
            description += `現場住所：${site.address ?? ''}¥n`
            description += `依頼先会社：${companyResult.success?.name}¥n`

            let title = '常用依頼の応答手配が取り消されました'

            const accountResult = await _getAccountOverManagerOfTargetCompany({ companyId: requestResult.success?.companyId ?? 'no-id' })

            accountResult.success?.forEach((account) => {
                _createNotification({
                    accountId: account.accountId,
                    title: title,
                    description: description,
                    transitionParams: {
                        screenName: 'SiteDetail',
                        param: site.siteId as string,
                        param2: site.siteNameData?.name,
                    },
                    isAlreadyRead: false,
                    side: 'admin',
                    isNotificationCreated: false,
                })
            })
        } else if (keepCount > 0 && currentCount > 0 && keepCount != currentCount) {
            let description = `${companyResult.success?.name}への${site.siteNameData?.name}への常用依頼¥n`
            description += `応答日時： ${timeBaseText(newCustomDate())}¥n`
            description += `応答人数：${currentCount}名¥n`
            description += `集合日時：${site.meetingDate ? timeBaseText(toCustomDateFromTotalSeconds(site.meetingDate)) : '未定'}¥n`
            description += `作業時間：${site.startDate ? timeText(toCustomDateFromTotalSeconds(site.startDate)) : '未定'}〜${
                site.endDate ? timeText(toCustomDateFromTotalSeconds(site.endDate)) : '未定'
            }¥n`
            description += `現場住所：${site.address ?? ''}¥n`
            description += `依頼先会社：${companyResult.success?.name}¥n`

            let title = `常用依頼の応答手配が${keepCount}名から${currentCount}名に変更されました`

            const accountResult = await _getAccountOverManagerOfTargetCompany({ companyId: requestResult.success?.companyId ?? 'no-id' })
            const siteResult = await _getSite({
                siteId: site.siteId ?? 'no-id',
                options: {
                    companyRequests: {
                        params: {
                            companyId: requestResult.success?.companyId ?? 'no-id',
                            types: ['receive'],
                        },
                    },
                },
            })
            const requestId = siteResult.success?.companyRequests?.receiveRequests?.items && siteResult.success?.companyRequests?.receiveRequests?.items[0]?.requestId
            accountResult.success?.forEach((account) => {
                _createNotification({
                    accountId: account.accountId,
                    title: title,
                    description: description,
                    transitionParams: {
                        screenName: 'SiteDetail',
                        param: site.siteId as string,
                        param2: site.siteNameData?.name,
                        param3: requestId,
                    },
                    isAlreadyRead: false,
                    side: 'admin',
                    isNotificationCreated: false,
                    contentsType: 'site',
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

export const ClearDailyArrangement = (keepArrangement: SiteArrangementDataType) => {
    keepArrangement.selfSide?.forEach((data) => {
        data.dailyArrangements?.items?.splice(0)
    })

    keepArrangement.otherSide?.forEach((data) => {
        if (data.targetRequest) {
            data.targetRequest.requestCount = 0
        }
    })
}
export type sendBulkNotificationParam = {
    date?: CustomDate
    startDate?: CustomDate
    endDate?: CustomDate
    signInUser: AccountType
    invReservationId?: ID
}
export const sendBulkNotification = async (params: sendBulkNotificationParam): Promise<CustomResponse> => {
    try {
        const { date, startDate, endDate, signInUser, invReservationId } = params
        let description: string = ''
        if (date) {
            description = `日付： ${dayBaseText(date)}¥n`
        } else if (startDate && endDate) {
            description = `日付： ${dayBaseText(startDate) + ' ~ ' + dayBaseText(endDate)}¥n`
        }
        description += `の手配をまとめて確定しました。¥n`

        let title = `手配をまとめて確定しました`

        const accountResult = await _getAccountOverManagerOfTargetCompany({ companyId: signInUser.worker?.companyId ?? 'no-id' })

        accountResult.success?.forEach((account) => {
            _createNotification({
                accountId: account.accountId,
                title: title,
                description: description,
                transitionParams: {
                    screenName: invReservationId ? 'InvReservationDetailRouter' : 'DateRouter',
                    param: invReservationId ?? date?.totalSeconds.toString() ?? '',
                    param2: 'order' ?? '',
                },
                isAlreadyRead: false,
                side: 'admin',
                isNotificationCreated: false,
                contentsType: 'site',
            })
        })

        return {
            success: true,
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}
type UpdateRequestsApplicationParams = {
    requests?: RequestType[]
}
/**
 * まとめて申請する。
 * 依頼数に変更がない場合で、応答がある場合は承認状況を変更しない。
 * @param params {@link UpdateRequestsApplicationParams}
 * @returns CustomResponse
 */
export const updateRequestsApplication = async (params: UpdateRequestsApplicationParams): Promise<CustomResponse> => {
    try {
        const { requests } = params
        if (requests == undefined || requests.length <= 0) {
            return {
                success: false,
            }
        }
        const results = await Promise.all(requests.map((request) => updateRequestApplication({ request })))
        results.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        })
        return {
            success: true,
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}
type UpdateRequestApplicationParams = {
    request?: RequestType
}
/**
 * 申請する。
 * 依頼数に変更がない場合で、応答がある場合は承認状況を変更しない。
 * @param params {@link UpdateRequestApplicationParams}
 * @returns CustomResponse
 */
export const updateRequestApplication = async (params: UpdateRequestApplicationParams): Promise<CustomResponse> => {
    try {
        const { request } = params
        if (request == undefined) {
            return {
                success: false,
            }
        }
        if (request.requestId == undefined) {
            throw {
                error: 'requestIdがありません',
                errorCode: 'UPDATE_REQ_APP',
            }
        }
        const preRequest = await _getRequest({
            requestId: request.requestId ?? 'no-id',
            options: { subRespondCount: true },
        })
        if (preRequest.error) {
            throw {
                error: preRequest.error,
                errorCode: preRequest.errorCode + ',UPDATE_REQ_APP',
            }
        }
        //依頼数に変更がない場合で、応答がある場合は承認状況を変更しない。仮会社への依頼も変更しない。
        const isApproval = request.requestedCompany?.isFake
            ? true
            : preRequest.success?.subRespondCount && preRequest.success?.subRespondCount > 0 && preRequest.success?.requestCount == request.requestCount
            ? true
            : 'waiting'
        const result = await _updateRequest({
            request: {
                requestId: request.requestId,
                isApplication: true,
                isApproval,
            },
        })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode + ',UPDATE_REQ_APP',
            }
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
 * @param invRequestId -
 * @param myCompanyId -
 * @param myWorkerId -
 */
export type GetArrangementDataOfTargetInvRequestParam = {
    invRequestId?: string
    myCompanyId?: string
    myWorkerId?: string
}

export type GetArrangementDataOfTargetInvRequestResponse =
    | {
          invRequestArrangementData?: SiteArrangementDataType
          invRequest?: InvRequestType
          targetMeter?: SiteMeterType
          fakeSite?: SiteType
          respondRequest?: RequestType
      }
    | undefined

/**
 *
 * @param params
 * @returns
 */
export const getArrangementDataOfTargetInvRequest = async (params: GetArrangementDataOfTargetInvRequestParam): Promise<CustomResponse<GetArrangementDataOfTargetInvRequestResponse>> => {
    try {
        const { invRequestId, myCompanyId, myWorkerId } = params
        if (invRequestId == undefined) {
            throw {
                error: '常用申請情報がありません',
            }
        }
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません',
            }
        }
        if (myWorkerId == undefined) {
            throw {
                error: '作業員情報がありません',
            }
        }
        const invRequestResult = await _getInvRequest({
            invRequestId,
            options: {
                invRequestWorkers: true,
                targetCompany: true,
            },
        })
        if (invRequestResult.error) {
            throw {
                error: invRequestResult.error,
                errorCode: 'GET_INVREQUEST_ERROR',
            }
        }
        const invRequestArrangementDataResult = await _getInvRequestArrangementData({
            invRequestId,
            orderCompanyId: invRequestResult.success?.myCompanyId ?? 'no-id',
            myWorkerId,
            date: invRequestResult.success?.date ? getDailyStartTime(toCustomDateFromTotalSeconds(invRequestResult.success?.date)).totalSeconds : undefined,
            invRequest: invRequestResult.success,
        })
        if (invRequestArrangementDataResult.error) {
            throw {
                error: invRequestArrangementDataResult.error,
                errorCode: 'GET_INVREQUEST_ARRANGEMENT_DATA_ERROR',
            }
        }
        let meter: SiteMeterType | RequestMeterType | undefined = {
            companyPresentNum: invRequestResult.success?.workerIds?.length ?? 0,
            companyRequiredNum: invRequestResult?.success?.workerCount ?? 0,
        }
        let fakeSite: SiteType | undefined
        let respondRequest: RequestType | undefined
        let invRequestArrangementData = invRequestArrangementDataResult.success
        if (invRequestResult.success?.targetCompany?.isFake) {
            const siteResult = await _getSiteOfTargetFakeCompanyInvRequestId({
                fakeCompanyInvRequestId: invRequestId,
                options: {
                    siteNameData: true, //お知らせで使用
                    companyRequests: {
                        params: {
                            companyId: myCompanyId,
                            types: ['receive'],
                        },
                    },
                },
            })
            if (siteResult.error) {
                throw {
                    error: siteResult.error,
                    errorCode: siteResult.errorCode,
                }
            }
            fakeSite = siteResult.success
            respondRequest = siteResult.success?.companyRequests?.receiveRequests?.items && siteResult.success?.companyRequests?.receiveRequests?.items[0]

            const result = await getArrangementDataOfTargetSite({
                siteId: fakeSite?.siteId ?? 'no-id',
                myCompanyId,
                myWorkerId,
                respondRequestId: respondRequest?.requestId ?? 'no-id',
            })
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            invRequestArrangementData = {
                date: invRequestArrangementData?.date,
                selfSide: invRequestArrangementData?.selfSide,
                otherSide: result.success?.siteArrangementData?.otherSide,
                orderRequests: result.success?.siteArrangementData?.orderRequests,
                companies: result.success?.siteArrangementData?.companies,
                arrangeableWorkers: result.success?.siteArrangementData?.arrangeableWorkers,
                siteRelation: result.success?.siteArrangementData?.siteRelation,
                siteManageCompanyId: result.success?.siteArrangementData?.siteManageCompanyId,
                subArrangements: result.success?.siteArrangementData?.subArrangements,
                subRequests: result.success?.siteArrangementData?.subRequests,
                subRespondCount: result.success?.siteArrangementData?.subRespondCount,
                mainDisplayCompanyId: result.success?.siteArrangementData?.mainDisplayCompanyId,
            }
            meter = result.success?.targetMeter
        }

        return {
            success: {
                invRequest: invRequestResult?.success,
                invRequestArrangementData,
                targetMeter: meter,
                fakeSite,
                respondRequest,
            },
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * @param invReservationId -
 * @param myCompanyId -
 * @param myWorkerId -
 */
export type GetArrangementDataOfTargetInvReservationParam = {
    invReservationId?: string
    myCompanyId?: string
    myWorkerId?: string
}

export type GetArrangementDataOfTargetInvReservationResponse =
    | {
          invReservationArrangementData?: SiteArrangementDataType
          invReservation?: InvReservationType
          targetMeter?: SiteMeterType
      }
    | undefined

/**
 *
 * @param params
 * @returns
 */
export const getArrangementDataOfTargetInvReservation = async (params: GetArrangementDataOfTargetInvReservationParam): Promise<CustomResponse<GetArrangementDataOfTargetInvReservationResponse>> => {
    try {
        const { invReservationId, myCompanyId } = params
        if (invReservationId == undefined) {
            throw {
                error: '常用申請情報がありません',
            }
        }
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません',
            }
        }
        const invReservationResult = await _getInvReservation({
            invReservationId,
            options: {
                targetCompany: true,
            },
        })
        if (invReservationResult.error) {
            throw {
                error: invReservationResult.error,
                errorCode: 'GET_INVRESERVATION_ERROR',
            }
        }
        const invReservation = invReservationResult.success
        //注意：workerTagが必要となった場合、siteIdなしでworkerTagを取得すると、退会済みラベルが退会日と本日を比較した結果になる。そのためworkerTagの関数を修正するか、仮の現場を作成して渡す必要がある。
        const workerResult = await _getWorkerListOfTargetCompany({
            companyId: myCompanyId,
        })
        if (workerResult.error) {
            throw {
                error: workerResult.error,
                errorCode: 'GET_WORKER_ERROR',
            }
        }
        //管理者と期間内に退会済みがある作業員を排除
        const workers = workerResult.success?.items?.filter(
            (worker) =>
                worker.companyRole != 'manager' &&
                worker.companyRole != 'owner' &&
                !(worker.leftDate && invReservation?.endDate && invReservation.endDate >= worker.leftDate) &&
                !(
                    invReservation?.extraDates &&
                    worker.leftDate &&
                    invReservation?.extraDates.map((date) => dayBaseText(toCustomDateFromTotalSeconds(date)))?.includes(dayBaseText(toCustomDateFromTotalSeconds(worker.leftDate)))
                ),
        )
        const selfSide: SiteArrangementWorkerType[] =
            (workers
                ?.map((worker) => {
                    return {
                        worker,
                        targetInvRequest: undefined,
                        targetArrangement: undefined,
                        dailyArrangements: undefined,
                        dailyInvRequests: undefined,
                    }
                })
                .filter((data) => data != undefined) as SiteArrangementWorkerType[]) ?? []

        const invReservationArrangementData = {
            selfSide,
        }
        const meter: SiteMeterType = {
            companyPresentNum: 0,
            companyRequiredNum: invReservationResult?.success?.initialWorkerCount ?? 0,
        }
        return {
            success: {
                invReservation,
                invReservationArrangementData,
                targetMeter: meter,
            },
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}
export type SetSiteCertainInTargetInvRequestsParam = {
    invRequestIds?: ID[]
    myCompanyId?: ID
    signInUser?: AccountType
    invReservationId?: ID
}

export type SetSiteCertainInTargetInvRequestsResponse = boolean | undefined
export const setSiteCertainInTargetInvRequests = async (params: SetSiteCertainInTargetInvRequestsParam): Promise<CustomResponse<SetSiteCertainInTargetInvRequestsResponse>> => {
    try {
        const { invRequestIds, myCompanyId, signInUser, invReservationId } = params
        if (invRequestIds == undefined) {
            throw {
                error: '常用情報がありません。ログインし直してください。',
                errorCode: 'SET_SITE_CERTAIN_IN_TARGET_INV_REQUESTS_ERROR',
            } as CustomResponse
        }
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
                errorCode: 'SET_SITE_CERTAIN_IN_TARGET_INV_REQUESTS_ERROR',
            } as CustomResponse
        }
        if (signInUser == undefined) {
            throw {
                error: 'ユーザー情報がありません。ログインし直してください。',
                errorCode: 'SET_SITE_CERTAIN_IN_TARGET_INV_REQUESTS_ERROR',
            } as CustomResponse
        }
        const sitesResult = await getSiteListOfTargetInvRequestIds({
            invRequestIds,
            options: {
                siteMeter: {
                    params: {
                        companyId: myCompanyId,
                    },
                },
                companyRequests: {
                    params: {
                        companyId: myCompanyId,
                        types: ['receive'],
                    },
                },
            },
        })
        if (sitesResult.error) {
            throw {
                error: sitesResult.error,
            }
        }
        sitesResult.success?.items
            ?.filter((site) => site.isConfirmed != true)
            .map((site) => {
                if (site.siteMeter?.companyPresentNum != undefined && site.siteMeter?.companyPresentNum < 1) {
                    throw {
                        error: '作業員が手配されていない現場があります。',
                        errorCode: 'TARGET_SITES_UN_ARRANGED_ERROR',
                    }
                }
            })
        const updateRequests = sitesResult.success?.items
            ?.map((site) => site.companyRequests?.receiveRequests?.items?.filter((request) => request.requestedCompanyId == myCompanyId)[0])
            .filter((data) => data != undefined) as RequestType[]
        const results = await Promise.all([
            ...(sitesResult.success?.items
                ?.filter((site) => (site.siteMeter?.companyPresentNum ? site.siteMeter?.companyPresentNum > 0 : false))
                .map((site) =>
                    setSiteConfirmed({
                        siteId: site.siteId,
                        isConfirmed: true,
                        myCompanyId,
                    }),
                ) ?? []),
            ...(updateRequests?.map((request) =>
                setRequestConfirmed({
                    requestId: request.requestId,
                    isConfirmed: true,
                    myCompanyId,
                }),
            ) ?? []),
        ])
        results.forEach((result) => {
            if (result?.error) {
                throw {
                    error: result.error,
                }
            }
        })

        //notification
        const resultsNotification1 = await Promise.all(
            sitesResult.success?.items
                ?.filter((site) => (site.siteMeter?.companyPresentNum ? site.siteMeter?.companyPresentNum > 0 : false))
                .map(async (site) => {
                    const resultArrangement = await getArrangementDataOfTargetSite({
                        siteId: site.siteId ?? 'no-id',
                        myCompanyId,
                        myWorkerId: signInUser.workerId ?? 'no-id',
                    })

                    const siteArrangementData = resultArrangement.success?.siteArrangementData
                    const keepArrangementData = cloneDeep(siteArrangementData)
                    ClearDailyArrangement(keepArrangementData as SiteArrangementDataType)

                    const siteResult = await _getSite({ siteId: site.siteId ?? 'no-id', options: { siteNameData: true } })
                    if (siteResult.success && siteArrangementData && keepArrangementData) {
                        return makeNotifications(siteResult.success, signInUser, siteArrangementData, keepArrangementData, false, '', true)
                    } else {
                        return {
                            success: true,
                        }
                    }
                }) ?? [],
        )

        resultsNotification1.forEach((result) => {
            if (result?.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        })

        const siteDates = sitesResult.success?.items
            ?.filter((site) => (site.siteMeter?.companyPresentNum ? site.siteMeter?.companyPresentNum > 0 : false))
            .map((site) => site.siteDate)
            .filter((data) => data != undefined) as number[]
        const startDate = min(siteDates)
        const endDate = max(siteDates)
        //まとめて確定を１通だけ通知
        await sendBulkNotification({
            startDate: startDate ? toCustomDateFromTotalSeconds(startDate) : undefined,
            endDate: endDate ? toCustomDateFromTotalSeconds(endDate) : undefined,
            signInUser,
            invReservationId,
        })

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export type writeLocalSiteArrangementParam = {
    siteArrangement?: SiteArrangementDataType
    siteArrangementId?: ID
    meter?: SiteMeterType | RequestMeterType
    //TODO:meterがありませんというエラーが完全に消えるまで一時的に
    companyRequiredNum?: number
}
/**
 * 手配状況をローカルストレージに上書き保存する
 * @param siteArrangement - 手配情報
 * @param siteArrangementId - siteIdまたは、respondedRequestIdまたはinvRequestIdが入る
 * @param meter - 更新後のmeter
 * @returns CustomResponse
 */
export const writeLocalSiteArrangement = async (params: writeLocalSiteArrangementParam): Promise<CustomResponse> => {
    try {
        const { siteArrangement, siteArrangementId, companyRequiredNum } = params
        let { meter } = params
        if (siteArrangementId == undefined) {
            throw {
                error: 'IDがありません',
                errorCode: 'WRITE_DRAFT_ARRANGEMENT_ERROR',
            }
        }
        if (meter == undefined) {
            const _presentArrangements = siteArrangement?.selfSide?.map(data => data?.targetArrangement).filter(data => data != undefined) as ArrangementType[] ?? []
            const _presentRequests = siteArrangement?.otherSide?.map(data => data?.targetRequest).filter(data => data != undefined && (data.requestCount ?? 0) > 0) as RequestType[] ?? []
            meter = {
                companyPresentNum: _presentArrangements.length + sum(_presentRequests.map(req => req.requestCount)),
                companyRequiredNum: companyRequiredNum,
                presentArrangements: {
                    items: _presentArrangements
                },
                presentRequests: {
                    items: _presentRequests
                }
            }
        }
        const targetSiteArrangement: LocalSiteArrangementDataType = {
            ...siteArrangement,
            siteArrangementId: siteArrangementId,
            meter: meter,
        }
        const result = await _writeLocalSiteArrangement(targetSiteArrangement)
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: result.success,
            error: undefined,
        } as CustomResponse)
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * 複数の手配状況をローカルストレージに上書き保存する
 * @param writeLocalSiteArrangementParam - 手配情報
 * @returns CustomResponse
 */
export const writeLocalSiteArrangements = async (params: writeLocalSiteArrangementParam[]): Promise<CustomResponse> => {
    try {
        const targetSiteArrangements: LocalSiteArrangementDataType[] = params.map((param) => {
            const { siteArrangement, siteArrangementId, companyRequiredNum } = param
            let { meter } = param
            if (siteArrangementId == undefined) {
                throw {
                    error: 'IDがありません',
                    errorCode: 'WRITE_DRAFT_ARRANGEMENTS_ERROR',
                }
            }
            if (meter == undefined) {
                const _presentArrangements = siteArrangement?.selfSide?.map(data => data?.targetArrangement).filter(data => data != undefined) as ArrangementType[] ?? []
                const _presentRequests = siteArrangement?.otherSide?.map(data => data?.targetRequest).filter(data => data != undefined && (data.requestCount ?? 0) > 0) as RequestType[] ?? []
                meter = {
                    companyPresentNum: _presentArrangements.length + sum(_presentRequests.map(req => req.requestCount)),
                    companyRequiredNum: companyRequiredNum,
                    presentArrangements: {
                        items: _presentArrangements
                    },
                    presentRequests: {
                        items: _presentRequests
                    }
                }
            }
            const targetSiteArrangement: LocalSiteArrangementDataType = {
                ...siteArrangement,
                siteArrangementId: siteArrangementId,
                meter: meter,
            }
            return targetSiteArrangement
        })
        const result = await _writeLocalSiteArrangements(targetSiteArrangements)
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: result.success,
            error: undefined,
        } as CustomResponse)
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * ローカルストレージに保存されている手配状況を削除する
 * @param siteArrangementId - 削除したい手配のsiteIdまたは、respondedRequestIdまたはinvRequestIdが入る
 * @returns CustomResponse
 */
export const deleteLocalSiteArrangement = async (siteArrangementId?: string): Promise<CustomResponse> => {
    try {
        const result = await _deleteLocalSiteArrangement(siteArrangementId)
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: result.success,
            error: undefined,
        } as CustomResponse)
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * ローカルストレージに保存されている手配状況を削除する
 * @param siteArrangementIds - 削除したい手配のsiteIdまたは、respondedRequestIdまたはinvRequestIdが入る
 * @returns CustomResponse
 */
export const deleteLocalSiteArrangements = async (siteArrangementIds?: string[]): Promise<CustomResponse> => {
    try {
        const result = await _deleteLocalSiteArrangements(siteArrangementIds)
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: result.success,
            error: undefined,
        } as CustomResponse)
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type getDraftArrangementDataOfTargetSiteResponse =
    | {
          targetArrangementData?: LocalSiteArrangementDataType
          targetMeter?: SiteMeterType | RequestMeterType
      }
    | undefined

/**
 *
 * @param siteArrangementId - 取得したい手配のsiteIdまたは、respondedRequestIdまたはinvRequestId
 * @returns SiteArrangementDataTypeまたはundefined
 */
export const getDraftArrangementDataOfTargetId = async (id?: string): Promise<CustomResponse<getDraftArrangementDataOfTargetSiteResponse>> => {
    try {
        if (id == undefined) {
            throw {
                error: 'IDがありません',
                errorCode: 'GET_DRAFT_ARRANGEMENT_ERROR',
            }
        }
        const result = await _getLocalArrangement(id)
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        //データ形式が古い場合は不具合が起こる可能性があるので削除する
        if (result.success != undefined && typeof result.success?.date != 'number') {
            deleteLocalSiteArrangement(id)
            return Promise.resolve({
                success: {
                    targetArrangementData: undefined,
                    targetMeter: undefined,
                },
            })
        }
        return Promise.resolve({
            success: {
                targetArrangementData: result.success,
                targetMeter: result.success?.meter,
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export type getDraftArrangementDataOfTargetSitesResponse =
    | {
          siteArrangementId?: ID
          targetArrangementData?: SiteArrangementDataType
          targetMeter?: SiteMeterType | RequestMeterType
      }[]
    | undefined

/**
 *
 * @param ids - 取得したい手配のsiteIdまたは、respondedRequestIdまたはinvRequestId
 * @returns SiteArrangementDataTypeまたはundefined
 */
export const getDraftArrangementDataOfTargetIds = async (ids?: string[]): Promise<CustomResponse<getDraftArrangementDataOfTargetSitesResponse>> => {
    try {
        if (ids == undefined) {
            throw {
                error: 'IDsがありません',
                errorCode: 'GET_DRAFT_ARRANGEMENT_ERROR',
            }
        }
        const result = await _getLocalArrangements(ids)
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        //データ形式が古い場合は不具合が起こる可能性があるので削除する
        const _localSiteArrangements = result.success?.map((data) => {
            if (data != undefined && typeof data?.date != 'number') {
                deleteLocalSiteArrangements(ids)
                return {
                    siteArrangementId: undefined,
                    targetArrangementData: undefined,
                    targetMeter: undefined,
                }
            } else {
                return {
                    siteArrangementId: data.siteArrangementId,
                    targetArrangementData: data,
                    targetMeter: data.meter,
                }
            }
        })

        return Promise.resolve({
            success: _localSiteArrangements,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type ChangeRequestType = SiteArrangementCompanyType & {
    addCount?: number
    deleteCount?: number
}

export type ApplyDraftSiteArrangementDataResponse =
    | {
          addAttendances?: AttendanceType[]
          deleteArrangementIds?: ID[]
          siteId?: ID
      }
    | undefined

export type ApplyDraftSiteArrangementDataParam = {
    keepSiteArrangementData?: SiteArrangementDataType
    siteArrangementData?: SiteArrangementDataType
    siteId?: ID
    site?: SiteType
    myCompanyId?: ID
    myWorkerId?: ID
    respondRequestId?: ID
    activeDepartmentIds?: ID[]
}
/**
 * 編集途中の手配データを確定してサーバーに反映
 * @param params - {@link ApplyDraftSiteArrangementDataParam}
 * @returns applyDraftSiteArrangementDataResponse
 */
export const applyDraftSiteArrangementData = async (params: ApplyDraftSiteArrangementDataParam): Promise<CustomResponse<ApplyDraftSiteArrangementDataResponse>> => {
    try {
        const { keepSiteArrangementData, siteArrangementData, siteId, site, myCompanyId, myWorkerId, respondRequestId, activeDepartmentIds } = params
        if (siteId == undefined || myCompanyId == undefined || myWorkerId == undefined) {
            throw {
                error: 'IDが足りません',
                errorCode: 'SITE_APPLY_DRAFT_ERROR',
            }
        }
        if (site?.siteRelation == 'fake-company-manager' && !checkMyDepartment({ targetDepartmentIds: site.construction?.contract?.orderDepartmentIds, activeDepartmentIds })) {
            throw {
                error: '他部署の契約です。部署を切り替えてください',
                errorCode: 'SITE_APPLY_DRAFT_ERROR',
            }
        }
        let addAttendances: AttendanceType[] = []
        let deleteArrangementIds: ID[] = []
        const keepSelfSideWorkers = keepSiteArrangementData?.selfSide?.map((data) => data).filter((worker) => worker.targetArrangement?.arrangementId != undefined)
        const updateSelfSideWorkers = siteArrangementData?.selfSide?.map((data) => data).filter((worker) => worker.targetArrangement?.arrangementId != undefined)

        const updateSelfSideArrangementIds = (updateSelfSideWorkers?.map((worker) => worker.targetArrangement?.arrangementId).filter((data) => data != undefined) as string[]) ?? []
        const keepSelfSideArrangementIds = (keepSelfSideWorkers?.map((worker) => worker.targetArrangement?.arrangementId).filter((data) => data != undefined) as string[]) ?? []

        const deleteSelfSideWorkers = keepSelfSideWorkers?.filter((worker) => !updateSelfSideArrangementIds.some((id) => id == worker.targetArrangement?.arrangementId))
        const addSelfSideWorkers = updateSelfSideWorkers?.filter((worker) => !keepSelfSideArrangementIds.some((id) => id == worker.targetArrangement?.arrangementId))

        const otherDepartmentWorkersNum =
            (deleteSelfSideWorkers?.filter((worker) => worker.worker?.invRequestId == undefined && !checkMyDepartment({ targetDepartmentIds: worker.worker?.departmentIds, activeDepartmentIds }))
                .length ?? 0) +
            (addSelfSideWorkers?.filter((worker) => worker.worker?.invRequestId == undefined && !checkMyDepartment({ targetDepartmentIds: worker.worker?.departmentIds, activeDepartmentIds }))
                .length ?? 0)
        if (otherDepartmentWorkersNum > 0) {
            throw {
                error: '他部署の作業員の手配を変更しています。部署を切り替えてください。',
                errorCode: 'SITE_APPLY_DRAFT_ERROR',
            }
        }
        deleteArrangementIds = (deleteSelfSideWorkers?.map((worker) => worker.targetArrangement?.arrangementId).filter((data) => data != undefined) as string[]) ?? []
        if (deleteSelfSideWorkers && deleteSelfSideWorkers?.length > 0) {
            /**
             * 自社作業員手配削除
             */
            const deleteInSideResult = await deleteInsideWorkerArrangement({
                siteId,
                workerIds: (deleteSelfSideWorkers?.map((worker) => worker.worker?.workerId).filter((data) => data != undefined) as string[]) ?? [],
                site: site,
                myCompanyId,
                respondRequestId: respondRequestId,
                targetArrangementIds: (deleteSelfSideWorkers?.map((worker) => worker.targetArrangement?.arrangementId) as string[]) ?? [],
                isFakeCompanyManageSite: siteArrangementData?.siteRelation == 'fake-company-manager',
            })
            if (deleteInSideResult.error) {
                throw {
                    error: deleteInSideResult.error,
                    errorCode: deleteInSideResult.errorCode,
                }
            }
        }
        const keepOtherSideCompanies = keepSiteArrangementData?.otherSide?.map((data) => data).filter((company) => company.targetRequest?.requestId != undefined)
        const updateOtherSideCompanies = siteArrangementData?.otherSide?.map((data) => data).filter((company) => company.targetRequest?.requestId != undefined)
        const deleteOtherSides = keepOtherSideCompanies
            ?.map((company) => {
                const updateRequestCount = updateOtherSideCompanies?.filter((data) => data.targetRequest?.requestId == company.targetRequest?.requestId)[0]?.targetRequest?.requestCount ?? 0
                //元々の依頼数-変更後の依頼数
                const deleteCount = (company.targetRequest?.requestCount ?? 0) - updateRequestCount
                if (deleteCount > 0) {
                    return {
                        ...company,
                        deleteCount,
                    } as ChangeRequestType
                } else {
                    return undefined
                }
            })
            .filter((data) => data != undefined) as ChangeRequestType[] ?? []
        const addOtherSides = updateOtherSideCompanies
            ?.map((company) => {
                const keepRequestCount = keepOtherSideCompanies?.filter((data) => data.targetRequest?.requestId == company.targetRequest?.requestId)[0]?.targetRequest?.requestCount ?? 0
                //変更後の依頼数-元々の依頼数
                const addCount = (company.targetRequest?.requestCount ?? 0) - keepRequestCount
                if (addCount > 0) {
                    return {
                        ...company,
                        addCount,
                    } as ChangeRequestType
                } else {
                    return undefined
                }
            })
            .filter((data) => data != undefined) as ChangeRequestType[] ?? []

        for (const company of deleteOtherSides) {
            const result = await deleteOutsideWorkerRequest({
                myWorkerId,
                targetRequestId: company.targetRequest?.requestId ?? '',
                deleteCount: company?.deleteCount ?? 0,
                respondRequestId: respondRequestId,
                myCompanyId,
                siteId,
                isFakeCompanyManageSite: siteArrangementData?.siteRelation == 'fake-company-manager',
                isFakeRequestedCompany: company.requestedCompany?.isFake,
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            //連携済み会社の場合は、応答数以上に減らせないが仮会社の場合は減らせるので、サーバー側で実際に削除したarrangementIdを返してくる。
            deleteArrangementIds = [...deleteArrangementIds, ...(result.success ?? [])]
        }
        for (const company of addOtherSides) {
            const result = await addOutsideWorkerRequest({
                myCompanyId,
                siteId,
                requestedCompanyId: company?.requestedCompany?.companyId ?? 'no-id',
                myWorkerId,
                addCount: company?.addCount ?? 0,
                reservationId: company.targetReservation?.reservationId ?? 'no-id',
                // 初回のみSiteArrangementManage.tsxにて新規作成している。
                targetRequestId: company.targetRequest?.requestId ?? 'no-id',
                // reservation: company.targetReservation,//そのまま渡してしまうとleftCountを２倍消費してしまう。
                respondRequestId: respondRequestId,
                isFakeCompanyManageSite: siteArrangementData?.siteRelation == 'fake-company-manager',
                isFakeRequestedCompany: company.requestedCompany?.isFake,
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            addAttendances = [...addAttendances, ...(result.success ?? [])]
        }
        /**
         * 依頼削除後に追加しないと、応答依頼の場合に依頼数オーバーエラーが出てしまう。
         */
        if (addSelfSideWorkers && addSelfSideWorkers?.length > 0) {
            /**
             * 自社作業員手配追加
             */
            const addInSideResult = await addInsideWorkersArrangement({
                myCompanyId,
                siteId,
                workerIds: (addSelfSideWorkers?.map((worker) => worker.worker?.workerId).filter((data) => data != undefined) as string[]) ?? [],
                myWorkerId,
                workers: (addSelfSideWorkers?.map((worker) => worker.worker).filter((data) => data != undefined) as ArrangementWorkerType[]) ?? [],
                respondRequestId: respondRequestId,
                newArrangementIds: (addSelfSideWorkers?.map((worker) => worker.targetArrangement?.arrangementId) as string[]) ?? [],
                isFakeCompanyManageSite: siteArrangementData?.siteRelation == 'fake-company-manager',
            })
            if (addInSideResult.error) {
                throw {
                    error: addInSideResult.error,
                    errorCode: addInSideResult.errorCode,
                }
            }
            addAttendances = [...addAttendances, ...(addInSideResult.success ?? [])]
        }
        /**
         * 現場責任者を更新
         */
        const selfSiteManagerWorkerIds = updateSelfSideWorkers
            ?.filter((self) => self.worker?.workerTags?.includes('is-site-manager'))
            ?.map((self) => self.worker?.workerId)
            .filter((data) => data != undefined) as string[]
        const otherSideWorkers =
            (flatten(updateOtherSideCompanies?.map((other) => flatten(other.targetRequest?.subAttendances?.items?.map((att) => att.worker)))).filter((data) => data != undefined) as WorkerType[]) ?? []
        const otherSiteManagerWorkerIds = otherSideWorkers
            .filter((worker) => worker.workerTags?.includes('is-site-manager'))
            .map((worker) => worker.workerId)
            .filter((data) => data != undefined) as string[]
        const siteManagerWorkerIds = [...(selfSiteManagerWorkerIds ?? []), ...(otherSiteManagerWorkerIds ?? [])]
        if (siteManagerWorkerIds.length > 1) {
            throw {
                error: '現場責任者は2人以上指定できません',
                errorCode: 'SITE_APPLY_DRAFT_ERROR',
            }
        }
        if (siteManagerWorkerIds.length > 0) {
            const result = await setWorkerToSiteManager({
                myCompanyId,
                siteId,
                workerId: siteManagerWorkerIds[0],
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        }

        return Promise.resolve({
            success: {
                addAttendances,
                deleteArrangementIds,
                siteId,
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * isUpdated - 下書きデータと更新後のデータで、手配が違っている場合true。常用予約や常用できているが手配されていない場合は含まない。
 */
export type updateDraftDataResponse = {
    targetArrangementData?: SiteArrangementDataType
    targetMeter?: SiteMeterType
    isUpdated?: boolean
}
/**
 * isReference - 下書きとサーバーのデータ間で常用予約に差があっても作成や削除をしない
 * draftData - asyncStorageに保存してある現場手配情報
 * updateData - サーバーに保存してある現場手配情報
 * draftMeter - asyncStorageに保存してある現場メーター情報
 * updateMeter - サーバーに保存してある現場メーター情報
 * siteArrangementIds - その日の現場または常用依頼または常用で送るのid
 */
export type updateDraftDataParam = {
    draftData?: SiteArrangementDataType
    updateData?: SiteArrangementDataType
    draftMeter?: SiteMeterType
    updateMeter?: SiteMeterType
    deleteSiteIds?: string[]
    isReference?: boolean
    siteArrangementIds?: ID[]
    arrDrafts?: LocalSiteArrangementDataType[]
    invDrafts?: LocalSiteArrangementDataType[]
}
/**
 * 端末に保存されている手配情報をサーバー側の情報と照らし合わせて更新する
 * @param params {@link updateDraftDataParam}
 * @returns - {@link updateDraftDataResponse}
 */
export const updateDraftData = async (params: updateDraftDataParam): Promise<updateDraftDataResponse> => {
    const { draftData, updateData, draftMeter, updateMeter, deleteSiteIds, isReference, siteArrangementIds, arrDrafts, invDrafts } = params
    if (draftData == undefined) {
        const draft = (arrDrafts && arrDrafts[0]) ?? (invDrafts && invDrafts[0])
        //下書きがない場合はサーバー側のデータをそのまま返すが、他の現場で下書きがある場合は、その下書きのdailyで上書きする。
        return {
            targetArrangementData: {
                ...updateData,
                selfSide: updateData?.selfSide?.map((self) => {
                    const targetDraftSelf = draft?.selfSide?.find((_self) => _self.worker?.workerId == self.worker?.workerId)
                    const _dailyArrangements = targetDraftSelf?.dailyArrangements ?? self.dailyArrangements
                    const _self: SiteArrangementWorkerType = {
                        ...self,
                        dailyArrangements:{items : _dailyArrangements?.items?.filter(arr => !deleteSiteIds?.includes(arr.siteId ?? 'no-id'))},
                        dailyInvRequests: targetDraftSelf?.dailyInvRequests ?? self.dailyInvRequests,
                    }
                    return _self
                }),
            },
            targetMeter: draftMeter ?? updateMeter,
            isUpdated: false,
        }
    }
    if (updateData == undefined) {
        return {
            targetArrangementData: draftData,
            targetMeter: draftMeter ?? updateMeter,
            isUpdated: false,
        }
    }
    const draftArrIds = arrDrafts?.map((draft) => draft.siteArrangementId).filter((data) => data != undefined) as string[]
    const draftInvIds = invDrafts?.map((draft) => draft.siteArrangementId).filter((data) => data != undefined) as string[]
    let isUpdated = false
    //下書き時から更新のある情報をアップデートする
    const arrangeableWorkers = updateData?.arrangeableWorkers

    //下書きのselfSideから削除された作業員を抽出したもの
    const deleteSelfSideWorkers =
        (draftData?.selfSide
            ?.map((self) => {
                if (!updateData?.selfSide?.some((_self) => _self.worker?.workerId == self.worker?.workerId)) {
                    return self
                }
            })
            ?.filter((data) => data != undefined) as SiteArrangementWorkerType[]) ?? []
    if (deleteSelfSideWorkers.filter((data) => data.targetArrangement != undefined || data.targetInvRequest != undefined).length > 0) {
        isUpdated = true
    }
    const deleteSelfSideWorkerIds = deleteSelfSideWorkers?.map((self) => self.worker?.workerId).filter((data) => data != undefined) as string[]
    const deletedArrangedSelfSideWorkers = deleteSelfSideWorkers.filter((self) => self.targetArrangement?.arrangementId != undefined)
    const deleteSelfSideWorkerIdsSet = new Set(deleteSelfSideWorkerIds)
    const _selfSide = cloneDeep(draftData.selfSide)
    /**
     * dailyArrangements、dailyInvRequestsにサーバーとの差異があった場合。その現場手配の下書きデータが存在するかどうかを確認する。
     * その現場の下書きがあるかどうか、今確認している現場の下書きのdailyにあるかどうか、サーバー側のSSGデータにあるかどうか
     * 存在している、下書きにある、サーバーにない→追加（現場自体ないのであれば削除）多分現場削除したからって手配の下書きまで更新してないだろう。
     * 存在している、下書きにない、サーバーにある→削除
     * 存在していない、下書きにある、サーバーにない→削除（現場が削除されているか、確定後に他の人が手配を消している）
     * 存在していない、下書きにない、サーバーにある→追加（現場が追加されているか、確定後に他の人が手配を追加している）
     */
    //updateData.selfSideの各dailyArrangementsとdraftData.selfSideの各dailyArrangementsの差分となるarrangementを取得する。
    const updateDailyArrangements = flatten(updateData?.selfSide?.map((self) => self.dailyArrangements?.items)) ?? []
    const updateDailyArrangementsIdsSet = new Set(updateDailyArrangements.map((arr) => arr?.arrangementId))
    const draftDailyArrangements = flatten(draftData?.selfSide?.map((self) => self.dailyArrangements?.items)) ?? []
    const draftDailyArrangementsIdsSet = new Set(draftDailyArrangements.map((arr) => arr?.arrangementId))
    //updateDailyArrangementsとdraftDailyArrangementsの差分を取得する
    const diffDailyArrangements = [
        ...updateDailyArrangements.filter((arr) => !draftDailyArrangementsIdsSet.has(arr?.arrangementId)),
        ...draftDailyArrangements.filter((arr) => !updateDailyArrangementsIdsSet.has(arr?.arrangementId)),
    ].filter((data) => data != undefined) as ArrangementType[]

    const checkDraftArrIds = (diffDailyArrangements.map((arr) => arr.respondRequestId ?? arr.siteId).filter((data) => data != undefined) as string[]) ?? []
    const checkDraftArrIdsSet = new Set(checkDraftArrIds)
    const existDraftArrIdsSet = new Set(draftArrIds)

    //Inv系の処理
    const updateDailyInvRequests = flatten(updateData?.selfSide?.map((self) => self.dailyInvRequests?.items)) ?? []
    const updateDailyInvRequestsIdsSet = new Set(updateDailyInvRequests.map((inv) => inv?.invRequestId))
    const draftDailyInvRequests = flatten(draftData?.selfSide?.map((self) => self.dailyInvRequests?.items)) ?? []
    const draftDailyInvRequestsIdsSet = new Set(draftDailyInvRequests.map((inv) => inv?.invRequestId))
    //updateDailyArrangementsとdraftDailyArrangementsの差分を取得する
    const diffDailyInvRequests = [
        ...updateDailyInvRequests.filter((inv) => !draftDailyInvRequestsIdsSet.has(inv?.invRequestId)),
        ...draftDailyInvRequests.filter((inv) => !updateDailyInvRequestsIdsSet.has(inv?.invRequestId)),
    ].filter((data) => data != undefined) as InvRequestType[]

    const checkDraftInvIds = (diffDailyInvRequests.map((inv) => inv.invRequestId).filter((data) => data != undefined) as string[]) ?? []
    const checkDraftInvIdsSet = new Set(checkDraftInvIds)
    const existDraftInvIdsSet = new Set(draftInvIds)

    //元は下書き
    const deletedSelfSide = _selfSide?.filter((self) => self.worker?.workerId && !deleteSelfSideWorkerIdsSet.has(self.worker?.workerId))
    const _deletedSelfSide = deletedSelfSide?.map((self) => {
        //下書きベース
        const _draftArrData =
            self.dailyArrangements?.items?.map((arr) => {
                const targetId = arr.respondRequestId ?? arr.siteId
                if (targetId && checkDraftArrIdsSet.has(targetId) && existDraftArrIdsSet.has(targetId)) {
                    //現場自体ないのであれば削除
                    return (siteArrangementIds?.includes(targetId) && (arr.siteId && !deleteSiteIds?.includes(arr.siteId))) ? arr : undefined
                } else if (targetId && checkDraftArrIdsSet.has(targetId) && !existDraftArrIdsSet.has(targetId)) {
                    //下書きとサーバー側に差分があるdailyArrangementsで、その手配の下書きが存在しない場合は削除
                    return undefined
                } else {
                    return arr
                }
            }) ?? []
        //サーバーベース
        const _serverArrData =
            updateData?.selfSide
                ?.find((_self) => _self.targetArrangement?.arrangementId == self.targetArrangement?.arrangementId)
                ?.dailyArrangements?.items?.map((arr) => {
                    const targetId = arr.respondRequestId ?? arr.siteId
                    if (targetId && checkDraftArrIdsSet.has(targetId) && existDraftArrIdsSet.has(targetId)) {
                        return undefined
                    } else if (targetId && checkDraftArrIdsSet.has(targetId) && !existDraftArrIdsSet.has(targetId)) {
                        return arr
                    } else {
                        //下書き側と重複するため
                        undefined
                    }
                }) ?? []
        const _dailySiteArrangements = [...(_draftArrData ?? []), ...(_serverArrData ?? [])].filter((data) => data != undefined) as ArrangementType[]

        //下書きベース
        const _draftInvData =
            self.dailyInvRequests?.items?.map((inv) => {
                const targetId = inv.invRequestId
                if (targetId && checkDraftInvIdsSet.has(targetId) && existDraftInvIdsSet.has(targetId)) {
                    //常用自体ないのであれば削除
                    return siteArrangementIds?.includes(targetId) ? inv : undefined
                } else if (targetId && checkDraftInvIdsSet.has(targetId) && !existDraftInvIdsSet.has(targetId)) {
                    return undefined
                } else {
                    return inv
                }
            }) ?? []
        //サーバーベース
        const _serverInvData =
            updateData?.selfSide
                ?.find((_self) => _self.targetInvRequest?.invRequestId == self.targetInvRequest?.invRequestId)
                ?.dailyInvRequests?.items?.map((inv) => {
                    const targetId = inv.invRequestId
                    if (targetId && checkDraftInvIdsSet.has(targetId) && existDraftInvIdsSet.has(targetId)) {
                        return undefined
                    } else if (targetId && checkDraftInvIdsSet.has(targetId) && !existDraftInvIdsSet.has(targetId)) {
                        return inv
                    } else {
                        //下書き側と重複するため
                        undefined
                    }
                }) ?? []
        const _dailyInvRequests = [...(_draftInvData ?? []), ...(_serverInvData ?? [])].filter((data) => data != undefined) as InvRequestType[]

        const _self: SiteArrangementWorkerType = {
            ...self,
            dailyArrangements: { items: _dailySiteArrangements },
            dailyInvRequests: {
                items: _dailyInvRequests,
            },
        }
        return _self
    })

    //減った作業員を削除し、増えた作業員を追加する。その日の手配状況をアップデートする。
    //元はサーバー
    const addSelfSideWorkers =
        (updateData?.selfSide
            ?.map((self) => {
                if (!draftData?.selfSide?.some((_self) => _self.worker?.workerId == self.worker?.workerId)) {
                    return self
                }
            })
            ?.filter((data) => data != undefined) as SiteArrangementWorkerType[]) ?? []
    if (addSelfSideWorkers.filter((data) => data.targetArrangement != undefined || data.targetInvRequest != undefined).length > 0) {
        isUpdated = true
    }
    const _addSelfSideWorkers = addSelfSideWorkers.map((self) => {
        //サーバーベース
        const _serverData =
            self.dailyArrangements?.items?.map((arr) => {
                const targetId = arr.respondRequestId ?? arr.siteId
                if (targetId && checkDraftArrIdsSet.has(targetId) && existDraftArrIdsSet.has(targetId)) {
                    return undefined
                } else {
                    return arr
                }
            }) ?? []
        const _draftData =
            draftData?.selfSide
                ?.find((_self) => _self.targetArrangement?.arrangementId == self.targetArrangement?.arrangementId)
                ?.dailyArrangements?.items?.map((arr) => {
                    const targetId = arr.respondRequestId ?? arr.siteId
                    if (targetId && checkDraftArrIdsSet.has(targetId) && existDraftArrIdsSet.has(targetId)) {
                        //現場自体ないのであれば削除
                        return !deleteSiteIds?.includes(targetId) ? arr : undefined
                    } else {
                        undefined
                    }
                }) ?? []
        const _dailySiteArrangements = [...(_draftData ?? []), ...(_serverData ?? [])].filter((data) => data != undefined) as ArrangementType[]
        //下書きベース
        const _draftInvData =
            self.dailyInvRequests?.items?.map((inv) => {
                const targetId = inv.invRequestId
                if (targetId && checkDraftInvIdsSet.has(targetId) && existDraftInvIdsSet.has(targetId)) {
                    //常用自体ないのであれば削除
                    return siteArrangementIds?.includes(targetId) ? inv : undefined
                } else if (targetId && checkDraftInvIdsSet.has(targetId) && !existDraftInvIdsSet.has(targetId)) {
                    return undefined
                } else {
                    return inv
                }
            }) ?? []
        //サーバーベース
        const _serverInvData =
            updateData?.selfSide
                ?.find((_self) => _self.targetInvRequest?.invRequestId == self.targetInvRequest?.invRequestId)
                ?.dailyInvRequests?.items?.map((inv) => {
                    const targetId = inv.invRequestId
                    if (targetId && checkDraftInvIdsSet.has(targetId) && existDraftInvIdsSet.has(targetId)) {
                        return undefined
                    } else if (targetId && checkDraftInvIdsSet.has(targetId) && !existDraftInvIdsSet.has(targetId)) {
                        return inv
                    } else {
                        //下書き側と重複するため
                        undefined
                    }
                }) ?? []
        const _dailyInvRequests = [...(_draftInvData ?? []), ...(_serverInvData ?? [])].filter((data) => data != undefined) as InvRequestType[]

        const _self: SiteArrangementWorkerType = {
            ...self,
            dailyArrangements: { items: _dailySiteArrangements },
            dailyInvRequests: {
                items: _dailyInvRequests,
            },
        }
        return _self
    })
    const addedSelfSide = [...(_deletedSelfSide ?? []), ...(_addSelfSideWorkers ?? [])]

    const newSelfSide = addedSelfSide.map((self) => {
        const updateSelf = updateData?.selfSide?.filter((_self) => _self.worker?.workerId == self?.worker?.workerId)[0]
        const newDailyArrangements = uniqBy([self?.targetArrangement, ...(self?.dailyArrangements?.items ?? [])]?.filter((data) => data?.workerId == self.worker?.workerId && data != undefined) as ArrangementType[], 'arrangementId')
        const newDailyInvRequests = uniqBy([self?.targetInvRequest, ...(self?.dailyInvRequests?.items ?? [])]?.filter((data) => self.worker?.workerId && data?.workerIds?.includes(self.worker?.workerId) && data != undefined) as InvRequestType[], 'invRequestId')
        const localWorkerTagsSet = new Set(self?.worker?.workerTags)
        let newWorker: ArrangementWorkerType | undefined
        if (localWorkerTagsSet?.has('is-site-manager')) {
            //下書きで現場責任者を設定した場合に反映させる
            const newWorkerTags = uniq([...(updateSelf?.worker?.workerTags ?? []), 'is-site-manager']) as WorkerTagType[]
            newWorker = {
                ...updateSelf?.worker,
                workerTags: newWorkerTags,
            }
        } else {
            const newWorkerTags = updateSelf?.worker?.workerTags?.filter((tag) => tag != 'is-site-manager')
            newWorker = {
                ...updateSelf?.worker,
                workerTags: newWorkerTags,
            }
        }
        const _self: SiteArrangementWorkerType = {
            targetArrangement: self?.targetArrangement,
            targetInvRequest: self?.targetInvRequest,
            dailyArrangements: { items: newDailyArrangements },
            dailyInvRequests: { items: newDailyInvRequests },
            worker: newWorker,
        }
        return _self
    })
    let newOtherSide = draftData.otherSide ?? []
    let deletedRequestNum = 0
    if (isReference != true) {
        //常用予約を削除し、増えた常用予約を追加する。
        //サーバー側にはあるが、下書きにはないもの
        const addOtherSideCompanies =
            (updateData?.otherSide
                ?.map((other) => {
                    if (!draftData?.otherSide?.some((_other) => _other?.targetReservation?.targetCompanyId == other?.targetReservation?.targetCompanyId)) {
                        return other
                    }
                })
                ?.filter((data) => data != undefined) as SiteArrangementCompanyType[]) ?? []
        //下書きにはあるが、サーバー側にはないもの
        const _deleteOtherSideCompanyIds =
            (draftData?.otherSide
                ?.map((other) => {
                    if (!updateData?.otherSide?.some((_other) => _other?.targetReservation?.targetCompanyId == other?.targetReservation?.targetCompanyId)) {
                        return other?.targetReservation?.targetCompanyId
                    }
                })
                ?.filter((data) => data != undefined) as string[]) ?? []
        const deleteOtherSideCompanyIdsSet = new Set(_deleteOtherSideCompanyIds)
        const _draftOtherSide = cloneDeep(draftData?.otherSide)
        //下書きからサーバー側にはないものを取り除いたもの
        const deletedOtherSide = _draftOtherSide?.filter((other) => other?.targetReservation?.targetCompanyId && !deleteOtherSideCompanyIdsSet.has(other?.targetReservation?.targetCompanyId))
        //下書きから、サーバー側にはないものを取り除いたものに、サーバー側にのみあるものを加えたもの
        const addedOtherSide = [...(deletedOtherSide ?? []), ...(addOtherSideCompanies ?? [])]
        newOtherSide = addedOtherSide?.map((other) => {
            // const updateOther = updateData?.otherSide?.filter((_other) => _other?.targetReservation?.targetCompanyId == other?.targetReservation?.targetCompanyId)[0]
            // const newDailyRequests = uniqBy([other?.targetRequest, ...(updateOther?.dailyRequests?.items ?? [])].filter((data) => data != undefined) as RequestType[], 'requestId')
            const newTargetReservation = updateData.otherSide?.map((__other) => __other.targetReservation).filter((res) => res?.targetCompanyId == other.targetReservation?.targetCompanyId)[0]
            const draftRequest = draftData.otherSide?.filter((__other) => __other.targetRequest?.requestId == other.targetRequest?.requestId)[0]
            const updateRequest = updateData.otherSide?.filter((__other) => __other.targetRequest?.requestId == other.targetRequest?.requestId)[0]
            const newTargetRequest: RequestType = {
                ...other?.targetRequest,
                reservationId: newTargetReservation?.reservationId,
                isApplication: draftRequest?.targetRequest?.isApplication ? updateRequest?.targetRequest?.isApplication : other?.targetRequest?.isApplication,
            }
            const _other: SiteArrangementCompanyType = {
                requestedCompany: other?.requestedCompany,
                // この会社へのその日の常用依頼を全て取得。
                // dailyRequests: newDailyRequests,
                targetReservation: newTargetReservation,
                targetRequest: newTargetRequest,
            }
            return _other
        })
        //下書きとサーバーで常用依頼に差異がある場合は、isUpdatedをtrueにする。
        _draftOtherSide?.forEach((draft) => {
            const targetRequest = newOtherSide?.find((other) => other?.targetRequest?.requestId == draft?.targetRequest?.requestId)?.targetRequest
            if (targetRequest == undefined || targetRequest?.requestCount != draft?.targetRequest?.requestCount) {
                isUpdated = true
            }
        })
        newOtherSide?.forEach((other) => {
            const targetRequest = _draftOtherSide?.find((draft) => draft?.targetRequest?.requestId == other?.targetRequest?.requestId)?.targetRequest
            if (targetRequest == undefined || targetRequest?.requestCount != other?.targetRequest?.requestCount) {
                isUpdated = true
            }
        })

        deletedRequestNum = sum(
            _draftOtherSide
                ?.filter((other) => other?.targetReservation?.targetCompanyId && deleteOtherSideCompanyIdsSet.has(other?.targetReservation?.targetCompanyId))
                .map((other) => other.targetRequest?.requestCount),
        )
    }
    const newSubArrangements = draftData?.subArrangements?.items?.filter((arr) => !deletedSelfSide?.some((self) => self.worker?.workerId == arr?.worker?.workerId))

    if (draftMeter && updateMeter) {
        // const newPresentArrangements = draftMeter?.presentArrangements?.items?.filter((arr) => arr?.worker?.workerId && !deleteSelfSideWorkerIdsSet.has(arr?.worker?.workerId))
        const deletedWorkerNum = deletedArrangedSelfSideWorkers?.length ?? 0
        // const requestIds = newOtherSide.map((other) => other.targetRequest?.requestId).filter((data) => data != undefined) as string[]
        // const requestIdsSet = new Set(requestIds)
        // const newPresentRequests = draftMeter?.presentRequests?.items?.filter((req) => req.requestId && requestIdsSet.has(req.requestId))

        const newMeter: SiteMeterType = {
            //手配は下書きから削除された作業員を除いたのが最新
            // presentArrangements: newPresentArrangements, //Localで更新されていない
            //応援依頼予定が削除されたものを取り除く
            // presentRequests: newPresentRequests, //Localで更新されていない
            //手配人数は下書きから削除された人数を除いたのが最新
            companyPresentNum: (draftMeter?.companyPresentNum && draftMeter?.companyPresentNum - deletedWorkerNum - deletedRequestNum) ?? 0,
            //必要人数はサーバーが最新
            companyRequiredNum: updateMeter?.companyRequiredNum,
        }
        return {
            targetArrangementData: {
                ...draftData,
                date: updateData?.date,
                arrangeableWorkers,
                selfSide: newSelfSide,
                otherSide: newOtherSide,
                subArrangements: { items: newSubArrangements },
            },
            targetMeter: newMeter,
            isUpdated,
        }
    } else {
        return {
            targetArrangementData: {
                ...draftData,
                date: updateData?.date,
                arrangeableWorkers,
                selfSide: newSelfSide,
                otherSide: newOtherSide,
                subArrangements: { items: newSubArrangements },
            },
            targetMeter: draftMeter ?? updateMeter,
            isUpdated,
        }
    }
}
export type updateSiteArrangementCacheParam = {
    site: SiteType
    siteArrangementData: SiteArrangementDataType
    accountId: string
    myCompanyId: string
    localPresentNum?: number
    updatedAt?: number
}
export const updateSiteArrangementCache = async (params: updateSiteArrangementCacheParam) => {
    try {
        let { site, siteArrangementData, accountId, myCompanyId, localPresentNum, updatedAt } = params
        const siteArrangementDisplayCacheKey = genKeyName({
            screenName: 'SiteArrangement',
            accountId: accountId,
            companyId: myCompanyId as string,
            siteId: site.siteId ?? 'no-id',
        })
        const siteArrangementDisplayCacheData = await getCachedData<SiteArrangementModel>(siteArrangementDisplayCacheKey)
        let _siteArrangementDisplayCacheData = cloneDeep(siteArrangementDisplayCacheData.success)
        // siteArrangementData更新
        if (_siteArrangementDisplayCacheData && _siteArrangementDisplayCacheData.siteArrangementData) {
            _siteArrangementDisplayCacheData.siteArrangementData = siteArrangementData
            _siteArrangementDisplayCacheData.updatedAt = updatedAt ?? Number(new Date())
        }
        if (_siteArrangementDisplayCacheData && _siteArrangementDisplayCacheData.siteArrangementData?.otherSide) {
            _siteArrangementDisplayCacheData.siteArrangementData.otherSide = [
                ...(siteArrangementData?.otherSide?.map((other) => {
                    const _other: SiteArrangementCompanyType = {
                        ...other,
                        targetRequest: {
                            ...other.targetRequest,
                            isApplication: true,
                        },
                    }
                    return _other
                }) ?? []),
            ]
        }
        if (_siteArrangementDisplayCacheData && _siteArrangementDisplayCacheData.site?.siteArrangementData) {
            _siteArrangementDisplayCacheData.site = {
                ...site,
                startDate: site?.startDate,
                endDate: site?.endDate,
                meetingDate: site?.meetingDate,
            } as SiteType
            _siteArrangementDisplayCacheData.site.siteArrangementData = siteArrangementData
        }
        // meter更新
        if (
            _siteArrangementDisplayCacheData &&
            _siteArrangementDisplayCacheData.site?.construction?.constructionMeter?.presentNum &&
            localPresentNum &&
            _siteArrangementDisplayCacheData.targetMeter?.companyPresentNum
        ) {
            // _siteArrangementDisplayCacheData.site.construction.constructionMeter.presentArrangements = siteArrangementData?.subArrangements
            // _siteArrangementDisplayCacheData.site.construction.constructionMeter.presentRequests = siteArrangementData?.subRequests
            const diff = _siteArrangementDisplayCacheData.site.construction.constructionMeter.presentNum + localPresentNum - _siteArrangementDisplayCacheData.targetMeter.companyPresentNum
            //なぜかここだけ直接変更すると日付手配にてエラーになるので一旦変数に入れてから代入する。
            _siteArrangementDisplayCacheData = {
                ..._siteArrangementDisplayCacheData,
                site: {
                    ..._siteArrangementDisplayCacheData.site,
                    construction: {
                        ..._siteArrangementDisplayCacheData.site.construction,
                        constructionMeter: {
                            ..._siteArrangementDisplayCacheData.site.construction.constructionMeter,
                            presentNum: diff,
                        },
                    },
                },
            }
        }
        if (_siteArrangementDisplayCacheData && _siteArrangementDisplayCacheData.targetMeter?.companyPresentNum && localPresentNum) {
            // _siteArrangementDisplayCacheData.targetMeter.presentArrangements = siteArrangementData?.subArrangements
            // _siteArrangementDisplayCacheData.targetMeter.presentRequests = siteArrangementData?.subRequests
            _siteArrangementDisplayCacheData.targetMeter.companyPresentNum = localPresentNum
        }
        const cachedResult = await updateCachedData({ key: siteArrangementDisplayCacheKey, value: _siteArrangementDisplayCacheData ?? {} })
        if (cachedResult.error) {
            throw {
                error: cachedResult.error,
                errorCode: cachedResult.errorCode,
            }
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type updateInvRequestArrangementCacheParam = {
    invRequest: InvRequestType
    invRequestArrangementData: SiteArrangementDataType
    accountId: string
    myCompanyId: string
    updatedAt?: number
}
export const updateInvRequestArrangementCache = async (params: updateInvRequestArrangementCacheParam) => {
    try {
        let { invRequest, invRequestArrangementData, accountId, myCompanyId, updatedAt } = params
        const invRequestArrangementDisplayCacheKey = genKeyName({
            screenName: 'InvRequestArrangement',
            accountId: accountId,
            companyId: myCompanyId as string,
            invRequestId: invRequest.invRequestId ?? 'no-id',
        })
        const invRequestArrangementDisplayCacheData = await getCachedData<InvRequestArrangementModel>(invRequestArrangementDisplayCacheKey)
        let _invRequestArrangementDisplayCacheData = cloneDeep(invRequestArrangementDisplayCacheData.success)
        // siteArrangementData更新
        if (_invRequestArrangementDisplayCacheData && _invRequestArrangementDisplayCacheData.invRequestArrangementData) {
            _invRequestArrangementDisplayCacheData.invRequestArrangementData = invRequestArrangementData
            _invRequestArrangementDisplayCacheData.updatedAt = updatedAt ?? Number(new Date())
        }
        if (_invRequestArrangementDisplayCacheData && _invRequestArrangementDisplayCacheData.invRequest?.invRequestArrangementData) {
            _invRequestArrangementDisplayCacheData.invRequest = {
                ...invRequest,
                date: invRequest?.date,
            } as InvRequestType
            _invRequestArrangementDisplayCacheData.invRequest.invRequestArrangementData = invRequestArrangementData
        }
        const cachedResult = await updateCachedData({ key: invRequestArrangementDisplayCacheKey, value: _invRequestArrangementDisplayCacheData ?? {} })
        if (cachedResult.error) {
            throw {
                error: cachedResult.error,
                errorCode: cachedResult.errorCode,
            }
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * onSetData - 新しくした手配データをsetStateするために使う
 * siteArrangements - その日の現場手配
 * invRequestArrangements - その日の常用で送る手配
 */
export type onPressAtPreSelfContentParam = {
    item: SiteArrangementWorkerType
    arrangeCount: number
    siteArrangementData?: SiteArrangementDataType
    keepSiteArrangementData?: SiteArrangementDataType
    invRequestArrangementData?: SiteArrangementDataType
    site?: SiteType
    respondRequest?: RequestType
    myCompanyId: string
    activeDepartmentIds: string[]
    t: TFunction
    _approveRequest?: (params: RequestType, isApprove: boolean) => void
    dispatch?: Dispatch<any>
    targetMeter?: SiteMeterType | RequestMeterType
    localPresentNum?: number
    invRequest?: InvRequestType
    onSetData?: (updateSiteArrangementsData: DateSiteArrangementType[], updateInvArrangementsData: DateSiteArrangementType[]) => void
    siteArrangements?: DateSiteArrangementType[]
    invRequestArrangements?: DateInvRequestArrangementType[]
}
/**
 * 自社作業員Boxからの手配(site/invRequest用)
 * @author kamiya
 * @returns boolean
 */
export const onPressAtPreSelfContent = async (params: onPressAtPreSelfContentParam): Promise<CustomResponse> => {
    try {
        let {
            item,
            arrangeCount,
            siteArrangementData,
            keepSiteArrangementData,
            invRequestArrangementData,
            site,
            respondRequest,
            myCompanyId,
            activeDepartmentIds,
            t,
            _approveRequest,
            dispatch,
            targetMeter,
            localPresentNum,
            invRequest,
            onSetData,
            siteArrangements,
            invRequestArrangements,
        } = params
        if (
            site?.construction?.contract?.receiveCompanyId == myCompanyId &&
            !checkMyDepartment({
                targetDepartmentIds: site?.construction?.contract?.receiveDepartmentIds,
                activeDepartmentIds,
            })
        ) {
            throw {
                error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments'),
                errorCode: 'UPDATE_ARRANGEMENT_ERROR',
            }
        }
        if (respondRequest && respondRequest?.isApplication == false) {
            throw {
                error: t('admin:YourSupportRequestHasBeenCanceled'),
                type: 'warn',
            }
        }
        if (respondRequest && respondRequest?.isApproval == 'waiting') {
            Alert.alert(t('admin:DoYouWishToApproveTheSupportRequest'), undefined, [
                {
                    text: t('admin:Approve'),
                    onPress: () => {
                        if (_approveRequest) {
                            _approveRequest(respondRequest as RequestType, true)
                        }
                    },
                },
                {
                    text: t('common:Cancel'),
                    style: 'cancel',
                },
            ])
            throw {
                error: t('admin:YourRequestHasNotBeenApproved'),
                type: 'warn',
            }
        }
        if (respondRequest && respondRequest?.isApproval == false) {
            throw {
                error: t('admin:ThisSupportRequestHasBeenDisapproved'),
            }
        }
        if (
            arrangeCount <= 0 &&
            item?.worker?.workerId &&
            ((site && siteArrangementData && targetMeter && localPresentNum != undefined) || (invRequestArrangementData && targetMeter && localPresentNum != undefined))
        ) {
            if (
                (item.worker.companyId != undefined && respondRequest?.companyId == item.worker.companyId) ||
                (siteArrangementData?.siteManageCompanyId == item.worker.companyId && item.worker.invRequestId)
            ) {
                throw {
                    error: t('admin:WeCantArrangeForACompanyToBeSentToTheSiteInSupport'),
                    type: 'warn',
                }
            }
            /**
             * 仮会社施工の場合は、比較しない。申請の場合も比較しない。
             */
            if (respondRequest != undefined && siteArrangementData && siteArrangementData?.siteRelation != 'fake-company-manager') {
                if ((targetMeter?.companyRequiredNum ?? 0) <= (localPresentNum ?? 0)) {
                    throw {
                        error: t('common:CannotArrangeMoreThanTheNoOfRequests'),
                        type: 'warn',
                    }
                }
            }
            if (item.worker.companyId != undefined && invRequest?.targetCompanyId == item.worker.companyId) {
                throw {
                    error: t('admin:ArrangementsCannotBeMadeWithTheSourceOfTheSupportApplication'),
                }
            }
            if (site?.siteRelation == 'fake-company-manager' && site?.fakeCompanyInvRequestId) {
                throw {
                    error: t('admin:PleaseMakeArrangementsThroughTheSendYourSupportScreen'),
                    type: 'warn',
                }
            }

            if (
                dispatch &&
                respondRequest == undefined &&
                site?.construction?.constructionMeter?.requiredNum &&
                site?.construction?.constructionMeter?.presentNum &&
                site?.construction?.constructionMeter?.requiredNum != 0 &&
                localPresentNum &&
                // //工事の必用人数 < 全現場の手配数 - 確定済みのこの現場の手配数 + 下書きのこの現場の手配数
                site?.construction?.constructionMeter?.requiredNum < site.construction?.constructionMeter?.presentNum - (keepSiteArrangementData?.subRespondCount ?? 0) + localPresentNum + 1
            ) {
                dispatch(
                    setToastMessage({
                        text: t('common:overRequiredWorkerNum'),
                        type: 'warn',
                    } as ToastMessage),
                )
            }
        }
        /**
         * 新規で作るarrangementのIdをDBと統一しないと、複数回のadd,deleteした際にローカルのIDとBDのIDでずれが出て、削除できない。
         */
        if (site && targetMeter && item?.worker?.workerId) {
            const keepTargetArrangementData = keepSiteArrangementData?.selfSide?.filter((self) => self?.targetArrangement?.workerId == item.worker?.workerId)[0]?.targetArrangement
            /**
             * localでsetStateを使わずに浅いコピーでsiteArrangementData(のなかのlocalWorker)のデータを直接書き換えている。
             */
            item = _addLocalInsideWorker(item, item?.worker?.workerId, site, myCompanyId, targetMeter, keepTargetArrangementData, respondRequest?.requestId)
        }
        /**
         * deepCloneが重くて、依頼数をオーバーすることを防ぐ。
         */

        if (invRequest == undefined && invRequestArrangementData != undefined) {
            throw {
                error: t('common:Reload'),
                errorCode: 'UPDATE_ARRANGEMENT_ERROR',
            }
        }
        if (item?.worker?.workerId && invRequestArrangementData && targetMeter && invRequest?.invRequestId) {
            item = _addInvRequestLocalInsideWorker(item, item?.worker?.workerId, invRequest?.invRequestId, targetMeter, invRequest)
        }

        let newDateSiteArrangements: DateSiteArrangementType[] = []
        let newDateInvArrangements: DateInvRequestArrangementType[] = []
        let targetSiteArrangementData: DateSiteArrangementType | undefined = undefined
        if (siteArrangementData) {
            //現場手配の変更
            /**
             * 全現場に反映が必要なのは、selfSideのdailyArrangementsとdailyInvRequests
             * arrangeableWorkersは同日重複を考慮しないので、反映させなくていい。
             */
            targetSiteArrangementData = {
                ...siteArrangements?.find((sArr) => (sArr.request?.requestId ?? sArr.siteId) == (respondRequest?.requestId ?? site?.siteId)),
                siteArrangementData: siteArrangementData,
                localPresentNum: (localPresentNum ?? 0) + 1,
            }
        }
        let targetInvArrangementData: DateInvRequestArrangementType | undefined = undefined
        if (invRequestArrangementData) {
            //常用で送る手配の変更
            /**
            invRequestArrangementDataにinvRequestWorkersを反映させてからLocalに保存
            作業員を追加したら、invRequest内のworkerIdsなどが変わるため、すべての作業員の情報を更新する必要がある。
            */
            const newSelfSide = invRequestArrangementData?.selfSide?.map((side) => {
                if (side.targetInvRequest) {
                    const _side: SiteArrangementWorkerType = {
                        ...side,
                        targetInvRequest: invRequest,
                    }
                    return _side
                } else {
                    return side
                }
            })

            targetInvArrangementData = {
                ...invRequestArrangements?.find((iArr) => iArr.invRequestId == invRequest?.invRequestId),
                invRequestArrangementData: {
                    ...invRequestArrangementData,
                    selfSide: newSelfSide,
                },
                localPresentNum: (localPresentNum ?? 0) + 1,
            }
        }
        const _targetArrangement = targetSiteArrangementData?.siteArrangementData?.selfSide?.filter((self) => self.worker?.workerId == item.worker?.workerId)[0]?.targetArrangement
        const _targetInvRequest = targetInvArrangementData?.invRequestArrangementData?.selfSide?.filter((self) => self.worker?.workerId == item.worker?.workerId)[0]?.targetInvRequest
        const _siteArrangements =
            siteArrangements?.map((dArr) => {
                const _dateSiteArrangement: DateSiteArrangementType = {
                    ...dArr,
                    siteArrangementData: {
                        ...dArr.siteArrangementData,
                        selfSide:
                            dArr.siteArrangementData?.selfSide?.map((self) => {
                                if (self.worker?.workerId == item.worker?.workerId) {
                                    const _self: SiteArrangementWorkerType = {
                                        ...self,
                                        dailyArrangements: {
                                            //変更を加えた現場のみdailyArrangementsにあらかじめ入っているためuniqByが必要
                                            items: uniqBy([_targetArrangement, ...(self.dailyArrangements?.items ?? [])].filter((data) => data != undefined) as ArrangementType[], 'arrangementId'),
                                        },
                                        dailyInvRequests: {
                                            items: [_targetInvRequest, ...(self.dailyInvRequests?.items ?? [])].filter((data) => data != undefined) as RequestType[],
                                        },
                                    }
                                    return _self
                                } else {
                                    return self
                                }
                            }) ?? [],
                    },
                }
                return _dateSiteArrangement
            }) ?? []
        newDateSiteArrangements = targetSiteArrangementData ? uniqBy([targetSiteArrangementData, ..._siteArrangements], 'siteArrangementId') : _siteArrangements

        const _localSiteArrangements =
            invRequestArrangements?.map((iArr) => {
                const _siteArrangement: DateInvRequestArrangementType = {
                    ...iArr,
                    invRequestArrangementData: {
                        ...iArr.invRequestArrangementData,
                        selfSide:
                            iArr.invRequestArrangementData?.selfSide?.map((self) => {
                                if (self.worker?.workerId == item.worker?.workerId) {
                                    const _self: SiteArrangementWorkerType = {
                                        ...self,
                                        dailyArrangements: {
                                            items: [_targetArrangement, ...(self.dailyArrangements?.items ?? [])].filter((data) => data != undefined) as ArrangementType[],
                                        },
                                        dailyInvRequests: {
                                            items: uniqBy([_targetInvRequest, ...(self.dailyInvRequests?.items ?? [])].filter((data) => data != undefined) as InvRequestType[], 'invRequestId'),
                                        },
                                    }
                                    return _self
                                } else {
                                    return self
                                }
                            }) ?? [],
                    },
                }
                return _siteArrangement
            }) ?? []
        newDateInvArrangements = targetInvArrangementData ? uniqBy([targetInvArrangementData, ..._localSiteArrangements], 'invRequestId') : _localSiteArrangements
        if (onSetData) {
            onSetData(newDateSiteArrangements, newDateInvArrangements)
        }
        //下書きへの保存はonSetDataより後にしないと操作性が悪くなる。
        const newLocalSiteArrangements = newDateSiteArrangements?.map((dateSiteArrangement) => {
            const _siteArrangementData: writeLocalSiteArrangementParam = {
                siteArrangement: dateSiteArrangement.siteArrangementData,
                siteArrangementId: dateSiteArrangement.request?.requestId ?? dateSiteArrangement.siteId,
                meter: dateSiteArrangement.targetMeter,
                companyRequiredNum: dateSiteArrangement?.request?.requestCount ?? dateSiteArrangement?.site?.requiredNum ?? 0,
            }
            return _siteArrangementData
        })
        if (newLocalSiteArrangements.length > 0) {
            const result = await writeLocalSiteArrangements(newLocalSiteArrangements)
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        }
        const newLocalInvRequestArrangements = newDateInvArrangements?.map((dateInvArrangement) => {
            const _siteArrangementData: writeLocalSiteArrangementParam = {
                siteArrangement: dateInvArrangement.invRequestArrangementData,
                siteArrangementId: dateInvArrangement.invRequestId,
                meter: dateInvArrangement.targetMeter,
                companyRequiredNum: dateInvArrangement?.invRequest?.workerCount ?? 0,
            }
            return _siteArrangementData
        })
        if (newLocalInvRequestArrangements.length > 0) {
            const result = await writeLocalSiteArrangements(newLocalInvRequestArrangements)
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        }
        return Promise.resolve({ success: true })
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * onSetData - 新しくした手配データをsetStateするために使う
 * siteArrangements - その日の現場手配
 * invRequestArrangements - その日の常用で送る手配
 */
export type onPressAtPostSelfContentParam = {
    item: SiteArrangementWorkerType
    siteArrangementData?: SiteArrangementDataType
    invRequestArrangementData?: SiteArrangementDataType
    site?: SiteType
    respondRequest?: RequestType
    myCompanyId: string
    activeDepartmentIds: string[]
    t: TFunction
    targetMeter?: SiteMeterType | RequestMeterType
    invRequest?: InvRequestType
    onSetData?: (updateSiteArrangementsData: DateSiteArrangementType[], updateInvArrangementsData: DateSiteArrangementType[]) => void
    siteArrangements?: DateSiteArrangementType[]
    invRequestArrangements?: DateInvRequestArrangementType[]
    localPresentNum?: number
}

/**
 * 自社作業員Boxからの手配削除(site/invRequest用)
 * @author kamiya
 * @returns boolean
 */
export const onPressAtPostSelfContent = async (params: onPressAtPostSelfContentParam): Promise<CustomResponse> => {
    try {
        let {
            item,
            siteArrangementData,
            invRequestArrangementData,
            site,
            respondRequest,
            myCompanyId,
            activeDepartmentIds,
            t,
            targetMeter,
            invRequest,
            onSetData,
            siteArrangements,
            invRequestArrangements,
            localPresentNum,
        } = params
        if (site?.siteRelation == 'fake-company-manager' && site?.fakeCompanyInvRequestId) {
            throw {
                error: t('admin:PleaseMakeArrangementsThroughTheSendYourSupportScreen'),
            }
        }
        if (
            site?.construction?.contract?.receiveCompanyId == myCompanyId &&
            !checkMyDepartment({
                targetDepartmentIds: site?.construction?.contract?.receiveDepartmentIds,
                activeDepartmentIds,
            })
        ) {
            throw {
                error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments'),
                errorCode: 'UPDATE_ARRANGEMENT_ERROR',
            }
        }
        /**
         * 自分の部署以外の作業員かどうかを判別する
         */
        const isDifferentDepartment = !(
            item.worker?.invRequestId != undefined ||
            checkMyDepartment({
                targetDepartmentIds: item.worker?.departmentIds,
                activeDepartmentIds,
            })
        )
        if (isDifferentDepartment) {
            throw {
                error: t('admin:TheWorkerIsInAnotherDepartmentPleaseSwitchDepartments'),
                errorCode: 'PRESS_POST_SELF_ERROR',
                type: 'error',
            }
        }

        let newDateSiteArrangements: DateSiteArrangementType[] = []
        let newDateInvArrangements: DateInvRequestArrangementType[] = []
        if ((item.worker?.workerId && site && siteArrangementData && targetMeter) || (item.worker?.workerId && invRequestArrangementData && invRequest?.invRequestId && targetMeter)) {
            let targetSiteArrangementData: DateSiteArrangementType | undefined = undefined
            if (site && targetMeter && siteArrangementData) {
                /**
                 * localでsetStateを使わずに浅いコピーでsiteArrangementDataのデータを直接書き換えている。
                 */
                item = _deleteLocalInsideWorkerForTargetSite(item, item.worker?.workerId, site.siteId ?? 'no-id', targetMeter)

                targetSiteArrangementData = {
                    ...siteArrangements?.find((sArr) => (sArr.request?.requestId ?? sArr.siteId) == (respondRequest?.requestId ?? site?.siteId)),
                    siteArrangementData: siteArrangementData,
                    localPresentNum: (localPresentNum ?? 0) - 1,
                }
            }
            const _siteArrangements =
                siteArrangements
                    ?.filter((data) => data.siteArrangementId != (targetSiteArrangementData?.request?.requestId ?? targetSiteArrangementData?.siteId))
                    ?.map((sArr) => {
                        const _siteArrangement: DateSiteArrangementType = {
                            ...sArr,
                            siteArrangementData: {
                                ...sArr.siteArrangementData,
                                selfSide:
                                    sArr.siteArrangementData?.selfSide?.map((self) => {
                                        if (self.worker?.workerId == item.worker?.workerId) {
                                            const _self: SiteArrangementWorkerType = {
                                                ...self,
                                                dailyArrangements: {
                                                    items: [...(self.dailyArrangements?.items?.filter((arr) => arr.workerId == item.worker?.workerId && arr.siteId != site?.siteId) ?? [])],
                                                },
                                                dailyInvRequests: {
                                                    items: [...(self.dailyInvRequests?.items?.filter((inv) => inv.invRequestId != invRequest?.invRequestId) ?? [])],
                                                },
                                            }
                                            return _self
                                        } else {
                                            return self
                                        }
                                    }) ?? [],
                            },
                        }
                        return _siteArrangement
                    }) ?? []
            newDateSiteArrangements = targetSiteArrangementData ? uniqBy([targetSiteArrangementData, ..._siteArrangements], 'siteArrangementId') : _siteArrangements

            let targetInvArrangementData: DateInvRequestArrangementType | undefined = undefined
            if (invRequestArrangementData && invRequest?.invRequestId && targetMeter && invRequest && onSetData) {
                item = _deleteInvRequestLocalInsideWorker(item, invRequest?.invRequestId, targetMeter, invRequest)
                /**
                Localに保存する場合は、invRequestArrangementDataにinvRequestWorkersを反映させてから
                作業員を削除したら、invRequest内のworkerIdsなどが変わるため、すべての作業員の情報を更新する必要がある。
                */
                const newSelfSide = invRequestArrangementData?.selfSide?.map((side) => {
                    if (side.targetInvRequest) {
                        const _side: SiteArrangementWorkerType = {
                            ...side,
                            targetInvRequest: invRequest,
                        }
                        return _side
                    } else {
                        return side
                    }
                })
                targetInvArrangementData = {
                    ...invRequestArrangements?.find((iArr) => iArr.invRequestId == invRequest?.invRequestId),
                    invRequestArrangementData: {
                        ...invRequestArrangementData,
                        selfSide: newSelfSide,
                    },
                    localPresentNum: (localPresentNum ?? 0) - 1,
                }
            }

            const _localSiteArrangements =
                invRequestArrangements?.map((iArr) => {
                    const _siteArrangement: DateInvRequestArrangementType = {
                        ...iArr,
                        invRequestArrangementData: {
                            ...iArr.invRequestArrangementData,
                            selfSide:
                                iArr.invRequestArrangementData?.selfSide?.map((self) => {
                                    if (self.worker?.workerId == item.worker?.workerId) {
                                        const _self: SiteArrangementWorkerType = {
                                            ...self,
                                            dailyArrangements: {
                                                items: [...(self.dailyArrangements?.items?.filter((arr) => arr.workerId == item.worker?.workerId && arr.siteId != site?.siteId) ?? [])],
                                            },
                                            dailyInvRequests: {
                                                items: [...(self.dailyInvRequests?.items?.filter((inv) => inv.invRequestId != invRequest?.invRequestId) ?? [])],
                                            },
                                        }
                                        return _self
                                    } else {
                                        return self
                                    }
                                }) ?? [],
                        },
                    }
                    return _siteArrangement
                }) ?? []
            newDateInvArrangements = targetInvArrangementData ? uniqBy([targetInvArrangementData, ..._localSiteArrangements], 'invRequestId') : _localSiteArrangements
            if (onSetData) {
                onSetData(newDateSiteArrangements, newDateInvArrangements)
            }
            //下書きへの保存はonSetDataより後にしないと操作性が悪くなる。
            const newLocalSiteArrangements = newDateSiteArrangements?.map((dateSiteArrangement) => {
                const _siteArrangementData: writeLocalSiteArrangementParam = {
                    siteArrangement: dateSiteArrangement.siteArrangementData,
                    siteArrangementId: dateSiteArrangement.request?.requestId ?? dateSiteArrangement.siteId,
                    meter: dateSiteArrangement.targetMeter,
                    companyRequiredNum: dateSiteArrangement?.request?.requestCount ?? dateSiteArrangement?.site?.requiredNum ?? 0,
                }
                return _siteArrangementData
            })
            if (newLocalSiteArrangements.length > 0) {
                const result = await writeLocalSiteArrangements(newLocalSiteArrangements)
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            }
            const newLocalInvRequestArrangements = newDateInvArrangements?.map((dateInvArrangement) => {
                const _siteArrangementData: writeLocalSiteArrangementParam = {
                    siteArrangement: dateInvArrangement.invRequestArrangementData,
                    siteArrangementId: dateInvArrangement.invRequestId,
                    meter: dateInvArrangement.targetMeter,
                    companyRequiredNum: dateInvArrangement?.invRequest?.workerCount ?? 0,
                }
                return _siteArrangementData
            })
            if (newLocalInvRequestArrangements.length > 0) {
                const result = await writeLocalSiteArrangements(newLocalInvRequestArrangements)
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            }
        }
        return Promise.resolve({ success: true })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type setToHolidayAtSiteParam = {
    localWorker?: SiteArrangementWorkerType
    myCompanyId?: string
    myWorkerId?: string
    siteArrangementData?: SiteArrangementDataType
    invRequestArrangementData?: SiteArrangementDataType
    targetMeter?: SiteMeterType | RequestMeterType
    respondRequestId?: string
    siteId?: string
    invRequest?: InvRequestType
}
export const setToHolidayAtSite = async (params: setToHolidayAtSiteParam) => {
    try {
        let { localWorker, myCompanyId, myWorkerId, siteArrangementData, invRequestArrangementData, targetMeter, respondRequestId, siteId, invRequest } = params
        if (localWorker?.worker?.companyId != myCompanyId) {
            return
        }
        const lockResult = await updateLockOfTarget({
            myWorkerId: myWorkerId ?? 'no-id',
            targetId: localWorker?.worker?.workerId ?? 'no-id',
            modelType: 'worker',
        })
        if (lockResult.error) {
            throw {
                error: lockResult.error,
                errorCode: lockResult.errorCode,
            }
        }
        const result = await setWorkerToHoliday({
            workerId: localWorker?.worker?.workerId ?? 'no-id',
            date: siteArrangementData?.date ?? invRequest?.date,
        })
        /**
         * Local反映
         */
        if (localWorker?.worker?.workerTags) {
            localWorker.worker.workerTags[localWorker.worker.workerTags.length] = 'is-holiday'
        }
        if (localWorker?.worker?.otherOffDays) {
            localWorker.worker.otherOffDays[localWorker.worker.otherOffDays.length] = getDailyStartTime(newCustomDate()).totalSeconds
        }
        const localUpdateResult = await writeLocalSiteArrangement({
            siteArrangement: siteArrangementData ?? invRequestArrangementData,
            siteArrangementId: invRequest?.invRequestId ?? respondRequestId ?? siteId,
            meter: targetMeter,
        })
        if (localUpdateResult.error) {
            throw {
                error: localUpdateResult.error,
                errorCode: localUpdateResult.errorCode,
            }
        }
        const lockResult2 = await updateLockOfTarget({
            myWorkerId: myWorkerId ?? 'no-id',
            targetId: localWorker?.worker?.workerId ?? 'no-id',
            modelType: 'worker',
            unlock: true,
        })
        if (lockResult2.error) {
            throw {
                error: lockResult.error,
                errorCode: lockResult.errorCode,
            }
        }
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}
export type onPressAtPreOtherContentParam = {
    item: SiteArrangementCompanyType
    siteArrangementData?: SiteArrangementDataType
    keepSiteArrangementData?: SiteArrangementDataType
    invRequestArrangementData?: SiteArrangementDataType
    site?: SiteType
    respondRequest?: RequestType
    myCompanyId: string
    activeDepartmentIds: string[]
    t: TFunction
    _approveRequest?: (params: RequestType, isApprove: boolean) => void
    dispatch?: Dispatch<any>
    targetMeter?: SiteMeterType | RequestMeterType
    localPresentNum?: number
    invRequest?: InvRequestType
    onSetData?: (invRequestArrangementData: SiteArrangementDataType) => void
}

/**
 * 他社作業員Boxからの手配(site/invRequest用)
 * @author kamiya
 * @returns boolean
 */
export const onPressAtPreOtherContent = async (params: onPressAtPreOtherContentParam): Promise<CustomResponse> => {
    try {
        let {
            item,
            siteArrangementData,
            keepSiteArrangementData,
            invRequestArrangementData,
            site,
            respondRequest,
            myCompanyId,
            activeDepartmentIds,
            t,
            _approveRequest,
            dispatch,
            targetMeter,
            localPresentNum,
            invRequest,
            onSetData,
        } = params
        if (
            site?.construction?.contract?.receiveCompanyId == myCompanyId &&
            !checkMyDepartment({
                targetDepartmentIds: site?.construction?.contract?.receiveDepartmentIds,
                activeDepartmentIds,
            })
        ) {
            throw {
                error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments'),
                errorCode: 'UPDATE_ARRANGEMENT_ERROR',
            }
        }
        if (respondRequest && respondRequest?.isApplication == false) {
            throw {
                error: t('admin:YourSupportRequestHasBeenCanceled'),
                type: 'warn',
            }
        }
        if (respondRequest && respondRequest?.isApproval == 'waiting') {
            Alert.alert(t('admin:DoYouWishToApproveTheSupportRequest'), undefined, [
                {
                    text: t('admin:Approve'),
                    onPress: () => {
                        if (_approveRequest) {
                            _approveRequest(respondRequest as RequestType, true)
                        }
                    },
                },
                {
                    text: t('common:Cancel'),
                    style: 'cancel',
                },
            ])
            throw {
                error: t('admin:YourRequestHasNotBeenApproved'),
                type: 'warn',
            }
        }
        if (respondRequest && respondRequest?.isApproval == false) {
            throw {
                error: t('admin:ThisSupportRequestHasBeenDisapproved'),
            }
        }
        if (site && siteArrangementData && targetMeter && localPresentNum != undefined) {
            /**
             * 仮会社施工・常用で送るの場合は比較しない。
             */
            if (respondRequest != undefined && siteArrangementData.siteRelation != 'fake-company-manager') {
                if ((targetMeter.companyRequiredNum ?? 0) <= (localPresentNum ?? 0)) {
                    throw {
                        error: t('common:CannotArrangeMoreThanTheNoOfRequests'),
                        type: 'warn',
                    }
                }
            }
            if (site?.siteRelation == 'fake-company-manager' && site?.fakeCompanyInvRequestId) {
                throw {
                    error: t('admin:PleaseMakeArrangementsThroughTheSendYourSupportScreen'),
                }
            }
            if (
                dispatch &&
                //現場手配での条件
                respondRequest == undefined &&
                localPresentNum &&
                site?.construction?.constructionMeter?.requiredNum &&
                site?.construction?.constructionMeter?.presentNum &&
                site?.construction?.constructionMeter?.requiredNum != 0 &&
                site?.construction?.constructionMeter?.requiredNum < site.construction?.constructionMeter?.presentNum - (keepSiteArrangementData?.subRespondCount ?? 0) + localPresentNum + 1
            ) {
                //工事の予定人数を超過した場合にワーニングを出す。
                dispatch(
                    setToastMessage({
                        text: t('common:overRequiredWorkerNum'),
                        type: 'warn',
                    } as ToastMessage),
                )
            }
        }
        //常用で送る場合は、仮会社へ送る場合に限定する。
        if (siteArrangementData != undefined || (targetMeter && invRequestArrangementData && localPresentNum != undefined)) {
            /**
             *  その会社への初の常用依頼の場合は常用依頼IDはあらかじめ設定しておく。
             */
            const _requestId = item?.targetRequest?.requestId ?? getUuidv4()
            item.targetRequest = {
                ...item?.targetRequest,
                requestId: _requestId,
                requestedCompanyId: item.requestedCompany?.companyId,
                reservationId: item.targetReservation?.reservationId ?? item?.targetRequest?.reservationId,
                siteId: site?.siteId,
            }

            if (siteArrangementData && targetMeter && onSetData) {
                const preRequest = keepSiteArrangementData?.otherSide?.find((side) => side.targetRequest?.requestId == item.targetRequest?.requestId)?.targetRequest
                //現場手配の場合
                item = _addLocalOutsideWorker(item, targetMeter, undefined, preRequest)
                onSetData(siteArrangementData)
                const result = await writeLocalSiteArrangement({
                    siteArrangement: siteArrangementData,
                    siteArrangementId: respondRequest?.requestId ?? site?.siteId,
                    meter: targetMeter,
                    companyRequiredNum: respondRequest?.requestCount ?? site?.requiredNum ?? 0,
                })
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            }
            if (invRequestArrangementData && targetMeter && onSetData) {
                //常用で送る手配の場合
                /**
                 * localでsetStateを使わずに浅いコピーでsiteArrangementDataのデータを直接書き換えている。
                 */
                const preRequest = keepSiteArrangementData?.otherSide?.find((side) => side.targetRequest?.requestId == item.targetRequest?.requestId)?.targetRequest

                item = _addLocalOutsideWorker(item, targetMeter, undefined, preRequest)
                onSetData(invRequestArrangementData)
                const result = await writeLocalSiteArrangement({
                    siteArrangement: invRequestArrangementData,
                    siteArrangementId: invRequest?.invRequestId,
                    meter: targetMeter,
                    companyRequiredNum: invRequest?.workerCount ?? 0,
                })
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            }
        }
        return Promise.resolve({ success: true })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type onPressAtPostOtherContentParam = {
    item: SiteArrangementCompanyType
    siteArrangementData?: SiteArrangementDataType
    keepSiteArrangementData?: SiteArrangementDataType
    invRequestArrangementData?: SiteArrangementDataType
    site?: SiteType
    respondRequest?: RequestType
    myCompanyId: string
    activeDepartmentIds: string[]
    t: TFunction
    targetMeter?: SiteMeterType | RequestMeterType
    invRequest?: InvRequestType
    onSetData?: (invRequestArrangementData: SiteArrangementDataType) => void
    arrangeCount?: number
}

/**
 * 他社作業員Boxからの手配削除(site/invRequest用)
 * @author kamiya
 * @returns boolean
 */
export const onPressAtPostOtherContent = async (params: onPressAtPostOtherContentParam): Promise<CustomResponse> => {
    try {
        let {
            item,
            siteArrangementData,
            keepSiteArrangementData,
            invRequestArrangementData,
            site,
            respondRequest,
            myCompanyId,
            activeDepartmentIds,
            t,
            targetMeter,
            invRequest,
            onSetData,
            arrangeCount,
        } = params
        if (
            site?.construction?.contract?.receiveCompanyId == myCompanyId &&
            !checkMyDepartment({
                targetDepartmentIds: site?.construction?.contract?.receiveDepartmentIds,
                activeDepartmentIds,
            })
        ) {
            throw {
                error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments'),
                errorCode: 'UPDATE_ARRANGEMENT_ERROR',
            }
        }
        if (arrangeCount && ((arrangeCount >= 1 && site && siteArrangementData && targetMeter) || (arrangeCount >= 1 && invRequestArrangementData && targetMeter))) {
            if (item?.targetRequest?.requestId == undefined) {
                throw {
                    error: t('common:CompanyInfoIncomplete'),
                    type: 'warn',
                }
            }
            if (site?.siteRelation == 'fake-company-manager' && site?.fakeCompanyInvRequestId) {
                throw {
                    error: t('admin:PleaseMakeArrangementsThroughTheSendYourSupportScreen'),
                }
            }
            if (targetMeter == undefined && targetMeter == undefined) {
                throw {
                    error: '情報が足りません',
                    errorCode: 'PRESS_POST_OTHER_ERROR',
                }
            }
            const preRequest = keepSiteArrangementData?.otherSide?.find((side) => side.targetRequest?.requestId == item.targetRequest?.requestId)?.targetRequest
            /**
             * localでsetStateを使わずに浅いコピーでsiteArrangementDataのデータを直接書き換えている。
             */
            item = _deleteLocalOutsideWorker(item, targetMeter, undefined, preRequest)
            if (onSetData) {
                onSetData(invRequestArrangementData ?? (siteArrangementData as SiteArrangementDataType))
            }

            const result = await writeLocalSiteArrangement({
                siteArrangement: invRequestArrangementData ?? siteArrangementData,
                siteArrangementId: invRequest?.invRequestId ?? respondRequest?.requestId ?? site?.siteId,
                meter: targetMeter ?? targetMeter,
                companyRequiredNum: invRequest?.workerCount ?? respondRequest?.requestCount ?? site?.requiredNum ?? 0,
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        }
        return Promise.resolve({ success: true })
    } catch (error) {
        return getErrorMessage(error)
    }
}
