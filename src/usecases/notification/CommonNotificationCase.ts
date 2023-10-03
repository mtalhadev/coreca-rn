import {
    GetUnreadNotificationCountOfTargetAccountParam,
    UpdateUnreadNotificationCountOfTargetAccountParam,
    _getNotification,
    _getNotificationListOfTargetAccount,
    _getUnreadCountOfTargetToken,
    _getUnreadNotificationCountOfTargetAccount,
    _markAllNotificationsOfTargetAccountAsRead,
    _markNotificationsAsRead,
    _updateNotification,
    _updateUnreadNotificationOfTargetAccount,
} from '../../services/notification/NotificationService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { AccountNotificationListCLType, AccountNotificationListType, toAccountNotificationListCLType } from '../../models/notification/AccountNotificationListType'
import { NotificationListCLType, NotificationListType } from '../../models/notification/NotificationListType'
import { getErrorMessage } from '../../services/_others/ErrorService'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { NotificationsTagType } from '../../components/template/NotificationListScreen'
/**
 * @requires
 * - accountId - 使用者のアカウントId
 * - side - 作業員側のお知らせか管理側のお知らせか
 */
export type GetNotificationParam = {
    accountId?: string
    side: 'admin' | 'worker'
    contentsType?: NotificationsTagType
    limit?: number
    lastItemCreatedAt?: number
}
/**
 * - AccountNotificationListCLType - お知らせ一覧
 */
export type GetNotificationsResponse = AccountNotificationListCLType
/**
 * @remarks 指定のアカウントのお知らせ一覧を取得する
 * @objective AdminNotification.tsxまたはWNotification.tsxにてお知らせを取得するため
 * @error
 * - ACCOUNT_ERROR - アカウントIdがなかった場合
 * - NOTIFICATION_ERROR - お知らせの取得に失敗した場合
 * @author  Kamiya
 * @param params - {@link GetNotificationParam}
 * @returns - {@link GetNotificationsResponse}
 */
export const getNotifications = async (params: GetNotificationParam): Promise<CustomResponse<GetNotificationsResponse>> => {
    try {
        const { accountId, side, contentsType, limit, lastItemCreatedAt } = params
        if (accountId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
                errorCode: 'ACCOUNT_ERROR',
            } as CustomResponse
        }

        const notificationsResult = await _getNotificationListOfTargetAccount({ accountId: accountId ?? 'no-id', side, contentsType, limit, lastItemCreatedAt })

        if (notificationsResult.error) {
            throw {
                error: notificationsResult.error,
                errorCode: 'NOTIFICATION_ERROR',
            }
        }
        const notificationList = notificationsResult.success as NotificationListType

        const AccountNotificationList = toAccountNotificationListType({ notificationList, side })
        return Promise.resolve({
            success: toAccountNotificationListCLType(AccountNotificationList),
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * @requires
 * - notificationList - お知らせ一覧
 * - side - 作業員側のお知らせか管理側のお知らせか
 */
type ToAccountNotificationListTypeParam = {
    notificationList: NotificationListType
    side: 'admin' | 'worker'
}
/**
 * @remarks NotificationListTypeをAccountNotificationListCLTypeに変更
 * @objective AdminNotification.tsxまたはWNotification.tsxにてお知らせを表示できる形に変形するため
 * @author  Kamiya
 * @param params - {@link ToAccountNotificationListTypeParam}
 * @returns - {@link AccountNotificationListType}お知らせ一覧
 */
export const toAccountNotificationListType = (params: ToAccountNotificationListTypeParam): AccountNotificationListType => {
    const { notificationList, side } = params
    const allNotifications: NotificationListType = { items: [] }
    const transactionNotifications: NotificationListType = {
        items: notificationList.items?.filter((notification) => notification.contentsType == 'transaction'),
    }
    const siteNotifications: NotificationListType = {
        items: notificationList.items?.filter((notification) => notification.contentsType == 'site'),
    }
    const othersNotifications: NotificationListType = {
        items: notificationList.items?.filter((notification) => notification.contentsType != 'transaction' && notification.contentsType != 'site'),
    }

    if (side == 'admin') {
        allNotifications.items = transactionNotifications.items?.concat(siteNotifications.items ?? [], othersNotifications.items ?? [])
    }
    if (side == 'worker') {
        allNotifications.items = siteNotifications.items?.concat(othersNotifications.items ?? [])
    }

    return {
        all: allNotifications,
        transaction: transactionNotifications,
        site: siteNotifications,
        others: othersNotifications,
    }
}
/**
 * @remarks お知らせを既読にする
 * @objective お知らせ一覧を開いたときに、既読にするため
 * @error
 * - NOTIFICATION_ERROR - お知らせの取得に失敗した場合
 * @author  Kamiya
 * @param params - {@link NotificationListCLType}
 * @returns - void
 */
export const updateAlreadyReadNotification = async (notifications?: NotificationListCLType): Promise<void> => {
    notifications?.items?.map(async (notificationCLType) => {
        if (!notificationCLType.isAlreadyRead) {
            const notificationResult = await _getNotification({ notificationId: notificationCLType.notificationId ?? 'no-id' })
            if (notificationResult.error) {
                throw {
                    error: 'お知らせの取得に失敗しました。',
                    errorCode: 'NOTIFICATION_ERROR',
                } as CustomResponse
            }
            const notification = notificationResult.success
            const newNotification = {
                ...notification,
                isAlreadyRead: true,
            }
            await _updateNotification(newNotification)
        }
    })
}

/**
 * @remarks 未読のお知らせの数を取得する
 * @objective お知らせアイコンに未読数を表示したり、一覧表示で未読数を表示するため
 * @error
 * - NOTIFICATION_ERROR - お知らせの取得に失敗した場合
 * @author  Kamiya
 * @param params - {@link GetNotificationParam}
 * @returns - お知らせの未読数
 */
export const getUnreadNotificationCount = async (params: GetNotificationParam): Promise<CustomResponse<number>> => {
    try {
        /**
         * お知らせを取得する
         */
        const AccountNotificationListCLResult = await getNotifications(params)
        if (AccountNotificationListCLResult.error) {
            throw {
                error: 'お知らせの取得に失敗しました。',
                errorCode: 'NOTIFICATION_ERROR',
            } as CustomResponse
        }
        /**
         * isAlreadyReadがfalseのお知らせを集計する
         */
        let unReadCount = 0
        AccountNotificationListCLResult.success?.all?.items?.map((notificationCLType) => {
            if (!notificationCLType.isAlreadyRead) {
                unReadCount += 1
            }
        })
        return Promise.resolve({
            success: unReadCount,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @summary 未読のお知らせの数でバッジを更新する
 * @objective アプリアイコンに未読数を表示するため
 * @error
 * - NOTIFICATION_ERROR - お知らせの未読数取得に失敗した場合
 * @author  Mito
 *
 * @returns - お知らせの未読数
 */
export const setUnreadNotificationCountToBadge = async (): Promise<CustomResponse> => {
    try {
        if (Device.isDevice == false) {
            return {
                success: true,
            } as CustomResponse
        }

        const token = (await Notifications.getExpoPushTokenAsync()).data

        const result = await _getUnreadCountOfTargetToken({ token })
        if (result.error) {
            throw {
                error: 'お知らせの未読数取得に失敗しました。',
                errorCode: 'NOTIFICATION_ERROR',
            } as CustomResponse
        }

        Notifications.setBadgeCountAsync(result.success ?? 0)

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @remarks 指定のアカウントのお知らせの未読数アップデート
 * @error
 * - ACCOUNT_ERROR - アカウントIdがなかった場合
 * - NOTIFICATION_ERROR - お知らせの未読数アップデートに失敗した場合
 */
export const updateUnreadNotificationCountOfTargetAccount = async (params: UpdateUnreadNotificationCountOfTargetAccountParam): Promise<CustomResponse> => {
    try {
        const { accountId, delay } = params

        if (accountId === undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
                errorCode: 'ACCOUNT_ERROR',
            } as CustomResponse
        }
        const updateNotificationResult = await _updateUnreadNotificationOfTargetAccount({ accountId, delay })
        if (updateNotificationResult.error) {
            throw {
                error: 'お知らせ未読数アップデートに失敗しました。',
                errorCode: 'NOTIFICATION_ERROR',
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @remarks 指定のアカウントのお知らせの未読数取得
 * @error
 * - ACCOUNT_ERROR - アカウントId,サイドがなかった場合
 * - NOTIFICATION_ERROR - お知らせの未読数取得に失敗した場合
 */
export const getUnreadNotificationCountOfTargetAccount = async (params: GetUnreadNotificationCountOfTargetAccountParam): Promise<CustomResponse<number>> => {
    try {
        const { accountId, side } = params

        if (accountId === undefined || side === undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
                errorCode: 'ACCOUNT_ERROR',
            } as CustomResponse
        }

        const getNotificationResult = await _getUnreadNotificationCountOfTargetAccount({ accountId, side })
        if (getNotificationResult.error) {
            throw {
                error: 'お知らせ未読数取得に失敗しました。',
                errorCode: 'NOTIFICATION_ERROR',
            } as CustomResponse
        }

        return Promise.resolve({
            success: getNotificationResult.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @remarks お知らせを既読にする
 * @objective お知らせ一覧を開いたときに、既読にするため
 * @error
 * - NOTIFICATION_ERROR - お知らせの取得に失敗した場合
 * @param params - notificationId
 */

export const updateAlreadyReadSingleNotification = async (notificationId?: string): Promise<CustomResponse> => {
    try {
        if (notificationId === undefined) {
            throw {
                error: 'idがありません',
                errorCode: 'NOTIFICATION_ERROR',
            } as CustomResponse
        }

        const notificationResult = await _getNotification({ notificationId })
        if (notificationResult.error) {
            throw {
                error: 'お知らせの取得に失敗しました。',
                errorCode: 'NOTIFICATION_ERROR',
            } as CustomResponse
        }
        const notification = notificationResult.success
        if (notification?.isAlreadyRead !== true) {
            const newNotification = {
                ...notification,
                isAlreadyRead: true,
            }
            await _updateNotification(newNotification)
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @remarks 複数のお知らせを既読にする
 * @objective お知らせ一覧を開いたときに、既読にするため
 * @error
 * - NOTIFICATION_ERROR - お知らせの取得に失敗した場合
 * @param params - notificationIds
 */

export const updateAlreadyReadNotifications = async (notificationIds?: string[], accountId?: string, side?: 'admin' | 'worker'): Promise<CustomResponse<undefined>> => {
    try {
        if (notificationIds === undefined) {
            throw {
                error: 'idがありません',
                errorCode: 'NOTIFICATION_ERROR',
            } as CustomResponse
        }

        if (notificationIds.length === 0) {
            return Promise.resolve({
                success: undefined,
            })
        }

        if (accountId === undefined || side === undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
                errorCode: 'ACCOUNT_ERROR',
            } as CustomResponse
        }

        const notificationResult = await _markNotificationsAsRead({ notificationIds, accountId, side })
        if (notificationResult.error) {
            throw {
                error: 'お知らせの既読への変更に失敗しました。',
                errorCode: 'NOTIFICATION_ERROR',
            } as CustomResponse
        }

        return Promise.resolve({
            success: undefined,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @remarks 指定アカウントの、お知らせを全部既読にする
 * @objective
 * @error
 * - NOTIFICATION_ERROR - お知らせの取得に失敗した場合
 * @param params - accountId, side
 */

export const markAllNotificationsOfTargetAccountAsRead = async (accountId?: string, side?: 'admin' | 'worker'): Promise<CustomResponse> => {
    try {
        if (accountId === undefined || side === undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
                errorCode: 'ACCOUNT_ERROR',
            } as CustomResponse
        }

        const notificationResult = await _markAllNotificationsOfTargetAccountAsRead({ accountId, side })
        if (notificationResult.error) {
            throw {
                error: '全てのお知らせの既読への変更に失敗しました。',
                errorCode: 'NOTIFICATION_ERROR',
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
