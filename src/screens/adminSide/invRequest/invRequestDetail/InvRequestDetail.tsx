/* eslint-disable indent */
import React, { useState, useEffect, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, Alert, ViewStyle, Text } from 'react-native'
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { Line } from '../../../../components/atoms/Line'
import { AppButton } from '../../../../components/atoms/AppButton'
import { CompanyCL } from '../../../../components/organisms/company/CompanyCL'
import { WorkerInfo, WorkerInfoType } from '../../../../components/organisms/worker/WorkerInfo'
import { ShadowBoxWithHeader } from '../../../../components/organisms/shadowBox/ShadowBoxWithHeader'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import flatten from 'lodash/flatten'
import isEmpty from 'lodash/isEmpty'
import uniqBy from 'lodash/uniqBy'
import { StoreType } from '../../../../stores/Store'
import { deleteParamOfLocalUpdateScreens, setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { goToCompanyDetail } from '../../../../usecases/company/CommonCompanyCase'
import { WorkerCLType } from '../../../../models/worker/Worker'
import { checkLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { updateCachedData, getCachedData, genKeyName } from '../../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { ScrollViewInstead } from '../../../../components/atoms/ScrollViewInstead'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { deleteParamOfUpdateScreens, checkUpdateOfTargetScreen } from '../../../../usecases/updateScreens/CommonUpdateScreensCase'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
import DisplayIdInDev from '../../../../components/atoms/DisplayIdInDEV'
import { InvRequestCLType } from '../../../../models/invRequest/InvRequestType'
import { approveInvRequest, deleteInvRequest, getInvRequestDetail, makeInvRequestApproveNotifications } from '../../../../usecases/invRequest/invRequestCase'
import { InvRequestHeaderCL } from '../../../../components/organisms/invRequest/InvRequestHeaderCL'
import { EmptyScreen } from '../../../../components/template/EmptyScreen'
import { SiteCLType } from '../../../../models/site/Site'
import { ConstructionCLType } from '../../../../models/construction/Construction'
import { TableArea } from '../../../../components/atoms/TableArea'
import { AddressMap } from '../../../../components/organisms/AddressMap'
import { timeBaseText, getTextBetweenAnotherDate, toCustomDateFromTotalSeconds, CustomDate } from '../../../../models/_others/CustomDate'
import { GlobalStyles } from '../../../../utils/Styles'
import { WorkerCL } from '../../../../components/organisms/worker/WorkerCL'
import { SiteHeaderCL } from '../../../../components/organisms/site/SiteHeaderCL'
import { Tag } from '../../../../components/organisms/Tag'
import { THEME_COLORS } from '../../../../utils/Constants'
import { InvReservationHeaderCL } from '../../../../components/organisms/invReservation/InvReservationHeaderCL'

type NavProps = StackNavigationProp<RootStackParamList, 'InvRequestDetail'>
type RouteProps = RouteProp<RootStackParamList, 'InvRequestDetail'>

type InitialStateType = {
    id?: string
    invRequest?: InvRequestCLType
    isFetching: boolean
    updateCache: number
    site?: SiteCLType
    construction?: ConstructionCLType
}

export type WorkerUIWithInfoType = WorkerCLType & WorkerInfoType

const initialState: InitialStateType = {
    isFetching: false,
    updateCache: 0,
}
/**
 * 従来の又貸し対応は、Requestがあって、それにRequestが含まれていてという順番。
 * 今回の場合は、InvRequestが届いた先でさらにinvRequestをするのであれば、自社作業員からの手配と同様になる。
 * この時点で現場は確定していないため、InvRequestに他社作業員を常用手配することはできない。既にInvRequestで自社ボックスに入っている他社作業員ならば手配可能。
 * しかし注意しないといけないのは、自分は何もしていなくても、InvRequestの申請が削除されてしまうと、さらにinvRequestしていた場合に、それも手配が消えてしまうこと。そこの対応をしっかり行う
 */
const InvRequestDetail = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const { t } = useTextTranslation()

    const [{ id, invRequest, isFetching, updateCache, site, construction }, setState] = useState(initialState)
    const { targetCompany, myCompany, workerIds, date, workerCount } = invRequest ?? {}
    const dispatch = useDispatch()
    const invRequestId = route.params?.invRequestId
    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state.account?.signInUser)
    const cachedInvRequestDetailKey = genKeyName({
        screenName: 'InvRequestDetail',
        accountId: signInUser?.accountId ?? '',
        invRequestId: invRequestId ?? '',
        companyId: myCompanyId ?? '',
        workerId: signInUser?.workerId ?? '',
    })
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)

    useSafeUnmount(setState, initialState)

    useEffect(() => {
        navigation.setOptions({
            title: route.params?.type == 'order' ? t('admin:SendYourSupport') : t('admin:BackupIsComing'),
        })
    }, [navigation])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))

            /**
             * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
             */
            ;(async () => {
                const isUpdateResult = await checkUpdateOfTargetScreen({ targetId: id, accountId: signInUser?.accountId, targetScreenName: 'InvRequestDetail', localUpdateScreens })
                if (isUpdateResult.success) {
                    dispatch(setIsNavUpdating(true))
                }
            })()
        }
    }, [isFocused, id, signInUser, myCompanyId])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (invRequestId) {
            setState((prev) => ({ ...prev, id: invRequestId }))
        }
    }, [invRequestId])

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(invRequestId) || isEmpty(myCompanyId) || isEmpty(signInUser) || isFetching != true) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const invRequestResult = await getInvRequestDetail({
                    invRequestId: invRequestId,
                    myCompanyId,
                })
                if (invRequestResult.error || invRequestResult.success == undefined) {
                    throw {
                        error: invRequestResult.error,
                    }
                }
                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                setState((prev) => ({
                    ...prev,
                    invRequest: invRequestResult.success,
                    site: invRequestResult.success?.site,
                    construction: invRequestResult.success?.site?.construction,
                }))
                const cachedSiteResult = await updateCachedData({ key: cachedInvRequestDetailKey, value: invRequestResult.success })
                if (cachedSiteResult.error) {
                    dispatch(
                        setToastMessage({
                            text: cachedSiteResult.error,
                            type: 'error',
                        }),
                    )
                }
                deleteParamOfLocalUpdateScreens({
                    screens: localUpdateScreens,
                    screenName: 'InvRequestDetail',
                    id,
                    paramName: 'ids',
                })
                await deleteParamOfUpdateScreens({
                    accountId: signInUser?.accountId,
                    screenName: 'InvRequestDetail',
                    id,
                    paramName: 'ids',
                })
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                if (isFocused) {
                    dispatch(setLoading(false))
                    dispatch(setIsNavUpdating(false))
                }
                setState((prev) => ({ ...prev, isFetching: false }))
            }
        })()
    }, [isFetching])

    /**
     * @summary キャッシュを更新する副作用関数
     * @purpose アプリ側にKVSによるキャッシュを設けて初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            const result = await getCachedData<InvRequestCLType>(cachedInvRequestDetailKey)
            if (result.error) {
                if (result.errorCode != 'FIRST_FETCH') {
                    dispatch(
                        setToastMessage({
                            text: result.error,
                            type: 'error',
                        }),
                    )
                }
                setState((prev) => ({ ...prev, isFetching: true }))
            } else {
                setState((prev) => ({
                    ...prev,
                    invRequest: result.success,
                    site: result.success?.site,
                    construction: result.success?.site?.construction,
                }))
            }
        })()
    }, [updateCache])

    const _approveInvRequest = async (invRequestId?: string, isApproval?: boolean) => {
        try {
            if (invRequestId == undefined || isApproval == undefined) {
                throw {
                    error: t('common:ApplicationInformationIsNotAvailable'),
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: invRequestId ?? 'no-id',
                modelType: 'invRequest',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }
            const result = await approveInvRequest({
                invRequestId,
                isApproval,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            let newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'OrderList',
                    dates: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'OrderList').map((screen) => screen.dates)), date?.totalSeconds]?.filter(
                        (data) => data != undefined,
                    ) as number[],
                },
            ]
            setState((prev) => ({ ...prev, isFetching: true }))
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            await makeInvRequestApproveNotifications(invRequest, isApproval)
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

    const _deleteInvRequest = async () => {
        try {
            if (invRequestId == undefined) {
                throw {
                    error: t('admin:NoOnInvRequestInformationAvailable'),
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: invRequest?.invReservationId ?? 'no-id',
                modelType: 'invReservation',
            })
            if (lockResult.error) {
                throw {
                    error: lockResult.error,
                }
            }
            const result = await deleteInvRequest({
                invRequestId,
            })
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            let newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'ReceiveList',
                    dates: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'ReceiveList').map((screen) => screen.dates)), date?.totalSeconds]?.filter(
                        (data) => data != undefined,
                    ) as number[],
                },
            ]
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            navigation.goBack()
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        } finally {
            if (isFocused) {
                dispatch(setLoading(false))
            }
        }
    }

    return (
        <ScrollViewInstead
            style={{
                flex: 1,
                backgroundColor: '#fff',
            }}>
            {invRequest?.targetCompanyId == myCompanyId && invRequest?.isApplication != true && <EmptyScreen text={t('admin:ApplicationDoesNotExist')} />}
            {invRequest != undefined && !(invRequest.myCompanyId != myCompanyId && invRequest.isApplication != true) && (
                <>
                    {/* <View
                        style={{
                            marginTop: 15,
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                        }}>
                        <Text style={GlobalStyles.smallGrayText}>{`${date ? dayBaseText(date) : t('common:None')}`}</Text>
                        <SiteMeter presentCount={workerIds?.length??0} requiredCount={workerCount} style={{ marginTop: 5 }} />
                    </View> */}
                    {site?.siteId ? (
                        <SiteHeaderCL
                            style={{
                                marginHorizontal: 10,
                                marginTop: 15,
                            }}
                            displayDay
                            titleStyle={
                                {
                                    ...GlobalStyles.smallGrayText,
                                } as ViewStyle
                            }
                            isRequest={true}
                            siteNameStyle={
                                {
                                    ...GlobalStyles.boldText,
                                } as ViewStyle
                            }
                            site={{ ...site, siteMeter: site?.siteMeter, isConfirmed: site?.isConfirmed }}
                        />
                    ) : (
                        <InvRequestHeaderCL style={{ marginTop: 15, paddingHorizontal: 10, paddingVertical: 6 }} invRequest={invRequest} />
                    )}
                    <Line
                        style={{
                            marginTop: 15,
                            marginHorizontal: 10,
                        }}
                    />
                    {invRequest.site?.fakeCompanyInvRequestId == invRequestId && (
                        <>
                            <TableArea
                                style={{
                                    margin: 10,
                                    marginTop: 15,
                                }}
                                columns={[
                                    { key: '集合時間', content: site?.meetingDate ? timeBaseText(site?.meetingDate) : '未定' },
                                    { key: '作業開始', content: site?.startDate ? getTextBetweenAnotherDate(site?.startDate, site?.endDate) : '未定' },
                                    { key: '持ち物', content: site?.belongings },
                                    { key: '備考', content: site?.remarks },
                                ]}
                            />
                            <AddressMap
                                style={{
                                    marginHorizontal: 10,
                                    marginTop: 10,
                                    marginBottom: 10,
                                }}
                                location={{
                                    address: site?.address,
                                }}
                            />
                            {site?.managerWorker != undefined && (
                                <ShadowBoxWithHeader
                                    style={{
                                        marginHorizontal: 10,
                                        marginTop: 10,
                                    }}
                                    title={t('common:PersonInCharge')}
                                    onPress={() => {
                                        if (site?.managerWorker?.workerId) {
                                            navigation.push('WorkerDetailRouter', {
                                                title: site?.managerWorker.name,
                                                workerId: site?.managerWorker.workerId,
                                            })
                                        }
                                    }}>
                                    <>
                                        {site?.managerWorker.name != undefined && (
                                            <>
                                                <WorkerCL worker={site?.managerWorker} />
                                                {!(site?.managerWorker.phoneNumber == undefined && site?.managerWorker.account?.email == undefined) && (
                                                    <Line
                                                        style={{
                                                            marginTop: 10,
                                                        }}
                                                    />
                                                )}
                                                <WorkerInfo phoneNumber={site?.managerWorker.phoneNumber} email={site?.managerWorker.account?.email} />
                                            </>
                                        )}
                                        {site?.managerWorker.name == undefined && <Text style={[GlobalStyles.smallText]}>{t('admin:NoOnsiteManager')}</Text>}
                                    </>
                                </ShadowBoxWithHeader>
                            )}
                        </>
                    )}
                    <ShadowBoxWithHeader
                        style={{
                            marginHorizontal: 10,
                            marginTop: 10,
                        }}
                        title={invRequest.myCompanyId == myCompanyId ? t('admin:SupportAgreement') : t('common:sourceOfApplication')}
                        onPress={
                            invRequest.myCompanyId != myCompanyId
                                ? () => {
                                      goToCompanyDetail(navigation, myCompany?.companyId, myCompany?.name, myCompanyId)
                                  }
                                : () => {
                                      goToCompanyDetail(navigation, targetCompany?.companyId, targetCompany?.name, myCompanyId)
                                  }
                        }>
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                            <Tag style={{ marginTop: 15, marginRight: 5 }} tag={t('common:Client')} color={THEME_COLORS.OTHERS.TABLE_AREA_PURPLE} fontColor={THEME_COLORS.OTHERS.GRAY} />
                            <CompanyCL
                                style={{
                                    flex: 1,
                                }}
                                company={invRequest.myCompanyId == myCompanyId ? targetCompany : myCompany}
                            />
                        </View>
                    </ShadowBoxWithHeader>
                    <ShadowBoxWithHeader
                        style={{
                            marginHorizontal: 10,
                            marginTop: 10,
                        }}
                        title={invRequest.myCompanyId == myCompanyId ? t('admin:WillBeSendingInSupport') : t('admin:WillBeComingInSupport')}
                        onPress={() => {
                            navigation.push('InvReservationDetailRouter', {
                                invReservationId: invRequest.invReservationId,
                                type: invRequest.myCompanyId == myCompanyId ? 'order' : 'receive',
                            })
                        }}>
                        <InvReservationHeaderCL invReservation={invRequest?.invReservation} />
                    </ShadowBoxWithHeader>
                    {invRequest.myCompanyId == myCompanyId && (
                        <View
                            style={{
                                marginTop: 15,
                                marginHorizontal: 10,
                            }}>
                            <Line />
                            <AppButton
                                title={site?.fakeCompanyInvRequestId == invRequestId ? t('admin:EditTheNumberOfPeopleToSendInSupport') : t('common:EditBy')}
                                style={{
                                    marginTop: 20,
                                }}
                                onPress={() => {
                                    navigation.push('EditInvRequest', {
                                        invRequestId: invRequestId,
                                    })
                                }}
                            />
                        </View>
                    )}
                    {invRequest.targetCompanyId == myCompanyId && (
                        <AppButton
                            title={
                                invRequest.isApproval == true
                                    ? t('admin:approved')
                                    : invRequest.isApproval == 'waiting'
                                    ? t('admin:Approve')
                                    : invRequest.isApproval == false
                                    ? t('common:unauthorized')
                                    : undefined
                            }
                            isGray={true}
                            height={35}
                            style={{
                                marginTop: 15,
                                marginHorizontal: 10,
                            }}
                            onPress={() => {
                                Alert.alert(t('admin:DoYouWishToApproveTheApplication'), t('common:OperationCannotBeUndone'), [
                                    { text: t('admin:Approve'), onPress: () => _approveInvRequest(invRequestId, true) },
                                    {
                                        text: t('common:Cancel'),
                                        style: 'cancel',
                                    },
                                ])
                            }}
                            disabled={invRequest.isApproval == 'waiting' ? false : true}
                        />
                    )}
                    {invRequest.targetCompanyId == myCompanyId && invRequest.isApproval == 'waiting' && (
                        <AppButton
                            title={t('common:unauthorized')}
                            isGray={true}
                            height={35}
                            style={{
                                marginTop: 15,
                                marginHorizontal: 10,
                            }}
                            onPress={() => {
                                Alert.alert(t('admin:DoYouWishToDisapproveTheApplication'), t('common:OperationCannotBeUndone'), [
                                    { text: t('admin:NotApprove'), onPress: () => _approveInvRequest(invRequestId, false) },
                                    {
                                        text: t('common:Cancel'),
                                        style: 'cancel',
                                    },
                                ])
                            }}
                        />
                    )}
                    {site?.fakeCompanyInvRequestId == invRequestId && (
                        <View
                            style={{
                                marginTop: 15,
                                marginHorizontal: 10,
                            }}>
                            <Line />
                            <AppButton
                                title={t('common:EditTheSite')}
                                style={{
                                    marginTop: 20,
                                }}
                                onPress={() => {
                                    navigation.push('EditSite', {
                                        siteId: site?.siteId,
                                        constructionId: construction?.constructionId,
                                        mode: 'edit',
                                        projectId: construction?.projectId ?? 'no-id',
                                    })
                                }}
                            />
                        </View>
                    )}
                    {invRequest.myCompanyId == myCompanyId && (
                        <AppButton
                            title={site?.siteId ? t('common:DeleteTheSite') : t('common:DeleteTheSupport')}
                            style={{
                                marginTop: 20,
                                marginHorizontal: 10,
                            }}
                            onPress={() => {
                                Alert.alert(site?.siteId ? t('admin:WantToRemoveTheSite') : t('admin:WantToRemoveTheSupport'), t('common:OperationCannotBeUndone'), [
                                    { text: t('common:Deletion'), onPress: () => _deleteInvRequest() },
                                    {
                                        text: t('common:Cancel'),
                                        style: 'cancel',
                                    },
                                ])
                            }}
                        />
                    )}
                    {invRequest.date && (
                        <AppButton
                            style={{
                                marginTop: 20,
                                marginHorizontal: 10,
                            }}
                            title={t('admin:GoToDateManagementScreen')}
                            onPress={() => {
                                navigation.push('DateRouter', {
                                    date: invRequest.date as CustomDate,
                                })
                            }}
                        />
                    )}
                    <DisplayIdInDev id={invRequest?.invRequestId} label="invRequestId" />
                    <DisplayIdInDev id={site?.siteId} label="siteId" />
                    <BottomMargin />
                </>
            )}
        </ScrollViewInstead>
    )
}
export default InvRequestDetail

const styles = StyleSheet.create({})
