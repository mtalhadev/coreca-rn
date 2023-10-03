const cloneDeep = require('lodash/cloneDeep')
const sum = require('lodash/sum')
const range = require('lodash/range')
const flatten = require('lodash/flatten')
import { match } from 'ts-pattern'
import { WeekOfDay, newDate } from '../../utils/ext/Date.extensions'
import { millisecondsToTimeData, TimeData } from '../_others/TimeData'
import { TotalSeconds, YYYYMMDDTotalSecondsParam, YYYYMMTotalSecondsParam, YYYYTotalSecondsParam } from '../_others/TotalSeconds'
import ENV from './../../../env/env'
import { ID } from './ID'
import { monthListModel } from './MonthList'

/**
 * 日時を表現する文字列型
 */
export type YYYYDateType = string
export type YYYYMMDateType = string
export type YYYYMMDDDateType = string
export type HHMMDateType = string

/**
 * 日時を表現する。期間（span）の表現にも使われる。
 * タイムゾーンを変更するとtotalSeconds以外が変わる。
 * @params timeZoneOffset - if -540 => 9時間早い
 * @params totalSeconds - serverにあげるときの値。タイムゾーン共通
 */
export type CustomDate = {
    seconds: number
    year: number
    month: number
    day: number
    dayOfWeek: number
    dayOfWeekText: WeekOfDay
    hour: number
    minute: number
    timeZoneOffset: number
    totalSeconds: TotalSeconds
}

export const AsiaTokyoOffsets = -540

export const convertUTCToAsiaTokyo = (date: CustomDate): CustomDate => {
    return new Date(date.totalSeconds - AsiaTokyoOffsets * 60 * 1000).toCustomDate()
}

export const convertAsiaTokyoToUTC = (date: CustomDate): CustomDate => {
    return new Date(date.totalSeconds + AsiaTokyoOffsets * 60 * 1000).toCustomDate()
}

export const newCustomDate = (): CustomDate => {
    return newDate().toCustomDate()
}

const monthText = (date: CustomDate) => ('00' + (date ? date?.month?.toString() : '')).slice(-2)
const dayText = (date: CustomDate) => ('00' + (date ? date?.day?.toString() : '')).slice(-2)
const hourText = (date: CustomDate) => ('00' + (date ? date?.hour?.toString() : '')).slice(-2)
const minuteText = (date: CustomDate) => ('00' + (date ? date?.minute?.toString() : '')).slice(-2)
const secondsText = (date: CustomDate) => ('00' + (date ? date?.seconds?.toString() : '')).slice(-2)

/**
 * ENV.IS_SERVER_SIDE == trueのときのみAsiaTokyoにTZ変換
 * @param date
 * @returns
 */
export const yearBaseText = (date: CustomDate, timeZoneOffset?: number): YYYYDateType => {
    if (timeZoneOffset != undefined) {
        const _date = ENV.IS_SERVER_SIDE ? new Date(date.totalSeconds - timeZoneOffset * 60 * 1000).toCustomDate() : date
        return `${_date.year}`
    } else {
        const _date = ENV.IS_SERVER_SIDE ? convertUTCToAsiaTokyo(date) : date
        return `${_date.year}`
    }
}
/**
 * ENV.IS_SERVER_SIDE == trueのときのみAsiaTokyoにTZ変換
 * @param date
 * @returns
 */
export const monthBaseText = (date: CustomDate, timeZoneOffset?: number): YYYYMMDateType => {
    if (timeZoneOffset != undefined) {
        const _date = ENV.IS_SERVER_SIDE ? new Date(date.totalSeconds - timeZoneOffset * 60 * 1000).toCustomDate() : date
        return `${_date.year}/${monthText(_date)}`
    } else {
        const _date = ENV.IS_SERVER_SIDE ? convertUTCToAsiaTokyo(date) : date
        return `${_date.year}/${monthText(_date)}`
    }
}
/**
 * ENV.IS_SERVER_SIDE == trueのときのみAsiaTokyoにTZ変換
 * @param date
 * @returns
 */
export const dayAndMonthText = (date: CustomDate, timeZoneOffset?: number) => {
    if (timeZoneOffset != undefined) {
        const _date = ENV.IS_SERVER_SIDE ? new Date(date.totalSeconds - timeZoneOffset * 60 * 1000).toCustomDate() : date
        return `${monthText(_date)}/${dayText(_date)}`
    } else {
        const _date = ENV.IS_SERVER_SIDE ? convertUTCToAsiaTokyo(date) : date
        return `${monthText(_date)}/${dayText(_date)}`
    }
}
/**
 * ENV.IS_SERVER_SIDE == trueのときのみAsiaTokyoにTZ変換
 * @param date
 * @returns
 */
export const dayBaseText = (date: CustomDate, timeZoneOffset?: number) => {
    if (timeZoneOffset != undefined) {
        const _date = ENV.IS_SERVER_SIDE ? new Date(date.totalSeconds - timeZoneOffset * 60 * 1000).toCustomDate() : date
        return `${_date?.year}/${monthText(_date)}/${dayText(_date)}(${_date?.dayOfWeekText})`
    } else {
        const _date = ENV.IS_SERVER_SIDE ? convertUTCToAsiaTokyo(date) : date
        return `${_date?.year}/${monthText(_date)}/${dayText(_date)}(${_date?.dayOfWeekText})`
    }
}
/**
 * ENV.IS_SERVER_SIDE == trueのときのみAsiaTokyoにTZ変換
 * @param date
 * @returns
 */
export const dayOfWeekText = (date: CustomDate, timeZoneOffset?: number) => {
    if (timeZoneOffset != undefined) {
        const _date = ENV.IS_SERVER_SIDE ? new Date(date.totalSeconds - timeZoneOffset * 60 * 1000).toCustomDate() : date
        return _date.dayOfWeekText
    } else {
        const _date = ENV.IS_SERVER_SIDE ? convertUTCToAsiaTokyo(date) : date
        return _date.dayOfWeekText
    }
}
/**
 * ENV.IS_SERVER_SIDE == trueのときのみAsiaTokyoにTZ変換
 * @param date
 * @returns
 */
export const dayBaseTextWithoutDate = (date: CustomDate, timeZoneOffset?: number): YYYYMMDDDateType => {
    if (timeZoneOffset != undefined) {
        const _date = ENV.IS_SERVER_SIDE ? new Date(date.totalSeconds - timeZoneOffset * 60 * 1000).toCustomDate() : date
        return `${_date.year}/${monthText(_date)}/${dayText(_date)}`
    } else {
        const _date = ENV.IS_SERVER_SIDE ? convertUTCToAsiaTokyo(date) : date
        return `${_date.year}/${monthText(_date)}/${dayText(_date)}`
    }
}
/**
 * ENV.IS_SERVER_SIDE == trueのときのみAsiaTokyoにTZ変換
 * @param date
 * @returns
 */
export const timeBaseText = (date: CustomDate, timeZoneOffset?: number) => {
    if (timeZoneOffset != undefined) {
        const _date = ENV.IS_SERVER_SIDE ? new Date(date.totalSeconds - timeZoneOffset * 60 * 1000).toCustomDate() : date
        return `${_date.year}/${monthText(_date)}/${dayText(_date)}(${_date.dayOfWeekText}) ${hourText(_date)}:${minuteText(_date)}`
    } else {
        const _date = ENV.IS_SERVER_SIDE ? convertUTCToAsiaTokyo(date) : date
        return `${_date.year}/${monthText(_date)}/${dayText(_date)}(${_date.dayOfWeekText}) ${hourText(_date)}:${minuteText(_date)}`
    }
}
/**
 * ENV.IS_SERVER_SIDE == trueのときのみAsiaTokyoにTZ変換
 * @param date
 * @returns
 */
export const timeBaseTextWithoutYear = (date: CustomDate, timeZoneOffset?: number) => {
    if (timeZoneOffset != undefined) {
        const _date = ENV.IS_SERVER_SIDE ? new Date(date.totalSeconds - timeZoneOffset * 60 * 1000).toCustomDate() : date
        return `${monthText(_date)}/${dayText(_date)}(${_date.dayOfWeekText}) ${hourText(_date)}:${minuteText(_date)}`
    } else {
        const _date = ENV.IS_SERVER_SIDE ? convertUTCToAsiaTokyo(date) : date
        return `${monthText(_date)}/${dayText(_date)}(${_date.dayOfWeekText}) ${hourText(_date)}:${minuteText(_date)}`
    }
}
/**
 * ENV.IS_SERVER_SIDE == trueのときのみAsiaTokyoにTZ変換
 * @param date
 * @returns
 */
export const secondsBaseText = (date: CustomDate, timeZoneOffset?: number) => {
    if (timeZoneOffset != undefined) {
        const _date = ENV.IS_SERVER_SIDE ? new Date(date.totalSeconds - timeZoneOffset * 60 * 1000).toCustomDate() : date
        return `${_date.year}/${monthText(_date)}/${dayText(_date)}(${_date.dayOfWeekText}) ${hourText(_date)}:${minuteText(_date)}:${secondsText(_date)}`
    } else {
        const _date = ENV.IS_SERVER_SIDE ? convertUTCToAsiaTokyo(date) : date
        return `${_date.year}/${monthText(_date)}/${dayText(_date)}(${_date.dayOfWeekText}) ${hourText(_date)}:${minuteText(_date)}:${secondsText(_date)}`
    }
}
/**
 * ENV.IS_SERVER_SIDE == trueのときのみAsiaTokyoにTZ変換
 * @param date
 * @returns
 */
export const timeText = (date: CustomDate, timeZoneOffset?: number) => {
    if (timeZoneOffset != undefined) {
        const _date = ENV.IS_SERVER_SIDE ? new Date(date.totalSeconds - timeZoneOffset * 60 * 1000).toCustomDate() : date
        return `${hourText(_date)}:${minuteText(_date)}`
    } else {
        const _date = ENV.IS_SERVER_SIDE ? convertUTCToAsiaTokyo(date) : date
        return `${hourText(_date)}:${minuteText(_date)}`
    }
}

/**
 * @param date
 * @returns CustomDateからDate型を生成
 */
export const getDate = (date: CustomDate): Date => {
    return newDate({
        year: date.year,
        month: date.month,
        day: date.day,
        hour: date.hour,
        minute: date.minute,
        second: date.seconds,
    })
}
/**
 * TZの影響を受けるのでサーバーサイドでは非推奨。使用するならAsiaTokyoの変換して、使用後、UTCに戻す。例：convertAsiaTokyoToUTC(thisFunction(convertUTCToAsiaTokyo(date)))
 * @param _date
 * @returns
 */
export const nextYear = (_date: CustomDate, plus = 1): CustomDate => {
    if (ENV.IS_SERVER_SIDE) {
        console.warn('nextYearはTZの影響を受けるためサーバーサイドでの使用は推奨されません。')
    }
    if (plus == 0) {
        return _date
    }
    const date = cloneDeep(getDate(_date))

    date.setFullYear(_date.year + plus)
    return date.toCustomDate()
}

/**
 * TZの影響を受けるのでサーバーサイドでは非推奨。使用するならAsiaTokyoの変換して、使用後、UTCに戻す。例：convertAsiaTokyoToUTC(thisFunction(convertUTCToAsiaTokyo(date)))
 * @param _date
 * @returns
 */
export const nextMonth = (_date: CustomDate, plus = 1): CustomDate => {
    if (ENV.IS_SERVER_SIDE) {
        console.warn('nextMonthはTZの影響を受けるためサーバーサイドでの使用は推奨されません。')
    }
    if (plus == 0) {
        return _date
    }
    const date = cloneDeep(getDate(_date))

    date.setMonth(_date.month - 1 + plus)
    return date.toCustomDate()
}

/**
 * 7日単位なのでTZの影響受けない。
 * @param _date
 * @param plus
 * @returns
 */
export const nextWeek = (_date: CustomDate, plus = 1): CustomDate => {
    if (plus == 0) {
        return _date
    }
    const date = cloneDeep(getDate(_date))

    date.setDate(_date.day + plus * 7)
    return date.toCustomDate()
}

/**
 * 1日単位なのでTZの影響受けない。
 * @param _date
 * @param plus
 * @returns
 */
export const nextDay = (_date: CustomDate, plus = 1): CustomDate => {
    if (plus == 0) {
        return _date
    }
    const date = cloneDeep(getDate(_date))

    date.setDate(_date.day + plus)
    return date.toCustomDate()
}

/**
 * TZの影響なし
 * @param _date
 * @param plus
 * @returns
 */
export const nextHour = (_date: CustomDate, plus = 1): CustomDate => {
    if (plus == 0) {
        return _date
    }
    const date = cloneDeep(getDate(_date))

    date.setHours(_date.hour + plus)
    return date.toCustomDate()
}

/**
 * TZの影響なし
 * @param _date
 * @param plus
 * @returns
 */
export const nextMinute = (_date: CustomDate, plus = 1): CustomDate => {
    if (plus == 0) {
        return _date
    }
    const date = cloneDeep(getDate(_date))

    date.setMinutes(_date.minute + plus)
    return date.toCustomDate()
}

/**
 * TZの影響なし
 * @param _date
 * @param plus
 * @returns
 */
export const nextSecond = (_date: CustomDate, plus = 1): CustomDate => {
    if (plus == 0) {
        return _date
    }
    const date = cloneDeep(getDate(_date))

    date.setSeconds(_date.seconds + plus)
    return date.toCustomDate()
}

/**
 * ENV.IS_SERVER_SIDE == trueのときのみAsiaTokyoにTZ変換
 * @param anotherCustomDate 後の方の日付を入力する。
 * @param isTimeText hh:mmベースのテキストになる。
 * @returns 出力例）2022/01/01（水）0:00〜翌23:00
 */
export const getTextBetweenAnotherDate = (__date?: CustomDate, _anotherCustomDate?: CustomDate, isTimeText = false, timeZoneOffset?: number): string | undefined => {
    let _date: CustomDate | undefined
    let anotherCustomDate: CustomDate | undefined
    if (timeZoneOffset != undefined) {
        _date = ENV.IS_SERVER_SIDE ? (__date ? new Date(__date.totalSeconds - timeZoneOffset * 60 * 1000).toCustomDate() : undefined) : __date
        anotherCustomDate = ENV.IS_SERVER_SIDE ? (_anotherCustomDate ? new Date(_anotherCustomDate.totalSeconds - timeZoneOffset * 60 * 1000).toCustomDate() : undefined) : _anotherCustomDate
    } else {
        _date = ENV.IS_SERVER_SIDE ? (__date ? convertUTCToAsiaTokyo(__date) : undefined) : __date
        anotherCustomDate = ENV.IS_SERVER_SIDE ? (_anotherCustomDate ? convertUTCToAsiaTokyo(_anotherCustomDate) : undefined) : _anotherCustomDate
    }
    const __timeText = isTimeText ? (_date ? timeText(_date) : '未定') : _date ? timeBaseText(_date) : '未定'

    if (anotherCustomDate != undefined && _date != undefined && anotherCustomDate.totalSeconds - _date.totalSeconds < 0) {
        return undefined
    }

    if (anotherCustomDate == undefined) {
        return `${__timeText}〜未定`
    }

    if (_date == undefined || dayBaseText(_date) == dayBaseText(anotherCustomDate)) {
        return `${__timeText}〜${timeText(anotherCustomDate)}`
    }

    const compareDays = compareWithAnotherDate(_date, anotherCustomDate)?.days

    // 1日の差はないけど日を跨いでいるケース。
    if (dayBaseText(_date) != dayBaseText(anotherCustomDate) && compareDays == 0) {
        return `${__timeText}〜翌${timeText(anotherCustomDate)}`
    }

    if (monthBaseText(_date) == monthBaseText(anotherCustomDate) && compareDays == 1) {
        return `${__timeText}〜翌${timeText(anotherCustomDate)}`
    }

    if (monthBaseText(_date) == monthBaseText(anotherCustomDate) && compareDays == 2) {
        return `${__timeText}〜翌々${timeText(anotherCustomDate)}`
    }

    if (monthBaseText(_date) == monthBaseText(anotherCustomDate) && compareDays == 3) {
        return `${__timeText}〜翌々々${timeText(anotherCustomDate)}`
    }

    if (compareDays > 3) {
        return `${__timeText}〜${compareDays}日後${timeText(anotherCustomDate)}`
    }

    return undefined
}

/**
 * ENV.IS_SERVER_SIDE == trueのときのみAsiaTokyoにTZ変換
 * @param anotherCustomDate 後の方の日付を入力する。
 * @param isTimeText hh:mmベースのテキストになる。
 * @returns 出力例）2022/01/01（水）0:00〜27:00(24時を超える場合は、同じ日付で時間をそのまま加算する)
 */
export const getTextBetweenAnotherDateOver24Hours = (__date?: CustomDate, _anotherCustomDate?: CustomDate, isTimeText = false): string | undefined => {
    const _date = ENV.IS_SERVER_SIDE ? (__date ? convertUTCToAsiaTokyo(__date) : undefined) : __date
    const anotherCustomDate = ENV.IS_SERVER_SIDE ? (_anotherCustomDate ? convertUTCToAsiaTokyo(_anotherCustomDate) : undefined) : _anotherCustomDate
    const __timeText = isTimeText ? (_date ? timeText(_date) : '未定') : _date ? timeBaseText(_date) : '未定'

    if (anotherCustomDate != undefined && _date != undefined && anotherCustomDate.totalSeconds - _date.totalSeconds < 0) {
        return undefined
    }

    if (anotherCustomDate == undefined) {
        return `${__timeText}〜未定`
    }

    if (_date == undefined || dayBaseText(_date) == dayBaseText(anotherCustomDate)) {
        return `${__timeText}〜${timeText(anotherCustomDate)}`
    }

    const compareDays = anotherCustomDate.day - _date.day
    const endHour = String(compareDays * 24 + anotherCustomDate.hour).padStart(2, '0')
    const endMinutes = String(anotherCustomDate.minute).padStart(2, '0')

    if (dayBaseText(_date) != dayBaseText(anotherCustomDate)) {
        return `${__timeText}〜${endHour}:${endMinutes}`
    }

    return undefined
}

export const compareWithAnotherDate = (_date: CustomDate, anotherCustomDate?: CustomDate): TimeData => {
    if (anotherCustomDate == undefined) {
        return millisecondsToTimeData(0)
    }
    const date = getDate(_date)
    const anotherDate = getDate(anotherCustomDate)
    const timeDiff = anotherDate.getTime() - date.getTime()
    return millisecondsToTimeData(timeDiff)
}

export const isHoliday = (_date: CustomDate, offDaysOfWeek: { [P in string]: string }, timeZoneOffset?: number): string => {
    const dateNum = dayBaseTextWithoutDate(_date, timeZoneOffset)
    return offDaysOfWeek[dateNum]
}

export const compareWithToday = (_date: CustomDate): TimeData => {
    return compareWithAnotherDate(_date, newCustomDate())
}

export const isTodayOrBefore = (_date: CustomDate): boolean => {
    return compareWithAnotherDate(getDailyStartTime(_date), getDailyStartTime(newCustomDate())).totalMilliseconds >= 0
}

export const isToday = (_date: CustomDate, timeZoneOffset?: number): boolean => {
    return dayBaseText(_date, timeZoneOffset) == dayBaseText(newCustomDate(), timeZoneOffset)
}

export const isTomorrow = (_date: CustomDate, timeZoneOffset?: number): boolean => {
    return dayBaseText(_date, timeZoneOffset) == dayBaseText(nextDay(newCustomDate()), timeZoneOffset)
}

/**
 * TZの影響を受けるのでサーバーサイドでは非推奨。使用するならAsiaTokyoの変換して、使用後、UTCに戻す。例：convertAsiaTokyoToUTC(thisFunction(convertUTCToAsiaTokyo(date)))
 * @param __date
 * @returns
 */
export const getMonthlyDays = (_date: CustomDate): number => {
    const year = _date.year
    const month = _date.month
    const monthDate = newDate({ year, month: month, day: 1 })
    const nextMonthDate = newDate({ year, month: month + 1, day: 1 })
    return Math.floor((nextMonthDate.getTime() - monthDate.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * TZの影響を受けるのでサーバーサイドでは非推奨。使用するならAsiaTokyoの変換して、使用後、UTCに戻す。例：convertAsiaTokyoToUTC(thisFunction(convertUTCToAsiaTokyo(date)))
 * @param __date
 * @returns
 */
export const getMonthlyFirstDay = (__date: CustomDate): CustomDate => {
    if (ENV.IS_SERVER_SIDE) {
        console.warn('getMonthlyFirstDayはTZの影響を受けるためサーバーサイドでの使用は推奨されません。')
    }
    const _date = __date
    const year = _date.year
    const month = _date.month
    const monthDate = newDate({ year, month: month, day: 1, hour: 0, minute: 0, second: 0 })
    return monthDate.toCustomDate()
}

/**
 * TZの影響を受けるのでサーバーサイドでは非推奨。使用するならAsiaTokyoの変換して、使用後、UTCに戻す。例：convertAsiaTokyoToUTC(thisFunction(convertUTCToAsiaTokyo(date)))
 * @param __date
 * @returns
 */
export const getYYYYMMTotalSeconds = (_date: CustomDate): YYYYMMTotalSecondsParam => {
    return getMonthlyFirstDay(_date).totalSeconds
}

/**
 * TZの影響を受けるのでサーバーサイドでは非推奨。使用するならAsiaTokyoの変換して、使用後、UTCに戻す。例：convertAsiaTokyoToUTC(thisFunction(convertUTCToAsiaTokyo(date)))
 * @param __date
 * @returns
 */
export const getMonthlyFinalDay = (__date: CustomDate): CustomDate => {
    if (ENV.IS_SERVER_SIDE) {
        console.warn('getMonthlyFinalDayはTZの影響を受けるためサーバーサイドでの使用は推奨されません。')
    }
    const _date = __date
    return getDailyEndTime(nextDay(getMonthlyFirstDay(nextMonth(_date, 1)), -1))
}

/**
 * TZの影響を受けるのでサーバーサイドでは非推奨。使用するならAsiaTokyoの変換して、使用後、UTCに戻す。例：convertAsiaTokyoToUTC(thisFunction(convertUTCToAsiaTokyo(date)))
 * @param __date
 * @returns
 */
export const getDailyStartTime = (__date: CustomDate): CustomDate => {
    if (ENV.IS_SERVER_SIDE) {
        console.warn('getDailyStartTimeはTZの影響を受けるためサーバーサイドでの使用は推奨されません。')
    }
    const _date = __date
    const year = _date.year
    const month = _date.month
    const day = _date.day
    const dayDate = newDate({ year, month, day, hour: 0, minute: 0, second: 0 })
    return dayDate.toCustomDate()
}

/**
 * TZの影響を受けるのでサーバーサイドでは非推奨。使用するならAsiaTokyoの変換して、使用後、UTCに戻す。例：convertAsiaTokyoToUTC(thisFunction(convertUTCToAsiaTokyo(date)))
 * @param __date
 * @returns
 */
export const getYYYYMMDDTotalSeconds = (_date: CustomDate): YYYYMMDDTotalSecondsParam => {
    return getDailyStartTime(_date).totalSeconds
}

/**
 * TZの影響を受けるのでサーバーサイドでは非推奨。使用するならAsiaTokyoの変換して、使用後、UTCに戻す。例：convertAsiaTokyoToUTC(thisFunction(convertUTCToAsiaTokyo(date)))
 * @param __date
 * @returns
 */
export const getDailyEndTime = (__date: CustomDate): CustomDate => {
    if (ENV.IS_SERVER_SIDE) {
        console.warn('getDailyEndTimeはTZの影響を受けるためサーバーサイドでの使用は推奨されません。')
    }
    const _date = __date
    const year = _date.year
    const month = _date.month
    const day = _date.day
    const dayDate = newDate({ year, month, day, hour: 23, minute: 59, second: 59 })
    return dayDate.toCustomDate()
}

/**
 * TZの影響を受けるのでサーバーサイドでは非推奨。使用するならAsiaTokyoの変換して、使用後、UTCに戻す。例：convertAsiaTokyoToUTC(thisFunction(convertUTCToAsiaTokyo(date)))
 * @param __date
 * @returns
 */
export const getYearlyFirstDay = (__date: CustomDate): CustomDate => {
    if (ENV.IS_SERVER_SIDE) {
        console.warn('getYearlyFirstDayはTZの影響を受けるためサーバーサイドでの使用は推奨されません。')
    }
    const _date = __date
    const year = _date.year
    const yearDate = newDate({ year, month: 1, day: 1, hour: 0, minute: 0, second: 0 })
    return yearDate.toCustomDate()
}

/**
 * TZの影響を受けるのでサーバーサイドでは非推奨。使用するならAsiaTokyoの変換して、使用後、UTCに戻す。例：convertAsiaTokyoToUTC(thisFunction(convertUTCToAsiaTokyo(date)))
 * @param __date
 * @returns
 */
export const getYYYYTotalSeconds = (_date: CustomDate): YYYYTotalSecondsParam => {
    return getYearlyFirstDay(_date).totalSeconds
}

/**
 * @summary DateのmSec表現値からCustomDateを生成
 * @purpose Functions側の都合により、フロント側でSecondsからローカルTimezoneへの手動変換処理が必要となったため機能追加
 * @param seconds Date型オブジェクトのmSec表現値（＝offset値0のunix time）
 * @param isConvertToLocalTimezone ローカルTimezoneへの手動変換処理が必要か否かのフラグ
 * @returns CustomDate型オブジェクト
 * @errors なし
 * @throws なし
 * @author Okuda
 */
export const toCustomDateFromTotalSeconds = (seconds: TotalSeconds, isConvertToLocalTimezone = false): CustomDate => {
    /**
     * 2022.9.26
     * タイムゾーンのずれを治す必要がないので。
     * Hiruma
     */
    return new Date(seconds).toCustomDate()
    // if (isConvertToLocalTimezone) {
    //     const localTZOffset = new Date().getTimezoneOffset()
    //     const localTZSeconds = seconds - localTZOffset * 60 * 1000
    //     // __DEV__ &&  console.log(`src   Seconds: ${seconds}`)
    //     // __DEV__ && console.log(`local  Seconds: ${localTZSeconds}`)
    //     // __DEV__ && console.log(`local Offset: ${localTZOffset}`)
    //     return new Date(localTZSeconds).toCustomDate()
    // } else {
    //     // __DEV__ && console.log(`nonConverted Date: ${new Date(seconds)}`)
    //     return new Date(seconds).toCustomDate()
    // }
}

export const monthListFromCustomDates = (id?: ID, start?: CustomDate, end?: CustomDate): monthListModel[] => {
    if (start == undefined || end == undefined || id == undefined) {
        return []
    }
    const monthNum = (end.year - start.year) * 12 + end.month - start.month + 1
    const _start = cloneDeep(start)
    /**
     * 月の中日ならば、TZの影響を受けない。
     *  例：10月からの3ヶ月、月初の場合。
     *  9/30,10/30,11/30  utc
     *  10/1,10/31,12/1 asia(11月が抜けてる)
     */
    const startMonth = nextDay(getMonthlyFirstDay(_start), 5)
    const dateList: CustomDate[] = range(monthNum).map((monthCount: number) => nextMonth(startMonth, monthCount))
    /**
     * 9/5,10/5,11/5 utc
     * 9/6,10/6,11/6 asia
     * となった場合に、初月がいらないので排除
     */
    dateList.shift()
    const monthList: monthListModel[] = dateList.map((date) => {
        return {
            id,
            month: date.totalSeconds,
        }
    })
    /**
     * 排除した初月を追加。
     * UTCベースのCustomDateによるnextMonthを使用しているため、startが月初の場合に、最終月を取得できないケースがあるためendを追加。
     * 例：start:10/1 end:11/1の場合。Asiaで10/1のUTCは9/30となり、nextMonthが30d進んだ10/30（UTC）10/31（Asia)となり、1ヶ月という扱いになる。
     * また、monthListには同月が複数あっても問題ない。
     */
    monthList.push(
        {
            id,
            month: start.totalSeconds,
        },
        {
            id,
            month: end.totalSeconds,
        },
    )
    return monthList
}
/**
 *
 * @param rcvDateString 例: '2022/08/01'
 * @returns
 */
export const toCustomDateFromString = (rcvDateString: string): CustomDate => {
    const array: string[] = rcvDateString.split('/')
    const workDate = newDate({ year: parseInt(array[0]), month: parseInt(array[1]), day: parseInt(array[2]) }).toCustomDate()
    /**
     * テキストはAsia/Tokyoの前提なので、サーバーサイドでのみUTCに変換する
     */
    if (ENV.IS_SERVER_SIDE) {
        return convertAsiaTokyoToUTC(workDate)
    }
    return workDate
}

export const combineTimeAndDay = (time?: CustomDate, date?: CustomDate): CustomDate | undefined => {
    if (date == undefined) {
        date = newCustomDate()
    }
    if (time == undefined) {
        return undefined
    }
    return newDate({ year: date?.year, month: date?.month, day: date?.day, hour: time?.hour, minute: time?.minute }).toCustomDate()
}

//
/**
 * TZ変換あり
 *  時間と分を合計して`hh:mm`を返す。
 */
export const sumCustomDateTime = (_dates: CustomDate[]): string => {
    const dates = ENV.IS_SERVER_SIDE ? _dates.map((date) => convertUTCToAsiaTokyo(date)) : _dates
    const totalMinutes = sum(dates.map((date) => date.hour * 60 + date.minute))
    const hoursNum = Math.floor(totalMinutes / 60)
    const hours = hoursNum.toString().length < 2 ? ('0' + hoursNum).slice(-2) : hoursNum.toString()
    const minutes = totalMinutes - hoursNum * 60
    return `${hours}:${('0' + minutes).slice(-2)}`
}

export type DateStringFormat = 'YYYY/MM' | 'YYYY/MM/DD' | 'YYYY/MM/DD:hh/mm/ss' | 'hh/mm/ss' | 'hh/mm'
/*
 * 日付のフォーマットをチェックする。
 */

export const isValidDateStringFormat = (string: string, format: DateStringFormat = 'YYYY/MM/DD'): boolean => {
    const dateData = flatten(string.split('/').map((data) => data.split(':'))) as string[]
    const formatData = flatten(format.split('/').map((data) => data.split(':'))) as string[]
    if (dateData.length != formatData.length) {
        return false
    }
    const validData = dateData.filter(
        (data, index) =>
            !Number.isNaN(Number(data)) &&
            Number(data) >= 0 &&
            data.length == formatData[index].length &&
            Number(data) <=
                match(formatData[index])
                    .with('YYYY', () => 9999)
                    .with('MM', () => 12)
                    .with('DD', () => 31)
                    .with('hh', () => 23)
                    .with('mm', () => 59)
                    .with('ss', () => 59)
                    .otherwise(() => -1),
    )
    return validData.length == dateData.length
}

/**
 * TZの影響を受けるのでサーバーサイドでは非推奨。使用するならAsiaTokyoの変換して、使用後、UTCに戻す。例：convertAsiaTokyoToUTC(thisFunction(convertUTCToAsiaTokyo(date)))
 * @param __date
 * @returns
 */
export const getHHmmTotalSeconds = (_date: CustomDate): YYYYTotalSecondsParam => {
    return newDate({ year: 0, month: 1, day: 1, hour: _date.hour, minute: _date.minute, second: 0 }).toCustomDate().totalSeconds
}

/**
 * 時刻の秒以下を切り捨てる（遅刻時間など差を出したい場合に使用）
 * @param totalSeconds
 * @returns
 */
export const truncateSeconds = (totalSeconds: number): number => {
    const _totalSeconds = totalSeconds % 60000 == 0 ? totalSeconds : Math.floor(totalSeconds / 60000) * 60000
    return _totalSeconds
}
