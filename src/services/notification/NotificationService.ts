import { _callFunctions } from '../firebase/FunctionsService'
import { Create, Update } from '../../models/_others/Common'
import { GetNotificationOptionParam, NotificationModel, NotificationType } from '../../models/notification/Notification'
import { getErrorMessage } from '../_others/ErrorService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { NotificationListType } from '../../models/notification/NotificationListType'
import { NotificationsTagType } from '../../components/template/NotificationListScreen'

export const _createNotification = async (notification: Create<NotificationModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('INotification-createNotification', notification)
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

export type GetNotificationParam = {
    notificationId: string
    options?: GetNotificationOptionParam
}
export type GetNotificationResponse = NotificationType | undefined
/**
 * 
 * @param params 
 *  - 
 *  - withoutSelf?: NotificationType
    - withAccount?: OptionParam<GetAccountOptionParam>
 * @returns 
 */
export const _getNotification = async (params: GetNotificationParam): Promise<CustomResponse<GetNotificationResponse>> => {
    try {
        const result = await _callFunctions('INotification-getNotification', params)
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

export const _updateNotification = async (notification: Update<NotificationModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('INotification-updateNotification', notification)
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

export const _deleteNotification = async (notificationId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('INotification-deleteNotification', notificationId)
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

export type GetNotificationListOfTargetAccountParam = {
    accountId: string
    side?: 'admin' | 'worker'
    contentsType?: NotificationsTagType
    options?: GetNotificationOptionParam
    limit?: number
    lastItemCreatedAt?: number
}
export const _getNotificationListOfTargetAccount = async (params: GetNotificationListOfTargetAccountParam): Promise<CustomResponse<NotificationListType | undefined>> => {
    try {
        const result = await _callFunctions('INotification-getNotificationListOfTargetAccount', params)
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

export type GetUnreadCountOfTargetAccountParam = {
    token: string
}
export const _getUnreadCountOfTargetToken = async (params: GetUnreadCountOfTargetAccountParam): Promise<CustomResponse<number>> => {
    try {
        const result = await _callFunctions('INotification-getUnreadCountOfTargetToken', params)
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

export type UpdateUnreadNotificationCountOfTargetAccountParam = {
    accountId: string
    delay?: number
}

export const _updateUnreadNotificationOfTargetAccount = async (params: UpdateUnreadNotificationCountOfTargetAccountParam): Promise<CustomResponse<string | undefined>> => {
    try {
        const result = await _callFunctions('INotification-updateUnreadNotificationCountOfTargetAccount', params)
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

export type GetUnreadNotificationCountOfTargetAccountParam = {
    accountId: string
    side: 'admin' | 'worker'
}

export const _getUnreadNotificationCountOfTargetAccount = async (params: GetUnreadNotificationCountOfTargetAccountParam): Promise<CustomResponse<number>> => {
    try {
        const result = await _callFunctions('INotification-getUnreadNotificationCountOfTargetAccount', params)

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

export type markAllNotificationsOfTargertAccountAsReadParam = {
    accountId: string
    side: string
}

export const _markAllNotificationsOfTargetAccountAsRead = async (params: markAllNotificationsOfTargertAccountAsReadParam): Promise<CustomResponse<string | undefined>> => {
    try {
        const result = await _callFunctions('INotification-markAllNotificationsOfTargetAccountAsRead', params)

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

export type MarkNotificationsAsRead = {
    notificationIds: string[]
    accountId: string
    side: 'admin' | 'worker'
}

export const _markNotificationsAsRead = async (params: MarkNotificationsAsRead): Promise<CustomResponse<undefined>> => {
    try {
        const result = await _callFunctions('INotification-markNotificationsAsRead', params)

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
