import React, { useState, useEffect, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, ScrollView, Alert, Text } from 'react-native'
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { TableArea } from '../../../../components/atoms/TableArea'
import { Line } from '../../../../components/atoms/Line'
import { AppButton } from '../../../../components/atoms/AppButton'
import { CompanyCL } from '../../../../components/organisms/company/CompanyCL'
import { ShadowBoxWithHeader } from '../../../../components/organisms/shadowBox/ShadowBoxWithHeader'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { InvReservationDetailRouterContext } from './InvReservationDetailRouter'
import isEmpty from 'lodash/isEmpty'
import { StoreType } from '../../../../stores/Store'
import { deleteParamOfLocalUpdateScreens, setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { goToCompanyDetail } from '../../../../usecases/company/CommonCompanyCase'
import { checkLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { updateCachedData, getCachedData, genKeyName } from '../../../../usecases/CachedDataCase'
import { InvReservationCLType, InvReservationType } from '../../../../models/invReservation/InvReservation'
import { deleteInvReservation, getInvReservationDetail } from '../../../../usecases/invReservation/InvReservationCase'
import { CustomDate, dayBaseText, dayBaseTextWithoutDate, getMonthlyFirstDay, getTextBetweenAnotherDate, monthBaseText, nextDay, nextMonth, timeText } from '../../../../models/_others/CustomDate'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import DisplayIdInDev from '../../../../components/atoms/DisplayIdInDEV'
import { UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'
import { AddressMap } from '../../../../components/organisms/AddressMap'
import { ImageIcon } from '../../../../components/organisms/ImageIcon'
import { GlobalStyles } from '../../../../utils/Styles'
import { IconParam } from '../../../../components/organisms/IconParam'
import { _deleteConstruction } from '../../../../services/construction/ConstructionService'
import { ConstructionCLType, ConstructionType } from '../../../../models/construction/Construction'
import { ProjectCLType, ProjectType } from '../../../../models/project/Project'
import { ConstructionMeter } from '../../../../components/organisms/construction/ConstructionMeter'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { checkUpdateOfTargetScreen, deleteParamOfUpdateScreens } from '../../../../usecases/updateScreens/CommonUpdateScreensCase'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { Tag } from '../../../../components/organisms/Tag'
import { THEME_COLORS } from '../../../../utils/Constants'
import { getErrorMessage } from '../../../../services/_others/ErrorService'
import { CachedReceiveListType } from '../ReceiveList'

type NavProps = StackNavigationProp<RootStackParamList, 'InvReservationDetail'>
type RouteProps = RouteProp<RootStackParamList, 'InvReservationDetail'>

type InitialStateType = {
    invReservation?: InvReservationCLType
    updateCache: number
    construction?: ConstructionCLType
    project?: ProjectCLType
    isFetching: boolean
}

type CachedInvReservationDetailType = {
    invReservation?: InvReservationCLType
}

const initialState: InitialStateType = {
    updateCache: 0,
    isFetching: false,
}

/**
 *
 * @returns requestIdがあると常用依頼詳細画面になる。
 */
const InvReservationDetail = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const { t } = useTextTranslation()
    const [{ invReservation, updateCache, construction, project, isFetching }, setState] = useState(initialState)
    const { startDate, endDate, invRequestIds, extraDates, initialWorkerCount } = invReservation ?? {}
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const { invReservationId } = useContext(InvReservationDetailRouterContext)
    const signInUser = useSelector((state: StoreType) => state.account?.signInUser)
    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const cachedInvReservationDetailKey = genKeyName({
        screenName: 'InvReservationDetail',
        accountId: signInUser?.accountId ?? '',
        invReservationId: invReservationId ?? '',
        companyId: myCompanyId ?? '',
        workerId: signInUser?.workerId ?? '',
    })

    useSafeUnmount(setState, initialState)

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))

            /**
             * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
             */
            ;(async () => {
                const isUpdateResult = await checkUpdateOfTargetScreen({
                    targetId: invReservation?.invReservationId,
                    accountId: signInUser?.accountId,
                    targetScreenName: 'InvReservationDetail',
                    localUpdateScreens,
                })
                if (isUpdateResult.success) {
                    dispatch(setIsNavUpdating(true))
                }
            })()
        }
    }, [isFocused, invReservation?.invReservationId])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(invReservationId) || isEmpty(signInUser) || isEmpty(myCompanyId) || isFetching != true) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const InvReservationResult = await getInvReservationDetail({
                    invReservationId: invReservationId,
                    myCompanyId,
                })
                if (InvReservationResult.error || InvReservationResult.success == undefined) {
                    throw {
                        error: InvReservationResult.error,
                    }
                }
                const result = await getCachedData<CachedInvReservationDetailType>(cachedInvReservationDetailKey ?? 'no-id')
                if (result.success) {
                    setState((prev) => ({
                        ...prev,
                        invReservation: result.success?.invReservation,
                        construction: result.success?.invReservation?.construction,
                        project: result.success?.invReservation?.construction?.project,
                    }))
                    if (InvReservationResult.success?.updatedAt == undefined) return
                    if (result.success.invReservation?.updatedAt?.totalSeconds && result.success.invReservation?.updatedAt?.totalSeconds > InvReservationResult.success?.updatedAt.totalSeconds) {
                        // キャッシュよりDBが古い場合、更新しない
                        return
                    }
                }
                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                setState((prev) => ({
                    ...prev,
                    invReservation: InvReservationResult.success,
                    construction: InvReservationResult.success?.construction,
                    project: InvReservationResult.success?.construction?.project,
                }))
                const cachedSiteResult = await updateCachedData({ key: cachedInvReservationDetailKey, value: { invReservation: InvReservationResult.success } })
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
                    screenName: 'InvReservationDetail',
                    id: invReservationId,
                    paramName: 'ids',
                })
                await deleteParamOfUpdateScreens({
                    accountId: signInUser?.accountId,
                    screenName: 'InvReservationDetail',
                    id: invReservationId,
                    paramName: 'ids',
                })
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: `${_error.error} / code: ${_error.errorCode}`,
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                setState((prev) => ({ ...prev, isFetching: false }))
                if (isFocused) {
                    dispatch(setIsNavUpdating(false))
                    dispatch(setLoading(false))
                }
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
            const result = await getCachedData<CachedInvReservationDetailType>(cachedInvReservationDetailKey)
            if (result.error) {
                if (result.errorCode != 'FIRST_FETCH') {
                    dispatch(
                        setToastMessage({
                            text: result.error,
                            type: 'error',
                        }),
                    )
                }
                setState((rev) => ({ ...rev, isFetching: true }))
            }
            setState((prev) => ({
                ...prev,
                invReservation: result.success?.invReservation,
                construction: result.success?.invReservation?.construction,
                project: result.success?.invReservation?.construction?.project,
            }))
        })()
    }, [updateCache])

    const _updateReceiveListCache = async (invReservationId: string, startDate?: CustomDate, endDate?: CustomDate) => {
        if (startDate == undefined || endDate == undefined) return

        // 月を跨ぐ場合、月毎に生成する
        let month = getMonthlyFirstDay(startDate)
        let cacheKeys = []
        while (month.totalSeconds <= getMonthlyFirstDay(endDate).totalSeconds) {
            const cachedKey = genKeyName({
                    screenName: 'ReceiveList',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                    month: month ? monthBaseText(month).replace(/\//g, '-') : '',
                })
            cacheKeys.push(cachedKey)
            month = nextMonth(month)
        }
        const promises = cacheKeys.map(async (cachedKey): Promise<CustomResponse<undefined>> => {
            try {
                const receiveListCacheData = await getCachedData<CachedReceiveListType>(cachedKey)
                if (receiveListCacheData.success?.invRequestInfo) {
                    const newInvReservations = receiveListCacheData.success.invRequestInfo?.invReservations?.filter((invReservation)=>invReservation.invReservationId!=invReservationId)
                    receiveListCacheData.success.invRequestInfo.invReservations = newInvReservations
                    receiveListCacheData.success.invRequestInfo.updatedAt = Number(new Date())
                    await updateCachedData({ key: cachedKey, value: receiveListCacheData.success })
                }
                return Promise.resolve({
                    success: undefined,
                })
            } catch (error) {
                return getErrorMessage(error)
            }
        })

        const results = await Promise.all(promises)
        results.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        })
    }

    const _deleteInvReservation = async (invReservationId?: string) => {
        try {
            if (invReservationId == undefined) {
                throw {
                    error: t('admin:ThereIsNoPermanentApplicationInformation'),
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: invReservationId ?? 'no-id',
                modelType: 'invReservation',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }

            // 取引一覧キャッシュ更新
            await _updateReceiveListCache(invReservationId, project?.startDate, project?.endDate)

            const result = await deleteInvReservation({
                invReservationId,
                invRequestIds,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            const dates = invReservation?.totalDates
            const newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'InvRequestDetail',
                    ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'InvRequestDetail').map((screen) => screen.ids)), ...(invRequestIds ?? [])]?.filter(
                        (data) => data != undefined,
                    ) as string[],
                },
                {
                    screenName: 'ReceiveList',
                    dates: [
                        ...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'ReceiveList').map((screen) => screen.dates)),
                        ...(dates?.map((date) => date.totalSeconds) ?? []),
                    ]?.filter((data) => data != undefined) as number[],
                },
            ]
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            navigation.goBack()
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: `${_error.error} / code: ${_error.errorCode}`,
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    //TODO:未申請の申請があったら、ラベルなどで知らせた方が親切?
    return (
        <ScrollView
            style={{
                flex: 1,
                backgroundColor: '#fff',
            }}>
            {invReservation != undefined && (
                <>
                    {project?.fakeCompanyInvReservationId == invReservationId && (
                        <>
                            <View
                                style={{
                                    paddingHorizontal: 20,
                                }}>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        marginTop: 10,
                                    }}>
                                    <ImageIcon
                                        type={'project'}
                                        size={40}
                                        imageUri={project?.sImageUrl ?? project?.imageUrl}
                                        imageColorHue={project?.imageColorHue}
                                        style={{
                                            marginRight: 10,
                                        }}
                                    />
                                    <Text
                                        style={{
                                            ...GlobalStyles.headerText,
                                            fontSize: 18,
                                            flex: 1,
                                        }}>
                                        {project?.name ?? '???'}
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        marginTop: 10,
                                    }}>
                                    <IconParam iconName={'site'} paramName={'現場数'} suffix={'日'} count={invRequestIds?.length} />
                                    <IconParam hasBorder iconName={'attend-worker'} paramName={'総手配数'} suffix={'名'} count={construction?.constructionMeter?.presentNum} />
                                </View>
                                <ConstructionMeter
                                    style={{
                                        marginTop: 5,
                                    }}
                                    presentCount={construction?.constructionMeter?.presentNum}
                                    requiredCount={construction?.constructionMeter?.requiredNum}
                                />
                            </View>
                        </>
                    )}
                    <TableArea
                        style={{
                            margin: 10,
                            marginTop: 15,
                        }}
                        columns={[
                            {
                                key: invReservation.myCompanyId == myCompanyId ? t('admin:PeriodToSendInSupport') : t('admin:PeriodToComeInSupport'),
                                content: (startDate ? dayBaseTextWithoutDate(startDate) : '未定') + ' 〜 ' + (endDate ? dayBaseTextWithoutDate(endDate) : '未定'),
                            },
                            {
                                key: invReservation.myCompanyId == myCompanyId ? t('admin:DateToSendInSpecificSupport') : t('admin:DaysToComeWithSpecificSupport'),
                                content: extraDates?.map((date) => dayBaseTextWithoutDate(date))?.join(',  '),
                            },
                            {
                                key: invReservation.myCompanyId == myCompanyId ? t('admin:InitialNumberOfPeopleToSendInSupport') : t('admin:InitialNumberOfPeopleComingInSupport'),
                                content: initialWorkerCount?.toString() ?? '0',
                            },
                            {
                                key: t('common:RegularHolidays'),
                                content: invReservation?.offDaysOfWeek?.join(', '),
                            },
                            {
                                key: t('common:OtherHolidays'),
                                content: invReservation?.otherOffDays?.map((offDay: CustomDate) => dayBaseText(offDay)).join(', '),
                            },
                        ]}
                        contentRatio={2}
                    />
                    {project?.fakeCompanyInvReservationId == invReservationId && (
                        <>
                            <TableArea
                                style={{
                                    margin: 10,
                                    marginTop: 15,
                                }}
                                columns={[
                                    {
                                        key: '案件名',
                                        content: project?.name,
                                    },
                                    {
                                        key: '案件の元請け',
                                        content: invReservation?.projectOwnerCompany?.name,
                                    },
                                    {
                                        key: '編集者',
                                        content: project?.updateWorker ? `${project.updateWorker?.name} ＠${project.updateWorker?.company?.name}` : undefined,
                                    },
                                    {
                                        key: '集合時間',
                                        content: construction?.siteMeetingTime ? timeText(construction?.siteMeetingTime) : t('common:Undecided'),
                                    },
                                    {
                                        key: '作業時間',
                                        content: `${
                                            construction?.siteStartTime
                                                ? (construction?.siteStartTimeIsNextDay ? t('common:Next') : '') +
                                                  getTextBetweenAnotherDate(
                                                      nextDay(construction?.siteStartTime, construction?.siteStartTimeIsNextDay ? 1 : 0),
                                                      construction?.siteEndTime ? nextDay(construction?.siteEndTime, construction?.siteEndTimeIsNextDay ? 1 : 0) : undefined,
                                                      true,
                                                  )
                                                : t('common:Undecided')
                                        }`,
                                    },
                                    {
                                        key: '必要作業員',
                                        content: (construction?.siteRequiredNum ?? 0).toString() + t('common:Name'),
                                    },
                                    {
                                        key: '持ち物',
                                        content: construction?.siteBelongings,
                                    },
                                    {
                                        key: '備考',
                                        content: construction?.remarks,
                                    },
                                ]}
                                contentRatio={2}
                            />
                            <View
                                style={{
                                    marginTop: 10,
                                }}>
                                <AddressMap
                                    location={{
                                        address: construction?.siteAddress ?? project?.siteAddress,
                                    }}
                                    style={{
                                        paddingHorizontal: 20,
                                        marginTop: 10,
                                    }}
                                />
                            </View>
                        </>
                    )}
                    <ShadowBoxWithHeader
                        style={{
                            marginHorizontal: 10,
                            marginTop: 10,
                        }}
                        title={invReservation.targetCompanyId == myCompanyId ? t('common:sourceOfApplication') : invReservation.myCompanyId == myCompanyId ? t('admin:SupportAgreement') : 'unknown'}
                        onPress={
                            invReservation?.targetCompany?.companyPartnership != undefined && invReservation?.targetCompany?.companyPartnership != 'others'
                                ? () => {
                                      invReservation.targetCompanyId == myCompanyId
                                          ? goToCompanyDetail(navigation, invReservation.myCompanyId, invReservation.myCompany?.name, myCompanyId)
                                          : invReservation.myCompanyId == myCompanyId
                                          ? goToCompanyDetail(navigation, invReservation.targetCompanyId, invReservation.targetCompany?.name, myCompanyId)
                                          : undefined
                                  }
                                : undefined
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
                                company={
                                    invReservation.targetCompanyId == myCompanyId ? invReservation.myCompany : invReservation.myCompanyId == myCompanyId ? invReservation.targetCompany : undefined
                                }
                            />
                        </View>
                    </ShadowBoxWithHeader>
                    {invReservation.myCompanyId == myCompanyId && (
                        <View
                            style={{
                                marginTop: 15,
                                marginHorizontal: 10,
                            }}>
                            <Line style={{ marginTop: 10 }} />
                            <AppButton
                                title={t('common:EditBy')}
                                style={{
                                    marginTop: 20,
                                }}
                                onPress={() => {
                                    navigation.push('EditInvReservation', {
                                        invReservationId: invReservationId,
                                        mode: 'edit',
                                    })
                                }}
                            />
                            <AppButton
                                title={t('common:Delete')}
                                isGray={true}
                                height={35}
                                style={{
                                    marginTop: 15,
                                }}
                                onPress={() => {
                                    Alert.alert(t('admin:AreYouSureYouWantToDeleteYourApplication'), t('admin:OperationCannotBeUndone'), [
                                        { text: t('common:Delete'), onPress: () => _deleteInvReservation(invReservationId) },
                                        {
                                            text: t('common:Cancel'),
                                            style: 'cancel',
                                        },
                                    ])
                                }}
                            />
                        </View>
                    )}
                    <DisplayIdInDev id={invReservation?.invReservationId} label="invReservationId" />
                    <DisplayIdInDev id={construction?.contract?.contractId} label="contractId" />
                    <DisplayIdInDev id={construction?.constructionId} label="constructionId" />
                    <BottomMargin />
                </>
            )}
        </ScrollView>
    )
}
export default InvReservationDetail

const styles = StyleSheet.create({})
