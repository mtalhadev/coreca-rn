import { GetArrangementOptionParam } from '../arrangement/Arrangement'
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common'
import { CompanyCLType, CompanyType, toCompanyCLType } from '../company/Company'
import { RequestRelationType } from './RequestRelationType'
import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker'
import { ArrangementListCLType, ArrangementListType, toArrangementListCLType } from '../arrangement/ArrangementListType'
import { GetOptionObjectType, GetOptionParam, OptionType } from '../_others/Option'
import { SiteCLType, SiteType, toSiteCLType } from '../site/Site'
import { RequestMeterCLType, RequestMeterType, toRequestMeterCLType } from './RequestMeterType'
import { ReservationCLType, ReservationType, toReservationCLType } from '../reservation/Reservation'
import { RequestListCLType, RequestListType, toRequestListCLType } from './RequestListType'
import { AttendanceListCLType, AttendanceListType, toAttendanceListCLType } from '../attendance/AttendanceListType'
import { CustomDate, toCustomDateFromTotalSeconds } from '../_others/CustomDate'
import { ID } from '../_others/ID'
import { TotalSeconds } from '../_others/TotalSeconds'

/**
 *
 * @param respondRequestId - 多重階層依頼の場合の依頼元の常用依頼。元請け寄りの常用依頼。\
 * 現場直下の場合は'top'が入る。topを入れる理由はクエリーを投げられるようにするため（Firestoreはundefinedではフィルターできない）。
 * @param requestedCompanyManagerId - 常用依頼ごとの責任者の作業員ID。
 * @param requestCount - 常用依頼数。
 * @param reservationId - 常用依頼において使用した常用予約。会社と日付から取得することも可能だが、効率化のため。
 * @param stockedAttendanceIds - 未使用の勤怠IDを保存する。手配や常用依頼で使用する度に減らし、常用依頼なら依頼数分を移行する。
 *  ---
 *  #### 目的
 *  このデータがないと多重階層手配において勤怠の情報を取るために下位の常用依頼木構造を全て取得する必要があり重たい。\
 *  このデータで常用依頼の多重構造を勤怠で串を通せるので、２頭身以上離れた常用依頼を取得する必要がなくなる。
 *  ---
 *  #### 仮会社施工の場合
 *  仮会社施工の場合は常に空。\
 *  理由：initialStockedAttendanceIdsのみでIDを管理するため。仮会社施工への手配フローが、仮会社から依頼された瞬間、応答しているような流れでもあるのでstockは常に枯らしているイメージ。
 * @param initialStockedAttendanceIds - 勤怠IDを保存する。stockedAttendanceIdsは未使用分のみだが、この項目では全て保存する。
 *  - 仮会社施工現場以外 - requestCountとlengthが一致する。
 *  - 仮会社施工現場 - requestCountとlengthが一致しない。理由：requestCountが確定事項ではなく必要目安になるから。
 *  ---
 *  #### 目的
 *  この常用依頼における勤怠データ一覧を取得するため。
 * @param isFakeCompanyRequest - 仮会社施工の自社への常用依頼かどうか判定。
 * @param date - 日付。現場に合わせる。最適化用
 * @param isApproval 承認の可否。falseは拒否。waitingは承認まち
 * @param isApplication 申請状況。falseは未申請。trueは申請済み。現場確定時にtrueになる。
 */
export type RequestModel = Partial<{
    requestId: ID
    siteId: ID
    respondRequestId: ID | 'top'
    companyId: ID
    requestedCompanyId: ID
    requestedCompanyManagerId: ID
    updateWorkerId: ID
    isConfirmed: boolean

    requestCount: number
    reservationId: ID
    stockedAttendanceIds: ID[]
    initialStockedAttendanceIds: ID[]
    isFakeCompanyRequest: boolean

    date: TotalSeconds
    isApproval: boolean | 'waiting'
    isApplication: boolean// 申請。falseは未申請（申請後に手配を変更したときや、手配後現場未確定の場合など）
}> &
    CommonModel

export const initRequest = (request: Create<RequestModel> | Update<RequestModel>): Update<RequestModel> => {
    const newRequest: Update<RequestModel> = {
        requestId: request.requestId,
        respondRequestId: request.respondRequestId,
        siteId: request.siteId,
        companyId: request.companyId,
        requestedCompanyId: request.requestedCompanyId,
        requestedCompanyManagerId: request.requestedCompanyManagerId,
        updateWorkerId: request.updateWorkerId,
        isConfirmed: request.isConfirmed,
        requestCount: request.requestCount,
        reservationId: request.reservationId,
        stockedAttendanceIds: request.stockedAttendanceIds,
        initialStockedAttendanceIds: request.initialStockedAttendanceIds,
        isFakeCompanyRequest: request.isFakeCompanyRequest,
        date: request.date,
        isApproval: request.isApproval,
        isApplication: request.isApplication,
    }
    return newRequest
}

/**
 * {@link WorkerOptionInputParam - 説明}
 *
 */
export type RequestOptionInputParam = ReplaceAnd<
    GetOptionObjectType<RequestOptionParam>,
    {
        requestRelation: OptionType<{
            companyId: ID
        }>
        requestMeter: OptionType<{
            companyId?: ID
            arrangementOptions?: GetArrangementOptionParam
            requestOptions?: GetRequestOptionParam
        }>
    }
>

export type GetRequestOptionParam = GetOptionParam<RequestType, RequestOptionParam, RequestOptionInputParam>

/**
 * {@link WorkerOptionParam - 説明}
 * @param superRequest - 上位の常用依頼。respondRequestIdから取得した常用依頼
 * @param usedStockedAttendanceIds - 使用済みの勤怠ID。initialStockedAttendanceIdsとstockedAttendanceIdsとの差分。subAttendancesのidと一致するはず。
 *
 * ---
 *
 * #### 常用依頼への応答を取得したい
 * @param subRequests - 常用依頼への応答のうち、常用依頼による応答
 * @param subArrangements - 常用依頼への応答のうち、自社作業員の手配による応答
 * @param subRespondCount - 直下の応答数。常用依頼した側目線では「暫定常用数」とも呼ぶ。subRequestsとsubArrangementsから計算される。これを指定するとsubRespondCountとsubRequestsも同時に取得される。
 * ２階層以上の常用依頼する場合、さらに常用依頼先で応答を待つ必要があるので、あくまで「予定」とする。請求対象。
 * @param subActualRespondCount - 直下の稼働数をカウント。手配したうちの常用依頼において応答されているものを取得。
 * @param subUnreportedCount - 直下の未報告数をカウント。
 * @param subWaitingCount - 直下の応答待ちをカウント。
 *
 * ---
 * #### 勤怠を取得したい
 * @param subAttendances - 常用依頼下の全勤怠リスト（直下ではなく全て）。勤怠が存在しない場合は取得不可。作業員未確定の場合も必ず勤怠は存在するので、取得可能。
 * @param subConfirmedRespondAttendances - 応答完了した勤怠りスト。subAttendancesから応答完了のみ取得。「応答完了」とは、複数階層の常用依頼などにおいて最下層まで手配まで完了したもの。\
 * 常用依頼した側目線では「常用確定数」とも呼ぶ。\
 * 例）A:（Bへの常用依頼：5名） => B:（自社応答：1名、Cへの常用依頼：3名） => C（自社応答：２名）\
 * 上記の常用依頼フローの場合。Aからしたら暫定常用は4名、常用確定は２名となる。Bからしたら暫定常用は2名、常用確定も２名となる。
 * @param subConfirmedRespondCount - 応答完了した数。
 *
 * @param subUnconfirmedRespondAttendances - 作業員未確定の勤怠リストを取得。subAttendancesから応答未完了=作業員未確定のみ取得。
 * @param subUnconfirmedRespondCount - 作業員未確定の数。
 *
 * 作業員未確定とは、
 * - 一番下の下請けによる最終手配（Arrangement）が存在しない状態を指す。
 * - 勤怠は存在可能。
 * - 応答完了の逆。常用完了していない状態。常用依頼は最後Arrangement（手配）で終わらないと完了したとは見做さない。
 * - subRespondCountに含まれるので、請求対象ではある。
 * - 又貸しの際に一番下の下請けが自社作業員で応答してない場合に発生する。
 * - subUnconfirmedRespondAttendancesで取得可能。
 * - subAttendancesのうちattendance.workerの存在有無でも判定可能。なければ作業員未確定。
 *
 * ---
 * #### 常用依頼への手配（応答）周りの集計が欲しいならこれだけで十分
 * @param requestMeter - 常用依頼の依頼数とそれへの応答数を集計したデータ。手配データや常用依頼データも取得できるのでそのまま使用する。
 * 場合分は内部で済んでいるので信用してデータ流すだけでOK。
 */
export type RequestOptionParam = {
    site?: SiteType
    company?: CompanyType
    superRequest?: RequestType
    subRequests?: RequestListType
    subArrangements?: ArrangementListType
    subRespondCount?: number
    subActualRespondCount?: number
    subUnreportedCount?: number
    subWaitingCount?: number
    subAttendances?: AttendanceListType
    subConfirmedRespondAttendances?: AttendanceListType
    subConfirmedRespondCount?: number
    subUnconfirmedRespondAttendances?: AttendanceListType
    subUnconfirmedRespondCount?: number
    requestedCompany?: CompanyType
    requestedCompanyManager?: WorkerType
    updateWorker?: WorkerType
    requestRelation?: RequestRelationType
    requestMeter?: RequestMeterType
    reservation?: ReservationType
    usedStockedAttendanceIds?: ID[]
    usedButNotExistStockedAttendanceIds?: ID[]
}

export type RequestType = RequestModel & RequestOptionParam

export type RequestCLType = ReplaceAnd<
    RequestType,
    {
        site?: SiteCLType
        company?: CompanyCLType
        superRequest?: RequestCLType
        subRequests?: RequestListCLType
        subAttendances?: AttendanceListCLType
        subConfirmedRespondAttendances?: AttendanceListCLType
        subUnconfirmedRespondAttendances?: AttendanceListCLType
        requestedCompany?: CompanyCLType
        requestedCompanyManager?: WorkerCLType
        updateWorker?: WorkerCLType
        subArrangements?: ArrangementListCLType
        requestMeter?: RequestMeterCLType
        reservation?: ReservationCLType
        date?: CustomDate
    } & CommonCLType
>

export const toRequestCLType = (data?: RequestType): RequestCLType => {
    return {
        ...data,
        ...toCommonCLType(data),
        site: data?.site ? toSiteCLType(data?.site) : undefined,
        subArrangements: data?.subArrangements ? toArrangementListCLType(data?.subArrangements) : undefined,
        company: data?.company ? toCompanyCLType(data?.company) : undefined,
        superRequest: data?.superRequest ? toRequestCLType(data?.superRequest) : undefined,
        subRequests: data?.subRequests ? toRequestListCLType(data?.subRequests) : undefined,
        subAttendances: data?.subAttendances ? toAttendanceListCLType(data.subAttendances) : undefined,
        subConfirmedRespondAttendances: data?.subConfirmedRespondAttendances ? toAttendanceListCLType(data.subConfirmedRespondAttendances) : undefined,
        subUnconfirmedRespondAttendances: data?.subUnconfirmedRespondAttendances ? toAttendanceListCLType(data.subUnconfirmedRespondAttendances) : undefined,
        requestedCompany: data?.requestedCompany ? toCompanyCLType(data?.requestedCompany) : undefined,
        requestedCompanyManager: data?.requestedCompanyManager ? toWorkerCLType(data?.requestedCompanyManager) : undefined,
        updateWorker: data?.updateWorker ? toWorkerCLType(data?.updateWorker) : undefined,
        requestMeter: data?.requestMeter ? toRequestMeterCLType(data.requestMeter) : undefined,
        reservation: data?.reservation ? toReservationCLType(data.reservation) : undefined,
        date: data?.date ? toCustomDateFromTotalSeconds(data.date, true) : undefined,
    } as RequestCLType
}
