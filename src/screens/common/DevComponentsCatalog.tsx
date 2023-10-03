/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { Text, Pressable, View, StyleSheet, FlatList, ScrollView, InteractionManager } from 'react-native'
import { useDispatch } from 'react-redux'
import { BlueColor, GreenColor, ColorStyle, GlobalStyles, FontStyle } from '../../utils/Styles'
import { IPHONEX_NOTCH_HEIGHT_MAXIMUM_PLUS, THEME_COLORS, WINDOW_WIDTH } from '../../utils/Constants'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import { ifIphoneX } from 'react-native-iphone-screen-helper'
import { RootStackParamList } from '../Router'
import { AlertMessage } from '../../components/organisms/AlertMessage'
import { AppButton } from '../../components/atoms/AppButton'
import { Attendance } from '../../components/organisms/attendance/Attendance'
import { AttendanceElement } from '../../components/organisms/attendance/AttendanceElement'
import { Badge } from '../../components/atoms/Badge'
import { BottomSheet } from '../../components/template/BottomSheet'
import { ColumnBox } from '../../components/atoms/ColumnBox'
import { Company } from '../../components/organisms/company/Company'
import { CompanyProfile } from '../../components/template/CompanyProfile'
import { CompanyPrefix } from '../../components/organisms/company/CompanyPrefix'
import { DatePickButton } from '../../components/organisms/attendance/DatePickButton'
import { EmptyScreen } from '../../components/template/EmptyScreen'
import { Icon } from '../../components/atoms/Icon'
import { IconParam } from '../../components/organisms/IconParam'
import { ImageIcon } from '../../components/organisms/ImageIcon'
import { InputTextBox } from '../../components/organisms/inputBox/InputTextBox'
import { Line } from '../../components/atoms/Line'
import { Map } from '../../components/atoms/Map'
import { Meter } from '../../components/atoms/Meter'
import { NavIcon } from '../../components/organisms/NavIcon'
import { NewBadge } from '../../components/atoms/NewBadge'
import { PartnershipTag } from '../../components/organisms/company/PartnershipTag'
import { PlusButton } from '../../components/atoms/PlusButton'
import { Prefix } from '../../components/organisms/Prefix'
import { ConstructionMeter } from '../../components/organisms/construction/ConstructionMeter'
import { ConstructionPrefix } from '../../components/organisms/construction/ConstructionPrefix'
import { ResponsibleTag } from '../../components/organisms/worker/ResponsibleTag'
import { NavButton } from '../../components/atoms/NavButton'
import { ShadowBox } from '../../components/organisms/shadowBox/ShadowBox'
import { ShadowBoxWithHeader } from '../../components/organisms/shadowBox/ShadowBoxWithHeader'
import { Site } from '../../components/organisms/site/Site'
import { SiteHeaderCL } from '../../components/organisms/site/SiteHeaderCL'
import { SiteMeter } from '../../components/organisms/site/SiteMeter'
import { SwitchDateButton } from '../../components/organisms/SwitchDateButton'
import { SwitchPage } from '../../components/template/SwitchPage'
import { TableArea } from '../../components/atoms/TableArea'
import { Tag } from '../../components/organisms/Tag'
import { TimeIcon } from '../../components/organisms/TimeIcon'
import { Toast } from '../../components/atoms/Toast'
import { Worker } from '../../components/organisms/worker/Worker'
import { WorkerIcon } from '../../components/organisms/worker/WorkerIcon'
import { WorkerInfo } from '../../components/organisms/worker/WorkerInfo'
import { WorkerTag } from '../../components/organisms/worker/WorkerTag'
import { Filter } from '../../components/organisms/Filter'
import { SelectButton } from '../../components/organisms/SelectButton'
import { ConstructionLeaf } from '../../components/organisms/construction/ConstructionLeaf'
import { ConstructionOverview } from '../../components/organisms/construction/ConstructionOverview'
import { Construction } from '../../components/organisms/construction/Construction'
import { ConstructionSite } from '../../components/organisms/construction/ConstructionSite'
import { RequestDirection } from '../../components/organisms/request/RequestDirection'
import { ConstructionHeaderCL } from '../../components/organisms/construction/ConstructionHeaderCL'
import { InviteHeader } from '../../components/organisms/InviteHeader'
import { AttendanceReport } from '../../components/organisms/attendance/AttendanceReport'
import { ShadowBoxWithToggle } from '../../components/organisms/shadowBox/ShadowBoxWithToggle'
import { CompanyRelationSites } from '../../components/organisms/company/CompanyRelationSites'
import { WorkerProfileContent } from '../../components/template/WorkerProfileContent'
import { WorkerAttendance } from '../../components/organisms/worker/WorkerAttendance'
import { WorkerListCL } from '../../components/organisms/worker/WorkerListCL'
import { getUuidv4 } from '../../utils/Utils'
import { UnReportAttendance } from '../../components/organisms/attendance/UnReportAttendance'
import { DateIcon } from '../../components/atoms/DateIcon'
import { WorkerSummary } from '../../components/organisms/worker/WorkerSummary'
import { InputDropDownBox } from '../../components/organisms/inputBox/InputDropdownBox'
import { InputNumberBox } from '../../components/organisms/inputBox/InputNumberBox'
import { InputDateDropdownBox } from '../../components/organisms/inputBox/InputDateDropdownBox'
import { InputBox } from '../../components/atoms/InputBox'
import { InvoiceDetail } from '../../components/organisms/invoice/InvoiceDetail'
import { SiteInvoice } from '../../components/organisms/site/SiteInvoice'
import { InvoiceTypeSelect } from '../../components/organisms/invoice/InvoiceTypeSelect'
import { InputCompanyBox } from '../../components/organisms/inputBox/InputCompanyBox'
import { InputConstructionBox } from '../../components/organisms/inputBox/InputConstructionBox'
import { Notification } from '../../components/organisms/notification/Notification'
import { newDate } from '../../utils/ext/Date.extensions'
import { CustomDate } from '../../models/_others/CustomDate'
import { InviteUrl } from '../../components/organisms/InviteUrl'
import { ContractingProject } from '../../components/organisms/contract/ContractingProject'
import { Contract } from '../../components/organisms/contract/Contract'
import { DateAttendance } from '../../components/organisms/date/DateAttendance'
import { BaseModal } from '../../components/organisms/BaseModal'
import { ScrollViewInstead } from '../../components/atoms/ScrollViewInstead'
import { useTextTranslation } from './../../fooks/useTextTranslation'
import { InvRequestDateBox } from '../../components/organisms/invRequest/InvRequestDateBox'
import { InvRequestHeaderCL } from '../../components/organisms/invRequest/InvRequestHeaderCL'
import { InvRequestPrefix } from '../../components/organisms/invRequest/InvRequestPrefix'
import { InvReservationHeader } from '../../components/organisms/invReservation/InvReservationHeader'
import { InvReservationHeaderCL } from '../../components/organisms/invReservation/InvReservationHeaderCL'
import { InvReservation } from '../../components/organisms/invReservation/InvReservation'
import { InvReservationWithSite } from '../../components/organisms/invReservation/InvReservationWithSite'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    id: string
}

const initialState: InitialStateType = {
    id: '',
}

const DevComponentsCatalog = () => {
    const { t } = useTextTranslation()
    const route = useRoute<RouteProps>()
    const params = route.params
    const dispatch = useDispatch()
    const navigation = useNavigation<NavProps>()

    return (
        <ScrollViewInstead
            style={{
                flex: 1,
                backgroundColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                ...ifIphoneX(
                    {
                        paddingTop: 10 + IPHONEX_NOTCH_HEIGHT_MAXIMUM_PLUS,
                    },
                    {
                        paddingTop: 10,
                    },
                ),
            }}>
            <View style={styles.view}>
                <Text style={styles.text}>AlertMessage</Text>
                <AlertMessage />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>AppButton</Text>
                <AppButton />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>Attendance</Text>
                <Attendance />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>AttendanceButton</Text>
                <AttendanceElement />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>Badge</Text>
                <Badge />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>ColumnBox</Text>
                <ColumnBox title={t('common:Name')} content={'名無しのゴンベ'} />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>Company</Text>
                <Company
                    style={{
                        flex: 1,
                    }}
                />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>CompanyDetail</Text>
                <CompanyProfile />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>CompanyPrefix</Text>
                <CompanyPrefix
                    style={{
                        alignSelf: 'flex-start',
                    }}
                />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>DatePickButton</Text>
                <DatePickButton />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>EmptyScreen</Text>
                <EmptyScreen />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>Icon</Text>
                <Icon />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>IconParam</Text>
                <IconParam count={20} suffix={t('common:Name')} paramName={t('common:Labourer')} iconName={'worker'} />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>ImageIcon</Text>
                <ImageIcon />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InputBox</Text>
                <InputBox />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>Line</Text>
                <Line />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>Map</Text>
                <Map mapType="addressMap" />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>Meter</Text>
                <Meter />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>NewBadge</Text>
                <NewBadge />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>PartnershipTag</Text>
                <PartnershipTag
                    style={{
                        alignSelf: 'flex-start',
                    }}
                />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>PlusButton</Text>
                <PlusButton />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>Prefix</Text>
                <Prefix
                    style={{
                        alignSelf: 'flex-start',
                    }}
                />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>ConstructionLeaf</Text>
                <ConstructionLeaf />
            </View>

            <View style={styles.view}>
                <Text style={styles.text}>ConstructionMeter</Text>
                <ConstructionMeter />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>ConstructionOverview</Text>
                <ConstructionOverview />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>ConstructionPrefix</Text>
                <ConstructionPrefix
                    style={{
                        alignSelf: 'flex-start',
                    }}
                />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>ResponsibleTag</Text>
                <ResponsibleTag
                    style={{
                        alignSelf: 'flex-start',
                    }}
                />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>NavButton</Text>
                <NavButton />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>ShadowBox</Text>
                <ShadowBox
                    style={{
                        padding: 10,
                    }}>
                    <Text>{t('common:Contents')}</Text>
                </ShadowBox>
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>ShadowBoxWithHeader</Text>
                <ShadowBoxWithHeader>
                    <Text>{t('common:Contents')}</Text>
                </ShadowBoxWithHeader>
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>ShadowBoxWithHeader</Text>
                <ShadowBoxWithToggle
                    hideChildren={<Text>{t('common:Hidden')}</Text>}
                    bottomChildren={<Text>{t('common:Bottom')}</Text>}
                    style={{
                        padding: 10,
                    }}>
                    <Text>{t('common:Contents')}</Text>
                </ShadowBoxWithToggle>
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>Site</Text>
                <Site />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>SiteHeaderCL</Text>
                <SiteHeaderCL />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>SiteMeter</Text>
                <SiteMeter />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InvRequestDateBox</Text>
                <InvRequestDateBox />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InvRequestHeaderCL</Text>
                <InvRequestHeaderCL />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InvRequestPrefix</Text>
                <InvRequestPrefix />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InvReservationHeader</Text>
                <InvReservationHeader />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InvReservationHeaderCL</Text>
                <InvReservationHeaderCL />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InvReservation</Text>
                <InvReservation />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InvReservationWithSite</Text>
                <InvReservationWithSite />
            </View>
            <View
                style={[
                    styles.view,
                    {
                        paddingBottom: 40,
                    },
                ]}>
                <Text style={styles.text}>SwitchDateButton</Text>
                <SwitchDateButton
                    style={{
                        marginTop: 30,
                    }}
                />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>TableArea</Text>
                <TableArea
                    columns={[
                        {
                            key: 'パラメーター',
                            content: '内容',
                        },
                        {
                            key: 'パラメーター',
                            content: '内容',
                        },
                        {
                            key: 'パラメーター',
                            content: '内容',
                        },
                    ]}
                />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>Tag</Text>
                <Tag
                    style={{
                        alignSelf: 'flex-start',
                    }}
                />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>TimeIcon</Text>
                <TimeIcon
                    style={{
                        alignSelf: 'flex-start',
                    }}
                />
            </View>
            <View
                style={[
                    styles.view,
                    {
                        paddingBottom: 50,
                    },
                ]}>
                <Text style={styles.text}>Toast</Text>
                <Toast
                    style={{
                        marginTop: 10,
                    }}
                    time={100 ** 100}
                    type={'error'}
                />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>Worker</Text>
                <Worker />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>WorkerIcon</Text>
                <WorkerIcon />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>WorkerInfo</Text>
                <WorkerInfo email={'test@gmail.com'} phoneNumber={'090-9999-9999'} />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>WorkerTag</Text>
                <WorkerTag
                    style={{
                        alignSelf: 'flex-start',
                    }}
                />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>SelectButton</Text>
                <SelectButton />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>Filter</Text>
                <Filter />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>Construction</Text>
                <Construction />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>ConstructionSite</Text>
                <ConstructionSite />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>RequestDirection</Text>
                <RequestDirection />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>ConstructionHeaderCL</Text>
                <ConstructionHeaderCL />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InviteUrl</Text>
                <InviteUrl />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InviteHeader</Text>
                <InviteHeader />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>AttendanceReport</Text>
                <AttendanceReport mapType={'addressMap'} />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>CompanyRelationSites</Text>
                <CompanyRelationSites />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>ContractingProject</Text>
                <ContractingProject />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>Contract</Text>
                <Contract />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>DateIcon</Text>
                <DateIcon />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>DateAttendance</Text>
                <DateAttendance />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>WorkerProfileContent</Text>
                <WorkerProfileContent />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>WorkerAttendance</Text>
                <WorkerAttendance />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>UnReportAttendance</Text>
                <UnReportAttendance />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>WorkerListCL</Text>
                <WorkerListCL />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>WorkerSummary</Text>
                <WorkerSummary />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InputTextBox</Text>
                <InputTextBox />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InputDropDownBox</Text>
                <InputDropDownBox />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InputNumberBox</Text>
                <InputNumberBox />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InputDateDropdownBox</Text>
                <InputDateDropdownBox />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InputCompanyBox</Text>
                <InputCompanyBox />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InputConstructionBox</Text>
                <InputConstructionBox />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InvoiceTypeSelect</Text>
                <InvoiceTypeSelect />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>SiteInvoice</Text>
                <SiteInvoice />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>InvoiceDetail</Text>
                <InvoiceDetail />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>Notification</Text>
                <Notification
                    notification={{
                        notificationId: getUuidv4(),
                        description: '管理者「近藤 守」によってあなたの会社役割が変更されました。\n\n変更前\n・一般作業員\n\n変更後\n・管理者',
                        title: t('admin:YourRoleHasChanged'),
                    }}
                    userType={'admin'}
                />
            </View>
            <View style={styles.view}>
                <Text style={styles.text}>BaseModal</Text>
                <BaseModal />
            </View>
            <View
                style={{
                    marginBottom: 100,
                }}></View>
        </ScrollViewInstead>
    )
}
export default DevComponentsCatalog

const styles = StyleSheet.create({
    view: {
        margin: 5,
        padding: 10,
        marginTop: 15,
        backgroundColor: '#fff',
        // borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
        borderRadius: 10,
    },
    text: {
        fontFamily: FontStyle.medium,
        lineHeight: 14,
        fontSize: 12,
        marginBottom: 10,
    },
})
