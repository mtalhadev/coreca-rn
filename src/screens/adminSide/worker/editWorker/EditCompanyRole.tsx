import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Alert, AppState } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { AppButton } from '../../../../components/atoms/AppButton'
import { LOCK_INTERVAL_TIME, PLACEHOLDER } from '../../../../utils/Constants'
import { editWorkerCompanyRole } from '../../../../usecases/worker/MyWorkerCase'
import isEmpty from 'lodash/isEmpty'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { getUpdateNumber } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { InputDropDownBox } from '../../../../components/organisms/inputBox/InputDropdownBox'
import { companyRoleTextList, companyRoleToText, textToCompanyRole } from '../../../../usecases/company/CommonCompanyCase'
import { StoreType } from '../../../../stores/Store'
import { getAnyWorkerWithAccount, GetMyWorkerResponse } from '../../../../usecases/worker/CommonWorkerCase'
import { CompanyRoleEnumType } from '../../../../models/worker/CompanyRoleEnumType'
import { WorkerCLType } from '../../../../models/worker/Worker'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { useIsFocused } from '@react-navigation/native'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { onUpdateWorkerUpdateSiteArrangementCache } from '../../../../usecases/worker/CommonWorkerCase'
import { WorkerType } from '../../../../models/worker/Worker'

type NavProps = StackNavigationProp<RootStackParamList, 'EditCompanyRole'>
type RouteProps = RouteProp<RootStackParamList, 'EditCompanyRole'>

type InitialStateType = {
    workerId?: string
    myWorker?: WorkerCLType
    worker?: WorkerCLType
    companyRole?: CompanyRoleEnumType
    companyRoleList?: string[]
    disable: boolean
    update: number
}

const initialState: InitialStateType = {
    disable: false,
    update: 0,
}
const EditCompanyRole = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const [{ companyRole, workerId, disable, companyRoleList, myWorker, worker, update }, setState] = useState(initialState)
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId)

    useEffect(() => {
        setState((prev) => ({ ...prev, companyRole: route?.params?.companyRole, workerId: route?.params?.workerId }))
    }, [route])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(signInUser?.workerId)) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const workerResult: CustomResponse<GetMyWorkerResponse> = await getAnyWorkerWithAccount({
                    workerId: signInUser?.workerId,
                })
                if (workerResult.error) {
                    throw {
                        error: workerResult.error,
                    }
                }
                const _worker = workerResult.success?.worker
                setState((prev) => ({ ...prev, myWorker: _worker }))
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                if (isFocused) {
                    dispatch(setLoading(false))
                    dispatch(setIsNavUpdating(false))
                }
            }
        })()
    }, [signInUser, update])

    useEffect(() => {
        ;(async () => {
            if (isEmpty(workerId)) {
                return
            }
            dispatch(setLoading('unTouchable'))
            const workerResult: CustomResponse<GetMyWorkerResponse> = await getAnyWorkerWithAccount({
                workerId: workerId,
            })
            if (isFocused) dispatch(setLoading(false))
            if (workerResult.error) {
                dispatch(
                    setToastMessage({
                        text: workerResult.error,
                        type: 'error',
                    } as ToastMessage),
                )
                return
            }
            const _worker = workerResult.success?.worker
            setState((prev) => ({ ...prev, worker: _worker }))
        })()
    }, [workerId, update])

    useEffect(() => {
        if (isEmpty(companyRole)) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [companyRole])

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
                companyRole,
            } as WorkerType
            if (newWorker && myCompanyId && accountId) {
                onUpdateWorkerUpdateSiteArrangementCache({
                    newWorker: newWorker,
                    myCompanyId: myCompanyId,
                    accountId: accountId,
                })
            }
            const result = await editWorkerCompanyRole({
                workerId,
                companyRole,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            dispatch(setLocalUpdateScreens([...localUpdateScreens, { screenName: 'MyCompanyWorkerList' }]))
            await updateLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: workerId ?? 'no-id',
                modelType: 'worker',
                unlock: true,
            })
            // dispatch(
            //     setToastMessage({
            //         text: t('admin:CompanyAuthorityChanged'),
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

    useEffect(() => {
        // 自分：代表者、相手：自分 => 変更できない。
        // 自分：代表者、相手：管理者以下 => すべて。
        // 自分：管理者、相手：自分 => 変更できない。
        // 自分：管理者、相手：管理者以下 => 代表者以外。
        // 自分：管理者、相手：代表者 => 変更できない。
        // 自分：一般作業員以下、相手：すべて => 変更できない。
        if (myWorker == undefined || worker == undefined) {
            return
        }
        if (myWorker?.companyId != myCompanyId) {
            return
        }
        if (myWorker?.companyRole == 'owner') {
            if (worker?.workerId == myWorker?.workerId) {
                setState((prev) => ({ ...prev, companyRoleList: companyRoleTextList.filter((role) => role == '代表者') }))
            } else {
                if (worker?.account == undefined) {
                    setState((prev) => ({ ...prev, companyRoleList: companyRoleTextList.filter((role) => role != '代表者') }))
                } else {
                    setState((prev) => ({ ...prev, companyRoleList: companyRoleTextList }))
                }
            }
        } else if (myWorker?.companyRole == 'manager') {
            if (worker?.workerId == myWorker?.workerId) {
                setState((prev) => ({ ...prev, companyRoleList: companyRoleTextList.filter((role) => role == '管理者') }))
            } else {
                if (worker.companyRole == 'owner') {
                    setState((prev) => ({ ...prev, companyRoleList: companyRoleTextList.filter((role) => role == '代表者') }))
                } else {
                    setState((prev) => ({ ...prev, companyRoleList: companyRoleTextList.filter((role) => role != '代表者') }))
                }
            }
        }
    }, [myWorker, worker])

    return (
        <View>
            <InputDropDownBox
                title={t('admin:Authority')}
                required={true}
                placeholder={PLACEHOLDER.ROLE}
                selectableItems={companyRoleList}
                selectNum={1}
                value={(companyRole ? [companyRoleToText(companyRole)] : []) as string[]}
                style={{
                    marginVertical: 40,
                }}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, companyRole: value ? textToCompanyRole(value[0]) : undefined }))
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
                        if (route?.params?.companyRole == companyRole) {
                            navigation.goBack()
                            return
                        }
                        if (companyRole == 'owner') {
                            Alert.alert(t('admin:WantToTransferTheRepresentativeToThisWorker'), t('common:OperationCannotBeUndone'), [
                                { text: t('admin:Transfer'), onPress: () => _write() },
                                {
                                    text: t('common:Cancel'),
                                    style: 'cancel',
                                },
                            ])
                        } else {
                            _write()
                        }
                    }}
                />
            </View>
        </View>
    )
}
export default EditCompanyRole

const styles = StyleSheet.create({})
