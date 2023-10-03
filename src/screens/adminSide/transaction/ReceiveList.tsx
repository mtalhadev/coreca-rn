/* eslint-disable indent */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, ListRenderItem, ListRenderItemInfo } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { useIsFocused } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { AppButton } from '../../../components/atoms/AppButton'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { StoreType } from '../../../stores/Store'
import { setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { CustomDate, getMonthlyFinalDay, getMonthlyFirstDay, monthBaseText, newCustomDate, nextMonth, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { THEME_COLORS } from '../../../utils/Constants'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { RootStackParamList } from '../../Router'
import { IconParam } from '../../../components/organisms/IconParam'
import { SwitchPage } from '../../../components/template/SwitchPage'
import { SelectButton } from '../../../components/organisms/SelectButton'
import { ConstructionWithSites } from '../../../components/organisms/construction/ConstructionWithSites'
import { ConstructionType } from '../../../models/construction/Construction'
import cloneDeep from 'lodash/cloneDeep'
import sumBy from 'lodash/sumBy'
import { match } from 'ts-pattern'
import { updateCachedData, getCachedData, genKeyName } from '../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../fooks/useTextTranslation'
import { InvReservationType } from '../../../models/invReservation/InvReservation'
import { ReplaceAnd } from '../../../models/_others/Common'
import { ContractingProject } from '../../../components/organisms/contract/ContractingProject'
import { ProjectType } from '../../../models/project/Project'
import { ContractType } from '../../../models/contract/Contract'
import { InvoiceDownloadButton } from '../../../components/organisms/invoice/InvoiceDownloadButton'
import { _getFirestore } from '../../../services/firebase/FirestoreService'
import { MonthlyProjectType } from '../../../models/project/MonthlyProjectType'
import { Search } from '../../../components/organisms/Search'
import { InvReservationWithInvRequest } from '../../../components/organisms/invReservation/InvReservationWithInvRequest'
import { MonthlyInvReservationType } from '../../../models/invReservation/MonthlyInvReservationType'
import { MonthlyConstructionRequestModel } from '../../../models/request/MonthlyConstructionRequestType'
import { checkMyDepartment } from '../../../usecases/department/DepartmentCase'
import sum from 'lodash/sum'

export type ReceiveDisplayType = 'project' | 'support'

type NavProps = StackNavigationProp<RootStackParamList, 'ReceiveList'>
type RouteProps = RouteProp<RootStackParamList, 'ReceiveList'>

/**
 * projects - 請負
 * filteredProjects - 請負を部署でフィルターしたもの
 * requestsConstructions -  常用依頼
 * invReservations - 常用で送る
 * supports - 上二つを合わせたもの。実際に表示する用
 */
type InitialStateType = {
    selectedMonth: CustomDate
    isFetching: boolean
    projects?: ProjectType[]
    filteredProjects?: ProjectType[]
    requestsConstructions?: ConstructionType[]
    invReservations?: InvReservationType[]
    supports?: ReceiveListSupportUIType[]
    monthData?: ConstructionType[] | InvReservationType[] | ProjectType[]
    displayType: ReceiveDisplayType
}

type ReceiveListSupportUIType = ReplaceAnd<ConstructionType, InvReservationType>

const initialState: InitialStateType = {
    selectedMonth: newCustomDate(),
    isFetching: false,
    displayType: 'project',
}
export type CachedReceiveListType = {
    projectInfo?: {
        projects?: ProjectType[]
        updatedAt?: number
    }
    requestInfo?: {
        requestsConstructions?: ConstructionType[]
        updatedAt?: number
    }
    invRequestInfo?: {
        invReservations?: InvReservationType[]
        updatedAt?: number
    }
}
/**
 * @returns 受注一覧。
 */
const ReceiveList = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const loading = useSelector((state: StoreType) => state.util.loading)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const [{ projects, filteredProjects, invReservations, requestsConstructions, supports, selectedMonth, isFetching, monthData, displayType }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])

    const unsubscribeProjectRef = useRef<any>(null)
    const unsubscribeRequestRef = useRef<any>(null)
    const unsubscribeInvReservationRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)

    const [textFilter, setTextFilter] = useState<string | undefined>(undefined)

    const [dateUpdate, setDateUpdate] = useState(0)
    useSafeUnmount(setState, initialState, () => setDateUpdate(dateUpdate + 1))

    useEffect(() => {
        if (__isAvailableFromNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    const headerInfos = useMemo(() => {
        if (isFocused) {
            const orderPreNum =
                (sumBy(
                    requestsConstructions?.map((construction) =>
                        sumBy(
                            construction?.sites?.items?.map((site) =>
                                sumBy(
                                    site.allRequests?.items
                                        ?.filter((request) => request.requestedCompanyId == myCompanyId && request?.isApplication == true && request.isApproval == true)
                                        .map((request) => request.requestMeter?.companyRequiredNum),
                                ),
                            ),
                        ),
                    ),
                ) ?? 0) +
                (sumBy(invReservations?.map((invReservation) => sumBy(invReservation?.monthlyInvRequests?.items?.filter((iReq) => iReq.isApplication == true)?.map((iReq) => iReq.workerIds?.length ?? 0)))) ??
                    0) +
                sum(
                    invReservations?.map((invRes) =>
                        sum(invRes.monthlyInvRequests?.items?.map((invReq) => sum(invReq.site?.companyRequests?.orderRequests?.items?.map((req) => req?.requestCount ?? 0)))),
                    ),
                )
            const orderNum =
                (sumBy(
                    requestsConstructions?.map((construction) =>
                        sumBy(
                            construction?.sites?.items?.map((site) =>
                                sumBy(
                                    site.allRequests?.items
                                        ?.filter((request) => request.requestedCompanyId == myCompanyId && request.isApproval == true)
                                        .map((request) => (request.requestedCompany?.isFake ? request.requestMeter?.companyRequiredNum : request.requestMeter?.companyPresentNum)),
                                ),
                            ),
                        ),
                    ),
                ) ?? 0) +
                (sumBy(
                    invReservations?.map((invReservation) =>
                        sumBy(invReservation?.monthlyInvRequests?.items?.filter((iReq) => iReq.isApplication == true && iReq.isApproval == true).map((iReq) => iReq.workerIds?.length)),
                    ),
                ) ?? 0) +
                sum(
                    invReservations?.map((invRes) =>
                        sum(invRes.monthlyInvRequests?.items?.map((invReq) => sum(invReq.site?.companyRequests?.orderRequests?.items?.map((req) => req?.requestCount ?? 0)))),
                    ),
                )
            return {
                orderPreNum, //送る予定人数
                orderNum, //送った人数
            }
        } else {
            return {
                orderPreNum: 0, //送る予定人数
                orderNum: 0, //送った人数
            }
        }
    }, [requestsConstructions, invReservations, myCompanyId])

    /**
     * headerの更新からDB fetchして良いかどうか
     */
    const __isAvailableFromNavUpdating = useMemo(() => !isFetching && isNavUpdating && isFocused, [isFetching, isNavUpdating, isFocused])

    /**
     * DB fetchして良いかどうか
     */
    const __isAvailable = useMemo(() => selectedMonth != undefined && myCompanyId != undefined, [selectedMonth, myCompanyId])

    const __filterConstruction = (construction: ConstructionType): boolean => {
        return construction.constructionRelation != 'other-company' && construction.constructionRelation != 'intermediation'
        // construction.constructionRelation != 'other-company' &&
        // return construction.constructionRelation != 'intermediation'
    }

    const _content: ListRenderItem<ReceiveListSupportUIType | ProjectType> = (info: ListRenderItemInfo<ReceiveListSupportUIType | ProjectType>) => {
        let { item, index } = info
        /**
         * item is
         * displayType == project → ProjectType
         * displayType == support → ReceiveListSupportUIType
         */
        const __selectedMonth = getMonthlyFirstDay(cloneDeep(selectedMonth))
        const selectedMonthStart = __selectedMonth?.totalSeconds || 0
        const nextMonthStart = nextMonth(__selectedMonth)?.totalSeconds || Infinity

        if (displayType == 'support') {
            /**
             * 常用タブでの表示
             * Display in support tabs
             */
            const _item = item as ReceiveListSupportUIType
            if (_item?.monthlyInvRequests?.items) {
                _item.monthlyInvRequests.items = _item?.monthlyInvRequests?.items?.filter((item) => {
                    return item?.date && item?.date >= selectedMonthStart && item?.date <= nextMonthStart
                })
            }
            if (_item.invReservationId) {
                return (
                    <InvReservationWithInvRequest
                        displayType={'order'}
                        invReservation={_item}
                        onPress={() => {
                            navigation.push('InvReservationDetailRouter', {
                                invReservationId: _item?.invReservationId,
                                type: 'order',
                            })
                        }}
                        style={{
                            marginTop: 10,
                            marginHorizontal: 10,
                        }}
                    />
                )
            } else if (_item.constructionId) {
                return (
                    <ConstructionWithSites
                        style={{
                            marginTop: 10,
                            marginHorizontal: 10,
                        }}
                        construction={_item}
                        key={index.toString()}
                        onPress={() => {
                            /**
                             * 他社工事は見れない。
                             */
                            if (_item?.constructionRelation != 'other-company') {
                                navigation.push('ConstructionDetailRouter', {
                                    projectId: _item?.project?.projectId,
                                    constructionId: _item?.constructionId,
                                    supportType: 'support-receive',
                                    title: _item?.name,
                                })
                            }
                        }}
                        displayType={'receive'}
                    />
                )
            } else {
                return <></>
            }
        } else {
            /**
             * 請負タブでの表示
             * Display in Contract tab
             */
            const _item = item as ProjectType
            /**
             * 契約の遷移先を定義する。受注会社が自社の契約に遷移。
             */
            const contracts = _item?.companyContracts?.totalContracts?.items
            const contract = match(contracts?.length)
                .with(0, () => undefined)
                .with(1, () => (contracts ? contracts[0] : undefined))
                .otherwise(() => contracts?.filter((contract) => contract.receiveCompanyId == myCompanyId)[0]) as ContractType

            const constructions = _item?.projectConstructions?.totalConstructions?.items?.filter(__filterConstruction)
            const constructionIds = constructions?.map((item) => item.constructionId).filter((item) => item != undefined) as string[]

            return (
                <ContractingProject
                    style={{
                        marginTop: 7,
                        marginHorizontal: 7,
                        borderRadius: 10,
                        borderWidth: 1,
                    }}
                    contractingProject={_item}
                    constructions={constructions}
                    onPress={() => {
                        navigation.push('ContractingProjectDetailRouter', {
                            projectId: _item?.projectId,
                            contractId: contract?.contractId,
                            constructionIds,
                            title: _item?.name,
                            isFakeCompanyManage: _item?.isFakeCompanyManage,
                            selectedMonth: selectedMonth,
                        })
                    }}
                />
            )
        }
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
                    items={[t('admin:Contract'), t('admin:Support')]}
                    onChangeItem={(value) => {
                        if (value == t('admin:Support')) {
                            onRequestTypeChange('support')
                        }
                        if (value == t('admin:Contract')) {
                            onRequestTypeChange('project')
                        }
                    }}
                    selected={match(displayType)
                        .with('project', () => t('admin:Contract'))
                        .with('support', () => t('admin:Support'))
                        .otherwise(() => t('common:Contract'))}
                    style={{ marginTop: 10 }}
                />
                <View>
                    {displayType == 'project' && (
                        <View>
                            <View
                                style={{
                                    marginTop: 15,
                                }}>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}>
                                    <IconParam
                                        flex={1.1}
                                        iconName={'project'}
                                        paramName={t('admin:NumberCases')}
                                        iconSize={20}
                                        count={monthData?.length ?? 0}
                                        onPress={() => {
                                            navigation.push('CreateConstruction', {
                                                routeNameFrom: 'ReceiveList',
                                                selectedDate: selectedMonth,
                                            })
                                            // navigation.push('SelectCompany', {
                                            //     selectCompany: {
                                            //         withoutMyCompany: true,
                                            //         title: `${t('common:SelectCustomerClient')}`,
                                            //     },
                                            //     routeNameFrom: 'ContractingProjectList',
                                            // })
                                        }}
                                    />
                                    {/* <IconParam
                                        flex={1}
                                        iconName={'construction'}
                                        paramName={t('admin:NumberWorks')}
                                        hasBorder
                                        count={sum(monthData?.map((data) => data?.projectConstructions?.totalConstructions?.items?.filter(__filterConstruction).length ?? 0))}
                                    /> */}
                                </View>
                                <InvoiceDownloadButton
                                    title={`${t('admin:OfTheDisplayedProjects')} ${selectedMonth.month} ${t('admin:DownloadMonthlyStatement')}`}
                                    invoiceType={'projects'}
                                    month={selectedMonth}
                                />
                            </View>
                        </View>
                    )}
                    {displayType == 'support' && (
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 15,
                            }}>
                            <IconParam
                                flex={1.1}
                                iconName={'transfer'}
                                paramName={t('admin:InitialNumberOfPeopleToSendInSupport')}
                                iconSize={20}
                                count={headerInfos.orderPreNum ?? 0}
                                onPress={() => {
                                    navigation.push('CreateInvReservation', {
                                        initStartDate: getMonthlyFirstDay(selectedMonth),
                                    })
                                }}
                            />
                            <IconParam flex={1} iconName={'transfer'} paramName={t('admin:NumberOfPeopleSentInSupport')} hasBorder count={headerInfos.orderNum ?? 0} />
                        </View>
                    )}
                </View>
            </View>
        )
    }, [headerInfos.orderPreNum, headerInfos.orderNum, monthData, displayType])

    const _footer = () => {
        return (
            <View
                style={{
                    marginTop: 20,
                    marginHorizontal: 10,
                }}>
                {displayType == 'project' && (
                    <AppButton
                        onPress={() => {
                            navigation.push('CreateConstruction', {
                                routeNameFrom: 'ReceiveList',
                                selectedDate: selectedMonth,
                            })
                            // navigation.push('SelectCompany', {
                            //     selectCompany: {
                            //         withoutMyCompany: true,
                            //         title: `${t('common:SelectCustomerClient')}`,
                            //     },
                            //     routeNameFrom: 'ContractingProjectList',
                            //     initStartDate: selectedMonth,
                            // })
                        }}
                        title={t('admin:CreateACase')}
                    />
                )}
                {displayType == 'support' && (
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
                )}
                <BottomMargin />
            </View>
        )
    }

    const _onDateChange = (date: CustomDate) => {
        setState((prev) => ({
            ...prev,
            selectedMonth: getMonthlyFirstDay(date),
            isFetching: true,
        }))
    }

    const onRequestTypeChange = (types: ReceiveDisplayType) => {
        if (types == 'support' && supports == undefined) {
            setState((prev) => ({
                ...prev,
                displayType: types,
                isFetching: true,
            }))
        } else {
            setState((prev) => ({
                ...prev,
                displayType: types,
                monthData: types == 'project' ? filteredProjects : supports,
            }))
        }
    }

    useEffect(() => {
        if (__isAvailable) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
        return () => {
            setState(initialState)
            setDateUpdate(dateUpdate + 1)
        }
    }, [myCompanyId])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        ;(async () => {
            try {
                const __selectedMonth = getMonthlyFirstDay(cloneDeep(selectedMonth))
                const __cachedKey = genKeyName({
                    screenName: 'ReceiveList',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                    /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                    month: __selectedMonth ? monthBaseText(__selectedMonth).replace(/\//g, '-') : '',
                })
                const __supports = [...(requestsConstructions ?? []), ...(invReservations ?? [])] as ReceiveListSupportUIType[]
                const _supports = __supports.sort((a, b) => (a.project?.startDate ?? a.startDate ?? 0) - (b.project?.startDate ?? b.startDate ?? 0))
                setState((prev) => ({ ...prev, supports: _supports, monthData: displayType == 'project' ? filteredProjects : _supports }))
                const cachedResult = await updateCachedData({
                    key: __cachedKey,
                    value: {
                        projectInfo: {
                            projects: projects,
                            updatedAt: Number(new Date()),
                        },
                        invRequestInfo: {
                            invReservations: invReservations,
                            updatedAt: Number(new Date()),
                        },
                        requestInfo: {
                            requestsConstructions: requestsConstructions,
                            updatedAt: Number(new Date()),
                        },
                    },
                })
                if (cachedResult.error) {
                    const _error = cachedResult as CustomResponse
                    dispatch(
                        setToastMessage({
                            text: getErrorToastMessage(_error),
                            type: 'error',
                        }),
                    )
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
                    dispatch(setIsNavUpdating(false))
                    dispatch(setLoading(false))
                }
            }
        })()
    }, [projects, invReservations, requestsConstructions])

    useEffect(() => {
        ;(async () => {
            try {
                if (!isScreenOnRef.current) return
                if (myCompanyId == undefined || isFetching != true || !__isAvailable) {
                    setState((prev) => ({ ...prev, isFetching: false }))
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const __selectedMonth = getMonthlyFirstDay(cloneDeep(selectedMonth))
                const __cachedKey = genKeyName({
                    screenName: 'ReceiveList',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                    /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                    month: __selectedMonth ? monthBaseText(__selectedMonth).replace(/\//g, '-') : '',
                })
                const result = await getCachedData<CachedReceiveListType>(__cachedKey ?? 'no-id')
                const db = _getFirestore()
                unsubscribeRequestRef.current = db
                    .collection('MonthlyConstructionRequest')
                    .where('companyId', '==', myCompanyId)
                    .where('month', '>=', __selectedMonth?.totalSeconds)
                    .where('month', '<', nextMonth(__selectedMonth).totalSeconds)
                    .onSnapshot(async (data) => {
                        const _monthlyData = data.docs.map((doc) => doc.data())[0] as MonthlyConstructionRequestModel | undefined
                        if (_monthlyData == undefined) {
                            setState((prev) => ({
                                ...prev,
                                isFetching: false,
                                requestsConstructions: [],
                            }))
                            return
                        }
                        if (result.success?.requestInfo && result.success.requestInfo.updatedAt) {
                            if (_monthlyData?.updatedAt && result.success.requestInfo.updatedAt < _monthlyData?.updatedAt) {
                                // キャッシュよりDBが新しい場合、更新する
                                setState((prev) => ({
                                    ...prev,
                                    isFetching: false,
                                    requestsConstructions:
                                        _monthlyData?.receiveConstructions?.items?.filter(
                                            (con) => !(con.constructionRelation == 'fake-company-manager' && con.fakeCompanyInvReservationId != undefined),
                                        ) ?? [],
                                }))
                            }
                        } else {
                            setState((prev) => ({
                                ...prev,
                                isFetching: false,
                                requestsConstructions:
                                    _monthlyData?.receiveConstructions?.items?.filter((con) => !(con.constructionRelation == 'fake-company-manager' && con.fakeCompanyInvReservationId != undefined)) ??
                                    [],
                            }))
                        }
                    })
                unsubscribeInvReservationRef.current = db
                    .collection('MonthlyInvReservation')
                    .where('companyId', '==', myCompanyId)
                    .where('month', '>=', __selectedMonth?.totalSeconds)
                    .where('month', '<', getMonthlyFinalDay(__selectedMonth).totalSeconds)
                    .onSnapshot(async (data) => {
                        const _monthlyData = data.docs.map((doc) => doc.data())[0] as MonthlyInvReservationType | undefined
                        if (_monthlyData == undefined) {
                            setState((prev) => ({
                                ...prev,
                                invReservations: [],
                            }))
                            return
                        }
                        if (result.success?.invRequestInfo && result.success.invRequestInfo?.updatedAt) {
                            if (_monthlyData?.updatedAt && result.success.invRequestInfo.updatedAt < _monthlyData?.updatedAt) {
                                // キャッシュよりDBが新しい場合、更新する
                                setState((prev) => ({
                                    ...prev,
                                    isFetching: false,
                                    invReservations: _monthlyData?.orderInvReservations?.items ?? [],
                                }))
                            }
                        } else {
                            setState((prev) => ({
                                ...prev,
                                isFetching: false,
                                invReservations: _monthlyData?.orderInvReservations?.items ?? [],
                            }))
                        }
                    })
                unsubscribeProjectRef.current = db
                    .collection('MonthlyProject')
                    .where('companyId', '==', myCompanyId)
                    .where('month', '>=', __selectedMonth?.totalSeconds)
                    .where('month', '<', nextMonth(__selectedMonth).totalSeconds)
                    .onSnapshot(async (data) => {
                        const _monthlyData = data.docs.map((doc) => doc.data())[0] as MonthlyProjectType | undefined
                        if (_monthlyData == undefined) {
                            setState((prev) => ({
                                ...prev,
                                projects: [],
                            }))
                            return
                        }
                        if (result.success?.projectInfo && result.success.projectInfo?.updatedAt) {
                            if (_monthlyData?.updatedAt && result.success.projectInfo.updatedAt < _monthlyData?.updatedAt) {
                                // キャッシュよりDBが新しい場合、更新する
                                /**
                                 * 仮会社へ応援で送るための案件を排除
                                 */
                                const projects = (_monthlyData?.projects
                                    ?.filter(
                                        (project) =>
                                            project.fakeCompanyInvReservationId == undefined &&
                                            (project.isFakeCompanyManage ? true : project.companyContracts?.receiveContracts && project.companyContracts?.receiveContracts?.length > 0),
                                    )
                                    ?.sort((a, b) => (a.startDate ?? 0) - (b.startDate ?? 0)) ?? []) as ProjectType[]
                                setState((prev) => ({
                                    ...prev,
                                    isFetching: false,
                                    projects,
                                }))
                            }
                        } else {
                            const projects = (_monthlyData?.projects
                                ?.filter(
                                    (project) =>
                                        project.fakeCompanyInvReservationId == undefined &&
                                        (project.isFakeCompanyManage ? true : project.companyContracts?.receiveContracts && project.companyContracts?.receiveContracts?.length > 0),
                                )
                                ?.sort((a, b) => (a.startDate ?? 0) - (b.startDate ?? 0)) ?? []) as ProjectType[]
                            setState((prev) => ({
                                ...prev,
                                isFetching: false,
                                projects,
                            }))
                        }
                    })
                if (result.success) {
                    setState((prev) => ({
                        ...prev,
                        projects: result.success?.projectInfo?.projects,
                        invReservations: result.success?.invRequestInfo?.invReservations,
                        requestsConstructions: result.success?.requestInfo?.requestsConstructions,
                    }))
                    dispatch(setLoading(false))
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
                setState((prev) => ({ ...prev, isFetching: false }))
                dispatch(setLoading(false))
            }
        })()
    }, [isFetching])

    useEffect(() => {
        setState((prev) => ({
            ...prev,
            filteredProjects: projects?.filter((project) =>
                checkMyDepartment({
                    targetDepartmentIds: project.companyContracts?.totalContracts?.items?.filter((item) => item.receiveCompanyId == myCompanyId)[0]?.receiveDepartmentIds,
                    activeDepartmentIds,
                }),
            ),
        }))
    }, [projects])

    // 画面を閉じたときに時にonSnapshotをunsubscribeする
    useEffect(() => {
        isScreenOnRef.current = isFocused
        return () => {
            if (isScreenOnRef.current) {
                isScreenOnRef.current = false
            }
            if (unsubscribeProjectRef.current) {
                unsubscribeProjectRef.current()
                unsubscribeProjectRef.current = null
            }
            if (unsubscribeRequestRef.current) {
                unsubscribeRequestRef.current()
                unsubscribeRequestRef.current = null
            }
            if (unsubscribeInvReservationRef.current) {
                unsubscribeInvReservationRef.current()
                unsubscribeInvReservationRef.current = null
            }
        }
    }, [isFocused])

    // 月変更時にonSnapshotをunsubscribeする（前月のデータ更新が続くのを防ぐため）
    useEffect(() => {
        return () => {
            if (unsubscribeProjectRef.current) {
                unsubscribeProjectRef.current()
                unsubscribeProjectRef.current = null
            }
            if (unsubscribeRequestRef.current) {
                unsubscribeRequestRef.current()
                unsubscribeRequestRef.current = null
            }
            if (unsubscribeInvReservationRef.current) {
                unsubscribeInvReservationRef.current()
                unsubscribeInvReservationRef.current = null
            }
        }
    }, [selectedMonth])

    const filteredByProjectName = useCallback(
        (data: ProjectType[]) => {
            return data.filter(({ name }) => {
                if (name && textFilter && textFilter.length > 0) {
                    return name.indexOf(textFilter) > -1
                }
            })
        },
        [textFilter],
    )

    const filteredByConstructionName = useCallback(
        (data: ProjectType[]) => {
            return data
                .map((data) => {
                    if (data.projectConstructions && data.projectConstructions.totalConstructions && data.projectConstructions.totalConstructions.items) {
                        const filteredConstructions = data.projectConstructions.totalConstructions.items.filter(__filterConstruction).filter(({ name }) => {
                            if (name && textFilter && textFilter.length > 0) {
                                return name.indexOf(textFilter) > -1
                            }
                        })
                        if (filteredConstructions.length > 0) {
                            data.projectConstructions.totalConstructions.items = filteredConstructions as ConstructionType[]
                            return data
                        }
                    }
                    return undefined
                })
                .filter((data) => data !== undefined)
        },
        [textFilter],
    )

    useEffect(() => {
        if (filteredProjects && displayType == 'project') {
            const dataFilteredByProjectName = filteredByProjectName(filteredProjects)
            const dataFilteredByConstructionName = filteredByConstructionName(filteredProjects)

            if (textFilter && textFilter.length > 0) {
                if (dataFilteredByProjectName.length > 0) {
                    setState((prev) => ({ ...prev, monthData: dataFilteredByProjectName }))
                } else if (dataFilteredByConstructionName.length > 0) {
                    setState((prev) => ({ ...prev, monthData: dataFilteredByConstructionName as ProjectType[] }))
                } else {
                    setState((prev) => ({ ...prev, monthData: [] }))
                }
            } else {
                setState((prev) => ({ ...prev, monthData: filteredProjects }))
            }
        }
    }, [textFilter, filteredProjects, displayType])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isFocused, route, myCompanyId, selectedMonth])

    const _onRefresh = async () => {
        if (isFocused) dispatch(setLoading(true))
        setState((prev) => ({ ...prev, isFetching: true }))
    }

    return (
        <>
            <View style={{ backgroundColor: '#fff' }}>
                <Search
                    style={{ marginTop: 8, marginBottom: 0, marginHorizontal: 10 }}
                    text={textFilter}
                    title={t('common:SearchByProjectOrConstructionName')}
                    onChange={setTextFilter}
                    clearText={() => setTextFilter(undefined)}
                    placeholder={t('common:SearchByProjectOrConstructionName')}
                />
            </View>
            <SwitchPage
                dateUpdate={dateUpdate}
                dateInitValue={selectedMonth}
                data={monthData}
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
                footer={_footer}
                onDateChange={_onDateChange}
            />
        </>
    )
}
export default ReceiveList

const styles = StyleSheet.create({})
