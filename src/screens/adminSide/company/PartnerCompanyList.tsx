import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { CompanyListScreen } from '../../../components/template/CompanyListScreen'
import { StoreType } from '../../../stores/Store'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { useIsFocused } from '@react-navigation/native'
import { CompanyCLType } from '../../../models/company/Company'
import { updateCachedData, getCachedData, genKeyName } from '../../../usecases/CachedDataCase'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { _getFirestore } from '../../../services/firebase/FirestoreService'
import { PartnerCompanyListType } from '../../../models/company/PartnerCompanyListType'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
type NavProps = StackNavigationProp<RootStackParamList, 'PartnerCompanyList'>
type RouteProps = RouteProp<RootStackParamList, 'PartnerCompanyList'>

type InitialStateType = {
    companies?: CompanyCLType[]
    updateCache: number
    isFetching: boolean
}

const initialState: InitialStateType = {
    updateCache: 0,
    isFetching: false,
}
// 顧客/取引先一覧の画面
const PartnerCompanyList = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const [{ companies, isFetching }, setState] = useState(initialState)
    const dispatch = useDispatch()

    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)

    const unsubscribeRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)

    useSafeUnmount(setState, initialState)

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
    }, [isFocused, route])

    useEffect(() => {
        isScreenOnRef.current = isFocused
    }, [isFocused])

    useEffect(() => {
        if (!isFetching && isNavUpdating && isFocused) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useEffect(() => {
        ;(async () => {
            try {
                if (!isScreenOnRef.current || isFetching != true) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))

                const __cachedKey = genKeyName({
                    screenName: 'PartnerCompanyList',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                })

                const result = await getCachedData<PartnerCompanyListType>(__cachedKey)
                if (result.success) {
                    const _companies = result.success?.companies?.filter((company) => company.companyPartnership != 'my-company')
                    setState((prev) => ({ ...prev, companies: _companies, isFetching: false }))
                    dispatch(setLoading(false))
                }
                const db = _getFirestore()
                unsubscribeRef.current = db
                    .collection('PartnerCompanyList')
                    .where('companyId', '==', myCompanyId)
                    .onSnapshot(async (data) => {
                        const _partnerCompanyList = data.docs.map((doc) => doc.data())[0] as PartnerCompanyListType | undefined
                        if (result.success) {
                            if (result.success.updatedAt && _partnerCompanyList?.updatedAt && result.success.updatedAt > _partnerCompanyList?.updatedAt) {
                                // キャッシュよりDBが古い場合、更新しない
                                return
                            }
                        }
                        const _companies = _partnerCompanyList?.companies?.filter((company) => company.companyPartnership != 'my-company')
                        setState((prev) => ({ ...prev, companies: _companies, isFetching: false }))
                        dispatch(setLoading(false))
                        dispatch(setIsNavUpdating(false))
                    })
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
                dispatch(setIsNavUpdating(false))
                setState((prev) => ({ ...prev, isFetching: false }))
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

    const onPressCompany = (company: CompanyCLType) => {
        navigation.push('CompanyDetailRouter', {
            companyId: company.companyId,
            title: company.name,
        })
    }

    const onRefresh = () => {
        dispatch(setIsNavUpdating(true))
    }

    return <CompanyListScreen onRefresh={onRefresh} companies={companies ?? []} onPressCompany={onPressCompany} />
}
export default PartnerCompanyList

const styles = StyleSheet.create({})
