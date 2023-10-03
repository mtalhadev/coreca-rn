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
import isEmpty from 'lodash/isEmpty'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { editWorkerNickname } from '../../../../usecases/worker/MyWorkerCase'
import { getUpdateNumber } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { StoreType } from '../../../../stores/Store'
import { useIsFocused } from '@react-navigation/native'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
type NavProps = StackNavigationProp<RootStackParamList, 'WEditNickname'>
type RouteProps = RouteProp<RootStackParamList, 'WEditNickname'>

type InitialStateType = {
    id?: string
    nickname?: string
    disable: boolean
}

const initialState: InitialStateType = {
    disable: false,
}
const WEditNickname = () => {
    const { t, i18n } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)

    const [{ nickname, id, disable }, setState] = useState(initialState)
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()

    useEffect(() => {
        setState((prev) => ({ ...prev, nickname: route?.params?.nickname, id: route?.params?.workerId }))
    }, [route])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (isEmpty(nickname)) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [nickname])

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
            const result = await editWorkerNickname({
                workerId: id,
                nickname,
                myCompanyId,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            dispatch(
                setToastMessage({
                    text: `${t('worker:Nicknamechanged')}`,
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
                title={t('worker:YourNickname')}
                placeholder={PLACEHOLDER.PERSON_NICKNAME}
                required={true}
                value={nickname}
                color={GreenColor}
                style={{
                    marginVertical: 40,
                }}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, nickname: value }))
                }}
            />
            <View
                style={{
                    marginHorizontal: 20,
                }}>
                <AppButton
                    disabled={disable}
                    color={GreenColor}
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
export default WEditNickname

const styles = StyleSheet.create({})
