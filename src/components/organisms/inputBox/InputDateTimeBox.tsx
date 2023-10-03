/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react'
import { Text, Pressable, View, ViewStyle } from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'

import { BlueColor, ColorStyle, GlobalStyles, FontStyle } from '../../../utils/Styles'
import { THEME_COLORS } from '../../../utils/Constants'
import { useNavigation } from '@react-navigation/core'
import { newDate } from '../../../utils/ext/Date.extensions'
import { combineTimeAndDay, CustomDate, dayBaseText, getDailyEndTime, getDailyStartTime, getDate, nextDay, timeBaseText, timeText } from '../../../models/_others/CustomDate'
import { InputBox } from '../../atoms/InputBox'
import { match } from 'ts-pattern'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import CancelSvg from './../../../../assets/images/cancel.svg'
// const { t } = useTextTranslation()
type InputValue = CustomDate | undefined

export type InputDateTimeBoxProps = {
    title: string
    placeholder: string
    color: ColorStyle
    borderWidth: number
    height: number
    infoText: string
    onValueChangeValid: (value: InputValue) => void
    setIsExceededPeriod?: (value: boolean) => void
    value: InputValue
    initDateInput: CustomDate
    minDateTime: CustomDate
    maxDateTime: CustomDate
    disable: boolean
    required: boolean
    dateInputMode: 'date' | 'time' | 'datetime'
    // dateInputModeがtimeのときのみ翌日が反映される。
    isNextDay: boolean | undefined
    onNextDayChanged: (value: boolean | undefined) => void
    // dateInputMode == 'time'のとき時間のみの比較になるので翌日を反映されるための変数。
    minDateTimeIsNextDay: boolean
    maxDateTimeIsNextDay: boolean
    displayNextDayButton?: boolean
    isList?: boolean
    onDelete?: () => void
    defaultDateInput?: CustomDate
    onClear?: () => void
    noChangeValue?: boolean
    style?: ViewStyle
}

export const MULTILINE_HEIGHT_MULTIPLE = 2

export const InputDateTimeBox = (props: Partial<InputDateTimeBoxProps>) => {
    const { t } = useTextTranslation()
    let {
        color,
        borderWidth,
        height,
        title,
        infoText,
        onValueChangeValid,
        setIsExceededPeriod,
        placeholder,
        value,
        disable,
        required,
        dateInputMode,
        minDateTime,
        maxDateTime,
        isNextDay,
        minDateTimeIsNextDay,
        maxDateTimeIsNextDay,
        displayNextDayButton,
        onNextDayChanged,
        initDateInput,
        isList,
        onDelete,
        defaultDateInput,
        onClear,
        noChangeValue,
        style,
    } = props
    title = title ?? t('common:Title')
    color = color ?? BlueColor
    borderWidth = borderWidth ?? 2
    height = height ?? 50
    placeholder = placeholder ?? t('common:Input')
    disable = disable ?? false
    required = required ?? false
    dateInputMode = dateInputMode ?? 'date'
    isNextDay = isNextDay ?? false
    minDateTimeIsNextDay = minDateTimeIsNextDay ?? false
    maxDateTimeIsNextDay = maxDateTimeIsNextDay ?? false
    displayNextDayButton = displayNextDayButton ?? false
    const navigation = useNavigation<any>()
    const [dateTime, setDateTime] = useState<InputValue>(value as InputValue)
    const [localIsNextDay, setLocalIsNextDay] = useState<boolean | undefined>(isNextDay)
    // const [keepDateTime, setKeepDateTime] = useState<InputValue>(undefined)
    const [dateTimeText, setDateTimeText] = useState<string>('')
    const [isSelectDateTime, setIsSelectDateTime] = useState<boolean>(false)
    const [valid, setValid] = useState<'good' | 'bad' | 'none'>('none')
    const [isVisible, setIsVisible] = useState<boolean>(false)
    const [isFirstUpdate, setIsFirstUpdate] = useState(true)
    const [localMinDateTime, setLocalMinDateTime] = useState(minDateTime)
    const [localMaxDateTime, setLocalMaxDateTime] = useState(maxDateTime)

    // timeの場合統一できるように。
    const date = newDate({ year: 1000, month: 1, day: 1, minute: 0, second: 0 }).toCustomDate()

    useMemo(() => {
        if (!isSelectDateTime) {
            setDateTime(value)
        }
    }, [value])

    useMemo(() => {
        if (!isSelectDateTime) {
            setLocalIsNextDay(isNextDay)
        }
    }, [isNextDay])

    // useMemo(() => {
    //     if (onValueChangeValid) {
    //         onValueChangeValid(keepDateTime)
    //     }
    // }, [isNextDay])

    useMemo(() => {
        if (maxDateTime == undefined) {
            setLocalMaxDateTime(undefined)
            return
        }
        if (dateInputMode == 'date') {
            setLocalMaxDateTime(getDailyStartTime(nextDay(maxDateTime, 1)))
        } else if (dateInputMode == 'time') {
            setLocalMaxDateTime(combineTimeAndDay(maxDateTime, nextDay(date, maxDateTimeIsNextDay ? 1 : 0)))
        } else {
            setLocalMaxDateTime(maxDateTime)
        }
    }, [maxDateTime, maxDateTimeIsNextDay])

    useMemo(() => {
        if (minDateTime == undefined) {
            setLocalMinDateTime(undefined)
            return
        }
        if (dateInputMode == 'date') {
            setLocalMinDateTime(getDailyEndTime(nextDay(minDateTime, -1)))
        } else if (dateInputMode == 'time') {
            setLocalMinDateTime(combineTimeAndDay(minDateTime, nextDay(date, minDateTimeIsNextDay ? 1 : 0)))
        } else {
            setLocalMinDateTime(minDateTime)
        }
    }, [minDateTime, minDateTimeIsNextDay])

    const _onValueChangeValid = (_value: InputValue, _isNextDay: boolean | undefined) => {
        if (onValueChangeValid) {
            if (isSelectDateTime) {
                if (_value != value) {
                    onValueChangeValid(_value)
                }
                setIsSelectDateTime(false)
            }
        }
        if (onNextDayChanged && _isNextDay != isNextDay) {
            onNextDayChanged(_isNextDay)
        }
    }

    const onHideDateTime = (): void => {
        setIsVisible(false)
    }

    const updateText = (date: CustomDate) => {
        let currentDateText = ''
        if (dateInputMode === 'date') {
            currentDateText = dayBaseText(date)
        } else if (dateInputMode === 'datetime') {
            currentDateText = timeBaseText(date)
        } else if (dateInputMode === 'time') {
            currentDateText = timeText(date)
        }
        setDateTimeText(currentDateText)
    }

    const onConfirmDateTime = (selectedDate: Date): void => {
        // setKeepDateTime(selectedDate.toCustomDate()) //翌日をセットされた時に利用したいので値を保持
        setDateTime(selectedDate.toCustomDate())
        setIsVisible(false)
    }

    const updateDateTime = (_dateTime: InputValue, _isNextDay: boolean | undefined) => {
        let valid = true
        if (isFirstUpdate) {
            setIsFirstUpdate(false)
        }
        if (_dateTime == undefined) {
            valid = false
        }
        if (_dateTime != undefined) {
            updateText(_dateTime)
            const _combine = match(dateInputMode)
                .with('time', () => combineTimeAndDay(_dateTime, nextDay(date, _isNextDay ? 1 : 0)))
                .otherwise(() => _dateTime)
            // if (_combine) {
            //     if (dateInputMode == 'time') {
            //         const _combineMax = combineTimeAndDay(localMaxDateTime, date.nextDay(maxDateTimeIsNextDay ? 1 : 0))
            //         if (_combineMax != undefined && _combine.nextDay(isNextDay ? 1 : 0).totalSeconds > _combineMax.totalSeconds) {
            //             valid = false
            //         }
            //         const _combineMin = combineTimeAndDay(localMinDateTime, date.nextDay(minDateTimeIsNextDay ? 1 : 0))
            //         if (_combineMin != undefined && _combine.nextDay(isNextDay ? 1 : 0).totalSeconds < _combineMin.totalSeconds) {
            //             valid = false
            //         }
            //     } else {
            //         if (localMaxDateTime != undefined && _combine.totalSeconds > localMaxDateTime.totalSeconds) {
            //             valid = false
            //         }
            //         if (localMinDateTime != undefined && _combine.totalSeconds < localMinDateTime.totalSeconds) {
            //             valid = false
            //         }
            //     }
            // }
            if (_combine) {
                if (localMaxDateTime != undefined && _combine.totalSeconds > localMaxDateTime.totalSeconds) {
                    valid = false
                    if (setIsExceededPeriod) {
                        setIsExceededPeriod(true)
                    }
                }
                if (localMinDateTime != undefined && _combine.totalSeconds < localMinDateTime.totalSeconds) {
                    valid = false
                }
            }
        }

        if (valid) {
            setValid('good')
            _onValueChangeValid(_dateTime, _isNextDay)
        } else {
            if (!isFirstUpdate) {
                setValid('bad')
            } else {
                setValid('none')
            }
            _onValueChangeValid(undefined, _isNextDay)
        }
    }

    useEffect(() => {
        updateDateTime(dateTime, localIsNextDay)
    }, [dateTime, localMaxDateTime, localMinDateTime, localIsNextDay])

    return (
        <View style={[style]}>
            <InputBox
                valid={required ? (isList ? 'none' : valid) : 'none'}
                height={height}
                borderWidth={borderWidth}
                color={color}
                title={title}
                disable={disable}
                required={required}
                infoText={infoText}
                isList={isList}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row' }}>
                        <Pressable
                            style={{
                                flex: 5,
                            }}
                            onPress={() => {
                                if (!disable) {
                                    setIsSelectDateTime(true)
                                    setIsVisible(true)
                                }
                            }}>
                            <View pointerEvents="none">
                                <Text
                                    style={{
                                        color: dateTime != undefined ? (valid == 'bad' ? 'red' : '#000') : THEME_COLORS.OTHERS.LIGHT_GRAY,
                                        fontFamily: FontStyle.regular,
                                        fontSize: 14,
                                        lineHeight: 20,
                                        paddingTop: 5,
                                    }}
                                    numberOfLines={1}
                                    ellipsizeMode="tail">
                                    {isNextDay && dateTime != undefined ? t('common:Next') : ''} {dateTime != undefined && !noChangeValue ? dateTimeText : placeholder}
                                </Text>
                            </View>
                        </Pressable>
                        {displayNextDayButton == true && dateInputMode == 'time' && (
                            <Pressable
                                onPress={() => {
                                    setLocalIsNextDay(!localIsNextDay)
                                }}
                                style={{
                                    flex: 1,
                                    backgroundColor: isNextDay ? BlueColor.deepTextColor : THEME_COLORS.OTHERS.BACKGROUND,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 20,
                                    height: 30,
                                    borderWidth: 1,
                                    borderColor: isNextDay ? BlueColor.deepTextColor : THEME_COLORS.OTHERS.BORDER_COLOR,
                                }}>
                                <Text style={{ color: isNextDay ? '#fff' : THEME_COLORS.OTHERS.LIGHT_GRAY, ...GlobalStyles.smallText }}>{t('common:NextDay')}</Text>
                            </Pressable>
                        )}
                        {onDelete && (
                            <Pressable
                                onPress={() => {
                                    if (onDelete) {
                                        onDelete()
                                    }
                                }}
                                style={{
                                    flex: 1,
                                    backgroundColor: THEME_COLORS.OTHERS.BACKGROUND,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 20,
                                    height: 30,
                                    borderWidth: 1,
                                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                                }}>
                                <Text style={GlobalStyles.smallText}>{'削除'}</Text>
                            </Pressable>
                        )}
                        <View
                            style={{
                                marginRight: onClear ? 20 : 0,
                            }}
                        />
                    </View>
                    {isVisible && (
                        <DateTimePickerModal
                            date={initDateInput ? getDate(initDateInput) : undefined}
                            mode={dateInputMode}
                            isVisible={isVisible}
                            onConfirm={onConfirmDateTime}
                            onCancel={onHideDateTime}
                            locale="ja-JP"
                            confirmTextIOS="OK"
                            cancelTextIOS="キャンセル"
                        />
                    )}
                    {onClear && (
                        <Pressable
                            disabled={disable}
                            onPress={() => {
                                if (onClear) {
                                    onClear()
                                    setDateTime(defaultDateInput)
                                    setLocalIsNextDay(undefined)
                                }
                            }}
                            style={{
                                flex: 1,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                            <CancelSvg style={{}} width={25} height={25} fill={'#C9C9C9'} />
                        </Pressable>
                    )}
                </View>
            </InputBox>
        </View>
    )
}
