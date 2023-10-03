import ENV from '../../../env/env'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { Platform } from 'react-native'
import axios from 'axios'
import firebaseJson from './../../../firebase.json'
import Constants from 'expo-constants'
/**
 * [js sdk]
 * import { getFunctions, httpsCallable, httpsCallableFromURL, connectFunctionsEmulator } from 'firebase/functions'
 * 
 * [rn sdk]
 * import firebase from '@react-native-firebase/app'
 * import functions from '@react-native-firebase/functions'
 */
import firebase from '@react-native-firebase/app'
import functions from '@react-native-firebase/functions'

const FUNCTION_EMULATE_PORT = 3000
const FUNCTION_EMULATE_HOST = `localhost:${FUNCTION_EMULATE_PORT}`

const FIREBASE_OFFICIAL_FUNCTION_EMULATE_PORT = parseInt(`${firebaseJson['emulators']['functions']['port']}`)  // firebase公式エミュレータ
const FIREBASE_OFFICIAL_FUNCTION_EMULATE_HOST = `${Constants?.expoConfig?.extra?.useFirebaseOfficialEmulatorHost}`

export const _getFunctions = () => {
    // if (Platform.OS == 'android') {
    //     return functions()
    // }
    /**
     * [js sdk]
     * return getFunctions()
     * 
     * [rn sdk]
     * return firebase.app().functions('asia-northeast1')
     */
    return firebase.app().functions('asia-northeast1')
}

export const __getEmulatorFunctionsURI = (name: string) => {
    const [dirName, functionName] = name.split('-')
    return `http://${FUNCTION_EMULATE_HOST}/api/${dirName}?function=${functionName}`
}

/**
 * @remarks Functions関数の呼び出し時に通す関数。
 * @errors 
 * - 『HTTPのリダイレクトが多すぎます』 - エラーが発生している場合は関数が存在しないことが考えられます。
 * @param name 
 * @param params 
 * @returns 
 */
export const _callFunctions = async <T=any, U=Record<string, any>>(name: string, params?: U): Promise<CustomResponse<T>> => {
    /**
     * ### functionsのローカルエミュレート
     * coreca-serverにてローカルサーバーを立ち上げてください。
     * 
     * 注意：trueはstring型
     */
    if (Constants?.expoConfig?.extra?.useFunctionEmulator == 'true') {
        return (await axios.post(__getEmulatorFunctionsURI(name), params)).data
    
    
    /**
     * ### firebase公式のローカルエミュレート
     * coreca-serverにてfirebaseエミュレーターを立ち上げてください。
     * 
     * 注意：trueはstring型
     */
    } else if (Constants?.expoConfig?.extra?.useFirebaseOfficialEmulator == 'true') {
        const functions = _getFunctions()
        functions.useEmulator(`${FIREBASE_OFFICIAL_FUNCTION_EMULATE_HOST}`, FIREBASE_OFFICIAL_FUNCTION_EMULATE_PORT);
        const _func = functions.httpsCallable(name, { timeout: 310 * 1000 });
        const res = (await _func(params)).data;
        return res
    }
    if (process.env.NODE_ENV === 'test') {
        try {
            const res = await axios.post(__getEmulatorFunctionsURI(name), params)
            return res.data
        } catch (error) {
            if(axios.isAxiosError(error))
                return { error: error.message, errorCode: error.code, type: 'error' }
            else 
                return { error: JSON.stringify(error) }
        }
    }
    /**
     * [js sdk]
     * if (params) {
     *     return (await httpsCallableFromURL(_getFunctions(), _getFirebaseUrl(name))(params)).data as CustomResponse<T>
     * }
     * return (await httpsCallableFromURL(_getFunctions(), _getFirebaseUrl(name))()).data as CustomResponse<T>
     * 
     * [rn sdk]
     * const func = _getFunctions().httpsCallable(name)
     * if (params) {
     *    return (await func(params)).data
     * }
     * return (await func()).data
     */
    const func = _getFunctions().httpsCallable(name)
    if (params) {
        return (await func(params)).data
    }
    return (await func()).data
}

export const _getFirebaseUrl = (name: string) => {
    /**
     * jsとrnで差分なし
     */
    return `https://asia-northeast1-${__DEV__ ? ENV.TEST_FIREBASE_CONFIG.projectId : ENV.PROD_FIREBASE_CONFIG.projectId}.cloudfunctions.net/${name}`
}

export const _connectFunctionsEmulator = () => {
    /**
     * [js sdk]
     * return connectFunctionsEmulator(_getFunctions(), 'localhost', firebaseJson['emulators']['functions']['port'])
     * 
     * [rn sdk]
     * const functions = firebase.app().functions("asia-northeast1");
     * return functions.useEmulator(`${FIREBASE_OFFICIAL_FUNCTION_EMULATE_HOST}`, FIREBASE_OFFICIAL_FUNCTION_EMULATE_PORT)
     */
    // const functions = _getFunctions()
    return functions().useEmulator(`${FIREBASE_OFFICIAL_FUNCTION_EMULATE_HOST}`, FIREBASE_OFFICIAL_FUNCTION_EMULATE_PORT)
}