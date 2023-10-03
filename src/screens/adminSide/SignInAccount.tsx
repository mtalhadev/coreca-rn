//
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Pressable, ScrollView, Platform } from 'react-native'
import { InputTextBox } from '../../components/organisms/inputBox/InputTextBox'
import { AppButton } from '../../components/atoms/AppButton'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { _login } from '../../services/account/AccountService'
import { setLoading, setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { getUuidv4 } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { BottomMargin } from '../../components/atoms/BottomMargin'
import { StoreType } from '../../stores/Store'
import { _getWorker } from '../../services/worker/WorkerService'
import { _getCompany } from '../../services/company/CompanyService'
import { loginOrSignUp } from '../../usecases/account/LoginSignUpCase'
import { PLACEHOLDER } from '../../utils/Constants'
import isEmpty from 'lodash/isEmpty'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import { useTextTranslation } from './../../fooks/useTextTranslation'
type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    title: string
    email?: string
    password?: string
    disable: boolean
}

const SignInAccount = () => {
    const { t } = useTextTranslation()

    const initialState: InitialStateType = {
        title: t('common:Login'),
        disable: true,
    }
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ title, email, password, disable }, setState] = useState(initialState)
    const signInUser = useSelector((store: StoreType) => store.account.signInUser)
    const dispatch = useDispatch()
    useEffect(() => {
        if (isEmpty(email) || isEmpty(password)) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [email, password])

    useEffect(() => {
        return () => {
            setState({ ...initialState })
        }
    }, [])

    const _login = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            /**
             * ログインのみ
             */
            const result = await loginOrSignUp({ email, password, dispatch, dontSignUp: true })
            dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: 'LOGIN_ERROR',
                }
            }

            if (result.success == 'admin-side-login') {
                navigation.push('AdminHome', {})
                return
            } else if (result.success == 'worker-side-login') {
                navigation.push('WorkerHome', {})
                return
            } else if (result.success == 'signup') {
                dispatch(
                    setToastMessage({
                        text: t('common:AccountDoesNotExistPleaseCreateANewAccount'),
                        type: 'error',
                    } as ToastMessage),
                )
            } else if (result.success == 'withdrawn') {
                dispatch(
                    setToastMessage({
                        text: t('admin:Withdrawn'),
                        type: 'success',
                    } as ToastMessage),
                )
            } else {
                dispatch(
                    setToastMessage({
                        text: t('common:UndefinedError'),
                        type: 'error',
                    } as ToastMessage),
                )
            }
        } catch (error) {
            dispatch(setLoading(false))
            const _error = error as CustomResponse
            setState((prev) => ({
                ...prev,
                title: t('common:Login'),
                disable: false,
            }))
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    return (
        <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
            <InputTextBox
                style={{ marginTop: 30 }}
                validation={'email'}
                required={true}
                title={t('common:EmailAddress')}
                placeholder={PLACEHOLDER.EMAIL}
                value={email}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, email: value }))
                }}
            />
            <InputTextBox
                style={{ marginTop: 30 }}
                validation={'password'}
                required={true}
                title={t('common:Password')}
                placeholder={PLACEHOLDER.PASSWORD}
                value={password}
                infoText={t('common:PasswordCondition')}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, password: value }))
                }}
            />
            <AppButton
                style={{ marginTop: 40, marginHorizontal: 20 }}
                disabled={disable}
                title={title}
                onPress={() => {
                    _login()
                }}
            />
            <AppButton
                style={{
                    marginTop: 15,
                    marginHorizontal: 20,
                }}
                title={t('common:ForgotYourPassword')}
                isGray={true}
                onPress={async () => {
                    navigation.push('ResetPassword', {})
                }}
            />
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default SignInAccount

const styles = StyleSheet.create({})
