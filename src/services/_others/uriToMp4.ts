import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from './ErrorService'
import * as FileSystem from 'expo-file-system'

export const _uriToBase64 = async (dataUri: string): Promise<CustomResponse<string>> => {
    try {
        const resultBase64 = await FileSystem.readAsStringAsync(dataUri, {
            encoding: 'base64',
        })
        return Promise.resolve({
            success: resultBase64,
        })
    } catch (e) {
        return getErrorMessage(e)
    }
}
