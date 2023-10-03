import isEmpty from 'lodash/isEmpty'
import { Dispatch } from 'react'
import { _forgetPassword, _getAccount, _login, _sendLink, _signUp, _updateAccount } from '../../services/account/AccountService'
import { _getCompany, _getCompanyOfAccount } from '../../services/company/CompanyService'
import { _getWorker, _getWorkerTags } from '../../services/worker/WorkerService'
import { setActiveDepartments, setBelongCompanyId, setIsLogining, setIsSignUping, setSignInUser } from '../../stores/AccountSlice'
import { setUrlScheme } from '../../stores/NavigationSlice'
import { setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { getUuidv4, isPassword, isEmail } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { AccountCLType, AccountType, toAccountCLType } from '../../models/account/Account'
import { setDeviceTokenToAccount } from '../RouteCase'
import { CompanyCLType, CompanyType, toCompanyCLType } from '../../models/company/Company'
import { getDailyStartTime, newCustomDate } from '../../models/_others/CustomDate'
import { newDate } from '../../utils/ext/Date.extensions'
import { getSelectedAccount, SelectableAccountType } from './AccountSelectCase'
import { _getActiveDepartments } from '../../services/department/DepartmentService'
import * as Linking from 'expo-linking'
import { genKeyName, updateCachedData } from '../CachedDataCase'

export type LoginOrSignUpSuccessType = 'no-worker' | 'no-company' | 'signup' | 'withdrawn' | 'admin-side-login' | 'worker-side-login'

/**
 * @param dontSignUp - アカウントがない場合に自動で作成しないようにする。存在しない場合エラーを返す。
 */
export type LoginOrSignUpParam = {
    email: string
    password: string
    dispatch: Dispatch<any>
    myCompanyId: string
    workerId: string
    dontSignUp?: boolean
    invitedUrl?: string
}

/**
 * ログインを試行する。アカウントがない場合は自動で作成する。
 * @param param
 * @returns
 */
export const loginOrSignUp = async (param: Partial<LoginOrSignUpParam>): Promise<CustomResponse<LoginOrSignUpSuccessType>> => {
    try {
        let { email, password, dontSignUp, dispatch, myCompanyId, workerId, invitedUrl } = param

        if (email == undefined || password == undefined || isEmpty(email) || isEmpty(password) || dispatch == undefined) {
            throw {
                error: '情報が足りません。',
            }
        }
        if (!isPassword(password)) {
            throw {
                error: 'パスワードは８文字以上にしてください。',
            }
        }
        if (!isEmail(email)) {
            throw {
                error: 'メールアドレスの形式が間違っています。',
            }
        }
        email = email.trim()
        password = password.trim()

        dispatch(setIsLogining(true))
        const loginResult = await _login(email, password)
        dispatch(setIsLogining(false))

        /**
         * アカウントが存在する場合=ログインのルート
         */
        if (loginResult.success) {
            dispatch(setUrlScheme(undefined))

            const selectableAccount: CustomResponse<SelectableAccountType> = await getSelectedAccount(loginResult.success)

            if (selectableAccount.error) {
                throw {
                    ...selectableAccount,
                }
            }

            await setDeviceTokenToAccount(loginResult.success.accountId as string)

            const signInResult = await checkSignInAndSetToStore({
                accountId: loginResult.success?.accountId,
                dispatch,
            })
            if (signInResult.error) {
                throw {
                    ...signInResult,
                }
            }

            const worker = signInResult.success?.account?.worker

            const leftDate = signInResult.success?.account?.worker?.leftDate
            if (leftDate && leftDate.totalSeconds < newDate().toCustomDate().totalSeconds) {
                return Promise.resolve({
                    success: 'withdrawn',
                })
            }

            const company = signInResult.success?.company
            if (worker?.workerId == undefined) {
                return Promise.resolve({
                    success: 'no-worker',
                })
            }
            dispatch(setBelongCompanyId(worker.companyId))
            if (company?.companyId == undefined) {
                return Promise.resolve({
                    success: 'no-company',
                })
            }
            if (selectableAccount?.success?.companyRole == 'general') {
                return Promise.resolve({
                    success: 'worker-side-login',
                })
            }
            return Promise.resolve({
                success: 'admin-side-login',
            })
        } else if (loginResult.error == 'auth/user-not-found') {
            /**
             * アカウントが存在しない場合の新規作成ルート
             */
            if (dontSignUp) {
                throw {
                    error: 'アカウントが存在しません。新規作成してください。',
                }
            }
            dispatch(setIsSignUping(true))
            const signUpResult = await _signUp(email, password, workerId)
            dispatch(setIsSignUping(false))
            if (signUpResult.error) {
                if (signUpResult.error == 'auth/email-already-in-use') {
                    throw {
                        error: 'すでにアカウントが存在します。',
                    }
                }
                throw {
                    error: signUpResult.error,
                    errorCode: 'SIGN_UP_ERROR',
                }
            }
            dispatch(
                setToastMessage({
                    text: `アカウントを作成しました。`,
                    //text: `${email}へ確認メールを送信しました。`,
                    type: 'success',
                } as ToastMessage),
            )

            const accountId = signUpResult.success
            await checkSignInAndSetToStore({
                accountId,
                dispatch,
                isSignUping: true,
            })

            //Deep Linkの有無
            const companyId = myCompanyId ? myCompanyId : getUuidv4()
            dispatch(setBelongCompanyId(companyId))
            if (invitedUrl) {
                const parsedInvitedUrl = Linking.parse(invitedUrl)
                const inviteCompanyId = parsedInvitedUrl.queryParams?.companyId
                // 取引一覧キャッシュ更新
                if (inviteCompanyId && accountId && companyId) {
                    await _addCompanyToPartnerCompanyListCache(inviteCompanyId as string, accountId, companyId)
                }
            }
            return Promise.resolve({
                success: 'signup',
            })
        } else {
            if (loginResult.error == 'auth/user-not-found') {
                throw {
                    error: 'アカウントが存在しません。',
                }
            } else if (loginResult.error == 'auth/wrong-password') {
                if (dontSignUp) {
                    throw {
                        error: 'パスワードが間違っています。',
                    }
                } else {
                    throw {
                        error: 'すでにアカウントが存在します。',
                    }
                }
            }
            throw {
                error: loginResult.error,
            }
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const sendVerificationLink = async (): Promise<CustomResponse> => {
    try {
        const result = await _sendLink()
        if (result.error) {
            throw {
                error: result.error,
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @param dispatch - ロジック複雑なので関数内で処理する。
 */
export type CheckSignInParam = {
    accountId?: string
    dispatch?: Dispatch<any>
    isSignUping?: boolean
}

export type CheckSignInResponse = {
    account?: AccountCLType
    company?: CompanyCLType
}

/**
 * アカウントの整合性チェックとstoreへのデータ入力をする。
 * @param param
 * @returns
 */
export const checkSignInAndSetToStore = async (param: CheckSignInParam): Promise<CustomResponse<CheckSignInResponse>> => {
    try {
        const { accountId, dispatch, isSignUping } = param
        if (accountId == undefined || dispatch == undefined) {
            throw {
                error: '情報が足りません。',
                errorCode: 'NOT_ENOUGH_INFO_ERROR',
            }
        }
        const accountResult = await _getAccount({
            accountId: accountId,
            options: {
                worker: {
                    company: true,
                },
            },
        })

        if (accountResult.error) {
            throw {
                error: accountResult.error,
                errorCode: 'GET_ACCOUNT_ERROR',
            }
        }
        if (accountResult.success == undefined) {
            throw {
                error: 'authはあるけどAccountがありません。',
                errorCode: 'AUTH_DATA_ERROR',
            }
        }
        dispatch(setSignInUser({ ...accountResult.success } as AccountType))
        if (accountResult.success.worker?.departments?.items && accountResult.success.worker?.departments?.items[0]?.isDefault) {
            //デフォルト部署がある場合は、それをアクティブにする
            dispatch(setActiveDepartments(accountResult.success.worker?.departments.items))
        } else if (!isSignUping) {
            if (accountResult.success.workerId) {
                const activeDepartmentsResult = await _getActiveDepartments(accountResult.success.workerId)
                if (activeDepartmentsResult.error) {
                }
                const workerDepartmentIdsSet = new Set(accountResult.success.worker?.departmentIds ?? [])
                //部署が作業員から外されていないかを確認した上でセット。isDefaultの部署しかない場合は、その部署をアクティブにする
                const _activeDepartments = activeDepartmentsResult.success?.departments?.filter((dep) => dep.departmentId && workerDepartmentIdsSet.has(dep.departmentId))
                if ((_activeDepartments?.length?? 0) > 0) {
                    dispatch(setActiveDepartments(_activeDepartments))
                }else{
                    //アクティブな部署がない場合は、所属部署の一つをアクティブにする
                    const _departments = accountResult.success.worker?.departments?.items
                    if(_departments){
                        dispatch(setActiveDepartments([_departments[0]]))
                    }
                }
            }
        }

        /**
         * 新規作成中はアカウントが存在していれば良い。
         */
        if (isSignUping) {
            return Promise.resolve({
                success: {
                    account: toAccountCLType(accountResult.success),
                },
            })
        }
        await _updateAccount({
            ...accountResult.success,
            timeZoneOffset: newCustomDate().timeZoneOffset,
        })
        const companyResult = await _getCompanyOfAccount(accountResult.success?.accountId ?? '')
        const workerTagResult = await _getWorkerTags({
            myCompanyId: companyResult.success?.companyId ?? 'no-id',
            myWorkerId: accountResult.success.workerId ?? 'no-id',
            worker: accountResult.success.worker,
            workerId: accountResult.success.workerId,
            timeZoneOffset: newCustomDate().timeZoneOffset,
        })

        const account = { ...accountResult.success, worker: { ...accountResult.success.worker, workerTags: workerTagResult.success } } as AccountType
        dispatch(setSignInUser(account))
        /**
         * 会社作成前だとundefinedなので、storeに入力しない。undefinedで上書きしたくない。
         */
        if (companyResult.success?.companyId) {
            dispatch(setBelongCompanyId(companyResult.success?.companyId))
        }

        return Promise.resolve({
            success: {
                account: toAccountCLType(accountResult.success),
                company: toCompanyCLType(companyResult.success),
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

const _addCompanyToPartnerCompanyListCache = async (inviteCompanyId: string, accountId: string, myCompanyId: string) => {
    const __cachedKey = genKeyName({
        screenName: 'PartnerCompanyList',
        accountId: accountId,
        companyId: myCompanyId as string,
    })
    const inviteCompanyResult = await _getCompany({
        companyId: inviteCompanyId,
        options: {
            planTicket: true,
            companyPartnership: { params: { companyId: inviteCompanyId } },
            departments: true,
        },
    })

    if (inviteCompanyResult.success) {
        const newCompany: CompanyType = {
            ...inviteCompanyResult.success,
            companyPartnership: 'partner',
        }
        await updateCachedData({
            key: __cachedKey,
            value: {
                companies: [toCompanyCLType(newCompany)],
                updatedAt: Number(new Date()),
            },
        })
    }
}
