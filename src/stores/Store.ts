import { combineReducers } from 'redux'
import { configureStore } from '@reduxjs/toolkit'
import { StateType } from 'typesafe-actions'

// それぞれ slice.reducer を default export している前提
import accountSlice from './AccountSlice'
import NavigationSlice from './NavigationSlice'
import UtilSlice from './UtilSlice'
import calendarSlice from './CalendarSlice'
import createProjectSlice from './CreateProjectSlice'
import layoutSlice from './LayoutSlice'
import cacheSlice from './CacheSlice'

const reducer = combineReducers({
    nav: NavigationSlice,
    util: UtilSlice,
    account: accountSlice,
    calendar: calendarSlice,
    createProject: createProjectSlice,
    layout: layoutSlice,
    cache: cacheSlice,
})

const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            immutableCheck: false,
            serializableCheck: false,
        }),
})

export default store

export type StoreType = StateType<typeof reducer>
