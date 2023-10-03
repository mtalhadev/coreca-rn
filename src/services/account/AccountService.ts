import { _callFunctions } from '../firebase/FunctionsService'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AccountModel, AccountType, GetAccountOptionParam, LocalAccountType } from '../../models/account/Account'
import { ACTION_CODE_SETTINGS } from '../../utils/Constants'
import { getUuidv4 } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { Create, Update } from '../../models/_others/Common'
import { getErrorMessage } from '../_others/ErrorService'
import { documentDirectory, EncodingType, readAsStringAsync, writeAsStringAsync } from 'expo-file-system'
import ENV from '../../../env/env'
import emulatorsUserList from '../../../assets/emulatorsUserList.json'
import { setDeviceTokenToAccount } from '../../usecases/RouteCase'
import uniqBy from 'lodash/uniqBy'
import {
    _createUserWithEmailAndPassword,
    _getAuthUser,
    _getCurrentUser,
    _sendEmailVerification,
    _sendPasswordResetEmail,
    _signInWithEmailAndPassword,
    _signOut,
    _updateEmail,
    _updatePassword,
} from '../firebase/AuthService'
import { firebase } from '@react-native-firebase/auth'
import { newCustomDate } from '../../models/_others/CustomDate'

export const _signUp = async (email: string, password: string, workerId?: string): Promise<CustomResponse<string>> => {
    try {
        const userCredential = await _createUserWithEmailAndPassword(email, password)
        const user = userCredential.user
        const newWorkerId = getUuidv4()
        const account = {
            accountId: user.uid,
            email: email,
            password: password,
            workerId: workerId ?? newWorkerId,
            timeZoneOffset: newCustomDate().timeZoneOffset,
        } as AccountType
        const [accountResult, localAccountResult] = await Promise.all([_createAccount(account), _writeLocalAccount(account)])
        //const [_, accountResult, localAccountResult] = await Promise.all([_sendEmailVerification(), _createAccount(account), _writeLocalAccount(account)])
        if (accountResult.error) {
            await _deleteLoginAccountAndLocalAccount()
            throw {
                error: accountResult.error,
                errorCode: accountResult.errorCode,
            }
        }

        await setDeviceTokenToAccount(accountResult.success as string)
        if (localAccountResult.error) {
            await _deleteLoginAccountAndLocalAccount()
            throw {
                error: localAccountResult.error,
                errorCode: localAccountResult.errorCode,
            }
        }
        return Promise.resolve({
            success: user.uid,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const _createAccount = async (account: Create<AccountModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IAuth-createAccount', account)
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

export type GetAccountParam = {
    accountId: string
    options?: GetAccountOptionParam
}
export type GetAccountResponse = AccountType | undefined
/**
 * 
 * @param params 
 *  - 
 *  - withoutSelf?: AccountType
    - withWorker?: OptionParam<GetWorkerOptionParam>
    - withNotifications?: OptionParam<GetNotificationOptionParam>
 * @returns 
 */
export const _getAccount = async (params: GetAccountParam): Promise<CustomResponse<GetAccountResponse>> => {
    try {
        const result = await _callFunctions('IAuth-getAccount', params)
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

export type GetAccountOfTargetWorkerParam = {
    workerId: string
    options?: GetAccountOptionParam
}
export type GetAccountOfTargetWorkerResponse = AccountType | undefined
export const _getAccountOfTargetWorker = async (params: GetAccountOfTargetWorkerParam): Promise<CustomResponse<GetAccountOfTargetWorkerResponse>> => {
    try {
        const result = await _callFunctions('IAuth-getAccountOfTargetWorker', params)
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

export const _updateAccount = async (account: Update<AccountModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IAuth-updateAccount', account)
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

export type DeleteAccountParam = {
    accountId: string
}
export type DeleteAccountResponse = boolean | undefined
export const _deleteAccount = async (params: DeleteAccountParam): Promise<CustomResponse<DeleteAccountResponse>> => {
    try {
        const result = await _callFunctions('IAuth-deleteAccount', params)
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
const _recentLogin = async (accountId: string): Promise<CustomResponse> => {
    try {
        const user = _getCurrentUser()
        if (user == null) {
            throw {
                error: '認証情報がありません。ログインし直してください。',
            }
        }
        const accountResult = await _getAccount({ accountId })
        if (accountResult.error) {
            throw {
                error: '認証情報がありません。ログインし直してください。',
            }
        }
        if (accountResult.success?.email == undefined) {
            throw {
                error: 'メールアドレスが登録されていません。',
            }
        }
        if (accountResult.success?.password == undefined) {
            throw {
                error: 'パスワードが登録されていません。',
            }
        }
        const credential = firebase.auth.EmailAuthProvider.credential(
            //credentialを取得
            accountResult.success.email, // 現在のメアド,
            accountResult.success.password, // 現在のパスワード
        )
        await user.reauthenticateWithCredential(credential)
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

type updateAuthEmailType = {
    email: string
    accountId: string
}
export const _updateAuthEmail = async (params: updateAuthEmailType): Promise<CustomResponse> => {
    try {
        const { email, accountId } = params
        if (_getCurrentUser() == null) {
            throw {
                error: '認証情報がありません。ログインし直してください。',
            }
        }
        await _recentLogin(accountId)
        await _updateEmail(email)
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
type UpdateAuthPasswordType = {
    password: string
    accountId: string
}
export const _updateAuthPassword = async (params: UpdateAuthPasswordType): Promise<CustomResponse> => {
    try {
        const { password, accountId } = params
        if (_getCurrentUser() == null) {
            throw {
                error: '認証情報がありません。ログインし直してください。',
            }
        }
        await _recentLogin(accountId)
        await _updatePassword(password)
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const _sendLink = async (): Promise<CustomResponse> => {
    try {
        if (_getCurrentUser() == null) {
            return Promise.resolve({
                success: undefined,
                error: '_auth.currentUser is null',
            } as CustomResponse)
        }
        await _sendEmailVerification({ ...ACTION_CODE_SETTINGS, dynamicLinkDomain: undefined })
        return Promise.resolve({
            success: true,
            error: undefined,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const _login = async (email: string, password: string): Promise<CustomResponse<AccountType>> => {
    try {
        const user = await _signInWithEmailAndPassword(email, password)
        if (!user) {
            throw {
                error: 'ログインできませんでした。',
                errorCode: 'CANNOT_LOGIN',
            }
        }
        const accountResult = await _getAccount({ accountId: user.user.uid })
        if (accountResult.error) {
            throw {
                error: accountResult.error,
                errorCode: 'GET_ACCOUNT_ERROR2',
            }
        }
        const account = accountResult.success
        if (account == undefined || account.email == undefined || account.workerId == undefined || account.password == undefined) {
            throw {
                error: 'アカウントデータがありません。',
                errorCode: 'NO_ACCOUNT_DATA',
            }
        }

        // 入力パスワードとサーバー(coreca-server)から取得したパスワードが異なる場合、サーバー側のパスワードを入力パスワードで上書きする

        // （メールによるパスワード・リセット時などに、サーバー側で変更前のパスワードが保持されていることがあるため）
        if (account?.password !== password) {
            await _updateAccount({ accountId: user.user.uid, password })
        }
        //timeZoneOffSetを更新する
        const rtnAccount = {
            email: account?.email,
            emailVerified: account?.emailVerified,
            accountId: account?.accountId,
            workerId: account?.workerId,
            password: password,
            timeZoneOffset: newCustomDate().timeZoneOffset,
        }

        await _writeLocalAccount(rtnAccount)
        return Promise.resolve({
            success: rtnAccount as AccountType,
            error: undefined,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const _forgetPassword = async (email: string): Promise<CustomResponse> => {
    try {
        await _sendPasswordResetEmail(email)
        return Promise.resolve({
            success: true,
            error: undefined,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const _resetPassword = async (newPassword: string): Promise<CustomResponse> => {
    try {
        const user = _getCurrentUser()
        if (user == null) {
            return Promise.resolve({
                success: undefined,
                error: '_auth.currentUser is null',
            } as CustomResponse)
        } else {
            await _updatePassword(newPassword)
            const account: AccountType = {
                accountId: user.uid,
                password: newPassword,
            }
            const [localResult, updateResult] = await Promise.all([_writeLocalAccount(account), _updateAccount(account)])
            if (localResult.error) {
                throw {
                    error: localResult.error,
                    errorCode: 'LOCAL_ACCOUNT_UPDATE_ERROR',
                }
            }
            if (updateResult.error) {
                throw {
                    error: updateResult.error,
                    errorCode: 'ACCOUNT_UPDATE_ERROR',
                }
            }
            return Promise.resolve({
                success: true,
                error: undefined,
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const _logout = async (): Promise<CustomResponse> => {
    try {
        await _signOut()
        return Promise.resolve({
            success: true,
            error: undefined,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

// アカウント削除時はこの関数
export const _deleteLoginAccountAndLocalAccount = async (): Promise<CustomResponse> => {
    try {
        const user = _getCurrentUser()
        if (user == null) {
            return Promise.resolve({
                success: undefined,
                error: '_auth.currentUser is null',
            } as CustomResponse)
        } else {
            //authの削除はfunctionsに任せる
            //await deleteUser(user)
            const results = await Promise.all([_deleteAccount({ accountId: user.uid }), _deleteLocalAccount(user.uid)])
            if (results[1].error) {
                throw {
                    code: results[1].error,
                }
            }
            return Promise.resolve({
                success: true,
                error: undefined,
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const _writeLocalAccount = async (account: LocalAccountType): Promise<CustomResponse> => {
    try {
        //ログイン可能なユーザー一覧に現在のものを加える
        let myAccount: LocalAccountType = {
            accountId: account.accountId,
            email: account.email,
            password: account.password,
            workerId: account.workerId,
            timeZoneOffset: account.timeZoneOffset,
        }
        let jsonValue = await AsyncStorage.getItem('@accounts')
        let accounts: LocalAccountType[] = []
        if (jsonValue !== null) {
            accounts = JSON.parse(jsonValue)
        }
        const sameAccounts = accounts.filter((account) => account.accountId == myAccount.accountId)
        if (sameAccounts.length > 0) {
            const sameAccount = sameAccounts[0]
            myAccount = {
                accountId: myAccount.accountId,
                email: myAccount.email ?? sameAccount.email,
                password: myAccount.password ?? sameAccount.password,
                workerId: myAccount.workerId ?? sameAccount.workerId,
                timeZoneOffset: myAccount.timeZoneOffset ?? sameAccount.timeZoneOffset,
            }
        }
        accounts = accounts.filter((account) => account.accountId != myAccount.accountId)
        const newAccounts: LocalAccountType[] = [...accounts, myAccount]
        jsonValue = JSON.stringify(newAccounts)
        await AsyncStorage.setItem('@accounts', jsonValue)
        return Promise.resolve({
            success: true,
            error: undefined,
        } as CustomResponse)
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const _deleteLocalAccount = async (accountId: string | undefined): Promise<CustomResponse> => {
    try {
        let jsonValue = await AsyncStorage.getItem('@accounts')
        let accounts: AccountType[] = []
        if (jsonValue !== null) {
            accounts = JSON.parse(jsonValue)
        }
        const newAccounts = accounts.filter((account) => account.accountId != accountId)
        jsonValue = JSON.stringify(newAccounts)
        await AsyncStorage.setItem('@accounts', jsonValue)
        return Promise.resolve({
            success: true,
            error: undefined,
        } as CustomResponse)
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const _getLocalAccountList = async (): Promise<LocalAccountType[]> => {
    let accounts: LocalAccountType[] = []
    const jsonValue = await AsyncStorage.getItem('@accounts')
    if (jsonValue !== null) {
        accounts = uniqBy([...accounts, ...JSON.parse(jsonValue)], (acc) => acc.accountId)
    }
    return accounts
}

export const LOCAL_ACCOUNTS_FILE_NAME = 'local-accounts'
/**
 * 保存先URI例
 * file:///Users/hiruma/Library/Developer/CoreSimulator/Devices/E6556DD3-653E-4A93-A4D9-D2507E07C5E6/data/Containers/Data/Application/2B5C3EF4-C668-4FBF-ADB6-F2DC5D121242/Documents/ExponentExperienceData/%2540coreca-app%252Fcoreca-app/local-accounts.json
 *
 * @param jsonValue
 * @returns
 */
export const _writeLocalAccountListToJson = async (jsonValue?: string): Promise<CustomResponse> => {
    try {
        if (jsonValue == undefined) {
            throw {
                error: 'jsonValue is undefined',
            }
        }
        const uri = `${documentDirectory}${LOCAL_ACCOUNTS_FILE_NAME}.json`
        await writeAsStringAsync(uri, jsonValue, { encoding: EncodingType.UTF8 })
        return Promise.resolve({
            success: true,
            error: undefined,
        } as CustomResponse)
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const _getLocalAccountListFromJson = async (): Promise<LocalAccountType[]> => {
    const uri = `${documentDirectory}${LOCAL_ACCOUNTS_FILE_NAME}.json`
    try {
        const jsonValue = await readAsStringAsync(uri, { encoding: EncodingType.UTF8 })
        let accounts: LocalAccountType[] = []
        if (jsonValue !== null) {
            accounts = JSON.parse(jsonValue)
        }
        return accounts
    } catch (err) {
        return []
    }
}

export type GetAccountOverManagerOfTargetCompanyParam = {
    companyId: string
    options?: GetAccountOptionParam
}
export type GetAccountOverManagerOfTargetCompanyResponse = AccountType[] | undefined
export const _getAccountOverManagerOfTargetCompany = async (params: GetAccountOverManagerOfTargetCompanyParam): Promise<CustomResponse<GetAccountOverManagerOfTargetCompanyResponse>> => {
    try {
        const result = await _callFunctions('IAuth-getAccountOverManagerOfTargetCompany', params)
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

export const _setAccountListForDev = async (): Promise<CustomResponse<any>> => {
    try {
        const accountList = emulatorsUserList.users
        await AsyncStorage.setItem('@accounts', JSON.stringify(accountList))
        return Promise.resolve({
            success: true,
        })
    } catch (e) {
        return getErrorMessage(e)
    }
}
