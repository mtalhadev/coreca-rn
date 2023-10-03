/* eslint-disable no-irregular-whitespace */
import React from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { BlueColor, ColorStyle, GlobalStyles, FontStyle } from '../../../utils/Styles'

import { THEME_COLORS } from '../../../utils/Constants'
import { AttendanceReportEnumType, ReportType } from './DatePickButton'
import { CustomDate, dayAndMonthText, dayBaseTextWithoutDate, timeText } from '../../../models/_others/CustomDate'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { ArrangementCLType } from '../../../models/arrangement/Arrangement'

export type AttendanceElementProps = {
    type?: AttendanceReportEnumType
    isManual?: boolean
    report?: ReportType
    stampDate?: CustomDate
    isReportDate?: boolean
    isStampDate?: boolean
    canEdit?: boolean
    onPress?: () => void
    color?: ColorStyle
    timeColor?: string
    style?: ViewStyle
    arrangement?: ArrangementCLType
    dayDiff?: number
}

export const AttendanceElement = React.memo((props: Partial<AttendanceElementProps>) => {
    const { t } = useTextTranslation()
    let { type, onPress, isManual, report, canEdit, color, timeColor, style, stampDate, arrangement, isReportDate, isStampDate, dayDiff } = props
    color = color ?? BlueColor
    type = type ?? 'start'
    canEdit = canEdit == undefined ? true : canEdit
    // const suffix = type == 'start' ? t('common:AssignmentStart') : t('common:EndOfWork')

    const getReportStatus = () => {
        let reportStatus
        let isUnreported = false
        // if (
        //     type == 'start' &&
        //     !isEmpty(arrangement?.attendanceModification) &&
        //     arrangement?.attendanceModification.modificationInfo.startDate &&
        //     arrangement?.attendanceModification.modificationInfo.startDate.totalSeconds &&
        //     arrangement?.attendanceModification?.modificationInfo.startDate?.totalSeconds > 0 &&
        //     arrangement?.attendanceModification?.status != 'approved'
        // ) {
        //     // reportStatus = t('common:ReportedNotBeApproved')
        // } else if (
        //     type == 'end' &&
        //     !isEmpty(arrangement?.attendanceModification) &&
        //     arrangement?.attendanceModification.modificationInfo.endDate &&
        //     arrangement?.attendanceModification.modificationInfo.endDate.totalSeconds &&
        //     arrangement?.attendanceModification?.modificationInfo.endDate?.totalSeconds > 0 &&
        //     arrangement?.attendanceModification?.status != 'approved'
        // ) {
        //     // reportStatus = t('common:ReportedNotBeApproved')
        // } else if (!isEmpty(arrangement?.attendanceModification) && arrangement?.attendanceModification.modificationInfo.isAbsence && arrangement?.attendanceModification?.status != 'approved') {
        // reportStatus = t('common:ReportedNotBeApproved')
        // } else if (report == undefined) {
        if (report == undefined) {
            reportStatus = t('common:Unreported')
            isUnreported = true
        }
        return { reportStatus, isUnreported }
    }

    const getStampDate = (stampDate: CustomDate, dayDiff?: number) => {
        if (stampDate == undefined || dayDiff < 0) return ''
        if (dayDiff == undefined || dayDiff == 3) {
            return `${dayBaseTextWithoutDate(stampDate)} ${timeText(stampDate)}`
        } else if (dayDiff == 2) {
            return `${dayAndMonthText(stampDate)} ${timeText(stampDate)}`
        } else if (dayDiff == 1) {
            return `${t('common:NextDayShort')}${timeText(stampDate)}`
        }
        return `${timeText(stampDate)}`
    }

    return (
        <View style={[{}, style]}>
            <View
                style={{
                    flexDirection: 'column',
                }}>
                {isReportDate && (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                        {/* <Text
                            style={{
                                ...GlobalStyles.smallText,
                            }}>
                            {report == 'absence' ? undefined : suffix}
                        </Text> */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                            {report == 'absence' && (
                                <Text
                                    style={{
                                        ...GlobalStyles.smallText,
                                        fontSize: 12,
                                        lineHeight: 14,
                                        color: THEME_COLORS.OTHERS.ALERT_RED,
                                    }}>
                                    {t('common:Absence')}
                                </Text>
                            )}
                            {report != 'absence' && report != undefined && (
                                <Text
                                    style={{
                                        ...GlobalStyles.smallText,
                                        fontSize: 12,
                                        lineHeight: 14,
                                        color: timeColor ? timeColor : undefined,
                                    }}>
                                    {timeText(report)}
                                </Text>
                            )}
                            {/* {isManual == true && (
                            <Text
                                style={{
                                    ...GlobalStyles.smallText,
                                }}>
                                （{t('common:Manual')}）
                            </Text>
                        )} */}
                            <Text
                                style={{
                                    ...GlobalStyles.smallText,
                                    fontFamily: FontStyle.medium,
                                    fontSize: 11,
                                    lineHeight: 13,
                                    color: getReportStatus()?.isUnreported ? THEME_COLORS.OTHERS.ALERT_RED : undefined,
                                }}>
                                {getReportStatus()?.reportStatus}
                            </Text>
                        </View>
                    </View>
                )}

                {isStampDate && stampDate != undefined && (
                    <View
                        style={{
                            flexDirection: 'row',
                        }}>
                        <Text
                            style={{
                                ...GlobalStyles.smallGrayText,
                                color: THEME_COLORS.OTHERS.LIGHT_GRAY,
                                fontSize: 9,
                                lineHeight: 11,
                            }}>
                            {getStampDate(stampDate, dayDiff)}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    )
})
