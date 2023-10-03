import { TotalSeconds } from './TotalSeconds'

export type TimeData = {
    days: number
    hours: number
    minutes: number
    seconds: number
    milliseconds: number
    totalMilliseconds: TotalSeconds
}

export const millisecondsToTimeData = (timeDiff: TotalSeconds): TimeData => {
    const totalMilliseconds = timeDiff

    const dayTimes = 1000 * 60 * 60 * 24
    const days = Math.floor(timeDiff / dayTimes)
    timeDiff -= days * dayTimes

    const hourTimes = 1000 * 60 * 60
    const hours = Math.floor(timeDiff / hourTimes)
    timeDiff -= hours * hourTimes

    const minuteTimes = 1000 * 60
    const minutes = Math.floor(timeDiff / minuteTimes)
    timeDiff -= minutes * minuteTimes

    const secondTimes = 1000
    const seconds = Math.floor(timeDiff / secondTimes)
    timeDiff -= seconds * secondTimes

    const milliseconds = timeDiff

    return {
        days,
        hours,
        minutes,
        seconds,
        milliseconds,
        totalMilliseconds,
    }
}
