import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, AppState } from 'react-native'
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { AppButton } from '../../../../components/atoms/AppButton'
import { LOCK_INTERVAL_TIME, PLACEHOLDER } from '../../../../utils/Constants'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { editWorkerDepartments } from '../../../../usecases/worker/MyWorkerCase'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { StoreType } from '../../../../stores/Store'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { _getFirestore } from '../../../../services/firebase/FirestoreService'
import { ID } from '../../../../models/_others/ID'
import { getAnyWorker } from '../../../../usecases/worker/CommonWorkerCase'
import { DepartmentManageType } from '../../../../models/department/DepartmentManageType'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { InputObject, InputObjectDropdownBox } from '../../../../components/organisms/inputBox/InputObjectDropdownBox'
import { setActiveDepartments } from '../../../../stores/AccountSlice'
import { genKeyName, resetTargetCachedData } from '../../../../usecases/CachedDataCase'
import { onUpdateWorkerUpdateSiteArrangementCache } from '../../../../usecases/worker/CommonWorkerCase'
import { WorkerType } from '../../../../models/worker/Worker'
import { changeActiveDepartments } from '../../../../usecases/department/DepartmentCase'

type NavProps = StackNavigationProp<RootStackParamList, 'EditDepartments'>
type RouteProps = RouteProp<RootStackParamList, 'EditDepartments'>

type InitialStateType = {
    workerId?: ID
    companyDepartments?: InputObject[]
    workerDepartments?: InputObject[]
    update: number
}

const initialState: InitialStateType = {
    update: 0,
}
const EditDepartments = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()

    const [{ companyDepartments, workerDepartments, workerId, update }, setState] = useState(initialState)
    const [appState, setAppState] = useState(AppState.currentState)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)

    const unsubscribeRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)

    useEffect(() => {
        setState((prev) => ({ ...prev, workerId: route?.params?.workerId, update: update + 1 }))
    }, [route])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        isScreenOnRef.current = isFocused
        return () => {
            if (unsubscribeRef.current && isScreenOnRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
                isScreenOnRef.current = false
            }
        }
    }, [isFocused])

    useEffect(() => {
        if (workerId && myWorkerId && appState == 'active' && isFocused) {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: myWorkerId ?? 'no-id',
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
                        myWorkerId: myWorkerId ?? 'no-id',
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
                    myWorkerId: myWorkerId ?? 'no-id',
                    targetId: workerId ?? 'no-id',
                    modelType: 'worker',
                    unlock: true,
                })
            }
        }
    }, [workerId, myWorkerId, appState, isFocused])

    // AppState.addEventListenerでAppStateが変更された時に発火する
    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    useEffect(() => {
        ;(async () => {
            try {
                if (workerId == undefined) {
                    return
                }
                if (!isScreenOnRef.current) return
                if (isFocused) dispatch(setLoading(true))
                const workerResult = await getAnyWorker({ workerId })
                if (workerResult.error) {
                    throw {
                        error: workerResult.error,
                        errorCode: workerResult.errorCode,
                    }
                }
                const db = _getFirestore()
                unsubscribeRef.current = db
                    .collection('DepartmentManage')
                    .where('companyId', '==', workerResult.success?.worker?.companyId)
                    .onSnapshot(async (data) => {
                        const _departmentList = data.docs.map((doc) => doc.data())[0] as DepartmentManageType | undefined
                        const _companyDepartments = _departmentList?.departments
                            ?.filter((dep) => !dep.isDefault)
                            ?.map((dep) => {
                                return {
                                    tag: dep.departmentName,
                                    value: dep.departmentId,
                                } as InputObject
                            })
                        const _workerDepartments = workerResult.success?.worker?.departments?.items
                            ?.filter((dep) => !dep.isDefault)
                            ?.map((dep) => {
                                return {
                                    tag: dep.departmentName,
                                    value: dep.departmentId,
                                } as InputObject
                            })
                        setState((prev) => ({
                            ...prev,
                            companyDepartments: _companyDepartments,
                            workerDepartments: _workerDepartments,
                        }))
                        dispatch(setLoading(false))
                        dispatch(setIsNavUpdating(false))
                    })
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
    }, [update])

    const _write = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: workerId ?? 'no-id',
                modelType: 'worker',
            })
            if (lockResult.error) {
                throw {
                    error: lockResult.error,
                }
            }
            const _departmentIds = (workerDepartments?.map((dep) => dep?.value).filter((data) => data != undefined) as string[]) ?? []
            if (_departmentIds?.length == 0) {
                throw {
                    error: t('admin:PleaseSelectTheDepartment'),
                }
            }
            const newWorker = {
                workerId: workerId,
                departmentIds: _departmentIds,
            } as WorkerType
            if (newWorker && myCompanyId && accountId) {
                onUpdateWorkerUpdateSiteArrangementCache({
                    newWorker: newWorker,
                    myCompanyId: myCompanyId,
                    accountId: accountId,
                })
            }
            const result = await editWorkerDepartments({
                workerId: workerId,
                departmentIds: _departmentIds,
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
                    text: t('admin:EditDepartments'),
                    type: 'success',
                } as ToastMessage),
            )
            const _departmentIdsSet = new Set(_departmentIds)
            const _activeDepartments = activeDepartments?.filter((dep) => dep.departmentId && _departmentIdsSet.has(dep.departmentId))
            if (myWorkerId == workerId) {
                const result = await changeActiveDepartments({
                    workerId: myWorkerId,
                    departments: _activeDepartments,
                })
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
                dispatch(setActiveDepartments(_activeDepartments))
            }
            //以下のスクリーンはキャッシュに部署でフィルター済みのデータを保存しているため削除
            await resetTargetCachedData(
                genKeyName({
                    screenName: 'OrderList',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                }),
            )
            await resetTargetCachedData(
                genKeyName({
                    screenName: 'AdminHome',
                    accountId: accountId,
                    companyId: myCompanyId as string,
                }),
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
        } finally {
            if (isFocused) dispatch(setLoading(false))
        }
    }

    return (
        <View>
            <InputObjectDropdownBox
                title={t('common:Department')}
                placeholder={PLACEHOLDER.DEPARTMENT}
                selectableItems={companyDepartments ?? []}
                selectNum={'any'}
                value={workerDepartments}
                style={{
                    marginVertical: 40,
                }}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, workerDepartments: value }))
                }}
                minSelectNum={1}
            />
            <View
                style={{
                    marginHorizontal: 20,
                }}>
                <AppButton
                    title={t('common:Save')}
                    height={50}
                    onPress={() => {
                        _write()
                    }}
                />
                <BottomMargin />
            </View>
        </View>
    )
}
export default EditDepartments

const styles = StyleSheet.create({})
