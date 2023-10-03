import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, AppState } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { AppButton } from '../../../../components/atoms/AppButton'
import { InputTextBox } from '../../../../components/organisms/inputBox/InputTextBox'
import { GreenColor } from '../../../../utils/Styles'
import { LOCK_INTERVAL_TIME, PLACEHOLDER } from '../../../../utils/Constants'
import { editWorkerPhoneNumber } from '../../../../usecases/worker/MyWorkerCase'
import isEmpty from 'lodash/isEmpty'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { getUpdateNumber } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { StoreType } from '../../../../stores/Store'
import { useIsFocused } from '@react-navigation/native'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
type NavProps = StackNavigationProp<RootStackParamList, 'WEditPhoneNumber'>
type RouteProps = RouteProp<RootStackParamList, 'WEditPhoneNumber'>

type InitialStateType = {
    id?: string
    phoneNumber?: string
    disable: boolean
}

const initialState: InitialStateType = {
    disable: false,
}
const WEditPhoneNumber = () => {
    const { t, i18n } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const [appState, setAppState] = useState(AppState.currentState)
    const [{ phoneNumber, id, disable }, setState] = useState(initialState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)

    useEffect(() => {
        setState((prev) => ({ ...prev, phoneNumber: route?.params?.phoneNumber, id: route?.params?.workerId }))
    }, [route])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (isEmpty(phoneNumber)) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [phoneNumber])

    useEffect(() => {
        if (id && appState == 'active' && isFocused) {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: id ?? 'no-id',
                        targetId: id ?? 'no-id',
                        modelType: 'worker',
                    })
                    if (lockResult.error) {
                        throw {
                            error: lockResult.error,
                        }
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
            const keepLock = setInterval(
                (function _update() {
                    updateLockOfTarget({
                        myWorkerId: id ?? 'no-id',
                        targetId: id ?? 'no-id',
                        modelType: 'worker',
                    })
                    return _update
                })(),
                LOCK_INTERVAL_TIME,
            )
            return () => {
                clearInterval(keepLock)
                updateLockOfTarget({
                    myWorkerId: id ?? 'no-id',
                    targetId: id ?? 'no-id',
                    modelType: 'worker',
                    unlock: true,
                })
            }
        }
    }, [id, appState, isFocused])

    // AppState.addEventListenerでAppStateが変更された時に発火する
    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    const _write = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: id ?? 'no-id',
                targetId: id ?? 'no-id',
                modelType: 'worker',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }
            const result = await editWorkerPhoneNumber({
                workerId: id,
                phoneNumber,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            dispatch(
                setToastMessage({
                    text: `${t('worker:Phonenumberchanged')}`,
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
                title={t('worker:Phonenumber')}
                color={GreenColor}
                placeholder={PLACEHOLDER.MOBILE_PHONE}
                validation={'phone'}
                required={true}
                value={phoneNumber}
                style={{
                    marginVertical: 40,
                }}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, phoneNumber: value }))
                }}
            />
            <View
                style={{
                    marginHorizontal: 20,
                }}>
                <AppButton
                    color={GreenColor}
                    disabled={disable}
                    title={t('worker:Save')}
                    height={50}
                    onPress={() => {
                        _write()
                    }}
                />
            </View>
        </View>
    )
}
export default WEditPhoneNumber

const styles = StyleSheet.create({})
