import React, { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, AppState, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'

import { useIsFocused } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { AppButton } from '../../../components/atoms/AppButton'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { InputTextBox } from '../../../components/organisms/inputBox/InputTextBox'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { StoreType } from '../../../stores/Store'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { checkLockOfTarget, updateLockOfTarget } from '../../../usecases/lock/CommonLockCase'
import { LOCK_INTERVAL_TIME, THEME_COLORS, PLACEHOLDER } from '../../../utils/Constants'
import { getUuidv4, SwitchEditOrCreateProps } from '../../../utils/Utils'
import { RootStackParamList } from '../../Router'
import { changeActiveDepartments, deleteDepartment, getDepartmentListOfTargetCompany, getTargetDepartment, writeDepartment } from '../../../usecases/department/DepartmentCase'
import { setActiveDepartments } from '../../../stores/AccountSlice'
import { addWorkerDepartments } from '../../../usecases/worker/MyWorkerCase'
import DisplayIdInDev from '../../../components/atoms/DisplayIdInDEV'
import { DepartmentType } from '../../../models/department/DepartmentType'
import { genKeyName, getCachedData, updateCachedData } from '../../../usecases/CachedDataCase'

type NavProps = StackNavigationProp<RootStackParamList, 'EditDepartment'>
type RouteProps = RouteProp<RootStackParamList, 'EditDepartment'>

type InitialStateType = {
    departmentName?: string
    departments?: DepartmentType[]
    disable?: boolean
    update: number
}

const initialState: InitialStateType = {
    disable: true,
    update: 0,
}

const EditDepartment = (props: Partial<SwitchEditOrCreateProps>) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const mode = props.mode ?? 'edit'
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const activeDepartments = useSelector((state: StoreType) => state.account?.activeDepartments)
    const isDefaultDepartment = useMemo(() => activeDepartments?.map((dep) => dep?.isDefault)[0], [activeDepartments])
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')

    const departmentId = useMemo(() => route.params?.departmentId ?? getUuidv4(), [route.params?.departmentId])
    const companyId = route.params?.companyId ?? myCompanyId
    const departmentNum = route.params?.departmentNum

    const [{ departmentName, update, disable, departments }, setState] = useState(initialState)
    const dispatch = useDispatch()

    const __cachedKey = genKeyName({
        screenName: 'DepartmentManage',
        accountId: accountId,
    })

    useEffect(() => {
        return () => setState(initialState)
    }, [companyId])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        ;(async () => {
            try {
                if (departmentId == undefined || mode == 'new' || isFocused != true) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const departmentResult = await getTargetDepartment({
                    departmentId: departmentId,
                })

                if (departmentResult.error) {
                    throw {
                        error: departmentResult.error,
                        errorCode: departmentResult.errorCode,
                    }
                }
                const cachedResult = await getCachedData<DepartmentType[]>(__cachedKey)
                console.log('departments: ', cachedResult.success);
                
                setState((prev) => ({ ...prev, departmentName: departmentResult.success?.departmentName, departments: cachedResult.success || [] }))
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
    }, [departmentId, update])

    useEffect(() => {
        navigation.setOptions({
            title: mode == 'new' ? t('admin:CreateADepartment') : t('admin:EditDepartment'),
        })
    }, [navigation])

    useEffect(() => {
        return () => {
            setState({ ...initialState })
        }
    }, [])

    useEffect(() => {
        if (departmentId && myWorkerId && appState == 'active' && isFocused) {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: myWorkerId ?? 'no-id',
                        targetId: departmentId ?? 'no-id',
                        modelType: 'department',
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
                        targetId: departmentId ?? 'no-id',
                        modelType: 'department',
                    })
                    return _update
                })(),
                LOCK_INTERVAL_TIME,
            )
            return () => {
                clearInterval(keepLock)
                updateLockOfTarget({
                    myWorkerId: myWorkerId ?? 'no-id',
                    targetId: departmentId ?? 'no-id',
                    modelType: 'department',
                    unlock: true,
                })
            }
        }
    }, [departmentId, myWorkerId, appState, isFocused])

    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    useEffect(() => {
        if (departmentName == undefined) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [departmentName])

    const checkUniqDepartment = async (departmentId?: string) => {
        try {
            if (departmentId == undefined) {
                throw {
                    error: t('common:NotEnoughInformation'),
                    errorCode: 'CHECK_UNIQ_ID_ERROR',
                }
            }
            const result = await getDepartmentListOfTargetCompany({
                companyId: companyId,
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            const departments = result.success?.filter((data) => data.departmentId != departmentId && data.departmentName == departmentName) ?? []
            if (departments?.length > 0) {
                Alert.alert(t('admin:ADepartmentWithTheSameNameExists'), undefined, [
                    { text: mode == 'edit' ? t('common:Save') : t('common:Create'), onPress: () => _writeDepartment(departmentId) },
                    {
                        text: t('admin:Cancel'),
                        style: 'cancel',
                    },
                ])
            } else {
                _writeDepartment(departmentId)
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
    }

    const _writeDepartment = async (departmentId?: string) => {
        try {
            if (departmentId == undefined) {
                throw {
                    error: t('common:NotEnoughInformation'),
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: departmentId ?? 'no-id',
                modelType: 'site',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }
            const result = await writeDepartment({
                departmentId,
                departmentName,
                companyId,
                activeDepartments,
                dispatch,
                myWorkerId,
            })
            //作成者にその部署を付与する
            if (mode == 'new' && !isDefaultDepartment) {
                const addResult = await addWorkerDepartments({
                    departmentIds: [departmentId ?? 'no-id'],
                    workerId: myWorkerId ?? 'no-id',
                })
                if (addResult.error) {
                    throw {
                        error: addResult.error,
                        errorCode: addResult.errorCode,
                    }
                }
            }
            dispatch(setLocalUpdateScreens([...localUpdateScreens, { screenName: 'MyCompanyWorkerList' }]))
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            } else {
                navigation.goBack()
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
    }

    const onDelete = async () => {
        const cachedResult = await updateCachedData({ key: __cachedKey, value: departments?.filter((dep) => (dep?.isDefault != true && dep?.departmentId != departmentId)) ?? [] })
        if (cachedResult.error) {
            const _error = cachedResult as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                }),
            )
        }
        const _activeDepartments = activeDepartments?.filter((dep) => dep.departmentId != departmentId)
        dispatch(setActiveDepartments(_activeDepartments))
        navigation.goBack();
        try {
            const result = await deleteDepartment(departmentId)
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            const result2 = await changeActiveDepartments({
                workerId: myWorkerId,
                departments: _activeDepartments,
            })
            if (result2.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
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
    }

    return (
        <KeyboardAwareScrollView style={{ backgroundColor: '#fff' }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
            <View style={{ backgroundColor: THEME_COLORS.OTHERS.BACKGROUND }}>
                <InputTextBox
                    style={{ marginTop: 30 }}
                    validation={'none'}
                    required={true}
                    title={t('common:DepartmentName')}
                    placeholder={PLACEHOLDER.DEPARTMENT}
                    value={departmentName ?? (departmentNum ? t('common:ConstructionDepartment') + (isDefaultDepartment ? '1' : `${departmentNum}`) : '')}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, departmentName: value }))
                    }}
                />
            </View>
            <AppButton
                disabled={disable}
                style={{ marginTop: 30, marginLeft: 10, marginRight: 10 }}
                title={mode == 'edit' ? t('common:Save') : t('common:Create')}
                onPress={() => checkUniqDepartment(departmentId)}
            />
            {mode == 'edit' && (
                <AppButton
                    style={{ marginTop: 30, marginLeft: 10, marginRight: 10 }}
                    title={t('common:Delete')}
                    onPress={() =>
                        Alert.alert(t('admin:RemoveTheDepartment'), t('admin:OperationCannotBeUndone'), [
                            { text: t('admin:Deletion'), onPress: () => onDelete() },
                            {
                                text: t('admin:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }
                />
            )}
            <DisplayIdInDev id={departmentId} label="departmentId" />
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default EditDepartment

const styles = StyleSheet.create({})
