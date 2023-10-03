import React from 'react'
import { Pressable, View, ViewStyle, Text } from 'react-native'

import { BlueColor, ColorStyle, GlobalStyles } from '../../../utils/Styles'

import { THEME_COLORS } from '../../../utils/Constants'
import { Line } from '../../atoms/Line'
import { Worker } from './Worker'
import { Attendance } from '../attendance/Attendance'
import { AppSide } from '../site/SiteAttendance'
import { useNavigation } from '@react-navigation/native'
import { SiteAttendanceWorkerType } from '../../../models/attendance/SiteAttendanceDataType'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { toAttendanceCLType } from '../../../models/attendance/Attendance'
import { toArrangementCLType } from '../../../models/arrangement/Arrangement'

export type WorkerAttendanceProps = {
    workerAttendance?: SiteAttendanceWorkerType
    lastLoggedInAt?: number
    side?: AppSide
    /**
     * 未確定作業員用
     */
    siteId?: string
    editable?: boolean
    color?: ColorStyle
    style?: ViewStyle
    isMyCompany?: boolean
    canModifyAttendance?: boolean
    isSiteManager?: boolean
}

export const WorkerAttendance = React.memo((props: Partial<WorkerAttendanceProps>) => {
    let { style, workerAttendance, lastLoggedInAt, siteId, editable, side, color, isMyCompany, canModifyAttendance, isSiteManager } = props
    side = side ?? 'admin'
    editable = editable ?? false
    color = color ?? BlueColor
    const { t } = useTextTranslation()

    const navigation = useNavigation<any>()
    return (
        <Pressable
            onPress={
                workerAttendance?.isConfirmed == true
                    ? () => {
                          if (side == 'admin' && isMyCompany) {
                              navigation.push('WorkerDetailRouter', {
                                  workerId: workerAttendance?.worker?.workerId,
                                  title: workerAttendance?.worker?.name,
                                  arrangementId: workerAttendance?.arrangement?.arrangementId,
                              })
                          }
                      }
                    : undefined
            }
            style={[
                {
                    borderWidth: 1,
                    borderColor: THEME_COLORS.OTHERS.GRAY,
                    borderRadius: 10,
                    paddingTop: 8,
                    paddingHorizontal: 10,
                    marginTop: 10,
                    paddingBottom: 5,
                    backgroundColor: '#fff',
                },
                style,
            ]}>
            {workerAttendance?.isConfirmed != true && (
                <View style={{}}>
                    <Text style={{ ...GlobalStyles.smallText }}>{t('common:OperatorNotIdentified')}</Text>
                    <Text style={{ ...GlobalStyles.smallGrayText, marginTop: 5 }}>{`${t('common:AttendanceId')}   ${workerAttendance?.attendanceId}`}</Text>
                </View>
            )}
            {workerAttendance?.isConfirmed == true && (
                <Worker
                    iconSize={21}
                    workerNameTextSize={11}
                    worker={workerAttendance?.worker}
                    siteId={siteId}
                    isEditable={workerAttendance.worker?.company?.isFake}
                    lastLoggedInAt={lastLoggedInAt}
                    isDisplayLastLoggedIn={side == 'admin'}
                    isAttendance
                />
            )}
            {/* <Line
                style={{
                    marginTop: 8,
                }}
            /> */}
            <Attendance
                side={side}
                color={color}
                canEdit={editable}
                canModifyAttendance={canModifyAttendance}
                siteId={siteId ?? workerAttendance?.arrangement?.siteId}
                arrangement={toArrangementCLType(workerAttendance?.arrangement)}
                /**
                 * attendanceIdを追加しないと、attendanceがない場合にIDがないことになる。
                 */
                attendance={{ ...toAttendanceCLType(workerAttendance?.attendance), attendanceId: workerAttendance?.attendanceId }}
                style={
                    {
                        // marginTop: 8,
                    }
                }
                isSiteManager={isSiteManager}
            />
        </Pressable>
    )
})
