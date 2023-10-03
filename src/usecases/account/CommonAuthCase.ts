import { _forgetPassword, _logout } from '../../services/account/AccountService'
import { _getWorker } from '../../services/worker/WorkerService'
import { CustomResponse } from '../../models/_others/CustomResponse'

export const resetPassword = async (email?: string): Promise<CustomResponse> => {
    try {
        const result = await _forgetPassword(email ?? 'no-id')
        if (result.error) {
            throw {
                error: result.error,
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        const _error = error as CustomResponse
        return Promise.resolve({
            error: _error.error,
        })
    }
}

export const signOut = async (): Promise<CustomResponse> => {
    try {
        const result = await _logout()
        if (result.error) {
            throw {
                error: result.error,
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        const _error = error as CustomResponse
        return Promise.resolve({
            error: _error.error,
        })
    }
}

export type CheckIsCompanyOwnerParam = {
    workerId?: string
    myCompanyId?: string
}

export type CheckIsCompanyOwnerResponse = {
    isOwner?: boolean
    isCorecaAdmin?: boolean
}

export const checkIsCompanyOwner = async (params: CheckIsCompanyOwnerParam): Promise<CustomResponse<CheckIsCompanyOwnerResponse>> => {
    try {
        const { myCompanyId, workerId } = params
        if (myCompanyId == undefined || workerId == undefined) {
            throw {
                error: '認証情報がありません。ログインし直してください。',
            } as CustomResponse
        }
        const result = await _getWorker({ workerId, options: {
            company: true
        } })
        if (result.error) {
            throw {
                error: result.error,
            }
        }
        return Promise.resolve({
            success: {
                isOwner: (result.success && result.success.companyId == myCompanyId && result.success.companyRole == 'owner') ? true : false,
                isCorecaAdmin: (result.success && result.success.company?.isAdmin == true) ? true : false
            },
        })
    } catch (error) {
        const _error = error as CustomResponse
        return Promise.resolve({
            error: _error.error,
        })
    }
}
