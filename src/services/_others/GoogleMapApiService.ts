import ENV from '../../../env/env'
import { getErrorMessage } from './ErrorService'
import { CustomResponse } from '../../models/_others/CustomResponse'

type ResponseGeoLocation = {
    lat: number
    lng: number
}

export type ResponseGeoLocationType = Partial<ResponseGeoLocation>

export const _getLocationInfoFromAddress = async (address: string): Promise<ResponseGeoLocationType> => {
    const response = await fetch('https://maps.googleapis.com/maps/api/geocode/json?address=' + address + '&key=' + ENV.GOOGLE_CONFIG.mapApiKey)
    const responseJson = await response.json()
    const location: ResponseGeoLocationType = {
        lat: responseJson.results[0].geometry.location.lat,
        lng: responseJson.results[0].geometry.location.lng,
    }
    return Promise.resolve(location)
}
