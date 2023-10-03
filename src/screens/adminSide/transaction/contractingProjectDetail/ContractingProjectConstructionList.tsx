/* eslint-disable indent */
import React, { useState, useEffect, useContext, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, ListRenderItem, ListRenderItemInfo, FlatList } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { useIsFocused } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { AppButton } from '../../../../components/atoms/AppButton'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { FilterCompany } from '../../../../components/organisms/company/FilterCompany'
import { IconParam } from '../../../../components/organisms/IconParam'
import { SelectButton } from '../../../../components/organisms/SelectButton'
import { StoreType } from '../../../../stores/Store'
import { setToastMessage, ToastMessage, setLoading } from '../../../../stores/UtilSlice'
import { YYYYMMDateType, newCustomDate } from '../../../../models/_others/CustomDate'
import { THEME_COLORS } from '../../../../utils/Constants'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { RootStackParamList } from '../../../Router'
import { ContractingProjectDetailRouterContext } from './ContractingProjectDetailRouter'
import { ConstructionType } from '../../../../models/construction/Construction'
import { Construction } from '../../../../components/organisms/construction/Construction'
import { CompanyType } from '../../../../models/company/Company'
import { ContractType } from '../../../../models/contract/Contract'
import { updateCachedData, getCachedData, genKeyName } from '../../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'

import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { EmptyScreen } from '../../../../components/template/EmptyScreen'
import { _getFirestore } from '../../../../services/firebase/FirestoreService'
import { ContractingProjectConstructionListType } from '../../../../models/construction/ContractingProjectConstructionListType'
import { checkMyDepartment } from '../../../../usecases/department/DepartmentCase'

type NavProps = StackNavigationProp<RootStackParamList, 'ContractingProjectConstructionList'>
type RouteProps = RouteProp<RootStackParamList, 'ContractingProjectConstructionList'>

type InitialStateType = {
    companyFilter?: CompanyType
    updateCache: number
    selectFilter?: string
    constructions?: ConstructionType[]
    contract?: ContractType
    displayData?: ConstructionType[]
    isFetching: boolean
    updateIdAndMonths?: string[]
    updatedMonths?: YYYYMMDateType[]
}

const initialState: InitialStateType = {
    displayData: [],
    updateCache: 0,
    isFetching: false,
    selectFilter: 'すべて',
}

const ContractingProjectConstructionList = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const myCompanyId = useSelector((state: StoreType) => state?.account?.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const { projectId, contractId, contractor } = useContext(ContractingProjectDetailRouterContext)
    const [{ constructions, contract, companyFilter, selectFilter, displayData, isFetching }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])

    const isFocused = useIsFocused()
    const [dateUpdate, setDateUpdate] = useState(0)

    const unsubscribeRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)

    useSafeUnmount(setState, initialState, () => setDateUpdate(dateUpdate + 1))

    useEffect(() => {
        return () => {
            setState(initialState)
            setDateUpdate(dateUpdate + 1)
        }
    }, [myCompanyId])

    useEffect(() => {
        if (isFocused) {
            ;(async () => {
                setState((prev) => ({ ...prev, isFetching: true }))
            })()
        }
    }, [isFocused, route])

    useEffect(() => {
        isScreenOnRef.current = isFocused
    }, [isFocused])

    useEffect(() => {
        if (isNavUpdating && isFocused) {
            //アプデボタンが押された時
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    const canManageConstruction =
        (contract?.receiveCompanyId == myCompanyId || (contract?.orderCompanyId == myCompanyId && contract?.receiveCompany?.isFake)) &&
        (contract?.receiveCompanyId == myCompanyId ||
            checkMyDepartment({
                targetDepartmentIds: contract?.orderDepartmentIds,
                activeDepartmentIds,
            })) &&
        contract?.status != 'created'

    const selectList = ['すべて', '施工', '発注'] as const
    const filterConstructionByCompany = (construction: ConstructionType) => {
        if (companyFilter == undefined) {
            return true
        }
        if (companyFilter.companyId == construction.contract?.receiveCompanyId || companyFilter.companyId == construction.contract?.orderCompanyId) {
            return true
        }
        return false
    }

    const filterConstructionBySelect = (construction: ConstructionType) => {
        if (selectFilter == undefined) {
            return true
        }
        // すべて
        if (selectFilter == selectList[0]) {
            return true
        }
        // 施工
        if (selectFilter == selectList[1] && construction.constructionRelation == 'manager') {
            return true
        }
        // 発注
        if (
            selectFilter == selectList[2] &&
            (construction.constructionRelation == 'intermediation' ||
                construction.constructionRelation == 'owner' ||
                construction.constructionRelation == 'fake-company-manager' ||
                construction.constructionRelation == 'order-children')
        ) {
            return true
        }
        return false
    }

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useSafeLoadingUnmount(dispatch, isFocused)

    const _content: ListRenderItem<ConstructionType> = (info: ListRenderItemInfo<ConstructionType>) => {
        const { item, index } = info

        return (
            <Construction
                style={{
                    marginTop: 7,
                    marginHorizontal: 7,
                }}
                construction={item}
                onPress={() => {
                    navigation.push('ConstructionDetailRouter', {
                        constructionId: item.constructionId,
                        projectId: projectId,
                        startDate: item.project?.startDate,
                        title: item.displayName,
                        contractor,
                    })
                }}
            />
        )
    }
    const _header = useMemo(() => {
        return (
            <View
                style={{
                    paddingTop: 10,
                    backgroundColor: '#fff',
                    paddingBottom: 10,
                    borderBottomWidth: 1,
                    paddingHorizontal: 10,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                }}>
                <View
                    style={{
                        flexDirection: 'row',
                    }}>
                    <FilterCompany
                        style={{
                            flex: 1,
                        }}
                        title={t('common:CompanyFilter')}
                        company={companyFilter}
                        onChange={(company) => {
                            setState((prev) => ({ ...prev, companyFilter: company }))
                        }}
                    />
                    <View
                        style={{
                            width: 10,
                        }}></View>
                    <SelectButton
                        style={{
                            flex: 1,
                        }}
                        onChangeItem={(value) => {
                            if (selectFilter != value) {
                                setState((prev) => ({ ...prev, selectFilter: value }))
                            }
                        }}
                        selected={selectFilter}
                        items={selectList}
                    />
                </View>
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 15,
                    }}>
                    <IconParam
                        flex={1.1}
                        iconName={'construction'}
                        paramName={t('admin:NoOfWorks')}
                        count={displayData ? displayData.length : 0}
                        onPress={
                            canManageConstruction
                                ? () => {
                                      navigation.push('CreateConstruction', {
                                          contractId,
                                          routeNameFrom: 'ContractingProjectConstructionList',
                                          siteDate: newCustomDate(),
                                      })
                                  }
                                : undefined
                        }
                    />
                </View>
            </View>
        )
    }, [selectFilter, companyFilter, selectList, displayData, canManageConstruction, contractId])

    const _footer = () => {
        return (
            <View
                style={{
                    marginTop: 20,
                    marginHorizontal: 10,
                }}>
                {canManageConstruction && (
                    <AppButton
                        onPress={() => {
                            navigation.push('CreateConstruction', {
                                contractId: contractId,
                                routeNameFrom: 'ContractingProjectConstructionList',
                                siteDate: newCustomDate(),
                            })
                        }}
                        title={t('admin:CreateConstruction')}
                        iconName={'plus'}
                    />
                )}

                <BottomMargin />
            </View>
        )
    }

    /**
     * 工事一覧DBフェッチ
     */
    useEffect(() => {
        ;(async () => {
            try {
                if (!isScreenOnRef.current || isFetching != true) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))

                const __cachedKey = genKeyName({
                    screenName: 'ContractingProjectConstructionList',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                    contractId: contractId as string,
                })
                const result = await getCachedData<ContractingProjectConstructionListType>(__cachedKey ?? 'no-id')
                const db = _getFirestore()
                unsubscribeRef.current = db
                    .collection('ContractingProjectConstructionList')
                    .where('companyId', '==', myCompanyId)
                    .where('contractId', '==', contractId)
                    .onSnapshot(async (data) => {
                        const _contractingProjectConstructionListResult = data.docs.map((doc) => doc.data())[0] as ContractingProjectConstructionListType | undefined
                        if (_contractingProjectConstructionListResult == undefined) return
                        if (result.success) {
                            if (result.success.updatedAt && _contractingProjectConstructionListResult?.updatedAt && result.success.updatedAt > _contractingProjectConstructionListResult?.updatedAt) {
                                // キャッシュよりDBが古い場合、更新しない
                                return
                            }
                        }
                        setState((prev) => ({
                            ...prev,
                            constructions: _contractingProjectConstructionListResult?.constructions?.items,
                            contract: _contractingProjectConstructionListResult?.contract,
                            isFetching: false,
                        }))
                        dispatch(setLoading(false))
                        dispatch(setIsNavUpdating(false))
                    })
                if (result.success) {
                    setState((prev) => ({ ...prev, constructions: result.success?.constructions?.items, contract: result.success?.contract, isFetching: false }))
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
                if (isFocused) dispatch(setLoading(false))
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

    useEffect(() => {
        const _constructions = constructions && constructions.filter(filterConstructionByCompany).filter(filterConstructionBySelect)
        setState((prev) => ({ ...prev, displayData: _constructions }))
    }, [companyFilter, selectFilter, constructions])

    return (
        <FlatList
            ListHeaderComponent={_header}
            data={displayData}
            renderItem={_content}
            ListEmptyComponent={() => <EmptyScreen text={t('admin:NoConstructionForCurrentMonth')} />}
            ListFooterComponent={_footer}
        />
    )
}

export default ContractingProjectConstructionList

const styles = StyleSheet.create({})
