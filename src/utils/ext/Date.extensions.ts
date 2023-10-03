import cloneDeep from 'lodash/cloneDeep'
import { CustomDate } from '../../models/_others/CustomDate'

// 拡張メソッドの定義
declare global {
    interface Date {
        toCustomDate(): CustomDate
        getDayOfWeekText(): WeekOfDay
    }
    
}

export const _weekDayList = ['月', '火', '水', '木', '金', '土', '日', '祝']
export type WeekOfDay = typeof _weekDayList[number] | undefined
export const weekDayList: WeekOfDay[] = cloneDeep(_weekDayList) as WeekOfDay[]

/**
 * 
 * @param param そのタイムゾーンの日時を渡す。
 * @returns タイムゾーンに合わせてDateを生成する。
 */
export const newDate = (param?: { year?: number; month?: number; day?: number; hour?: number; minute?: number; second?: number }): Date => {
    const { year, month, day, hour, minute, second } = param ?? {}
    const today = new Date()

    const date = new Date(
        year ?? today.getFullYear(),
        (month ?? today.getMonth() + 1) - 1,
        day ?? today.getDate(),
        (hour ?? today.getHours()),
        (minute ?? today.getMinutes()),
        second ?? today.getSeconds(),
    )
    return date
}


Date.prototype.getDayOfWeekText = function (): WeekOfDay {
    const date: Date = this as Date
    if (date == undefined) {
        return undefined
    }
    const dayOfWeek = date.getDay()
    let weekText: WeekOfDay = undefined
    switch (dayOfWeek) {
        case 1:
            weekText = '月'
            break
        case 2:
            weekText = '火'
            break
        case 3:
            weekText = '水'
            break
        case 4:
            weekText = '木'
            break
        case 5:
            weekText = '金'
            break
        case 6:
            weekText = '土'
            break
        case 0:
            weekText = '日'
            break
    }
    return weekText
}

Date.prototype.toCustomDate = function (): CustomDate {
    /**
     * ## server side
     * today.getTimezoneOffset() = 0
     * 
     * ## client side
     * today.getTimezoneOffset() = -540
     */
    const date: Date = this as Date
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayOfWeek = date.getDay()
    const dayOfWeekText = date.getDayOfWeekText()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const seconds = date.getSeconds()
    const timeZoneOffset = date.getTimezoneOffset()
    const totalSeconds = Number(date)
    const dateValue = {
        seconds,
        year,
        month,
        day,
        dayOfWeek,
        dayOfWeekText,
        hour,
        minute,
        timeZoneOffset,
        totalSeconds,
    }
    return dateValue
}