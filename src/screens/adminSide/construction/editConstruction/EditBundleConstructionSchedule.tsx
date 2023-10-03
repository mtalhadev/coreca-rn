import React, { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { InputDateTimeBox } from '../../../../components/organisms/inputBox/InputDateTimeBox'
import { InputDropDownBox } from '../../../../components/organisms/inputBox/InputDropdownBox'
import { PLACEHOLDER, THEME_COLORS } from '../../../../utils/Constants'
import { _weekDayList } from '../../../../utils/ext/Date.extensions'
import {
    CustomDate,
    dayBaseText,
    getTextBetweenAnotherDate,
    isHoliday,
    monthBaseText,
    nextDay,
    timeText,
    toCustomDateFromString,
    toCustomDateFromTotalSeconds,
} from '../../../../models/_others/CustomDate'
import { InputDateDropdownBox } from '../../../../components/organisms/inputBox/InputDateDropdownBox'
import { InputNumberBox } from '../../../../components/organisms/inputBox/InputNumberBox'
import { AppButton } from '../../../../components/atoms/AppButton'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { getMyTotalConstruction, getProjectFromContractId, updateConstruction, writeSitesForSpan } from '../../../../usecases/construction/MyConstructionCase'
import { writeSitesForSpanInstruction } from '../../../../usecases/construction/MyConstructionInstructionCase'
import { TableArea } from '../../../../components/atoms/TableArea'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import flatten from 'lodash/flatten'
import isEmpty from 'lodash/isEmpty'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'
import { StoreType } from '../../../../stores/Store'
import { calculateConstructionDays, getDateRange } from '../../../../usecases/construction/CommonConstructionCase'
import { FontStyle, GlobalStyles } from '../../../../utils/Styles'
import { ConstructionCLType } from '../../../../models/construction/Construction'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { ScrollViewInstead } from '../../../../components/atoms/ScrollViewInstead'
import { BaseModal } from '../../../../components/organisms/BaseModal'
import { useIsFocused } from '@react-navigation/native'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { toCustomDatesListFromStartAndEnd, toIdAndMonthFromStrings, UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
import { ProjectCLType } from '../../../../models/project/Project'
import { checkMyDepartment } from '../../../../usecases/department/DepartmentCase'
import { departmentsToText } from '../../../../usecases/worker/CommonWorkerCase'
type NavProps = StackNavigationProp<RootStackParamList, 'EditBundleConstructionSchedule'>
type RouteProps = RouteProp<RootStackParamList, 'EditBundleConstructionSchedule'>

type InitialStateType = {
    constructionId?: string
    contractId?: string
    constructionDays: number
    disable: boolean
    bundleStartDate?: CustomDate
    bundleEndDate?: CustomDate
    isVisibleModal?: boolean
    update: number
    isFirstFetch?: boolean
} & ConstructionCLType

const initialState: InitialStateType = {
    isFirstFetch: true,
    constructionDays: 0,
    disable: true,
    isVisibleModal: false,
    update: 0,
}
const EditBundleConstructionSchedule = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [
        {
            constructionId,
            contractId,
            constructionDays,
            disable,
            bundleStartDate,
            bundleEndDate,
            siteMeetingTime,
            siteStartTimeIsNextDay,
            siteStartTime,
            siteEndTimeIsNextDay,
            siteEndTime,
            siteRequiredNum,
            siteAddress,
            siteBelongings,
            siteRemarks,
            project,
            offDaysOfWeek,
            otherOffDays,
            isVisibleModal,
            contract,
            update,
            isFirstFetch,
        },
        setState,
    ] = useState(initialState)
    const dispatch = useDispatch()
    const holidays = useSelector((state: StoreType) => state?.util?.holidays)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const [dateRange, setDateRange] = useState<CustomDate[]>([])
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const activeDepartments = useSelector((state: StoreType) => state?.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])
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
                if (isEmpty(constructionId)) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const constructionResult = await getMyTotalConstruction({
                    id: constructionId,
                })
                if (constructionResult.error || constructionResult.success == undefined) {
                    throw {
                        error: constructionResult.error,
                    }
                }
                const projectResult = await getProjectFromContractId({
                    contractId: constructionResult.success.contractId,
                })
                if (projectResult.error) {
                    throw {
                        error: projectResult.error,
                    }
                }
                const _project = projectResult.success as ProjectCLType
                setState((prev) => ({ ...prev, ...constructionResult.success, bundleEndDate: _project?.endDate, bundleStartDate: _project?.startDate, project: _project }))
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
    }, [constructionId, update])

    useEffect(() => {
        if (bundleStartDate?.totalSeconds != undefined && bundleEndDate?.totalSeconds != undefined) {
            const _dateRange = getDateRange(bundleStartDate, bundleEndDate).filter(
                (date) => date.dayOfWeekText && !offDaysOfWeek?.includes(date.dayOfWeekText) && !(offDaysOfWeek?.includes('祝') && isHoliday(date, holidays)),
            )
            setDateRange(_dateRange)
        }
    }, [bundleEndDate, bundleStartDate, offDaysOfWeek])

    useEffect(() => {
        if (bundleStartDate?.totalSeconds != undefined && bundleEndDate?.totalSeconds != undefined) {
            setState((prev) => ({ ...prev, disable: false, isFirstFetch: false }))
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
    }, [bundleStartDate, bundleEndDate])

    useEffect(() => {
        if (bundleStartDate?.totalSeconds != undefined && bundleEndDate?.totalSeconds != undefined) {
            const days = calculateConstructionDays(bundleStartDate, bundleEndDate, offDaysOfWeek, otherOffDays, holidays)
            setState((prev) => ({ ...prev, constructionDays: days }))
        }
    }, [bundleStartDate, bundleEndDate, offDaysOfWeek, otherOffDays])

    useEffect(() => {
        setState((prev) => ({ ...prev, constructionId: route.params?.constructionId }))
        return () => {
            setState({ ...initialState })
        }
    }, [])

    useEffect(() => {
        if (route.params?.isInstruction) {
            navigation.setOptions({
                title: t('admin:RequestEditingInBulk'),
            })
        } else {
            navigation.setOptions({
                title: t('admin:EditInBulk'),
            })
        }
    }, [navigation])

    const createSitesForSpan = async () => {
        try {
            if (
                contract?.receiveCompanyId == myCompanyId &&
                !checkMyDepartment({
                    targetDepartmentIds: contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                })
            ) {
                throw {
                    error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') + '\n' + t('common:Department') + ': ' + departmentsToText(contract?.receiveDepartments?.items),
                    errorCode: 'CREATE_SITES_FOR_SPAN_ERROR',
                }
            }
            if (contract?.orderCompanyId == myCompanyId && !checkMyDepartment({ targetDepartmentIds: contract?.orderDepartmentIds, activeDepartmentIds })) {
                throw {
                    error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') + '\n' + t('common:Department') + ': ' + departmentsToText(contract?.orderDepartments?.items),
                    errorCode: 'CREATE_SITES_FOR_SPAN_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            const sitesResult = await writeSitesForSpan({
                constructionId: constructionId,
                siteStartTimeIsNextDay,
                siteEndTimeIsNextDay,
                startDate: bundleStartDate,
                endDate: bundleEndDate,
                offDaysOfWeek,
                otherOffDays,
                holidays,
                accountId,
                myCompanyId,
            })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (sitesResult.error) {
                if (sitesResult.errorCode == 'OUT_OF_RANGE') {
                    setState((prev) => ({ ...prev, isVisibleModal: true }))
                } else {
                    throw {
                        error: sitesResult.error,
                        errorCode: sitesResult.errorCode,
                    }
                }
            } else {
                const result = await updateConstruction({
                    constructionId: constructionId,
                    offDaysOfWeek,
                    otherOffDays: otherOffDays?.map((day) => day.totalSeconds),
                })
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
                const dateList = toCustomDatesListFromStartAndEnd(bundleStartDate, bundleEndDate)
                const constructionIdAndDates = dateList.map((date) => toIdAndMonthFromStrings(constructionId, date))
                const newLocalUpdateScreens: UpdateScreenType[] = [
                    {
                        screenName: 'ConstructionSiteList',
                        idAndDates: [
                            ...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'ConstructionSiteList').map((screen) => screen.idAndDates)),
                            ...constructionIdAndDates,
                        ]?.filter((data) => data != undefined) as string[],
                    },
                    {
                        screenName: 'ConstructionDetail',
                        ids: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'ConstructionDetail').map((screen) => screen.ids)), constructionId]?.filter(
                            (data) => data != undefined,
                        ) as string[],
                    },
                ]
                dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
                dispatch(
                    setToastMessage({
                        text: sitesResult.success + t('admin:SiteCompiledAndPrepared'),
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

    const createSitesForSpanInstruction = async () => {
        try {
            if (contract?.orderCompanyId == myCompanyId && !checkMyDepartment({ targetDepartmentIds: contract?.orderDepartmentIds, activeDepartmentIds })) {
                throw {
                    error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') + '\n' + t('common:Department') + ': ' + departmentsToText(contract?.orderDepartments?.items),
                }
            }
            dispatch(setLoading('unTouchable'))
            const result = await writeSitesForSpanInstruction({
                contractId: contractId,
                constructionId: constructionId,
                siteStartTimeIsNextDay,
                siteEndTimeIsNextDay,
                startDate: bundleStartDate,
                endDate: bundleEndDate,
                offDaysOfWeek,
                otherOffDays,
                holidays,
            })
            if (isFocused) {
                dispatch(setLoading(false))
            }
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
                dispatch(
                    setToastMessage({
                        text: result.success + t('admin:RequestedSiteCreation'),
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
                            key: '工期',
                            content: `${project?.startDate ? dayBaseText(project?.startDate) : t('common:Undecided')}〜${project?.endDate ? dayBaseText(project?.endDate) : t('common:Undecided')}`,
                        },
                        {
                            key: '集合時間',
                            content: siteMeetingTime ? timeText(siteMeetingTime) : t('common:Undecided'),
                        },
                        {
                            key: '作業時間',
                            content: `${
                                siteStartTime
                                    ? (siteStartTimeIsNextDay ? t('common:Next') : '') +
                                      getTextBetweenAnotherDate(
                                          nextDay(siteStartTime, siteStartTimeIsNextDay ? 1 : 0),
                                          siteEndTime ? nextDay(siteEndTime, siteEndTimeIsNextDay ? 1 : 0) : undefined,
                                          true,
                                      )
                                    : t('common:Undecided')
                            }`,
                        },
                        {
                            key: '必要作業員数',
                            content: siteRequiredNum?.toString(),
                        },
                        {
                            key: '現場住所',
                            content: siteAddress,
                        },
                        {
                            key: '持ち物',
                            content: siteBelongings,
                        },
                        {
                            key: '備考',
                            content: siteRemarks,
                        },
                    ]}
                />
            </View>
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
                minSelectNum={2}
                value={(offDaysOfWeek ?? []) as string[]}
                required={true}
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
                title={route.params?.isInstruction ? t('admin:SummaryOfAboveScheduleInstruction') : t('common:SummaryOfAboveSchedule')}
                height={50}
                style={{
                    marginHorizontal: 20,
                    marginTop: 30,
                    marginBottom: 10,
                }}
                disabled={disable}
                onPress={() => (route.params?.isInstruction ? createSitesForSpanInstruction() : createSitesForSpan())}
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
            <BaseModal
                onPress={() => {
                    setState((prev) => ({ ...prev, isVisibleModal: false }))
                    navigation.push('EditConstruction', {
                        constructionId,
                        contractId,
                        isInstruction: route.params?.isInstruction,
                    })
                }}
                onClose={() => setState((prev) => ({ ...prev, isVisibleModal: false }))}
                isVisible={isVisibleModal}
                disabled={false}
                buttonTitle={t('admin:EditConstruction')}>
                <Text
                    style={{
                        fontSize: 14,
                        color: THEME_COLORS.OTHERS.BLACK,
                        fontFamily: FontStyle.medium,
                        textAlign: 'center',
                        lineHeight: 16,
                    }}>
                    {t('admin:SiteToCreatedMustBeWithinConstructionPeriodWantToEdit')}
                </Text>
            </BaseModal>
            <BottomMargin />
        </ScrollViewInstead>
    )
}
export default EditBundleConstructionSchedule

const styles = StyleSheet.create({
    formItem: {
        paddingTop: 25,
    },
})
