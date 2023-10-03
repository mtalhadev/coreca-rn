/* eslint-disable indent */
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Text, View, StyleSheet, Alert } from 'react-native'
import { RootStackParamList, ScreenNameType } from '../../screens/Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { FontStyle, GlobalStyles } from '../../utils/Styles'
import { THEME_COLORS } from '../../utils/Constants'
import { AppButton } from '../atoms/AppButton'
import { StoreType } from '../../stores/Store'
import { SiteType } from '../../models/site/Site'
import { SiteArrangementCompanyType, SiteArrangementDataType, SiteArrangementWorkerType } from '../../models/arrangement/SiteArrangementDataType'
import { RequestType } from '../../models/request/Request'
import { EmptyScreen } from './EmptyScreen'
import { BottomSheetArrangementDetailType, WorkerDetailBottomSheet } from '../organisms/WorkerDetailBottomSheet'
import { useTextTranslation } from '../../fooks/useTextTranslation'
import { InvRequestType } from '../../models/invRequest/InvRequestType'
import { InvReservationType } from '../../models/invReservation/InvReservation'
import { ID } from '../../models/_others/ID'
import { CustomResponse } from '../../models/_others/CustomResponse'
import ArrangedBox from '../organisms/arrangement/ArrangedBox'
import { WorkerType } from '../../models/worker/Worker'
import PreArrangeBox from '../organisms/arrangement/PreArrangeBox'

/**
 * ここで持ってきているものは、テンプレート側で値を変更しても反映されないので、こちら側で値を変えてはいけない。
 */
export type ArrangementManageProps = {
    localUpdate: number

    setting?: SiteManageSetting
    site?: SiteType
    respondRequest?: RequestType
    cantManage?: boolean
    invRequest?: InvRequestType
    invReservation?: InvReservationType

    arrangementData?: SiteArrangementDataType

    //申請のまとめて手配にて
    isBundleArrange?: boolean //手配反映
    isBundleConfirmed?: boolean

    /**
     * ここからpropsになって追加された分
     */
    invRequestId?: ID
    invReservationId?: ID

    /**
     *
     * WorkerDetailBottomSheetで使用
     */
    bottomOnClose: () => void
    onSetToHoliday?: (worker?: SiteArrangementWorkerType) => void
    onSetToSiteManager?: (worker?: SiteArrangementWorkerType) => void
    _setPreviousArrangements?: () => Promise<void>
    _setCertain: () => Promise<void>
    onDeleteReservation?: (reservationId?: ID, siteRequestCount?: number) => void
    onSetSiteManagerOtherSide?: (worker?: WorkerType) => void

    navigation: StackNavigationProp<RootStackParamList, ScreenNameType>
    myWorkerId?: ID
    _onPressAtPostSelfContent: (item: SiteArrangementWorkerType) => Promise<CustomResponse>
    _onPressAtPostOtherContent?: (item: SiteArrangementCompanyType, arrangeCount: number) => Promise<CustomResponse>
    _onPressAtPreSelfContent: (item: SiteArrangementWorkerType, arrangeCount: number) => Promise<CustomResponse>
    _onPressAtPreOtherContent?: (item: SiteArrangementCompanyType) => Promise<CustomResponse>

    /**
     * 作業員または会社の長押し状態をエラーなどを理由に解除する
     */
    updateArrangementDetail?: number
    isDraft?: boolean
}

type InitialStateType = {
    UIUpdate: number

    // 詳細表示用
    arrangementDetail?: BottomSheetArrangementDetailType
    isConfirmed?: boolean
}

/**
 * ここのプロパティは全てScreenの方にあってはいけない。
 */
const initialState: InitialStateType = {
    UIUpdate: 0,
}

export type SiteManageSetting = {
    hideMeter?: boolean
    hideArrangeableWorkers?: boolean
    hideCopyHistory?: boolean
    perspective?: 'my-company' | 'other-company'
    displayNothing?: boolean
}

const ArrangementManage = (props: ArrangementManageProps) => {
    const { t } = useTextTranslation()

    const {
        localUpdate,
        respondRequest,
        cantManage,
        site,
        setting,
        arrangementData,
        invRequest,
        invReservation,
        isBundleArrange,
        isBundleConfirmed,
        invRequestId,
        invReservationId,
        bottomOnClose,
        onSetToHoliday,
        onSetToSiteManager,
        onDeleteReservation,
        _setPreviousArrangements,
        _setCertain,

        navigation,
        myWorkerId,
        _onPressAtPostSelfContent,
        _onPressAtPostOtherContent,
        _onPressAtPreSelfContent,
        _onPressAtPreOtherContent,
        onSetSiteManagerOtherSide,
        updateArrangementDetail,
        isDraft,
    } = props

    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)
    const [{ UIUpdate, arrangementDetail, isConfirmed }, setState] = useState(initialState)

    useEffect(() => {
        setState((prev) => ({ ...prev, arrangementDetail: undefined }))
    }, [updateArrangementDetail])

    useEffect(() => {
        setState((prev) => ({ ...prev, UIUpdate: UIUpdate + 1 }))
    }, [localUpdate])

    useEffect(() => {
        if (isDraft) setState((prev) => ({ ...prev, isConfirmed: false }))
    }, [isDraft])

    const _onSetSiteManagerOtherSide = (worker?: WorkerType) => {
        if (onSetSiteManagerOtherSide) {
            onSetSiteManagerOtherSide(worker)
        }
        bottomOnClose()
    }

    return (
        <View
            style={{
                backgroundColor: '#fff',
                flex: 1,
            }}>
            {(site?.siteId != undefined || invRequestId != undefined || invReservationId != undefined) && setting?.displayNothing == true && (
                <>
                    <EmptyScreen text={t('common:NoArrangementInfoToDisplay')} />
                </>
            )}
            {(site?.siteId != undefined || invRequestId != undefined || invReservationId != undefined) && setting?.displayNothing != true && (
                <>
                    {respondRequest != undefined && invRequestId == undefined && (
                        <View
                            style={{
                                backgroundColor: THEME_COLORS.OTHERS.LIGHT_ORANGE,
                                padding: 5,
                                paddingLeft: 10,
                                paddingTop: 7,
                                alignItems: 'center',
                            }}>
                            <Text
                                style={{
                                    ...GlobalStyles.mediumText,
                                }}>
                                {t('common:SupportRequest')}
                            </Text>
                        </View>
                    )}
                    <View
                        style={{
                            marginTop: 10,
                            flex: 1,
                        }}>
                        <ArrangedBox
                            UIUpdate={UIUpdate}
                            setting={setting}
                            cantManage={cantManage}
                            invRequest={invRequest}
                            arrangementData={arrangementData}
                            siteId={site?.siteId}
                            invRequestId={invRequestId}
                            invReservationId={invReservationId}
                            _onPressAtPostSelfContent={_onPressAtPostSelfContent}
                            _onPressAtPostOtherContent={_onPressAtPostOtherContent}
                            onUIUpdate={() => {
                                setState((prev) => ({ ...prev, UIUpdate: UIUpdate + 1 }))
                            }} //TODO:この方法を使えば、localUpdateとUIUpdateを統一できないか
                            onConfirmed={(item: boolean) => {
                                setState((prev) => ({ ...prev, isConfirmed: item }))
                            }}
                            displayDetail={(type, item) => {
                                setState((prev) => ({ ...prev, arrangementDetail: { type, [type]: { ...item } } }))
                            }}
                            isEdit={true}
                        />
                        <View
                            style={{
                                flexDirection: 'row',
                                marginRight: 10,
                                marginTop: 5,
                            }}>
                            {setting?.hideArrangeableWorkers != true && setting?.hideCopyHistory != true && _setPreviousArrangements && (
                                <AppButton
                                    isGray={true}
                                    height={25}
                                    fontSize={12}
                                    title={t('common:DuplicatePreviousArrangement')}
                                    style={{
                                        flex: 1,
                                        marginLeft: 10,
                                    }}
                                    onPress={() => {
                                        Alert.alert(t('common:OverwrittenByPreviousSite'), '', [
                                            { text: t('common:Superscription'), onPress: () => _setPreviousArrangements() },
                                            {
                                                text: t('common:Cancel'),
                                                style: 'cancel',
                                            },
                                        ])
                                    }}
                                />
                            )}
                            {setting?.hideArrangeableWorkers != true && _setCertain != undefined && (
                                <AppButton
                                    title={
                                        invReservation
                                            ? isBundleArrange
                                                ? isBundleConfirmed
                                                    ? t('common:alreadySubmitted')
                                                    : t('common:FinalizeAndFileAnApplication')
                                                : t('common:ReflectTheArrangement')
                                            : isConfirmed == false
                                            ? t('common:FinalizeAndNotif')
                                            : invRequest
                                            ? site
                                                ? site.isConfirmed
                                                    ? t('common:Settled')
                                                    : t('common:FinalizeAndNotif')
                                                : invRequest?.isApplication
                                                ? t('common:alreadySubmitted')
                                                : t('common:FinalizeAndFileAnApplication')
                                            : respondRequest == undefined
                                            ? site?.isConfirmed
                                                ? t('common:Settled')
                                                : t('common:FinalizeAndNotif')
                                            : respondRequest.isConfirmed
                                            ? t('common:Settled')
                                            : t('common:FinalizeAndNotif')
                                    }
                                    height={25}
                                    disabled={
                                        isConfirmed == false
                                            ? false
                                            : invReservation
                                            ? isBundleConfirmed
                                            : invRequest
                                            ? site
                                                ? site.isConfirmed
                                                : invRequest.isApplication
                                            : respondRequest == undefined
                                            ? site?.isConfirmed
                                            : respondRequest.isConfirmed
                                    }
                                    fontSize={12}
                                    style={{
                                        flex: 1,
                                        marginLeft: 5,
                                        // Androidでこのボタンだけ謎に浮き出る問題がある。
                                        elevation: 0,
                                    }}
                                    onPress={() => _setCertain()}
                                />
                            )}
                        </View>
                    </View>
                    <PreArrangeBox
                        cantManage={cantManage}
                        site={site}
                        setting={setting}
                        arrangementData={arrangementData}
                        invRequestId={invRequestId}
                        invReservationId={invReservationId}
                        navigation={navigation}
                        myWorkerId={myWorkerId}
                        _onPressAtPreSelfContent={_onPressAtPreSelfContent} //そもそもcontextを使った方がいいかもしれない。バケツリレーになってる
                        _onPressAtPreOtherContent={_onPressAtPreOtherContent}
                        displayDetail={(type, item) => {
                            setState((prev) => ({ ...prev, arrangementDetail: { type, [type]: { ...item } } }))
                        }}
                        onUIUpdate={() => {
                            setState((prev) => ({ ...prev, UIUpdate: UIUpdate + 1 }))
                        }} //TODO:この方法を使えば、localUpdateとUIUpdateを統一できないか
                        UIUpdate={UIUpdate}
                        onConfirmed={(item: boolean) => {
                            setState((prev) => ({ ...prev, isConfirmed: item }))
                        }}
                    />
                </>
            )}
            {invReservationId == undefined && (
                <WorkerDetailBottomSheet
                    arrangementDetail={arrangementDetail}
                    isOpen={arrangementDetail != undefined}
                    onClose={bottomOnClose}
                    onSetToHoliday={onSetToHoliday}
                    onSetToSiteManager={onSetToSiteManager}
                    myCompanyId={myCompanyId}
                    onDeleteReservation={onDeleteReservation}
                    onSetSiteManagerOtherSide={_onSetSiteManagerOtherSide}
                />
            )}
        </View>
    )
}
export default ArrangementManage

const styles = StyleSheet.create({
    workerTitle: {
        fontFamily: FontStyle.regular,
        fontSize: 10,
        lineHeight: 12,
        marginBottom: 5,
        color: THEME_COLORS.OTHERS.GRAY,
    },
})
