/* eslint-disable prefer-const */
import React, { useMemo } from 'react'
import { View, ViewStyle, StyleSheet, Text } from 'react-native'

import { GlobalStyles } from '../../../utils/Styles'
import { getUuidv4 } from '../../../utils/Utils'
import { WorkerList } from '../worker/WorkerList'
import { useNavigation } from '@react-navigation/native'
import { THEME_COLORS } from '../../../utils/Constants'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { InvRequestType } from '../../../models/invRequest/InvRequestType'
import { useSelector } from 'react-redux'
import { StoreType } from '../../../stores/Store'
import { RequestType } from '../../../models/request/Request'
import { SiteType } from '../../../models/site/Site'
import { SiteHeader } from '../site/SiteHeader'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { AttendanceModificationModel } from '../../../models/attendanceModification/AttendanceModification'

export type DateInvRequestAttendanceProps = {
    invRequest: InvRequestType
    site: SiteType
    hasShadow?: boolean
    attendanceModifications?: AttendanceModificationModel[]
    displayAlert?: ()=>void
    style?: ViewStyle
}

export const DateInvRequestAttendance = React.memo((props: Partial<DateInvRequestAttendanceProps>) => {
    let { invRequest, site, hasShadow, attendanceModifications, displayAlert, style } = props
    const navigation = useNavigation<any>()
    const { t } = useTextTranslation()
    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)

    const arrangementWorkerIds = invRequest?.attendances
        ?.filter((att) => att.arrangement?.siteId == site?.siteId)
        .map((att) => att.arrangement?.workerId)
        .filter((data) => data != undefined) as string[]
    const arrangementWorkerIdsSet = new Set(arrangementWorkerIds)
    const arrangementWorkers = invRequest?.workers?.items?.filter((worker) => worker.workerId && arrangementWorkerIdsSet.has(worker.workerId))

    const requests = useMemo(() => invRequest?.site?.companyRequests?.orderRequests?.items?.filter((data) => data != undefined) as RequestType[], [invRequest]) ?? []

    return (
        <ShadowBox
            onPress={() => {
                navigation.push('SiteAttendanceManage', {
                    siteId: site?.siteId,
                    invRequestId: invRequest?.invRequestId,
                })
            }}
            key={getUuidv4()}
            style={{
                ...style,
            }}
            hasShadow={hasShadow}>
            {site?.fakeCompanyInvRequestId && (
                <View
                    style={{
                        backgroundColor: THEME_COLORS.OTHERS.GRAY,
                        paddingVertical: 5,
                        paddingLeft: 10,
                        borderTopEndRadius: 10,
                        borderTopStartRadius: 10,
                        borderBottomRightRadius: 0,
                        borderBottomLeftRadius: 0,
                    }}>
                    <Text
                        style={{
                            ...GlobalStyles.smallText,
                            color: '#fff',
                        }}>
                        {invRequest?.myCompanyId == myCompanyId ? t('admin:SendYourSupport') : t('admin:BackupIsComing')}
                    </Text>
                </View>
            )}
            <SiteHeader
                style={{
                    padding: 8,
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    backgroundColor: THEME_COLORS.OTHERS.PURPLE_GRAY,
                }}
                site={site}
                titleStyle={GlobalStyles.smallGrayText as ViewStyle}
                isOnlyDateName={false}
                displayDay={false}
                displaySitePrefix
                isDateArrangement
                displayMeter={false}
                displayAlert={displayAlert}
            />
            <View
                style={{
                    marginTop: 3,
                }}>
                <WorkerList
                    onPress={(item) => {
                        const target = attendanceModifications?.filter((mod) => mod.status == 'created' || mod.status == 'edited' && mod?.modificationInfo?.workerId == item?.workerId)[0]
                        if (target != undefined) {
                            navigation.push('AttendanceDetail', {
                                arrangementId: target.modificationInfo?.arrangementId,
                                attendanceId: target.targetAttendanceId,
                                siteId: site?.siteId,
                            })
                        } else {
                            undefined
                        }
                    }}
                    workers={arrangementWorkers}
                    requests={requests}
                    style={{ marginHorizontal: 8 }}
                    markingWorkerIds={attendanceModifications?.filter((data) => data.status == 'created' || data.status == 'edited')?.map((mod) => mod?.modificationInfo?.workerId).filter((data) => data != undefined) as string[]}
                />
            </View>
        </ShadowBox>
    )
})

const styles = StyleSheet.create({})
