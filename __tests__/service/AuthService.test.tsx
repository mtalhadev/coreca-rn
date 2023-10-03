import { CustomResponse } from '../../src/models/_others/CustomResponse'
import ENV from '../../env/env'
import { initializeFirestore } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import {
    _deleteLoginAccountAndLocalAccount,
    _deleteLocalAccount,
    _forgetPassword,
    _getAuthUser,
    _getLocalAccountList,
    _login,
    _logout,
    _resetPassword,
    _sendLink,
    _writeLocalAccount,
    _signUp,
    _updateAuth,
} from '../../src/services/account/AccountService'
import { User } from 'firebase/auth'
import { AccountType } from '../../src/models/account/Account'
import { initTestApp } from '../utils/testUtils'

let accountIdArray: string[] = []
const defEmail = 'hiroshi.mito.biz@gmail.com'
const defPassword = 'TestPass123'

beforeAll(() => {
    initTestApp()
})

describe('AuthService', () => {
    /*
    it('dummy', () => {
        expect(true).toBe(true)
    })
    */

    it('_signUp test', async () => {
        let rtn: CustomResponse = await _signUp(defEmail, defPassword)
        expect(rtn.success).not.toBe(true)
    })

    it('_login test', async () => {
        let rtn: CustomResponse<AccountType> = await _login(defEmail, defPassword)
        expect(rtn.error).toBe(undefined)
    })

    it('_login fail test1', async () => {
        try {
            let rtn: CustomResponse<AccountType> = await _login(defEmail + 'abcdef', defPassword)
        } catch (e: any) {
            expect(e.error).toBe('auth/user-not-found')
        }
    })

    it('_login fail test2', async () => {
        try {
            let rtn: CustomResponse<AccountType> = await _login(defEmail, defPassword + 'abcdef')
        } catch (e: any) {
            expect(e.error).toBe('auth/wrong-password')
        }
    })

    it('_sendLink test', async () => {
        await _login(defEmail, defPassword)

        let rtn: CustomResponse = await _sendLink()
        expect(rtn.success).toBe(true)
    })

    it('_forgetPassword test', async () => {
        let rtn: CustomResponse = await _forgetPassword(defEmail)
        expect(rtn.success).toBe(true)
    })

    it('_resetPassword test', async () => {
        await _login(defEmail, defPassword)
        let rtn: CustomResponse = await _resetPassword('TestPass456')
        expect(rtn.success).toBe(true)
        await _resetPassword(defPassword)
    })

    it('_logout test', async () => {
        await _login(defEmail, defPassword)

        let rtn: CustomResponse = await _logout()
        expect(rtn.success).toBe(true)
    })

    it('_deleteLoginAccountAndLocalAccount test', async () => {
        await _login(defEmail, defPassword)

        let rtn: CustomResponse = await _deleteLoginAccountAndLocalAccount()
        expect(rtn.success).toBe(true)
    })

    it('_writeLocalAccount test', async () => {
        let account: AccountType = { accountId: '1234-1234-abcdef', email: 'hanako@coreca.com', password: 'TestPass123' }

        let rtn: CustomResponse = await _writeLocalAccount(account)
        expect(rtn.success).toBeTruthy()
    })

    it('_deleteLocalAccount test', async () => {
        let rtn: CustomResponse = await _deleteLocalAccount('1234-1234-abcdef')
        expect(rtn.success).toBeTruthy()
    })

    it('_getLocalAccountList test', async () => {
        let account1: AccountType = { accountId: '1234-1234-abcdef', email: 'hanako@coreca.com', password: 'TestPass123' }
        let account2: AccountType = { accountId: '2234-2234-abcdef', email: 'taro@coreca.com', password: 'TestPass123' }

        await _writeLocalAccount(account1)
        await _writeLocalAccount(account2)

        let rtn: AccountType[] = await _getLocalAccountList()
        expect(rtn.length).toBe(2)
        await _deleteLocalAccount('1234-1234-abcdef')
        await _deleteLocalAccount('2234-2234-abcdef')
    })
})
