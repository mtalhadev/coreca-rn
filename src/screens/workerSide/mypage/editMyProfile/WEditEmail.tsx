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
import { editWorkerEmail } from '../../../../usecases/worker/MyWorkerCase'
import { getUpdateNumber } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import isEmpty from 'lodash/isEmpty'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { useIsFocused } from '@react-navigation/native'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { StoreType } from '../../../../stores/Store'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
type NavProps = StackNavigationProp<RootStackParamList, 'WEditEmail'>
type RouteProps = RouteProp<RootStackParamList, 'WEditEmail'>

type InitialStateType = {
    id?: string
    email?: string
    disable: boolean
}

const initialState: InitialStateType = {
    disable: true,
}

const WEditEmail = () => {
    const { t, i18n } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ email, id, disable }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)

    useEffect(() => {
        setState((prev) => ({ ...prev, email: route?.params?.email, id: route?.params?.workerId }))
    }, [route])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (isEmpty(email)) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [email])

    const _write = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            const result = await editWorkerEmail({
                workerId: id,
                email,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            dispatch(
                setToastMessage({
                    text: `${t('worker:emailhasbeenChanged')}`,
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
                title={t('worker:EmailAddress')}
                placeholder={PLACEHOLDER.EMAIL}
                validation={'email'}
                required={true}
                value={email}
                color={GreenColor}
                style={{
                    marginVertical: 40,
                }}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, email: value }))
                }}
            />
            <View
                style={{
                    marginHorizontal: 20,
                }}>
                <AppButton
                    color={GreenColor}
                    title={t('worker:Sendconfirmationemail')}
                    height={50}
                    disabled={disable}
                    onPress={() => {
                        _write()
                    }}
                />
            </View>
        </View>
    )
}
export default WEditEmail

const styles = StyleSheet.create({})
