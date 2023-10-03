/* eslint-disable indent */
import { createSlice, Dispatch, Action } from '@reduxjs/toolkit'

export const MAX_BACK_TITLE_LENGTH = 5


export type URLScheme = {
    hostname: string
    path: string
    queryParams: { [P in string]: string | number }
    scheme: string
}

type NavStateType = {
    backTitle: string | '戻る' | undefined | null
    routeName: string | undefined
    urlScheme: URLScheme | undefined
    linkingAddListenerCount: number
    isNavUpdating: boolean
}

// Stateの初期状態
const initialState: NavStateType = {
    backTitle: '戻る',
    routeName: undefined,
    urlScheme: undefined,
    linkingAddListenerCount: 0,
    isNavUpdating: false,
}

// Sliceを生成する
const slice = createSlice({
    name: 'navigation',
    initialState,
    reducers: {
        setBackTitle: (state: any, action: { payload: string | any[] }) => {
            if (typeof action.payload == 'string') {
                action.payload = action.payload.slice(0, MAX_BACK_TITLE_LENGTH)
            }
            return Object.assign({}, state, { backTitle: action.payload })
        },
        setRouteName: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { routeName: action.payload })
        },
        setUrlScheme: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { urlScheme: action.payload })
        },
        setIsNavUpdating: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { isNavUpdating: action.payload })
        },
        setLinkingAddListenerCount: (state: any, action: any) => {
            return Object.assign({}, state, { linkingAddListenerCount: 1 })
        },
    },
})

// Reducerをエクスポートする
export default slice.reducer

// Action Creatorsをエクスポートする
export const { setBackTitle, setRouteName, setUrlScheme, setLinkingAddListenerCount, setIsNavUpdating } = slice.actions
