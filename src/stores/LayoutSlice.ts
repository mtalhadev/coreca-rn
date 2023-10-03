/* eslint-disable indent */
import { createSlice } from '@reduxjs/toolkit'

/**
 * @object レンダリングをふせぐためグローバル・ストアを使用
 */
type LayoutStateType = {
    switchLayoutWidth?: number
    siteMeterLayoutWidth?: number
}

// Stateの初期状態
const initialState: LayoutStateType = {}

// Sliceを生成する
const slice = createSlice({
    name: 'layout',
    initialState,
    reducers: {
        setSwitchLayoutWidth: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { switchLayoutWidth: action.payload })
        },
        setSiteMeterLayoutWidth: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { siteMeterLayoutWidth: action.payload })
        },
    },
})

// Reducerをエクスポートする
export default slice.reducer

// Action Creatorsをエクスポートする
export const { setSwitchLayoutWidth, setSiteMeterLayoutWidth } = slice.actions
