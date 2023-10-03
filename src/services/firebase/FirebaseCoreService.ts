
/**
 * [js sdk]
 * import { initializeFirestore } from 'firebase/firestore'
 * import { initializeApp } from 'firebase/app'
 * 
 * [rn sdk]
 * import firestore from '@react-native-firebase/firestore'
 */
import firestore from '@react-native-firebase/firestore'
import { Platform } from 'react-native'
import ENV from '../../../env/env'
import { _connectAuthEmulator } from './AuthService'
import { _connectFirestoreEmulator } from './FirestoreService'
import { _connectFunctionsEmulator } from './FunctionsService'
import { _connectStorageEmulator } from './StorageService'
import Constants from 'expo-constants'

export const _connectFirebaseEmulator = () => {
    _connectAuthEmulator()
    _connectFirestoreEmulator()
    _connectFunctionsEmulator()
    _connectStorageEmulator()
}

export const _initializeFirebase = async () => {

    /**
     * [js sdk]
     * const _firebase = initializeApp(__DEV__ ? ENV.TEST_FIREBASE_CONFIG : ENV.PROD_FIREBASE_CONFIG)
     * const _firestore = initializeFirestore(_firebase, {
     *     experimentalForceLongPolling: true,
     *     ignoreUndefinedProperties: true,
     * })
     * 
     * [rn sdk]
     * firestore().settings({
     *     ignoreUndefinedProperties: true,
     * })
     */
    firestore().settings({
        ignoreUndefinedProperties: true,
        /**
         * オンオフにしてもonSnapShotのタイムは変わらず。
         * trueだと古いデータが蓄積されていることがあり不具合の下になるのでfalseにする。
         */
        persistence: false
    })

    if (Constants?.expoConfig?.extra?.useFirebaseOfficialEmulator == 'true') {
        _connectFirebaseEmulator()
    }
}
