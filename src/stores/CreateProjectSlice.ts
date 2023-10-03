/* eslint-disable indent */
import { createSlice } from '@reduxjs/toolkit'
import { ProjectType } from '../models/project/Project'

type CreateProjectStateType = {
    selectedProject?: ProjectType
}

// Stateの初期状態
const initialState: CreateProjectStateType = {
    selectedProject: undefined,
}

// Sliceを生成する
const slice = createSlice({
    name: 'createProject',
    initialState,
    reducers: {
        setSelectedProject: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { selectedProject: action.payload })
        },
    },
})

// Reducerをエクスポートする
export default slice.reducer

// Action Creatorsをエクスポートする
export const { setSelectedProject } = slice.actions
