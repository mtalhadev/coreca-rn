import { CommonListType, ReplaceAnd } from '../_others/Common'
import { NotificationType } from './Notification'
import { NotificationListCLType, NotificationListType, toNotificationListCLType } from './NotificationListType'

export type AccountNotificationListType = CommonListType<NotificationType> & {
    all?: NotificationListType
    site?: NotificationListType
    transaction?: NotificationListType
    others?: NotificationListType
}

export type AccountNotificationListCLType = ReplaceAnd<
    AccountNotificationListType,
    {
        all?: NotificationListCLType
        site?: NotificationListCLType
        transaction?: NotificationListCLType
        others?: NotificationListCLType
    }
>

export const toAccountNotificationListCLType = (data?: AccountNotificationListType): AccountNotificationListCLType => {
    return {
        ...data,
        all: data?.all ? toNotificationListCLType(data?.all) : undefined,
        site: data?.site ? toNotificationListCLType(data?.site) : undefined,
        transaction: data?.transaction ? toNotificationListCLType(data?.transaction) : undefined,
        others: data?.others ? toNotificationListCLType(data?.others) : undefined,
    }
}
