import { RootStackParamList } from '../../screens/Router'
import { AccountCLType, AccountType, toAccountCLType } from '../account/Account'
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common'
import { ID } from '../_others/ID'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'

export type ContentsEnumType = 'transaction' | 'site' | 'others' | 'personal'

export type transitionParamsType = {
    param: string
    param2?: string
    param3?: string
    screenName: string
}

export type NotificationModel = Partial<{
    notificationId: ID
    accountId: ID
    title: string
    contentsType: ContentsEnumType
    transitionParams: transitionParamsType
    isAlreadyRead: boolean
    description: string
    side: 'admin' | 'worker'
    isNotificationCreated: boolean
}> &
    CommonModel

export type UnreadNotificationCountModel = Partial<{
    unreadNotificationId: ID
    accountId: ID
    unreadCountAdmin: number
    unreadCountWorker: number
}> &
    CommonModel

export const initNotification = (notification: Create<NotificationModel> | Update<NotificationModel>): Update<NotificationModel> => {
    const newNotification: Update<NotificationModel> = {
        notificationId: notification.notificationId,
        accountId: notification.accountId,
        title: notification.title,
        contentsType: notification.contentsType,
        transitionParams: notification.transitionParams,
        isAlreadyRead: notification.isAlreadyRead,
        description: notification.description,
        side: notification.side,
        isNotificationCreated: notification.isNotificationCreated,
    }
    return newNotification
}

/**
 * {@link WorkerOptionInputParam - 説明}
 */
export type NotificationOptionInputParam = ReplaceAnd<
    GetOptionObjectType<NotificationOptionParam>,
    {
        //
    }
>

/**
 * {@link WorkerOptionParam - 説明}
 */
export type NotificationOptionParam = {
    account?: AccountType
}
export type NotificationType = NotificationModel & NotificationOptionParam
export type GetNotificationOptionParam = GetOptionParam<NotificationType, NotificationOptionParam, NotificationOptionInputParam>

export type NotificationCLType = ReplaceAnd<
    NotificationType,
    {
        account?: AccountCLType
    } & CommonCLType
>

export const toNotificationCLType = (data?: NotificationType): NotificationCLType => {
    return {
        ...data,
        ...toCommonCLType(data),
        account: data?.account ? toAccountCLType(data?.account) : undefined,
    } as NotificationCLType
}
