import React from 'react'
import { Alert, Text, View, ViewStyle } from 'react-native'

import { GlobalStyles } from '../../../utils/Styles'

import { THEME_COLORS } from '../../../utils/Constants'

import { CompanyType } from '../../../models/company/Company'
import { RequestType } from '../../../models/request/Request'
import { Company } from '../company/Company'
import { Tag } from '../Tag'
import { SiteMeter } from '../site/SiteMeter'
import { WorkerType } from '../../../models/worker/Worker'
import { WorkerList } from '../worker/WorkerList'
import { SiteType } from '../../../models/site/Site'
import { Prefix } from '../Prefix'
import { match } from 'ts-pattern'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { AppButton } from '../../atoms/AppButton'
import { updateRequestIsApproval } from '../../../usecases/request/CommonRequestCase'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { useDispatch, useSelector } from 'react-redux'
import { useIsFocused, useNavigation } from '@react-navigation/native'
import { InvRequestPrefix } from '../invRequest/InvRequestPrefix'
import { InvRequestStatusType } from '../../../models/invRequest/InvRequestType'
import flatten from 'lodash/flatten'
import { toIdAndMonthFromTotalSeconds, UpdateScreenType } from '../../../models/updateScreens/UpdateScreens'
import uniqBy from 'lodash/uniqBy'
import { StoreType } from '../../../stores/Store'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { WorkerIconUIType } from '../worker/WorkerIcon'
// const {t} = useTextTranslation()

export type RequestDirectionType = 'receive' | 'order'

/**
 * @requires
 * @param request - 依頼//TODO:requestMeterのworkersとともに、subRequests:{requestedCompany}も取得
 * @param type - 受注か発注 order=受注/receive=発注になっている
 * @partial
 * @param iconSize - 顧客/依頼先会社のアイコンサイズ
 * @param orderRequestCount -  依頼一覧/明細にて個別指定する際に必要
 * @param orderPresentCount  - 依頼一覧/明細にて個別指定する際に必要
 * @param requestedCompanies  - 依頼一覧/明細にて個別指定する際に必要
 * @param noIcon -  boolean
 * @param subArrangedWorkers -  依頼一覧/明細にて個別指定する際に必要
 * @param subRequests -  依頼一覧/明細にて個別指定する際に必要
 * @param style -  スタイル指定
 * @param data -  SiteType
 * @param displayMeter -  SiteMeterの表示/非表示
 * @param displayHeader -  受発注の表示/非表示
 * @param displayRespondCount - 作業員リストで応答数を表示する。デフォルトは依頼数。
 */
export type RequestProps = {
    request?: RequestType
    type?: RequestDirectionType
    iconSize?: number
    orderRequestCount?: number
    orderPresentCount?: number
    requestedCompanies?: CompanyType[]
    displayRespondCount?: boolean
    noIcon?: boolean
    subArrangedWorkers?: WorkerType[]
    subRequests?: RequestType[]
    style?: ViewStyle
    data?: SiteType
    displayMeter?: boolean
    displayHeader?: boolean
    workerOnPress?: (item: WorkerIconUIType) => void
    markingWorkerIds?: string[]
}

export const Request = React.memo((props: Partial<RequestProps>) => {
    const {
        request,
        style,
        displayRespondCount,
        displayHeader,
        iconSize,
        orderRequestCount,
        orderPresentCount,
        requestedCompanies,
        noIcon,
        subArrangedWorkers,
        subRequests,
        type,
        displayMeter,
        workerOnPress,
        markingWorkerIds,
    } = props

    const navigation = useNavigation<any>()
    const { t } = useTextTranslation()
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const _onApproveRequest = async (isApproval: boolean) => {
        Alert.alert(isApproval ? t('admin:DoYouWishToApproveTheSupportRequest') : t('admin:DoYouWantToDisapproveTheSupportRequest'), undefined, [
            { text: isApproval ? t('admin:Approve') : t('admin:NotApprove'), onPress: () => _setApproveRequest(isApproval) },
            {
                text: t('common:Cancel'),
                style: 'cancel',
            },
        ])
    }

    const _setApproveRequest = async (isApproval: boolean) => {
        try {
            const isApprovalResult = await updateRequestIsApproval({ requestId: request?.requestId, isApproval })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (isApprovalResult.error) {
                throw {
                    error: isApprovalResult.error,
                }
            }
            const companyIdAndDate = toIdAndMonthFromTotalSeconds(myCompanyId, request?.date)

            const newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'CompanyInvoice',
                    idAndDates: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'CompanyInvoice').map((screen) => screen.idAndDates)), companyIdAndDate]?.filter(
                        (data) => data != undefined,
                    ) as string[],
                },
                {
                    screenName: 'SiteDetail',
                    ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'SiteDetail').map((screen) => screen.ids)), request?.siteId]?.filter(
                        (data) => data != undefined,
                    ) as string[],
                },
            ]
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            dispatch(setIsNavUpdating(true))
            dispatch(
                setToastMessage({
                    text: isApproval ? t('admin:ApprovedTheRequestForSupport') : t('admin:TheRequestForSupportWasDenied'),
                    type: 'success',
                } as ToastMessage),
            )
            navigation.push('SiteDetail', {
                title: request?.site?.siteNameData?.name,
                siteId: request?.siteId,
                siteNumber: request?.site?.siteNameData?.siteNumber,
                requestId: request?.requestId,
            })
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    return (
        <View style={[style]}>
            {displayHeader == true && (
                <View
                    style={{
                        backgroundColor: THEME_COLORS.OTHERS.GRAY,
                        paddingVertical: 5,
                        paddingLeft: 10,
                        borderTopEndRadius: 10,
                        borderTopStartRadius: 10,
                        marginTop: -10,
                        marginHorizontal: -10,
                        marginBottom: 8,
                    }}>
                    <Text
                        style={{
                            ...GlobalStyles.smallText,
                            color: '#fff',
                        }}>
                        {match(type)
                            .with('order', () => (orderRequestCount || orderPresentCount || requestedCompanies ? t('common:RequestOrdering') : t('common:RequestReceiving')))
                            .with('receive', () => t('common:RequestOrdering'))
                            .otherwise(() => '')}
                    </Text>
                </View>
            )}

            {type == 'order' && (
                /**
                 * 常用を頼まれる場合
                 */
                <View>
                    {request?.isApproval == 'waiting' && (
                        <View
                            style={{
                                flexDirection: 'row',
                                marginVertical: 5,
                            }}>
                            <AppButton
                                title={t('admin:Approve')}
                                onPress={() => _onApproveRequest(true)}
                                height={40}
                                hasShadow
                                iconSize={5}
                                // buttonColor
                                style={{
                                    flex: 1,
                                    marginBottom: 5,
                                }}
                            />
                            <AppButton
                                title={t('admin:NotApprove')}
                                onPress={() => _onApproveRequest(false)}
                                height={40}
                                hasShadow
                                iconSize={5}
                                style={{
                                    flex: 1,
                                    marginBottom: 5,
                                    marginLeft: 5,
                                }}
                            />
                        </View>
                    )}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 5,
                            flex: 1,
                        }}>
                        <InvRequestPrefix
                            type={
                                match(request?.isApproval)
                                    .with(true, () => 'approval')
                                    .with(false, () => 'unauthorized')
                                    .with('waiting', () => 'waiting')
                                    .otherwise(() => 'unapplied') as InvRequestStatusType
                            }
                            fontSize={9}
                            style={{ marginRight: 5 }}
                        />
                        <Tag tag={t('common:Client')} color={THEME_COLORS.OTHERS.TABLE_AREA_PURPLE} fontColor={THEME_COLORS.OTHERS.GRAY} />
                        {noIcon ? (
                            <Text
                                style={{
                                    ...GlobalStyles.smallGrayText,
                                    marginLeft: 5,
                                }}>
                                {request?.company?.name}
                            </Text>
                        ) : (
                            <Company
                                style={{
                                    marginLeft: 15,
                                    flex: 1,
                                }}
                                iconSize={iconSize}
                                hasLastDeal={false}
                                company={request?.company}
                            />
                        )}
                    </View>
                </View>
            )}
            {type == 'receive' && (
                /**
                 * 常用を頼む場合
                 */
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 5,
                    }}>
                    <Tag tag={t('common:Recipient')} color={THEME_COLORS.OTHERS.TABLE_AREA_PURPLE} fontColor={THEME_COLORS.OTHERS.GRAY} />
                    {noIcon ? (
                        <Text
                            style={{
                                ...GlobalStyles.smallGrayText,
                                marginLeft: 5,
                                flexWrap: 'wrap',
                                flex: 1,
                            }}>
                            {requestedCompanies?.map((company) => company?.name).join(',  ') ?? request?.requestedCompany?.name}
                        </Text>
                    ) : (
                        <Company
                            style={{
                                marginLeft: 15,
                            }}
                            iconSize={iconSize}
                            hasLastDeal={false}
                            company={request?.requestedCompany}
                        />
                    )}
                </View>
            )}
            {displayMeter != false ? (
                <View
                    style={{
                        flexDirection: 'row',
                    }}>
                    {requestedCompanies && (
                        <Prefix
                            text={t('common:Responded')}
                            color={THEME_COLORS.OTHERS.BACKGROUND}
                            fontColor={THEME_COLORS.OTHERS.BLACK}
                            fontSize={9}
                            style={{
                                marginRight: 10,
                            }}
                        />
                    )}
                    <SiteMeter
                        style={{
                            flex: 1,
                        }}
                        requiredCount={orderRequestCount ?? request?.requestMeter?.companyRequiredNum}
                        presentCount={orderPresentCount ?? request?.requestMeter?.companyPresentNum}
                    />
                    {!(request?.isConfirmed == true) && <Tag tag={t('common:Unnoticed')} fontSize={9} color={THEME_COLORS.OTHERS.ALERT_RED} style={{}} />}
                </View>
            ) : null}
            <View
                style={{
                    flexDirection: 'row',
                    marginTop: 3,
                }}>
                <WorkerList
                    workers={subArrangedWorkers ?? (request?.requestMeter?.presentArrangements?.items?.map((arr) => arr.worker).filter((data) => data != undefined) as WorkerType[])}
                    requests={subRequests ?? request?.requestMeter?.presentRequests?.items}
                    displayRespondCount={displayRespondCount}
                    onPress={workerOnPress}
                    markingWorkerIds={markingWorkerIds}
                />
            </View>
        </View>
    )
})
