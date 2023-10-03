import React, { useMemo } from 'react'
import { Text, View, StyleSheet, ListRenderItem, ListRenderItemInfo, Pressable, ViewStyle } from 'react-native'
import { useNavigation } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import { FlatList } from 'react-native-gesture-handler'
import { AttendanceCLType } from '../../models/attendance/Attendance'
import { getUuidv4 } from '../../utils/Utils'
import { Site, SiteProps } from '../organisms/site/Site'
import { THEME_COLORS } from '../../utils/Constants'
import { FontStyle, GlobalStyles, GreenColor } from '../../utils/Styles'
import { Icon } from '../atoms/Icon'
import { ShadowBox } from '../organisms/shadowBox/ShadowBox'
import { SiteHeaderCL } from '../organisms/site/SiteHeaderCL'
import { Badge } from '../atoms/Badge'
import { AppButton } from '../atoms/AppButton'
import { BottomMargin } from '../atoms/BottomMargin'
import { EmptyScreen } from './EmptyScreen'
import { dayBaseText, isToday, isTodayOrBefore, isTomorrow } from '../../models/_others/CustomDate'
import { useTextTranslation } from '../../fooks/useTextTranslation'

import PermissionModal from './PushPermissionModal'
import { RootStackParamList } from '../../screens/Router'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>

type WorkerScheduleProps = {
    attendances: _SiteUIType[]
    /**
     * unReportedAttendancesの中に、arrangementを含み、その中にsiteを含む
     */
    unReportedAttendances: AttendanceCLType[]
    isOpen: boolean
    refreshing: boolean
    onPressToggle: () => void
    onRefresh: () => void
    isAdmin: boolean
}

type _SiteUIType = Partial<SiteProps>

// const logger = createLogger() // for log rerendering

const WorkerSchedule = (props: WorkerScheduleProps) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()

    const { attendances, isOpen, unReportedAttendances, refreshing, onPressToggle, onRefresh, isAdmin } = props

    let _preDay: string | undefined = undefined

    const _footer = () => {
        return <BottomMargin />
    }

    const _header = () => {
        return (
            <View
                style={{
                    marginTop: 10,
                }}>
                {unReportedAttendances?.length > 0 && (
                    <ShadowBox
                        style={{
                            padding: 10,
                            paddingTop: 15,
                            marginHorizontal: 10,
                            marginTop: 10,
                            marginBottom: 10,
                        }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                // marginBottom: 10,
                            }}>
                            <Text style={GlobalStyles.headerText}> {t('worker:UnreportedAttendance')} </Text>
                            <Badge
                                style={{
                                    marginLeft: -3,
                                    marginTop: -7,
                                }}
                                batchCount={unReportedAttendances.length}
                            />
                        </View>
                        {unReportedAttendances.slice(0, isOpen ? undefined : 3).map((unReport, index) => {
                            const isEnd = unReport?.startDate != undefined || unReport?.isAbsence == true
                            return (
                                <Pressable
                                    key={index}
                                    onPress={() => {
                                        isAdmin
                                            ? navigation.push('AttendanceDetail', {
                                                  attendanceId: unReport?.attendanceId,
                                                  arrangementId: unReport?.arrangementId,
                                                  siteId: unReport?.arrangement?.siteId ?? 'no-id',
                                              })
                                            : navigation.push('AttendancePopup', {
                                                  attendanceId: unReport?.attendanceId,
                                                  type: isEnd ? 'end' : 'start',
                                              })
                                    }}
                                    style={{
                                        padding: 10,
                                        paddingVertical: 7,
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        marginTop: 10,
                                        borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}>
                                    <SiteHeaderCL
                                        site={unReport.arrangement?.site}
                                        titleStyle={GlobalStyles.smallGrayText as ViewStyle}
                                        displayDay
                                        siteNameStyle={GlobalStyles.smallText as ViewStyle}
                                    />
                                    <AppButton iconName="edit" color={GreenColor} title="" hasShadow={false} height={30} />
                                </Pressable>
                            )
                        })}
                        {unReportedAttendances.length >= 4 && (
                            <Pressable
                                onPress={onPressToggle}
                                style={{
                                    padding: 5,
                                    alignSelf: 'center',
                                    paddingHorizontal: 20,
                                    marginBottom: -10,
                                }}>
                                <Icon
                                    name={'toggle'}
                                    width={20}
                                    height={20}
                                    style={{
                                        transform: [{ scaleY: isOpen ? -1 : 1 }],
                                    }}
                                />
                            </Pressable>
                        )}
                    </ShadowBox>
                )}
            </View>
        )
    }

    const _content: ListRenderItem<_SiteUIType> = (info: ListRenderItemInfo<_SiteUIType>) => {
        const { item, index } = info
        const startDate = item?.site?.startDate
        const day = startDate ? dayBaseText(startDate) : undefined
        const displayDay = _preDay != day
        _preDay = day
        // 2022.08 okuda - KVSキャッシュ導入に伴い、メソッドを持たないキャッシュデータに対応させるためCustomDateを再生成
        // const isToday = startDate?.isToday()
        // const isTomorrow = startDate?.isTomorrow()
        const __isToday = startDate ? isToday(startDate) : false
        const __isTomorrow = startDate ? isTomorrow(startDate) : false
        const __isTodayOrBefore = startDate ? isTodayOrBefore(startDate) : false

        return (
            <Pressable
                style={{
                    margin: 10,
                    marginBottom: 0,
                }}
                key={index}>
                {displayDay && (
                    <View
                        style={{
                            marginBottom: 5,
                            marginTop: 15,
                            marginLeft: 5,
                        }}>
                        <Text
                            style={{
                                fontSize: __isToday || __isTomorrow ? 12 : 14,
                                lineHeight: 15,
                                fontFamily: __isToday || __isTomorrow ? FontStyle.regular : FontStyle.medium,
                            }}>
                            {day}
                        </Text>
                        {(__isToday || __isTomorrow) && (
                            <Text
                                style={{
                                    fontSize: 20,
                                    lineHeight: 22,
                                    fontFamily: FontStyle.black,
                                    marginTop: 5,
                                }}>
                                {__isToday ? `${t('common:Today')}` : `${t('common:Tomorrow')}`}
                            </Text>
                        )}
                    </View>
                )}
                <Site
                    color={GreenColor}
                    site={item?.site}
                    arrangement={item?.arrangement}
                    onPress={item?.onPress}
                    canEditAttendance={isAdmin ? item?.canEditAttendance : item?.canEditAttendance && __isTodayOrBefore}
                    canModifyAttendance={true}
                    side={isAdmin ? 'admin' : 'worker'}
                />
            </Pressable>
        )
    }

    // __DEV__ && logger.logAccessInfo('5. mount/unmount/setStateの度にVirtualDOMの差分更新（DOMへは最終結果が反映）')
    const listKey = useMemo(() => getUuidv4(), [])
    return (
        <View>
            <PermissionModal type={'worker'} />
            <FlatList
                listKey={listKey}
                keyExtractor={(item, index) => index.toString()}
                data={attendances}
                ListHeaderComponent={_header}
                renderItem={_content}
                ListFooterComponent={_footer}
                ListEmptyComponent={() => <EmptyScreen text={t('common:NotExitSite')} />}
                refreshing={refreshing}
                onRefresh={onRefresh}
            />
        </View>
    )
}
export default WorkerSchedule

const styles = StyleSheet.create({})
