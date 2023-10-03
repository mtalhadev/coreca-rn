import { _callFunctions } from '../firebase/FunctionsService'

import { Create, Update } from '../../models/_others/Common'
import { GetProjectOptionParam, ProjectModel, ProjectType } from '../../models/project/Project'
import { getErrorMessage } from '../_others/ErrorService'
import { CustomResponse } from '../../models/_others/CustomResponse'

export const _createProject = async (project: Create<ProjectModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IProject-createProject', project)
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

export type GetProjectParam = {
    projectId: string
    options?: GetProjectOptionParam
}

export type GetProjectResponse = ProjectType | undefined
/**
 *
 * @param params
 *  -
 *  - withoutSelf
 *  - updateWorker
 *  - projectConstructions
 *  - projectCompanies
 *  - createCompany
 *  - contracts
 *  - projectContracts（関係図で整理）
 *  - companyContracts（会社で整理）
 * @returns
 */
export const _getProject = async (params: GetProjectParam): Promise<CustomResponse<GetProjectResponse>> => {
    try {
        const result = await _callFunctions('IProject-getProject', params)
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

export const _updateProject = async (project: Update<ProjectModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IProject-updateProject', project)
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

export const _deleteProject = async (projectId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IProject-deleteProject', projectId)
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

export type FilterProjectListParam = {
    keyword: string
    options?: GetProjectOptionParam
}
export type FilterProjectListResponse = ProjectType[] | undefined
export const _filterProjectList = async (params: FilterProjectListParam): Promise<CustomResponse<FilterProjectListResponse>> => {
    try {
        const result = await _callFunctions('IProject-filterProjectList', params)
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

export type GetProjectListByIdsParam = {
    projectIds: string[]
    options?: GetProjectOptionParam
}
export type GetProjectListByIdsResponse = ProjectType[] | undefined
export const _getProjectListByIds = async (params: GetProjectListByIdsParam): Promise<CustomResponse<GetProjectListByIdsResponse>> => {
    try {
        const result = await _callFunctions('IProject-getProjectListByIds', params)
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

export type GetProjectListOfTargetCompanyParam = {
    companyId: string
    options?: GetProjectOptionParam
}
export type GetProjectListOfTargetCompanyResponse = ProjectType[] | undefined
/**
 *
 * @param params
 * @returns ok
 */
export const _getProjectListOfTargetCompany = async (params: GetProjectListOfTargetCompanyParam): Promise<CustomResponse<GetProjectListOfTargetCompanyResponse>> => {
    try {
        const result = await _callFunctions('IProject-getProjectListOfTargetCompany', params)
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

export type GetProjectOfTargetConstructionParam = {
    constructionId: string
    options?: GetProjectOptionParam
}
export type GetProjectOfTargetConstructionResponse = ProjectType | undefined
/**
 *
 * @param params
 * @returns ok
 */
export const _getProjectOfTargetConstruction = async (params: GetProjectOfTargetConstructionParam): Promise<CustomResponse<GetProjectOfTargetConstructionResponse>> => {
    try {
        const result = await _callFunctions('IProject-getProjectOfTargetConstruction', params)
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

export type GetProjectOfTargetContractParam = {
    contractId: string
    options?: GetProjectOptionParam
}
export type GetProjectOfTargetContractResponse = ProjectType | undefined
/**
 *
 * @param params
 * @returns ok
 */
export const _getProjectOfTargetContract = async (params: GetProjectOfTargetContractParam): Promise<CustomResponse<GetProjectOfTargetContractResponse>> => {
    try {
        const result = await _callFunctions('IProject-getProjectOfTargetContract', params)
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
 * fakeCompanyInvReservationId 案件と１対１で紐づいている、常用申請先が仮会社のInvReservationId
 */
export type GetProjectOfFakeCompanyInvReservationIdParam = {
    fakeCompanyInvReservationId: string
    options?: GetProjectOptionParam
}
export type GetProjectOfFakeCompanyInvReservationIdResponse = ProjectType | undefined
/**
 * @remarks 仮会社へ常用で送る案件を取得。仮会社へのInvReservationは案件と１対１で紐づく。
 * 常用申請一覧表示時に使用。案件名を表示するため
 * @error GET_PROJECT_ERROR - InvReservationが紐づく案件が取得できていない。
 * @param params 
 * @returns 仮会社へ常用で送る案件
 */
export const _getProjectOfFakeCompanyInvReservationId = async (params: GetProjectOfFakeCompanyInvReservationIdParam): Promise<CustomResponse<GetProjectOfFakeCompanyInvReservationIdResponse>> => {
    try {
        const result = await _callFunctions('IProject-getProjectOfFakeCompanyInvReservationId', params)
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