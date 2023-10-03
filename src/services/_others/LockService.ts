import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { getErrorMessage } from './ErrorService'
import { CustomResponse } from '../../models/_others/CustomResponse'

import { GetLockOptionParam, LockModel, LockType, modelType } from '../../models/lock/lock'

/**
 * @remarks データベースにlockを新規作成する
 * @objective lockを作成するため
 * @error
 * @param LOCK_ERROR - lock作成のための情報が不足した場合
 * @author Kamiya
 * @param lock - 作成したいlock
 * @returns - 作成したLockId
 */
export const _createLock = async (lock: Create<LockModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('ILock-createLock', lock)
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
 * @param lockId - 取得したいlockのId
 * @partial
 * @param options - 追加取得したい情報(現状未実装)
 */
export type GetLockParam = {
    lockId: string
    options?: GetLockOptionParam
}
/**
 * 取得したlock
 */
export type GetLockResponse = LockType | undefined
/**
 * @remarks lockを取得
 * @objective 更新・削除・ロック状態の確認のため
 * @error
 * - FUNC_ERROR - 関数でエラーが発生した場合（未実装のため現状発生しない）
 * @author Kamiya
 * @param params - {@link GetLockParam}
 * @returns - {@link GetLockResponse}
 */
export const _getLock = async (params: GetLockParam): Promise<CustomResponse<GetLockResponse>> => {
    try {
        const result = await _callFunctions('ILock-getLock', params)
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
 * @remarks lockを更新
 * @objective lockを更新するため
 * @error
 * - UPDATE_ERROR - 更新失敗した場合
 * @author Kamiya
 * @param lock - 更新したいlock
 * @returns - 更新したlockのId
 */
export const _updateLock = async (lock: Update<LockModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('ILock-updateLock', lock)
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
 * @remarks lockを削除
 * @objective lockを削除するため
 * @author Kamiya
 * @param lockId - 削除したいlockId
 * @returns - boolean
 */
export const _deleteLock = async (lockId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('ILock-deleteLock', lockId)
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
 * - targetId - 取得したいlockのtargetId（例：現場ならSiteId）
 * - modelType - 取得したいlockのModel（例：現場ならsite）
 * @partial
 * - options - 追加で取得したい情報(現状未実装)
 */
export type GetLockOfTargetParam = {
    targetId: string
    modelType: modelType
    options?: GetLockOptionParam
}
/**
 * - LockType - 取得したlock
 */
export type GetLockOfTargetResponse = LockType | undefined
/**
 * @remarks targetIdのlockを取得する（例：現場なら、siteIdに紐づくlockを取得する）
 * @objective 同時編集を防ぐため
 * @author Kamiya
 * @param params - {@link GetLockOfTargetParam}
 * @returns - {@link GetLockOfTargetResponse}

 */
export const _getLockOfTarget = async (params: GetLockOfTargetParam): Promise<CustomResponse<GetLockOfTargetResponse>> => {
    try {
        const result = await _callFunctions('ILock-getLockOfTarget', params)
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
