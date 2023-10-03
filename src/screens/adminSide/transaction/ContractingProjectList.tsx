import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, ListRenderItem, ListRenderItemInfo } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import sum from 'lodash/sum'
import cloneDeep from 'lodash/cloneDeep'
import { useIsFocused } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { AppButton } from '../../../components/atoms/AppButton'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { StoreType } from '../../../stores/Store'
import { setToastMessage, ToastMessage, setLoading } from '../../../stores/UtilSlice'
import { CustomDate, getMonthlyFinalDay, getMonthlyFirstDay, monthBaseText, newCustomDate, nextMonth } from '../../../models/_others/CustomDate'
import { THEME_COLORS } from '../../../utils/Constants'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { RootStackParamList } from '../../Router'
import { ContractingProject } from '../../../components/organisms/contract/ContractingProject'
import { IconParam } from '../../../components/organisms/IconParam'
import { SwitchPage } from '../../../components/template/SwitchPage'
import { match } from 'ts-pattern'
import { ContractCLType } from '../../../models/contract/Contract'
import { SelectButton } from '../../../components/organisms/SelectButton'
import { ProjectType } from '../../../models/project/Project'
import { MonthlyProjectType } from './../../../models/project/MonthlyProjectType'
import { ConstructionType } from '../../../models/construction/Construction'
import { genKeyName, getCachedData, updateCachedData } from '../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../fooks/useTextTranslation'
import { _getFirestore } from '../../../services/firebase/FirestoreService'
import { Search } from '../../../components/organisms/Search'
import { InvoiceDownloadButton } from '../../../components/organisms/invoice/InvoiceDownloadButton'

type NavProps = StackNavigationProp<RootStackParamList, 'ContractingProjectList'>
type RouteProps = RouteProp<RootStackParamList, 'ContractingProjectList'>

type InitialStateType = {
    selectedMonth: CustomDate
    monthData?: ProjectType[]
    displayDataFilteredByProjectNameOrConstructionName: ProjectType[]
    displayType: _ProjectSelectType
    isFetching: boolean
}

const initialState: InitialStateType = {
    selectedMonth: getMonthlyFirstDay(newCustomDate()),
    displayDataFilteredByProjectNameOrConstructionName: [],
    displayType: 'all',
    isFetching: false,
}

type _ProjectSelectType = 'all' | 'contract' | 'request'

/**
 * 使用停止
 * @returns 請負契約一覧。
 *
 * キーワードを含む案件名・工事名を検索可
 */

const ContractingProjectList = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const [{ selectedMonth, monthData, displayDataFilteredByProjectNameOrConstructionName, displayType, isFetching }, setState] = useState(initialState)
    const route = useRoute<RouteProps>()
    const loading = useSelector((state: StoreType) => state.util.loading)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)

    const targetMonth = route.params?.targetMonth
    const [textFilter, setTextFilter] = useState<string | undefined>(undefined)

    const unsubscribeRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)

    useEffect(() => {
        if (targetMonth) {
            setState((prev) => ({ ...prev, selectedMonth: targetMonth }))
        }
    }, [])

    const [dateUpdate, setDateUpdate] = useState(0)

    const displayData = useMemo(
        () =>
            match(displayType)
                .with('contract', () => monthData?.filter((project) => !project.isFakeCompanyManage) ?? [])
                .with('request', () => monthData?.filter((project) => project.isFakeCompanyManage) ?? [])
                .otherwise(() => monthData ?? []),
        [monthData, displayType],
    )

    useEffect(() => {
        if (__isAvailableFromNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useEffect(() => {
        isScreenOnRef.current = isFocused
    }, [isFocused])
    /**
     * 立ち上げと立ち退き時の挙動
     */
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

    useSafeUnmount(setState, initialState, () => setDateUpdate(dateUpdate + 1))

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
    }

    const _content: ListRenderItem<ProjectType> = (info: ListRenderItemInfo<ProjectType>) => {
        const { item, index } = info

        /**
         * 契約の遷移先を定義する。受注会社が自社の契約に遷移。
         */
        const contracts = item?.companyContracts?.totalContracts?.items
        const contract = match(contracts?.length)
            .with(0, () => undefined)
            .with(1, () => (contracts ? contracts[0] : undefined))
            .otherwise(() => contracts?.filter((contract) => contract.receiveCompanyId == myCompanyId)[0]) as ContractCLType

        const constructions = item.projectConstructions?.totalConstructions?.items?.filter(__filterConstruction)
        return (
            <ContractingProject
                style={{
                    marginTop: 7,
                    marginHorizontal: 7,
                    borderRadius: 10,
                    borderWidth: 1,
                }}
                contractingProject={item}
                constructions={constructions}
                onPress={() => {
                    navigation.push('ContractingProjectDetailRouter', {
                        projectId: item.projectId,
                        contractId: contract?.contractId,
                        title: item.name,
                        isFakeCompanyManage: item.isFakeCompanyManage,
                        selectedMonth: selectedMonth,
                    })
                }}
            />
        )
    }

    const _header = useMemo(() => {
        return (
            <View
                style={{
                    paddingTop: 57,
                    backgroundColor: '#fff',
                    paddingBottom: 5,
                    borderBottomWidth: 1,
                    paddingHorizontal: 10,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                }}>
                <>
                    {/* <SelectButton
                        items={['すべて', '請負案件', '常用用案件']}
                        onChangeItem={(value) => {
                            if (value == 'すべて') {
                                setState((prev) => ({ ...prev, displayType: 'all' }))
                            } else if (value == '請負案件') {
                                setState((prev) => ({ ...prev, displayType: 'contract' }))
                            } else {
                                setState((prev) => ({ ...prev, displayType: 'request' }))
                            }
                        }}
                        selected={match(displayType)
                            .with('request', () => '常用用案件')
                            .with('contract', () => '請負案件')
                            .otherwise(() => 'すべて')}
                        style={{ marginTop: 10 }}
                    /> */}
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
                            count={displayData?.length ?? 0}
                            onPress={() => {
                                navigation.push('SelectCompany', {
                                    selectCompany: {
                                        withoutMyCompany: true,
                                        title: `${t('common:SelectCustomerClient')}`,
                                    },
                                    routeNameFrom: 'ContractingProjectList',
                                })
                            }}
                        />
                        {/* <IconParam
                            flex={1}
                            iconName={'construction'}
                            paramName={t('admin:NumberWorks')}
                            hasBorder
                            count={sum(displayData?.map((data) => data?.projectConstructions?.totalConstructions?.items?.filter(__filterConstruction).length ?? 0))}
                        /> */}
                    </View>
                </>
                <InvoiceDownloadButton title={`${t('admin:OfTheDisplayedProjects')} ${selectedMonth.month} ${t('admin:DownloadMonthlyStatement')}`} invoiceType={'projects'} month={selectedMonth} />
            </View>
        )
    }, [displayType, displayData, selectedMonth])

    const _footer = () => {
        return (
            <View
                style={{
                    marginTop: 20,
                    marginHorizontal: 10,
                }}>
                <AppButton
                    onPress={() => {
                        navigation.push('SelectCompany', {
                            selectCompany: {
                                withoutMyCompany: true,
                                title: `${t('common:SelectCustomerClient')}`,
                            },
                            routeNameFrom: 'ContractingProjectList',
                            initStartDate: selectedMonth,
                        })
                    }}
                    title={t('admin:CreateACase')}
                />
                <BottomMargin />
            </View>
        )
    }

    const _onDateChange = async (date: CustomDate) => {
        setState((prev) => ({
            ...prev,
            selectedMonth: getMonthlyFirstDay(date),
            /**
             * Hiruma
             * 2022-11-25
             */
            isFetching: true,
        }))
    }

    useEffect(() => {
        ;(async () => {
            try {
                if (!isScreenOnRef.current) return
                if (isFetching != true) return
                if (!__isAvailable) return
                if (isFocused) dispatch(setLoading(true))

                const __selectedMonth = cloneDeep(selectedMonth)

                const __cachedKey = genKeyName({
                    screenName: 'ContractingProjectList',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                    /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                    month: __selectedMonth ? monthBaseText(__selectedMonth).replace(/\//g, '-') : '',
                })
                const db = _getFirestore()
                unsubscribeRef.current = db
                    .collection('MonthlyProject')
                    .where('companyId', '==', myCompanyId)
                    .where('month', '>=', __selectedMonth?.totalSeconds)
                    .where('month', '<', nextMonth(__selectedMonth).totalSeconds)
                    .onSnapshot(async (data) => {
                        const _monthlyData = data.docs.map((doc) => doc.data())[0] as MonthlyProjectType | undefined
                        const projects = (_monthlyData?.projects?.sort((a, b) => (a.startDate ?? 0) - (b.startDate ?? 0)) ?? []) as ProjectType[]
                        setState((prev) => ({
                            ...prev,
                            isFetching: false,
                            monthData: projects ?? [],
                        }))
                        dispatch(setLoading(false))
                        dispatch(setIsNavUpdating(false))

                        const cachedResult = await updateCachedData({ key: __cachedKey, value: projects ?? [] })
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

                /**
                 * 先にキャッシュを表示
                 */
                const result = await getCachedData<ProjectType[]>(__cachedKey)
                if ((result.success?.length ?? 0) > 0) {
                    setState((rev) => ({ ...rev, monthData: result.success ?? [] }))
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
                if (isFocused) {
                    dispatch(setLoading(false))
                }
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
        const dataFilteredByProjectName = filteredByProjectName(displayData)
        const dataFilteredByConstructionName = filteredByConstructionName(displayData)

        if (textFilter && textFilter.length > 0) {
            if (dataFilteredByProjectName.length > 0) {
                setState((prev) => ({ ...prev, displayDataFilteredByProjectNameOrConstructionName: dataFilteredByProjectName }))
            } else if (dataFilteredByConstructionName.length > 0) {
                setState((prev) => ({ ...prev, displayDataFilteredByProjectNameOrConstructionName: dataFilteredByConstructionName as ProjectType[] }))
            } else {
                setState((prev) => ({ ...prev, displayDataFilteredByProjectNameOrConstructionName: [] }))
            }
        } else {
            setState((prev) => ({ ...prev, displayDataFilteredByProjectNameOrConstructionName: displayData }))
        }
    }, [textFilter, displayData])

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
                dateType={'month'}
                dateUpdate={dateUpdate}
                dateInitValue={selectedMonth}
                data={displayDataFilteredByProjectNameOrConstructionName}
                header={_header}
                content={_content}
                emptyProps={
                    loading
                        ? undefined
                        : {
                              text: t('admin:ThereAreNoDealsForTheCurrentMonthYet'),
                          }
                }
                onRefresh={_onRefresh}
                footer={_footer}
                onDateChange={_onDateChange}
            />
        </>
    )
}

export default ContractingProjectList
