import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, AppState } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { AppButton } from '../../../../components/atoms/AppButton'
import { InputDropDownBox } from '../../../../components/organisms/inputBox/InputDropdownBox'
import { WeekOfDay, _weekDayList } from '../../../../utils/ext/Date.extensions'
import { LOCK_INTERVAL_TIME, PLACEHOLDER } from '../../../../utils/Constants'
import { editWorkerOffDaysOfWeek } from '../../../../usecases/worker/MyWorkerCase'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { getUpdateNumber } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { StoreType } from '../../../../stores/Store'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { useIsFocused } from '@react-navigation/native'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { onUpdateWorkerUpdateSiteArrangementCache } from '../../../../usecases/worker/CommonWorkerCase'
import { WorkerType } from '../../../../models/worker/Worker'

type NavProps = StackNavigationProp<RootStackParamList, 'EditOffDaysOfWeek'>
type RouteProps = RouteProp<RootStackParamList, 'EditOffDaysOfWeek'>

type InitialStateType = {
    id?: string
    offDaysOfWeek?: WeekOfDay[]
    disable: boolean
}

const initialState: InitialStateType = {
    disable: false,
}
const EditOffDaysOfWeek = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()

    const [{ offDaysOfWeek, id, disable }, setState] = useState(initialState)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId)

    useEffect(() => {
        setState((prev) => ({ ...prev, offDaysOfWeek: route?.params?.offDaysOfWeek, id: route?.params?.workerId }))
    }, [route])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (offDaysOfWeek == undefined) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [offDaysOfWeek])

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
                offDaysOfWeek: offDaysOfWeek,
            } as WorkerType
            if (newWorker && myCompanyId && accountId) {
                onUpdateWorkerUpdateSiteArrangementCache({
                    newWorker: newWorker,
                    myCompanyId: myCompanyId, 
                    accountId: accountId,
                })
            }
            const result = await editWorkerOffDaysOfWeek({
                workerId: id,
                offDaysOfWeek: offDaysOfWeek,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            dispatch(
                setToastMessage({
                    text: t('admin:HolidaysChanged'),
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
            <InputDropDownBox
                title={t('common:Holiday')}
                placeholder={PLACEHOLDER.HOLIDAYS}
                selectableItems={_weekDayList}
                selectNum={'any'}
                infoText={t('admin:EnterTheDaysOffFromFieldWork')}
                value={offDaysOfWeek as string[]}
                style={{
                    marginVertical: 40,
                }}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, offDaysOfWeek: value }))
                }}
            />
            <View
                style={{
                    marginHorizontal: 20,
                }}>
                <AppButton
                    disabled={disable}
                    title={t('common:Save')}
                    height={50}
                    onPress={() => {
                        _write()
                    }}
                />
            </View>
        </View>
    )
}
export default EditOffDaysOfWeek

const styles = StyleSheet.create({})
