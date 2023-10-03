import React, { useState, useRef, useEffect, useContext, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { View, StyleSheet, ListRenderItem, ListRenderItemInfo } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { THEME_COLORS } from '../../../../utils/Constants'
import { CustomDate, getMonthlyFinalDay, getMonthlyFirstDay, monthBaseText, newCustomDate, nextMonth, toCustomDateFromTotalSeconds, YYYYMMDateType } from '../../../../models/_others/CustomDate'

import { InvoiceTypeSelect } from '../../../../components/organisms/invoice/InvoiceTypeSelect'
import { useIsFocused } from '@react-navigation/native'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { deleteParamOfLocalUpdateScreens, setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { StoreType } from '../../../../stores/Store'
import { ConstructionWithSites } from '../../../../components/organisms/construction/ConstructionWithSites'
import { getContractInvoiceOfMonth, getInvRequestInvoiceOfMonth, getRequestInvoiceOfMonth } from '../../../../usecases/company/CompanyInvoiceCase'
import { CompanyDetailRouterContext } from './CompanyDetailRouter'
import { _getCompany } from '../../../../services/company/CompanyService'

import { ConstructionType } from '../../../../models/construction/Construction'
import { CompanyType } from '../../../../models/company/Company'
import { updateCachedData, getCachedData, genKeyName, resetTargetCachedData } from '../../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { splitIdAndDates } from '../../../../models/updateScreens/UpdateScreens'
import { getUpdateScreenOfTargetAccountAndScreen, deleteParamOfUpdateScreens } from '../../../../usecases/updateScreens/CommonUpdateScreensCase'
import { ConstructionListType } from '../../../../models/construction/ConstructionListType'
import { SwitchPage } from '../../../../components/template/SwitchPage'
import { match } from 'ts-pattern'
import uniq from 'lodash/uniq'
import sum from 'lodash/sum'
import { InvReservationType } from '../../../../models/invReservation/InvReservation'
import { InvReservationListType } from '../../../../models/invReservation/InvReservationListType'
import { ReplaceAnd } from '../../../../models/_others/Common'
import { InvReservationWithSite } from '../../../../components/organisms/invReservation/InvReservationWithSite'
import { checkMyDepartment } from '../../../../usecases/department/DepartmentCase'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

/**
 * 指定月の受発注データ
 */
export type InvoiceConstructionListUIType = {
    receive: ConstructionListType
    order: ConstructionListType
}
export type InvoiceInvReservationListUIType = {
    receive: InvReservationListType
    order: InvReservationListType
}
export type InvoiceDisplayType = 'order' | 'receive'
export type InvoiceContentsType = 'contract' | 'support'
type InitialStateType = {
    selectedMonth: CustomDate
    isFetching: boolean
    updateCache: number
    contractConstructions?: InvoiceConstructionListUIType
    requestConstructions?: InvoiceConstructionListUIType
    invReservations?: InvoiceInvReservationListUIType
    /**
     * 表示する工事配列。contractConstructionsのorderかreceiveの中身
     */
    displayContractData?: ConstructionType[]
    /**
     * 表示する工事配列。requestConstructionsのorderかreceiveの中身
     */
    displayRequestData?: ConstructionType[]
    /**
     * 表示する申請配列。invReservationsのorderかreceiveの中身
     */
    displayInvRequestData?: InvReservationType[]
    displaySupportsData?: DisplayContentsType[]
    /**
     * 切り替えによって、displayRequestDataかdisplayContractDataが入る
     */
    displayData?: DisplayContentsType[]
    displayType: InvoiceDisplayType
    updatedMonths?: YYYYMMDateType[]
    contentsType: InvoiceContentsType
    targetCompany?: CompanyType
    updateIdAndMonths?: string[]
}

type CachedCompanyInvoiceType = {
    contractConstructions?: InvoiceConstructionListUIType
    requestConstructions?: InvoiceConstructionListUIType
    invReservations?: InvoiceInvReservationListUIType
}

const initialState: InitialStateType = {
    selectedMonth: newCustomDate(),
    isFetching: false,
    updateCache: 0,
    displayType: 'receive',
    contentsType: 'contract',
    displayData: [],
}
type DisplayContentsType = ReplaceAnd<ConstructionType, InvReservationType>
const CompanyInvoice = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const loading = useSelector((state: StoreType) => state.util.loading)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])

    const { companyId } = useContext(CompanyDetailRouterContext)
    const [
        {
            contractConstructions,
            requestConstructions,
            invReservations,
            selectedMonth,
            displayContractData,
            displayRequestData,
            displayInvRequestData,
            displaySupportsData,
            displayType,
            contentsType,
            targetCompany,
            updateCache,
            isFetching,
            updateIdAndMonths,
            updatedMonths,
            displayData,
        },
        setState,
    ] = useState(initialState)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const cachedCompanyInvoiceKey = useRef(
        genKeyName({
            screenName: 'CompanyInvoice',
            accountId: accountId,
            companyId: myCompanyId ?? '',
            targetCompanyId: companyId ?? '',
            month: selectedMonth ? monthBaseText(selectedMonth).replace(/\//g, '-') : '',
        }),
    )
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const [dateUpdate, setDateUpdate] = useState(0)
    useSafeUnmount(setState, initialState, () => setDateUpdate(dateUpdate + 1))

    useEffect(() => {
        if (!isFetching && isFocused && isNavUpdating) {
            //アプデボタンが押された時
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useEffect(() => {
        if (isFocused) {
            ;(async () => {
                const updateResult = await getUpdateScreenOfTargetAccountAndScreen({
                    accountId,
                    screenName: 'CompanyInvoice',
                })
                const updateScreen = updateResult.success
                setState((prev) => ({ ...prev, updateIdAndMonths: updateScreen?.idAndDates ?? [] }))
                if (updateScreen?.isAll && myCompanyId) {
                    await resetTargetCachedData(
                        genKeyName({
                            screenName: 'CompanyInvoice',
                            accountId: accountId,
                            companyId: myCompanyId ?? '',
                            targetCompanyId: companyId ?? '',
                            month: selectedMonth ? monthBaseText(selectedMonth).replace(/\//g, '-') : '',
                        }),
                    )
                }
            })()
        }
    }, [isFocused])

    /**
     * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
     */
    useEffect(() => {
        ;(async () => {
            if (selectedMonth && companyId && isFocused) {
                const LocalTargetScreen = localUpdateScreens.filter((screen) => screen.screenName == 'CompanyInvoice')[0]
                const localIdAndDateObjArr = splitIdAndDates(LocalTargetScreen?.idAndDates)
                const localTargetIdAndDatesObjArr = localIdAndDateObjArr?.filter(
                    (obj) => obj.id == companyId && obj.date >= getMonthlyFirstDay(selectedMonth).totalSeconds && obj.date <= getMonthlyFinalDay(selectedMonth).totalSeconds,
                )
                if (localTargetIdAndDatesObjArr && localTargetIdAndDatesObjArr.length > 0) {
                    /**
                     * 作成編集者本人はUpdateScreensが更新される前に遷移するため、Storeで対応
                     */
                    dispatch(setIsNavUpdating(true))
                    setState((prev) => ({ ...prev, updatedMonths: [...(updatedMonths ?? []), monthBaseText(selectedMonth)] }))
                } else {
                    const updateIdAndDateObjArr = splitIdAndDates(updateIdAndMonths)
                    const targetIdAndDatesObjArr = updateIdAndDateObjArr?.filter(
                        (obj) =>
                            obj.id == companyId &&
                            obj.date >= getMonthlyFirstDay(selectedMonth).totalSeconds &&
                            obj.date <= getMonthlyFinalDay(selectedMonth).totalSeconds &&
                            !updatedMonths?.includes(monthBaseText(toCustomDateFromTotalSeconds(obj.date))),
                    )
                    if (targetIdAndDatesObjArr && targetIdAndDatesObjArr?.length > 0) {
                        dispatch(setIsNavUpdating(true))
                        setState((prev) => ({ ...prev, updatedMonths: [...(updatedMonths ?? []), monthBaseText(selectedMonth)] }))
                    }
                }
            }
        })()
    }, [selectedMonth, updateIdAndMonths])
    useMemo(
        () =>
            (async () => {
                const companyResult = await _getCompany({ companyId: companyId ?? '' })
                setState((prev) => ({ ...prev, targetCompany: companyResult?.success }))
            })(),
        [companyId],
    )

    useEffect(() => {
        if (myCompanyId && selectedMonth && companyId) {
            // __DEV__ && logger.logAccessInfo('\n2. キャッシュキー生成の副作用フック')
            // __DEV__ && console.log('\n2-1. キャッシュキーを更新: '+ (selectedMonth? monthBaseText(selectedMonth).replace(/\//g, '-') : '') + '\n')
            cachedCompanyInvoiceKey.current = genKeyName({
                screenName: 'CompanyInvoice',
                accountId: accountId,
                companyId: myCompanyId,
                targetCompanyId: companyId,
                month: selectedMonth ? monthBaseText(selectedMonth).replace(/\//g, '-') : '',
            })
        }
    }, [myCompanyId, selectedMonth, companyId])

    const headerDisplayInfo = useMemo(() => {
        let projectCount = 0
        let supportCount = 0
        let supportedCount = 0
        if (contentsType == 'contract') {
            projectCount = uniq(displayContractData?.map((contract) => contract.projectId)).length
        } else if (contentsType == 'support') {
            if (displayType == 'order') {
                supportCount =
                    sum(
                        displayRequestData?.map((con) =>
                            sum(
                                con.sites?.items?.map((site) =>
                                    sum(
                                        site.allRequests?.items
                                            ?.filter((req) => req.companyId == myCompanyId && targetCompany?.companyId == req.requestedCompanyId && req.isApproval == true)
                                            .map((req) => req.requestCount)
                                            .filter((data) => data != undefined),
                                    ),
                                ),
                            ),
                        ),
                    ) + sum(displayInvRequestData?.map((iRes) => sum(iRes.monthlyInvRequests?.items?.filter((iReq) => iReq.isApproval == true)?.map((iReq) => iReq.workerIds?.length ?? 0))))
                supportedCount =
                    sum(
                        displayRequestData?.map((con) =>
                            sum(
                                con.sites?.items?.map((site) =>
                                    sum(
                                        site.allRequests?.items
                                            ?.filter((req) => req.companyId == myCompanyId && targetCompany?.companyId == req.requestedCompanyId && req.isApproval == true)
                                            .map((req) => req.subRespondCount)
                                            .filter((data) => data != undefined),
                                    ),
                                ),
                            ),
                        ),
                    ) + sum(displayInvRequestData?.map((iRes) => sum(iRes.monthlyInvRequests?.items?.filter((iReq) => iReq.isApproval == true)?.map((iReq) => iReq.workerIds?.length ?? 0))))
            } else {
                supportCount =
                    sum(
                        displayRequestData?.map((con) =>
                            sum(
                                con.sites?.items?.map((site) =>
                                    sum(
                                        site.allRequests?.items
                                            ?.filter((req) => req.companyId == targetCompany?.companyId && myCompanyId == req.requestedCompanyId && req.isApproval == true)
                                            .map((req) => req.requestCount)
                                            .filter((data) => data != undefined),
                                    ),
                                ),
                            ),
                        ),
                    ) +
                    sum(
                        displayInvRequestData?.map((iRes) =>
                            sum(
                                iRes.monthlyInvRequests?.items
                                    ?.filter((iReq) => iReq.isApproval == true)
                                    .map((iReq) => iReq.workerIds?.length ?? 0)
                                    .filter((data) => data != undefined),
                            ),
                        ),
                    ) +
                    sum(
                        displayInvRequestData?.map((iRes) =>
                            sum(iRes.monthlyInvRequests?.items?.map((iReq) => sum(iReq.site?.siteMeter?.presentRequests?.items?.map((req) => req.requestCount).filter((data) => data != undefined)))),
                        ),
                    )
                supportedCount =
                    sum(
                        displayRequestData?.map((con) =>
                            sum(
                                con.sites?.items?.map((site) =>
                                    sum(
                                        site.allRequests?.items
                                            ?.filter((req) => req.companyId == targetCompany?.companyId && myCompanyId == req.requestedCompanyId && req.isApproval == true)
                                            .map((req) => req.subRespondCount)
                                            .filter((data) => data != undefined),
                                    ),
                                ),
                            ),
                        ),
                    ) +
                    sum(displayInvRequestData?.map((iRes) => sum(iRes.monthlyInvRequests?.items?.filter((iReq) => iReq.isApproval == true)?.map((iReq) => iReq.workerIds?.length ?? 0)))) +
                    sum(
                        displayInvRequestData?.map((iRes) =>
                            sum(
                                iRes.monthlyInvRequests?.items
                                    ?.filter((iReq) => iReq.isApproval == true)
                                    ?.map((iReq) =>
                                        sum(
                                            iReq.site?.siteMeter?.presentRequests?.items
                                                ?.filter((req) => req.isApproval == true)
                                                .map((req) => req.requestCount)
                                                .filter((data) => data != undefined),
                                        ),
                                    ),
                            ),
                        ),
                    )
            }
        }
        return {
            projectCount,
            supportCount,
            supportedCount,
        }
    }, [displayRequestData, displayContractData, displayInvRequestData, contentsType, displayType])

    const _onDateChange = (value: CustomDate) => {
        setState((prev) => ({
            ...prev,
            selectedMonth: value,
        }))
    }

    useEffect(() => {
        setState((prev) => ({
            ...prev,
            updateCache: updateCache + 1,
        }))
    }, [selectedMonth])

    useEffect(() => {
        return () => {
            setState(initialState)
            setDateUpdate(dateUpdate + 1)
        }
    }, [myCompanyId])

    useSafeLoadingUnmount(dispatch, isFocused)

    const onInvoiceTypeChange = (type: InvoiceDisplayType) => {
        setState((prev) => ({
            ...prev,
            displayType: type,
        }))
    }

    useEffect(() => {
        const newDisplayInvRequestData = invReservations ? (displayType == 'order' ? invReservations.receive.items : invReservations.order.items) : []
        const newDisplayRequestData = requestConstructions
            ? requestConstructions[displayType].items?.filter((construction) =>
                  checkMyDepartment({
                      targetDepartmentIds: displayType == 'order' ? construction.contract?.receiveDepartmentIds : [],
                      activeDepartmentIds,
                  }),
              )
            : []
        const newDisplaySupportsData = [...(newDisplayRequestData ?? []), ...(newDisplayInvRequestData ?? [])]
        const newDisplayContractData = contractConstructions
            ? contractConstructions[displayType]?.items?.filter((construction) =>
                  checkMyDepartment({
                      targetDepartmentIds: displayType == 'order' ? construction.contract?.orderDepartmentIds : construction.contract?.receiveDepartmentIds,
                      activeDepartmentIds,
                  }),
              )
            : []
        setState((prev) => ({
            ...prev,
            displayContractData: newDisplayContractData,
            displayRequestData: newDisplayRequestData,
            displayInvRequestData: newDisplayInvRequestData,
            displaySupportsData: newDisplaySupportsData,
        }))
    }, [displayType, activeDepartmentIds, contractConstructions, requestConstructions, invReservations])

    const onContentsTypeChange = (type: InvoiceContentsType) => {
        setState((prev) => ({
            ...prev,
            contentsType: type,
        }))
    }
    useEffect(() => {
        let _displayData: DisplayContentsType[] = match(contentsType)
            .with('contract', () => displayContractData ?? [])
            .with('support', () => displaySupportsData?.sort((a, b) => (a.startDate ?? 0) - (b.startDate ?? 0)) ?? [])
            .otherwise(() => [])

        _displayData?.map((item) => {
            if (item.sites && item.sites.items) {
                item.sites.items = item?.sites?.items.filter((nestedItem) => {
                    const itemDate = nestedItem.siteDate
                    return itemDate && itemDate >= selectedMonth?.totalSeconds - 86400000 && itemDate < nextMonth(selectedMonth).totalSeconds - 86400000
                })
            } else if (item?.monthlyInvRequests && item?.monthlyInvRequests.items) {
                item.monthlyInvRequests.items = item?.monthlyInvRequests?.items.filter((nestedItem) => {
                    const itemDate = nestedItem.date
                    return itemDate && itemDate >= selectedMonth?.totalSeconds - 86400000 && itemDate < nextMonth(selectedMonth).totalSeconds - 86400000
                })
            }
        })
        const filteredData =
            _displayData?.filter((item) => (item?.monthlyInvRequests?.items && item?.monthlyInvRequests?.items?.length > 0) || (item?.sites?.items && item?.sites?.items?.length > 0)) ?? []

        setState((prev) => ({
            ...prev,
            displayData: filteredData,
        }))
    }, [contentsType, displayContractData, displaySupportsData])

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
                <InvoiceTypeSelect
                    invoice={{
                        onChangeType: onInvoiceTypeChange,
                        onContentsTypeChange: onContentsTypeChange,
                        headerDisplayInfo: headerDisplayInfo,
                        targetCompany: targetCompany,
                        month: selectedMonth,
                        contentsType: contentsType,
                        displayType: displayType,
                    }}
                    style={{ paddingHorizontal: 10 }}
                />
            </View>
        )
    }, [displayType, contentsType, displayContractData, selectedMonth, targetCompany, headerDisplayInfo])

    const _content: ListRenderItem<DisplayContentsType> = (info: ListRenderItemInfo<DisplayContentsType>) => {
        const { item, index } = info
        if (item.constructionId) {
            return (
                <ConstructionWithSites
                    onPress={() => {
                        navigation.push('ConstructionDetailRouter', {
                            constructionId: item.constructionId,
                            projectId: item.project?.projectId,
                            title: item.displayName,
                            relatedCompanyId: targetCompany?.companyId,
                        })
                    }}
                    key={item.constructionId}
                    construction={item}
                    style={{ marginTop: 10, marginHorizontal: 10 }}
                    displayType={contentsType == 'support' ? displayType : undefined}
                    targetCompany={targetCompany}
                    routeNameFrom="CompanyInvoice"
                    isDisplaySiteWorker={contentsType == 'contract' ? true : false}
                />
            )
        } else if (item.invReservationId) {
            const _invReservation = {
                ...item,
                targetCompany: displayType == 'receive' ? targetCompany : undefined,
                myCompany: displayType == 'receive' ? undefined : targetCompany,
            }
            return (
                <InvReservationWithSite
                    style={{
                        marginTop: 10,
                        marginHorizontal: 10,
                    }}
                    invReservation={_invReservation}
                    key={item.invReservationId}
                    onPress={() => {
                        navigation.push('InvReservationDetailRouter', {
                            invReservationId: item.invReservationId,
                            type: item.myCompanyId == myCompanyId ? 'order' : 'receive',
                        })
                    }}
                    hasShadow={false}
                    type={displayType == 'order' ? 'receive' : 'order'}
                />
            )
        } else {
            return <></>
        }
    }

    useEffect(() => {
        ;(async () => {
            try {
                if (myCompanyId == undefined || isFetching != true || isFocused != true) {
                    setState((prev) => ({ ...prev, isFetching: false }))
                    return
                }
                dispatch(setLoading(true))
                const results = await Promise.all([
                    getContractInvoiceOfMonth({
                        otherCompanyId: companyId,
                        companyId: myCompanyId,
                        month: selectedMonth,
                    }),
                    getRequestInvoiceOfMonth({
                        otherCompanyId: companyId,
                        companyId: myCompanyId,
                        month: selectedMonth,
                    }),
                    getInvRequestInvoiceOfMonth({
                        otherCompanyId: companyId,
                        companyId: myCompanyId,
                        month: selectedMonth,
                    }),
                ])
                const contractResult = results[0]
                const requestResult = results[1]
                const invReservationResult = results[2]
                setState((prev) => ({ ...prev, isFetching: false }))
                dispatch(setIsNavUpdating(false))
                if (contractResult.error) {
                    throw {
                        error: contractResult.error,
                    }
                }
                if (requestResult.error) {
                    throw {
                        error: requestResult.error,
                    }
                }
                if (invReservationResult.error) {
                    throw {
                        error: invReservationResult.error,
                    }
                }
                const fetchMonthBaseText = cachedCompanyInvoiceKey.current.substring(cachedCompanyInvoiceKey.current.length - 7).replace(/-/g, '/')
                if (monthBaseText(selectedMonth) == fetchMonthBaseText) {
                    // __DEV__ && console.log('3-4、カレント月とフェッチデータが一致したので表示データを更新')
                    const _requestConstructions = {
                        order: { items: requestResult.success?.order.items },
                        receive: {
                            items: requestResult.success?.receive.items?.filter((con) => !(con.fakeCompanyInvReservationId != undefined && con.constructionRelation == 'fake-company-manager')),
                        },
                    }
                    setState((prev) => ({ ...prev, contractConstructions: contractResult.success, requestConstructions: _requestConstructions, invReservations: invReservationResult.success }))
                    const cachedResult = await updateCachedData({
                        key: cachedCompanyInvoiceKey.current,
                        value: {
                            contractConstructions: contractResult.success,
                            requestConstructions: _requestConstructions,
                            invReservations: invReservationResult.success,
                        },
                    })
                    if (cachedResult.error) {
                        dispatch(
                            setToastMessage({
                                text: cachedResult.error,
                                type: 'error',
                            }),
                        )
                    }
                    deleteParamOfLocalUpdateScreens({
                        screens: localUpdateScreens,
                        screenName: 'CompanyInvoice',
                        startDate: getMonthlyFirstDay(selectedMonth).totalSeconds,
                        endDate: getMonthlyFinalDay(selectedMonth).totalSeconds,
                        id: companyId,
                        paramName: 'idAndDates',
                    })
                    await deleteParamOfUpdateScreens({
                        accountId,
                        screenName: 'CompanyInvoice',
                        startDate: getMonthlyFirstDay(selectedMonth).totalSeconds,
                        endDate: getMonthlyFinalDay(selectedMonth).totalSeconds,
                        id: companyId,
                        paramName: 'idAndDates',
                    })
                } else {
                    /**
                     * カレント月とフェッチデータが一致しないので、フェッチデータは捨てる（日送り連打対策）
                     */
                    // __DEV__ && console.log('3-5、日送り連打でカレント月とフェッチデータが一致しない（フェッチデータは捨てる）')
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
     * @summary updateCacheフラグ更新時の副作用フック（KVSから表示データを取得更新）
     * @purpose アプリ側にKVSによるキャッシュを設けて一覧の初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            if (isFocused) {
                const result = await getCachedData<CachedCompanyInvoiceType>(cachedCompanyInvoiceKey.current)
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
                } else {
                    setState((rev) => ({
                        ...rev,
                        contractConstructions: result.success?.contractConstructions,
                        requestConstructions: result.success?.requestConstructions,
                        invReservations: result.success?.invReservations,
                    }))
                }
            }
        })()
    }, [updateCache])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, updateCache: updateCache + 1 }))
        }
    }, [isFocused, route, myCompanyId])

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
                          text: t('admin:ThereIsNoConstructionForTheCurrentMonthYet'),
                      }
            }
            onRefresh={_onRefresh}
            onDateChange={_onDateChange}
        />
    )
}
export default CompanyInvoice

const styles = StyleSheet.create({})
