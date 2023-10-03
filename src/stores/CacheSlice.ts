/* eslint-disable indent */
import { createSlice } from '@reduxjs/toolkit'

/**
 * @object 一時的ストレージとして使用
 */
export type CacheStateType = {
    //    cacheStore?: { key: string; value: any }[]
    isCacheReady?: boolean
    newConstructionIds?: string[]
    newConstructionIdsInSiteDate?: string[]
    deletedConstructionIds?: string[]
}

// Stateの初期状態
const initialState: CacheStateType = {
    isCacheReady: true,
}

// Sliceを生成する
const slice = createSlice({
    name: 'cache',
    initialState,
    reducers: {
        // setCacheStore: (state: any, action: { payload: any }) => {
        //     return Object.assign({}, state, { cacheStore: action.payload })
        // },
        setIsCacheReady: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { isCacheReady: action.payload })
        },
        setNewConstructionIds: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { newConstructionIds: action.payload })
        },
        setNewConstructionIdsInSiteDate: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { newConstructionIdsInSiteDate: action.payload })
        },
        setDeletedConstructionIds: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { deletedConstructionIds: action.payload })
        },
    },
})

// Reducerをエクスポートする
export default slice.reducer

// Action Creatorsをエクスポートする
export const { setIsCacheReady, setNewConstructionIds, setNewConstructionIdsInSiteDate, setDeletedConstructionIds } = slice.actions
