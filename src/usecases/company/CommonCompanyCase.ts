import isEmpty from 'lodash/isEmpty'
import { CompanyCLType, CompanyType, toCompanyCLType } from '../../models/company/Company'
import { toWorkerCLType, WorkerCLType } from '../../models/worker/Worker'
import { CompanyRoleEnumType } from '../../models/worker/CompanyRoleEnumType'
import { _getAccount, _getAccountOfTargetWorker } from '../../services/account/AccountService'
import { _getCompany } from '../../services/company/CompanyService'
import { _getOwnerWorkerOfTargetCompany, _getWorker } from '../../services/worker/WorkerService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { match } from 'ts-pattern'
import { StackNavigationProp } from '@react-navigation/stack'
import { CompanyProfileDisplayType } from '../../components/template/CompanyProfile'
import { GetInviteCompanyUrlParam, getInviteUrl } from './InviteCompanyCase'

export const companyRoleToText = (role?: CompanyRoleEnumType): string | undefined => {
    if (role == undefined) {
        return undefined
    }
    return match(role)
        .with('general', () => companyRoleTextList[0] ?? 'エラー')
        .with('manager', () => companyRoleTextList[1] ?? 'エラー')
        .with('owner', () => companyRoleTextList[2] ?? 'エラー')
        .otherwise(() => undefined)
}

export const textToCompanyRole = (text?: string): CompanyRoleEnumType | undefined => {
    if (text == undefined) {
        return undefined
    }
    return match(text)
        .with('一般作業員', () => 'general')
        .with('管理者', () => 'manager')
        .with('代表者', () => 'owner')
        .otherwise(() => undefined) as CompanyRoleEnumType | undefined
}

export const companyRoleToNum = (companyRole?: CompanyRoleEnumType): number => {
    return match(companyRole)
        .with('owner', () => 3)
        .with('manager', () => 2)
        .with('general', () => 1)
        .otherwise(() => 0)
}

export const companyRoleTextList = ['一般作業員', '管理者', '代表者']

/**
 役職　     権限　     職人かどうか
代表者     代表者        いいえ
一人親方   代表者         はい
事務員     管理者        いいえ
現場管理者  管理者    　   はい
職人     　一般作業員　    はい
 */
export const titleTextList = ['代表者', '一人親方', '事務員', '現場管理者', '職人']

export const titleToCompanyRole = (title?: string): string | undefined => {
    if (title == undefined) {
        return undefined
    }
    return match(title)
        .with(titleTextList[0], () => 'owner')
        .with(titleTextList[1], () => 'owner')
        .with(titleTextList[2], () => 'manager')
        .with(titleTextList[3], () => 'manager')
        .with(titleTextList[4], () => 'general')
        .otherwise(() => undefined)
}

export const titleToCompanyRoleText = (title?: string): string | undefined => {
    if (title == undefined) {
        return undefined
    }
    return match(title)
        .with(titleTextList[0], () => companyRoleTextList[2])
        .with(titleTextList[1], () => companyRoleTextList[2])
        .with(titleTextList[2], () => companyRoleTextList[1])
        .with(titleTextList[3], () => companyRoleTextList[1])
        .with(titleTextList[4], () => companyRoleTextList[0])
        .otherwise(() => undefined)
}

export const titleToIsOfficeWorker = (title?: string): boolean | undefined => {
    if (title == undefined) {
        return undefined
    }
    return match(title)
        .with(titleTextList[0], () => true)
        .with(titleTextList[1], () => false)
        .with(titleTextList[2], () => true)
        .with(titleTextList[3], () => false)
        .with(titleTextList[4], () => false)
        .otherwise(() => undefined)
}

type InputToTitle = { companyRole?: CompanyRoleEnumType; isOfficeWorker?: boolean }

export const companyRoleAndIsOfficeWorkerToTitle = (input: InputToTitle): string | undefined => {
    if (input?.companyRole == undefined || input?.isOfficeWorker == undefined) {
        return undefined
    }
    return match(input)
        .with({ companyRole: 'owner', isOfficeWorker: true }, () => titleTextList[0])
        .with({ companyRole: 'owner', isOfficeWorker: false }, () => titleTextList[1])
        .with({ companyRole: 'manager', isOfficeWorker: true }, () => titleTextList[2])
        .with({ companyRole: 'manager', isOfficeWorker: false }, () => titleTextList[3])
        .with({ companyRole: 'general', isOfficeWorker: false }, () => titleTextList[4])
        .otherwise(() => undefined)
}

export type GetAnyCompanyParam = {
    companyId?: string
    myCompanyId?: string
    workerId?: string
}

export type GetAnyCompanyResponse =
    | {
          company?: CompanyCLType
          worker?: WorkerCLType
      }
    | undefined

export const getAnyCompany = async (params: GetAnyCompanyParam): Promise<CustomResponse<GetAnyCompanyResponse>> => {
    try {
        const { companyId, myCompanyId, workerId } = params
        if (isEmpty(companyId) || companyId == undefined) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        const result = await _getCompany({ companyId, options: { companyPartnership: { params: { companyId: myCompanyId } } } })
        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }
        let worker = undefined as undefined | WorkerCLType
        if (workerId) {
            const workerResult = await _getWorker({
                workerId,
            })
            if (workerResult.error) {
                throw workerResult.error
            }
            worker = toWorkerCLType(workerResult.success)
        }
        return Promise.resolve({
            success: {
                company: toCompanyCLType(result.success),
                worker: worker,
            } as GetAnyCompanyResponse,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetAnyCompanyProfileWithOwnerWorkerParam = {
    companyId?: string
    myCompanyId?: string
    myWorkerId?: string
    metroPort?: string
}

export type GetAnyCompanyProfileWithOwnerWorkerResponse = {
    company?: CompanyCLType | undefined
    worker?: WorkerCLType | undefined
    type?: CompanyProfileDisplayType
    inviteUrl?: string
}

export const getAnyCompanyProfileWithOwnerWorker = async (params: GetAnyCompanyProfileWithOwnerWorkerParam): Promise<CustomResponse<GetAnyCompanyProfileWithOwnerWorkerResponse>> => {
    try {
        const { companyId, myCompanyId, myWorkerId, metroPort } = params
        if (isEmpty(companyId) || companyId == undefined) {
            throw {
                error: '取得したい会社のidが必要です。',
            } as CustomResponse
        }
        if (myCompanyId == undefined || myWorkerId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        let _type: CompanyProfileDisplayType = 'other-company'
        let _inviteUrl: string | undefined = undefined

        const __getType = async (company?: CompanyType) => {
            if (company?.companyPartnership == 'my-company') {
                _type = 'my-company'
            } else if (company?.companyPartnership == 'others') {
                _type = 'other-company'
            } else if (!company?.isFake) {
                _type = 'partner-company'
            } else if (company?.isFake) {
                _type = 'fake-partner-company'
            }

            if (_type == 'fake-partner-company') {
                const result = await getInviteUrl({ myCompanyId: myCompanyId, fakeCompanyId: company?.companyId, metroPort: metroPort } as GetInviteCompanyUrlParam)
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                _inviteUrl = result.success
            }
        }

        if (companyId != myCompanyId) {
            const results = await Promise.all([
                _getOwnerWorkerOfTargetCompany({
                    companyId,
                    options: {
                        workerTags: {
                            params: {
                                myCompanyId,
                                myWorkerId,
                            },
                        },
                        account: true,
                    },
                }),
                _getCompany({
                    companyId,
                    options: {
                        companyPartnership: { params: { companyId: myCompanyId } },
                        connectedCompany: {
                            params: { myCompanyId },
                            companyPartnership: {
                                params: {
                                    companyId: myCompanyId,
                                },
                            },
                        },
                        lastDeal: {
                            params: {
                                myCompanyId,
                            },
                        },
                        planTicket: true,
                        departments: true,
                    },
                }),
            ])
            const ownerResult = results[0]
            const companyResult = results[1]

            if (ownerResult.error || companyResult.error) {
                throw {
                    error: `会社: ${companyResult.error} / 作業員: ${ownerResult.error}`,
                } as CustomResponse
            }

            await __getType(companyResult.success)

            return Promise.resolve({
                success: {
                    company: toCompanyCLType(companyResult.success),
                    worker: toWorkerCLType(ownerResult.success),
                    type: _type,
                    inviteUrl: _inviteUrl,
                },
            })
        } else {
            const results = await Promise.all([
                _getOwnerWorkerOfTargetCompany({
                    companyId: myCompanyId,
                    options: {
                        account: true,
                        workerTags: {
                            params: {
                                myCompanyId,
                                myWorkerId,
                            },
                        },
                    },
                }),
                _getCompany({
                    companyId: myCompanyId,
                    options: {
                        planTicket: true,
                        companyPartnership: { params: { companyId: myCompanyId } },
                        departments: true,
                    },
                }),
            ])
            const ownerResult = results[0]
            const companyResult = results[1]

            if (ownerResult.error || companyResult.error) {
                throw {
                    error: `会社: ${companyResult.error} / 作業員: ${ownerResult.error}`,
                } as CustomResponse
            }

            await __getType(companyResult.success)

            return Promise.resolve({
                success: {
                    company: toCompanyCLType(companyResult.success),
                    worker: toWorkerCLType(ownerResult.success),
                    type: _type,
                    inviteUrl: _inviteUrl,
                },
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const goToCompanyDetail = (navigation: StackNavigationProp<any>, id?: string, title?: string, myCompanyId?: string) => {
    if (myCompanyId == id) {
        navigation.push('AdminMyPageRouter', {
            isHeaderLeftBack: true,
        })
    } else {
        navigation.push('CompanyDetailRouter', {
            companyId: id,
            title: title,
        })
    }
    return
}
