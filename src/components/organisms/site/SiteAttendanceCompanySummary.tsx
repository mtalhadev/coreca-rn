import React, { useMemo } from 'react'
import { View, ViewStyle, Text, ListRenderItem, ListRenderItemInfo } from 'react-native'

import { BlueColor, GreenColor, ColorStyle } from '../../../utils/Styles'

import { THEME_COLORS } from '../../../utils/Constants'
import { IconParam } from '../IconParam'
import { Company } from '../company/Company'
import { FlatList } from 'react-native-gesture-handler'
import { getUuidv4 } from '../../../utils/Utils'
import { useNavigation } from '@react-navigation/native'
import { SiteAttendanceCompanyType, SiteAttendanceWorkerType } from '../../../models/attendance/SiteAttendanceDataType'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { WorkerAttendanceSummary } from '../worker/WorkerAttendanceSummary'
import { SelectedAttendanceType } from '../../../screens/adminSide/attendance/AllSiteAttendancesManage'
import { ID } from '../../../models/_others/ID'

export type AppSide = 'worker' | 'admin'

export type SiteAttendanceCompanySummaryProps = {
    siteAttendance: SiteAttendanceCompanyType
    siteId?: ID
    side?: AppSide
    editable?: boolean
    color?: ColorStyle
    myWorkerId?: string
    style?: ViewStyle
    isMyCompany?: boolean
    selectedAttendances?: SelectedAttendanceType[]
    selectAttendance?: (attendanceId: ID, siteId: ID) => void
    deselectAttendance?: (attendanceId: ID, siteId: ID) => void
}

export const SiteAttendanceCompanySummary = React.memo((props: Partial<SiteAttendanceCompanySummaryProps>) => {
    let { style, siteAttendance, siteId, myWorkerId, editable, side, color, isMyCompany, selectedAttendances, selectAttendance, deselectAttendance } = props
    const navigation = useNavigation<any>()
    const { t } = useTextTranslation()

    side = side ?? 'admin'
    if (side == 'worker') {
        color = GreenColor
        editable = false
    }
    editable = editable ?? false
    color = color ?? BlueColor

    const _content: ListRenderItem<SiteAttendanceWorkerType> = (info: ListRenderItemInfo<SiteAttendanceWorkerType>) => {
        const { item, index } = info
        const _editable = myWorkerId == undefined || side == 'admin' ? editable : myWorkerId == item.worker?.workerId

        return (
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                <View
                    style={{
                        flex: 1,
                    }}>
                    <WorkerAttendanceSummary
                        side={side}
                        siteId={siteId}
                        editable={_editable}
                        workerAttendance={item}
                        key={item.attendanceId ?? index}
                        isMyCompany={isMyCompany}
                        selectedAttendances={selectedAttendances}
                        selectAttendance={selectAttendance}
                        deselectAttendance={deselectAttendance}
                    />
                </View>
            </View>
        )
    }
    const listKey = useMemo(() => getUuidv4(), [])
    const unReportCount = useMemo(() => siteAttendance?.arrangedWorkers?.filter((worker) => worker.attendance?.isReported != true).length ?? 0, [siteAttendance])

    return (
        <ShadowBox
            style={{
                padding: 10,
                ...style,
            }}
            hasShadow={true}
            // onPress={
            //     side == 'worker'
            //         ? undefined
            //         : () => {
            //               if (side == 'admin') {
            //                   if (siteAttendance?.company?.companyId) {
            //                       navigation.push('CompanyDetailRouter', {
            //                           companyId: siteAttendance?.company?.companyId,
            //                           title: siteAttendance?.company.name,
            //                       })
            //                   }
            //               }
            //           }
            // }
        >
            <Company company={siteAttendance?.company} displayCompanyPrefix={siteAttendance?.company?.companyPartnership == 'my-company' || side == 'admin'} hasLastDeal={false} iconSize={20} />
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
            <FlatList
                listKey={listKey}
                data={siteAttendance?.arrangedWorkers ?? []}
                keyExtractor={(item, index) => index.toString()}
                renderItem={_content}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
            />
        </ShadowBox>
    )
})
