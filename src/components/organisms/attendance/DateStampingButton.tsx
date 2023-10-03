/* eslint-disable prefer-const */
import React, { useState, useEffect } from 'react'
import { Text, Pressable, View, ViewStyle, StyleSheet, Alert } from 'react-native'

import { FontStyle, GlobalStyles } from '../../../utils/Styles'
import isEqual from 'lodash/isEqual'
import { THEME_COLORS } from '../../../utils/Constants'
import { AppButton } from '../../atoms/AppButton'
import { CustomDate, dayBaseText, timeBaseText, timeText } from '../../../models/_others/CustomDate'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { useDispatch } from 'react-redux'
import { setToastMessage, ToastMessage } from '../../../stores/UtilSlice'

export type AttendanceReportEnumType = 'start' | 'end'
export type DateStampingButtonProps = {
    type: AttendanceReportEnumType
    date?: ReportType
    isManual?: boolean
    stampDate?: CustomDate
    color?: string
    initDate?: CustomDate
    onPress?: () => void
    onDateChange?: (report: ReportType) => void
    style?: ViewStyle
}

export type ReportType = CustomDate | undefined | 'absence'

export const DateStampingButton = React.memo((props: Partial<DateStampingButtonProps>) => {
    let { type, date, color, isManual, style, stampDate, onDateChange } = props
    type = type ?? 'start'
    color = color ?? THEME_COLORS.GREEN.DEEP
    const { t } = useTextTranslation()

    const [isVisible, setVisible] = useState(false)
    const [dateNow, setDateNow] = useState<ReportType>(date)
    const [isChangeable, setIsChangeable] = useState(true)

    useEffect(() => {
        if(date==undefined || date=='absence'){
            setIsChangeable(true)
        }
        if (isVisible) {
            return
        }
        if (!isEqual(date, dateNow)) {
            setDateNow(date)
        }
    }, [date])

    useEffect(() => {
        if (onDateChange) {
            onDateChange(dateNow)
        }
    }, [dateNow])

    const dispatch = useDispatch()

    const _timeStamping = () => {
        setVisible(!isVisible)

        if (isChangeable){
            setDateNow((new Date()).toCustomDate())
            setIsChangeable(false)
        } else {
            dispatch(
                setToastMessage({
                    text: t('worker:AlreadyStamped'),
                    type: 'error',
                } as ToastMessage)
            )
        }
    }

    return (
        <View
            style={{
                ...style,
            }}>
            <Pressable
                onPress={() => {
                    if (date == undefined) {
                        Alert.alert(`${t('worker:AttandanceReportComfirmation')}`, '', [
                            { text: `${t('worker:Report')}`, onPress: () => _timeStamping() },
                            {
                                text: `${t('worker:cancel')}`,
                                style: 'cancel',
                            },
                        ])
                    } else {
                        _timeStamping()
                    }
                }}
                style={[
                    {
                        padding: 15,

                        borderRadius: 1000,
                        borderWidth: 2,
                        borderColor: color,
                        backgroundColor: THEME_COLORS.OTHERS.PURPLE_GRAY,
                        justifyContent: 'center',
                        flexDirection: 'row',
                        alignItems: 'center',
                    },
                ]}>
                <View
                    style={{
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                    <View
                        style={{
                            justifyContent: 'center',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                        <Text
                            style={{
                                fontFamily: FontStyle.regular,
                                fontSize: 14,
                                lineHeight: 16,
                                // marginLeft: 15
                            }}>
                            {type == 'start' ? t('common:AssignmentStart') : t('common:EndOfWork')}
                        </Text>
                        {dateNow != undefined && dateNow != 'absence' && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginLeft: 20,
                                }}>
                                <Text
                                    style={{
                                        color: color,
                                        fontFamily: FontStyle.bold,
                                        fontSize: 14,
                                        lineHeight: 16,
                                    }}>
                                    {dayBaseText(dateNow)}
                                </Text>
                                <Text
                                    style={{
                                        marginLeft: 10,
                                        color: color,
                                        fontFamily: FontStyle.bold,
                                        fontSize: 24,
                                        lineHeight: 26,
                                    }}>
                                    {timeText(dateNow)}
                                </Text>
                            </View>
                        )}
                        {dateNow == undefined && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginLeft: 20,
                                }}>
                                <Text
                                    style={{
                                        color: color,
                                        fontFamily: FontStyle.bold,
                                        fontSize: 14,
                                        lineHeight: 16,
                                    }}>
                                    未入力
                                </Text>
                            </View>
                        )}
                        {dateNow == 'absence' && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginLeft: 20,
                                }}>
                                <Text
                                    style={{
                                        color: THEME_COLORS.OTHERS.ALERT_RED,
                                        fontFamily: FontStyle.bold,
                                        fontSize: 14,
                                        lineHeight: 16,
                                    }}>
                                    {t('common:Absence')}
                                </Text>
                            </View>
                        )}
                        {
                            isManual == true && <Text style={{
                                ...GlobalStyles.smallText,
                            }}>
                                （{t('common:Manual')}）
                            </Text>
                        }
                    </View>
                    {(stampDate != undefined) && (
                        <View
                            style={{
                                marginTop: 2,
                                flexDirection: 'row',
                                alignItems: 'center',
                                alignSelf: 'center'
                            }}>
                            <Text
                                style={{
                                    ...GlobalStyles.smallGrayText,
                                    marginRight: 10,
                                    fontSize: 11
                                }}>
                                {t('common:StampDate')}
                            </Text>
                            <Text
                                style={{
                                    ...GlobalStyles.smallGrayText,
                                    fontSize: 11
                                }}>
                                {timeBaseText(stampDate)}
                            </Text>
                        </View>
                    )}
                </View>
            </Pressable>
            <View
                style={{
                    flexDirection: 'row',
                    marginTop: 10,
                }}>
                {type == 'start' && (
                    <AppButton
                        style={{
                            flex: 1,
                        }}
                        onPress={() => {
                            setDateNow('absence')
                        }}
                        height={30}
                        fontSize={12}
                        isGray={true}
                        title={t('common:TakeADayOffWork')}
                    />
                )}
                {type == 'start' && (
                    <View
                        style={{
                            width: 10,
                        }}></View>
                )}
                <AppButton
                    style={{
                        flex: 1,
                    }}
                    onPress={() => {
                        setDateNow(undefined)
                    }}
                    height={30}
                    fontSize={12}
                    isGray={true}
                    title={t('common:NotYetEntered')}
                />
            </View>
        </View>
    )
})

const styles = StyleSheet.create({})
