import Constants from 'expo-constants'
/**
 * [js sdk]
 * import {deleteField, getFirestore, FieldValue, connectFirestoreEmulator} from "firebase/firestore"
 * 
 * [rn sdk]
 * import firestore, {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'
 */
import firestore, {FirebaseFirestoreTypes} from '@react-native-firebase/firestore'

import firebaseJson from './../../../firebase.json'


export const _getFirestore = () => {
    /**
     * [js sdk]
     * return getFirestore()
     * 
     * [rn sdk]
     * return firestore()
     */
    return firestore()
}


/**
 * [js sdk]
 * export const deleteFieldParam = () => {
 *   return deleteField()
 * }
 * 
 * [rn sdk]
 * export const deleteFieldParam = () => {
    return firestore.FieldValue.delete()
}
 */
export const deleteFieldParam = () => {
    return firestore.FieldValue.delete()
}


/**
 * [js sdk]
 * export type FieldValueType = FieldValue
 * 
 * [rn sdk]
 * export type FieldValueType = FirebaseFirestoreTypes.FieldValue
 */
export type FieldValueType = FirebaseFirestoreTypes.FieldValue

const FIREBASE_OFFICIAL_FIRESTORE_EMULATE_HOST = `${Constants?.expoConfig?.extra?.useFirebaseOfficialEmulatorHost}`

export const _connectFirestoreEmulator = () => {
    /**
     * [js sdk]
     * return connectFirestoreEmulator(getFirestore(), firebaseJson['emulators']['firestore']['host'], firebaseJson['emulators']['firestore']['port'])
     * 
     * [rn sdk]
     * return firestore().useEmulator(firebaseJson['emulators']['firestore']['host'], firebaseJson['emulators']['firestore']['port'])
     */
    return firestore().useEmulator(FIREBASE_OFFICIAL_FIRESTORE_EMULATE_HOST, firebaseJson['emulators']['firestore']['port'])
}