import React from 'react'
import { Text, View, SectionList, SafeAreaView } from 'react-native'

import { THEME_COLORS } from '../../utils/Constants'
import { useTextTranslation } from '../../fooks/useTextTranslation'
import { RequestType } from '../../models/request/Request'
import { InvRequestType } from '../../models/invRequest/InvRequestType'
import { TableArea } from '../atoms/TableArea'
import { AppButton } from '../atoms/AppButton'
import { getAttendanceModificationDetail } from '../../usecases/attendance/WorkerAttendanceModificationCase'
import { ArrangementType } from '../../models/arrangement/Arrangement'
import { toAttendanceCLType } from '../../models/attendance/Attendance'

/**
 * attendanceModificationArrangement - あらかじめ勤怠修正依頼のある手配のみに絞り込んでおく
 */
export type TodoListProps = {
    toDoRequests?: RequestType[]
    toDoInvRequests?: InvRequestType[]
    attendanceModificationArrangement?: ArrangementType[]
    _approveRequest?: (params: RequestType, isApprove: boolean) => void
    _approveInvRequest?: (params: InvRequestType, isApprove: boolean) => void
    _approveTargetAttendanceModification?: (attendanceModificationId?: string, targetAttendanceId?: string, isApprove?: boolean) => void
}

type toDoType = {
    type: string
} & (RequestType | InvRequestType | ArrangementType)

export const TodoList = React.memo((props: Partial<TodoListProps>) => {
    const { t } = useTextTranslation()
    const { toDoRequests, toDoInvRequests, attendanceModificationArrangement, _approveRequest, _approveInvRequest, _approveTargetAttendanceModification } = props

    const data = [
        {
            title: 'toDoRequests',
            data:
                (toDoRequests?.map((data) => {
                    return { ...data, type: 'request' }
                }) as toDoType[]) ?? [],
        },
        {
            title: 'toDoInvRequests',
            data:
                (toDoInvRequests?.map((data) => {
                    return { ...data, type: 'invRequest' }
                }) as toDoType[]) ?? [],
        },
        {
            title: 'attendanceModificationArrangement',
            data:
                (attendanceModificationArrangement?.map((data) => {
                    return { ...data, type: 'attendanceModificationArrangement' }
                }) as toDoType[]) ?? [],
        },
    ]

    return (
        <SafeAreaView style={{}}>
            <SectionList
                sections={data}
                keyExtractor={(item, index) => index.toString()}
                renderItem={(item) => {
                    if (item.item.type == 'request') {
                        const request: RequestType = item.item
                        return (
                            <View style={{ marginTop: 10 }}>
                                <Text
                                    style={{
                                        backgroundColor: THEME_COLORS.OTHERS.GRAY,
                                        paddingVertical: 5,
                                        paddingLeft: 10,
                                        borderTopEndRadius: 10,
                                        borderTopStartRadius: 10,
                                        borderBottomRightRadius: 0,
                                        borderBottomLeftRadius: 0,
                                        color: '#fff',
                                    }}>
                                    {t('admin:SupportRequest')}
                                </Text>
                                <TableArea
                                    style={{}}
                                    columns={[
                                        { key: '現場名', content: request.site?.siteNameData?.name },
                                        { key: '現場住所', content: request.site?.address },
                                        { key: '会社名', content: request.company?.name },
                                        { key: '人数', content: request.requestCount?.toString() },
                                    ]}
                                />
                                <View
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        backgroundColor: THEME_COLORS.OTHERS.TABLE_AREA_PURPLE,
                                        paddingBottom: 10,
                                        paddingHorizontal: 10,
                                    }}>
                                    <AppButton
                                        title={t('admin:Approve')}
                                        onPress={() => {
                                            if (_approveRequest) {
                                                _approveRequest(request, true)
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                        }}
                                        hasShadow
                                        height={30}
                                    />
                                    <AppButton
                                        title={t('admin:NotApprove')}
                                        onPress={() => {
                                            if (_approveRequest) {
                                                _approveRequest(request, false)
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            marginLeft: 10,
                                        }}
                                        hasShadow
                                        isGray
                                        height={30}
                                    />
                                </View>
                            </View>
                        )
                    } else if (item.item.type == 'invRequest') {
                        const invRequest: InvRequestType = item.item
                        return (
                            <View style={{ marginTop: 10 }}>
                                <Text
                                    style={{
                                        backgroundColor: THEME_COLORS.OTHERS.GRAY,
                                        paddingVertical: 5,
                                        paddingLeft: 10,
                                        borderTopEndRadius: 10,
                                        borderTopStartRadius: 10,
                                        borderBottomRightRadius: 0,
                                        borderBottomLeftRadius: 0,
                                        color: '#fff',
                                    }}>
                                    {t('admin:BackupIsComing')}
                                </Text>
                                <TableArea
                                    style={{}}
                                    columns={[
                                        { key: '会社名', content: invRequest?.myCompany?.name },
                                        { key: '常用人数', content: invRequest?.workerCount?.toString() },
                                    ]}
                                />
                                <View
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        backgroundColor: THEME_COLORS.OTHERS.TABLE_AREA_PURPLE,
                                        paddingBottom: 10,
                                        paddingHorizontal: 10,
                                    }}>
                                    <AppButton
                                        title={t('admin:Approve')}
                                        onPress={() => {
                                            if (_approveInvRequest) {
                                                _approveInvRequest(invRequest, true)
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                        }}
                                        hasShadow
                                        height={30}
                                    />
                                    <AppButton
                                        title={t('admin:NotApprove')}
                                        onPress={() => {
                                            if (_approveInvRequest) {
                                                _approveInvRequest(invRequest, false)
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            marginLeft: 10,
                                        }}
                                        hasShadow
                                        isGray
                                        height={30}
                                    />
                                </View>
                            </View>
                        )
                    } else if (item.item.type == 'attendanceModificationArrangement') {
                        const arrangement: ArrangementType = item.item
                        return (
                            <View style={{ marginTop: 10 }}>
                                <Text
                                    style={{
                                        backgroundColor: THEME_COLORS.OTHERS.GRAY,
                                        paddingVertical: 5,
                                        paddingLeft: 10,
                                        borderTopEndRadius: 10,
                                        borderTopStartRadius: 10,
                                        borderBottomRightRadius: 0,
                                        borderBottomLeftRadius: 0,
                                        color: '#fff',
                                    }}>
                                    {t('common:AttendanceModificationRequest')}
                                </Text>
                                <TableArea
                                    style={{}}
                                    columns={[
                                        { key: '現場名', content: arrangement?.site?.siteNameData?.name },
                                        { key: '作業員名', content: arrangement?.worker?.nickname ?? arrangement?.worker?.name },
                                        ...getAttendanceModificationDetail(toAttendanceCLType(arrangement?.attendanceModification?.originInfo), arrangement?.attendanceModification, t),
                                    ]}
                                />
                                <View
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        backgroundColor: THEME_COLORS.OTHERS.TABLE_AREA_PURPLE,
                                        paddingBottom: 10,
                                        paddingHorizontal: 10,
                                    }}>
                                    <AppButton
                                        title={t('admin:Approve')}
                                        onPress={() => {
                                            if (_approveTargetAttendanceModification) {
                                                _approveTargetAttendanceModification(
                                                    arrangement?.attendanceModification?.attendanceModificationId,
                                                    arrangement?.attendanceModification?.targetAttendanceId,
                                                    true,
                                                )
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                        }}
                                        hasShadow
                                        height={30}
                                    />
                                    <AppButton
                                        title={t('admin:NotApprove')}
                                        onPress={() => {
                                            if (_approveTargetAttendanceModification) {
                                                _approveTargetAttendanceModification(
                                                    arrangement?.attendanceModification?.attendanceModificationId,
                                                    arrangement?.attendanceModification?.targetAttendanceId,
                                                    false,
                                                )
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            marginLeft: 10,
                                        }}
                                        hasShadow
                                        isGray
                                        height={30}
                                    />
                                </View>
                            </View>
                        )
                    } else {
                        return <></>
                    }
                }}
                //   renderSectionHeader={({section: {title}}) => (
                //     <Text style={{

                //     }}>{title}</Text>
                //   )}
            />
        </SafeAreaView>
    )
})
