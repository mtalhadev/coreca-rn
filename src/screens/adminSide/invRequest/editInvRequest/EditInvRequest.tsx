import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, AppState, Text } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { SwitchEditOrCreateProps } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { AppButton } from '../../../../components/atoms/AppButton'
import { LOCK_INTERVAL_TIME, PLACEHOLDER, THEME_COLORS } from '../../../../utils/Constants'
import { InputDateTimeBox } from '../../../../components/organisms/inputBox/InputDateTimeBox'
import { InputNumberBox } from '../../../../components/organisms/inputBox/InputNumberBox'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { useIsFocused } from '@react-navigation/native'
import { InputCompanyBox } from '../../../../components/organisms/inputBox/InputCompanyBox'
import { getInvReservationDetail, updateInvReservationHoliday } from '../../../../usecases/invReservation/InvReservationCase'
import { getInvRequestDetail, makeInvRequestEditNotifications, writeInvRequest, writeInvRequestsForSpan } from '../../../../usecases/invRequest/invRequestCase'
import { InvRequestCLType } from '../../../../models/invRequest/InvRequestType'
import { UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { InvReservationCLType } from '../../../../models/invReservation/InvReservation'
import { CustomDate, dayBaseText, getDailyStartTime, getTextBetweenAnotherDate, isHoliday, nextDay, timeText, toCustomDateFromTotalSeconds } from '../../../../models/_others/CustomDate'
import { TableArea } from '../../../../components/atoms/TableArea'
import { InputDateDropdownBox } from '../../../../components/organisms/inputBox/InputDateDropdownBox'
import { InputDropDownBox } from '../../../../components/organisms/inputBox/InputDropdownBox'
import { WeekOfDay, _weekDayList } from '../../../../utils/ext/Date.extensions'
import { GlobalStyles } from '../../../../utils/Styles'
import { calculateConstructionDays, getDateRange } from '../../../../usecases/construction/CommonConstructionCase'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'

type NavProps = StackNavigationProp<RootStackParamList, 'EditInvRequest'>
type RouteProps = RouteProp<RootStackParamList, 'EditInvRequest'>

type InitialStateType = {
    disable?: boolean
    invRequestIds?: string[]
    invRequest?: InvRequestCLType
    invReservation?: InvReservationCLType
    /**
     * 一括作成時に使用
     */
    bundleStartDate?: CustomDate
    bundleEndDate?: CustomDate
    offDaysOfWeek?: WeekOfDay[]
    otherOffDays?: CustomDate[]
    constructionDays: number
    isFirstFetch?: boolean
} & InvRequestCLType

const initialState: InitialStateType = {
    isFirstFetch: true,
    disable: true,
    constructionDays: 0,
}

/**
 * invRequestの個別編集
 * invRequestのまとめて作成
 * invRequestの未申請になっているものの予定人数を一括変更時に使用している
 * @param props
 * @returns
 */
const EditInvRequest = (props: Partial<SwitchEditOrCreateProps>) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const mode = props.mode ?? 'edit'
    const isBundle = route.params?.isBundle ?? false
    const holidays = useSelector((state: StoreType) => state?.util?.holidays)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    /**
     * 個別編集時はinvRequestIdがわたる。
     */
    const invRequestId = route?.params?.invRequestId
    /**
     * まとめて編集時はinvReservationIdがわたる
     */
    const invReservationId = route?.params?.invReservationId
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)

    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const [dateRange, setDateRange] = useState<CustomDate[]>([])

    const [
        { date, workerCount, disable, targetCompany, invRequestIds, invRequest, invReservation, bundleStartDate, bundleEndDate, offDaysOfWeek, otherOffDays, constructionDays, isFirstFetch },
        setState,
    ] = useState(initialState)
    const dispatch = useDispatch()

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        ;(async () => {
            try {
                if (mode == 'new') {
                    return
                }
                dispatch(setLoading(true))
                if (invRequestId) {
                    const result = await getInvRequestDetail({
                        invRequestId,
                        myCompanyId,
                    })
                    dispatch(setLoading(false))
                    if (result.error) {
                        throw {
                            error: result.error,
                        }
                    }
                    setState((prev) => ({
                        ...prev,
                        invRequest: result.success,
                        ...result.success,
                    }))
                } else if (invReservationId) {
                    const result = await getInvReservationDetail({
                        invReservationId,
                        myCompanyId,
                    })
                    dispatch(setLoading(false))
                    if (result.error) {
                        throw {
                            error: result.error,
                        }
                    }
                    setState((prev) => ({
                        ...prev,
                        invReservationId,
                        invReservation: result.success,
                        invRequestIds: result.success?.invRequestIds,
                        targetCompany: result.success?.targetCompany,
                        offDaysOfWeek: result.success?.offDaysOfWeek,
                        otherOffDays: result.success?.otherOffDays,
                        bundleStartDate: result.success?.startDate,
                        bundleEndDate: result.success?.endDate,
                    }))
                }
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: `${_error.error} / code: ${_error.errorCode}`,
                        type: 'error',
                    } as ToastMessage),
                )
            }
        })()
    }, [invReservationId, invRequestId])

    useEffect(() => {
        navigation.setOptions({
            title: mode == 'new' ? t('admin:SendYourSupport') : date ? t('admin:EditTheNumberOfPeopleToSendInSupport') : t('admin:EditScheduleToSendInSupport'),
        })
    }, [navigation])

    useEffect(() => {
        if (workerCount == undefined) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [workerCount])

    useEffect(() => {
        if (invReservationId && myWorkerId && appState == 'active' && isFocused) {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: myWorkerId ?? 'no-id',
                        targetId: invReservationId ?? 'no-id',
                        modelType: 'invReservation',
                    })
                    if (lockResult.error) {
                        dispatch(setLoading(false))
                        throw {
                            error: lockResult.error,
                        }
                    }
                } catch (error) {
                    const _error = error as CustomResponse
                    dispatch(setLoading(false))
                    dispatch(
                        setToastMessage({
                            text: `${_error.error} / code: ${_error.errorCode}`,
                            type: 'error',
                        } as ToastMessage),
                    )
                }
            })()
            const keepLock = setInterval(
                (function _update() {
                    updateLockOfTarget({
                        myWorkerId: myWorkerId ?? 'no-id',
                        targetId: invReservationId ?? 'no-id',
                        modelType: 'invReservation',
                    })
                    return _update
                })(),
                LOCK_INTERVAL_TIME,
            )
            return () => {
                clearInterval(keepLock)
                updateLockOfTarget({
                    myWorkerId: myWorkerId ?? 'no-id',
                    targetId: invReservationId ?? 'no-id',
                    modelType: 'invReservation',
                    unlock: true,
                })
            }
        }
    }, [invReservationId, myWorkerId, appState, isFocused])

    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    const _writeInvRequest = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            if (invReservationId != undefined) {
                const lockResult = await checkLockOfTarget({
                    myWorkerId: myWorkerId ?? 'no-id',
                    targetId: invReservationId ?? 'no-id',
                    modelType: 'invReservation',
                })
                if (lockResult.error) {
                    throw {
                        error: lockResult.error,
                        errorCode: lockResult.errorCode,
                    }
                }
            }
            const result = await writeInvRequest({
                invRequestId,
                invRequestIds,
                workerCount,
                isFakeCompany: targetCompany?.isFake,
                myCompanyId,
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            let newLocalUpdateScreens: UpdateScreenType[] = [
                {
                    screenName: 'InvRequestDetail',
                    ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'InvRequestDetail').map((screen) => screen.ids)), invRequestId]?.filter(
                        (data) => data != undefined,
                    ) as string[],
                },
            ]
            dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            //新規作成には非対応
            await makeInvRequestEditNotifications({ invReservation, invRequest, workerCount })
            navigation.goBack()
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: `${_error.error} / code: ${_error.errorCode}`,
                    type: 'error',
                } as ToastMessage),
            )
        } finally {
            dispatch(setLoading(false))
        }
    }

    const createSitesForSpan = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            const result = await writeInvRequestsForSpan({
                invReservation: invReservation,
                startDate: bundleStartDate,
                endDate: bundleEndDate,
                offDaysOfWeek,
                otherOffDays: otherOffDays?.map((day) => getDailyStartTime(day)),
                holidays,
                workerCount: workerCount,
            })
            if (result.error) {
                if (result.errorCode == 'OUT_OF_RANGE') {
                    setState((prev) => ({ ...prev, isVisibleModal: true }))
                } else {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            } else {
                const updateResult = await updateInvReservationHoliday({
                    invReservationId,
                    myWorkerId,
                    offDaysOfWeek,
                    otherOffDays: otherOffDays?.map((day) => getDailyStartTime(day)),
                    constructionId: invReservation?.construction?.constructionId,
                })
                if (updateResult.error) {
                    throw {
                        error: updateResult.error,
                        errorCode: updateResult.errorCode,
                    }
                }
                const newLocalUpdateScreens: UpdateScreenType[] = [
                    {
                        screenName: 'InvReservationDetail',
                        ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'InvReservationDetail').map((screen) => screen.ids)), invReservationId]?.filter(
                            (data) => data != undefined,
                        ) as string[],
                    },
                ]
                dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
                dispatch(
                    setToastMessage({
                        text: result.success + t('admin:SiteCompiledAndPrepared'),
                        type: 'success',
                    } as ToastMessage),
                )
                navigation.goBack()
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
            dispatch(setLoading(false))
        }
    }

    useEffect(() => {
        if (bundleStartDate?.totalSeconds != undefined && bundleEndDate?.totalSeconds != undefined) {
            const _dateRange = getDateRange(bundleStartDate, bundleEndDate).filter(
                (date) => date.dayOfWeekText && !offDaysOfWeek?.includes(date.dayOfWeekText) && !(offDaysOfWeek?.includes('祝') && isHoliday(date, holidays)),
            )
            setDateRange(_dateRange)
            setState((prev) => ({ ...prev, isFirstFetch: false }))
        }
        if (isFirstFetch == false) {
            if (bundleStartDate && bundleEndDate) {
                //otherOffDaysがstartDateとendDateの範囲外の場合、otherOffDaysを範囲内のものに限定する
                const _otherOffDays = otherOffDays?.filter((date) => {
                    return date?.totalSeconds >= bundleStartDate?.totalSeconds && date?.totalSeconds <= bundleEndDate?.totalSeconds
                })
                setState((prev) => ({ ...prev, otherOffDays: _otherOffDays }))
            } else {
                setState((prev) => ({ ...prev, otherOffDays: [] }))
            }
        }
    }, [bundleEndDate, bundleStartDate])

    useEffect(() => {
        if (bundleStartDate?.totalSeconds != undefined && bundleEndDate?.totalSeconds != undefined) {
            const days = calculateConstructionDays(bundleStartDate, bundleEndDate, offDaysOfWeek, otherOffDays, holidays)
            const _dateRange = getDateRange(bundleStartDate, bundleEndDate).filter(
                (date) => date.dayOfWeekText && !offDaysOfWeek?.includes(date.dayOfWeekText) && !(offDaysOfWeek?.includes('祝') && isHoliday(date, holidays)),
            )
            setDateRange(_dateRange)
            setState((prev) => ({ ...prev, constructionDays: days }))
        }
    }, [bundleStartDate, bundleEndDate, offDaysOfWeek, otherOffDays])

    useEffect(() => {
        if (bundleStartDate?.totalSeconds != undefined && bundleEndDate?.totalSeconds != undefined) {
            setState((prev) => ({ ...prev, disable: false }))
        } else {
            setState((prev) => ({ ...prev, disable: true }))
        }
    }, [bundleStartDate, bundleEndDate])

    return (
        <KeyboardAwareScrollView scrollIndicatorInsets={{ right: 1 }} style={{ backgroundColor: '#fff' }}>
            <View style={{ backgroundColor: THEME_COLORS.OTHERS.BACKGROUND }}>
                <InputCompanyBox selectedCompany={targetCompany} style={{ marginTop: 30 }} required={true} disable onlyLinkedCompany title={t('admin:WhereToApplyForSupport')} />
                {date && <InputDateTimeBox style={{ marginTop: 30 }} required={true} title={t('admin:DayOfSendingInSupport')} disable value={date} initDateInput={date} dateInputMode={'date'} />}
                <InputNumberBox
                    style={{ marginTop: 30 }}
                    required={true}
                    title={t('admin:NumberOfPeopleToSendInSupport')}
                    value={workerCount}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, workerCount: value }))
                    }}
                />
                {isBundle && (
                    <>
                        {targetCompany?.isFake && (
                            <View
                                style={{
                                    padding: 15,
                                    backgroundColor: '#fff',
                                }}>
                                <TableArea
                                    columns={[
                                        {
                                            key: '工期',
                                            content: `${invReservation?.startDate ? dayBaseText(invReservation?.startDate) : t('common:Undecided')}〜${
                                                invReservation?.endDate ? dayBaseText(invReservation?.endDate) : t('common:Undecided')
                                            }`,
                                        },
                                        {
                                            key: '集合時間',
                                            content: invReservation?.construction?.siteMeetingTime ? timeText(invReservation?.construction?.siteMeetingTime) : t('common:Undecided'),
                                        },
                                        {
                                            key: '作業時間',
                                            content: `${
                                                invReservation?.construction?.siteStartTime
                                                    ? (invReservation?.construction?.siteStartTimeIsNextDay ? t('common:Next') : '') +
                                                      getTextBetweenAnotherDate(
                                                          nextDay(invReservation?.construction?.siteStartTime, invReservation?.construction?.siteStartTimeIsNextDay ? 1 : 0),
                                                          invReservation?.construction?.siteEndTime
                                                              ? nextDay(invReservation?.construction?.siteEndTime, invReservation?.construction?.siteEndTimeIsNextDay ? 1 : 0)
                                                              : undefined,
                                                          true,
                                                      )
                                                    : t('common:Undecided')
                                            }`,
                                        },
                                        {
                                            key: '必要作業員数',
                                            content: invReservation?.construction?.siteRequiredNum?.toString(),
                                        },
                                        {
                                            key: '現場住所',
                                            content: invReservation?.construction?.siteAddress,
                                        },
                                        {
                                            key: '持ち物',
                                            content: invReservation?.construction?.siteBelongings,
                                        },
                                        {
                                            key: '備考',
                                            content: invReservation?.construction?.siteRemarks,
                                        },
                                    ]}
                                />
                            </View>
                        )}
                        <InputDateTimeBox
                            title={t('admin:FirstDayToAdd')}
                            required={true}
                            style={styles.formItem}
                            value={bundleStartDate}
                            initDateInput={bundleStartDate}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, bundleStartDate: value }))
                            }}
                        />
                        <InputDateTimeBox
                            title={t('admin:LastDayToAdd')}
                            required={true}
                            style={styles.formItem}
                            minDateTime={bundleStartDate}
                            value={bundleEndDate}
                            initDateInput={bundleEndDate}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, bundleEndDate: value }))
                            }}
                        />
                        <InputDropDownBox
                            title={t('common:Holiday')}
                            placeholder={PLACEHOLDER.HOLIDAYS}
                            selectableItems={_weekDayList}
                            selectNum={'any'}
                            value={(offDaysOfWeek ?? []) as string[]}
                            style={styles.formItem}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, offDaysOfWeek: value }))
                            }}
                        />
                        <InputDateDropdownBox
                            title={t('common:OtherHolidays')}
                            value={otherOffDays}
                            selectableItems={dateRange}
                            selectNum={'any'}
                            style={styles.formItem}
                            onValueChangeValid={(value) => {
                                setState((prev) => ({ ...prev, otherOffDays: value }))
                            }}
                        />
                        <InputNumberBox title={t('common:NoOfDaysToBeAdded')} required={true} disable={true} style={styles.formItem} value={constructionDays} />
                        <AppButton
                            title={t('common:SummaryOfAboveSchedule')}
                            height={50}
                            style={{
                                marginHorizontal: 20,
                                marginTop: 30,
                                marginBottom: 10,
                            }}
                            disabled={disable}
                            onPress={() => createSitesForSpan()}
                        />
                        <Text
                            style={[
                                GlobalStyles.smallGrayText,
                                {
                                    textAlign: 'center',
                                },
                            ]}>
                            {t('admin:DatesOnsiteWillNotBeCreated')}
                        </Text>
                    </>
                )}
            </View>
            {isBundle != true && (
                <AppButton
                    disabled={disable}
                    style={{ marginTop: 30, marginLeft: 10, marginRight: 10 }}
                    title={mode == 'edit' ? t('common:Save') : t('common:Create')}
                    onPress={() => _writeInvRequest()}
                />
            )}
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default EditInvRequest

const styles = StyleSheet.create({
    formItem: {
        paddingTop: 25,
    },
})
