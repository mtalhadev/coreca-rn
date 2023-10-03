import range from 'lodash/range'
import flatten from 'lodash/flatten'
import { WEEKLY_DAY_COUNT, MONTHLY_WEEK_COUNT } from "../../components/organisms/homeCalendar/HomeCalendarMonth"
import { DateDataCLType, toDateDataCLType } from "../../models/date/DateDataType"
import { CustomResponse } from "../../models/_others/CustomResponse"
import { _getAdminHomeData, _getAdminHomeDataWeekly, _getDateData, _getDateSiteData } from "../../services/date/DateDataService"
import { _getHolidayList } from "../../services/_others/HolidaySercvice"
import { CustomDate, getDailyStartTime, getMonthlyFirstDay, getYYYYMMDDTotalSeconds, getYYYYMMTotalSeconds, nextDay, timeBaseText } from "../../models/_others/CustomDate"
import { getErrorMessage } from "../../services/_others/ErrorService"


export type getDateSiteDataParam = {
    myCompanyId?: string
    date?: CustomDate
}

export type getDateSiteDataResponse = DateDataCLType | undefined

export const getDateSiteData = async (params: getDateSiteDataParam): Promise<CustomResponse<getDateSiteDataResponse>> => {
    try {
        const { myCompanyId, date } = params
        
        const dateResult = await _getDateSiteData({
            myCompanyId,
            date: date ? getYYYYMMDDTotalSeconds(date) : undefined
        })
        if (dateResult.error) {
            throw {
                error: dateResult.error,
                errorCode: 'GET_DATE_DATA_ERROR',
            }
        }

        const dateData = toDateDataCLType(dateResult.success)

        return Promise.resolve({
            success: dateData,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}


/**
 * @requires
 * @param myCompanyId - 自社Id。
 * @param month - 手配情報を取得したい月
 */
export type getAdminHomeDataParam = {
    myCompanyId: string
    month: CustomDate
    fetchMode?: 'daily' | 'weekly' | 'monthly'
}
/**
 * @param DateDataCLType[] - 指定月の日ごとに、現場と手配可能な作業員の情報が入った配列
 */
export type getAdminHomeDataResponse = DateDataCLType[] | undefined
/**
 * @remarks 指定月の現場・手配を取得する。
 * @objective ArrangementHome.tsxにおいて現場・手配状況を取得するため
 * @error
 * - COMPANY_ERROR - 自社Idがなかった場合
 * - MONTH_ERROR - 月が指定されていなかった場合
 * - DATE_DATA_ERROR - 指定月の現場・手配情報の取得に失敗した場合
 * @author Hiruma
 * @param params - {@link getAdminHomeDataParam}
 * @returns - {@link getAdminHomeDataResponse}
 */
export const getAdminHomeData = async (params: getAdminHomeDataParam): Promise<CustomResponse<getAdminHomeDataResponse>> => {
    try {
        const { myCompanyId, month, fetchMode } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
                errorCode: 'COMPANY_ERROR',
            } as CustomResponse
        }
        if (month == undefined) {
            throw {
                error: '情報が足りません。',
                errorCode: 'MONTH_ERROR',
            } as CustomResponse
        }
        const _fetchMode = fetchMode ?? 'daily'
        let data = undefined as undefined | DateDataCLType[]
        const monthlyFirstDay = getMonthlyFirstDay(month)
        /**
         * 比較環境
         * moderntique_glass@yahoo.co.jp
         * PW: 11111111
         * 2022/8月
         */
        if (_fetchMode == 'daily') {
            /**
             * ** 日付ごと取得 **
             * iOS 開発ビルド
             * 22秒（メモリ1GB）
             * 
             * 17秒（メモリ2GB）Now
             * 最終 => 8秒 Best
             */
            /**
             * 
             * 指定月の初日から最終日までを配列に入れる
             */
            const __firstDay = getDailyStartTime(nextDay(monthlyFirstDay, -monthlyFirstDay.dayOfWeek))
            const dateList = range(WEEKLY_DAY_COUNT * MONTHLY_WEEK_COUNT).map((dayCount) => nextDay(__firstDay, dayCount))
            /**
             * 指定月の初日から最終日までのデータを取得する
             */
            const dateDataListResult = await Promise.all(
                dateList.map((date) =>
                    _getDateSiteData({
                        date: getYYYYMMDDTotalSeconds(date),
                        myCompanyId,
                    }),
                ),
            )
            data = dateDataListResult?.map((result) => toDateDataCLType(result.success)) as DateDataCLType[]
        } else if (_fetchMode == 'weekly') {
            /**
             * ** 週ごと取得 **
             * iOS 開発ビルド
             * 28秒（メモリ1GB）
             * 
             * 36秒（メモリ512MB）
             * 
             * 15秒（メモリ2GB）Now
             * 最終 => 13秒
             * 
             * 16秒（メモリ4GB）
             * 
             * 22秒（メモリ8GB）
             */
            const results = await Promise.all(range(MONTHLY_WEEK_COUNT).map((weekNumber) => _getAdminHomeDataWeekly({
                myCompanyId,
                month: getYYYYMMTotalSeconds(monthlyFirstDay),
                weekNumber
            })))
            data = flatten(results.map((result) => result.success)).map((_data) => toDateDataCLType(_data)) as DateDataCLType[]
        } else {
            /**
             * ** 月ごと取得 **
             * iOS 開発ビルド
             * 68秒（メモリ2GB）
             * 
             * 62秒（メモリ8GB）
             */
            const dateResult = await _getAdminHomeData({
                myCompanyId,
                month: getYYYYMMTotalSeconds(monthlyFirstDay),
                dayCount: MONTHLY_WEEK_COUNT * WEEKLY_DAY_COUNT
            })
            if (dateResult.error) {
                throw {
                    error: dateResult.error,
                    errorCode: 'GET_DATE_DATA_ERROR',
                }
            }
            /**
             * 日付がずれるのでフィルターしない。
             */
            data = dateResult.success?.map((result) => toDateDataCLType(result)) as DateDataCLType[]
        }
        
        return Promise.resolve({
            success: data,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}