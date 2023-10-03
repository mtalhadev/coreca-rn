import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, Linking, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { ColumnBox } from '../../../components/atoms/ColumnBox'
import { AppButton } from '../../../components/atoms/AppButton'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { checkIsCompanyOwner, CheckIsCompanyOwnerResponse, signOut } from '../../../usecases/account/CommonAuthCase'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { StoreType } from '../../../stores/Store'
import isEmpty from 'lodash/isEmpty'
import { _deleteLoginAccountAndLocalAccount, _deleteLocalAccount } from '../../../services/account/AccountService'
import { _deleteCompany } from '../../../services/company/CompanyService'
import { COMPANY_TERMS_OF_SERVICE_URL, PRIVACY_POLICY_URL, SPECIFIED_COMMERCIAL_URL, THEME_COLORS } from '../../../utils/Constants'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { ScrollViewInstead } from '../../../components/atoms/ScrollViewInstead'
import { useIsFocused } from '@react-navigation/native'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../fooks/useTextTranslation'
import { _getCurrentUser } from '../../../services/firebase/AuthService'
import { resetAllCachedData } from '../../../usecases/CachedDataCase'
import Constants from 'expo-constants'
import { useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { setIsLoggingOff } from '../../../stores/AccountSlice'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    isOwner?: boolean
    /**
     * CorecaAdminかどうか？
     */
    isCorecaAdmin?: boolean
}

const initialState: InitialStateType = {
    //
}
const AdminSettings = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ isOwner, isCorecaAdmin }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const isLoggingOff = useSelector((state: StoreType) => state.account.isLoggingOff)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const { t } = useTextTranslation()

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        if (isFocused && !isNavUpdating) {
            dispatch(setIsNavUpdating(true))
        }
        return () => {
            dispatch(setIsNavUpdating(false))
        }
    }, [isFocused])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(myCompanyId)) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const result: CustomResponse<CheckIsCompanyOwnerResponse> = await checkIsCompanyOwner({
                    workerId: signInUser?.workerId,
                    myCompanyId,
                })

                if (isFocused) dispatch(setLoading(false))
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                setState((prev) => ({ ...prev, isOwner: result.success?.isOwner, isCorecaAdmin: result.success?.isCorecaAdmin }))
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
    }, [signInUser, myCompanyId])

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(myCompanyId)) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const result: CustomResponse<CheckIsCompanyOwnerResponse> = await checkIsCompanyOwner({
                    workerId: signInUser?.workerId,
                    myCompanyId,
                })

                if (isFocused) dispatch(setLoading(false))
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                setState((prev) => ({ ...prev, isOwner: result.success?.isOwner }))
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
    }, [signInUser, myCompanyId])

    const _signOut = async () => {
        try {
            const result = await signOut()
            if (result.error) {
                throw {
                    error: result.error,
                }
            }

            dispatch(
                setToastMessage({
                    text: t('common:LoggedOut'),
                    type: 'success',
                } as ToastMessage),
            )

            dispatch(setIsLoggingOff(true))
            navigation.push('Launch', {})
            dispatch(setLocalUpdateScreens([]))
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

    const _deleteMyAccount = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            const result = await _deleteLoginAccountAndLocalAccount()
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }

            const signOutResult = await signOut()
            if (signOutResult.error) {
                throw {
                    error: signOutResult.error,
                }
            }

            dispatch(setLocalUpdateScreens([]))
            dispatch(
                setToastMessage({
                    text: t('common:AccountDeleted'),
                    type: 'success',
                } as ToastMessage),
            )

            dispatch(setIsLoggingOff(true))
            navigation.push('Launch', {})
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

    const __deleteCache = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            const result = await resetAllCachedData()
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            dispatch(
                setToastMessage({
                    text: t('common:DeleteCache'),
                    type: 'success',
                } as ToastMessage),
            )
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

    const _deleteCompanyAndAccount = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            const user = _getCurrentUser()
            if (myCompanyId == undefined || user == undefined) {
                throw {
                    error: t('common:NoAuthInfoLogin'),
                }
            }

            const results = await Promise.all([_deleteLocalAccount(user.uid), _deleteCompany(myCompanyId)])
            if (isFocused) dispatch(setLoading(false))
            if (results[0].error) {
                throw {
                    error: t('common:CouldNotDeleteAccount'),
                }
            }
            if (results[1].error) {
                throw {
                    error: t('common:CompanyCouldNotBeDeleted'),
                }
            }

            const signOutResult = await signOut()
            if (signOutResult.error) {
                throw {
                    error: signOutResult.error,
                }
            }

            dispatch(setLocalUpdateScreens([]))
            dispatch(
                setToastMessage({
                    text: t('common:AccountDeleted'),
                    type: 'success',
                } as ToastMessage),
            )
            dispatch(setIsLoggingOff(true))
            navigation.push('Launch', {})
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
                paddingTop: 30,
            }}>
            <ColumnBox
                title={t('common:TermsOfUse')}
                hasContent={false}
                onPress={() => {
                    Linking.openURL(COMPANY_TERMS_OF_SERVICE_URL)
                }}
            />
            <ColumnBox
                title={t('common:PrivacyPolicy')}
                hasContent={false}
                onPress={() => {
                    Linking.openURL(PRIVACY_POLICY_URL)
                }}
            />
            <ColumnBox
                title={t('common:SpecialCommercialTransactionAct')}
                hasContent={false}
                onPress={() => {
                    Linking.openURL(SPECIFIED_COMMERCIAL_URL)
                }}
            />
            <ColumnBox
                title={t('common:License')}
                hasContent={false}
                onPress={() => {
                    navigation.push('Licenses', {})
                }}
            />

            <ColumnBox
                title={t('common:Language')}
                hasContent={false}
                onPress={() => {
                    navigation.push('LanguageSelector', {})
                }}
            />

            <ColumnBox
                style={{
                    marginTop: 20,
                }}
                hasContent={false}
                title={`${t('common:Version')}  ${Constants.expoConfig?.version}`}
            />
            <ColumnBox
                style={
                    {
                        // marginTop: 20,
                    }
                }
                textStyle={{
                    color: THEME_COLORS.OTHERS.LIGHT_GRAY,
                }}
                hasContent={false}
                title={`${t('common:RunTime')}  ${Constants.expoConfig?.runtimeVersion}`}
            />

            <View
                style={{
                    marginTop: 20,
                    marginHorizontal: 10,
                }}>
                <AppButton
                    style={{
                        marginTop: 15,
                    }}
                    title={t('common:Logout')}
                    height={35}
                    fontSize={12}
                    onPress={() => {
                        _signOut()
                    }}
                    // isGray={true}
                />
                <AppButton
                    style={{
                        marginTop: 15,
                    }}
                    onPress={() => {
                        navigation.push('SelectDepartment', {})
                    }}
                    title={t('common:SwitchDepartment')}
                    height={35}
                    fontSize={12}
                    // isGray={true}
                />
                <AppButton
                    style={{
                        marginTop: 15,
                    }}
                    onPress={() => {
                        navigation.push('SelectAccount', {})
                    }}
                    title={t('common:SwitchAccount')}
                    height={35}
                    fontSize={12}
                    // isGray={true}
                />
                <AppButton
                    style={{
                        marginTop: 25,
                    }}
                    title={t('common:ResetCache')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('common:WantToDeleteCache'), t('common:OperationCannotBeUndoneForCache'), [
                            { text: t('common:Deletion'), onPress: () => __deleteCache() },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
            </View>

            <View
                style={{
                    marginTop: 40,
                    marginHorizontal: 10,
                }}>
                {isOwner == false && (
                    <AppButton
                        style={{
                            marginTop: 10,
                        }}
                        title={t('common:DeleteAccount')}
                        height={35}
                        fontSize={12}
                        isGray={true}
                        onPress={() => {
                            Alert.alert(t('common:WantToDeleteAccount'), t('common:OperationCannotBeUndone'), [
                                { text: t('common:Deletion'), onPress: () => _deleteMyAccount() },
                                {
                                    text: t('common:Cancel'),
                                    style: 'cancel',
                                },
                            ])
                        }}
                    />
                )}
                {isOwner == true && (
                    <AppButton
                        style={{
                            marginTop: 10,
                        }}
                        title={t('common:DeleteYourCompanyAndAccount')}
                        height={35}
                        fontSize={12}
                        isGray={true}
                        onPress={() => {
                            Alert.alert(t('admin:WanttoDeleteCompanyAndAccount'), t('common:OperationCannotBeUndone'), [
                                { text: t('common:Deletion'), onPress: () => _deleteCompanyAndAccount() },
                                {
                                    text: t('common:Cancel'),
                                    style: 'cancel',
                                },
                            ])
                        }}
                    />
                )}
                {true && isOwner == true && (
                    <AppButton
                        style={{
                            marginTop: 10,
                        }}
                        title={t('common:ToCorecaAdminDashboard')}
                        height={35}
                        fontSize={12}
                        isGray={true}
                        onPress={() => {
                            navigation.push('CorecaAdminDashboard', {})
                        }}
                    />
                )}
            </View>
            <BottomMargin />
        </ScrollViewInstead>
    )
}
export default AdminSettings

const styles = StyleSheet.create({})
