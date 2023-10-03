/* eslint-disable indent */
import { createSlice } from '@reduxjs/toolkit'
import { CustomDate } from '../models/_others/CustomDate'

/**
 * @object カレンダー画面でのレンダリングをふせぐためグローバル・ストアを使用
 */
type CalendarStateType = {
    targetDate?: CustomDate
    expandWeekNumber?: number
}

// Stateの初期状態
const initialState: CalendarStateType = {
    targetDate: {} as CustomDate,
    expandWeekNumber: -1,
}

// Sliceを生成する
const slice = createSlice({
    name: 'calendar',
    initialState,
    reducers: {
        setTargetDate: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { targetDate: action.payload })
        },
        setExpandWeekNumber: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { expandWeekNumber: action.payload })
        },
    },
})

// Reducerをエクスポートする
export default slice.reducer

// Action Creatorsをエクスポートする
export const { setTargetDate, setExpandWeekNumber } = slice.actions
