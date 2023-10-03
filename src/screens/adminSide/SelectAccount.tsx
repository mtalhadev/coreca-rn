import React, { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { StyleSheet, Text } from 'react-native'
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/core'
import { RootStackParamList } from '../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { AppButton } from '../../components/atoms/AppButton'
import { useTextTranslation } from './../../fooks/useTextTranslation'
import { _deleteLoginAccountAndLocalAccount, _deleteLocalAccount, _getLocalAccountList, _login } from '../../services/account/AccountService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { EmptyScreen } from '../../components/template/EmptyScreen'
import { BottomMargin } from '../../components/atoms/BottomMargin'
import { getAccountList, SelectableAccountType, selectAccountAndLogin } from '../../usecases/account/AccountSelectCase'
import { StoreType } from '../../stores/Store'
import { getNextRoute, getOnlyCompanyName, setDeviceTokenToAccount } from '../../usecases/RouteCase'
import { Account } from '../../components/organisms/worker/Account'
import { FlatList } from 'react-native-gesture-handler'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import { getUuidv4 } from '../../utils/Utils'
import { GlobalStyles } from '../../utils/Styles'
import { useSafeLoadingUnmount } from '../../fooks/useUnmount'
import { genKeyName, getCachedData, updateCachedData } from '../../usecases/CachedDataCase'
import ENV from '../../../env/env'
type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

const SelectAccount = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const [update, setUpdate] = useState(0)
    const [selectableAccounts, setSelectableAccount] = useState<SelectableAccountType[]>([])
    const urlScheme = useSelector((state: StoreType) => state.nav.urlScheme)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const loading = useSelector((state: StoreType) => state.util.loading)
    const isFocused = useIsFocused()
    const { t } = useTextTranslation()

    useEffect(() => {
        if (isFocused) {
            setUpdate(update + 1)
        }
    }, [isFocused])

    useSafeLoadingUnmount(dispatch, isFocused)

    const _getAccountList = async () => {
        try {
            if (isFocused) dispatch(setLoading(true))
            // キャッシュを先に表示させる
            const __cachedKey = genKeyName({
                screenName: 'SelectAccount',
            })
            const cacheResult = await getCachedData<SelectableAccountType[]>(__cachedKey)
            if (cacheResult.success) {
                setSelectableAccount(cacheResult.success)
            }
            const result = await getAccountList()
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            if (result.success) {
                setSelectableAccount(result.success)
                const cachedResult = await updateCachedData({ key: __cachedKey, value: result.success })
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
        } catch (error) {
            if (isFocused) {
                dispatch(setLoading(false))
            }
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    const _selectAccount = async (selectableAccount?: SelectableAccountType) => {
        try {
            if (selectableAccount == undefined) {
                throw {
                    error: t('common:TheresNoAccount'),
                }
            }
            dispatch(setLoading('unTouchable'))
            const loginResult = await selectAccountAndLogin(selectableAccount, dispatch)
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (loginResult.error) {
                throw {
                    error: loginResult.error,
                }
            }
            dispatch(setLocalUpdateScreens([]))
            await setDeviceTokenToAccount(selectableAccount.accountId as string)

            if (loginResult.success == 'no-worker') {
                navigation.push('CreateOwnerWorker', {})
            } else if (loginResult.success == 'no-company') {
                navigation.push('CreateMyCompany', {})
            } else if (loginResult.success == 'admin-side') {
                const rtnRoute = await getNextRoute('SelectAccount', urlScheme?.path, signInUser)
                if (rtnRoute.error) {
                    throw {
                        error: rtnRoute.error,
                    }
                }
                let retCompanyName: CustomResponse<string>
                if (urlScheme?.queryParams.companyId != undefined) {
                    retCompanyName = await getOnlyCompanyName(urlScheme?.queryParams.companyId as unknown as string)
                }
                if (rtnRoute.success != undefined) {
                    rtnRoute.success?.forEach((route) => {
                        if (route != 'CompanyDetailRouter') {
                            navigation.push(route as never, {} as never)
                        } else {
                            navigation.push(route, { companyId: urlScheme?.queryParams.companyId as unknown as string, title: retCompanyName.success })
                        }
                    })
                }
            } else if (loginResult.success == 'worker-side') {
                navigation.push('WorkerHome', {})
            } else if (loginResult.success == 'withdrawn') {
                dispatch(
                    setToastMessage({
                        text: t('admin:Withdrawn'),
                        type: 'success',
                    } as ToastMessage),
                )
            }
        } catch (error) {
            const _error = error as CustomResponse
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (_error.error == 'auth/user-not-found' || _error.error == 'auth/wrong-password') {
                dispatch(
                    setToastMessage({
                        text: t('common:PleaseLoginAgain'),
                        type: 'error',
                    } as ToastMessage),
                )
                navigation.push('SignInAccount', {})
            } else {
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            }
        }
    }

    useEffect(() => {
        _getAccountList()
    }, [update])

    useEffect(() => {
        return () => {
            setUpdate(0)
            setSelectableAccount([])
        }
    }, [])

    const listKey = useMemo(() => getUuidv4(), [])
    return (
        <FlatList
            listKey={listKey}
            data={selectableAccounts}
            keyExtractor={(item, index) => index.toString()}
            ListEmptyComponent={() => {
                return loading ? <></> : <EmptyScreen text={t('common:AccountDoesnotExist')} subText={t('common:PleaseCreateNewAccount')} />
            }}
            scrollIndicatorInsets={{ right: 1 }}
            ListFooterComponent={() => {
                return (
                    <>
                        <AppButton
                            style={{
                                marginTop: 20,
                                marginHorizontal: 10,
                            }}
                            hasShadow={false}
                            title={t('common:CreateNewCompany')}
                            height={40}
                            onPress={() => {
                                if (signInUser) {
                                    dispatch(
                                        setToastMessage({
                                            text: t('admin:LogOutToCreateANewCompany'),
                                            type: 'warn',
                                        }),
                                    )
                                    return
                                }
                                const isInvited = urlScheme?.queryParams.companyId && urlScheme.queryParams.workerId == undefined
                                if (!ENV.IS_PLAN_TICKET_AVAILABLE || isInvited) {
                                    navigation.push('SignUpAccount', {})
                                } else {
                                    navigation.push('AddInviteURL', {})
                                }
                            }}
                        />
                        <Text style={{ ...GlobalStyles.smallGrayText, marginTop: 10, marginLeft: 30 }}>{t('common:CreateAnotherDepartment')}</Text>
                        <AppButton
                            style={{
                                marginTop: 15,
                                marginHorizontal: 10,
                            }}
                            title={t('common:LoginWithYourEmailAddress')}
                            height={40}
                            isGray={true}
                            onPress={() => {
                                navigation.push('SignInAccount', {})
                            }}
                        />
                        <BottomMargin />
                    </>
                )
            }}
            renderItem={({ item, index }) => {
                return (
                    <Account
                        onPress={(account) => {
                            _selectAccount(account)
                        }}
                        selectableAccount={item}
                        key={item.accountId}
                        style={{ marginTop: 10 }}
                    />
                )
            }}
        />
    )
}
export default SelectAccount

const styles = StyleSheet.create({})
