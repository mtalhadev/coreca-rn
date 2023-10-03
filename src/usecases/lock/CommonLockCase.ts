import { GetLockOptionParam, LockType, modelType } from '../../models/lock/lock'
import { _getLockOfTarget, _updateLock, _createLock, _deleteLock } from '../../services/_others/LockService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { CustomDate, newCustomDate, nextSecond } from "../../models/_others/CustomDate"
import { getUuidv4 } from '../../utils/Utils'
import { getErrorMessage } from '../../services/_others/ErrorService'
/**
 * @requires
 * - myWorkerId - 作業者のId
 * - targetId - ロックしたい対象のId
 * - modelType - ロックしたい対象のModelType
 * @partial
 * - options - 追加取得したい情報
 */
export type CheckLockOfTargetParam = {
    myWorkerId: string
    targetId: string
    modelType: modelType
    options?: GetLockOptionParam
}

/**
 * @remarks 編集対象がロックされているか確認する
 * @objective 同時編集を防ぐため。
 * @error
 * - LOCK_RESPONSE - 他の作業員が編集中の場合
 * - LOCK_ERROR - Lockの取得に失敗した場合
 * @author Kamiya
 * @param params - {@link CheckLockOfTargetParam}
 * @returns - void
 */
export const checkLockOfTarget = async (params: CheckLockOfTargetParam): Promise<CustomResponse> => {
    try {
        const { targetId, myWorkerId, modelType, options } = params
        const lockResult = await _getLockOfTarget({ targetId, modelType, options })
        if (lockResult.success) {
            if (!(lockResult.success?.lockedBy == myWorkerId || (lockResult.success?.lockedAt && lockResult.success?.lockedAt < nextSecond(newCustomDate(), -6).totalSeconds))) {
                throw {
                    error: '他の方が編集中です',
                    errorCode: 'LOCK_RESPONSE',
                }
            }
        } else if (lockResult.error) {
            throw {
                error: lockResult.error,
                errorCode: 'LOCK_ERROR',
            }
        }
        return Promise.resolve({
            success: undefined,
            error: undefined,
        } as CustomResponse)
    } catch (error: any) {
        return getErrorMessage(error)
    }
}
/**
 * @requires
 * - myWorkerId - 作業者のId
 * - targetId - ロックしたい対象のId
 * - modelType - ロックしたい対象のModelType
 * @partial
 * - unlock - Lockを解除する場合のみtrue
 * - options - 追加取得したい情報
 */
export type UpdateLockOfTargetParam = {
    myWorkerId: string
    targetId: string
    modelType: modelType
    unlock?: boolean
    options?: GetLockOptionParam
}

/**
 * @remarks Lockを更新または解除する。
 * @objective 同時編集を防ぐため。
 * 編集画面に遷移したら発火するようにする。インターバルで、5秒おきに更新
 * @error
 * - LOCK_RESPONSE - 他の作業員が編集中の場合
 * - LOCK_ERROR - Lockの取得に失敗した場合
 * @author Kamiya
 * @param params - {@link UpdateLockOfTargetParam}
 * @returns - lockId
 */
export const updateLockOfTarget = async (params: UpdateLockOfTargetParam): Promise<CustomResponse<string>> => {
    try {
        const { targetId, myWorkerId, modelType, unlock, options } = params
        const lockResult = await _getLockOfTarget({ targetId, modelType, options })
        const newLock: LockType = {
            lockId: lockResult.success?.lockId ?? getUuidv4(),
            lockedBy: myWorkerId,
            modelType: modelType,
            targetId: targetId,
            lockedAt: lockResult.success && unlock ? nextSecond(newCustomDate(), -5).totalSeconds : newCustomDate().totalSeconds,
        }

        if (lockResult.success) {
            //ロックしたのが自分または、他者のロックから6秒経過(ロックの更新を5秒おきに行うため、ラグを考慮してロックの判定は6秒としている。)
            if (lockResult.success?.lockedBy == myWorkerId || (lockResult.success?.lockedAt && lockResult.success?.lockedAt < nextSecond(newCustomDate(), -6).totalSeconds)) {
                const result = await _updateLock(newLock)
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: 'LOCK_ERROR',
                    } as CustomResponse
                }
            } else {
                throw {
                    error: '他の方が編集中です。',
                    errorCode: 'LOCK_RESPONSE',
                }
            }
        } else if (!unlock) {
            //初めて編集を行うデータ
            const result = await _createLock(newLock)
            if (result.error) {
                throw {
                    error: result.error,
                } as CustomResponse
            }
        }
        return Promise.resolve({
            success: newLock.lockId,
            error: undefined,
        } as CustomResponse<string>)
    } catch (error: any) {
        return getErrorMessage(error)
    }
}
