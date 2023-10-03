import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common'
import { ID } from '../_others/ID'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'

export type modelType = 'worker' | 'company' | 'contract' | 'construction' | 'site' | 'project' | 'attendance' | 'reservation' | 'instruction' | 'attendanceModification' | 'invReservation' | 'invRequest' | 'department'

/**
 *
 *  - lockedBy - ロックした人のworkerId
 *  - modelType - ロックするコレクション（Siteなど）
 *  - targetId - modelTypeの対象とするID（SiteならsiteId）
 *
 */
export type LockModel = Partial<{
    lockId: ID
    lockedBy: ID
    modelType: modelType
    targetId: ID
}> &
    CommonModel

export const initLock = (lock: Create<LockModel> | Update<LockModel>): Update<LockModel> => {
    const newLock: Update<LockModel> = {
        lockId: lock.lockId,
        lockedAt: lock.lockedAt,
        lockedBy: lock.lockedBy,
        modelType: lock.modelType,
        targetId: lock.targetId,
    }
    return newLock
}

/**
 * {@link LockOptionInputParam - 説明}
 */
export type LockOptionInputParam = ReplaceAnd<
    GetOptionObjectType<LockOptionParam>,
    {
        //
    }
>

/**
 * {@link LockOptionParam - 説明}
 */
export type LockOptionParam = {
    //
}

export type LockType = LockModel & LockOptionParam
export type GetLockOptionParam = GetOptionParam<LockType, LockOptionParam, LockOptionInputParam>

export type LockCLType = ReplaceAnd<LockType, CommonCLType>

export const toLockCLType = (data?: LockType): LockCLType => {
    return {
        ...data,
        ...toCommonCLType(data),
    } as LockCLType
}
