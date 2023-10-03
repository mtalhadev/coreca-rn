import React, { useState, useEffect, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, StyleSheet, ListRenderItem, ListRenderItemInfo, Pressable } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { Site } from '../../../../components/organisms/site/Site'
import { CustomDate, dayBaseText, isToday, isTomorrow, monthBaseText, newCustomDate, toCustomDateFromTotalSeconds } from '../../../../models/_others/CustomDate'
import { FontStyle } from '../../../../utils/Styles'
import { SwitchPage } from '../../../../components/template/SwitchPage'
import { SummaryUIType, WorkerSummary } from '../../../../components/organisms/worker/WorkerSummary'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { WorkerDetailRouterContextType } from './WorkerDetailRouter'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { ArrangementCLType } from '../../../../models/arrangement/Arrangement'
import { useIsFocused } from '@react-navigation/native'
import cloneDeep from 'lodash/cloneDeep'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { getWorkerAttendances, getWorkerAttendancesOfMonth } from '../../../../usecases/worker/CommonWorkerCase'
import { StoreType } from '../../../../stores/Store'
import { InvoiceDownloadButton } from '../../../../components/organisms/invoice/InvoiceDownloadButton'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { _getWorker } from '../../../../services/worker/WorkerService'
import { EmptyScreen } from '../../../../components/template/EmptyScreen'

type NavProps = StackNavigationProp<RootStackParamList, 'WorkerAttendanceList'>
type RouteProps = RouteProp<RootStackParamList, 'WorkerAttendanceList'>

type InitialStateType = {
    selectedMonth: CustomDate
    arrangements: WorkerAttendanceType
    monthData: ArrangementCLType[]
    summary?: SummaryUIType
    isMyCompanyWorker?: boolean
    localUpdate: number
}

export type WorkerAttendanceType = { [Month in string]: ArrangementCLType[] }

const initialState: InitialStateType = {
    arrangements: {},
    monthData: [],
    localUpdate: 0,
    selectedMonth: newCustomDate(),
}

const WorkerAttendanceList = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)
    const [{ arrangements, selectedMonth, summary, monthData, isMyCompanyWorker, localUpdate }, setState] = useState(initialState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const { workerId } = useContext(WorkerDetailRouterContextType)
    const dispatch = useDispatch()
    const [dateUpdate, setDateUpdate] = useState(0)
    useSafeUnmount(setState, initialState, () => setDateUpdate(dateUpdate + 1))

    useEffect(() => {
        return () => {
            setState(initialState)
            setDateUpdate(dateUpdate + 1)
        }
    }, [myCompanyId])

    useEffect(() => {
        _onDateChange(selectedMonth)
    }, [arrangements])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, localUpdate: localUpdate + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    let _preDay: string | undefined = undefined

    const _onDateChange = async (date: CustomDate) => {
        setState((prev) => ({
            ...prev,
            selectedMonth: date,
        }))
    }

    useEffect(() => {
        if (arrangements && arrangements[monthBaseText(selectedMonth)]) {
            setState((prev) => ({
                ...prev,
                monthData: arrangements[monthBaseText(selectedMonth)].sort(
                    (a, b) => (a.site?.meetingDate?.totalSeconds ?? a.site?.startDate?.totalSeconds ?? 0) - (b.site?.meetingDate?.totalSeconds ?? b.site?.startDate?.totalSeconds ?? 0),
                ),
            }))
        } else {
            setState((prev) => ({ ...prev, localUpdate: localUpdate + 1 }))
        }
    }, [selectedMonth])

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        ;(async () => {
            try {
                if (workerId == undefined || myCompanyId == undefined) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const workerResult = await _getWorker({
                    workerId,
                })
                if (workerResult.error) {
                    throw {
                        error: workerResult.error,
                        errorCode: workerResult.errorCode,
                    }
                }
                const result = await getWorkerAttendancesOfMonth({
                    workerId,
                    myCompanyId,
                    month: selectedMonth,
                })
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
                const _arrangements = cloneDeep(arrangements)
                _arrangements[monthBaseText(selectedMonth)] = result.success ?? []
                setState((prev) => ({ ...prev, arrangements: _arrangements, monthData: result.success ?? [], isMyCompanyWorker: workerResult.success?.companyId == myCompanyId }))
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
                    dispatch(setIsNavUpdating(false))
                    dispatch(setLoading(false))
                }
            }
        })()
    }, [localUpdate])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, localUpdate: localUpdate + 1 }))
        }
    }, [isFocused])

    useEffect(() => {
        setState((prev) => ({ ...prev, localUpdate: localUpdate + 1 }))
    }, [route])

    useEffect(() => {
        _onDateChange(selectedMonth)
    }, [])

    const _onRefresh = async () => {
        setState((prev) => ({ ...prev, localUpdate: localUpdate + 1 }))
    }

    const _footer = () => {
        return <BottomMargin />
    }

    const _header = () => {
        return (
            <View>
                <InvoiceDownloadButton
                    title={`${t('admin:ThisEmployee')}${selectedMonth.month}${t('admin:DownloadMonthlyStatements')}`}
                    style={{ margin: 10, marginTop: 65 }}
                    invoiceType={'worker'}
                    month={selectedMonth}
                    workerId={workerId}
                />
                <WorkerSummary
                    style={{
                        margin: 10,
                    }}
                    arrangements={monthData}
                    month={selectedMonth.month}
                />
            </View>
        )
    }

    const _content: ListRenderItem<ArrangementCLType> = (info: ListRenderItemInfo<ArrangementCLType>) => {
        const { item, index } = info
        const siteDate = item?.site?.siteDate ? toCustomDateFromTotalSeconds(item?.site?.siteDate) : undefined
        const day = siteDate ? dayBaseText(siteDate) : undefined
        const displayDay = _preDay != day
        _preDay = day
        const __isToday = siteDate ? isToday(siteDate) : false
        const __isTomorrow = siteDate ? isTomorrow(siteDate) : false

        return (
            <Pressable
                style={{
                    margin: 10,
                    marginBottom: 0,
                }}>
                {displayDay && (
                    <View
                        style={{
                            marginBottom: 5,
                            marginTop: 5,
                            marginLeft: 5,
                        }}>
                        <Text
                            style={{
                                fontSize: __isToday || __isTomorrow ? 12 : 14,
                                lineHeight: 15,
                                fontFamily: __isToday || __isTomorrow ? FontStyle.regular : FontStyle.medium,
                            }}>
                            {day}
                        </Text>
                        {(__isToday || __isTomorrow) && (
                            <Text
                                style={{
                                    fontSize: 20,
                                    lineHeight: 22,
                                    fontFamily: FontStyle.black,
                                    marginTop: 5,
                                }}>
                                {__isToday ? t('common:Today') : t('common:Tomorrow')}
                            </Text>
                        )}
                    </View>
                )}
                <Site
                    site={item?.site}
                    canEditAttendance
                    arrangement={item}
                    side={'admin'}
                    onPress={(site, requestId) => {
                        navigation.push('SiteDetail', {
                            title: site?.siteNameData?.name,
                            siteId: site?.siteId,
                            requestId: requestId,
                            siteNumber: site?.siteNameData?.siteNumber,
                        })
                    }}
                />
            </Pressable>
        )
    }

    return isMyCompanyWorker ? (
        <SwitchPage
            dateUpdate={dateUpdate}
            dateInitValue={selectedMonth}
            data={monthData}
            header={_header}
            emptyProps={{ text: t('admin:AttendanceForThisMonthDoesNotExist') }}
            content={_content}
            onRefresh={_onRefresh}
            footer={_footer}
            onDateChange={_onDateChange}
        />
    ) : (
        <EmptyScreen text={t('admin:AttendanceOfOtherCompanies')} />
    )
}
export default WorkerAttendanceList

const styles = StyleSheet.create({})
