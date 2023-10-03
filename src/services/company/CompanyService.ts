import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { CompanyModel, GetCompanyOptionParam, CompanyType } from '../../models/company/Company'
import { CompanyListType, LastDealType } from '../../models/company/CompanyListType'
import { GetConstructionCompanyListType, ConstructionCompanyListType, ConstructionCompanyListCLType } from '../../models/company/ConstructionCompanyListType'
import { ProjectCompanyListType } from '../../models/company/ProjectCompanyListType'
import { GetSiteCompanyListType, SiteCompanyListType } from '../../models/company/SiteCompanyListType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'

export const _createCompany = async (company: Create<CompanyModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('ICompany-createCompany', company)
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

export type GetCompanyParam = {
    companyId: string
    options?: GetCompanyOptionParam
}

export type GetCompanyResponse = CompanyType | undefined

export const _getCompany = async (params: GetCompanyParam): Promise<CustomResponse<GetCompanyResponse>> => {
    try {
        const result = await _callFunctions('ICompany-getCompany', params)
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

export const _updateCompany = async (company: Update<CompanyModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('ICompany-updateCompany', company)
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

export const _deleteCompany = async (companyId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('ICompany-deleteCompany', companyId)
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

export type FilterCompanyListParam = {
    keyword: string
    options?: GetCompanyOptionParam
}
export type FilterCompanyListResponse = CompanyListType | undefined
export const _filterCompanyList = async (params: FilterCompanyListParam): Promise<CustomResponse<FilterCompanyListResponse>> => {
    try {
        const result = await _callFunctions('ICompany-filterCompanyList', params)
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

export type GetCompanyListByIdsParam = {
    companyIds: string[]
    options?: GetCompanyOptionParam
}
export type GetCompanyListByIdsResponse = CompanyListType | undefined
export const _getCompanyListByIds = async (params: GetCompanyListByIdsParam): Promise<CustomResponse<GetCompanyListByIdsResponse>> => {
    try {
        const result = await _callFunctions('ICompany-getCompanyListByIds', params)
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

export const _getCompanyOfAccount = async (accountId: string): Promise<CustomResponse<CompanyType | undefined>> => {
    try {
        const result = await _callFunctions('ICompany-getCompanyOfAccount', accountId)
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

export type GetPartnerCompaniesOfTargetCompanyParam = {
    companyId: string
    options?: GetCompanyOptionParam
}
export type GetPartnerCompaniesOfTargetCompanyResponse = CompanyListType | undefined
/**
 *
 * @param params
 * @returns 会社の顧客/取引先を全て取得。
 */
export const _getPartnerCompaniesOfTargetCompany = async (params: GetPartnerCompaniesOfTargetCompanyParam): Promise<CustomResponse<GetPartnerCompaniesOfTargetCompanyResponse>> => {
    try {
        const result = await _callFunctions('ICompany-getPartnerCompaniesOfTargetCompany', params)
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

export type GetConnectedCompanyOfTargetCompanyParam = {
    myCompanyId: string
    companyId: string
    options?: GetCompanyOptionParam
}
export type GetConnectedCompanyOfTargetCompanyResponse = CompanyType | undefined
/**
 *
 * @param params
 * @returns companyIdと結合している会社を取得。仮会社でも登録会社でも使用可能。登録会社の場合、結合しているのは自社の仮会社限定。
 */
export const _getConnectedCompanyOfTargetCompany = async (params: GetConnectedCompanyOfTargetCompanyParam): Promise<CustomResponse<GetConnectedCompanyOfTargetCompanyResponse>> => {
    try {
        const result = await _callFunctions('ICompany-getConnectedCompanyOfTargetCompany', params)
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

export type GetCompanyListOfTargetProjectParam = {
    projectId: string
    options?: GetCompanyOptionParam
}
export type GetCompanyListOfTargetProjectResponse = ProjectCompanyListType | undefined

/**
 *
 * @param params
 * @returns 案件に関わる会社を全て取得。（顧客、施工、仲介に分かれる）
 */
export const _getCompanyListOfTargetProject = async (params: GetCompanyListOfTargetProjectParam): Promise<CustomResponse<GetCompanyListOfTargetProjectResponse>> => {
    try {
        const result = await _callFunctions('ICompany-getCompanyListOfTargetProject', params)
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

export type getLastDealAtTargetCompanyParam = {
    companyId: string
    targetCompanyId: string
}

/**
 *
 * @param params
 * @returns 顧客/取引先との最終取引日時を取得
 */
export const _getLastDealAtTargetCompany = async (params: getLastDealAtTargetCompanyParam): Promise<CustomResponse<LastDealType>> => {
    try {
        const result = await _callFunctions('ICompany-getLastDealAtTargetCompany', params)
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

export type GetCompanyListOfTargetSiteParam = {
    siteId: string
    types?: GetSiteCompanyListType
    options?: GetCompanyOptionParam
}
export type GetCompanyListOfTargetSiteResponse = SiteCompanyListType | undefined

/**
 *
 * @param params
 * @returns 案件に関わる会社を全て取得。（顧客、施工、仲介に分かれる。間違って仲介工事などに現場が作成されちゃうと施工会社がない場合もある。）
 */
export const _getCompanyListOfTargetSite = async (params: GetCompanyListOfTargetSiteParam): Promise<CustomResponse<GetCompanyListOfTargetSiteResponse>> => {
    try {
        const result = await _callFunctions('ICompany-getCompanyListOfTargetSite', params)
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

export type getCompanyListOfTargetConstructionParam = {
    constructionId: string
    types?: GetConstructionCompanyListType
    options?: GetCompanyOptionParam
}
export type getCompanyListOfTargetConstructionResponse = ConstructionCompanyListCLType | undefined

/**
 *
 * @param params
 * @returns 案件に関わる会社を全て取得。（顧客、施工、仲介に分かれる。間違って仲介工事などに現場が作成されちゃうと施工会社がない場合もある。）
 */
export const _getCompanyListOfTargetConstruction = async (params: getCompanyListOfTargetConstructionParam): Promise<CustomResponse<getCompanyListOfTargetConstructionResponse>> => {
    try {
        const result = await _callFunctions('ICompany-getCompanyListOfTargetConstruction', params)
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

export type getAllCompaniesResponse = CompanyListType | undefined
/**
 *
 * @returns 全ての会社を取得。
 */
export const _getAllCompanies = async (): Promise<CustomResponse<getAllCompaniesResponse>> => {
    try {
        const result = await _callFunctions('ICompany-getAllCompanies', {})
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
 * @param name -同名会社が存在するか確認する会社名
 * @param companyIds 会社名を比較する会社ID
 * @param isFake - デフォルトfalse（連携済み会社）
 */
export type GetSameNameCompaniesParam = {
    name?: string
    companyIds?: string[]
    isFake?: boolean
}
/**
 * @summary 指定した会社名と同名の会社を取得
 * @param params
 * @returns
 */
export type GetSameNameCompaniesResponse = CompanyType[] | undefined

/**
 *
 * @returns
 */
export const _getSameNameCompanies = async (params: GetSameNameCompaniesParam): Promise<CustomResponse<GetSameNameCompaniesResponse>> => {
    try {
        const result = await _callFunctions('ICompany-getSameNameCompanies', params)
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
