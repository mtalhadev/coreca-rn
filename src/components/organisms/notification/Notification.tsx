/* eslint-disable prefer-const */
import React, { useCallback } from 'react'
import { Text, View, StyleSheet, ViewStyle } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'

import { RootStackParamList, ScreenNameType } from '../../../screens/Router'

import { AppButton } from '../../atoms/AppButton'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { NewBadge } from '../../atoms/NewBadge'

import { BlueColor, GlobalStyles, GreenColor } from '../../../utils/Styles'
import { NotificationCLType } from '../../../models/notification/Notification'
import { secondsBaseText, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
// const { t } = useTextTranslation()

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>

export type NotificationProps = {
    // 管理者サイド or 現場サイド
    userType: 'admin' | 'worker'
    notification?: NotificationCLType
    style?: ViewStyle
}

export const Notification = React.memo((props: Partial<NotificationProps>) => {
    // import { useTextTranslation } from '../../../fooks/useTextTranslation'
    const { t } = useTextTranslation()
    const { notification, userType, style } = props
    const navigation = useNavigation<NavProps>()
    let buttonTypeTxt = undefined
    if (notification?.transitionParams?.screenName) {
        buttonTypeTxt = new ButtonType(notification?.transitionParams?.screenName as ScreenNameType).txt()
    }
    const ButtonTypeFunc = useCallback((buttonType: ScreenNameType, params: ButtonTypeFuncParams) => {
        // 管理側
        if (buttonType === 'ConstructionDetailRouter') params.adminConstruction()
        if (buttonType === 'ConstructionDetail') params.adminConstructionDetail()
        if (buttonType === 'CompanyDetailRouter') params.adminCompany()
        if (buttonType === 'AdminMyPageRouter') params.adminProfile()
        if (buttonType === 'PartnerCompanyList') params.adminPartnerCompanyList()
        if (buttonType === 'ContractingProjectDetailRouter') params.adminContractingProjectDetailRouter()
        if (buttonType === 'WorkerDetailRouter' && userType == 'admin') params.adminWorkerDetailRouter()
        if (buttonType === 'SiteDetail') params.adminSiteDetailRouter()
        if (buttonType === 'AttendanceDetail' && userType == 'admin') params.adminAttendance()
        if (buttonType === 'InvRequestDetail' && userType == 'admin') params.invRequestDetailRouter()
        if (buttonType === 'InvReservationDetailRouter' && userType == 'admin') params.invReservationDetailRouter()
        if (buttonType === 'DateRouter' && userType == 'admin') params.dateRouter()
        if (buttonType === 'DepartmentManage' && userType == 'admin') params.departmentManage()
        // 現場側
        // if (buttonType === 'WSiteRouter') params.workerSite()
        if (buttonType === 'AttendanceDetail' && userType == 'worker') params.workerAttendance()
        if (buttonType === 'WorkerDetailRouter' && userType == 'worker') params.workerWorkerDetailRouter()
    }, [])

    const onPress = useCallback(() => {
        if (notification?.transitionParams?.screenName) {
            ButtonTypeFunc(notification?.transitionParams?.screenName as ScreenNameType, {
                // 管理者側
                adminConstruction: () =>
                    navigation.push('ConstructionDetailRouter', {
                        title: notification?.transitionParams?.param2,
                        constructionId: notification?.transitionParams?.param,
                        projectId: notification?.transitionParams?.param3,
                    }),
                adminConstructionDetail: () =>
                    navigation.push('ConstructionDetailRouter', {
                        title: notification?.transitionParams?.param2,
                        constructionId: notification?.transitionParams?.param,
                        projectId: notification?.transitionParams?.param3,
                        target: 'ConstructionDetail',
                    }),
                adminCompany: () =>
                    navigation.push('CompanyDetailRouter', {
                        title: notification?.transitionParams?.param2,
                        companyId: notification?.transitionParams?.param,
                    }),
                adminProfile: () => navigation.push('AdminMyPageRouter', { isHeaderLeftBack: false }),
                adminPartnerCompanyList: () => navigation.push('PartnerCompanyList', {}),
                adminContractingProjectDetailRouter: () =>
                    navigation.push('ContractingProjectDetailRouter', {
                        contractId: notification?.transitionParams?.param,
                        title: notification?.transitionParams?.param2,
                        projectId: notification?.transitionParams?.param3,
                    }),
                adminWorkerDetailRouter: () =>
                    navigation.push('WorkerDetailRouter', {
                        workerId: notification?.transitionParams?.param,
                        title: notification?.transitionParams?.param2,
                    }),
                adminSiteDetailRouter: () =>
                    navigation.push('SiteDetail', {
                        siteId: notification.transitionParams?.param,
                        title: notification.transitionParams?.param2,
                        requestId: notification.transitionParams?.param3,
                    }),
                adminAttendance: () =>
                    navigation.push('AttendanceDetail', {
                        attendanceId: notification?.transitionParams?.param,
                        arrangementId: notification?.transitionParams?.param2,
                        siteId: notification?.transitionParams?.param3 ?? '',
                    }),
                invRequestDetailRouter: () =>
                    navigation.push('InvRequestDetail', {
                        invRequestId: notification?.transitionParams?.param,
                        type: notification?.transitionParams?.param2 as 'order' | 'receive',
                    }),
                invReservationDetailRouter: () =>
                    navigation.push('InvReservationDetailRouter', {
                        invReservationId: notification?.transitionParams?.param,
                        type: notification?.transitionParams?.param2 as 'order' | 'receive',
                    }),
                dateRouter: () =>
                    navigation.push('DateRouter', {
                        date: toCustomDateFromTotalSeconds(Number(notification?.transitionParams?.param)),
                    }),
                departmentManage: () =>
                    navigation.push('DepartmentManage', {}),
                // 現場側
                // workerSite: () =>
                //     navigation.push('WSiteRouter', {
                //         // title: notification?.transitionParams?.param2
                //         siteId: notification?.transitionParams?.param,
                //     }),
                workerAttendance: () =>
                    navigation.push('AttendancePopup', {
                        attendanceId: notification?.transitionParams?.param,
                        type: 'start',
                    }),
                workerWorkerDetailRouter: () => navigation.push('MyPageRouter', {}),
            })
        }
    }, [notification, navigation])

    return (
        <ShadowBox style={{ ...styles.notificationContainer, ...style }}>
            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}>
                <Text style={[GlobalStyles.smallGrayText, styles.notificationTmpTxt]}>{notification?.createdAt ? secondsBaseText(notification?.createdAt) : t('common:UnDecided')}</Text>
                {!notification?.isAlreadyRead && <NewBadge />}
            </View>

            <Text style={[GlobalStyles.boldText, styles.notificationTitle]}>{notification?.title}</Text>
            <Text style={[GlobalStyles.smallText, styles.notificationDesc]}>{(notification?.description ?? '').replace(new RegExp('¥n', 'g'), '\n')}</Text>
            <View style={styles.notificationBtnContainer}>
                {buttonTypeTxt != undefined && (
                    <AppButton
                        style={{
                            paddingHorizontal: 20,
                        }}
                        isGray
                        hasShadow={false}
                        title={buttonTypeTxt}
                        height={22}
                        fontSize={12}
                        buttonColor={userType === 'admin' ? BlueColor.mainColor : userType === 'worker' ? GreenColor.mainColor : undefined}
                        color={userType === 'admin' ? BlueColor : userType === 'worker' ? GreenColor : undefined}
                        onPress={onPress}
                    />
                )}
            </View>
        </ShadowBox>
    )
})

const styles = StyleSheet.create({
    notificationContainer: {
        paddingBottom: 10,
        paddingTop: 5,
        paddingHorizontal: 15,
    },
    notificationTmpTxt: {
        marginTop: 10,
    },
    notificationTip: {},
    notificationTipTxt: {},
    notificationTitle: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: 8,
    },
    notificationDesc: {
        marginTop: 5,
        lineHeight: 20,
    },
    notificationBtnContainer: {},
})

interface ButtonTypeFuncParams {
    // 管理側
    adminConstruction: () => void
    adminConstructionDetail: () => void
    adminCompany: () => void
    adminProfile: () => void
    adminPartnerCompanyList: () => void
    adminContractingProjectDetailRouter: () => void
    adminWorkerDetailRouter: () => void
    adminSiteDetailRouter: () => void
    adminAttendance: () => void
    invRequestDetailRouter: () => void
    invReservationDetailRouter: () => void
    dateRouter: () => void
    departmentManage: () => void
    // 現場側
    // workerSite: () => void
    workerAttendance: () => void
    workerWorkerDetailRouter: () => void
}

class ButtonType {
    buttonType: ScreenNameType
    constructor(buttonType: ScreenNameType) {
        this.buttonType = buttonType
    }
    txt(): string | undefined {
        // 管理者側
        if (this.buttonType === 'CompanyDetailRouter') return '会社情報'
        if (this.buttonType === 'ConstructionDetailRouter') return '工事詳細（現場一覧）'
        if (this.buttonType === 'ConstructionDetail') return '工事詳細'
        if (this.buttonType === 'AdminMyPageRouter') return 'プロフィール'
        if (this.buttonType === 'PartnerCompanyList') return '顧客/取引先'
        if (this.buttonType === 'ContractingProjectDetailRouter') return '契約'
        if (this.buttonType === 'SiteDetail') return '現場詳細'
        if (this.buttonType === 'InvRequestDetail') return '常用申請詳細'
        if (this.buttonType === 'InvReservationDetailRouter') return '常用申請予定詳細'
        if (this.buttonType === 'DateRouter') return '日付管理'
        if (this.buttonType === 'DepartmentManage') return '部署管理'
        // 現場側
        // if (this.buttonType === 'WSiteRouter') return '現場詳細'
        //共通
        if (this.buttonType === 'AttendanceDetail') return '報告/勤怠詳細'
        if (this.buttonType === 'WorkerDetailRouter') return '作業員詳細'
        return undefined
    }
}
