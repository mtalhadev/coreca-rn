import { RouteProp, useNavigation, useRoute, useIsFocused } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import cloneDeep from 'lodash/cloneDeep'
import flatten from 'lodash/flatten'
import range from 'lodash/range'
import uniqBy from 'lodash/uniqBy'
import React, { useState, useContext, useEffect, useMemo, useRef } from 'react'
import { Alert, ListRenderItem, ListRenderItemInfo, View, Text } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppButton } from '../../../../components/atoms/AppButton'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { InvRequestDateBox } from '../../../../components/organisms/invRequest/InvRequestDateBox'
import { InvRequestDateInfoType } from '../../../../components/organisms/invRequest/InvRequestDateBox'
import { SwitchPage } from '../../../../components/template/SwitchPage'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeUnmount } from '../../../../fooks/useUnmount'
import { InvRequestCLType, toInvRequestCLType } from '../../../../models/invRequest/InvRequestType'
import { MonthlyInvRequestType } from '../../../../models/invRequest/MonthlyInvRequestType'
import { InvReservationCLType, InvReservationType, toInvReservationCLType } from '../../../../models/invReservation/InvReservation'
import { UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
import {
    CustomDate,
    newCustomDate,
    monthBaseText,
    getMonthlyFirstDay,
    getMonthlyFinalDay,
    getMonthlyDays,
    dayBaseTextWithoutDate,
    getDailyStartTime,
    nextDay,
    dayOfWeekText,
    nextMonth,
    isHoliday,
} from '../../../../models/_others/CustomDate'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { ID } from '../../../../models/_others/ID'
import { _getFirestore } from '../../../../services/firebase/FirestoreService'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { StoreType } from '../../../../stores/Store'
import { setToastMessage, setLoading, ToastMessage, setLocalUpdateScreens } from '../../../../stores/UtilSlice'
import { genKeyName, getCachedData, updateCachedData } from '../../../../usecases/CachedDataCase'
import { addInvRequest, deleteInvRequest } from '../../../../usecases/invRequest/invRequestCase'
import { getInvReservationDetail } from '../../../../usecases/invReservation/InvReservationCase'
import { checkLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { deleteParamOfUpdateScreens } from '../../../../usecases/updateScreens/CommonUpdateScreensCase'
import { checkIsHolidayOfConstruction } from '../../../../usecases/worker/WorkerListCase'
import { THEME_COLORS } from '../../../../utils/Constants'
import { GlobalStyles } from '../../../../utils/Styles'
import { getUuidv4 } from '../../../../utils/Utils'
import { RootStackParamList } from '../../../Router'
import { InvReservationDetailRouterContext } from './InvReservationDetailRouter'

type NavProps = StackNavigationProp<RootStackParamList, 'InvReservationInvRequestList'>
type RouteProps = RouteProp<RootStackParamList, 'InvReservationInvRequestList'>

type InitialStateType = {
    selectedMonth?: CustomDate
    invRequests?: InvRequestCLType[]
    invReservation?: InvReservationCLType
    isFetching: boolean
    localAddInvRequests?: InvRequestCLType[]
    localDeleteInvRequestIds?: ID[]
}
type CachedInvReservationInvRequestListType = {
    invReservation?: InvReservationCLType
    invRequests?: InvRequestCLType[]
    updatedAt?: number
}
const thisMonth = newCustomDate()

const initialState: InitialStateType = {
    selectedMonth: thisMonth,
    isFetching: false,
}

const InvReservationInvRequestList = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const loading = useSelector((state: StoreType) => state.util.loading)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const [{ selectedMonth, invRequests, invReservation, isFetching, localAddInvRequests, localDeleteInvRequestIds }, setState] = useState(initialState)
    const { invReservationId } = useContext(InvReservationDetailRouterContext)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating) //アップデート中として、trueの時はヘッダーのアプデが押せなくなる。
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const holidays = useSelector((state: StoreType) => state.util.holidays)
    const [dateUpdate, setDateUpdate] = useState(0)

    const unsubscribeRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)

    /**
     * 内容としては、invRequestsのようなものだが、実際に表示するための配列であり、現場あるなしに関わらず、日数分存在する。
     */
    const monthlyData = useMemo(() => {
        if (selectedMonth == undefined) {
            return []
        }
        let _monthlyData: InvRequestDateInfoType[] = []

        if (invReservation?.startDate == undefined || invReservation?.endDate == undefined) {
            return _monthlyData
        }
        const monthlyDays = getMonthlyDays(selectedMonth)
        let dateNow = cloneDeep(getMonthlyFirstDay(selectedMonth))
        range(monthlyDays).forEach(async () => {
            if (invRequests == undefined) {
                return
            }
            const localDeleteInvRequestIdsSet = new Set(localDeleteInvRequestIds)
            const _invRequests = uniqBy([...invRequests, ...(localAddInvRequests ?? [])], 'invRequestId').filter((data) => data.invRequestId && !localDeleteInvRequestIdsSet.has(data.invRequestId))
            const targetInvRequest = _invRequests?.find((inv) => (inv?.date ? dayBaseTextWithoutDate(dateNow) == dayBaseTextWithoutDate(inv.date) : undefined))
            // 申請が存在していれば工期外でも表示。
            if (targetInvRequest) {
                _monthlyData = [
                    ..._monthlyData,
                    ...[
                        {
                            ...targetInvRequest,
                            date: dateNow,
                        },
                    ],
                ]
            } else {
                if (invReservation?.startDate == undefined || invReservation?.endDate == undefined) {
                    return
                }
                const extraDatesSet = new Set(invReservation.extraDates?.map((date) => dayBaseTextWithoutDate(date)))
                // 工期判定（日付単位）
                if (
                    (dateNow?.totalSeconds >= getDailyStartTime(invReservation?.startDate)?.totalSeconds &&
                        dateNow?.totalSeconds < getDailyStartTime(nextDay(invReservation?.endDate, 1)).totalSeconds) ||
                    extraDatesSet.has(dayBaseTextWithoutDate(dateNow))
                ) {
                    // 休み除外
                    if (!checkIsHolidayOfConstruction(invReservation, dateNow, holidays) || extraDatesSet.has(dayBaseTextWithoutDate(dateNow))) {
                        _monthlyData.push({
                            date: dateNow,
                            myCompanyId: invReservation.myCompanyId, //+ボタン表示のために必要
                        })
                    }
                }
            }
            dateNow = nextDay(dateNow)
        })
        return _monthlyData
    }, [invRequests, invReservation]) //月が変わったら、キャッシュなりDBなりから取得したデータでinvRequestsが切り替わって、monthDataが変わるという流れ。

    useSafeUnmount(setState, initialState)

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isFocused, selectedMonth])

    useSafeUnmount(setState, initialState, () => setDateUpdate(dateUpdate + 1))

    useEffect(() => {
        return () => {
            setState(initialState)
            setDateUpdate(dateUpdate + 1)
        }
    }, [myCompanyId])

    useEffect(() => {
        if (isNavUpdating && isFocused) {
            //アプデボタンが押された時・DBフェッチした月が違った時
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useEffect(() => {
        if (!isFetching && isFocused) {
            dispatch(setLoading(false))
            dispatch(setIsNavUpdating(false)) //アプデ解除・ヘッダーのアプデが押せるようになる。
        }
    }, [isFetching])

    useEffect(() => {
        setState((prev) => ({ ...prev, selectedMonth: selectedMonth ?? thisMonth }))
    }, [route])

    useEffect(() => {
        isScreenOnRef.current = isFocused
    }, [isFocused])

    /**
     * DBフェッチ
     */
    useEffect(() => {
        ;(async () => {
            try {
                /**
                 * 更新ロジック用
                 * 初回更新なくす。fetchは数字よりbooleanの方が初回更新を防げて良い。
                 */
                if (!isScreenOnRef.current) return
                if (invReservationId == undefined || selectedMonth == undefined || isFetching != true || !isFocused) {
                    return
                }
                if (isFocused) {
                    dispatch(setLoading(true))
                }

                const __startOfMonth = cloneDeep(getMonthlyFirstDay(selectedMonth))

                /**
                 * monthが切り替わる前に先に生成。
                 */
                const __cachedKey = genKeyName({
                    screenName: 'InvReservationInvRequestList',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                    invReservationId: invReservationId,
                    /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                    month: __startOfMonth ? monthBaseText(__startOfMonth).replace(/\//g, '-') : '',
                })
                const result = await getCachedData<CachedInvReservationInvRequestListType>(__cachedKey ?? 'no-id')

                const db = _getFirestore()
                unsubscribeRef.current = db
                    .collection('MonthlyInvRequest')
                    .where('companyId', '==', myCompanyId)
                    .where('invReservationId', '==', invReservationId)
                    .where('month', '>=', __startOfMonth?.totalSeconds)
                    .where('month', '<', nextMonth(__startOfMonth).totalSeconds)
                    .onSnapshot(async (data) => {
                        const _monthlyData = data.docs.map((doc) => doc.data())[0] as MonthlyInvRequestType | undefined
                        if (_monthlyData == undefined) return
                        if (result.success) {
                            if (result.success.updatedAt && _monthlyData?.updatedAt && result.success.updatedAt > _monthlyData?.updatedAt) {
                                // キャッシュよりDBが古い場合、更新しない
                                return
                            }
                        }
                        const _invReservation = _monthlyData?.invReservation ? toInvReservationCLType(_monthlyData?.invReservation) : undefined
                        const _invRequests = _monthlyData?.invRequests?.map((inv) => toInvRequestCLType(inv))
                        setState((prev) => ({
                            ...prev,
                            invReservation: _invReservation,
                            invRequests: _invRequests,
                            isFetching: false,
                        }))
                        dispatch(setLoading(false))
                        dispatch(setIsNavUpdating(false))

                        const cachedResult = await updateCachedData({ key: __cachedKey, value: { invRequests: _invRequests, invReservation: _invReservation } ?? {} })
                        if (cachedResult.error) {
                            const _error = cachedResult as CustomResponse
                            dispatch(
                                setToastMessage({
                                    text: getErrorToastMessage(_error),
                                    type: 'error',
                                }),
                            )
                        }
                    })

                    if (result.success) {
                    let _invReservation: InvReservationCLType = {}
                    if (result.success?.invReservation == undefined) {
                        const _invReservationResult = await getInvReservationDetail({
                            invReservationId,
                            myCompanyId,
                        })
                        if (_invReservationResult.error) {
                            throw {
                                error: _invReservationResult.error,
                                errorCode: _invReservationResult.errorCode,
                            }
                        }
                        _invReservation = _invReservationResult.success ?? {}
                        const cachedResult = await updateCachedData({ key: __cachedKey, value: { invRequests: result.success.invRequests, invReservation: _invReservation } ?? {} })
                        if (cachedResult.error) {
                            const _error = cachedResult as CustomResponse
                            dispatch(
                                setToastMessage({
                                    text: getErrorToastMessage(_error),
                                    type: 'error',
                                }),
                            )
                        }
                    }
                    setState((prev) => ({ ...prev, invReservation: result.success?.invReservation ?? _invReservation, invRequests: result.success?.invRequests ?? [] }))
                    dispatch(setLoading(false))
                }
                if (selectedMonth) {
                    await deleteParamOfUpdateScreens({
                        accountId,
                        screenName: 'InvReservationInvRequestList',
                        startDate: getMonthlyFirstDay(selectedMonth).totalSeconds,
                        endDate: getMonthlyFinalDay(selectedMonth).totalSeconds,
                        id: invReservationId,
                        paramName: 'idAndDates',
                    })
                }
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            }finally{
                setState((prev) => ({ ...prev, isFetching: false }))
                dispatch(setLoading(false))
            }
        })()
    }, [isFetching])

    // 画面を閉じたときに時にonSnapshotをunsubscribeする
    useEffect(() => {
        return () => {
            if (unsubscribeRef.current && isScreenOnRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
                isScreenOnRef.current = false
            }
        }
    }, [isFocused])

    // 月変更時にonSnapshotをunsubscribeする（前月のデータ更新が続くのを防ぐため）
    useEffect(() => {
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
            }
        }
    }, [selectedMonth])

    const _onRefresh = async () => {
        setState((prev) => ({ ...prev, isFetching: true }))
    }

    const _onDateChange = async (date: CustomDate) => {
        setState((prev) => ({
            ...prev,
            selectedMonth: date,
        }))
    }

    const _addInvRequest = async (date?: CustomDate) => {
        try {
            if (invReservationId == undefined) {
                throw {
                    error: t('admin:NoInvRequestInformationAvailable'),
                }
            }
            if (date == undefined) {
                throw {
                    error: t('admin:NoOnsiteDateAndTime'),
                }
            }
            dispatch(setLoading('unTouchable'))
            // DB挿入されるまでに時間かかるため、先に新規現場を画面に表示させる
            const newInvRequestId = getUuidv4()
            const newInvRequest: InvRequestCLType = {
                invRequestId: newInvRequestId,
                invReservationId,
                targetCompanyId: invReservation?.targetCompanyId,
                myCompanyId,
                isApproval: invReservation?.targetCompany?.isFake ? true : 'waiting',
                isApplication: invReservation?.targetCompany?.isFake ? true : false,
                workerIds: [],
                date: getDailyStartTime(date),
                workerCount: invReservation?.initialWorkerCount,
                updateWorkerId: myWorkerId,
                attendanceIds: [],
                relatedInvRequestIds: [],
                invRequestStatus: invReservation?.targetCompany?.isFake ? 'approval' : 'unapplied',
            }
            let _invRequests = cloneDeep(invRequests)
            if (_invRequests == undefined) {
                _invRequests = [newInvRequest]
            } else {
                _invRequests?.push(newInvRequest)
            }
            setState((prev) => ({ ...prev, invRequests: _invRequests }))
            const result = await addInvRequest({
                isToFakeCompany: invReservation?.targetCompany?.isFake,
                invRequest: newInvRequest,
                invReservation: invReservation,
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            setState((prev) => ({ ...prev, localAddInvRequests: [...(localAddInvRequests ?? []), newInvRequest] }))
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

    const _deleteInvRequest = async (invRequestId?: string) => {
        try {
            if (invRequestId == undefined) {
                throw {
                    error: t('admin:NoOnInvRequestInformationAvailable'),
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: invReservationId ?? 'no-id',
                modelType: 'invReservation',
            })
            if (lockResult.error) {
                throw {
                    error: lockResult.error,
                }
            }
            const _invRequests = cloneDeep(invRequests)
            const newInvRequests = _invRequests?.filter((inv) => inv.invRequestId != invRequestId)
            setState((prev) => ({ ...prev, invRequests: newInvRequests, localDeleteInvRequestIds: [...(localDeleteInvRequestIds ?? []), invRequestId] }))

            const result = await deleteInvRequest({
                invRequestId,
            })
            if (result.error) {
                throw {
                    error: result.error,
                }
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
    }

    /**
     * monthlyDataは日数分作成されて、日付必須と、現場情報が含まれている。
     */
    const _renderItem: ListRenderItem<InvRequestDateInfoType> = (info: ListRenderItemInfo<InvRequestDateInfoType>) => {
        const { item, index } = info
        return (
            <InvRequestDateBox
                style={{
                    marginHorizontal: 5,
                    marginTop: 8,
                }}
                item={item}
                key={index}
                onPressPlus={() => {
                    _addInvRequest(item?.date)
                }}
                onPressMinus={() => {
                    if ((item.workerIds?.length ?? 0) > 0) {
                        Alert.alert(t('admin:WantToDeleteTheInvRequest'), t('admin:OperationCannotBeUndone'), [
                            { text: t('common:Deletion'), onPress: () => _deleteInvRequest(item?.invRequestId) },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    } else {
                        _deleteInvRequest(item?.invRequestId)
                    }
                }}
            />
        )
    }

    const _header = () => {
        return (
            <View
                style={{
                    paddingTop: 65,
                    backgroundColor: '#fff',
                    borderBottomColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                    borderBottomWidth: 1,
                    paddingBottom: 15,
                }}>
                {invReservation?.myCompanyId == myCompanyId && (
                    <>
                        <AppButton
                            title={t('admin:EditAllSupportTogether')}
                            style={{
                                marginHorizontal: 20,
                            }}
                            onPress={() => {
                                navigation.push('EditInvRequest', { invReservationId: invReservationId, isBundle: true })
                            }}
                        />
                        <Text style={{ ...GlobalStyles.smallGrayText, textAlign: 'center', marginTop: 15 }}>{t('admin:EditAllSupportsTogetherDescription')}</Text>
                        <AppButton
                            title={t('admin:EditTogetherTheNumberOfPeopleToSendInSupport')}
                            style={{
                                marginHorizontal: 20,
                                marginTop: 20,
                            }}
                            onPress={() => {
                                navigation.push('EditInvRequest', { invReservationId })
                            }}
                            height={36}
                            fontSize={12}
                            isGray
                        />
                        <AppButton
                            title={t('admin:ArrangeToSendInABatchOfSupport')}
                            style={{
                                // paddingHorizontal: 20,
                                marginHorizontal: 20,
                                marginTop: 10,
                            }}
                            onPress={() => {
                                navigation.push('InvReservationArrangementManage', {
                                    invReservationId: invReservationId,
                                })
                            }}
                            height={36}
                            fontSize={12}
                            isGray
                        />
                        <AppButton
                            title={t('admin:DeleteAllInvRequestsTogether')}
                            style={{
                                marginTop: 20,
                                marginHorizontal: 20,
                            }}
                            onPress={() => {
                                setState(initialState)
                                navigation.push('DeleteBundleInvReservationSchedule', { invReservationId: invReservationId })
                            }}
                        />
                    </>
                )}
            </View>
        )
    }

    const _footer = () => {
        return (
            <>
                {invReservation?.myCompanyId == myCompanyId && (
                    <AppButton
                        title={t('admin:CreateAnExtendedPeriodOfTime')}
                        style={{
                            marginHorizontal: 20,
                            marginTop: 20,
                        }}
                        onPress={() => {
                            //全曜日が定休日に指定されている場合は終了
                            if (invReservation?.offDaysOfWeek?.length == 7) {
                                return
                            }
                            const lastDate = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].date : invReservation?.endDate ? nextDay(invReservation?.endDate) : undefined
                            if (lastDate) {
                                let addDate = nextDay(lastDate)
                                const otherOffDaysSet = new Set(invReservation?.otherOffDays?.map((date) => dayBaseTextWithoutDate(date)))
                                const offDaysOfWeekSet = new Set(invReservation?.offDaysOfWeek)
                                while (
                                    offDaysOfWeekSet?.has(dayOfWeekText(addDate)) ||
                                    otherOffDaysSet.has(dayBaseTextWithoutDate(addDate)) ||
                                    (offDaysOfWeekSet.has('祝') && isHoliday(addDate, holidays))
                                ) {
                                    addDate = nextDay(addDate, 1)
                                }
                                _addInvRequest(addDate)
                                if (invReservationId) {
                                    const newLocalUpdateScreens: UpdateScreenType[] = [
                                        {
                                            screenName: 'InvReservationDetail',
                                            ids: [
                                                ...flatten(
                                                    localUpdateScreens
                                                        .filter((screen) => screen.screenName == 'InvReservationDetail')
                                                        .map((screen) => screen.ids?.filter((data) => data != undefined) as string[]),
                                                ),
                                                invReservationId,
                                            ],
                                        },
                                    ]
                                    dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
                                }
                            }
                        }}
                        isGray
                        iconName="plus"
                        iconColor={THEME_COLORS.OTHERS.GRAY}
                    />
                )}
                <BottomMargin />
            </>
        )
    }

    return (
        <SwitchPage
            dateUpdate={dateUpdate}
            dateInitValue={selectedMonth}
            data={monthlyData}
            backgroundColor={THEME_COLORS.OTHERS.SUPER_LIGHT_GRAY}
            content={_renderItem}
            header={_header}
            emptyProps={
                loading
                    ? undefined
                    : {
                          text: invReservation?.myCompanyId == myCompanyId ? t('admin:ItIsOutsideThePeriodToSendInSupport') : t('admin:ItIsOutsideTheTimeframeToComeInSupportOfTheProject'),
                      }
            }
            onDateChange={_onDateChange}
            footer={_footer}
            onRefresh={_onRefresh}
        />
    )
}
export default InvReservationInvRequestList
