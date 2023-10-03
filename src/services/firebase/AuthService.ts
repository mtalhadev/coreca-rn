
/**
 * [js sdk]
 * import { ActionCodeSettings, createUserWithEmailAndPassword, getAuth, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, updateEmail, updatePassword, connectAuthEmulator } from "firebase/auth"
 * 
 * [rn sdk]
 * import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'
 */
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth'

import firebaseJson from './../../../firebase.json'

import Constants from 'expo-constants'

const FIREBASE_OFFICIAL_AUTH_EMULATE_PORT = `${firebaseJson['emulators']['auth']['port']}`  // firebase公式エミュレータ
const FIREBASE_OFFICIAL_AUTH_EMULATE_HOST = `${Constants?.expoConfig?.extra?.useFirebaseOfficialEmulatorHost}:${FIREBASE_OFFICIAL_AUTH_EMULATE_PORT}`

export const _getAuthUser = () => {
    /**
     * [js sdk]
     * const _auth = getAuth()
     * return _auth
     * 
     * [rn sdk]
     * const _auth = auth()
     * return _auth
     */
    const _auth = auth()
    return _auth
}

export const _getCurrentUser = () => {
    /**
     * [js sdk]
     * const _auth = _getAuthUser()
     * return _auth?.currentUser
     * 
     * [rn sdk]
     * const _auth = _getAuthUser()
     * return _auth?.currentUser
     */
    const _auth = _getAuthUser()
    return _auth?.currentUser
}

export const _createUserWithEmailAndPassword = async (email: string, password: string) => {
    /**
     * [js sdk]
     * return createUserWithEmailAndPassword(_getAuthUser(), email, password)
     * 
     * [rn sdk]
     * return _getAuthUser()?.createUserWithEmailAndPassword(email, password)
     */
    return _getAuthUser()?.createUserWithEmailAndPassword(email, password)
}

/**
 * [js sdk]
 * ActionCodeSettings | undefined
 * 
 * [rn sdk]
 * FirebaseAuthTypes.ActionCodeSettings | undefined
 */
export const _sendEmailVerification = async (actionCodeSettings?: FirebaseAuthTypes.ActionCodeSettings | undefined) => {
    /**
     * [js sdk]
     * const user =  _getCurrentUser()
     * return user ? sendEmailVerification(user, actionCodeSettings) : undefined
     * 
     * [rn sdk]
     * return _getCurrentUser()?.sendEmailVerification(actionCodeSettings)
     */
    return _getCurrentUser()?.sendEmailVerification(actionCodeSettings)
}

export const _updateEmail = async (email: string) => {
    /**
     * [js sdk]
     * const user =  _getCurrentUser()
     * return user ? updateEmail(user, email) : undefined
     * 
     * [rn sdk]
     * return _getCurrentUser()?.updateEmail(email)
     */
    return _getCurrentUser()?.updateEmail(email)
}

export const _updatePassword = async (password: string) => {
    /**
     * [js sdk]
     * const user =  _getCurrentUser()
     * return user ? updatePassword(user, password) : undefined
     * 
     * [rn sdk]
     * return _getCurrentUser()?.updatePassword(password)
     */
    return _getCurrentUser()?.updatePassword(password)
}

export const _signInWithEmailAndPassword = async (email: string, password: string) => {
    /**
     * [js sdk]
     * return signInWithEmailAndPassword(_getAuthUser(), email, password)
     * 
     * [rn sdk]
     * return _getAuthUser()?.signInWithEmailAndPassword(email, password)
     */
    return _getAuthUser()?.signInWithEmailAndPassword(email, password)
}

export const _sendPasswordResetEmail = async (email: string) => {
    /**
     * [js sdk]
     * return sendPasswordResetEmail(_getAuthUser(), email)
     * 
     * [rn sdk]
     * return _getAuthUser()?.sendPasswordResetEmail(email)
     */
    return _getAuthUser()?.sendPasswordResetEmail(email)
}

export const _signOut = async () => {
    /**
     * [js sdk]
     * return _getAuthUser().signOut()
     * 
     * [rn sdk]
     * return _getAuthUser().signOut()
     */
    return _getAuthUser()?.signOut()
}

export const _connectAuthEmulator = () => {
    /**
     * [js sdk]
     * return connectAuthEmulator(_getAuthUser(), `http://localhost:${firebaseJson['emulators']['auth']['port']}`)
     * 
     * [rn sdk]
     * return auth().useEmulator(`http://localhost:${firebaseJson['emulators']['auth']['port']}`)
     */
    const _auth = auth()
    const authUrl = `http://${FIREBASE_OFFICIAL_AUTH_EMULATE_HOST}`
    return _auth.useEmulator(authUrl)
}