import { Dispatch } from 'react'
import { AccountType } from '../../models/account/Account'
import { CompanyRoleEnumType } from '../../models/worker/CompanyRoleEnumType'
import { _getLocalAccountList, _deleteLocalAccount, _login, _setAccountListForDev } from '../../services/account/AccountService'
import { _getCompany } from '../../services/company/CompanyService'
import { _getWorker } from '../../services/worker/WorkerService'
import { setBelongCompanyId } from '../../stores/AccountSlice'
import { setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { getDailyStartTime } from '../../models/_others/CustomDate'
import { newDate } from '../../utils/ext/Date.extensions'

export const getAccountList = async (): Promise<CustomResponse<SelectableAccountType[]>> => {
    try {
        const __isValidAccount = (account?: AccountType) => {
            return account?.accountId && account.email && account.password && account.workerId
        }
        const _accounts = await _getLocalAccountList()
        const _selectableAccount = await Promise.all(
            _accounts
                .map(async (account) => {
                    try {
                        if (!__isValidAccount(account)) {
                            /**
                             * ローカルのAccountデータが正しくなれけば削除。
                             */
                            await _deleteLocalAccount(account.accountId)
                            return Promise.resolve(undefined)
                        }
                        const selectedAccountResult = await getSelectedAccount(account)
                        if (selectedAccountResult.error) {
                            return Promise.resolve(undefined)
                        }
                        if (!__isValidAccount(selectedAccountResult.success)) {
                            /**
                             * 取得したDBのデータが正しくなかればローカル削除。
                             */
                            await _deleteLocalAccount(account.accountId)
                            return Promise.resolve(undefined)
                        }
                        return Promise.resolve(selectedAccountResult.success)
                    } catch {
                        return Promise.resolve(undefined)
                    }
                })
                .filter((func) => func != undefined) ?? [],
        )
        return Promise.resolve({
            success: (_selectableAccount.filter((account) => account != undefined) ?? []) as SelectableAccountType[],
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type SelectAccountAndLoginSuccessType = 'no-worker' | 'no-company' | 'admin-side' | 'worker-side' | 'withdrawn'

export const selectAccountAndLogin = async (selectableAccount: SelectableAccountType, dispatch: Dispatch<any>): Promise<CustomResponse<SelectAccountAndLoginSuccessType>> => {
    try {
        if (!(selectableAccount.email && selectableAccount.password && selectableAccount.accountId && selectableAccount.workerId)) {
            throw {
                error: 'アカウント情報が間違っています。',
            } as CustomResponse
        }
        const result = await _login(selectableAccount.email, selectableAccount.password)

        if (result.error || result.success?.accountId != selectableAccount.accountId) {
            throw {
                error: result.error,
            } as CustomResponse
        }
        const worker = await _getWorker({ workerId: result.success?.workerId ?? 'no-id' })
        if (!worker.success?.companyId) {
            return Promise.resolve({
                success: 'no-worker',
            })
        }

        const leftDate = worker?.success?.leftDate
        if (leftDate && leftDate < newDate().toCustomDate().totalSeconds) {
            return Promise.resolve({
                success: 'withdrawn',
            })
        }

        dispatch(setBelongCompanyId(worker.success?.companyId))
        const company = await _getCompany({ companyId: worker.success?.companyId ?? 'no-id' })
        if (!company.success) {
            return Promise.resolve({
                success: 'no-company',
            })
        }
        if (selectableAccount.companyRole == 'manager' || selectableAccount.companyRole == 'owner') {
            return Promise.resolve({
                success: 'admin-side',
            })
        } else if (selectableAccount.companyRole == 'general') {
            return Promise.resolve({
                success: 'worker-side',
            })
        }
        throw {
            error: 'すでに退会済みです。',
        } as CustomResponse
    } catch (error) {
        return getErrorMessage(error)
    }
}

type _SelectableAccountType = {
    companyName: string
    companyImageUri: string
    sCompanyImageUri: string
    xsCompanyImageUri: string
    companyImageColorHue: number
    workerName: string
    companyRole: CompanyRoleEnumType
    workerImageColorHue: number
    workerImageUri: string
    sWorkerImageUri: string
    xsWorkerImageUri: string
} & AccountType

export type SelectableAccountType = Partial<_SelectableAccountType>

export const getSelectedAccount = async (account: AccountType): Promise<CustomResponse<SelectableAccountType>> => {
    try {
        if (!(account.email && account.accountId && account.workerId)) {
            throw {
                error: 'アカウントが正しくありません。',
            }
        }

        const worker = await _getWorker({ workerId: account.workerId })
        if (worker.error) {
            throw {
                error: worker.error,
            }
        }
        const workerObj = worker.success
        if (!workerObj) {
            throw {
                error: 'Workerと結びついていません。',
            }
        }

        const company = await _getCompany({ companyId: workerObj?.companyId ?? 'no-id' })
        if (company.error) {
            throw {
                error: company.error,
            }
        }
        const companyObj = company.success
        if (!companyObj) {
            throw {
                error: 'Companyと結びついていません。',
            }
        }

        return Promise.resolve({
            success: {
                companyImageUri: companyObj.imageUrl,
                sCompanyImageUri: companyObj.sImageUrl,
                xsCompanyImageUri: companyObj.xsImageUrl,
                companyImageColorHue: companyObj.imageColorHue,
                companyName: companyObj.name,
                workerName: workerObj.name,
                companyRole: workerObj.companyRole,
                workerImageUri: workerObj.imageUrl,
                sWorkerImageUri: workerObj.sImageUrl,
                xsWorkerImageUri: workerObj.xsImageUrl,
                workerImageColorHue: workerObj.imageColorHue,
                ...account,
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
