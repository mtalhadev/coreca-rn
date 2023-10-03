/* eslint-disable no-irregular-whitespace */
import { _callFunctions } from '../firebase/FunctionsService'
import { GetArrangementOptionParam } from '../../models/arrangement/Arrangement'
import { GetCompanyConstructionListType, CompanyConstructionListType } from '../../models/construction/CompanyConstructionListType'
import { ConstructionModel, GetConstructionOptionParam, ConstructionType } from '../../models/construction/Construction'
import { ConstructionListType } from '../../models/construction/ConstructionListType'
import { ConstructionMeterType } from '../../models/construction/ConstructionMeterType'
import { ConstructionRelationType } from '../../models/construction/ConstructionRelationType'
import { ProjectConstructionListType } from '../../models/construction/ProjectConstructionListType'
import { GetCompanyContractListType } from '../../models/contract/CompanyContractListType'
import { ProjectType } from '../../models/project/Project'
import { GetRequestOptionParam } from '../../models/request/Request'
import { Create, Update } from '../../models/_others/Common'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'
import { YYYYMMTotalSecondsParam } from '../../models/_others/TotalSeconds'

export const _createConstruction = async (construction: Create<ConstructionModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IConstruction-createConstruction', construction)
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

export type GetConstructionParam = {
    constructionId: string
    options?: GetConstructionOptionParam
}

export type GetConstructionResponse = ConstructionType | undefined

export const _getConstruction = async (params: GetConstructionParam): Promise<CustomResponse<GetConstructionResponse>> => {
    try {
        const result = await _callFunctions('IConstruction-getConstruction', params)
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

export const _updateConstruction = async (construction: Update<ConstructionModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IConstruction-updateConstruction', construction)
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

export const _deleteConstruction = async (constructionId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IConstruction-deleteConstruction', constructionId)
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

export type FilterConstructionListParam = {
    keyword: string
    options?: GetConstructionOptionParam
}
export type FilterConstructionListResponse = ConstructionListType | undefined
export const _filterConstructionList = async (params: FilterConstructionListParam): Promise<CustomResponse<FilterConstructionListResponse>> => {
    try {
        const result = await _callFunctions('IConstruction-filterConstructionList', params)
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

export type GetConstructionListByIdsParam = {
    constructionIds: string[]
    options?: GetConstructionOptionParam
}
export type GetConstructionListByIdsResponse = ConstructionListType | undefined
export const _getConstructionListByIds = async (params: GetConstructionListByIdsParam): Promise<CustomResponse<GetConstructionListByIdsResponse>> => {
    try {
        const result = await _callFunctions('IConstruction-getConstructionListByIds', params)
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

export type GetProjectConstructionListOfTargetProjectParam = {
    projectId: string
    options?: GetConstructionOptionParam
}
export type GetProjectConstructionListOfTargetProjectResponse = ProjectConstructionListType | undefined
/**
 *
 * @param params
 * @returns optionsでconstructionRelationがあるとCompanyConstructionListTypeで分類される。
 */
export const _getProjectConstructionListOfTargetProject = async (
    params: GetProjectConstructionListOfTargetProjectParam,
): Promise<CustomResponse<GetProjectConstructionListOfTargetProjectResponse>> => {
    try {
        const result = await _callFunctions('IConstruction-getProjectConstructionListOfTargetProject', params)
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

export type GetConstructionListOfTargetCompanyAndProjectParam = {
    projectId: string
    companyId: string
    options?: GetConstructionOptionParam
}
export type GetConstructionListOfTargetCompanyAndProjectResponse = ProjectConstructionListType | undefined
/**
 *
 * @param params
 * @returns
 */
export const _getConstructionListOfTargetCompanyAndProject = async (
    params: GetConstructionListOfTargetCompanyAndProjectParam,
): Promise<CustomResponse<GetConstructionListOfTargetCompanyAndProjectResponse>> => {
    try {
        const result = await _callFunctions('IConstruction-getConstructionListOfTargetCompanyAndProject', params)
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

export type GetConstructionListOfTargetCompanyParam = {
    companyId: string
    types?: GetCompanyContractListType
    options?: GetConstructionOptionParam
}
export type GetConstructionListOfTargetCompanyResponse = ConstructionListType | undefined
/**
 *
 * @param params
 * @returns 指定した会社が発注または受注で契約で関わるすべての工事。
 */
export const _getConstructionListOfTargetCompany = async (params: GetConstructionListOfTargetCompanyParam): Promise<CustomResponse<GetConstructionListOfTargetCompanyResponse>> => {
    try {
        const result = await _callFunctions('IConstruction-getConstructionListOfTargetCompany', params)
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
 *  types: ("all" | "order" | "order-children" | "manage" | "fake-company-manage")[]
 */
export type GetCompanyConstructionListOfTargetCompanyParam = {
    companyId: string
    types?: GetCompanyConstructionListType
    options?: GetConstructionOptionParam
}
export type GetCompanyConstructionListOfTargetCompanyResponse = CompanyConstructionListType | undefined
/**
 *
 * @param params
 * @returns 指定した会社が関わるすべての工事。発注工事、発注管理下工事、施工工事、仮会社施工
 */
export const _getCompanyConstructionListOfTargetCompany = async (
    params: GetCompanyConstructionListOfTargetCompanyParam,
): Promise<CustomResponse<GetCompanyConstructionListOfTargetCompanyResponse>> => {
    try {
        const result = await _callFunctions('IConstruction-getCompanyConstructionListOfTargetCompany', params)
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
 * - otherCompanyId - 対象会社のId
 * - companyId - 自社Id
 * @partial
 * - types - 受注契約か発注契約か両方か
 * - options - 追加取得したい情報
 */
export type GetConstructionListOfTargetCompaniesParam = {
    otherCompanyId?: string
    companyId?: string
    types?: GetCompanyContractListType
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    options?: GetConstructionOptionParam
}
/**
 * - orderConstructionList - 対象会社に発注した請負契約下の工事のリスト
 * - receiveConstructionList - 対象会社から受注した請負契約下の工事のリスト
 */
export type GetConstructionListOfTargetCompaniesResponse = {
    orderConstructionList: CompanyConstructionListType<ConstructionListType>
    receiveConstructionList: CompanyConstructionListType<ConstructionListType>
}
/**
 * @remarks 請負契約で自社と指定した会社が関わるすべての工事。
 * @objective getContractInvoiceにおいて、顧客/取引先との契約を取得するため
 * @error
 * - CONTRACT_ERROR - contractの取得に失敗した際
 * @author  Kamiya
 * @param params - {@link GetConstructionListOfTargetCompaniesParam}
 * @returns - {@link GetConstructionListOfTargetCompaniesResponse}
 */
export const _getConstructionListOfTargetCompaniesAndMonth = async (params: GetConstructionListOfTargetCompaniesParam): Promise<CustomResponse<GetConstructionListOfTargetCompaniesResponse>> => {
    try {
        const result = await _callFunctions('IConstruction-getConstructionListOfTargetCompaniesAndMonth', params)
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

export type GetConstructionListOfTargetContractParam = {
    contractId: string
    options?: GetConstructionOptionParam
}
export type GetConstructionListOfTargetContractResponse = ConstructionListType | undefined
/**
 *
 * @param params
 * @returns 契約直下の工事一覧。
 */
export const _getSubConstructionListOfTargetContract = async (params: GetConstructionListOfTargetContractParam): Promise<CustomResponse<GetConstructionListOfTargetContractResponse>> => {
    try {
        const result = await _callFunctions('IConstruction-getSubConstructionListOfTargetContract', params)
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
export type GetConstructionListOfTargetContractAndMonthParam = {
    contractId: string
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    options?: GetConstructionOptionParam
}
export type GetConstructionListOfTargetContractAndMonthResponse = ConstructionListType | undefined

export type GetConstructionRelationTypeParam = {
    companyId: string
    constructionId: string
}
export type GetConstructionRelationTypeResponse = ConstructionRelationType | undefined
/**
 *
 * @param params
 * @returns ok
 */
export const _getConstructionRelationType = async (params: GetConstructionRelationTypeParam): Promise<CustomResponse<GetConstructionRelationTypeResponse>> => {
    try {
        const result = await _callFunctions('IConstruction-getConstructionRelationType', params)
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

export type GetConstructionDisplayNameParam = {
    constructionId: string
    construction?: ConstructionType
    project?: ProjectType
}
export type GetConstructionDisplayNameResponse = string | undefined
/**
 *
 * @param params - construction, project - 再取得しないで済むように。
 * @returns 表示用の名前取得。name単体を使わないように。
 */
export const _getConstructionDisplayName = async (params: GetConstructionDisplayNameParam): Promise<CustomResponse<GetConstructionDisplayNameResponse>> => {
    try {
        const result = await _callFunctions('IConstruction-getConstructionDisplayName', params)
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

// requestの時点で会社も確定してるので会社IDも必要ない。
export type GetConstructionMeterOfTargetConstructionParam = {
    constructionId: string
    companyId: string
    constructionRelation?: ConstructionRelationType
    managerCompanyId?: string
    arrangementOptions?: GetArrangementOptionParam
    requestOptions?: GetRequestOptionParam
}
export type GetConstructionMeterOfTargetConstructionResponse = ConstructionMeterType | undefined
/**
 *
 * @param params
 * @returns 指定した会社から見てこの現場への必要手配人数と手配済み人数を取得。
 */
export const _getConstructionMeterOfTargetConstruction = async (params: GetConstructionMeterOfTargetConstructionParam): Promise<CustomResponse<GetConstructionMeterOfTargetConstructionResponse>> => {
    try {
        const result = await _callFunctions('IConstruction-getConstructionMeterOfTargetConstruction', params)
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
 * fakeCompanyInvReservationId 工事と１対１で紐づいている、常用申請先が仮会社のInvReservationId
 */
export type GetConstructionOfFakeCompanyInvReservationIdParam = {
    fakeCompanyInvReservationId: string
    options?: GetConstructionOptionParam
}
export type GetConstructionOfFakeCompanyInvReservationIdResponse = ConstructionType | undefined
/**
 * @remarks 仮会社へ常用で送る工事を取得。仮会社へのInvReservationは案件と１対１で紐づく。
 * 常用申請予定の編集時に使用。工期を変更するため。
 * @error GET_CONSTRUCTION_ERROR - InvReservationが紐づく工事が取得できていない。
 * @param params 
 * @returns 仮会社へ常用で送る工事
 */
export const _getConstructionOfFakeCompanyInvReservationId = async (params: GetConstructionOfFakeCompanyInvReservationIdParam): Promise<CustomResponse<GetConstructionOfFakeCompanyInvReservationIdResponse>> => {
    try {
        const result = await _callFunctions('IConstruction-getConstructionOfFakeCompanyInvReservationId', params)
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
