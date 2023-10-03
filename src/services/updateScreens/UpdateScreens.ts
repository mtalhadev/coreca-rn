import { _callFunctions } from '../firebase/FunctionsService'
import { Create, Update } from '../../models/_others/Common'

import { getErrorMessage } from '../_others/ErrorService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { GetUpdateScreensOptionParam, UpdateScreensModel, UpdateScreensType } from '../../models/updateScreens/UpdateScreens'

export const _createUpdateScreens = async (updateScreens: Create<UpdateScreensModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IUpdateScreens-createUpdateScreens', updateScreens)
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

export type GetUpdateScreensParam = {
    updateScreensId: string
    options?: GetUpdateScreensOptionParam
}
export type GetUpdateScreensResponse = UpdateScreensType | undefined
/**
 * 
 * @param params 
 *  - updateScreensId?: string
    - options?: OptionParam<GetUpdateScreensOptionParam>
 * @returns 
 */
export const _getUpdateScreens = async (params: GetUpdateScreensParam): Promise<CustomResponse<GetUpdateScreensResponse>> => {
    try {
        const result = await _callFunctions('IUpdateScreens-getUpdateScreens', params)
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

export const _updateUpdateScreens = async (updateScreens: Update<UpdateScreensModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IUpdateScreens-updateUpdateScreens', updateScreens)
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

export const _deleteUpdateScreens = async (updateScreensId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IUpdateScreens-deleteUpdateScreens', updateScreensId)
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

export type GetUpdateScreensOfTargetAccountParam = {
    accountId: string
    options?: GetUpdateScreensOptionParam
}
export const _getUpdateScreensOfTargetAccount = async (params: GetUpdateScreensOfTargetAccountParam): Promise<CustomResponse<UpdateScreensType | undefined>> => {
    try {
        const result = await _callFunctions('IUpdateScreens-getUpdateScreensOfTargetAccount', params)
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
