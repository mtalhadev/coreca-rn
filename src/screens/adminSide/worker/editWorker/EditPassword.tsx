import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { AppButton } from '../../../../components/atoms/AppButton'
import { InputTextBox } from '../../../../components/organisms/inputBox/InputTextBox'
import { GreenColor } from '../../../../utils/Styles'
import { PLACEHOLDER } from '../../../../utils/Constants'
import { editWorkerPassword } from '../../../../usecases/worker/MyWorkerCase'
import isEmpty from 'lodash/isEmpty'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { getUpdateNumber, isPassword } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { useIsFocused } from '@react-navigation/native'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { StoreType } from '../../../../stores/Store'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { onUpdateWorkerUpdateSiteArrangementCache } from '../../../../usecases/worker/CommonWorkerCase'
import { WorkerType } from '../../../../models/worker/Worker'

type NavProps = StackNavigationProp<RootStackParamList, 'EditPassword'>
type RouteProps = RouteProp<RootStackParamList, 'EditPassword'>

type InitialStateType = {
    id?: string
    prePassword?: string
    password?: string
    newPassword?: string
    newPassword2?: string
    disable: boolean
}

const initialState: InitialStateType = {
    disable: true,
}
const EditPassword = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()

    const [{ password, prePassword, newPassword, newPassword2, id, disable }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId)

    useEffect(() => {
        setState((prev) => ({ ...prev, prePassword: route?.params?.password, id: route?.params?.workerId }))
    }, [route])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (isEmpty(password) || isEmpty(newPassword) || isEmpty(newPassword2)) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [password, newPassword, newPassword2])

    const _write = async () => {
        try {
            if (password != prePassword) {
                throw {
                    error: t('common:TheCurrentPasswordIsDifferent'),
                }
            }
            if (!isPassword(newPassword ?? '')) {
                throw {
                    error: t('common:ThePasswordFormatIsDifferent'),
                }
            }
            if (newPassword != newPassword2) {
                throw {
                    error: t('common:TheConfirmationPasswordIsDifferent'),
                }
            }
            dispatch(setLoading('unTouchable'))
            const newWorker = {
                workerId: id,
                password: newPassword,
            } as WorkerType
            if (newWorker && myCompanyId && accountId) {
                onUpdateWorkerUpdateSiteArrangementCache({
                    newWorker: newWorker,
                    myCompanyId: myCompanyId, 
                    accountId: accountId,
                })
            }
            const result = await editWorkerPassword({
                workerId: id,
                password: newPassword,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            dispatch(
                setToastMessage({
                    text: t('common:PasswordChanged'),
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
        <View>
            <InputTextBox
                title={t('common:CurrentPassword')}
                placeholder={PLACEHOLDER.PASSWORD}
                validation={'password'}
                required={true}
                value={password}
                style={{
                    marginVertical: 40,
                }}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, password: value }))
                }}
            />
            <InputTextBox
                title={t('common:NewPassword')}
                placeholder={PLACEHOLDER.PASSWORD}
                infoText={t('common:EightOrMoreCharacters')}
                validation={'password'}
                required={true}
                value={newPassword}
                style={{
                    marginTop: 40,
                    marginBottom: 20,
                }}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, newPassword: value }))
                }}
            />
            <InputTextBox
                title={t('common:ConfirmNewPassword')}
                placeholder={PLACEHOLDER.PASSWORD}
                validation={'password'}
                required={true}
                value={newPassword2}
                style={{
                    marginTop: 20,
                    marginBottom: 40,
                }}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, newPassword2: value }))
                }}
            />
            <View
                style={{
                    marginHorizontal: 20,
                }}>
                <AppButton
                    disabled={disable}
                    title={t('common:Change')}
                    height={50}
                    onPress={() => {
                        _write()
                    }}
                />
            </View>
        </View>
    )
}
export default EditPassword

const styles = StyleSheet.create({})
