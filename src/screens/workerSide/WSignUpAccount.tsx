//
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { StyleSheet } from 'react-native'
import { InputTextBox } from '../../components/organisms/inputBox/InputTextBox'
import { AppButton } from '../../components/atoms/AppButton'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { StoreType } from '../../stores/Store'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { setLoading, setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { GreenColor } from '../../utils/Styles'
import { BottomMargin } from '../../components/atoms/BottomMargin'
import { PLACEHOLDER } from '../../utils/Constants'
import isEmpty from 'lodash/isEmpty'
import { useTextTranslation } from '../../fooks/useTextTranslation'

import { loginOrSignUp } from '../../usecases/account/LoginSignUpCase'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import worker from '../../localization/translations/en/worker'
type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    title: string
    email?: string
    password?: string
    alreadySent: boolean
    disable: boolean
}

const WSignUpAccount = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const urlScheme = useSelector((state: StoreType) => state.nav.urlScheme)

    const initialState: InitialStateType = {
        title: `${t('worker:CreateWorkerAccount')}`,
        alreadySent: false,
        disable: true,
    }
    const [{ title, email, password, alreadySent, disable }, setState] = useState(initialState)

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

    const _signUp = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            const result = await loginOrSignUp({ email, password, dispatch, myCompanyId: urlScheme?.queryParams.companyId as string, workerId: urlScheme?.queryParams.workerId as string })
            dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: 'SIGN_UP_ERROR',
                }
            }
            if (result.success == 'no-worker') {
                navigation.push('CreateWorker', {})
                return
            } else if (result.success == 'no-company') {
                dispatch(
                    setToastMessage({
                        text: `${t('worker:companyNotExist')}`,
                        type: 'error',
                    } as ToastMessage),
                )
                return
            } else if (result.success == 'worker-side-login') {
                dispatch(
                    setToastMessage({
                        text: `${t('worker:Accountalreadyexists')}`,
                        type: 'info',
                    } as ToastMessage),
                )
                navigation.push('WorkerHome', {})
                return
            } else {
                navigation.push('CreateWorker', {})
            }
        } catch (error) {
            dispatch(setLoading(false))
            const _error = error as CustomResponse
            setState((prev) => ({
                ...prev,
                title: `${t('worker:CreateWorkerAccount')}`,
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
                color={GreenColor}
                style={{ marginTop: 30 }}
                validation={'email'}
                required={true}
                title={t('worker:EmailAddress')}
                placeholder={PLACEHOLDER.EMAIL}
                value={email}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, email: value }))
                }}
            />
            <InputTextBox
                color={GreenColor}
                style={{ marginTop: 30 }}
                validation={'password'}
                required={true}
                title={t('worker:Computerpassword')}
                placeholder={PLACEHOLDER.PASSWORD}
                value={password}
                infoText={'＊８字以上。'}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, password: value }))
                }}
            />
            <AppButton
                color={GreenColor}
                style={{
                    marginTop: 40,
                    marginHorizontal: 20,
                }}
                disabled={disable}
                title={title}
                onPress={() => {
                    _signUp()
                }}
            />
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default WSignUpAccount

const styles = StyleSheet.create({})
