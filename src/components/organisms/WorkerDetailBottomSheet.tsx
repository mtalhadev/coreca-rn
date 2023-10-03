/* eslint-disable indent */
import { useNavigation } from '@react-navigation/native'
import React, { useState } from 'react'
import { Pressable, View, ViewStyle, Platform, Alert } from 'react-native'
import { isIphoneX } from 'react-native-iphone-screen-helper'
import { useSelector } from 'react-redux'
import { AppButton } from '../atoms/AppButton'
import { Icon } from '../atoms/Icon'
import { TableArea } from '../atoms/TableArea'
import { BottomSheet } from '../template/BottomSheet'
import { SiteArrangementCompanyType, SiteArrangementWorkerType } from '../../models/arrangement/SiteArrangementDataType'
import { StoreType } from '../../stores/Store'
import { goToCompanyDetail } from '../../usecases/company/CommonCompanyCase'
import { BOTTOM_TAB_BASE_HEIGHT, IPHONEX_BOTTOM_HEIGHT, THEME_COLORS } from '../../utils/Constants'
import { useTextTranslation } from '../../fooks/useTextTranslation'
import { ID } from '../../models/_others/ID'
import DisplayIdInDev from '../atoms/DisplayIdInDEV'
import RespondedWorkers from './arrangement/RespondedWorkers'
import { Company } from './company/Company'
import { WorkerType } from '../../models/worker/Worker'
import { Worker } from './worker/Worker'

export type BottomSheetArrangementDetailType = {
    type?: 'company' | 'worker'
    company?: SiteArrangementCompanyType
    worker?: SiteArrangementWorkerType
}

/**
 * @param arrangementDetail - 存在すれば
 */
export type WorkerDetailBottomSheetProps = {
    onClose?: () => void
    onSetToSiteManager?: (worker?: SiteArrangementWorkerType) => void
    onSetSiteManagerOtherSide?: (worker?: WorkerType) => void
    onSetToHoliday?: (worker?: SiteArrangementWorkerType) => void
    onDeleteReservation?: (reservationId?: ID, siteRequestCount?: number) => void
    isOpen?: boolean
    myCompanyId?: string
    arrangementDetail?: BottomSheetArrangementDetailType
    style?: ViewStyle
}

export const WorkerDetailBottomSheet = (props: Partial<WorkerDetailBottomSheetProps>) => {
    const { arrangementDetail, isOpen, onSetToHoliday, onSetSiteManagerOtherSide, onSetToSiteManager, onDeleteReservation, onClose, myCompanyId, style } = props

    const isKeyboardOpen = useSelector((state: StoreType) => state.util.isKeyboardOpen)
    const navigation = useNavigation<any>()
    const [isShowRespondedWorkers, setIsShowRespondedWorkers] = useState(Boolean)
    const siteRequestCount = arrangementDetail?.company?.targetRequest?.requestCount ?? 0
    const { t } = useTextTranslation()
    const _onSetSiteManagerOtherSide = (worker: WorkerType) => {
        if (onSetSiteManagerOtherSide) {
            onSetSiteManagerOtherSide(worker)
        }
        setIsShowRespondedWorkers(false)
    }

    const _workers = arrangementDetail?.company?.targetRequest?.subAttendances?.items?.map((att) => att.worker).filter((data) => data != undefined) as WorkerType[]

    return (
        <BottomSheet
            style={style}
            height={(arrangementDetail?.type == 'worker' ? 420 : 600) + (isKeyboardOpen ? 150 : 0) + (Platform.OS === 'ios' ? BOTTOM_TAB_BASE_HEIGHT : 0) + (isIphoneX() ? IPHONEX_BOTTOM_HEIGHT : 0)}
            onClose={() => {
                setIsShowRespondedWorkers(false)
                if (onClose) {
                    onClose()
                }
            }}
            isOpen={isOpen}>
            {arrangementDetail != undefined && (
                <View
                    style={{
                        backgroundColor: arrangementDetail?.type == 'company' ? THEME_COLORS.OTHERS.BACKGROUND : '#fff',
                    }}>
                    <View
                        style={{
                            backgroundColor: THEME_COLORS.OTHERS.BACKGROUND,
                            flexDirection: 'row',
                            borderBottomWidth: 1,
                            borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                        }}>
                        <View
                            style={{
                                flex: 1,
                                paddingTop: 20,
                                paddingLeft: 20,
                                paddingBottom: 15,
                            }}>
                            {arrangementDetail?.type == 'company' && (
                                <Pressable
                                    onPress={() => {
                                        goToCompanyDetail(navigation, arrangementDetail?.company?.requestedCompany?.companyId, arrangementDetail?.company?.requestedCompany?.name, myCompanyId)
                                    }}>
                                    <Company
                                        style={{
                                            flex: 0,
                                        }}
                                        company={arrangementDetail?.company?.requestedCompany}
                                    />
                                </Pressable>
                            )}
                            {arrangementDetail?.type == 'worker' && (
                                <Pressable
                                    onPress={() => {
                                        navigation.push(
                                            'WorkerDetailRouter' as never,
                                            {
                                                workerId: arrangementDetail?.worker?.worker?.workerId,
                                                title: arrangementDetail?.worker?.worker?.name,
                                            } as never,
                                        )
                                    }}>
                                    <Worker worker={arrangementDetail?.worker?.worker} />
                                </Pressable>
                            )}
                        </View>

                        <Pressable
                            style={{
                                // paddingHorizontal: 10,
                                paddingLeft: 20,
                                paddingTop: 15,
                                paddingRight: 15,
                                alignItems: 'center',
                            }}
                            onPress={() => {
                                setIsShowRespondedWorkers(false)
                                if (onClose) {
                                    onClose()
                                }
                            }}>
                            <Icon name={'close'} width={16} height={16} fill={THEME_COLORS.OTHERS.GRAY} />
                        </Pressable>
                    </View>
                    {arrangementDetail?.type == 'worker' && (
                        <>
                            <View
                                style={{
                                    backgroundColor: '#fff',
                                }}>
                                <TableArea
                                    contentRatio={0.7}
                                    style={{
                                        margin: 15,
                                        marginBottom: 5,
                                    }}
                                    columns={[
                                        {
                                            key: '今日の合計手配回数',
                                            content: `${arrangementDetail?.worker?.dailyArrangements?.items?.length ?? 0}（${t('common:ThisSite')} ${
                                                arrangementDetail?.worker?.targetArrangement ? 1 : 0
                                            }）`,
                                        },
                                        {
                                            key: '休み',
                                            content: `${arrangementDetail?.worker?.worker?.workerTags?.includes('is-holiday') ? t('common:Yes') : t('common:No')}`,
                                            textColor: arrangementDetail?.worker?.worker?.workerTags?.includes('is-holiday') ? THEME_COLORS.OTHERS.ALERT_RED : undefined,
                                        },
                                    ]}
                                />
                            </View>
                            {arrangementDetail?.worker?.targetArrangement != undefined && onSetToSiteManager && (
                                <AppButton
                                    isGray
                                    style={{
                                        marginHorizontal: 20,
                                        marginTop: 10,
                                    }}
                                    height={35}
                                    title={t('admin:PutSomeoneIncharge')}
                                    onPress={() => {
                                        if (arrangementDetail?.worker && onSetToSiteManager) {
                                            onSetToSiteManager(arrangementDetail.worker)
                                        }
                                    }}
                                />
                            )}
                            {!(arrangementDetail?.worker?.worker?.workerTags?.includes('is-holiday') == true) && arrangementDetail?.worker?.worker?.companyId == myCompanyId && onSetToHoliday && (
                                <AppButton
                                    isGray
                                    style={{
                                        marginHorizontal: 20,
                                        marginTop: 10,
                                    }}
                                    height={35}
                                    title={t('admin:MakeAVacation')}
                                    onPress={() => {
                                        if (arrangementDetail?.worker && onSetToHoliday) {
                                            onSetToHoliday(arrangementDetail?.worker)
                                        }
                                    }}
                                />
                            )}
                        </>
                    )}
                    {arrangementDetail?.type == 'company' && isShowRespondedWorkers != true && (
                        <>
                            <View
                                style={{
                                    backgroundColor: '#fff',
                                }}>
                                <TableArea
                                    contentRatio={2}
                                    style={{
                                        margin: 15,
                                    }}
                                    columns={[
                                        {
                                            key: '常用依頼',
                                            content: `${siteRequestCount}名`,
                                        },

                                        {
                                            key: '応答人数',
                                            content: `${arrangementDetail.company?.targetRequest?.subRespondCount ?? 0}${t('common:Name')} / ${siteRequestCount}${t('common:BeingFamous')}`,
                                        },
                                    ]}
                                />
                            </View>
                            {onDeleteReservation && (
                                <AppButton
                                    style={{
                                        marginTop: 40,
                                        marginHorizontal: 20,
                                    }}
                                    title={t('admin:DeleteReservation')}
                                    onPress={() => {
                                        Alert.alert(t('admin:WantToDeleteReservationTitle'), t('admin:WantToDeleteReservationMessage'), [
                                            {
                                                text: t('admin:Deletion'),
                                                onPress: () => onDeleteReservation(arrangementDetail.company?.targetReservation?.reservationId, siteRequestCount),
                                            },
                                            {
                                                text: t('admin:Cancel'),
                                                style: 'cancel',
                                            },
                                        ])
                                    }}
                                />
                            )}
                            {onSetToSiteManager && siteRequestCount > 0 && (
                                <AppButton
                                    style={{
                                        marginTop: 40,
                                        marginHorizontal: 20,
                                    }}
                                    title={t('common:SetPersonInCharge')}
                                    onPress={() => {
                                        setIsShowRespondedWorkers(true)
                                    }}
                                />
                            )}
                            <DisplayIdInDev id={arrangementDetail.company?.targetReservation?.reservationId} label="reservationId" />
                        </>
                    )}
                    {isShowRespondedWorkers && <RespondedWorkers workers={_workers} onSetSiteManager={_onSetSiteManagerOtherSide} />}
                </View>
            )}
        </BottomSheet>
    )
}
