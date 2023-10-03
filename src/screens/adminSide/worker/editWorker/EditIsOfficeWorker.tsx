import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, AppState } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { AppButton } from '../../../../components/atoms/AppButton'
import { LOCK_INTERVAL_TIME, PLACEHOLDER } from '../../../../utils/Constants'
import { editIsOfficeWorker } from '../../../../usecases/worker/MyWorkerCase'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { InputDropDownBox } from '../../../../components/organisms/inputBox/InputDropdownBox'
import { StoreType } from '../../../../stores/Store'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { useIsFocused } from '@react-navigation/native'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { onUpdateWorkerUpdateSiteArrangementCache } from '../../../../usecases/worker/CommonWorkerCase'
import { WorkerType } from '../../../../models/worker/Worker'

type NavProps = StackNavigationProp<RootStackParamList, 'EditIsOfficeWorker'>
type RouteProps = RouteProp<RootStackParamList, 'EditIsOfficeWorker'>

type InitialStateType = {
    workerId?: string
    isOfficeWorker?: boolean
    isOfficeWorkerList?: string[]
    disable: boolean
    update: number
}

const EditIsOfficeWorker = () => {
    const { t } = useTextTranslation()
    const initialState: InitialStateType = {
        disable: true,
        isOfficeWorkerList: [t('common:Yes'), t('common:No')],
        update: 0,
    }

    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const [{ isOfficeWorker, workerId, disable, isOfficeWorkerList, update }, setState] = useState(initialState)
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId)

    useEffect(() => {
        setState((prev) => ({ ...prev, isOfficeWorker: route?.params?.isOfficeWorker, workerId: route?.params?.workerId }))
    }, [route])

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (isOfficeWorker == undefined) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [isOfficeWorker])

    useEffect(() => {
        if (isFocused && signInUser?.workerId && workerId && appState == 'active') {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: signInUser?.workerId ?? 'no-id',
                        targetId: workerId ?? 'no-id',
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
                        myWorkerId: signInUser?.workerId ?? 'no-id',
                        targetId: workerId ?? 'no-id',
                        modelType: 'worker',
                    })
                    return _update
                })(),
                LOCK_INTERVAL_TIME,
            )
            return () => {
                clearInterval(keepLock)
                updateLockOfTarget({
                    myWorkerId: signInUser?.workerId ?? 'no-id',
                    targetId: workerId ?? 'no-id',
                    modelType: 'worker',
                    unlock: true,
                })
            }
        }
    }, [workerId, signInUser?.workerId, appState, isFocused])

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
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: workerId ?? 'no-id',
                modelType: 'worker',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }
            const newWorker = {
                workerId: workerId,
                isOfficeWorker: isOfficeWorker,
            } as WorkerType
            if (newWorker && myCompanyId && accountId) {
                onUpdateWorkerUpdateSiteArrangementCache({
                    newWorker: newWorker,
                    myCompanyId: myCompanyId,
                    accountId: accountId,
                })
            }
            const result = await editIsOfficeWorker({
                workerId,
                isOfficeWorker,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            await updateLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: workerId ?? 'no-id',
                modelType: 'worker',
                unlock: true,
            })
            // dispatch(
            //     setToastMessage({
            //         text: t('admin:AreYouAConstructionWorkerChanged'),
            //         type: 'success',
            //     } as ToastMessage),
            // )
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
                title={t('admin:AreYouAConstructionWorker')}
                required={true}
                placeholder={PLACEHOLDER.OFFICE}
                selectableItems={isOfficeWorkerList}
                infoText={'＊現場への手配が可能かどうか。'}
                selectNum={1}
                value={isOfficeWorker !== false ? [t('common:No')] : [t('common:Yes')]}
                style={{
                    marginVertical: 40,
                }}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, isOfficeWorker: value?.includes(t('common:Yes')) ? false : true }))
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
export default EditIsOfficeWorker

const styles = StyleSheet.create({})
