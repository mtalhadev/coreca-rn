/* eslint-disable prefer-const */
import React, { useCallback, useMemo } from 'react'
import { View, ViewStyle, StyleSheet, FlatList, Alert } from 'react-native'

import { FontStyle } from '../../../utils/Styles'
import { getUuidv4 } from '../../../utils/Utils'
import { WorkerList } from '../worker/WorkerList'
import { SiteType } from '../../../models/site/Site'
import { useNavigation } from '@react-navigation/native'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { THEME_COLORS, WINDOW_WIDTH } from '../../../utils/Constants'
import { SiteHeader } from '../site/SiteHeader'
import { WorkerType } from '../../../models/worker/Worker'
import { Request } from '../request/Request'
import { ShadowBoxWithHeader } from '../shadowBox/ShadowBoxWithHeader'
import { RequestType } from '../../../models/request/Request'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { AttendanceModificationModel } from '../../../models/attendanceModification/AttendanceModification'
import { t } from 'i18next'
import { useSelector } from 'react-redux'
import { StoreType } from '../../../stores/Store'
import { checkMyDepartment } from '../../../usecases/department/DepartmentCase'
import { ArrangementType } from '../../../models/arrangement/Arrangement'

export type DateAttendanceProps = {
    site: SiteType
    style?: ViewStyle
}

export const DateAttendance = React.memo((props: Partial<DateAttendanceProps>) => {
    let { site, style } = props
    const navigation = useNavigation<any>()
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])

    const attendanceModifications = useMemo(() => site?.allArrangements?.items?.map((arr) => arr.attendanceModification).filter((data) => data != undefined) as AttendanceModificationModel[], [site])

    const workerList = useMemo(() => site?.siteMeter?.presentArrangements?.items?.map((arr) => arr.worker).filter((data) => data != undefined) as WorkerType[], [site])
    const requestList = useMemo(() => site?.siteMeter?.presentRequests?.items, [site])

    const listKey = useMemo(() => getUuidv4(), [])

    const canEdit = useMemo(
        () => (site?.siteRelation == 'manager' ? checkMyDepartment({ targetDepartmentIds: site?.construction?.contract?.receiveDepartmentIds, activeDepartmentIds }) : false),
        [activeDepartmentIds],
    )

    const displayAlert = useCallback(() => {
        Alert.alert(
            `${site?.siteNameData?.name}`,
            '',
            canEdit
                ? [
                      {
                          text: `${t('worker:cancel')}`,
                          style: 'cancel',
                      },
                      {
                          text: `${t('admin:Details')}`,
                          onPress: () => {
                              navigation.push('SiteDetail', {
                                  siteId: site?.siteId,
                                  title: site?.siteNameData?.name,
                                  siteNumber: site?.siteNameData?.siteNumber,
                              })
                          },
                      },
                      {
                          text: `${t('worker:edit')}`,
                          onPress: () => {
                              navigation.push('EditSite', {
                                  siteId: site?.siteId,
                                  constructionId: site?.constructionId,
                                  mode: 'edit',
                                  isInstruction: site?.siteRelation == 'order-children',
                                  projectId: site?.construction?.contract?.projectId,
                              })
                          },
                      },
                  ]
                : [
                      {
                          text: `${t('worker:cancel')}`,
                          style: 'cancel',
                      },
                      {
                          text: `${t('admin:Details')}`,
                          onPress: () => {
                              navigation.push('SiteDetail', {
                                  siteId: site?.siteId,
                                  title: site?.siteNameData?.name,
                                  siteNumber: site?.siteNameData?.siteNumber,
                                  requestId: site?.companyRequests?.receiveRequests?.items?.[0]?.requestId,
                              })
                          },
                      },
                  ],
        )
    }, [site])

    /**
     * 遅刻・欠席など定時以外かどうか。
     */
    const _isNotOnTime = (item: ArrangementType) => {
        return (
            item?.attendance?.isAbsence == true ||
            item?.attendance?.behindTime != undefined ||
            item?.attendance?.earlyLeaveTime != undefined ||
            item?.attendance?.overtimeWork != undefined ||
            item?.attendance?.midnightWorkTime != undefined
        )
    }

    return (
        <ShadowBox
            onPress={() => {
                navigation.push('SiteAttendanceManage', {
                    title: site?.siteNameData?.name,
                    siteId: site?.siteId,
                    siteNumber: site?.siteNameData?.siteNumber,
                    requestId: site?.companyRequests?.receiveRequests?.items && site?.companyRequests?.receiveRequests?.items[0]?.requestId,
                })
            }}
            key={getUuidv4()}
            style={{
                paddingBottom: 5,
                ...style,
            }}>
            <SiteHeader
                site={site}
                displayDay
                style={{
                    backgroundColor: THEME_COLORS.OTHERS.PURPLE_GRAY,
                    padding: 8,
                    borderTopEndRadius: 10,
                    borderTopStartRadius: 10,
                }}
                displayMeter={false}
                titleStyle={
                    {
                        lineHeight: 14,
                        fontSize: 12,
                        fontFamily: FontStyle.regular,
                    } as ViewStyle
                }
                siteNameWidth={WINDOW_WIDTH - 40}
                displayAlert={displayAlert}
            />
            {(site?.siteRelation == 'manager' || site?.siteRelation == 'fake-company-manager') && (
                <>
                    <View
                        style={{
                            marginTop: 3,
                        }}>
                        <WorkerList
                            onPress={(item) => {
                                const target = attendanceModifications?.filter((mod) => mod.status == 'created' || (mod.status == 'edited' && mod?.modificationInfo?.workerId == item?.workerId))[0]
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
                            markingWorkerIds={[
                                ...((attendanceModifications
                                    ?.filter((data) => data.status == 'created' || data.status == 'edited')
                                    .map((mod) => mod?.modificationInfo?.workerId)
                                    .filter((data) => data != undefined) as string[]) ?? []),
                                ...((site?.siteMeter?.presentArrangements?.items
                                    ?.filter(_isNotOnTime)
                                    .map((arr) => arr?.workerId)
                                    .filter((data) => data != undefined) as string[]) ?? []),
                            ]}
                            workers={workerList}
                            requests={requestList}
                            displayRespondCount
                            style={{ marginHorizontal: 8 }}
                        />
                    </View>
                </>
            )}
            {site?.siteRelation != 'fake-company-manager' && (
                <FlatList
                    listKey={listKey}
                    data={site?.companyRequests?.receiveRequests?.items}
                    renderItem={({ item, index }) => {
                        return <Child item={item} attendanceModifications={attendanceModifications} />
                    }}
                />
            )}
        </ShadowBox>
    )
})

const styles = StyleSheet.create({})

// ==========

const Child = React.memo((props: { item: RequestType; attendanceModifications?: AttendanceModificationModel[] }) => {
    const { item, attendanceModifications } = props
    const subWorkerList = useMemo(() => item.requestMeter?.presentArrangements?.items?.map((arr) => arr.worker).filter((data) => data != undefined) as WorkerType[], [item])
    const navigation = useNavigation<any>()
    const { t } = useTextTranslation()

    return (
        <ShadowBoxWithHeader
            title={t('common:RequestForSupportForYourCompany')}
            key={item.requestId}
            hasShadow={false}
            onPress={() => {
                navigation.push('SiteAttendanceManage', {
                    title: item.site?.siteNameData?.name,
                    siteId: item?.siteId,
                    siteNumber: item?.site?.siteNameData?.siteNumber,
                    requestId: item.requestId,
                })
            }}
            style={{
                marginTop: 5,
                marginHorizontal: 5,
            }}>
            <Request
                markingWorkerIds={
                    attendanceModifications
                        ?.filter((data) => data.status == 'created' || data.status == 'edited')
                        ?.map((mod) => mod?.modificationInfo?.workerId)
                        .filter((data) => data != undefined) as string[]
                }
                workerOnPress={(worker) => {
                    const target = attendanceModifications?.filter((mod) => mod.status == 'created' || (mod.status == 'edited' && mod?.modificationInfo?.workerId == worker?.workerId))[0]
                    if (target != undefined) {
                        navigation.push('AttendanceDetail', {
                            arrangementId: target.modificationInfo?.arrangementId,
                            attendanceId: target.targetAttendanceId,
                            siteId: item?.siteId,
                        })
                    } else {
                        undefined
                    }
                }}
                request={item}
                type={'order'}
                subArrangedWorkers={subWorkerList}
                displayMeter={false}
                displayRespondCount
            />
        </ShadowBoxWithHeader>
    )
})
