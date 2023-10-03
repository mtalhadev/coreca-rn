import { _callFunctions } from '../firebase/FunctionsService'
import { GetSiteOptionParam, SiteModel, SiteType } from '../../models/site/Site'
import { SiteMeterType } from '../../models/site/SiteMeterType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { GetArrangementOptionParam } from '../../models/arrangement/Arrangement'
import { Create, Update } from '../../models/_others/Common'
import { getErrorMessage } from '../_others/ErrorService'
import { SiteNameDataType } from '../../models/site/SiteNameDataType'
import { SiteRelationType } from '../../models/site/SiteRelationType'
import { CompanySiteListType, GetCompanySiteListType } from '../../models/site/CompanySiteListType'
import { SiteListType } from '../../models/site/SiteListType'
import { GetRequestOptionParam } from '../../models/request/Request'
import { ConstructionRelationType } from '../../models/construction/ConstructionRelationType'
import { YYYYMMDDTotalSecondsParam, YYYYMMTotalSecondsParam } from '../../models/_others/TotalSeconds'



export const _createSite = async (site: Create<SiteModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('ISite-createSite', site)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetSiteParam = {
    siteId: string
    options?: GetSiteOptionParam
}
export type GetSiteResponse = SiteType | undefined

/**
 *
 * @param params
 *  -
 *  - withoutSelf
 *  - arrangements
 *       - companyId
 *  - siteRelation
 *       - companyId
 *  - requests
 *       - companyId
 *       - types
 *  - updateWorker
 *  - arrangeableWorkers
 *       - companyId
 *  - managerWorker
 *  - siteNameData
 *       - sites
 *  - construction
 * @returns
 */
export const _getSite = async (params: GetSiteParam): Promise<CustomResponse<GetSiteResponse>> => {
    try {
        const result = await _callFunctions('ISite-getSite', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export const _updateSite = async (site: Update<SiteModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('ISite-updateSite', site)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export const _deleteSite = async (siteId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('ISite-deleteSite', siteId)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type DeleteSitesForSpanParam = {
    constructionId: string
    startDate: number
    endDate: number
}
export const _deleteSiteForSpan = async (params: DeleteSitesForSpanParam): Promise<CustomResponse<number>> => {
    try {
        const result = await _callFunctions('ISite-deleteSiteForSpan', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetSiteListByIdsParam = {
    siteIds: string[]
    options?: GetSiteOptionParam
}
export type GetSiteListByIdsResponse = SiteListType | undefined
export const _getSiteListByIds = async (params: GetSiteListByIdsParam): Promise<CustomResponse<GetSiteListByIdsResponse>> => {
    try {
        const result = await _callFunctions('ISite-getSiteListByIds', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetSiteListOfTargetConstructionParam = {
    constructionId: string
    options?: GetSiteOptionParam
}
export type GetSiteListOfTargetConstructionResponse = SiteListType | undefined
/**
 *
 * @param params
 * @returns 工事直下の現場一覧取得。
 */
export const _getSiteListOfTargetConstruction = async (params: GetSiteListOfTargetConstructionParam): Promise<CustomResponse<GetSiteListOfTargetConstructionResponse>> => {
    try {
        const result = await _callFunctions('ISite-getSiteListOfTargetConstruction', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * constructionID - 工事Id
 * month - YYYYMMTotalSecondsParam
 */
export type GetSiteListOfTargetConstructionAndMonthParam = {
    constructionId: string
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    options?: GetSiteOptionParam
}
export type GetSiteListOfTargetConstructionAndMonthResponse = SiteListType | undefined
/**
 *
 * @param params
 * @returns 工事直下の現場一覧取得。
 */
export const _getSiteListOfTargetConstructionAndMonth = async (params: GetSiteListOfTargetConstructionAndMonthParam): Promise<CustomResponse<GetSiteListOfTargetConstructionAndMonthResponse>> => {
    try {
        const result = await _callFunctions('ISite-getSiteListOfTargetConstructionAndMonth', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetSiteListOfTargetConstructionAndDateParam = {
    constructionId: string
    date: YYYYMMDDTotalSecondsParam
    options?: GetSiteOptionParam
}
export type GetSiteListOfTargetConstructionAndDateResponse = SiteType | undefined
/**
 *
 * @param params
 * @returns 工事直下の現場一覧取得。
 */
export const _getSiteListOfTargetConstructionAndDate = async (params: GetSiteListOfTargetConstructionAndDateParam): Promise<CustomResponse<GetSiteListOfTargetConstructionAndDateResponse>> => {
    try {
        const result = await _callFunctions('ISite-getSiteListOfTargetConstructionAndDate', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetSitesOfTargetWorkerParam = {
    workerId: string
    options?: GetSiteOptionParam
}
export type GetSitesOfTargetWorkerResponse = SiteListType | undefined
/**
 *
 * @param params
 * @returns 指定した作業員が手配された全現場。
 */
export const _getSiteListOfTargetWorker = async (params: GetSitesOfTargetWorkerParam): Promise<CustomResponse<GetSitesOfTargetWorkerResponse>> => {
    try {
        const result = await _callFunctions('ISite-getSiteListOfTargetWorker', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetSitesOfTargetCompanyAndDateParam = {
    companyId: string
    date: YYYYMMDDTotalSecondsParam
    endDate?: YYYYMMDDTotalSecondsParam
    options?: GetSiteOptionParam
}
export type GetSitesOfTargetCompanyAndDateResponse = SiteListType | undefined
/**
 *
 * @param params
 * @returns 指定した会社の指定した日の現場。常用現場は含まれない。（非推奨：_getCompanySiteListOfTargetCompanyAndDateを使用するように）
 *
 */
export const _getSiteListOfTargetCompanyAndDate = async (params: GetSitesOfTargetCompanyAndDateParam): Promise<CustomResponse<GetSitesOfTargetCompanyAndDateResponse>> => {
    try {
        const result = await _callFunctions('ISite-getSiteListOfTargetCompanyAndDate', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}



export type GetCompanySitesOfTargetCompanyAndDateParam = {
    companyId: string
    date: YYYYMMDDTotalSecondsParam
    endDate?: YYYYMMDDTotalSecondsParam
    types?: GetCompanySiteListType
    options?: GetSiteOptionParam
}
export type GetCompanySitesOfTargetCompanyAndDateResponse = CompanySiteListType | undefined
/**
 *
 * @param params
 * @returns 指定した会社が指定した日に関わるすべての現場を取得。（Spanにした方が効率的かも）
 */
export const _getCompanySiteListOfTargetCompanyAndDate = async (params: GetCompanySitesOfTargetCompanyAndDateParam): Promise<CustomResponse<GetCompanySitesOfTargetCompanyAndDateResponse>> => {
    try {
        const result = await _callFunctions('ISite-getCompanySiteListOfTargetCompanyAndDate', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetSiteListOfTargetWorkerAndDateParam = {
    workerId: string
    date: YYYYMMDDTotalSecondsParam
    timeZoneOffset?: number
    options?: GetSiteOptionParam
}
export type GetSiteListOfTargetWorkerAndDateResponse = SiteListType | undefined
/**
 *
 * @param params
 * @returns 指定した作業員が指定した日に手配された全現場。
 */
export const _getSiteListOfTargetWorkerAndDate = async (params: GetSiteListOfTargetWorkerAndDateParam): Promise<CustomResponse<GetSiteListOfTargetWorkerAndDateResponse>> => {
    try {
        const result = await _callFunctions('ISite-getSiteListOfTargetWorkerAndDate', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetSiteNameDataParam = {
    siteId?: string
    // 高速化に。
    sites?: SiteType[],
    /**
     * sitesをデータに含めるかどうか。重たいので普通はfalse
     */
    withSites?: boolean
}

export type GetSiteNameDataResponse = SiteNameDataType | undefined

export const _getSiteNameData = async (params: GetSiteNameDataParam): Promise<CustomResponse<GetSiteNameDataResponse>> => {
    try {
        const result = await _callFunctions('ISite-getSiteNameData', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetSitesOfMonthParam = {
    siteIds: string[]
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    options?: GetSiteOptionParam
}
export type GetSitesOfMonthResponse = SiteType[] | undefined

export const _getSitesOfMonth = async (params: GetSitesOfMonthParam): Promise<CustomResponse<GetSitesOfMonthResponse>> => {
    try {
        const result = await _callFunctions('ISite-getSitesOfMonth', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export const _makeSiteName = (projectName?: string, constructionName?: string, siteNumber?: number): string => {
    return `${(projectName?.length ?? 0) > 10 ? projectName?.slice(0, 9) + '...' : projectName ?? '???'}${projectName != constructionName ? ` / ${(constructionName ?? '??')}` : ''} - ${siteNumber ?? '?'}日目`
}

export const constructionRelationToSiteRelation = (constructionRelation?: ConstructionRelationType): SiteRelationType | undefined => {
    return constructionRelation
}
export type GetSiteRelationTypeParam = {
    companyId: string
    siteId: string
    constructionRelation?: ConstructionRelationType
}
export type GetSiteRelationTypeResponse = SiteRelationType | undefined
/**
 *
 * @param params
 * @returns ok
 */
export const _getSiteRelationType = async (params: GetSiteRelationTypeParam): Promise<CustomResponse<GetSiteRelationTypeResponse>> => {
    try {
        const result = await _callFunctions('ISite-getSiteRelationType', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * @param siteId - 対象の現場。
 * @param companyId - 自社。siteRelationを取得するのに使用する。
 * @partial
 * @param siteRelation - 会社と現場の関係。取得コストを抑える
 * @param siteManagerCompanyId - 現場管理会社。取得コストを抑える
 * @param options -
 */
export type GetCompanyPresentAndRequiredNumOfTargetSiteParam = {
    siteId: string
    companyId: string
    siteRelation?: SiteRelationType
    siteManagerCompanyId?: string
    arrangementOptions?: GetArrangementOptionParam
    requestOptions?: GetRequestOptionParam
}
export type GetCompanyPresentAndRequiredNumOfTargetSiteResponse = SiteMeterType | undefined
/**
 *
 * @param params
 * @returns 指定した会社から見てこの現場への必要手配人数と手配済み人数を取得。
 */
export const _getSiteMeterOfTargetSite = async (params: GetCompanyPresentAndRequiredNumOfTargetSiteParam): Promise<CustomResponse<GetCompanyPresentAndRequiredNumOfTargetSiteResponse>> => {
    try {
        const result = await _callFunctions('ISite-getSiteMeterOfTargetSite', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * @param fakeCompanyInvRequestId - 仮会社へ常用で送る現場と紐づく申請Id
 */
export type GetSiteOfTargetFakeCompanyInvRequestIdParam = {
    fakeCompanyInvRequestId: string
    options?: GetSiteOptionParam
}
export type GetSiteOfTargetFakeCompanyInvRequestIdResponse = SiteType | undefined
/**
 *
 * @param params
 * @returns 仮会社へ常用で送る現場を取得。仮会社へのInvRequestは現場と１対１で紐づく。
 */
export const _getSiteOfTargetFakeCompanyInvRequestId = async (params: GetSiteOfTargetFakeCompanyInvRequestIdParam): Promise<CustomResponse<GetSiteOfTargetFakeCompanyInvRequestIdResponse>> => {
    try {
        const result = await _callFunctions('ISite-getSiteOfTargetFakeCompanyInvRequestId', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}
