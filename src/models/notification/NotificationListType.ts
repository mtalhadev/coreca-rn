import { CommonListType, ReplaceAnd } from '../_others/Common'
import { NotificationCLType, NotificationType, toNotificationCLType } from './Notification'

export type GetNotificationListType = 'all'[]

export type NotificationListType = CommonListType<NotificationType> & {
    items?: NotificationType[]
}

export type NotificationListCLType = ReplaceAnd<
    NotificationListType,
    {
        items?: NotificationCLType[]
    }
>

export const toNotificationListCLType = (data?: NotificationListType): NotificationListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toNotificationCLType(val)) : undefined,
    }
}

export const toNotificationListType = (items?: NotificationType[], mode?: 'all' | 'none'): NotificationListType => {
    mode = mode ?? 'all'
    if (mode == 'none') {
        return {
            items,
        }
    }
    return {
        items,
    }
}
