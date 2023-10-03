import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { StyleSheet } from 'react-native'
import { useNavigation, useIsFocused } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import { useTextTranslation } from '../../fooks/useTextTranslation'
import { useSafeLoadingUnmount } from '../../fooks/useUnmount'
import { DepartmentType } from '../../models/department/DepartmentType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { ID } from '../../models/_others/ID'
import { _getFirestore } from '../../services/firebase/FirestoreService'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../stores/NavigationSlice'
import { StoreType } from '../../stores/Store'
import { setToastMessage, ToastMessage, setLoading } from '../../stores/UtilSlice'
import { getAnyWorker } from '../../usecases/worker/CommonWorkerCase'
import { RootStackParamList } from '../Router'
import { AppButton } from '../../components/atoms/AppButton'
import DepartmentList from '../../components/template/DepartmentList'
import { changeActiveDepartments } from '../../usecases/department/DepartmentCase'
import { setActiveDepartments } from '../../stores/AccountSlice'
import { DepartmentManageType } from '../../models/department/DepartmentManageType'

type NavProps = StackNavigationProp<RootStackParamList, 'SelectDepartment'>

type InitialStateType = {
    workerId?: ID
    workerDepartments?: DepartmentType[]
    selectableCompanyDepartments?: DepartmentType[]
    update: number
}

const initialState: InitialStateType = {
    update: 0,
}
const SelectDepartment = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const dispatch = useDispatch()

    const [{ workerDepartments, selectableCompanyDepartments, update }, setState] = useState(initialState)
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const myCompanyId = useSelector((state: StoreType) => state?.account.belongCompanyId)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const activeDepartments = useSelector((state: StoreType) => state?.account?.activeDepartments)

    useEffect(() => {
        ;(async () => {
            try {
                if (workerDepartments == undefined) {
                    //取得してundefinedだったら[]が入るので、undefinedは初回ロードだけ
                    return
                }
                if (workerDepartments?.length == 0) {
                    /**
                     * 編集作業員が全部署の場合の対応
                     */
                    const db = _getFirestore()
                    db.collection('DepartmentManage')
                        .where('companyId', '==', myCompanyId)
                        .onSnapshot(async (data) => {
                            const _departmentList = data.docs.map((doc) => doc.data())[0] as DepartmentManageType | undefined
                            setState((prev) => ({
                                ...prev,
                                selectableCompanyDepartments: _departmentList?.departments?.filter((department) => department?.isDefault != true),
                            }))
                        })
                } else {
                    /**
                     * 編集作業員に部署が割り当てられている場合
                     */
                    setState((prev) => ({
                        ...prev,
                        selectableCompanyDepartments: workerDepartments?.filter((department) => department?.isDefault != true),
                    }))
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
    }, [workerDepartments])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        ;(async () => {
            try {
                if (myWorkerId == undefined) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const workerResult = await getAnyWorker({ workerId: myWorkerId })
                if (workerResult.error) {
                    throw {
                        error: workerResult.error,
                        errorCode: workerResult.errorCode,
                    }
                }
                setState((prev) => ({
                    ...prev,
                    workerDepartments: workerResult.success?.worker?.departments?.items ?? [],
                }))
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
        })()
    }, [update])

    const _change = async (department: DepartmentType) => {
        try {
            dispatch(setLoading(true))
            const result = await changeActiveDepartments({
                workerId: myWorkerId,
                departments: [department],
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            dispatch(setActiveDepartments([department]))
            dispatch(
                setToastMessage({
                    text: t('common:SwitchedDepartments'),
                    type: 'success',
                } as ToastMessage),
            )
            dispatch(setLoading(false))
            navigation.goBack()
        } catch (error) {
            dispatch(setLoading(false))
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }
    const onRefresh = () => {
        dispatch(setIsNavUpdating(true))
    }

    return (
        <DepartmentList
            departments={selectableCompanyDepartments}
            activeDepartments={activeDepartments}
            onRefresh={onRefresh}
            onPressDepartment={(department) => _change(department)}
            footer={() => {
                return (
                    <>
                        <AppButton
                            style={{
                                marginTop: 10,
                                marginHorizontal: 20,
                            }}
                            title={t('admin:AddManageDepartments')}
                            onPress={() => navigation.push('DepartmentManage', {})}
                            isGray={true}
                        />
                        <AppButton
                            style={{
                                marginTop: 20,
                                marginHorizontal: 20,
                            }}
                            title={t('common:SwitchAccount')}
                            onPress={() => navigation.push('SelectAccount', {})}
                            isGray={true}
                        />
                    </>
                )
            }}
        />
    )
}
export default SelectDepartment

const styles = StyleSheet.create({})
