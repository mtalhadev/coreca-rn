import sumBy from 'lodash/sumBy'
import uniqBy from 'lodash/uniqBy'
import { ConstructionSiteUIType } from '../../components/organisms/construction/ConstructionSite'
import { _getRequest, _updateRequest } from '../../services/request/RequestService'
import { CompanyType } from '../../models/company/Company'
import { RequestType } from '../../models/request/Request'
import { RequestDirectionType } from '../../components/organisms/request/RequestCL'
import { RequestDisplayType } from '../../screens/adminSide/transaction/RequestList'
import { ID } from '../../models/_others/ID'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { _getCompany } from '../../services/company/CompanyService'

/**
 * @param baseRequest - リクエストを表示するために必要な依頼。
 * @param direction - 受発注
 * @partial
 * @param orderPresentCount - 応答手配の数
 * @param orderRequestCount - 常用依頼の数
 * @param requestedCompanies - 常用依頼された会社
 * @param workerListRequests - workerListにて、受注では依頼、発注では応答した会社を表示するための依頼
 */
export type BothRequestType = {
    baseRequest: RequestType
    direction: RequestDirectionType
    orderPresentCount?: number
    orderRequestCount?: number
    requestedCompanies?: CompanyType[]
    workerListRequests?: RequestType[]
}
export type BothRequestsType = BothRequestType[]

/**
 * @requires
 * @param site - 現場
 * @param myCompanyId - 自社Id
 * @param displayType - 受注、発注、全て
 */
export type GetSiteRequestsParam = {
    site?: ConstructionSiteUIType
    displayType?: RequestDisplayType
    myCompanyId?: string
}

/**
 * @remarks 現場の中の常用依頼を取得する。
 * @objective  ConstructionSite.tsxにおいて指定現場の常用依頼を取得するため。取引一覧の常用依頼で使用。
 * @author  Kamiya
 * @param params - {@link GetSiteRequestsParam}
 * @returns - {@link BothRequestsType}
 */
export const GetSiteRequests = (params: GetSiteRequestsParam): BothRequestsType => {
    const { site, displayType, myCompanyId } = params
    const bothRequests: BothRequestsType = []
    /**
     * 受注の依頼は必ず１つになる。
     */
    const receiveRequest = site?.allRequests?.items?.filter((request) => request?.requestedCompanyId == myCompanyId)[0]
    const orderRequests = site?.allRequests?.items?.filter((request) => request?.companyId == myCompanyId) ?? []
    if ((displayType == 'receive' || displayType == 'both') && receiveRequest) {
        /**
         * 受注・全て
         */
        bothRequests.push({
            baseRequest: receiveRequest,
            direction: 'receive',
        })
    }
    if ((displayType == 'order' || displayType == 'both') && orderRequests.length > 0) {
        /**
         * 発注・全て
         */
        bothRequests.push({
            baseRequest: receiveRequest ?? {
                isConfirmed: true,//確定とも未確定ともつかないが、発注一覧でここがfalseだと未通知タグが表示されるためtrue
                isFakeCompanyRequest: false,//発注一覧に載せる常用依頼は全てInvRequestではなくRequestなのでtrue
                isApplication: true,//一覧に表示されるものは全て申請ずみ
                // isApproval
            }, //自社施工でも、baseRequestを入れないとRequestが表示されないため入れるが、遷移先へrequestIdを送ってしまうと常用依頼手配画面になってしまうので、送らない。
            direction: 'order',
            requestedCompanies: uniqBy(
                orderRequests.map((req) => req.requestedCompany),
                'companyId',
            ).filter((data) => data != undefined) as CompanyType[],
            orderRequestCount: sumBy(orderRequests.map((request) => request.requestMeter?.companyRequiredNum)) ?? 0,
            orderPresentCount: sumBy(orderRequests.map((request) => request.requestMeter?.companyPresentNum)) ?? 0,
            workerListRequests: orderRequests,
        })
    }
    return bothRequests
}
/**
 * @requires
 * @param site - 現場
 * @param displayType - 受注、発注
 * @param targetCompany - 対象の会社
 * @param myCompanyId - 自社Id
 */
export type GetSiteRequestsOfTargetCompanyParam = {
    site?: ConstructionSiteUIType
    displayType?: RequestDirectionType
    targetCompany?: CompanyType
    myCompanyId?: string
}

/**
 * @remarks 対象会社との現場の中の常用依頼を取得する。
 * @objective  ConstructionSite.tsxにおいて対象会社との指定現場の常用依頼を取得するため。顧客/取引先の明細で使用。
 * @author  Kamiya
 * @param params - {@link GetSiteRequestsOfTargetCompanyParam}
 * @returns - {@link BothRequestsType}
 */
export const GetSiteRequestsOfTargetCompany = (params: GetSiteRequestsOfTargetCompanyParam): BothRequestsType => {
    const { site, displayType, targetCompany, myCompanyId } = params
    const bothRequests: BothRequestsType = []
    const receiveRequestFromTargetCompany = site?.allRequests?.items?.filter((req) => req?.requestedCompanyId == myCompanyId && req.companyId == targetCompany?.companyId)[0] ?? {}
    /**
     * １つの現場で同じ会社には、最大１つのrequestしかない
     */
    const orderRequest = site?.allRequests?.items?.filter((req) => req?.companyId == myCompanyId && req.requestedCompanyId == targetCompany?.companyId)[0]
    const receiveRequest = site?.allRequests?.items?.filter((req) => req.requestedCompanyId == myCompanyId)[0]
    if (displayType == 'receive' && receiveRequestFromTargetCompany) {
        /**
         * 受注
         */
        bothRequests.push({
            baseRequest: receiveRequestFromTargetCompany,
            direction: 'receive',
        })
    } else if (displayType == 'order' && orderRequest) {
        /**
         * 発注
         */
        bothRequests.push({
            baseRequest: receiveRequest ?? {}, //自社施工の場合、SiteDetailRouterへ遷移時にrequestIdを渡さない。
            direction: 'order',
            orderRequestCount: orderRequest.requestMeter?.companyRequiredNum ?? 0,
            orderPresentCount: orderRequest.requestMeter?.companyPresentNum ?? 0,
            requestedCompanies: targetCompany ? [targetCompany] : [],
            workerListRequests: [orderRequest],
        })
    }
    return bothRequests
}

/**
 * @requires
 * @param requestId - 依頼Id
 * @param isApproval - 承認可否
 */
 export type UpdateRequestIsApproveParam = {
    requestId?: ID
    isApproval?: boolean | 'waiting'
}

/**
 * @remarks 頼まれた常用の承認・非承認をする。
 * @objective  Request.tsxにて承認・非承認するため
 * @author  Kamiya
 * @param params - {@link UpdateRequestIsApproveParam}
 * @returns - boolean
 */
export const updateRequestIsApproval = async (params: UpdateRequestIsApproveParam): Promise<CustomResponse<boolean>> => {
    try {
        const { requestId, isApproval } = params
        if (requestId == undefined || isApproval == undefined) {
            throw {
                error: `requestId: ${requestId}, isApproval: ${isApproval}, ${'情報が足りません'}`,
            }
        }
        /**
         * 直前に取得して、申請が取り消されていないか確認する
         */
        const getResult = await _getRequest({
                requestId
        })
        if (getResult.error) {
            throw {
                error: getResult.error
            }
        }
        if (getResult.success?.isApplication != true) {
            throw {
                error: '常用依頼が取り消されています'
            }
        }
        const updateResult = await _updateRequest({
            request: {
                requestId,
                isApproval: isApproval
            }
        })
        if (updateResult.error) {
            throw {
                error: updateResult.error
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}