import { _callFunctions } from '../firebase/FunctionsService'
import { Update } from '../../models/_others/Common'
import { getErrorMessage } from '../_others/ErrorService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { UserInfoModel } from '../../models/userInfo/userInfo'

export const _updateUserInfo = async (userInfo: Update<UserInfoModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IUserInfo-updateUserInfo', userInfo)
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

export type GetLastLaggedInAtOfTargetWorkerParam = {
    userInfoId: string
}

export const _getLastLoggedInAtOfTargetWorker = async (params: GetLastLaggedInAtOfTargetWorkerParam): Promise<CustomResponse<number>> => {
    try {
        const result = await _callFunctions('IUserInfo-getLastLoggedInAtOfTargetWorker', params)
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
