import React, { useCallback, useMemo } from 'react'
import { Text, View, ViewStyle, FlatList, Pressable, Alert } from 'react-native'

import { FontStyle, GlobalStyles } from '../../../utils/Styles'
import { IconParam } from '../IconParam'
import { ShadowBoxWithToggle } from '../shadowBox/ShadowBoxWithToggle'
import { useNavigation } from '@react-navigation/native'
import { getUuidv4 } from '../../../utils/Utils'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { InvRequestType } from '../../../models/invRequest/InvRequestType'
import { InvRequestHeader } from './InvRequestHeader'
import { SiteType } from '../../../models/site/Site'
import sum from 'lodash/sum'
import uniqBy from 'lodash/uniqBy'
import { ContractingProjectPrefix } from '../contract/ContractingProjectPrefix'
import { THEME_COLORS } from '../../../utils/Constants'
import { InvRequestSite } from './InvRequestSite'
import { WorkerList } from '../worker/WorkerList'
import { DateInvRequestAttendance } from '../date/DateInvRequestAttendance'
import { AttendanceModificationModel } from '../../../models/attendanceModification/AttendanceModification'
import { deleteInvRequest } from '../../../usecases/invRequest/invRequestCase'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { deleteLocalSiteArrangement } from '../../../usecases/arrangement/SiteArrangementCase'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useDispatch } from 'react-redux'

export type InvRequestWithSitesProps = {
    invRequest?: InvRequestType
    myCompanyId?: string
    contentsType?: 'arrangement' | 'attendance'
    onPress?: () => void
    style?: ViewStyle
}
export const InvRequestWithSites = React.memo((props: Partial<InvRequestWithSitesProps>) => {
    const { invRequest, myCompanyId, contentsType, onPress, style } = props
    const navigation = useNavigation<any>()
    const siteIds: string[] = []
    const { t } = useTextTranslation()
    const dispatch = useDispatch()

    const sites = useMemo(() => invRequest?.attendances?.map((att) => att.arrangement?.site)?.sort((a, b) => (a?.meetingDate ?? a?.siteDate ?? 0) - (b?.meetingDate ?? b?.siteDate ?? 0)), [invRequest])
    const _attendanceModifications = useMemo(
        () =>
            invRequest?.attendances?.map((att) => {
                return {
                    attendanceModification: att.arrangement?.attendanceModification,
                    siteId: att.arrangement?.siteId,
                }
            }),
        [invRequest],
    )
    const fakeCompanySite = invRequest?.site?.siteId && invRequest?.site
    /**
     * 現場未定作業員を表示するため、配列の１番目に{}を追加している。
     */
    const _sites = uniqBy(
        [{}, fakeCompanySite, ...(sites ?? [])].filter((data) => data != undefined),
        'siteId',
    ) as SiteType[]
    const arrangedWorkerIds = useMemo(() => invRequest?.attendances?.map((att) => att.workerId), [invRequest])
    const arrangedWorkerIdsSet = new Set(arrangedWorkerIds)
    const unArrangedWorkers = invRequest?.workers?.items?.filter((worker) => !arrangedWorkerIdsSet.has(worker.workerId))

    const listKey = useMemo(() => getUuidv4(), [])

    const presentCount =
        (invRequest?.attendances?.length ?? 0) +
        (invRequest?.site?.subArrangements?.items?.length ?? 0) +
        (sum(invRequest?.site?.companyRequests?.orderRequests?.items?.map((req) => req.requestCount)) ?? 0)

    const displayAlert = useCallback(() => {
        Alert.alert(`${invRequest?.targetCompany?.name}` + `${t('admin:ToApply')}`, '', [
            {
                text: `${t('worker:cancel')}`,
                style: 'cancel',
            },
            {
                text: `${t('admin:Details')}`,
                onPress: () => {
                    navigation.push('InvRequestDetail', {
                        invRequestId: invRequest?.invRequestId,
                        type: invRequest?.myCompanyId == myCompanyId ? 'order' : 'receive',
                    })
                },
            },
            {
                text: `${t('worker:edit')}`,
                onPress: () => {
                    navigation.push('EditInvRequest', {
                        invRequestId: invRequest?.invRequestId,
                    })
                },
            },
            {
                text: `${t('admin:DeleteDraft')}`,
                onPress: () => {
                    deleteLocalSiteArrangement(invRequest?.invRequestId)
                    dispatch(setIsNavUpdating(true))
                },
            },
            // {//TODO:削除対応する場合は、ローカルでその後変更できないようにする必要がある
            //     text: `${t('worker:deletion')}`,
            //     onPress: () => {
            //         if ((invRequest?.workerIds?.length ?? 0) > 0) {
            //             Alert.alert(t('admin:WantToDeleteTheInvRequest'), t('admin:OperationCannotBeUndone'), [
            //                 { text: t('common:Deletion'), onPress: () => deleteInvRequest({ invRequestId: invRequest?.invRequestId }) },
            //                 {
            //                     text: t('common:Cancel'),
            //                     style: 'cancel',
            //                 },
            //             ])
            //         } else {
            //             deleteInvRequest({ invRequestId: invRequest?.invRequestId })
            //         }
            //     },
            // },
        ])
    }, [invRequest])

    if (contentsType == 'arrangement' && invRequest?.site?.siteId) {
        return (
            <>
                <InvRequestSite
                    onPress={
                        onPress
                            ? () => onPress()
                            : invRequest?.site.siteId
                            ? () => {
                                  navigation.push('InvRequestDetail', {
                                      invRequestId: invRequest?.invRequestId,
                                      type: invRequest.myCompanyId == myCompanyId ? 'order' : 'receive',
                                  })
                              }
                            : () => {
                                  navigation.push('SiteDetail', {
                                      title: invRequest?.site?.siteNameData?.name,
                                      siteId: invRequest?.site?.siteId,
                                      siteNumber: invRequest?.site?.siteNameData?.siteNumber,
                                  })
                              }
                    }
                    site={invRequest?.site}
                    style={{
                        ...style,
                    }}
                    invRequest={invRequest}
                    hasShadow={true}
                    myCompanyId={myCompanyId}
                    displayAlert={displayAlert}
                />
            </>
        )
    } else if (contentsType == 'attendance' && invRequest?.site?.siteId) {
        return (
            <DateInvRequestAttendance
                style={{
                    marginTop: 10,
                    marginHorizontal: 10,
                }}
                invRequest={invRequest}
                site={invRequest?.site}
                hasShadow={true}
                displayAlert={displayAlert}
            />
        )
    }
    return (
        <ShadowBox
            style={{
                padding: 10,
                paddingTop: 5,
                ...style,
            }}
            onLongPress={displayAlert}
            onPress={
                onPress
                    ? () => onPress()
                    : () => {
                          contentsType == 'attendance'
                              ? navigation.push('SiteAttendanceManage', {
                                    invRequestId: invRequest?.invRequestId,
                                })
                              : navigation.push('InvRequestDetail', {
                                    invRequestId: invRequest?.invRequestId,
                                    type: invRequest?.myCompanyId == myCompanyId ? 'order' : 'receive',
                                })
                      }
            }>
            <View
                style={{
                    backgroundColor: THEME_COLORS.OTHERS.GRAY,
                    paddingVertical: 5,
                    paddingLeft: 10,
                    borderTopEndRadius: 10,
                    borderTopStartRadius: 10,
                    borderBottomRightRadius: 0,
                    borderBottomLeftRadius: 0,
                    marginTop: -5,
                    marginHorizontal: -10,
                    marginBottom: 8,
                }}>
                <Text
                    style={{
                        ...GlobalStyles.smallText,
                        color: '#fff',
                    }}>
                    {invRequest?.myCompanyId == myCompanyId ? t('admin:SendYourSupport') : t('admin:BackupIsComing')}
                </Text>
            </View>
            {invRequest?.invReservation?.project?.isFakeCompanyManage == true && <ContractingProjectPrefix contractingProject={invRequest?.invReservation?.project} hideClient />}
            <View>
                <InvRequestHeader
                    style={{
                        marginTop: 5,
                    }}
                    invRequest={invRequest}
                    hideDisplayDate
                    presentCount={presentCount}
                    myCompanyId={myCompanyId}
                    isDisplayClient
                    displayAlert={displayAlert}
                />
            </View>
            <FlatList
                data={_sites}
                listKey={listKey}
                keyExtractor={(item, index) => index.toString()}
                ListEmptyComponent={() => {
                    return (
                        <View
                            style={{
                                marginTop: 5,
                            }}>
                            <Text style={GlobalStyles.smallText}>{t('common:ThereIsNoSite')}</Text>
                        </View>
                    )
                }}
                renderItem={({ item, index }) => {
                    siteIds.push(item?.siteId ?? 'no-id')
                    if (index == 0) {
                        return unArrangedWorkers?.length ?? 0 > 0 ? (
                            <>
                                <Pressable
                                    style={[
                                        {
                                            marginTop: 10,
                                            borderWidth: 1,
                                            borderColor: THEME_COLORS.OTHERS.LIGHT_GRAY,
                                            borderRadius: 10,
                                        },
                                    ]}
                                    onPress={
                                        onPress
                                            ? () => onPress()
                                            : () => {
                                                  contentsType == 'attendance'
                                                      ? navigation.push('SiteAttendanceManage', {
                                                            invRequestId: invRequest?.invRequestId,
                                                        })
                                                      : navigation.push('InvRequestDetail', {
                                                            invRequestId: invRequest?.invRequestId,
                                                            type: invRequest?.myCompanyId == myCompanyId ? 'order' : 'receive',
                                                        })
                                              }
                                    }>
                                    <View
                                        style={{
                                            borderTopLeftRadius: 10,
                                            borderTopRightRadius: 10,
                                            backgroundColor: THEME_COLORS.OTHERS.PURPLE_GRAY,
                                        }}>
                                        <Text
                                            ellipsizeMode={'middle'}
                                            numberOfLines={2}
                                            style={[
                                                {
                                                    fontFamily: FontStyle.bold,
                                                    fontSize: 12,
                                                    lineHeight: 14,
                                                    padding: 8,
                                                },
                                            ]}>
                                            {t('admin:UnconfirmedWorkersOnSite')}
                                        </Text>
                                    </View>
                                    <View
                                        style={{
                                            padding: 8,
                                            flexDirection: 'row',
                                            marginTop: 5,
                                        }}>
                                        <WorkerList onPress={() => undefined} workers={unArrangedWorkers} />
                                    </View>
                                </Pressable>
                            </>
                        ) : (
                            <></>
                        )
                    }
                    if (contentsType == 'arrangement') {
                        return (
                            <InvRequestSite
                                onPress={
                                    invRequest?.site
                                        ? () => {
                                              navigation.push('InvRequestDetail', {
                                                  invRequestId: invRequest?.invRequestId,
                                                  type: 'order',
                                              })
                                          }
                                        : () => {
                                              navigation.push('SiteDetail', {
                                                  title: item?.siteNameData?.name,
                                                  siteId: item?.siteId,
                                                  siteNumber: item?.siteNameData?.siteNumber,
                                              })
                                          }
                                }
                                site={item}
                                key={item?.siteId ?? index}
                                style={{
                                    marginTop: 10,
                                }}
                                invRequest={invRequest}
                                // こちら側には編集権限がなく、タップで詳細へ遷移するので、displayAlert不要
                            />
                        )
                    } else if (contentsType == 'attendance') {
                        return (
                            <DateInvRequestAttendance
                                style={{
                                    marginTop: 10,
                                }}
                                key={index}
                                invRequest={invRequest}
                                site={item}
                                attendanceModifications={
                                    (_attendanceModifications
                                        ?.filter((mod) => mod?.siteId == item?.siteId)
                                        ?.map((mod) => mod.attendanceModification)
                                        .filter((data) => data != undefined) as AttendanceModificationModel[]) ?? []
                                }
                            />
                        )
                    } else {
                        return <></>
                    }
                }}
            />
        </ShadowBox>
    )
})
