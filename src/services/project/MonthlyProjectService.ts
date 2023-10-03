import { Create, Update } from '../../models/_others/Common'
import { GetMonthlyProjectOptionParam, initMonthlyProject, MonthlyProjectModel, MonthlyProjectType } from '../../models/project/MonthlyProjectType'
import { getRandomImageColorHue, getUuidv4, isNoValueObject } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { _getCompany } from '../company/CompanyService'
import { _getConstruction } from '../construction/ConstructionService'
import {
    _getContract,
    _getContractListOfTargetCompany,
    _getContractOfTargetConstruction,
} from '../contract/ContractService'
import { getOption, OptionPromiseType } from '../../models/_others/Option'
import { _getSite, _getSiteListOfTargetConstruction } from '../site/SiteService'
import { _getWorker } from '../worker/WorkerService'
import { ID } from '../../models/_others/ID'
import { YYYYMMTotalSecondsParam } from '../../models/_others/TotalSeconds'
import { _callFunctions } from '../firebase/FunctionsService'
import { getErrorMessage } from '../_others/ErrorService'



/**
 * @require
 * @param companyId - 必須。会社ID
 * @param month - 必須。月
 * @param endOfMonth - 必須。月の終わり。TZの関係で必須。
 */
export type _getMonthlyProjectOfTargetSpanAndCompanyParam = {
    companyId: ID
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
}

export type _getMonthlyProjectOfTargetSpanAndCompanyResponse = MonthlyProjectType[] | undefined
/**
 * @remarks 指定した期間と会社の生成案件データを取得する。
 * @author Hiruma
 * @param params - {@link _getMonthlyProjectOfTargetSpanAndCompanyParam}
 * @returns - {@link _getMonthlyProjectOfTargetSpanAndCompanyResponse}
 */
export const _getMonthlyProjectOfTargetSpanAndCompany = async (params: _getMonthlyProjectOfTargetSpanAndCompanyParam): Promise<CustomResponse<_getMonthlyProjectOfTargetSpanAndCompanyResponse>> => {
    try {
        const result = await _callFunctions('IMonthlyProject-getMonthlyProjectOfTargetSpanAndCompany', params)
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
 * @remarks 案件を作成
 * @param monthlyProject 
 * @returns 
 */
export const _createMonthlyProject = async (monthlyProject: Create<MonthlyProjectModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IMonthlyProject-createMonthlyProject', monthlyProject)
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

export type GetMonthlyProjectParam = {
    monthlyProjectId: string
    options?: GetMonthlyProjectOptionParam
}

export type GetMonthlyProjectResponse = MonthlyProjectType | undefined
/**
 * @remark 指定した生成案件を取得する。optionsを渡すことで、周辺情報も取得する。
 * @param options -
 *  
 *  - withoutSelf - 自身を取得しない。周辺情報が欲しい場合に使用。自身のデータを入力する。
 * @returns
 */
export const _getMonthlyProject = async (params: GetMonthlyProjectParam): Promise<CustomResponse<GetMonthlyProjectResponse>> => {
    try {
        const result = await _callFunctions('IMonthlyProject-getMonthlyProject', params)
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
 * @remarks 案件を更新
 * @param monthlyProject 
 * @returns 
 */
export const _updateMonthlyProject = async (monthlyProject: Update<MonthlyProjectModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IMonthlyProject-updateMonthlyProject', monthlyProject)
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
 * @remarks 案件を削除
 * @param monthlyProjectId 
 * @returns 削除に成功ならtrue
 */
export const _deleteMonthlyProject = async (monthlyProjectId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IMonthlyProject-deleteMonthlyProject', monthlyProjectId)
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
