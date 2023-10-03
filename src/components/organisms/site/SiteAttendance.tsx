import React, { useMemo } from 'react'
import { View, ViewStyle, ListRenderItem, ListRenderItemInfo } from 'react-native'

import { BlueColor, GreenColor, ColorStyle } from '../../../utils/Styles'

import { THEME_COLORS } from '../../../utils/Constants'
import { IconParam } from '../IconParam'
import { CompanyCL } from '../company/CompanyCL'
import { FlatList } from 'react-native-gesture-handler'
import { getUuidv4 } from '../../../utils/Utils'
import { WorkerAttendance } from '../worker/WorkerAttendance'
import { ShadowBoxWithToggle } from '../shadowBox/ShadowBoxWithToggle'
import { useNavigation } from '@react-navigation/native'
import { SiteAttendanceCompanyCLType, SiteAttendanceCompanyType, SiteAttendanceWorkerCLType, SiteAttendanceWorkerType } from '../../../models/attendance/SiteAttendanceDataType'
import { SiteMeter } from './SiteMeter'
import { Prefix } from '../Prefix'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { Company } from '../company/Company'
import { WorkerLastLoggedInType } from '../../../screens/adminSide/site/siteDetail/SiteAttendanceManage'

export type AppSide = 'worker' | 'admin'

export type SiteAttendanceProps = {
    siteAttendance: SiteAttendanceCompanyType
    workersLastLoggedIn?: WorkerLastLoggedInType[]
    siteId?: string
    side?: AppSide
    editable?: boolean
    color?: ColorStyle
    myWorkerId?: string
    style?: ViewStyle
    isMyCompany?: boolean
    isTodayOrBefore?: boolean
}

export const SiteAttendance = React.memo((props: Partial<SiteAttendanceProps>) => {
    let { style, siteAttendance, workersLastLoggedIn, siteId, myWorkerId, editable, side, color, isMyCompany, isTodayOrBefore } = props
    const navigation = useNavigation<any>()
    const { t } = useTextTranslation()
    side = side ?? 'admin'
    if (side == 'worker') {
        color = GreenColor
        editable = false
    }
    editable = editable ?? false
    color = color ?? BlueColor
    const myWorker = siteAttendance?.arrangedWorkers?.find((arrangedWorker) => arrangedWorker.worker?.workerId == myWorkerId)
    const isSiteManager = myWorker?.worker?.workerTags?.includes('is-site-manager')
    const _content: ListRenderItem<SiteAttendanceWorkerType> = (info: ListRenderItemInfo<SiteAttendanceWorkerType>) => {
        const { item, index } = info
        let _editable = false
        if (side == 'admin') {
            // 管理者の場合、編集可能
            _editable = true
        } else if (isSiteManager) {
            // 責任者の場合、編集可能
            _editable = true
        } else if (myWorkerId == item.worker?.workerId) {
            // ログインユーザー自身の場合、編集可能
            _editable = true
        }
        return (
            <WorkerAttendance
                side={side}
                siteId={siteId}
                editable={_editable}
                workerAttendance={item}
                key={item.attendanceId ?? index}
                isMyCompany={isMyCompany}
                canModifyAttendance={item?.worker?.workerId == myWorkerId}
                isSiteManager={isSiteManager}
                lastLoggedInAt={workersLastLoggedIn?.find((worker) => worker.workerId == item.worker?.workerId)?.lastLoggedInAt}
            />
        )
    }
    const listKey = useMemo(() => getUuidv4(), [])
    const unReportCount = useMemo(() => siteAttendance?.arrangedWorkers?.filter((worker) => worker.attendance?.isReported != true).length ?? 0, [siteAttendance])

    return (
        <ShadowBoxWithToggle
            style={{
                padding: 10,
                ...style,
            }}
            hasShadow={side == 'admin'}
            onPress={
                side == 'worker'
                    ? undefined
                    : () => {
                          if (side == 'admin') {
                              if (siteAttendance?.company?.companyId) {
                                  navigation.push('CompanyDetailRouter', {
                                      companyId: siteAttendance?.company?.companyId,
                                      title: siteAttendance?.company.name,
                                  })
                              }
                          }
                      }
            }
            bottomChildren={
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                    <IconParam paramName={t('common:NoOfOperations')} suffix={t('common:Name')} count={siteAttendance?.arrangedWorkers?.length ?? 0} iconName={'attend-worker'} />
                    {side == 'admin' && (
                        <IconParam
                            paramName={t('common:Unreported')}
                            suffix={t('common:Name')}
                            count={unReportCount}
                            color={unReportCount > 0 ? THEME_COLORS.OTHERS.ALERT_RED : '#000'}
                            iconName={'worker'}
                        />
                    )}
                </View>
            }
            hideChildren={
                <FlatList
                    listKey={listKey}
                    data={siteAttendance?.arrangedWorkers ?? []}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={_content}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                />
            }
            isToggleOpened={side == 'admin'}>
            <Company company={siteAttendance?.company} displayCompanyPrefix={siteAttendance?.company?.companyPartnership == 'my-company' || side == 'admin'} iconSize={21} companyNameTextSize={11} />
            {side == 'admin' && siteAttendance?.request != undefined && siteAttendance.company?.isFake != true && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 5,
                    }}>
                    <Prefix
                        text={t('common:Responded')}
                        color={THEME_COLORS.OTHERS.BACKGROUND}
                        fontColor={THEME_COLORS.OTHERS.BLACK}
                        fontSize={9}
                        style={{
                            marginRight: 10,
                        }}
                    />
                    <SiteMeter presentCount={siteAttendance?.request.subRespondCount} requiredCount={siteAttendance?.request?.requestCount} />
                </View>
            )}
        </ShadowBoxWithToggle>
    )
})
