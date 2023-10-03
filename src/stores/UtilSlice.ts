/* eslint-disable indent */
import { createSlice, Dispatch, Action } from '@reduxjs/toolkit'
import { splitIdAndDates, UpdateScreenType } from '../models/updateScreens/UpdateScreens'
import { CustomResponse } from '../models/_others/CustomResponse'
import { HolidayType, _getHolidayList } from '../services/_others/HolidaySercvice'

export type ToastType = 'info' | 'warn' | 'error' | 'success'

export type ToastMessage = {
    text: string
    title?: string
    type?: ToastType
    time?: number
}

export type LoadingType = boolean | 'unTouchable' | 'inVisible'

type UtilStateType = {
    isKeyboardOpen: boolean
    isBottomOff: boolean
    toastMessage: ToastMessage | undefined
    holidays: HolidayType
    bottomSheet: undefined | (() => JSX.Element)
    loading: LoadingType
    loadingString: string | undefined
    localUpdateScreens: UpdateScreenType[]
}

// Stateの初期状態
const initialState: UtilStateType = {
    isKeyboardOpen: false,
    isBottomOff: false,
    toastMessage: undefined,
    holidays: {},
    bottomSheet: undefined,
    loading: false,
    loadingString: undefined,
    localUpdateScreens: [],
}

// Sliceを生成する
const slice = createSlice({
    name: 'utils',
    initialState,
    reducers: {
        setKeyboardOpen: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { isKeyboardOpen: action.payload })
        },
        setIsBottomOff: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { isBottomOff: action.payload })
        },
        setToastMessage: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { toastMessage: action.payload })
        },
        setHolidays: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { holidays: action.payload })
        },
        setBottomSheet: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { bottomSheet: action.payload })
        },
        setLoading: (state: any, action: { payload: any }) => {
            if (state.loadingString == '招待処理準備中...') {
                //招待処理中で、別処理により送られてきた時は無視する。
                return Object.assign({}, state)
            }
            return Object.assign({}, state, { loading: action.payload })
        },
        setLoadingString: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { loadingString: action.payload })
        },
        setLocalUpdateScreens: (state: any, action: { payload: any }) => {
            return Object.assign({}, state, { localUpdateScreens: action.payload })
        },
    },
})

// Reducerをエクスポートする
export default slice.reducer

// Action Creatorsをエクスポートする
export const { setKeyboardOpen, setToastMessage, setHolidays, setBottomSheet, setLoading, setLoadingString, setLocalUpdateScreens, setIsBottomOff } = slice.actions

// export const updateHolidays = async (age: number): Promise<CustomResponse<Record<string, string>>> => {
//     try {
//         const res = await axios.get<XMLHttpRequest>(`https://offDaysOfWeek-jp.github.io/api/v1/${age}/date.json`)
//         if (!res.request?._response) {
//             return Promise.resolve({
//                 error: 'No data',
//             })
//         }
//         const offDaysOfWeek: Record<string, string> = JSON.parse(res.request?._response)
//         const db = getFirestore()

//         await setDoc(doc(db, 'Holiday', age.toString()), JSON.parse(res.request?._response) as Record<string, string>)
//         return Promise.resolve({
//             success: offDaysOfWeek,
//         })
//     } catch (error) {
//         return getErrorMessage(error)
//     }
// }

export const fetchHolidayList =
    () =>
    async (dispatch: Dispatch<Action>): Promise<CustomResponse<HolidayType>> => {
        try {
            const holidaysResult = await _getHolidayList()
            if (holidaysResult.error) {
                throw {
                    error: holidaysResult.error,
                }
            }
            dispatch(setHolidays(holidaysResult.success))
            return Promise.resolve({
                success: holidaysResult.success as HolidayType,
            })
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(setHolidays({}))
            return Promise.resolve({
                error: _error.error,
            })
        }
    }

/**
 * @requires
 * - screens - DBフェッチするscreen
 * - screenName - DBフェッチしたscreen名
 * - paramName - dates又はids
 *  @partial
 * - id - idsまたはidAndDateのid
 * - startDate - paramNameがdatesまたはidAndDatesの場合の、削除したい期間の開始日
 * - endDate - paramNameがdatesまたはidAndDatesの場合の、削除したい期間の終了日
 */
export type deleteParamOfLocalUpdateScreensParam = {
    screens: UpdateScreenType[]
    screenName?: string
    id?: string
    ids?: string[]
    startDate?: number
    endDate?: number
    paramName: keyof Omit<UpdateScreenType, 'screenName'>
}
/**
 * @remarks DBフェッチ後に、localUpdateScreensから対象のScreenかつ月又は日付を削除する。
 * @objective 次回以降DBフェッチしないように
 * @author  Kamiya
 * @param params - {@link deleteParamOfLocalUpdateScreensParam}
 * @returns - void
 */
export const deleteParamOfLocalUpdateScreens = async (params: deleteParamOfLocalUpdateScreensParam): Promise<boolean> => {
    const { screens, screenName, id, ids, startDate, endDate, paramName } = params
    if (screenName == undefined || screens == undefined || screens?.length <= 0) {
        return false
    }
    const targetScreen = screens?.filter((screen) => screen.screenName == screenName)[0]
    if (targetScreen == undefined) {
        return true
    }
    if (paramName == 'dates' && startDate && endDate) {
        const newParam = targetScreen[paramName]?.filter((data) => data < startDate || data > endDate)
        targetScreen[paramName] = newParam
    }
    if (paramName == 'ids' && id) {
        const newParam = targetScreen[paramName]?.filter((data) => data != id)
        targetScreen[paramName] = newParam
    }
    if (paramName == 'ids' && ids) {
        const newParam = targetScreen[paramName]?.filter((data) => !ids.includes(data))
        targetScreen[paramName] = newParam
    }
    if (paramName == 'idAndDates' && startDate && endDate && targetScreen?.idAndDates) {
        const idAndDateObjArr = splitIdAndDates(targetScreen?.idAndDates)
        const newIdAndDateObjArr = idAndDateObjArr.filter((obj) => id != obj.id || obj.date < startDate || obj.date > endDate)
        const newParam = newIdAndDateObjArr.map((obj) => 'id=' + obj.id + 'dates=' + obj.date.toString())
        targetScreen[paramName] = newParam
    }
    const newScreens = [...(screens?.filter((screen) => screen.screenName != screenName) ?? []), targetScreen]
    setLocalUpdateScreens(newScreens)
    return true
}
