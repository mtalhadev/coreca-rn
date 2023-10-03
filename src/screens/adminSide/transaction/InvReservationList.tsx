/* eslint-disable indent */
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, ListRenderItem, ListRenderItemInfo } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { useIsFocused } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { AppButton } from '../../../components/atoms/AppButton'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { StoreType } from '../../../stores/Store'
import { deleteParamOfLocalUpdateScreens, setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { CustomDate, getMonthlyFinalDay, getMonthlyFirstDay, monthBaseText, newCustomDate, toCustomDateFromTotalSeconds, YYYYMMDateType } from '../../../models/_others/CustomDate'
import { THEME_COLORS } from '../../../utils/Constants'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { RootStackParamList } from '../../Router'
import { IconParam } from '../../../components/organisms/IconParam'
import { SwitchPage } from '../../../components/template/SwitchPage'
import { SelectButton } from '../../../components/organisms/SelectButton'
import { match } from 'ts-pattern'
import { updateCachedData, getCachedData, genKeyName } from '../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { getUpdateScreenOfTargetAccountAndScreen, deleteParamOfUpdateScreens } from '../../../usecases/updateScreens/CommonUpdateScreensCase'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { getInvReservationListOfTargetCompanyAndMonth } from '../../../usecases/invReservation/InvReservationCase'
import { CompanyInvReservationListType } from '../../../models/invReservation/CompanyInvReservationListType'
import { InvReservationType } from '../../../models/invReservation/InvReservation'
import { TotalSeconds } from '../../../models/_others/TotalSeconds'
import sum from 'lodash/sum'
import { InvReservation } from '../../../components/organisms/invReservation/InvReservation'

export type InvReservationDisplayType = keyof Omit<CompanyInvReservationListType, '_arrayType'>

type NavProps = StackNavigationProp<RootStackParamList, 'InvReservationList'>
type RouteProps = RouteProp<RootStackParamList, 'InvReservationList'>

type InitialStateType = {
    selectedMonth: CustomDate
    isFetching: boolean
    updateCache: number
    /**
     * 該当月のtotal,order,receiveのInvReservation配列
     */
    invReservations?: CompanyInvReservationListType
    /**
     * 表示するInvReservation配列
     */
    displayData?: InvReservationType[]
    displayType: InvReservationDisplayType
    updateMonths?: TotalSeconds[]
    /**
     * localUpdateScreensにより、updateScreens取得前に更新した日付
     */
    updatedMonths?: YYYYMMDateType[]
    orderWantSendNum: number
    orderSentNum: number
    receiveWantSendNum: number
    receiveSentNum: number
}

const initialState: InitialStateType = {
    selectedMonth: newCustomDate(),
    isFetching: false,
    updateCache: 0,
    displayType: 'totalInvReservations',
    orderWantSendNum: 0,
    orderSentNum: 0,
    receiveWantSendNum: 0,
    receiveSentNum: 0,
}

/**
 * 使用停止
 * @returns 常用で送る予定一覧。
 */
const InvReservationList = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const loading = useSelector((state: StoreType) => state.util.loading)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const [
        { invReservations, selectedMonth, isFetching, displayData, displayType, updateCache, updateMonths, updatedMonths, orderWantSendNum, orderSentNum, receiveWantSendNum, receiveSentNum },
        setState,
    ] = useState(initialState)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const cachedConstructionsKey = useRef(
        genKeyName({ screenName: 'InvReservationList', accountId: accountId, companyId: myCompanyId ?? '', month: selectedMonth ? monthBaseText(selectedMonth).replace(/\//g, '-') : '' }),
    )
    const [dateUpdate, setDateUpdate] = useState(0)
    useSafeUnmount(setState, initialState, () => setDateUpdate(dateUpdate + 1))

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useEffect(() => {
        if (isFocused) {
            ;(async () => {
                const updateResult = await getUpdateScreenOfTargetAccountAndScreen({
                    accountId,
                    screenName: 'InvReservationList',
                })
                const updateScreen = updateResult.success
                setState((prev) => ({ ...prev, updateMonths: updateScreen?.dates ?? [] }))
            })()
        }
    }, [isFocused])

    /**
     * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
     */
    useEffect(() => {
        ;(async () => {
            if (selectedMonth && isFocused) {
                const LocalTargetScreen = localUpdateScreens.filter((screen) => screen.screenName == 'InvReservationList')[0]
                const localTargetMonths = LocalTargetScreen?.dates?.filter(
                    (_date: number) => _date >= getMonthlyFirstDay(selectedMonth).totalSeconds && _date <= getMonthlyFinalDay(selectedMonth).totalSeconds,
                )
                if (localTargetMonths && localTargetMonths.length > 0) {
                    /**
                     * 作成編集者本人はUpdateScreensが更新される前に遷移するため、Storeで対応
                     */
                    dispatch(setIsNavUpdating(true))
                    setState((prev) => ({ ...prev, updatedMonths: [...(updatedMonths ?? []), monthBaseText(selectedMonth)] }))
                } else {
                    const targetMonths = updateMonths?.filter(
                        (_date) =>
                            _date >= getMonthlyFirstDay(selectedMonth).totalSeconds &&
                            _date <= getMonthlyFinalDay(selectedMonth).totalSeconds &&
                            !updatedMonths?.includes(monthBaseText(toCustomDateFromTotalSeconds(_date))),
                    )
                    if (targetMonths && targetMonths?.length > 0) {
                        dispatch(setIsNavUpdating(true))
                        setState((prev) => ({ ...prev, updatedMonths: [...(updatedMonths ?? []), monthBaseText(selectedMonth)] }))
                    }
                }
            }
        })()
    }, [selectedMonth, updateMonths])

    useEffect(() => {
        if (myCompanyId && selectedMonth) {
            // __DEV__ && logger.logAccessInfo('\n2. キャッシュキー生成の副作用フック')
            // __DEV__ && console.log('\n2-1. キャッシュキーを更新: '+ (selectedMonth? monthBaseText(selectedMonth).replace(/\//g, '-') : '') + '\n')
            cachedConstructionsKey.current = genKeyName({
                screenName: 'InvReservationList',
                accountId: accountId,
                companyId: myCompanyId,
                /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                month: selectedMonth ? monthBaseText(selectedMonth).replace(/\//g, '-') : '',
            })
        }
    }, [myCompanyId, selectedMonth])

    const _content: ListRenderItem<InvReservationType> = (info: ListRenderItemInfo<InvReservationType>) => {
        const { item, index } = info
        const type = item.targetCompany?.companyId == myCompanyId ? 'receive' : 'order'
        return (
            <InvReservation
                style={{
                    marginTop: 10,
                    marginHorizontal: 10,
                }}
                invReservation={item}
                key={index.toString()}
                onPress={() => {
                    navigation.push('InvReservationDetailRouter', {
                        invReservationId: item.invReservationId,
                        type: item.myCompanyId == myCompanyId ? 'order' : 'receive',
                    })
                }}
                type={type}
            />
        )
    }

    const _header = useMemo(() => {
        return (
            <View
                style={{
                    paddingTop: 55,
                    backgroundColor: '#fff',
                    paddingBottom: 10,
                    borderBottomWidth: 1,
                    paddingHorizontal: 10,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                }}>
                <SelectButton
                    items={[t('common:All'), t('admin:Order'), t('admin:AcceptingAnOrder')]}
                    onChangeItem={(value) => {
                        if (value == t('common:All')) {
                            onRequestTypeChange('totalInvReservations')
                        }
                        if (value == t('admin:AcceptingAnOrder')) {
                            onRequestTypeChange('receiveInvReservations')
                        }
                        if (value == t('admin:Order')) {
                            onRequestTypeChange('orderInvReservations')
                        }
                    }}
                    selected={match(displayType)
                        .with('orderInvReservations', () => t('admin:Order'))
                        .with('receiveInvReservations', () => t('admin:AcceptingAnOrder'))
                        .otherwise(() => t('common:All'))}
                    style={{ marginTop: 10 }}
                />
                <View>
                    {displayType != 'receiveInvReservations' && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 15,
                            }}>
                            <IconParam
                                flex={1.1}
                                iconName={'transfer'}
                                paramName={t('admin:NumberOfPeopleYouWantToSend')}
                                iconSize={20}
                                count={orderWantSendNum ?? 0}
                                onPress={() => {
                                    navigation.push('CreateInvReservation', {
                                        initStartDate: getMonthlyFirstDay(selectedMonth),
                                    })
                                }}
                            />
                            <IconParam flex={1} iconName={'transfer'} paramName={t('admin:NumberOfPeopleSent')} hasBorder count={orderSentNum ?? 0} />
                        </View>
                    )}
                    {displayType != 'orderInvReservations' && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 15,
                            }}>
                            <IconParam flex={1.1} iconName={'transferReceive'} paramName={t('admin:NumberOfPeopleExpectedToCome')} iconSize={20} count={receiveWantSendNum ?? 0} />
                            <IconParam flex={1} iconName={'transferReceive'} paramName={t('admin:NumberOfPeopleAccepted')} hasBorder count={receiveSentNum ?? 0} />
                        </View>
                    )}
                </View>
            </View>
        )
    }, [displayType, orderWantSendNum, orderSentNum, receiveWantSendNum, receiveSentNum])

    const _footer = () => {
        if (displayType == 'receiveInvReservations') {
            return <></>
        }
        return (
            <View
                style={{
                    marginTop: 20,
                    marginHorizontal: 10,
                }}>
                <AppButton
                    onPress={() => {
                        navigation.push('CreateInvReservation', {})
                    }}
                    title={t('admin:SendYourSupport')}
                />
                <BottomMargin />
            </View>
        )
    }

    const _onDateChange = (date: CustomDate) => {
        setState((prev) => ({
            ...prev,
            selectedMonth: date,
        }))
    }

    useEffect(() => {
        setState((prev) => ({
            ...prev,
            updateCache: updateCache + 1,
        }))
    }, [selectedMonth])

    const onRequestTypeChange = (types: InvReservationDisplayType) => {
        const newMonthData = invReservations && invReservations[types]?.items?.sort((a, b) => (a.startDate ?? 0) - (b.startDate ?? 0))
        setState((prev) => ({
            ...prev,
            displayType: types,
            displayData: newMonthData,
        }))
    }

    useEffect(() => {
        return () => {
            setState(initialState)
            setDateUpdate(dateUpdate + 1)
        }
    }, [myCompanyId])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        ;(async () => {
            try {
                if (myCompanyId == undefined || isFetching != true) {
                    setState((prev) => ({ ...prev, isFetching: false }))
                    return
                }
                dispatch(setLoading(true))
                const result = await getInvReservationListOfTargetCompanyAndMonth({
                    companyId: myCompanyId,
                    month: selectedMonth,
                })
                const orderWantSendNum =
                    sum(
                        invReservations?.orderInvReservations?.items?.map((iRes) =>
                            sum(iRes.monthlyInvRequests?.items?.filter((iReq) => iReq.isApplication && iReq.isApproval != false).map((invR) => invR.workerIds?.length ?? 0)),
                        ),
                    ) ?? 0
                const orderSentNum =
                    sum(
                        invReservations?.orderInvReservations?.items?.map((iRes) =>
                            sum(iRes.monthlyInvRequests?.items?.filter((iReq) => iReq.isApplication && iReq.isApproval == true).map((invR) => invR.workerIds?.length ?? 0)),
                        ),
                    ) ?? 0
                const receiveWantSendNum = sum(invReservations?.receiveInvReservations?.items?.map((iRes) => sum(iRes.monthlyInvRequests?.items?.map((invR) => invR.workerIds?.length ?? 0)))) ?? 0
                const receiveSentNum =
                    sum(
                        invReservations?.receiveInvReservations?.items?.map((iRes) =>
                            sum(iRes.monthlyInvRequests?.items?.filter((iReq) => iReq.isApplication && iReq.isApproval == true).map((invR) => invR.workerIds?.length ?? 0)),
                        ),
                    ) ?? 0
                setState((prev) => ({ ...prev, orderWantSendNum, orderSentNum, receiveWantSendNum, receiveSentNum, isFetching: false }))
                dispatch(setIsNavUpdating(false))
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                const fetchMonthBaseText = cachedConstructionsKey.current.substring(cachedConstructionsKey.current.length - 7).replace(/-/g, '/')
                if (monthBaseText(selectedMonth) == fetchMonthBaseText) {
                    // __DEV__ && console.log('3-4、カレント月とフェッチデータが一致したので表示データを更新')
                    setState((prev) => ({
                        ...prev,
                        invReservations: result.success,
                    }))
                    const cachedRequestConstructionsResult = await updateCachedData({ key: cachedConstructionsKey.current, value: result.success })
                    if (cachedRequestConstructionsResult.error) {
                        dispatch(
                            setToastMessage({
                                text: cachedRequestConstructionsResult.error,
                                type: 'error',
                            }),
                        )
                    }
                    deleteParamOfLocalUpdateScreens({
                        screens: localUpdateScreens,
                        screenName: 'InvReservationList',
                        startDate: getMonthlyFirstDay(selectedMonth).totalSeconds,
                        endDate: getMonthlyFinalDay(selectedMonth).totalSeconds,
                        paramName: 'dates',
                    })
                    await deleteParamOfUpdateScreens({
                        accountId,
                        screenName: 'InvReservationList',
                        startDate: getMonthlyFirstDay(selectedMonth).totalSeconds,
                        endDate: getMonthlyFinalDay(selectedMonth).totalSeconds,
                        paramName: 'dates',
                    })
                } else {
                    /**
                     * カレント月とフェッチデータが一致しないので、フェッチデータは捨てる（日送り連打対策）
                     */
                    //  __DEV__ && console.log('3-5、日送り連打でカレント月とフェッチデータが一致しない（フェッチデータは捨てる）')
                    // __DEV__ && console.log('currentDate: ' + monthBaseText(month) + '\nfetchDate: ' + fetchDayBaseTextWithoutDate)
                    dispatch(setIsNavUpdating(true))
                }
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
        })()
    }, [isFetching])

    /**
     * @summary 常用依頼の工事一覧のキャッシュを更新する副作用関数
     * @purpose アプリ側にKVSによるキャッシュを設けて一覧の初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            const result = await getCachedData<CompanyInvReservationListType>(cachedConstructionsKey.current)
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
                const orderWantSendNum =
                    sum(
                        result.success?.orderInvReservations?.items?.map((iRes) =>
                            sum(iRes.monthlyInvRequests?.items?.filter((iReq) => iReq.isApplication && iReq.isApproval != false).map((invR) => invR.workerIds?.length ?? 0)),
                        ),
                    ) ?? 0
                const orderSentNum =
                    sum(
                        result.success?.orderInvReservations?.items?.map((iRes) =>
                            sum(iRes.monthlyInvRequests?.items?.filter((iReq) => iReq.isApplication && iReq.isApproval == true).map((invR) => invR.workerIds?.length ?? 0)),
                        ),
                    ) ?? 0
                const receiveWantSendNum = sum(result.success?.receiveInvReservations?.items?.map((iRes) => sum(iRes.monthlyInvRequests?.items?.map((invR) => invR.workerIds?.length ?? 0)))) ?? 0
                const receiveSentNum =
                    sum(
                        result.success?.receiveInvReservations?.items?.map((iRes) =>
                            sum(iRes.monthlyInvRequests?.items?.filter((iReq) => iReq.isApplication && iReq.isApproval == true).map((invR) => invR.workerIds?.length ?? 0)),
                        ),
                    ) ?? 0
                setState((prev) => ({ ...prev, invReservations: result.success, orderWantSendNum, orderSentNum, receiveWantSendNum, receiveSentNum }))
            }
        })()
    }, [updateCache])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))
        }
    }, [isFocused, route, myCompanyId])

    useEffect(() => {
        if (invReservations) {
            setState((prev) => ({ ...prev, displayData: invReservations[displayType]?.items }))
        }
    }, [invReservations])

    const _onRefresh = async () => {
        if (isFocused) dispatch(setLoading(true))
        setState((prev) => ({ ...prev, isFetching: true }))
    }

    return (
        <SwitchPage
            dateUpdate={dateUpdate}
            dateInitValue={selectedMonth}
            data={displayData}
            header={_header}
            content={_content}
            emptyProps={
                loading
                    ? undefined
                    : {
                          text: t('admin:ThereIsNoSupportForTheCurrentMonthYet'),
                      }
            }
            onRefresh={_onRefresh}
            footer={_footer}
            onDateChange={_onDateChange}
        />
    )
}
export default InvReservationList

const styles = StyleSheet.create({})
