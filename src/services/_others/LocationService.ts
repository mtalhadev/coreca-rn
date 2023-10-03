import { CustomResponse } from '../../models/_others/CustomResponse'
import * as Location from 'expo-location'

export const getCurrentLocation = async (): Promise<CustomResponse<Location.LocationObject>> => {
    const { status } = await Location.getForegroundPermissionsAsync()
    if (status != 'granted') {
        return Promise.resolve({
            error: status,
        })
    }
    try {
        const location: Location.LocationObject = await Location.getCurrentPositionAsync({})
        return Promise.resolve({
            success: location,
        } as CustomResponse<Location.LocationObject>)
    } catch (error) {
        return Promise.resolve({
            error: '現在地を取得できませんでした。',
            errorCode: 'NO_LOCATION_DATA',
        })
    }
}
