import { _getLocationPermission, _getPushPermission, _requestLocationPermission, _requestPushPermission } from '../../services/_others/PermissionService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Location from 'expo-location'

export const getPushPermissionStatus = async (): Promise<CustomResponse<Notifications.NotificationPermissionsStatus>> => {
    try {
        const result = await _getPushPermission()
        if (result.error) {
            throw {
                error: result.error,
                errorCode: 'PUSH_PERMISSION_ERROR'
            }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export const getLocationPermissionStatus = async (): Promise<CustomResponse<Location.PermissionStatus>> => {
    try {
        const result = await _getLocationPermission()
        if (result.error) {
            throw {
                error: result.error,
                errorCode: 'LOCATION_PERMISSION_ERROR'
            }
        }
        return Promise.resolve({
            success: result.success,
        })
        // if (foregroundLocationPermission == 'undetermined') {
        //     return Promise.resolve({
        //         success: result.success,
        //     })
        // }
        // if (Platform.OS == 'android') {
        //     if (foregroundLocationPermission == 'denied') {
        //         return Promise.resolve({
        //             success: true,
        //         })
        //     }
        // }

        // return Promise.resolve({
        //     success: false,
        // })
    } catch (error) {
        return getErrorMessage(error)
    }
}


export const requestPushPermission = async (): Promise<CustomResponse<Notifications.NotificationPermissionsStatus>> => {
    try {
        const result = await _requestPushPermission()
        if (result.error) {
            throw {
                error: result.error,
                errorCode: 'PUSH_PERMISSION_ERROR'
            }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export const requestLocationPermission = async (): Promise<CustomResponse<Location.PermissionStatus>> => {
    try {
        const result = await _requestLocationPermission()
        if (result.error) {
            throw {
                error: result.error,
                errorCode: 'LOCATION_PERMISSION_ERROR'
            }
        }
        return Promise.resolve({
            success: result.success,
        })
        // if (foregroundLocationPermission == 'undetermined') {
        //     return Promise.resolve({
        //         success: result.success,
        //     })
        // }
        // if (Platform.OS == 'android') {
        //     if (foregroundLocationPermission == 'denied') {
        //         return Promise.resolve({
        //             success: true,
        //         })
        //     }
        // }

        // return Promise.resolve({
        //     success: false,
        // })
    } catch (error) {
        return getErrorMessage(error)
    }
}