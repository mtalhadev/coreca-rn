import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _getLastLoggedInAtOfTargetWorker, _updateUserInfo } from '../../services/userInfo/userInfoService'

export type getLastLoggedInAtOfTargetWorkerParams = {
    userInfoId?: string
}

/**
 * @remarks 指定ワーカーの最終ログイン時刻を取得
 * @objective 勤怠に表示するため
 * @param params - {@link getLastLoggedInAtOfTargetWorkerParams}
 * @returns - lastLoggedInAt
 */
export const getLastLoggedInAtTargetWorker = async (params: getLastLoggedInAtOfTargetWorkerParams): Promise<CustomResponse<number>> => {
    try {
        const { userInfoId } = params
        if (userInfoId == undefined) {
            throw {
                error: 'userInfoIdがありません。',
                errorCode: 'USER_STATE_ERROR',
            } as CustomResponse
        }

        const result = await _getLastLoggedInAtOfTargetWorker({ userInfoId: userInfoId ?? 'no-id' })

        if (result.error) {
            throw {
                error: result.error,
                errorCode: 'USER_STATE_ERROR',
            }
        }
        const lastLoggedInAt = result.success

        return Promise.resolve({
            success: lastLoggedInAt,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type updateUserInfoParams = {
    userInfoId?: string
    lastLoggedInAt?: number
}

/**
 * @remarks 指定ワーカーの最終ログイン時刻を更新
 * @param params - {@link updateUserInfoParams}
 */
export const updateUserInfo = async (params: updateUserInfoParams): Promise<CustomResponse> => {
    try {
        const { userInfoId, lastLoggedInAt } = params
        if (userInfoId == undefined || lastLoggedInAt == undefined) {
            throw {
                error: 'userInfoId、またはlastLoggedInAtがありません。',
                errorCode: 'USER_STATE_ERROR',
            } as CustomResponse
        }

        const updateResult = await _updateUserInfo({ userInfoId: userInfoId ?? 'no-id', lastLoggedInAt })

        if (updateResult.error) {
            throw {
                error: updateResult.error,
                errorCode: 'USER_STATE_ERROR',
            }
        }

        return Promise.resolve({
            success: undefined,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
