import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { View, StyleSheet, AppState, Text, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { AppButton } from '../../../../components/atoms/AppButton'
import { CustomDate } from '../../../../models/_others/CustomDate'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { editLeftDate } from '../../../../usecases/worker/MyWorkerCase'
import { InputDateTimeBox } from '../../../../components/organisms/inputBox/InputDateTimeBox'
import isEmpty from 'lodash/isEmpty'
import { StoreType } from '../../../../stores/Store'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { useIsFocused } from '@react-navigation/native'
import { LOCK_INTERVAL_TIME, THEME_COLORS } from '../../../../utils/Constants'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { onUpdateWorkerUpdateSiteArrangementCache } from '../../../../usecases/worker/CommonWorkerCase'
import { WorkerType } from '../../../../models/worker/Worker'

type NavProps = StackNavigationProp<RootStackParamList, 'EditLeftDate'>
type RouteProps = RouteProp<RootStackParamList, 'EditLeftDate'>

type InitialStateType = {
    id?: string
    leftDate?: CustomDate
    disable: boolean
}

const initialState: InitialStateType = {
    disable: false,
}
const EditLeftDate = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()

    const [{ leftDate, id, disable }, setState] = useState(initialState)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)

    useEffect(() => {
        setState((prev) => ({ ...prev, leftDate: route?.params?.leftDate, id: route?.params?.workerId }))
    }, [route])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (isEmpty(leftDate)) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [leftDate])

    useEffect(() => {
        if (id && myWorkerId && appState == 'active' && isFocused) {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: myWorkerId ?? 'no-id',
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
                        myWorkerId: myWorkerId ?? 'no-id',
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
                    myWorkerId: myWorkerId ?? 'no-id',
                    targetId: id ?? 'no-id',
                    modelType: 'worker',
                    unlock: true,
                })
            }
        }
    }, [id, myWorkerId, appState, isFocused])

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
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: id ?? 'no-id',
                modelType: 'worker',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }
            const newWorker = {
                workerId: id,
                leftDate: leftDate?.totalSeconds,
            } as WorkerType
            if (newWorker && myCompanyId && accountId) {
                onUpdateWorkerUpdateSiteArrangementCache({
                    newWorker: newWorker,
                    myCompanyId: myCompanyId, 
                    accountId: accountId,
                })
            }
            const result = await editLeftDate({
                workerId: id,
                leftDate: leftDate,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            dispatch(setLocalUpdateScreens([...localUpdateScreens, { screenName: 'MyCompanyWorkerList' }]))
            dispatch(
                setToastMessage({
                    text: t('admin:DateOfWithdrawalChanged'),
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
            <InputDateTimeBox
                required={true}
                title={t('admin:DateOfWithdrawal')}
                value={leftDate}
                initDateInput={leftDate}
                dateInputMode={'datetime'}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, leftDate: value }))
                }}
                style={{
                    marginTop: 40,
                }}
            />
            <View
                style={{
                    margin: 5,
                    marginBottom: 20,
                    marginLeft: 20,
                }}>
                <Text
                    style={{
                        fontSize: 11,
                        color: THEME_COLORS.OTHERS.GRAY,
                    }}>
                    退会日時以降はログインできなくなります。
                </Text>
            </View>
            <View
                style={{
                    marginHorizontal: 20,
                }}>
                <AppButton
                    disabled={disable}
                    title={t('common:Save')}
                    height={50}
                    onPress={() => {
                        Alert.alert(t('admin:DoYouWantToSaveLeftDate'), t('admin:SavingLeftDateDescription'), [
                            { text: t('common:Save'), onPress: () => _write() },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
            </View>
        </View>
    )
}
export default EditLeftDate

const styles = StyleSheet.create({})
