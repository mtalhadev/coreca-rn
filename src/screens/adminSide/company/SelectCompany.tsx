import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { CompanyListScreen } from '../../../components/template/CompanyListScreen'
import { setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { StoreType } from '../../../stores/Store'
import { useIsFocused } from '@react-navigation/native'
import { CompanyCLType } from '../../../models/company/Company'
import { updateCachedData, getCachedData, genKeyName } from '../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../fooks/useTextTranslation'
import { _getFirestore } from '../../../services/firebase/FirestoreService'
import { PartnerCompanyListType } from '../../../models/company/PartnerCompanyListType'
import { CustomDate, getMonthlyFinalDay, getMonthlyFirstDay } from '../../../models/_others/CustomDate'
import isEmpty from 'lodash/isEmpty'
import { addReservations, getReservationListByIds } from '../../../usecases/reservation/ReservationCase'
import { _addLocalReservations } from '../../../components/template/ArrangementManageUtils'
import { _getReservationListByIds } from '../../../services/reservation/ReservationService'
import { ID } from '../../../models/_others/ID'
import flatten from 'lodash/flatten'
import { SiteArrangementModel } from '../../../models/arrangement/SiteArrangement'
import { toSiteArrangementDataCLType } from '../../../models/arrangement/SiteArrangementDataType'
type NavProps = StackNavigationProp<RootStackParamList, 'SelectCompany'>
type RouteProps = RouteProp<RootStackParamList, 'SelectCompany'>

export type SelectCompanyType = {
    title?: string
    withoutMyCompany?: boolean
    excludedCompanyIds?: string[]
    onlyFakeCompany?: boolean
    onPressCompany?: (company: CompanyCLType) => void
    onlyLinkedCompany?: boolean
}

type InitialStateType = {
    companies?: CompanyCLType[]
    selectedDate?: CustomDate
    isFetching: boolean
}

const initialState: InitialStateType = {
    selectedDate: undefined,
    isFetching: false,
}

// 会社選択用の画面。主にInputCompanyBoxから遷移してくる
const SelectCompany = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const targetDate = useSelector((state: StoreType) => state.calendar.targetDate)
    const targetDateFromParams = route.params?.initStartDate
    const invRequestId = route.params?.invRequestId
    const siteId = route.params?.siteId
    const [{ companies, selectedDate, isFetching }, setState] = useState(initialState)

    const unsubscribeRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)

    const isMultiChoice = route.params?.routeNameFrom === 'ArrangementManage' || route.params?.routeNameFrom === 'DateArrangements'

    useSafeUnmount(setState, initialState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (isFocused) {
            ;(async () => {
                setState((prev) => ({ ...prev, isFetching: true }))
            })()
        }

        isScreenOnRef.current = isFocused
    }, [isFocused])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useEffect(() => {
        navigation.setOptions({
            title: route.params?.selectCompany?.title ?? t('admin:SelectCompany'),
        })
    }, [navigation])

    useEffect(() => {
        if (
            targetDate &&
            !isEmpty(targetDate) &&
            targetDateFromParams &&
            targetDate.totalSeconds >= getMonthlyFirstDay(targetDateFromParams).totalSeconds &&
            targetDate.totalSeconds <= getMonthlyFinalDay(targetDateFromParams).totalSeconds
        ) {
            setState((prev) => ({ ...prev, selectedDate: targetDate }))
        }
    }, [])

    useEffect(() => {
        ;(async () => {
            try {
                if (!isScreenOnRef.current || isFetching != true) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))

                const __cachedKey = genKeyName({
                    screenName: 'SelectCompany',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                })

                const db = _getFirestore()
                unsubscribeRef.current = db
                    .collection('PartnerCompanyList')
                    .where('companyId', '==', myCompanyId)
                    .onSnapshot(async (data) => {
                        const _partnerCompanyList = data.docs.map((doc) => doc.data())[0] as PartnerCompanyListType | undefined
                        const displayCompanies = filterCompanies(_partnerCompanyList?.companies ?? [])
                        setState((prev) => ({ ...prev, companies: displayCompanies, isFetching: false }))
                        dispatch(setLoading(false))
                        dispatch(setIsNavUpdating(false))

                        const cachedResult = await updateCachedData({ key: __cachedKey, value: _partnerCompanyList?.companies ?? [] })
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
                const result = await getCachedData<CompanyCLType[]>(__cachedKey)
                if (result.success) {
                    const displayCompanies = filterCompanies(result.success ?? [])
                    setState((prev) => ({ ...prev, companies: displayCompanies }))
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

    const filterCompanies = (_companies: CompanyCLType[]) => {
        let newCompanies: CompanyCLType[] = []
        if (route?.params?.selectCompany?.withoutMyCompany) {
            newCompanies = _companies.filter((company) => company?.companyId != myCompanyId) ?? []
        }
        const excluded = route?.params?.selectCompany?.excludedCompanyIds
        if (excluded?.length ?? 0 > 0) {
            newCompanies = _companies.filter((company) => company?.companyId && !excluded?.includes(company?.companyId)) ?? []
        }
        if (route?.params?.selectCompany?.onlyFakeCompany) {
            newCompanies = _companies.filter((company) => company?.isFake) ?? []
        }
        if (route?.params?.selectCompany?.onlyLinkedCompany) {
            newCompanies = _companies.filter((company) => !company?.isFake && company?.companyId != myCompanyId) ?? []
        }
        return newCompanies
    }

    const _addReservation = async (selectedCompanies: CompanyCLType[]) => {
        try {
            if (selectedCompanies == undefined) {
                return
            }
            dispatch(setLoading('unTouchable'))
            const results = await Promise.all(
                selectedCompanies?.map((_comp) =>
                    addReservations({
                        myCompanyId: myCompanyId,
                        requestedCompanyId: _comp?.companyId,
                        constructionIds: route.params?.constructionIds,
                    }),
                ),
            )
            results.forEach((result) => {
                if (isFocused) dispatch(setLoading(false))

                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            })
            const newReservationIds = flatten(results.map((result) => result.success)).filter((data) => data != undefined) as ID[]

            const reservationsResult = await getReservationListByIds({ reservationIds: newReservationIds, options: { targetCompany: true } })

            if (reservationsResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: reservationsResult.error,
                    errorCode: reservationsResult.errorCode,
                }
            }
            let arrCachedKey: string | undefined = undefined
            if (siteId) {
                arrCachedKey = genKeyName({
                    screenName: 'SiteArrangement',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                    siteId: siteId as string,
                })
            }
            if (invRequestId) {
                arrCachedKey = genKeyName({
                    screenName: 'InvRequestArrangement',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                    invRequestId: invRequestId as string,
                })
            }

            if (arrCachedKey) {
                const siteArrangementCacheData = await getCachedData<SiteArrangementModel>(arrCachedKey)
                let _siteArrangementData: SiteArrangementModel = {
                    ...siteArrangementCacheData.success,
                    updatedAt: Number(new Date()),
                }
                if (siteArrangementCacheData.success) {
                    //キャッシュがあった場合のみ上書き
                    _addLocalReservations(
                        _siteArrangementData?.siteArrangementData,
                        reservationsResult.success?.map((res) => res),
                    )
                    const cachedResult = await updateCachedData({ key: arrCachedKey, value: _siteArrangementData ?? {} })
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
            }
            if (isFocused) dispatch(setLoading(false))

            dispatch(
                setToastMessage({
                    text: t('admin:SupportRequestedArrangeASupportWorker'),
                    type: 'success',
                } as ToastMessage),
            )
            navigation.goBack()
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
        <CompanyListScreen
            companies={companies ?? []}
            selectedButton={isMultiChoice ? (item) => _addReservation(item) : undefined}
            routeNameFrom={route.params?.routeNameFrom}
            targetDate={targetDateFromParams}
            onPressCompany={(company) => {
                if (isMultiChoice) {
                    undefined
                }
                if (
                    route.params?.routeNameFrom === 'AdminHome' ||
                    route.params?.routeNameFrom === 'ConstructionList' ||
                    route.params?.routeNameFrom === 'ContractingProjectList' ||
                    route.params?.routeNameFrom === 'SelectSiteCreateOption' ||
                    route.params?.routeNameFrom === 'DateArrangements_CreateProject' ||
                    route.params?.routeNameFrom === 'RequestList'
                ) {
                    navigation.replace('CreateProject', {
                        company,
                        targetDate: selectedDate ?? targetDateFromParams,
                    })
                }
                if (route.params?.selectCompany?.onPressCompany) {
                    navigation.goBack()
                    route.params.selectCompany?.onPressCompany(company)
                }
            }}
        />
    )
}
export default SelectCompany

const styles = StyleSheet.create({})
