import { CommonModel, Create, ReplaceAnd, Update } from '../_others/Common'
import { ScreenNameType } from '../../screens/Router'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'
import { CustomDate, nextMonth } from '../_others/CustomDate'
import range from 'lodash/range'
import { TotalSeconds } from '../_others/TotalSeconds'
import { ID } from '../_others/ID'
import flatten from 'lodash/flatten'
import { setLocalUpdateScreens } from '../../stores/UtilSlice'
import uniqBy from 'lodash/uniqBy'
import { useSelector } from 'react-redux'
import { StoreType } from '../../stores/Store'
import { Dispatch } from 'react'
import { getErrorMessage } from '../../services/_others/ErrorService'
/**
 * - UpdateScreenType - DBフェッチするべきスクリーンとその月などの詳細
 * idAndDates - idと日付の一致が必要な場合。右記のように、Idと日付をくっつけて文字列として保存。id=uuid&dates=2022-09
 */
export type UpdateScreenType = {
    screenName: ScreenNameType
    dates?: TotalSeconds[]
    ids?: ID[]
    idAndDates?: string[]
    isAll?: boolean
}

/**
 *
 *  - accountId - 対象アカウント
 *  - screens - アップデートが必要なスクリーンの情報を入れる
 *
 */
export type UpdateScreensModel = Partial<{
    updateScreensId: ID
    accountId: ID
    screens: UpdateScreenType[]
}> &
    CommonModel

export const initUpdateScreens = (updateScreens: Create<UpdateScreensModel> | Update<UpdateScreensModel>): Update<UpdateScreensModel> => {
    const newUpdateScreens: Update<UpdateScreensModel> = {
        updateScreensId: updateScreens.updateScreensId,
        accountId: updateScreens.accountId,
        screens: updateScreens.screens,
    }
    return newUpdateScreens
}

/**
 * {@link UpdateScreensOptionInputParam - 説明}
 */
export type UpdateScreensOptionInputParam = ReplaceAnd<
    GetOptionObjectType<UpdateScreensOptionParam>,
    {
        //
    }
>

/**
 * {@link UpdateScreensOptionParam - 説明}
 */
export type UpdateScreensOptionParam = {
    //
}

export type UpdateScreensType = UpdateScreensModel & UpdateScreensOptionParam
export type GetUpdateScreensOptionParam = GetOptionParam<UpdateScreensType, UpdateScreensOptionParam, UpdateScreensOptionInputParam>

export const toIdAndMonthFromTotalSeconds = (id?: ID, dates?: number): string => {
    if (id == undefined || dates == undefined) {
        return ''
    }
    return 'id=' + id + 'dates=' + dates.toString()
}

export const toIdAndMonthFromStrings = (id?: ID, dates?: CustomDate): string => {
    if (id == undefined || dates == undefined) {
        return ''
    }
    return 'id=' + id + 'dates=' + dates.totalSeconds.toString()
}

export type SplitIdAndDatesObjArr = {
    id: ID
    date: TotalSeconds
}[]
export const splitIdAndDates = (idAndDates?: string[]): SplitIdAndDatesObjArr => {
    if (idAndDates == undefined) {
        return []
    }
    const obj = idAndDates?.map((idAndDate) => {
        const list = idAndDate?.split('dates=')
        const id = list[0].substring(3)
        const dateString = list[1]
        const date = parseInt(dateString)
        return { id, date }
    })
    return obj
}
/**
 * @remarks startDateからendDateまでのstartDateを起点とした毎月の配列を取得する
 * @objective localUpdateScreensを使用する際に、更新する月を取得するため
 * @param startDate
 * @param endDate
 * @returns startDateからendDateまでのstartDateを起点とした毎月の配列
 */
export const toCustomDatesListFromStartAndEnd = (startDate?: CustomDate, endDate?: CustomDate): CustomDate[] => {
    if (startDate == undefined || endDate == undefined) {
        return []
    }
    const monthNum = (endDate.year - startDate.year) * 12 + endDate.month - startDate.month + 1
    const dateList = range(monthNum).map((monthCount: number) => nextMonth(startDate, monthCount))
    return dateList
}

export type AddUpdateScreensParam = {
    localUpdateScreens?: UpdateScreenType[]
    updateScreens: UpdateScreenType[]
    dispatch: Dispatch<any>
}

/**
 * 次回指定のスクリーンを開いたときに、id,date,idAndDatesから判別してリロードする
 * キャッシュデータ更新のため。
 * @author kamiya
 * @param params AddUpdateScreensParam
 */
export const addUpdateScreens = (params: AddUpdateScreensParam) => {
    try {
        const { updateScreens, dispatch, localUpdateScreens } = params
        const newLocalUpdateScreens: UpdateScreenType[] = updateScreens
            .map((screen) => {
                if (screen?.idAndDates) {
                    const data: UpdateScreenType = {
                        screenName: screen.screenName,
                        idAndDates: [
                            ...flatten(localUpdateScreens?.filter((localScreen) => localScreen.screenName == screen.screenName).map((localScreen) => localScreen?.idAndDates)),
                            ...(screen.idAndDates ?? []),
                        ]?.filter((data) => data != undefined) as string[],
                    }
                    return data
                } else if (screen?.ids) {
                    const data: UpdateScreenType = {
                        screenName: screen.screenName,
                        ids: [
                            ...flatten(localUpdateScreens?.filter((localScreen) => localScreen.screenName == screen.screenName).map((localScreen) => localScreen?.ids)),
                            ...(screen.ids ?? []),
                        ]?.filter((data) => data != undefined) as string[],
                    }
                    return data
                } else if (screen?.dates) {
                    const data: UpdateScreenType = {
                        screenName: screen.screenName,
                        dates: [
                            ...flatten(localUpdateScreens?.filter((localScreen) => localScreen.screenName == screen.screenName).map((localScreen) => localScreen?.dates)),
                            ...(screen.dates ?? []),
                        ]?.filter((data) => data != undefined) as number[],
                    }
                    return data
                } else {
                    return undefined
                }
            })
            .filter((data) => data != undefined) as UpdateScreenType[]

        dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...(localUpdateScreens ?? [])], 'screenName')))
    } catch (error) {
        return getErrorMessage(error)
    }
}
