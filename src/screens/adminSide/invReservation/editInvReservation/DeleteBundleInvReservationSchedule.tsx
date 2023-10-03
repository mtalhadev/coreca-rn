import React, { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { InputDateTimeBox } from '../../../../components/organisms/inputBox/InputDateTimeBox'
import { _weekDayList } from '../../../../utils/ext/Date.extensions'
import {
    CustomDate,
    dayBaseText,
    dayBaseTextWithoutDate,
    getDailyEndTime,
    getDailyStartTime,
    toCustomDateFromTotalSeconds,
} from '../../../../models/_others/CustomDate'
import { AppButton } from '../../../../components/atoms/AppButton'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { TableArea } from '../../../../components/atoms/TableArea'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import isEmpty from 'lodash/isEmpty'
import { StoreType } from '../../../../stores/Store'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { ScrollViewInstead } from '../../../../components/atoms/ScrollViewInstead'
import { useIsFocused } from '@react-navigation/native'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { InvReservationType } from '../../../../models/invReservation/InvReservation'
import { deleteInvRequestsForSpan, getInvReservation } from '../../../../usecases/invReservation/InvReservationCase'
type NavProps = StackNavigationProp<RootStackParamList, 'DeleteBundleInvReservationSchedule'>
type RouteProps = RouteProp<RootStackParamList, 'DeleteBundleInvReservationSchedule'>

type InitialStateType = {
    invReservationId?: string
    invReservationDays: number
    disable: boolean
    update: number
    bundleStartDate?: CustomDate
    bundleEndDate?: CustomDate
    invReservation?: InvReservationType
}

const initialState: InitialStateType = {
    invReservationDays: 0,
    disable: true,
    update: 0,
}
const DeleteBundleInvReservationSchedule = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ invReservationId, disable, bundleStartDate, bundleEndDate, update, invReservation }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)

    const startDate = useMemo(() => (invReservation?.startDate ? toCustomDateFromTotalSeconds(invReservation?.startDate) : undefined), [invReservation?.startDate])
    const endDate = useMemo(() => (invReservation?.endDate ? toCustomDateFromTotalSeconds(invReservation?.endDate) : undefined), [invReservation?.endDate])
    const extraDates = useMemo(() => (invReservation?.extraDates ? invReservation?.extraDates.map((date) => toCustomDateFromTotalSeconds(date)) : undefined), [invReservation?.extraDates])
    const otherOffDays = useMemo(() => (invReservation?.otherOffDays ? invReservation?.otherOffDays.map((date) => toCustomDateFromTotalSeconds(date)) : undefined), [invReservation?.otherOffDays])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])
    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(invReservationId)) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const invReservationResult = await getInvReservation({
                    invReservationId: invReservationId,
                })
                if (invReservationResult.error || invReservationResult.success == undefined) {
                    throw {
                        error: invReservationResult.error,
                    }
                }
                setState((prev) => ({ ...prev, invReservation: invReservationResult.success }))
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
            }
        })()
    }, [invReservationId, update])

    useEffect(() => {
        if (bundleStartDate?.totalSeconds != undefined && bundleEndDate?.totalSeconds != undefined) {
            setState((prev) => ({ ...prev, disable: false }))
        } else {
            setState((prev) => ({ ...prev, disable: true }))
        }
    }, [bundleStartDate, bundleEndDate])

    useMemo(() => {
        setState((prev) => ({ ...prev, invReservationId: route.params?.invReservationId }))
    }, [])

    useEffect(() => {
        navigation.setOptions({
            title: t('admin:DeleteInBulk'),
        })
    }, [navigation])

    const _deleteInvRequestsForSpan = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            const result = await deleteInvRequestsForSpan({
                invReservationId: invReservationId,
                startDate: bundleStartDate,
                endDate: bundleEndDate,
            })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            } else {
                dispatch(
                    setToastMessage({
                        text: result.success + t('admin:InvRequestsDeleted'),
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
        }
    }

    return (
        <ScrollViewInstead>
            <View
                style={{
                    padding: 15,
                    backgroundColor: '#fff',
                }}>
                <TableArea
                    columns={[
                        {
                            key: invReservation?.myCompanyId == myCompanyId ? t('admin:PeriodToSendInSupport') : t('admin:PeriodToComeInSupport'),
                            content: (startDate ? dayBaseTextWithoutDate(startDate) : '未定') + ' 〜 ' + (endDate ? dayBaseTextWithoutDate(endDate) : '未定'),
                        },
                        {
                            key: invReservation?.myCompanyId == myCompanyId ? t('admin:DateToSendInSpecificSupport') : t('admin:DaysToComeWithSpecificSupport'),
                            content: extraDates?.map((date) => dayBaseTextWithoutDate(date))?.join(',  '),
                        },
                        {
                            key: invReservation?.myCompanyId == myCompanyId ? t('admin:InitialNumberOfPeopleToSendInSupport') : t('admin:InitialNumberOfPeopleComingInSupport'),
                            content: invReservation?.initialWorkerCount?.toString() ?? '0',
                        },
                        {
                            key: t('common:RegularHolidays'),
                            content: invReservation?.offDaysOfWeek?.join(', '),
                        },
                        {
                            key: t('common:OtherHolidays'),
                            content: otherOffDays?.map((offDay: CustomDate) => dayBaseText(offDay)).join(', '),
                        },
                    ]}
                />
            </View>
            <InputDateTimeBox
                title={t('admin:FirstDayToDelete')}
                required={true}
                style={styles.formItem}
                value={bundleStartDate}
                initDateInput={bundleStartDate}
                onValueChangeValid={(value) => {
                    if (value) {
                        setState((prev) => ({ ...prev, bundleStartDate: getDailyStartTime(value) }))
                    }
                }}
            />
            <InputDateTimeBox
                title={t('admin:LastDayToDelete')}
                required={true}
                style={styles.formItem}
                minDateTime={bundleStartDate}
                value={bundleEndDate}
                initDateInput={bundleEndDate}
                onValueChangeValid={(value) => {
                    if (value) {
                        setState((prev) => ({ ...prev, bundleEndDate: getDailyEndTime(value) }))
                    }
                }}
            />
            <AppButton
                title={t('admin:DeleteAboveSchedule')}
                height={50}
                style={{
                    marginHorizontal: 20,
                    marginTop: 30,
                    marginBottom: 10,
                }}
                disabled={disable}
                onPress={() => {
                    Alert.alert(t('admin:WantToDeleteSitesTitle'), t('admin:WantToDeleteSitesMessage'), [
                        { text: t('admin:Deletion'), onPress: () => _deleteInvRequestsForSpan() },
                        {
                            text: t('admin:Cancel'),
                            style: 'cancel',
                        },
                    ])
                }}
            />
            <BottomMargin />
        </ScrollViewInstead>
    )
}
export default DeleteBundleInvReservationSchedule

const styles = StyleSheet.create({
    formItem: {
        paddingTop: 25,
    },
})
