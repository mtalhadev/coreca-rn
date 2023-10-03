import React, { useMemo, useState } from 'react'
import { Text, Pressable, View, ViewStyle } from 'react-native'

import { GlobalStyles } from '../../../utils/Styles'

import { THEME_COLORS } from '../../../utils/Constants'
import { Map, MapDisplayType } from '../../atoms/Map'
import { ReportType, DatePickButton, AttendanceReportEnumType } from './DatePickButton'
import { CustomDate, toCustomDateFromTotalSeconds } from "../../../models/_others/CustomDate"
import { useNavigation } from '@react-navigation/native'
import { LocationInfoType } from '../../../models/_others/LocationInfoType'
import { AttendanceType } from '../../../models/attendance/Attendance'
import LocationPermissionModal from '../../template/LocationPermissionModal'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { DateStampingButton } from './DateStampingButton'
import { AttendanceModificationType } from '../../../models/attendanceModification/AttendanceModification'



export type AttendanceReportProps = {
    type?: AttendanceReportEnumType
    attendance?: AttendanceType
    attendanceModification?: AttendanceModificationType
    initDate?: CustomDate
    onMapValueChange?: (location?: LocationInfoType) => void
    onReportTimeChange?: (report?: ReportType) => void
    onCommentChange?: (comment?: string) => void
    style?: ViewStyle
    canEditComment?: boolean
    mapType: MapDisplayType
    isAdmin?: boolean
    isFirstReport?: boolean
}

export const AttendanceReport = React.memo((props: AttendanceReportProps) => {
    const { attendance, attendanceModification, style, initDate, mapType, onReportTimeChange, onMapValueChange, onCommentChange, canEditComment, type, isAdmin,  isFirstReport} = props
    const navigation = useNavigation<any>()
    const { t } = useTextTranslation()

    const _getLocation = () => {
        if (type == 'start') {
            if (attendanceModification && attendanceModification.modificationInfo?.startLocationInfo){
                return attendanceModification.modificationInfo.startLocationInfo
            } else {
                return attendance?.startLocationInfo
            }
        } else if (type == 'end') {
            if (attendanceModification && attendanceModification.modificationInfo?.endLocationInfo){
                return attendanceModification.modificationInfo.endLocationInfo
            } else {
                return attendance?.endLocationInfo
            }
        }
    }

    const location = _getLocation()

    const startDate = useMemo(() => attendance?.startDate ? toCustomDateFromTotalSeconds(attendance?.startDate) : undefined, [attendance?.startDate])
    const endDate = useMemo(() => attendance?.endDate ? toCustomDateFromTotalSeconds(attendance?.endDate) : undefined, [attendance?.endDate])
    /**
     * 開始報告かつ欠勤ならabsence
     * それ以外は開始報告ならstartDate、終了報告ならendDate
     */
    const report = (type == 'start' && attendance?.isAbsence) ? 'absence' : (type == 'start' ? startDate : endDate)
    const comment = type == 'start' ? attendance?.startComment : attendance?.endComment

    const [ updateMapOnGranted, setUpdateMapOnGranted ] = useState<number | undefined>(undefined)
    const _updatePermission = () => {
        setUpdateMapOnGranted(1)
    }

    const startStampDate = useMemo(() => attendance?.startStampDate ? toCustomDateFromTotalSeconds(attendance?.startStampDate) : undefined, [attendance?.startStampDate])
    const endStampDate = useMemo(() => attendance?.endStampDate ? toCustomDateFromTotalSeconds(attendance?.endStampDate) : undefined, [attendance?.endStampDate])

    return (
        <View style={[{}, style]}>
            {isAdmin ? null : <LocationPermissionModal onGranted={_updatePermission} />}
            <View>
                <Text
                    style={[
                        GlobalStyles.smallGrayText,
                        {
                            // marginTop: 10,
                        },
                    ]}
                >
                    {t('common:LocationAtTheTimeOfReporting')}
                </Text>
                <Map
                    style={{
                        marginTop: 5,
                    }}
                    location={location}
                    onLocationChange={(location) => {
                        if (onMapValueChange) {
                            onMapValueChange(location)
                        }
                    }}
                    mapType={mapType}
                    forceUpdate={updateMapOnGranted}
                />
                </View>
            {( !isFirstReport || isAdmin)
                &&
                <DatePickButton
                    style={{
                        marginTop: 15,
                    }}
                    initDate={initDate}
                    isManual={type == 'start' ? attendance?.startEditWorkerId != undefined : attendance?.endEditWorkerId != undefined}
                    stampDate={type == 'start' ? startStampDate : endStampDate}
                    onDateChange={onReportTimeChange}
                    date={report}
                    type={type}
                />
            }
            {(( isFirstReport && !isAdmin)
            ) &&
                <DateStampingButton
                    style={{
                        marginTop: 15,
                    }}
                    initDate={initDate}
                    isManual={type == 'start' ? attendance?.startEditWorkerId != undefined : attendance?.endEditWorkerId != undefined}
                    stampDate={type == 'start' ? startStampDate : endStampDate}
                    onDateChange={onReportTimeChange}
                    date={report}
                    type={type}
                />
            }
            <View
                style={{
                    marginTop: 15,
                }}
            >
                <Text style={[GlobalStyles.smallGrayText, {}]}>{t('common:Comment')}</Text>

                <Pressable
                    style={{
                        backgroundColor: THEME_COLORS.OTHERS.TABLE_AREA_PURPLE,
                        padding: 10,
                        marginTop: 5,
                        borderWidth: canEditComment ? 1 : 0,
                        borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                    }}
                    onPress={() => {
                        if (canEditComment) {
                            navigation.push('WEditComment', { comment: comment, onClose: onCommentChange ? onCommentChange : undefined })
                        }
                    }}
                >
                    <Text style={{}}>{comment}</Text>
                </Pressable>
            </View>
        </View>
    )
})
