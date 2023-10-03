import React, { useState, useEffect } from 'react'
import { ViewStyle, _Text } from 'react-native'
import { THEME_COLORS } from '../../utils/Constants'
import { Tag } from './Tag'
import { compareWithAnotherDate, CustomDate, newCustomDate } from "../../models/_others/CustomDate"
import '../../utils/ext/Date.extensions'
import { useTextTranslation } from '../../fooks/useTextTranslation'

export type TimeIconProps = {
    fontSize?: number
    style?: ViewStyle
    targetDate?: CustomDate
    endDate?: CustomDate
}

export const TimeIcon = React.memo((props: Partial<TimeIconProps>) => {
    let { fontSize, targetDate, endDate, style } = props
    fontSize = fontSize ?? 10
    targetDate = targetDate ?? newCustomDate()
    const { t } = useTextTranslation()

    const [color, setColor] = useState(THEME_COLORS.OTHERS.TIMER_SKY_BLUE)
    const [textColor, setTextColor] = useState('#000')
    const [timeText, setTimeText] = useState<string>(t('common:Acquisition'))

    useEffect(() => {
        const _timer = () => {
            if (targetDate) {
                let _text = ''
                const today = newCustomDate()
                // 2022.07 okuda - KVSキャッシュ導入に伴い、メソッドを持たないキャッシュデータに対応させるためCustomDateを再生成
                // const timeDiff = compareWithAnotherDate(today, targetDate)
                const timeDiff = compareWithAnotherDate(today, targetDate)
                if (timeDiff.days > 0) {
                    _text = `${t('common:After')}${timeDiff.days}${t('common:Day')}`
                    setColor(THEME_COLORS.OTHERS.TIMER_SKY_BLUE)
                    setTextColor('#000')
                } else if (timeDiff.days == 0 && timeDiff.hours > 0) {
                    _text = `${t('common:After')}${timeDiff.hours}${t('common:Hours')}`
                    setColor(THEME_COLORS.OTHERS.TIMER_SKY_BLUE)
                    setTextColor('#000')
                } else if (timeDiff.days == 0 && timeDiff.hours == 0 && timeDiff.minutes > 0) {
                    _text = `${t('common:After')}${timeDiff.minutes}${t('common:Minutes')}`
                    setColor(THEME_COLORS.OTHERS.TIMER_SKY_BLUE)
                    setTextColor('#000')
                } else if (timeDiff.days == 0 && timeDiff.hours == 0 && timeDiff.minutes == 0 && timeDiff.seconds > 0) {
                    _text = `${t('common:After')}${timeDiff.seconds}${t('common:Seconds')}`
                    setColor(THEME_COLORS.OTHERS.TIMER_SKY_BLUE)
                    setTextColor('#000')
                } else {
                    if (endDate) {
                        if (today.totalSeconds > endDate.totalSeconds) {
                            _text = t('common:Finished')
                            setColor(THEME_COLORS.OTHERS.BLACK)
                            setTextColor('#fff')
                        } else {
                            _text = t('common:Present')
                            setColor(THEME_COLORS.OTHERS.ALERT_RED)
                            setTextColor('#fff')
                        }
                    } else {
                        _text = t('common:Started')
                        setColor(THEME_COLORS.OTHERS.TIMER_SKY_BLUE)
                        setTextColor('#000')
                    }
                }
                setTimeText(_text)
            }
        }
        _timer()
        const subscribe = setInterval(() => {
            _timer()
        }, 1000 * 60)
        return () => {
            clearInterval(subscribe)
        }
    }, [])

    return <Tag style={style} iconName={'timer'} fontColor={textColor} fontSize={fontSize} color={color} tag={timeText} />
})
