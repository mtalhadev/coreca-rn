import { CustomDate, toCustomDateFromTotalSeconds } from '../_others/CustomDate'
import { CompanyCLType, CompanyType, toCompanyCLType } from '../company/Company'
import { CompanyListCLType, CompanyListType, toCompanyListCLType } from '../company/CompanyListType'
import { RequestCLType, RequestType, toRequestCLType } from '../request/Request'
import { RequestListCLType, RequestListType, toRequestListCLType } from '../request/RequestListType'
import { ReservationCLType, ReservationType, toReservationCLType } from '../reservation/Reservation'
import { SiteRelationType } from '../site/SiteRelationType'
import { CompanyWorkerListCLType, CompanyWorkerListType, toCompanyWorkerListCLType } from '../worker/CompanyWorkerListType'
import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ArrangementCLType, ArrangementType, toArrangementCLType } from './Arrangement'
import { ArrangementListCLType, ArrangementListType, toArrangementListCLType } from './ArrangementListType'
import { TotalSeconds } from '../_others/TotalSeconds'
import { ID } from '../_others/ID'
import { InvRequestCLType, InvRequestType, toInvRequestCLType } from '../invRequest/InvRequestType'
import { InvRequestListCLType, InvRequestListType, toInvRequestListCLType } from '../invRequest/InvRequestListType'
import { ArrangementWorkerType, ArrangementWorkerCLType, toArrangementWorkerCLType } from '../worker/ArrangementWorkerListType'
import { SiteMeterCLType, SiteMeterType } from '../site/SiteMeterType'

/**
 * 手配情報で欲しい情報
 * - 自社施工
 *     - 自社作業員の手配情報（selfPlacing。手配する=自社手配（reqもresもない。作業員の所属とcreateCompanyが一致する。））
 *     - 常用依頼の情報（自社からの常用依頼のみ（site.companyRequests.orderRequestsで取得可能）。自社への常用依頼は存在しない？ => 存在しない。そもそも同時に表示する仕組みない。常用依頼されると常用現場になるので、現場単位の表示。一方常用依頼すると現場内の他社作業員の表示になる。非対称性がある。）
 * - 発注現場（自社施工との違いは自社が施工主になっているのと自社から手配できないこと）
 *     - 施工主作業員の手配情報（selfPlacing。その施工主が手配する=施工主手配（reqもresもない）。自社は手配できない。）
 *     - 常用依頼の情報（施工主からの常用依頼のみ。施工主への常用依頼はそもそも自社関係ないので必要ない情報）
 *
 * =======================================
 *
 * - 仮会社施工（常用現場との違いは手配時に常用依頼も兼ねていることと必要人数のカウントがrequiredNum。表示単位は現場。）
 *     - 自社作業員の応答手配情報（respondBySelf。手配する=常用依頼される＋応答手配）
 *     - 常用依頼の情報（手配する=常用依頼される＋他社作業員で応答手配。仮会社施工現場へ常用依頼された場合どうなる？=通常の常用現場と同じ）
 * - 常用現場
 *     - 自社作業員の応答手配情報（respondBySelf。手配する=応答手配）
 *     - 常用依頼の情報（手配する=他社作業員で応答手配。）
 */
export type SiteArrangementDataType = CommonListType<ArrangementType> & {
    date?: TotalSeconds
    // 自社作業員側の手配情報
    selfSide?: SiteArrangementWorkerType[]
    // 他社作業員側の手配情報
    otherSide?: SiteArrangementCompanyType[]

    siteRelation?: SiteRelationType
    siteManageCompanyId?: ID

    orderRequests?: RequestListType
    // 顧客/取引先すべて
    companies?: CompanyListType
    arrangeableWorkers?: CompanyWorkerListType

    subArrangements?: ArrangementListType
    subRequests?: RequestListType
    subRespondCount?: number

    /**
     * 基本自社。発注管理下の場合は施工会社になる。
     */
    mainDisplayCompanyId?: ID
}

export type SiteArrangementDataCLType = ReplaceAnd<
    SiteArrangementDataType,
    {
        date?: CustomDate
        selfSide?: SiteArrangementWorkerCLType[]
        otherSide?: SiteArrangementCompanyCLType[]
        orderRequests?: RequestListCLType
        companies?: CompanyListCLType
        arrangeableWorkers?: CompanyWorkerListCLType
    }
>

export const toSiteArrangementDataCLType = (data?: SiteArrangementDataType): SiteArrangementDataCLType => {
    return {
        ...data,
        date: data?.date ? toCustomDateFromTotalSeconds(data?.date, true) : undefined,
        selfSide: data?.selfSide ? data.selfSide.map((val) => toSiteArrangementWorkerCLType(val)) : undefined,
        otherSide: data?.otherSide ? data.otherSide.map((val) => toSiteArrangementCompanyCLType(val)) : undefined,
        orderRequests: data?.orderRequests ? toRequestListCLType(data.orderRequests) : undefined,
        companies: data?.companies ? toCompanyListCLType(data.companies) : undefined,
        arrangeableWorkers: data?.arrangeableWorkers ? toCompanyWorkerListCLType(data.arrangeableWorkers) : undefined,
    }
}

// ============================================================================

export type SiteArrangementWorkerType = {
    // workerTagsもここに含む。
    worker?: ArrangementWorkerType
    // 現場または常用依頼への手配。あれば手配。なければ未手配
    targetArrangement?: ArrangementType
    targetInvRequest?: InvRequestType
    dailyArrangements?: ArrangementListType
    dailyInvRequests?: InvRequestListType
}

export type SiteArrangementWorkerCLType = ReplaceAnd<
    SiteArrangementWorkerType,
    {
        worker?: ArrangementWorkerCLType
        targetArrangement?: ArrangementCLType
        targetInvRequest?: InvRequestCLType
        dailyArrangements?: ArrangementListCLType
        dailyInvRequests?: InvRequestListCLType
    }
>

export const toSiteArrangementWorkerCLType = (data?: SiteArrangementWorkerType): SiteArrangementWorkerCLType => {
    return {
        ...data,
        dailyArrangements: data?.dailyArrangements ? toArrangementListCLType(data.dailyArrangements) : undefined,
        dailyInvRequests: data?.dailyInvRequests ? toInvRequestListCLType(data.dailyInvRequests) : undefined,
        worker: data?.worker ? toArrangementWorkerCLType(data.worker) : undefined,
        targetArrangement: data?.targetArrangement ? toArrangementCLType(data.targetArrangement) : undefined,
        targetInvRequest: data?.targetInvRequest ? toInvRequestCLType(data.targetInvRequest) : undefined,
    }
}

// ============================================================================

export type SiteArrangementCompanyType = {
    requestedCompany?: CompanyType

    // この会社へのその日の常用依頼を全て取得。→工事に紐づけたため、同日にリクエストは1つになった。フロント適用後にサーバーからも削除する
    // dailyRequests?: RequestListType

    targetReservation?: ReservationType

    targetRequest?: RequestType
}

export type SiteArrangementCompanyCLType = ReplaceAnd<
    SiteArrangementCompanyType,
    {
        requestedCompany?: CompanyCLType
        // dailyRequests?: RequestListCLType
        targetReservation?: ReservationCLType
        targetRequest?: RequestCLType
    }
>

export const toSiteArrangementCompanyCLType = (data?: SiteArrangementCompanyType): SiteArrangementCompanyCLType => {
    return {
        ...data,
        // dailyRequests: data?.dailyRequests ? toRequestListCLType(data.dailyRequests) : undefined,
        requestedCompany: data?.requestedCompany ? toCompanyCLType(data.requestedCompany) : undefined,
        targetReservation: data?.targetReservation ? toReservationCLType(data.targetReservation) : undefined,
        targetRequest: data?.targetRequest ? toRequestCLType(data.targetRequest) : undefined,
    }
}

export type LocalSiteArrangementDataType = {
    siteArrangementId: ID
    meter: SiteMeterType
} & SiteArrangementDataType
