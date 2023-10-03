import { NotificationListCLType, NotificationListType, toNotificationListCLType } from '../notification/NotificationListType'
import { WorkerCLType, toWorkerCLType, WorkerType } from '../worker/Worker'
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'
import { ID } from '../_others/ID'

export type LocalAccountType = Partial<{
    accountId: ID
    email: string
    password: string
    emailVerified: boolean
    workerId: ID
    token: string
    timeZoneOffset: number
    lastLoggedInVersion: string//Accountに入れるべきかSignInUserに入れるべきか。更新と取得の手間を考えて一番効率的な方にする。
}>

export type AccountModel = LocalAccountType & CommonModel

export type AccountType = AccountModel & AccountOptionParam

export const initAccount = (account: Create<AccountModel> | Update<AccountModel>): Update<AccountModel> => {
    const newAccount: Update<AccountModel> = {
        accountId: account.accountId,
        email: account.email,
        password: account.password,
        emailVerified: account.emailVerified,
        workerId: account.workerId,
        token: account.token,
        timeZoneOffset: account.timeZoneOffset,
        lastLoggedInVersion: account.lastLoggedInVersion,
    }

    return newAccount
}

export type AccountOptionInputParam = ReplaceAnd<
    GetOptionObjectType<AccountOptionParam>,
    {
        //
    }
>

/**
 * {@link WorkerOptionParam - 説明}
 */
export type AccountOptionParam = {
    worker?: WorkerType
    notifications?: NotificationListType
}

export type GetAccountOptionParam = GetOptionParam<AccountType, AccountOptionParam, AccountOptionInputParam>

export type AccountCLType = ReplaceAnd<
    AccountType,
    {
        worker?: WorkerCLType
        notifications?: NotificationListCLType
    } & CommonCLType
>

export const toAccountCLType = (data?: AccountType): AccountCLType => {
    return {
        ...data,
        ...toCommonCLType(data),
        worker: data?.worker ? toWorkerCLType(data?.worker) : undefined,
        notifications: data?.notifications ? toNotificationListCLType(data?.notifications) : undefined,
    } as AccountCLType
}
