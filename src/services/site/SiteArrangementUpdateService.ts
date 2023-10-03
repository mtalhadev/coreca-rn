/* eslint-disable indent */
import { _callFunctions } from '../firebase/FunctionsService'
import { SiteCLType, SiteType } from '../../models/site/Site'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'
import { WorkerCLType, WorkerType } from '../../models/worker/Worker'
import { ReservationCLType, ReservationType } from '../../models/reservation/Reservation'
import { ArrangementWorkerType } from '../../models/worker/ArrangementWorkerListType'
import { AttendanceType } from '../../models/attendance/Attendance'
import { ID } from '../../models/_others/ID'

/**
 * @requires
 * @param myCompanyId - 自社
 * @param siteId - 手配する現場
 * @param workerIds - 手配する自社作業員リスト。
 * @param myWorkerId - 自身。作成者を特定するため。
 * @partial
 * @param respondRequestId - 常用現場の時のみ入力必須
 * @param newArrangementIds - 手配IDリストの外部指定用。indexはworkerIdsと揃える。
 * @param workers - 作業員リスト。入力すると所属確認を省略できる。
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
    workers?: ArrangementWorkerType[]
    isFakeCompanyManageSite?: boolean
    fakeCompanyInvRequestId?: string
}

/**
 * 追加したAttendanceを返す。
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
 * @returns - {@link AddInsideWorkersArrangementResponse}
 */
export const _addInsideWorkersArrangement = async (params: AddInsideWorkersArrangementParam): Promise<CustomResponse<AddInsideWorkersArrangementResponse>> => {
    try {
        const result = await _callFunctions('ISiteArrangementUpdate-addInsideWorkersArrangement', params)
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
    site?: SiteType | SiteCLType
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
export const _deleteInsideWorkerArrangement = async (params: DeleteInsideWorkerParam): Promise<CustomResponse<DeleteInsideWorkerResponse>> => {
    try {
        const result = await _callFunctions('ISiteArrangementUpdate-deleteInsideWorkerArrangement', params)
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
 */
export type AddOutSideWorkerParam = {
    myCompanyId: string
    siteId: string
    requestedCompanyId: string
    myWorkerId: string
    addCount: number
    reservationId: string
    targetRequestId: string

    reservation?: ReservationType | ReservationCLType
    respondRequestId?: string
    isFakeCompanyManageSite?: boolean
    isFakeRequestedCompany?: boolean
    isApproval?: boolean | 'waiting'
    isApplication?: boolean
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
export const _addOutsideWorkerRequest = async (params: AddOutSideWorkerParam): Promise<CustomResponse<AddOutSideWorkerResponse>> => {
    try {
        const result = await _callFunctions('ISiteArrangementUpdate-addOutsideWorkerRequest', params)
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
    isApproval?: boolean | 'waiting'
    isApplication?: boolean
}
/**
 * 削除したArrangementId
 */
export type DeleteOutSideWorkerResponse = ID[] | undefined
/**
 *
 * @param params - {@link DeleteOutSideWorkerParam}
 * @returns - {@link DeleteOutSideWorkerResponse}
 */
export const _deleteOutsideWorkerRequest = async (params: DeleteOutSideWorkerParam): Promise<CustomResponse<DeleteOutSideWorkerResponse>> => {
    try {
        const result = await _callFunctions('ISiteArrangementUpdate-deleteOutsideWorkerRequest', params)
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
