import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from './ErrorService'
import * as Notifications from 'expo-notifications'
import * as Location from 'expo-location'

export const _getPushPermission = async (): Promise<CustomResponse<Notifications.NotificationPermissionsStatus>> => {
    try {
        const pushPermission = await Notifications.getPermissionsAsync()
        return Promise.resolve({
            success: pushPermission,
            error: undefined,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const _requestPushPermission = async (): Promise<CustomResponse<Notifications.NotificationPermissionsStatus>> => {
    try {
        const pushPermission = await Notifications.requestPermissionsAsync()
        return Promise.resolve({
            success: pushPermission,
            error: undefined,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const _getLocationPermission = async (): Promise<CustomResponse<Location.PermissionStatus>> => {
    try {
        const foregroundLocationPermission = await Location.getForegroundPermissionsAsync()
        return Promise.resolve({
            success: foregroundLocationPermission.status,
            error: undefined,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const _requestLocationPermission = async (): Promise<CustomResponse<Location.PermissionStatus>> => {
    try {
        const foregroundLocationPermission = await Location.requestForegroundPermissionsAsync()
        return Promise.resolve({
            success: foregroundLocationPermission.status,
            error: undefined,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
