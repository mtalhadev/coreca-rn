import React, { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { InputDateTimeBox } from '../../../../components/organisms/inputBox/InputDateTimeBox'
import { _weekDayList } from '../../../../utils/ext/Date.extensions'
import { CustomDate, dayBaseText, getMonthlyFirstDay, getTextBetweenAnotherDate, monthBaseText, nextDay, timeText, toCustomDateFromTotalSeconds } from '../../../../models/_others/CustomDate'
import { AppButton } from '../../../../components/atoms/AppButton'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { getMyTotalConstruction, getProjectFromContractId, deleteSitesForSpan } from '../../../../usecases/construction/MyConstructionCase'
import { TableArea } from '../../../../components/atoms/TableArea'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import flatten from 'lodash/flatten'
import isEmpty from 'lodash/isEmpty'
import uniqBy from 'lodash/uniqBy'
import { StoreType } from '../../../../stores/Store'
import { calculateConstructionDays } from '../../../../usecases/construction/CommonConstructionCase'
import { ConstructionCLType, ConstructionType } from '../../../../models/construction/Construction'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { ScrollViewInstead } from '../../../../components/atoms/ScrollViewInstead'
import { useIsFocused } from '@react-navigation/native'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { toCustomDatesListFromStartAndEnd, toIdAndMonthFromStrings, UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
import { ProjectCLType } from '../../../../models/project/Project'
import { departmentsToText } from '../../../../usecases/worker/CommonWorkerCase'
import { checkMyDepartment } from '../../../../usecases/department/DepartmentCase'
import { MonthlySiteType } from '../../../../models/site/MonthlySiteType'
import { genKeyName, getCachedData, updateCachedData } from '../../../../usecases/CachedDataCase'
type NavProps = StackNavigationProp<RootStackParamList, 'DeleteBundleConstructionSchedule'>
type RouteProps = RouteProp<RootStackParamList, 'DeleteBundleConstructionSchedule'>

type InitialStateType = {
    constructionId?: string
    contractId?: string
    disable: boolean
    bundleStartDate?: CustomDate
    bundleEndDate?: CustomDate
    isVisibleModal?: boolean
    update: number
} & ConstructionCLType
type CachedMonthlySiteType = {
    monthlySite: MonthlySiteType
    construction: ConstructionType
}
const initialState: InitialStateType = {
    disable: true,
    isVisibleModal: false,
    update: 0,
}
const DeleteBundleConstructionSchedule = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [
        {
            constructionId,
            disable,
            bundleStartDate,
            bundleEndDate,
            siteMeetingTime,
            siteStartTime,
            siteStartTimeIsNextDay,
            siteEndTimeIsNextDay,
            siteEndTime,
            siteRequiredNum,
            siteAddress,
            siteBelongings,
            siteRemarks,
            project,
            offDaysOfWeek,
            otherOffDays,
            contract,
            update,
        },
        setState,
    ] = useState(initialState)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
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
            setState((prev) => ({ ...prev, disable: false }))
        } else {
            setState((prev) => ({ ...prev, disable: true }))
        }
    }, [bundleStartDate, bundleEndDate])

    useEffect(() => {
        setState((prev) => ({ ...prev, constructionId: route.params?.constructionId }))
        return () => {
            setState({ ...initialState })
        }
    }, [])

    useEffect(() => {
        navigation.setOptions({
            title: t('admin:DeleteInBulk'),
        })
    }, [navigation])

    const _updateConstructionSiteListCache = async (startDate: CustomDate, endDate: CustomDate) => {
        let month = getMonthlyFirstDay(startDate)
        const cachedKey = genKeyName({
            screenName: 'ConstructionSiteList',
            accountId: accountId,
            companyId: myCompanyId as string,
            constructionId: constructionId as string,
            month: month ? monthBaseText(month).replace(/\//g, '-') : '',
        })
        const constructionSiteListCacheData = await getCachedData<CachedMonthlySiteType>(cachedKey)
        if (constructionSiteListCacheData.success && constructionSiteListCacheData.success.monthlySite.sites?.items) {
            const newSites = constructionSiteListCacheData.success.monthlySite.sites?.items?.filter((item)=>item?.siteDate && (item.siteDate<startDate.totalSeconds || item.siteDate>endDate.totalSeconds))
            constructionSiteListCacheData.success.monthlySite.sites.items = newSites
        }
        await updateCachedData({ 
            key: cachedKey, 
            value: {
                monthlySite: constructionSiteListCacheData.success?.monthlySite,
                construction: constructionSiteListCacheData.success?.construction
            }
        })
    }

    const _deleteSitesForSpan = async () => {
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
                    errorCode: 'DELETE_SITES_FOR_SPAN_ERROR',
                }
            }
            if (contract?.orderCompanyId == myCompanyId && !checkMyDepartment({ targetDepartmentIds: contract?.orderDepartmentIds, activeDepartmentIds })) {
                throw {
                    error: t('admin:TheContractIsInAnotherDepartmentPleaseSwitchDepartments') + '\n' + t('common:Department') + ': ' + departmentsToText(contract?.orderDepartments?.items),
                    errorCode: 'DELETE_SITES_FOR_SPAN_ERROR',
                }
            }
            dispatch(setLoading('unTouchable'))
            if (bundleStartDate && bundleEndDate) {
                await _updateConstructionSiteListCache(bundleStartDate, bundleEndDate)
            }
            const result = await deleteSitesForSpan({
                constructionId: constructionId,
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
                        text: result.success + t('admin:SitesDeleted'),
                        type: 'success',
                    } as ToastMessage),
                )
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
                ]
                dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
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
                title={t('admin:FirstDayToDelete')}
                required={true}
                style={styles.formItem}
                value={bundleStartDate}
                initDateInput={bundleStartDate}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, bundleStartDate: value }))
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
                    setState((prev) => ({ ...prev, bundleEndDate: value }))
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
                        { text: t('admin:Deletion'), onPress: () => _deleteSitesForSpan() },
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
export default DeleteBundleConstructionSchedule

const styles = StyleSheet.create({
    formItem: {
        paddingTop: 25,
    },
})
