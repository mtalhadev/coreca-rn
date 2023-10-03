import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Pressable, ScrollView, Platform } from 'react-native'
import { InputTextBox } from '../../components/organisms/inputBox/InputTextBox'
import { AppButton } from '../../components/atoms/AppButton'
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/core'
import { RootStackParamList } from '../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import {} from '../../stores/AccountSlice'
import { _forgetPassword } from '../../services/account/AccountService'
import { setLoading, setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { BottomMargin } from '../../components/atoms/BottomMargin'
import { PLACEHOLDER } from '../../utils/Constants'
import isEmpty from 'lodash/isEmpty'
import { resetPassword } from '../../usecases/account/CommonAuthCase'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import { useTextTranslation } from './../../fooks/useTextTranslation'
import { useSafeLoadingUnmount } from '../../fooks/useUnmount'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    title: string
    email?: string
    disable: boolean
}

const initialState: InitialStateType = {
    title: '再設定メールを送信する',
    disable: true,
}

const ResetPassword = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const isFocused = useIsFocused()
    const [{ title, email, disable }, setState] = useState(initialState)
    const dispatch = useDispatch()

    useEffect(() => {
        if (isEmpty(email)) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [email])

    useEffect(() => {
        return () => {
            setState({ ...initialState })
        }
    }, [])

    useSafeLoadingUnmount(dispatch, isFocused)

    const _resetPassword = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            setState((prev) => ({ ...prev, title: t('common:Busy'), disable: true }))
            const result = await resetPassword(email)
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            dispatch(
                setToastMessage({
                    text: t('common:ResetEmailSent'),
                    type: 'success',
                } as ToastMessage),
            )
            setState((prev) => ({
                ...prev,
                title: t('common:SendReconfigurationEmail'),
                disable: false,
            }))
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
            <AppButton
                style={{
                    marginTop: 40,
                    marginHorizontal: 20,
                }}
                disabled={disable}
                title={title}
                onPress={async () => {
                    _resetPassword()
                }}
            />
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default ResetPassword

const styles = StyleSheet.create({})
