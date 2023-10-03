/* eslint-disable indent */
import { createSlice } from '@reduxjs/toolkit'
import { AccountType } from '../models/account/Account'
import { DepartmentType } from '../models/department/DepartmentType'

/**
 * @param checkedSignIn - ログイン情報を確認したかどうか。
 * @param isSignUping - 新規作成中という特殊な状況に対応するため。
 * @param planTicketId - アカウント作成時のプランチケットIDを保存するため。会社が作成される前にチェックするので。
 */
type AccountStateType = {
    signInUser?: AccountType
    checkedSignIn: boolean
    isSignUping: boolean
    isLogining: boolean
    isLoggingOff: boolean
    belongCompanyId?: string
    planTicketId?: string
    isDev: boolean
    activeDepartments?: DepartmentType[]
}

// Stateの初期状態
const initialState: AccountStateType = {
    checkedSignIn: false,
    isSignUping: false,
    isLogining: false,
    isLoggingOff: false,
    isDev: false,
    activeDepartments: []
}

// Sliceを生成する
const slice = createSlice({
    name: 'account',
    initialState,
    reducers: {
        setSignInUser: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { signInUser: action.payload })
        },
        setCheckedSignIn: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { checkedSignIn: action.payload })
        },
        setIsSignUping: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { isSignUping: action.payload })
        },
        setIsLogining: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { isLogining: action.payload })
        },
        setIsLoggingOff: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { isLoggingOff: action.payload })
        },
        setBelongCompanyId: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { belongCompanyId: action.payload })
        },
        setIsDev: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { isDev: action.payload })
        },
        setPlanTicketId: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { planTicketId: action.payload })
        },
        setActiveDepartments: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { activeDepartments: action.payload })
        },
    },
})

// Reducerをエクスポートする
export default slice.reducer

// Action Creatorsをエクスポートする
export const { setSignInUser, setPlanTicketId, setIsLogining, setIsLoggingOff, setIsSignUping, setCheckedSignIn, setBelongCompanyId, setIsDev, setActiveDepartments } = slice.actions
