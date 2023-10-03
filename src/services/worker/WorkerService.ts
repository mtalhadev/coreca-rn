import { _callFunctions } from '../firebase/FunctionsService'
import { Create, Update } from '../../models/_others/Common'
import { WorkerTagType } from '../../models/worker/WorkerTagType'
import { GetWorkerOptionParam, WorkerModel, WorkerType } from '../../models/worker/Worker'
import { getErrorMessage } from '../_others/ErrorService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { CompanyWorkerListType } from '../../models/worker/CompanyWorkerListType'
import { WorkerListType } from '../../models/worker/WorkerListType'
import { SiteType } from '../../models/site/Site'
import { YYYYMMDDTotalSecondsParam } from '../../models/_others/TotalSeconds'
import { CompanyRoleEnumType } from '../../models/worker/CompanyRoleEnumType'

export const _createWorker = async (worker: Create<WorkerModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IWorker-createWorker', worker)
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

export type GetWorkerParam = {
    workerId: string
    options?: GetWorkerOptionParam
}
export type GetWorkerResponse = WorkerType | undefined

/**
 * 
 * @param params 
 *  - 
 *  - withoutSelf
 *  - company
 *  - arrangements 
 *      - arrangementDate
 *  - workerTags
 *      - myCompanyId
        - siteId
        - myWorkerId
 *  - account
 *  - requestedCompany
 * @returns 
 */
export const _getWorker = async (params: GetWorkerParam): Promise<CustomResponse<GetWorkerResponse>> => {
    try {
        const result = await _callFunctions('IWorker-getWorker', params)
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

export const _getAllWorker = async (): Promise<CustomResponse<WorkerType[] | undefined>> => {
    try {
        const result = await _callFunctions('IWorker-getAllWorker')
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

export const _updateWorker = async (worker: Update<WorkerModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IWorker-updateWorker', worker)
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

export const _deleteWorker = async (workerId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IWorker-deleteWorker', workerId)
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

export type GetWorkerListByIdsParam = {
    workerIds: string[]
    options?: GetWorkerOptionParam
}
export type GetWorkerListByIdsResponse = WorkerListType | undefined
export const _getWorkerListByIds = async (params: GetWorkerListByIdsParam): Promise<CustomResponse<GetWorkerListByIdsResponse>> => {
    try {
        const result = await _callFunctions('IWorker-getWorkerListByIds', params)
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

export type GetWorkerListOfTargetCompanyParam = {
    companyId: string
    options?: GetWorkerOptionParam
}
export type GetWorkerListOfTargetCompanyResponse = WorkerListType | undefined
/**
 *
 * @param
 * @returns companyId所属の作業員
 */
export const _getWorkerListOfTargetCompany = async (params: GetWorkerListOfTargetCompanyParam): Promise<CustomResponse<GetWorkerListOfTargetCompanyResponse>> => {
    try {
        const result = await _callFunctions('IWorker-getWorkerListOfTargetCompany', params)
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

export type GetOwnerWorkerOfTargetCompanyParam = {
    companyId: string
    options?: GetWorkerOptionParam
}
export type GetOwnerWorkerOfTargetCompanyResponse = WorkerType | undefined
export const _getOwnerWorkerOfTargetCompany = async (params: GetOwnerWorkerOfTargetCompanyParam): Promise<CustomResponse<GetOwnerWorkerOfTargetCompanyResponse>> => {
    try {
        const result = await _callFunctions('IWorker-getOwnerWorkerOfTargetCompany', params)
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
 * @param workerId - ターゲットとなる作業員
 * @param myCompanyId - 自社。自社から見てどういう属性か検証するため。
 * @param myWorkerId - 自身。自身から見てどういう関係か検証するため。
 * @partial
 * @param worker - ターゲットとなる作業員。取得コストを減らすため。worker.account != undefinedだとさらに取得コストが減る。
 * @param siteId - 対象となる現場。現場から見てどういう関係にあるかを検証するため。（休みかどうか、退会済みかどうか、現場責任者かどうかなど）
 * @param site - 対象となる現場。取得コストを減らす。効率化のため。
 */
export type _GetWorkerTagsParam = {
    workerId?: string
    worker?: WorkerType
    myCompanyId: string
    myWorkerId: string
    siteId?: string
    site?: SiteType
    timeZoneOffset?: number
}
export type _GetWorkerTagsResponse = WorkerTagType[] | undefined
/**
 * @remarks 作業員の属性を取得する。自社との関係、自身との関係、現場との関係などを調べる。
 * @objective 作業員ごとの属性をまとめて表示する際に使用する。主にWorker.tsxにて。
 * @error
 * @param params - {@link _GetWorkerTagsParam}
 * @returns タグリストが返る。重複なし。 {@link _GetWorkerTagsResponse}
 */
export const _getWorkerTags = async (params: _GetWorkerTagsParam): Promise<CustomResponse<_GetWorkerTagsResponse>> => {
    try {
        const result = await _callFunctions('IWorker-getWorkerTags', params)
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

export type GetArrangeableWorkerOfTargetSiteAndCompanyParam = {
    companyId: string
    siteId: string
    options?: GetWorkerOptionParam
}

export type GetArrangeableWorkerOfTargetSiteAndCompanyResponse = CompanyWorkerListType | undefined
/**
 *
 * @param params
 * @returns 現場に手配可能な作業員（自社、他社常用予約）を取得。休みや同日重複、isOfficeWorkerは考慮しない。
 */
export const _getArrangeableWorkersOfTargetSiteAndCompany = async (
    params: GetArrangeableWorkerOfTargetSiteAndCompanyParam,
): Promise<CustomResponse<GetArrangeableWorkerOfTargetSiteAndCompanyResponse>> => {
    try {
        const result = await _callFunctions('IWorker-getArrangeableWorkersOfTargetSiteAndCompany', params)
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

export type GetArrangeableWorkerOfTargetDateAndCompanyParam = {
    companyId: string
    date: YYYYMMDDTotalSecondsParam
    endDate: YYYYMMDDTotalSecondsParam
    options?: GetWorkerOptionParam
}
export type GetArrangeableWorkerOfTargetDateAndCompanyResponse = CompanyWorkerListType | undefined
/**
 *
 * @param params
 * @returns 現場に手配可能な作業員（自社、他社常用依頼）を取得。休みや同日重複、isOfficeWorkerは考慮しない。
 */
export const _getArrangeableWorkersOfTargetDateAndCompany = async (
    params: GetArrangeableWorkerOfTargetDateAndCompanyParam,
): Promise<CustomResponse<GetArrangeableWorkerOfTargetDateAndCompanyResponse>> => {
    try {
        const result = await _callFunctions('IWorker-getArrangeableWorkersOfTargetDateAndCompany', params)
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
 * @params name - 同名を比較する名前
 * @params companyRole - 指定がなければ全作業員名から比較
 */
export type GetSameNameWorkersParam = {
    name: string
    companyRole?: CompanyRoleEnumType
}
export type GetSameNameWorkersResponse = WorkerType[] | undefined

/**
 * @summary 指定した名前と同名の作業員を取得する
 * @param params
 * @returns 同名者の名前と会社ID
 */
export const _getSameNameWorkers = async (params: GetSameNameWorkersParam): Promise<CustomResponse<GetSameNameWorkersResponse>> => {
    try {
        const result = await _callFunctions('IWorker-getSameNameWorkers', params)
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
