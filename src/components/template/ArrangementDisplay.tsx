/* eslint-disable indent */
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Text, View } from 'react-native'
import { FontStyle, GlobalStyles } from '../../utils/Styles'
import { IPHONEX_BOTTOM_HEIGHT, THEME_COLORS } from '../../utils/Constants'
import { AppButton } from '../atoms/AppButton'
import { StoreType } from '../../stores/Store'
import { ifIphoneX } from 'react-native-iphone-screen-helper'
import { SiteArrangementDataType } from '../../models/arrangement/SiteArrangementDataType'
import { RequestType } from '../../models/request/Request'
import { EmptyScreen } from './EmptyScreen'
import { useTextTranslation } from '../../fooks/useTextTranslation'
import { InvRequestType } from '../../models/invRequest/InvRequestType'
import { ID } from '../../models/_others/ID'
import ArrangedBox from '../organisms/arrangement/ArrangedBox'
import TriangleSvg from '../../../assets/images/arrangeTriangle.svg'
import { BottomMargin } from '../atoms/BottomMargin'
import { WorkerDetailBottomSheet, BottomSheetArrangementDetailType } from '../organisms/WorkerDetailBottomSheet'
import { SiteManageSetting } from './ArrangementManage'

/**
 * ここで持ってきているものは、テンプレート側で値を変更しても反映されないので、こちら側で値を変えてはいけない。
 */
export type ArrangementManageProps = {
    localUpdate: number

    setting?: SiteManageSetting
    respondRequest?: RequestType
    cantManage?: boolean
    invRequest?: InvRequestType

    arrangementData?: SiteArrangementDataType
    draftArrangementData?: SiteArrangementDataType

    siteId?: ID
    invRequestId?: ID
    invReservationId?: ID
    onCertain?: () => void
    onEdit?: () => void
    onDeleteLocalData?: () => void
    footer?: () => JSX.Element
}

type InitialStateType = {
    UIUpdate: number
    // 詳細表示用
    arrangementDetail?: BottomSheetArrangementDetailType
}

/**
 * ここのプロパティは全てScreenの方にあってはいけない。
 */
const initialState: InitialStateType = {
    UIUpdate: 0,
}

const ArrangementDisplay = (props: ArrangementManageProps) => {
    const { t } = useTextTranslation()

    const {
        localUpdate,
        respondRequest,
        setting,
        invRequest,
        cantManage,
        arrangementData,
        draftArrangementData,
        siteId,
        invRequestId,
        invReservationId,
        onCertain,
        onEdit,
        onDeleteLocalData,
        footer,
    } = props

    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)

    const [{ UIUpdate, arrangementDetail }, setState] = useState(initialState)

    useEffect(() => {
        setState((prev) => ({ ...prev, UIUpdate: UIUpdate + 1 }))
    }, [localUpdate])

    return (
        <View
            style={{
                backgroundColor: '#fff',
                flex: 1,
            }}>
            {(siteId != undefined || invRequestId != undefined || invReservationId != undefined) && setting?.displayNothing == true && <EmptyScreen text={t('common:NoArrangementInfoToDisplay')} />}
            {(siteId != undefined || invRequestId != undefined || invReservationId != undefined) && setting?.displayNothing != true && (
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
                    {/* TODO:この辺りで必要としていた情報が不要になったので、取得情報が減らせるかもしれない */}
                    {/* {site != undefined && (
                        <SiteHeader
                            displayDay
                            titleStyle={
                                {
                                    ...GlobalStyles.smallGrayText,
                                } as ViewStyle
                            }
                            style={{
                                marginHorizontal: 10,
                                marginTop: 8,
                            }}
                            isRequest={respondRequest != undefined}
                            site={{
                                ...site,
                                siteRelation: arrangementData?.siteRelation,
                                isConfirmed: respondRequest == undefined ? site.isConfirmed : respondRequest.isConfirmed,
                                siteMeter: setting?.hideMeter ? undefined : targetMeter,
                            }}
                        />
                    )} */}
                    {/* {site == undefined && invRequest != undefined && arrangementData != undefined && (invRequest.myCompanyId == myCompanyId || invRequest.isApplication == true) && (
                        <InvRequestHeader
                            style={{
                                marginHorizontal: 10,
                                marginTop: 8,
                            }}
                            presentCount={arrangementData?.selfSide?.filter((side) => side.targetInvRequest?.invRequestId == invRequestId)?.length ?? 0}
                            invRequest={invRequest}
                        />
                    )}
                    {invReservation != undefined && arrangementData != undefined && (
                        <InvReservationHeader
                            style={{
                                marginHorizontal: 10,
                                marginTop: 8,
                            }}
                            presentCount={arrangementData?.selfSide?.filter((side) => side.targetInvRequest?.invRequestId == invReservationId)?.length ?? 0}
                            invReservation={invReservation}
                            isDisplayMeter
                        />
                    )} */}
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
                            siteId={siteId}
                            invRequestId={invRequestId}
                            invReservationId={invReservationId}
                            displayDetail={(type, item) => {
                                setState((prev) => ({ ...prev, arrangementDetail: { type, [type]: { ...item } } }))
                            }}
                            isEdit={false}
                        />
                        <View
                            style={{
                                flexDirection: 'row',
                                marginRight: 10,
                                marginTop: 5,
                            }}></View>
                    </View>
                    {setting?.hideArrangeableWorkers != true ? (
                        draftArrangementData ? (
                            <View
                                style={{
                                    marginTop: 15,
                                    flex: 1,
                                    backgroundColor: THEME_COLORS.OTHERS.PURPLE_GRAY,
                                    borderTopWidth: 1,
                                    borderColor: THEME_COLORS.OTHERS.GRAY,
                                    ...ifIphoneX(
                                        {
                                            paddingBottom: 5 + IPHONEX_BOTTOM_HEIGHT,
                                        },
                                        {
                                            paddingBottom: 5,
                                        },
                                    ),
                                }}>
                                <TriangleSvg
                                    width={100}
                                    height={30}
                                    fill={THEME_COLORS.OTHERS.PURPLE_GRAY}
                                    style={{
                                        alignSelf: 'center',
                                        marginTop: -21,
                                        zIndex: 1,
                                    }}
                                />
                                <TriangleSvg
                                    width={100}
                                    height={30}
                                    fill={THEME_COLORS.OTHERS.GRAY}
                                    style={{
                                        alignSelf: 'center',
                                        marginTop: -22,
                                        zIndex: 0,
                                        position: 'absolute',
                                    }}
                                />
                                <View
                                    style={{
                                        alignItems: 'center',
                                        marginBottom: 5,
                                        marginTop: -8,
                                    }}>
                                    <Text
                                        style={{
                                            // marginTop: 5,
                                            fontFamily: FontStyle.regular,
                                            fontSize: 12,
                                            lineHeight: 18,
                                        }}>
                                        {t('admin:UnconfirmedEdits')}
                                    </Text>
                                </View>
                                <ArrangedBox
                                    UIUpdate={UIUpdate}
                                    setting={setting}
                                    cantManage={cantManage}
                                    invRequest={invRequest}
                                    arrangementData={draftArrangementData}
                                    siteId={siteId}
                                    invRequestId={invRequestId}
                                    invReservationId={invReservationId}
                                    displayDetail={(type, item) => {
                                        setState((prev) => ({ ...prev, arrangementDetail: { type, [type]: { ...item } } }))
                                    }}
                                    isEdit={false}
                                />
                                {onEdit != undefined && (
                                    <AppButton
                                        title={t('common:EditBy')}
                                        height={40}
                                        fontSize={12}
                                        style={{
                                            marginTop: 10,
                                            marginHorizontal: 5,
                                            // Androidでこのボタンだけ謎に浮き出る問題がある。
                                            elevation: 0,
                                        }}
                                        onPress={() => onEdit()}
                                    />
                                )}
                                {onCertain != undefined && (
                                    <AppButton
                                        title={t('common:FinalizeAndNotif')}
                                        height={40}
                                        fontSize={12}
                                        style={{
                                            marginTop: 10,
                                            marginHorizontal: 5,
                                            // Androidでこのボタンだけ謎に浮き出る問題がある。
                                            elevation: 0,
                                        }}
                                        onPress={() => onCertain()}
                                    />
                                )}
                                {__DEV__ && onDeleteLocalData != undefined && (
                                    //デバッグ用に作成したが、本番にもあった方が良いか
                                    <AppButton
                                        title={t('admin:DeletePendingEdits')}
                                        height={40}
                                        fontSize={12}
                                        style={{
                                            marginTop: 10,
                                            marginHorizontal: 5,
                                            // Androidでこのボタンだけ謎に浮き出る問題がある。
                                            elevation: 0,
                                            marginBottom: 10,
                                        }}
                                        onPress={() => onDeleteLocalData()}
                                    />
                                )}
                            </View>
                        ) : (
                            onEdit != undefined && (
                                <>
                                    <AppButton
                                        title={t('common:EditBy')}
                                        height={40}
                                        fontSize={12}
                                        style={{
                                            marginTop: 10,
                                            marginHorizontal: 5,
                                            // Androidでこのボタンだけ謎に浮き出る問題がある。
                                            elevation: 0,
                                            marginBottom: 10,
                                        }}
                                        onPress={() => onEdit()}
                                    />
                                    <BottomMargin />
                                </>
                            )
                        )
                    ) : (
                        <View
                            style={{
                                ...ifIphoneX(
                                    {
                                        paddingBottom: 10 + IPHONEX_BOTTOM_HEIGHT,
                                    },
                                    {
                                        paddingBottom: 10,
                                    },
                                ),
                            }}></View>
                    )}
                    {footer && footer()}
                </>
            )}
            {invReservationId == undefined && (
                <WorkerDetailBottomSheet
                    arrangementDetail={arrangementDetail}
                    isOpen={arrangementDetail != undefined}
                    onClose={() => setState((prev) => ({ ...prev, arrangementDetail: undefined }))}
                    myCompanyId={myCompanyId}
                />
            )}
        </View>
    )
}
export default ArrangementDisplay
