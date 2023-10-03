import cloneDeep from 'lodash/cloneDeep'
import range from 'lodash/range'
import { CustomResponse } from '../models/_others/CustomResponse'
import { useState } from 'react'
import {
    CustomDate,
    dayBaseTextWithoutDate,
    getDailyEndTime,
    getDailyStartTime,
    getMonthlyFinalDay,
    getMonthlyFirstDay,
    monthBaseText,
    nextDay,
    nextMonth,
    toCustomDateFromTotalSeconds,
} from '../models/_others/CustomDate'
import { getErrorMessage } from '../services/_others/ErrorService'

/**
 *
 * @param T startDateとendDateが必須。CustomDateに変換必要。
 * @returns 入力のstartDateとendDateの間の月にデータを配置して月毎に整形したObject（{'2021/01': [obj1, obj2, ..., onjN], ...}
 */
export const separateListByMonth = <T extends { startDate?: CustomDate; endDate?: CustomDate }>(list?: T[] | undefined): Record<string, T[]> => {
    if (list == undefined) {
        return {}
    }
    const rtnObj: Record<string, T[]> = {}
    const separateList: T[] = []

    list.forEach((item) => {
        if (typeof item.startDate == 'number' || typeof item.endDate == 'number') {
            console.error('startDateかendDateがnumberになっています。')
        }
    })

    const filterList = list.filter((obj) => obj.startDate != undefined && obj.endDate != undefined)
    const sortedObjByStart = [...filterList].sort((a, b) => (a?.startDate?.totalSeconds ?? 0) - (b?.startDate?.totalSeconds ?? 0))
    const sortedObjByEnd = [...filterList].sort((a, b) => -(a?.endDate?.totalSeconds ?? 0) + (b?.endDate?.totalSeconds ?? 0))

    const ___date = sortedObjByEnd[0]?.endDate ?? separateList[0]?.startDate
    const firstMonth = sortedObjByStart[0]?.startDate ? getMonthlyFirstDay(sortedObjByStart[0]?.startDate) : undefined
    const finalMonth = ___date ? getMonthlyFinalDay(___date) : undefined
    if (firstMonth == undefined || finalMonth == undefined) {
        return {}
    }
    let targetMonth = cloneDeep(firstMonth)
    let index = 0
    const addObj = (obj: T) => {
        const monthBase = monthBaseText(targetMonth)
        const _list = monthBase ? rtnObj[monthBase] ?? [] : []
        _list.push(obj)
        rtnObj[monthBase] = _list
    }
    while (index <= 10000) {
        ;[...filterList].forEach((obj, index) => {
            if (obj.startDate != undefined && obj.endDate != undefined) {
                if (obj.startDate.totalSeconds <= getMonthlyFinalDay(targetMonth)?.totalSeconds && obj.endDate.totalSeconds >= targetMonth.totalSeconds) {
                    addObj(obj)
                }
            } else if (obj.startDate == undefined && obj.endDate != undefined) {
                if (monthBaseText(obj.endDate) == monthBaseText(targetMonth)) {
                    addObj(obj)
                }
            } else if (obj.startDate != undefined && obj.endDate == undefined) {
                if (monthBaseText(obj.startDate) == monthBaseText(targetMonth)) {
                    addObj(obj)
                }
            }
        })
        index += 1
        targetMonth = nextMonth(targetMonth, 1)
        if (targetMonth.totalSeconds >= finalMonth.totalSeconds) {
            break
        }
    }
    return rtnObj
}

/**
 *
 * @param T meetingDateまたはstartDateとendDateが必須。
 * @param allowOverlap 重複を許容するかどうか。同じ要素を複数の日付に跨らせるかどうか。
 * @returns 入力のmeetingDateとendDateの間の月にデータを配置して月毎に整形したObject（{'2021/01': [obj1, obj2, ..., onjN], ...}
 */
export const separateListByDay = <T extends { meetingDate?: number; siteDate?: number; endDate?: number }>(list?: T[] | undefined, allowOverlap = true): Record<string, T[]> => {
    if (list == undefined) {
        return {}
    }

    const rtnObj: Record<string, T[]> = {}
    const separateList: T[] = []

    const filterList = list.filter((obj) => (obj.meetingDate != undefined || obj.siteDate != undefined) && obj.endDate != undefined)
    const sortedObjByStart = [...filterList].sort((a, b) => (a?.meetingDate ?? a?.siteDate ?? 0) - (b?.meetingDate ?? b?.siteDate ?? 0))
    const sortedObjByEnd = [...filterList].sort((a, b) => -(a?.endDate ?? 0) + (b?.endDate ?? 0))

    const _date = sortedObjByStart[0]?.meetingDate ?? sortedObjByStart[0]?.siteDate
    const firstDay = _date ? getDailyStartTime(toCustomDateFromTotalSeconds(_date)) : undefined
    const __date = sortedObjByEnd[0]?.endDate ?? separateList[0]?.meetingDate ?? sortedObjByStart[0]?.siteDate
    const finalDay = __date ? getDailyEndTime(toCustomDateFromTotalSeconds(__date)) : undefined
    if (firstDay == undefined || finalDay == undefined) {
        return {}
    }
    let targetDay = cloneDeep(firstDay)

    let index = 0
    const addObj = (obj: T, _targetDay: CustomDate) => {
        const _list = rtnObj[dayBaseTextWithoutDate(_targetDay)] ?? []
        _list.push(obj)
        rtnObj[dayBaseTextWithoutDate(_targetDay)] = _list
    }
    if (allowOverlap) {
        while (index <= 10000) {
            ;[...filterList].forEach((obj, index) => {
                if ((obj.meetingDate != undefined || obj.siteDate != undefined) && obj.endDate != undefined) {
                    if (((obj.meetingDate ?? obj.siteDate) as number) <= getDailyEndTime(targetDay).totalSeconds && obj.endDate >= targetDay.totalSeconds) {
                        addObj(obj, targetDay)
                    }
                } else if (obj.meetingDate == undefined && obj.siteDate == undefined && obj.endDate != undefined) {
                    if (dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(obj.endDate)) == dayBaseTextWithoutDate(targetDay)) {
                        addObj(obj, targetDay)
                    }
                } else if ((obj.meetingDate != undefined || obj.siteDate != undefined) && obj.endDate == undefined) {
                    if (dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(obj.meetingDate ?? (obj.siteDate as number))) == dayBaseTextWithoutDate(targetDay)) {
                        addObj(obj, targetDay)
                    }
                }
            })
            index += 1
            targetDay = nextDay(targetDay, 1)
            if (targetDay.totalSeconds >= finalDay.totalSeconds) {
                break
            }
        }
    } else {
        ;[...filterList].forEach((obj, index) => {
            if ((obj.meetingDate != undefined || obj.siteDate != undefined) && obj.endDate != undefined) {
                addObj(obj, toCustomDateFromTotalSeconds(obj.meetingDate ?? (obj.siteDate as number)))
            } else if (obj.meetingDate == undefined && obj.siteDate == undefined && obj.endDate != undefined) {
                addObj(obj, toCustomDateFromTotalSeconds(obj.endDate))
            } else if ((obj.meetingDate != undefined || obj.siteDate != undefined) && obj.endDate == undefined) {
                addObj(obj, toCustomDateFromTotalSeconds(obj.meetingDate ?? (obj.siteDate as number)))
            }
        })
    }

    return rtnObj
}

/**
 *
 * @param list
 * @param loopFunc
 * @param loopCount バッチ処理単位
 * @returns 配列を分割してloopFuncを処理する。Firestoreのinクエリー（最大10）のように処理上限がある場合に使用する。
 */
export const dividedListLoop = async <T = string>(list: Array<T>, loopFunc: (slice: Array<T>) => any, loopCount = 10): Promise<CustomResponse> => {
    try {
        if (typeof list != 'object' || list.length == 0) {
            return Promise.resolve({})
        }
        const promises = []
        for (const index of range(0, 1 + Math.floor((list.length - 1) / loopCount))) {
            const slice = list.slice(index * loopCount, index * loopCount + loopCount).filter((ele) => ele != undefined)
            if (typeof slice != 'object' || slice.length == 0 || slice == undefined) {
                continue
            }
            promises.push(loopFunc(slice))
        }
        await Promise.all(promises)
        return Promise.resolve({})
    } catch (error) {
        return getErrorMessage(error)
    }
}
