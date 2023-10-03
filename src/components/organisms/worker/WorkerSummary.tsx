import React from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { BlueColor, ColorStyle, FontStyle } from '../../../utils/Styles'
import { Icon } from '../../atoms/Icon'
import { ColumnType, TableArea } from '../../atoms/TableArea'
import { ArrangementCLType } from '../../../models/arrangement/Arrangement'
import { newDate } from '../../../utils/ext/Date.extensions'
import { compareWithAnotherDate, CustomDate, dayBaseTextWithoutDate, sumCustomDateTime, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import uniq from 'lodash/uniq'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

export type WorkerSummaryProps = {
    arrangements?: ArrangementCLType[]
    month?: number
    color?: ColorStyle
    style?: ViewStyle
}

export type SummaryUIType = {
    siteCount: number
    attendanceCount: number
    absenceCount: number

    behindTimeCount: number
    behindTime: string

    overtimeWork: string

    midnightWorkTime: string

    holidayWorkCount: number
    holidayWorkTime: string

    earlyLeaveTime: string
}

export const WorkerSummary = React.memo((props: Partial<WorkerSummaryProps>) => {
    const { t } = useTextTranslation()
    let { style, month, arrangements, color } = props
    color = color ?? BlueColor
    month = month ?? 1
    const workedArrangements = arrangements?.filter((arr) => !arr.attendance?.isAbsence && arr.attendance?.startDate && arr.attendance.endDate && arr.attendance.isApprove == true)
    const holidayWorkTime = sumCustomDateTime(
        workedArrangements
            ?.filter((arr) => arr.attendance?.isHolidayWork != undefined && arr.attendance?.isHolidayWork)
            ?.map((arr) => (arr.attendance?.startDate ? compareWithAnotherDate(arr.attendance?.startDate, arr?.attendance?.endDate) : undefined))
            .map((time) =>
                newDate({
                    hour: (time?.hours ?? 0) + (time?.days ?? 0) * 24,
                    minute: time?.minutes ?? 0,
                }).toCustomDate(),
            )
            .filter((date) => date != undefined) as CustomDate[],
    )

    const summary = {
        siteCount: workedArrangements?.length,
        attendanceCount: uniq(
            workedArrangements?.map((arr) =>
                arr.site?.meetingDate ? dayBaseTextWithoutDate(arr.site?.meetingDate) : arr.site?.siteDate ? dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(arr.site?.siteDate)) : undefined,
            ),
        ).length,
        absenceCount: arrangements?.filter((arr) => arr.attendance?.isAbsence && arr.attendance.isApprove == true).length,

        behindTimeCount: workedArrangements?.filter((arr) => arr.attendance?.behindTime != undefined && !(arr.attendance?.behindTime.hour == 0 && arr.attendance?.behindTime.minute == 0)).length,
        behindTime: sumCustomDateTime(workedArrangements?.map((arr) => arr.attendance?.behindTime).filter((date) => date != undefined) as CustomDate[]),

        overtimeWork: sumCustomDateTime(workedArrangements?.map((arr) => arr.attendance?.overtimeWork).filter((date) => date != undefined) as CustomDate[]),
        earlyLeaveTime: sumCustomDateTime(workedArrangements?.map((arr) => arr.attendance?.earlyLeaveTime).filter((date) => date != undefined) as CustomDate[]),
        midnightWorkTime: sumCustomDateTime(workedArrangements?.map((arr) => arr.attendance?.midnightWorkTime).filter((date) => date != undefined) as CustomDate[]),

        holidayWorkCount: workedArrangements?.filter((arr) => arr.attendance?.isHolidayWork != undefined && arr.attendance?.isHolidayWork).length,
        holidayWorkTime: holidayWorkTime,
    } as SummaryUIType

    const summaryList = Object.entries(summary ?? {}).map(([key, value]) => {
        let text = ''
        let suffix = ''
        switch (key) {
            case 'siteCount':
                text = t('common:NoOfOperatingSites')
                suffix = t('common:Site')
                break
            case 'attendanceCount':
                text = t('common:NoOfWorkingDays')
                suffix = t('common:Day')
                break
            case 'overtimeWork':
                text = t('common:OvertimeHours')
                break
            case 'behindTime':
                text = t('common:LatenessTime')
                break
            case 'behindTimeCount':
                text = t('common:LateArrival')
                suffix = t('common:Counts')
                break
            case 'earlyLeaveTime':
                text = t('common:EarlyDepartureTime')
                break
            case 'midnightWorkTime':
                text = t('common:LateNightOperationHours')
                break
            case 'absenceCount':
                text = t('common:NoOfAbsences')
                suffix = t('common:Count')
                break
            case 'holidayWorkCount':
                text = t('common:HolidayOperation')
                suffix = t('common:Day')
                break
            case 'holidayWorkTime':
                text = t('common:HolidayOperatingHours')
                break
        }
        return { key: text, content: `${value} ${suffix}` } as ColumnType
    })

    return (
        <View
            style={[
                {
                    backgroundColor: color.mainColor,
                    borderRadius: 10,
                    padding: 10,
                },
                style,
            ]}>
            <View
                style={{
                    justifyContent: 'center',
                    width: 130,
                }}>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        alignSelf: 'center',
                    }}>
                    <Icon name={'trophy'} fill={color.textColor} width={20} height={20} />
                    <Text
                        style={{
                            marginLeft: 5,
                            fontSize: 18,
                            fontFamily: FontStyle.black,
                            lineHeight: 30,
                            color: color.textColor,
                        }}>
                        {month}
                        {t('common:ResultsForTheMonth')}
                    </Text>
                </View>
                <View
                    style={{
                        backgroundColor: color.highLightColor,
                        height: 8,
                        marginTop: -9,
                        zIndex: -1,
                    }}></View>
            </View>
            <TableArea
                textColor={color.textColor}
                style={{
                    padding: 10,
                    backgroundColor: 'transparent',
                }}
                contentRatio={2}
                columns={summaryList}
            />
        </View>
    )
})
