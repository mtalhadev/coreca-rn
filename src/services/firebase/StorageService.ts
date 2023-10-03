/**
 * [js sdk]
 * import { getDownloadURL, getStorage, ref, uploadBytes, connectStorageEmulator } from 'firebase/storage'
 * 
 * [rn sdk]
 * import storage from '@react-native-firebase/storage'
 */
import storage, {firebase} from '@react-native-firebase/storage'

import { CustomResponse } from '../../models/_others/CustomResponse'
import { getUuidv4 } from '../../utils/Utils'
import firebaseJson from './../../../firebase.json'

export const _getStorage = () => {
    /**
     * [js sdk]
     * return getStorage()
     * 
     * [rn sdk]
     * return storage()
     */
    return storage()
}

export const _uploadImageAndGetUrl = async (uri: string, path?: string): Promise<CustomResponse<string>> => {
    try {
        const _storage = _getStorage()

        /**
         * [js sdk]
         * const localUri = await fetch(uri)
         * const localBlob = await localUri.blob()
         * const result = await uploadBytes(ref(_storage, path ?? `images/${getUuidv4()}.jpg`), localBlob)
         * const url = await getDownloadURL(result.ref)
         * 
         * [rn sdk]
         * const ref = _storage.ref(path ?? `images/${getUuidv4()}.jpg`)
         * await ref.putFile(uri, {
         *   cacheControl: 'no-store'
         * })
         * const url = await ref.getDownloadURL()
         */
        const ref = _storage.ref(path ?? `images/${getUuidv4()}.jpg`)
        await ref.putFile(uri, {
            cacheControl: 'no-store'
        })
        const url = await ref.getDownloadURL()

        return Promise.resolve({
            success: url,
        })
    } catch {
        return Promise.resolve({
            error: 'アップロードに失敗しました。',
        })
    }
}

export const _connectStorageEmulator = () => {
    /**
     * [js sdk]
     * return connectStorageEmulator(_getStorage(), 'localhost', firebaseJson['emulators']['storage']['port'])
     * 
     * [rn sdk]
     * return storage().useEmulator('localhost', firebaseJson['emulators']['storage']['port'])
     */
    return storage().useEmulator('localhost', firebaseJson['emulators']['storage']['port'])
}