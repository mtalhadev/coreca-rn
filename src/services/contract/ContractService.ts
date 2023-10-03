import { _callFunctions } from '../firebase/FunctionsService'
import { GetCompanyContractListType, CompanyContractListType } from '../../models/contract/CompanyContractListType'
import { ContractModel, GetContractOptionParam, ContractType } from '../../models/contract/Contract'
import { ContractListType } from '../../models/contract/ContractListType'
import { ProjectContractListType } from '../../models/contract/ProjectContractListType'
import { GetRelatedContractListType, RelatedContractListType } from '../../models/contract/RelatedContractListType'
import { Create, Update } from '../../models/_others/Common'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'
import { YYYYMMTotalSecondsParam } from '../../models/_others/TotalSeconds'

/**
 *
 */
export const _createContract = async (contract: Create<ContractModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IContract-createContract', contract)
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

export type GetContractParam = {
    contractId: string
    options?: GetContractOptionParam
}

export type GetContractResponse = ContractType | undefined

export const _getContract = async (params: GetContractParam): Promise<CustomResponse<GetContractResponse>> => {
    try {
        const result = await _callFunctions('IContract-getContract', params)
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

export const _updateContract = async (contract: Update<ContractModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IContract-updateContract', contract)
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

export const _deleteContract = async (contractId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IContract-deleteContract', contractId)
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

export type FilterContractListParam = {
    keyword: string
    options?: GetContractOptionParam
}
export type FilterContractListResponse = ContractListType | undefined
export const _filterContractList = async (params: FilterContractListParam): Promise<CustomResponse<FilterContractListResponse>> => {
    try {
        const result = await _callFunctions('IContract-filterContractList', params)
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

export type GetContractListOfTargetCompanyParam = {
    companyId: string
    types?: GetCompanyContractListType
    options?: GetContractOptionParam
}
export type GetContractListOfTargetCompanyResponse = CompanyContractListType | undefined
/**
 *
 * @param params type - companyIdが主体で受注したか発注したか。
 * @returns ok
 */
export const _getContractListOfTargetCompany = async (params: GetContractListOfTargetCompanyParam): Promise<CustomResponse<GetContractListOfTargetCompanyResponse>> => {
    try {
        const result = await _callFunctions('IContract-getContractListOfTargetCompany', params)
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

export type GetContractListOfTargetCompanyAndMonthParam = {
    companyId: string
    types?: GetCompanyContractListType
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    options?: GetContractOptionParam
}
export type GetContractListOfTargetCompanyAndMonthResponse = CompanyContractListType | undefined
/**
 *
 * @param params type - companyIdが主体で受注したか発注したか。
 * @returns ok
 */
export const _getContractListOfTargetCompanyAndMonth = async (params: GetContractListOfTargetCompanyAndMonthParam): Promise<CustomResponse<GetContractListOfTargetCompanyAndMonthResponse>> => {
    try {
        const result = await _callFunctions('IContract-getContractListOfTargetCompanyAndMonth', params)
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

export type GetContractListOfTargetCompaniesParam = {
    companyId?: string
    otherCompanyId?: string
    types?: GetCompanyContractListType
    options?: GetContractOptionParam
}
export type GetContractListOfTargetCompaniesResponse = CompanyContractListType | undefined
/**
 *
 * @param params type - companyIdが発注したか受注したか基準。（例：companyId == myCompanyId）
 * @returns ok
 */
export const _getContractListOfTargetCompanies = async (params: GetContractListOfTargetCompaniesParam): Promise<CustomResponse<GetContractListOfTargetCompaniesResponse>> => {
    try {
        const result = await _callFunctions('IContract-getContractListOfTargetCompanies', params)
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

export type GetContractListOfTargetCompaniesAndMonthParam = {
    companyId?: string
    otherCompanyId?: string
    types?: GetCompanyContractListType
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    options?: GetContractOptionParam
}
export type GetContractListOfTargetCompaniesAndMonthResponse = CompanyContractListType | undefined
/**
 *
 * @param params type - companyIdが発注したか受注したか基準。（例：companyId == myCompanyId）
 * @returns ok
 */
export const _getContractListOfTargetCompaniesAndMonth = async (params: GetContractListOfTargetCompaniesAndMonthParam): Promise<CustomResponse<GetContractListOfTargetCompaniesAndMonthResponse>> => {
    try {
        const result = await _callFunctions('IContract-getContractListOfTargetCompaniesAndMonth', params)
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

export type GetContractOfTargetConstructionParam = {
    constructionId: string
    options?: GetContractOptionParam
}
export type GetContractOfTargetConstructionResponse = ContractType | undefined
/**
 *
 * @param params
 * @returns 指定した工事の上の契約
 */
export const _getContractOfTargetConstruction = async (params: GetContractOfTargetConstructionParam): Promise<CustomResponse<GetContractOfTargetConstructionResponse>> => {
    try {
        const result = await _callFunctions('IContract-getContractOfTargetConstruction', params)
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

export type GetSubContractOfTargetConstructionParam = {
    constructionId: string
    options?: GetContractOptionParam
}
export type GetSubContractOfTargetConstructionResponse = ContractType | undefined
/**
 *
 * @param params
 * @returns 指定した工事の下の契約
 */
export const _getSubContractOfTargetConstruction = async (params: GetSubContractOfTargetConstructionParam): Promise<CustomResponse<GetSubContractOfTargetConstructionResponse>> => {
    try {
        const result = await _callFunctions('IContract-getSubContractOfTargetConstruction', params)
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

export type GetContractListOfTargetProjectParam = {
    projectId: string
    options?: GetContractOptionParam
}
export type GetContractListOfTargetProjectResponse = ContractListType | undefined
/**
 *
 * @param params
 * @returns ok
 */
export const _getContractListOfTargetProject = async (params: GetContractListOfTargetProjectParam): Promise<CustomResponse<GetContractListOfTargetProjectResponse>> => {
    try {
        const result = await _callFunctions('IContract-getContractListOfTargetProject', params)
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

export type GetProjectContractListOfTargetProjectParam = {
    projectId: string
    options?: GetContractOptionParam
}
export type GetProjectContractListOfTargetProjectResponse = ProjectContractListType | undefined
/**
 *
 * @param params
 * @returns ok
 */
export const _getProjectContractListOfTargetProject = async (params: GetProjectContractListOfTargetProjectParam): Promise<CustomResponse<GetProjectContractListOfTargetProjectResponse>> => {
    try {
        const result = await _callFunctions('IContract-getProjectContractListOfTargetProject', params)
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

export type GetContractListOfTargetProjectAndCompanyParam = {
    projectId: string
    companyId: string
    types?: GetCompanyContractListType
    options?: GetContractOptionParam
}
export type GetContractListOfTargetProjectAndCompanyResponse = CompanyContractListType | undefined
/**
 *
 * @param params
 * @returns ok
 */
export const _getContractListOfTargetProjectAndCompany = async (params: GetContractListOfTargetProjectAndCompanyParam): Promise<CustomResponse<GetContractListOfTargetProjectAndCompanyResponse>> => {
    try {
        const result = await _callFunctions('IContract-getContractListOfTargetProjectAndCompany', params)
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

export type GetContractListOfTargetContractParam = {
    contractId: string
    types?: GetRelatedContractListType
    options?: GetContractOptionParam
}
export type GetContractListOfTargetContractResponse = RelatedContractListType | undefined
/**
 *
 * @param params
 * @returns 指定した契約に関係する契約を取得する
 */
export const _getRelatedContractListOfTargetContract = async (params: GetContractListOfTargetContractParam): Promise<CustomResponse<GetContractListOfTargetContractResponse>> => {
    try {
        const result = await _callFunctions('IContract-getRelatedContractListOfTargetContract', params)
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
