import React from 'react'
import { Pressable, View, ViewStyle, Text } from 'react-native'

import { BlueColor, ColorStyle, FontStyle, GlobalStyles } from '../../../utils/Styles'

import { THEME_COLORS } from '../../../utils/Constants'
import { Attendance } from '../attendance/Attendance'
import { AppSide } from '../site/SiteAttendance'
import { useNavigation } from '@react-navigation/native'
import { SiteAttendanceWorkerType } from '../../../models/attendance/SiteAttendanceDataType'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { Checkbox } from '../../atoms/Checkbox'
import { ImageIcon } from '../ImageIcon'
import { ResponsibleTag } from './ResponsibleTag'
import { SelectedAttendanceType } from '../../../screens/adminSide/attendance/AllSiteAttendancesManage'
import { timeBaseTextWithoutYear, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { ID } from '../../../models/_others/ID'
import { toArrangementCLType } from '../../../models/arrangement/Arrangement'
import { toAttendanceCLType } from '../../../models/attendance/Attendance'

export type WorkerAttendanceSummaryProps = {
    workerAttendance?: SiteAttendanceWorkerType
    side?: AppSide
    /**
     * 未確定作業員用
     */
    siteId?: ID
    editable?: boolean
    color?: ColorStyle
    style?: ViewStyle
    isMyCompany?: boolean
    selectedAttendances?: SelectedAttendanceType[]
    selectAttendance?: (attendanceId: ID, siteId: ID) => void
    deselectAttendance?: (attendanceId: ID, siteId: ID) => void
}

export const WorkerAttendanceSummary = React.memo((props: Partial<WorkerAttendanceSummaryProps>) => {
    let { style, workerAttendance, siteId, editable, side, color, isMyCompany, selectedAttendances, selectAttendance, deselectAttendance } = props
    side = side ?? 'admin'
    editable = editable ?? false
    color = color ?? BlueColor
    const { t } = useTextTranslation()

    const navigation = useNavigation<any>()

    const isChecked = selectedAttendances && selectedAttendances.some((attendance) => attendance?.attendanceId == workerAttendance?.attendanceId)

    return (
        <Pressable
            // onPress={
            //     workerAttendance?.isConfirmed == true
            //         ? () => {
            //               if (side == 'admin' && isMyCompany) {
            //                   navigation.push('WorkerDetailRouter', {
            //                       workerId: workerAttendance?.worker?.workerId,
            //                       title: workerAttendance?.worker?.name,
            //                       arrangementId: workerAttendance?.arrangement?.arrangementId,
            //                   })
            //               }
            //           }
            //         : undefined
            // }
            style={[
                {
                    borderWidth: 1,
                    borderColor: THEME_COLORS.OTHERS.GRAY,
                    borderRadius: 10,
                    padding: 5,
                    marginTop: 5,
                    backgroundColor: '#fff',
                },
                style,
            ]}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                <Checkbox
                    size={20}
                    color={THEME_COLORS.BLUE.MIDDLE}
                    textColor={THEME_COLORS.GREEN.DEEP}
                    style={{ marginLeft: 5 }}
                    checked={isChecked}
                    onChange={() => {
                        const attendanceId = workerAttendance?.attendanceId as ID
                        if (isChecked) {
                            if (deselectAttendance) {
                                deselectAttendance(attendanceId, siteId as ID)
                            }
                        } else {
                            if (selectAttendance) {
                                selectAttendance(attendanceId, siteId as ID)
                            }
                        }
                    }}
                />
                <View
                    style={{
                        flexDirection: 'column',
                        flex: 1,
                    }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 1,
                        }}>
                        {workerAttendance?.isConfirmed != true && (
                            <View style={{}}>
                                <Text style={{ ...GlobalStyles.smallText }}>{t('common:OperatorNotIdentified')}</Text>
                                <Text style={{ ...GlobalStyles.smallGrayText, marginTop: 5 }}>{`${t('common:AttendanceId')}   ${workerAttendance?.attendanceId}`}</Text>
                            </View>
                        )}
                        {workerAttendance?.isConfirmed == true && (
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                }}>
                                <ImageIcon imageColorHue={workerAttendance?.worker?.imageColorHue} imageUri={workerAttendance?.worker?.imageUrl} type={'worker'} size={20} />
                                {workerAttendance?.worker?.workerTags?.includes('is-site-manager') && <ResponsibleTag />}
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flex: 1,
                                    }}>
                                    <Text
                                        numberOfLines={2}
                                        ellipsizeMode={'middle'}
                                        style={{
                                            marginLeft: 5,
                                            fontFamily: FontStyle.regular,
                                            fontSize: 11,
                                            lineHeight: 14,
                                        }}>
                                        {workerAttendance?.worker?.nickname?.replace(/　/g, ' ') ?? workerAttendance?.worker?.name?.replace(/　/g, ' ') ?? '-'}
                                    </Text>
                                    {workerAttendance?.worker?.lastLoggedInAt && (
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode={'middle'}
                                            style={{
                                                marginRight: 5,
                                                ...GlobalStyles.smallGrayText,
                                                fontSize: 9,
                                            }}>
                                            {t('common:LastLoggedIn') + ' ' + timeBaseTextWithoutYear(toCustomDateFromTotalSeconds(workerAttendance?.worker?.lastLoggedInAt))}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}
                    </View>

                    <Attendance
                        side={side}
                        color={color}
                        canEdit={editable}
                        siteId={siteId ?? workerAttendance?.arrangement?.siteId}
                        arrangement={toArrangementCLType(workerAttendance?.arrangement)}
                        /**
                         * attendanceIdを追加しないと、attendanceがない場合にIDがないことになる。
                         */
                        attendance={{ ...toAttendanceCLType(workerAttendance?.attendance), attendanceId: workerAttendance?.attendanceId }}
                        isConcise={true}
                    />
                </View>
            </View>
        </Pressable>
    )
})
