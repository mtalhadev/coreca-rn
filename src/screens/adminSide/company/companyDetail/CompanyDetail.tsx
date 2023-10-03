import React, { useState, useEffect, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { CompanyProfile, CompanyProfileDisplayType } from '../../../../components/template/CompanyProfile'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { getAnyCompanyProfileWithOwnerWorker } from '../../../../usecases/company/CommonCompanyCase'
import { StoreType } from '../../../../stores/Store'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import isEmpty from 'lodash/isEmpty'
import { CompanyDetailRouterContext } from './CompanyDetailRouter'
import { connectFakeCompany, deleteFakeCompany, disconnectFakeCompany } from '../../../../usecases/company/FakeCompanyCase'
import { deletePartnership } from '../../../../usecases/company/PartnerCompanyCase'
import { useIsFocused } from '@react-navigation/native'
import { CompanyCLType } from '../../../../models/company/Company'
import { WorkerCLType } from '../../../../models/worker/Worker'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { ScrollViewInstead } from '../../../../components/atoms/ScrollViewInstead'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { genKeyName, getCachedData, updateCachedData } from '../../../../usecases/CachedDataCase'
import { PartnerCompanyListType } from '../../../../models/company/PartnerCompanyListType'

type NavProps = StackNavigationProp<RootStackParamList, 'CompanyDetail'>
type RouteProps = RouteProp<RootStackParamList, 'CompanyDetail'>

type InitialStateType = {
    id?: string
    type?: CompanyProfileDisplayType
    worker?: WorkerCLType
    company?: CompanyCLType
    refresh: number
    inviteUrl?: string
    metroPort?: string
    localUpdate: number
}

const initialState: InitialStateType = {
    //
    metroPort: '8081',
    localUpdate: 0,
    refresh: 0,
}

const CompanyDetail = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ id, type, worker, company, refresh, inviteUrl, metroPort, localUpdate }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account?.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const { companyId, update } = useContext(CompanyDetailRouterContext)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)

    useSafeUnmount(setState, initialState)
    useEffect(() => {
        if (companyId) {
            setState((prev) => ({ ...prev, id: companyId }))
        }
    }, [])
    const isFocused = useIsFocused()

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, localUpdate: localUpdate + 1 }))
        }
    }, [isFocused])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, localUpdate: localUpdate + 1 }))
        }
    }, [isNavUpdating])

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(id) || isEmpty(myCompanyId)) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const companyResult = await getAnyCompanyProfileWithOwnerWorker({
                    companyId: id,
                    myCompanyId,
                    myWorkerId: signInUser?.workerId,
                    metroPort,
                })
                if (companyResult.error || companyResult.success == undefined || companyResult.success?.company == undefined) {
                    throw {
                        error: companyResult.error,
                    }
                }
                const __cachedKey = genKeyName({
                    screenName: 'PartnerCompanyList',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                })
                const partnerCompanyListCacheData = await getCachedData<PartnerCompanyListType>(__cachedKey)
                const targetCompany = partnerCompanyListCacheData.success?.companies?.find((item)=>item.companyId==id)
                if (targetCompany) {
                    let _type: CompanyProfileDisplayType = 'other-company'
                    if (targetCompany?.companyPartnership == 'my-company') {
                        _type = 'my-company'
                    } else if (targetCompany?.companyPartnership == 'others') {
                        _type = 'other-company'
                    } else if (!targetCompany?.isFake) {
                        _type = 'partner-company'
                    } else if (targetCompany?.isFake) {
                        _type = 'fake-partner-company'
                    }
                    setState((prev) => ({ 
                        ...prev, 
                        company: targetCompany,
                        type: _type
                    }))
                    if (companyResult.success?.company.companyId == undefined){
                        return
                    }
                    if (targetCompany.updatedAt && companyResult.success?.company?.updatedAt && targetCompany.updatedAt > companyResult.success?.company?.updatedAt) {
                        // キャッシュよりDBが古い場合、更新しない
                        return
                    }
                }
                setState((prev) => ({ ...prev, ...companyResult.success }))
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
    }, [id, update, refresh, localUpdate, metroPort])

    const _deleteCompanyFromPartnerCompanyListCache = async (companyId: string) => {
        const __cachedKey = genKeyName({
            screenName: 'PartnerCompanyList',
            accountId: accountId,
            companyId: myCompanyId as string,
        })
        const partnerCompanyListCacheData = await getCachedData<PartnerCompanyListType>(__cachedKey)
        const newCompanies = partnerCompanyListCacheData.success?.companies?.filter((item)=>item.companyId!=companyId)
        if (partnerCompanyListCacheData.success?.companies){
            partnerCompanyListCacheData.success.companies = newCompanies
        }
        await updateCachedData({ 
            key: __cachedKey, 
            value: partnerCompanyListCacheData.success
        })
    }

    const _delete = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            // 顧客取引先一覧のキャッシュから削除
            _deleteCompanyFromPartnerCompanyListCache(id ?? 'no-id' )
            const result = await deleteFakeCompany({ companyId: id })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
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

    const _disconnect = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            await disconnectFakeCompany({ fakeCompanyId: company?.connectedCompany?.companyId })
            if (isFocused) {
                dispatch(setLoading(false))
            }
            setState((prev) => ({ ...prev, refresh: refresh + 1 }))
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

    const _connect = async () => {
        const onPressFakeCompany = async (selectedCompany: CompanyCLType) => {
            try {
                dispatch(setLoading('unTouchable'))
                await connectFakeCompany({ fakeCompanyId: selectedCompany.companyId, realCompanyId: company?.companyId })
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                navigation.goBack()
                setState((prev) => ({ ...prev, refresh: refresh + 1 }))
            } catch (error) {
                navigation.goBack()
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            }
        }

        navigation.push('SelectCompany', {
            selectCompany: {
                title: t('admin:SelectAProvisionalCompanyToCombine'),
                onPressCompany: onPressFakeCompany,
                onlyFakeCompany: true,
            },
        })
    }

    const _deletePartnership = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            const result = await deletePartnership(company?.companyId as string, myCompanyId as string)
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
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
        <ScrollViewInstead
            style={{
                padding: 10,
                flex: 1,
                backgroundColor: '#fff',
            }}>
            <CompanyProfile
                type={type}
                company={company}
                worker={worker}
                inviteUrl={inviteUrl}
                onPressDelete={() => {
                    Alert.alert(t('admin:RemoveTheTemporaryCompany'), t('admin:OperationCannotBeUndone'), [
                        { text: t('admin:Deletion'), onPress: () => _delete() },
                        {
                            text: t('admin:Cancel'),
                            style: 'cancel',
                        },
                    ])
                }}
                updateCompanyData={() => {
                    setState((prev) => ({ ...prev, localUpdate: localUpdate + 1 }))
                }}
                onPressConnect={() => {
                    _connect()
                }}
                onPressDisconnect={() => {
                    _disconnect()
                }}
                onPressDeletePartnership={() => {
                    Alert.alert(t('admin:WantToDeleteACustomer'), t('admin:AfterDeletionInvitationMustReInvited'), [
                        { text: t('admin:Deletion'), onPress: () => _deletePartnership() },
                        {
                            text: t('admin:Cancel'),
                            style: 'cancel',
                        },
                    ])
                }}
                onPortChanged={(port) => setState((prev) => ({...prev, metroPort: port ?? ''}))}
            />

            <View
                style={{
                    marginBottom: 100,
                }}></View>
        </ScrollViewInstead>
    )
}
export default CompanyDetail

const styles = StyleSheet.create({})
