/* eslint-disable prefer-const */
import React, { useState, useEffect } from 'react'
import { Text, Pressable, View, ViewStyle, StyleSheet } from 'react-native'

import { FontStyle, GlobalStyles } from '../../../utils/Styles'
import { THEME_COLORS } from '../../../utils/Constants'
import { AppButton } from '../../atoms/AppButton'
import { CustomDate, dayBaseText, timeBaseText, timeText, truncateSeconds } from '../../../models/_others/CustomDate'
import { DateTimeModal } from '../../atoms/DateTimeModal'
import { AttendanceCLType, AttendanceType } from '../../../models/attendance/Attendance'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { SiteCLType, SiteType } from '../../../models/site/Site'
// import DatePicker from 'react-native-date-picker'
export type AttendanceReportEnumType = 'start' | 'end'
export type DatePickButtonProps = {
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

/**
 * reportTypeを勤怠で使いやすい形に変更する。
 * @param report
 * @param type
 * @returns
 */
export const reportTypeToPartialAttendanceCLType = (report: ReportType, type: AttendanceReportEnumType, site?: SiteCLType, attendance?: AttendanceCLType): AttendanceCLType => {
    let result = {}
    if (report == 'absence') {
        result = {
            startDate: undefined,
            endDate: undefined,
            behindTime: undefined,
            earlyLeaveTime: undefined,
            isAbsence: true,
        }
    }

    if (type == 'start' && report != 'absence') {
        if (report == undefined) {
            result = {
                /**
                 * isAbsenceをfalseにしないと反映されない。
                 */
                startDate: undefined,
                behindTime: undefined,
                isAbsence: false,
            }
        } else {
            let behindTime = attendance?.behindTime
            if (site && site?.startDate && report.totalSeconds > site?.startDate?.totalSeconds) {
                /**
                 * 秒数が残っていると1分の誤差が出る場合があるので、秒数を切り捨ててから計算する。
                 */
                const totalSeconds = (truncateSeconds(report?.totalSeconds) - truncateSeconds(site?.startDate?.totalSeconds)) / 1000
                behindTime = new Date(0, 1, 0, 0, 0, totalSeconds).toCustomDate()
            }

            result = {
                isAbsence: false,
                startDate: report,
                behindTime: behindTime ? behindTime : undefined,
            }
        }
    }

    if (type == 'end' && report != 'absence') {
        if (report == undefined) {
            result = {
                endDate: undefined,
                isAbsence: false,
            }
        } else {
            let earlyLeaveTime = attendance?.earlyLeaveTime
            if (site && site?.endDate && report.totalSeconds < site?.endDate?.totalSeconds) {
                /**
                 * 秒数が残っていると1分の誤差が出る場合があるので、秒数を切り捨ててから計算する。
                 */
                const totalSeconds = (truncateSeconds(site?.endDate?.totalSeconds) - truncateSeconds(report?.totalSeconds)) / 1000
                earlyLeaveTime = new Date(0, 1, 0, 0, 0, totalSeconds).toCustomDate()
            }

            result = {
                isAbsence: false,
                endDate: report,
                earlyLeaveTime: earlyLeaveTime ? earlyLeaveTime : undefined,
            }
        }
    }
    return result
}

export const DatePickButton = React.memo((props: Partial<DatePickButtonProps>) => {
    let { type, date, color, isManual, initDate, style, stampDate, onDateChange } = props

    type = type ?? 'start'
    color = color ?? THEME_COLORS.GREEN.DEEP
    const { t } = useTextTranslation()

    const [isVisible, setVisible] = useState(false)
    const [dateNow, setDateNow] = useState<ReportType>(initDate)

    useEffect(() => {
        if (initDate) {
            setDateNow(initDate)
        }
    }, [initDate])

    useEffect(() => {
        if (onDateChange) {
            onDateChange(dateNow)
        }
    }, [dateNow])

    return (
        <View
            style={{
                ...style,
            }}>
            <Pressable
                onPress={() => {
                    setVisible(!isVisible)
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
                <DateTimeModal
                    mode={'datetime'}
                    isVisible={isVisible}
                    initDate={initDate}
                    onConfirmFunc={(fieldName, newDate) => {
                        setDateNow(newDate)
                        setVisible(false)
                    }}
                    onHideFunc={() => {
                        setVisible(false)
                    }}
                />
                <View
                    style={{
                        flexDirection: 'column',
                        alignItems: 'center',
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
                        {isManual == true && (
                            <Text
                                style={{
                                    ...GlobalStyles.smallText,
                                }}>
                                （{t('common:Manual')}）
                            </Text>
                        )}
                    </View>
                    {stampDate != undefined && (
                        <View
                            style={{
                                marginTop: 2,
                                flexDirection: 'row',
                                alignItems: 'center',
                                alignSelf: 'center',
                            }}>
                            <Text
                                style={{
                                    ...GlobalStyles.smallGrayText,
                                    marginRight: 10,
                                    fontSize: 11,
                                }}>
                                {t('common:StampDate')}
                            </Text>
                            <Text
                                style={{
                                    ...GlobalStyles.smallGrayText,
                                    fontSize: 11,
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
