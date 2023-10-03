import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { StyleSheet, View } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { StoreType } from '../../../stores/Store'
import { useIsFocused } from '@react-navigation/native'
import { updateCachedData, getCachedData, genKeyName } from '../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { _getFirestore } from '../../../services/firebase/FirestoreService'
import { DepartmentType } from '../../../models/department/DepartmentType'
import { DepartmentManageType } from '../../../models/department/DepartmentManageType'
import DepartmentList from '../../../components/template/DepartmentList'
import { AppButton } from '../../../components/atoms/AppButton'
type NavProps = StackNavigationProp<RootStackParamList, 'DepartmentManage'>
type RouteProps = RouteProp<RootStackParamList, 'DepartmentManage'>

export type SelectCompanyType = {
    title?: string
    onPressDepartment?: (department: DepartmentType) => void
}

type InitialStateType = {
    departments?: DepartmentType[]
    isFetching: boolean
}

type CachedDepartmentManageDetailType = DepartmentType[] | undefined

const initialState: InitialStateType = {
    isFetching: false,
}

/**
 *
 * @returns 所属会社の部署一覧
 * 追加・編集・削除はここを経由して行う
 */
const DepartmentManage = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const [{ departments, isFetching }, setState] = useState(initialState)
    const companyId = route.params?.companyId ?? myCompanyId

    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const __cachedKey = genKeyName({
        screenName: 'DepartmentManage',
        accountId: accountId,
    })

    const unsubscribeRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)

    useEffect(() => {
        isScreenOnRef.current = isFocused
        if (isFocused) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
        return () => {
            if (unsubscribeRef.current && isScreenOnRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
                isScreenOnRef.current = false
            }
        }
    }, [isFocused])

    useEffect(() => {
        return () => setState(initialState)
    }, [companyId])

    useSafeUnmount(setState, initialState)

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    useEffect(() => {
        navigation.setOptions({
            title: t('admin:AddManageDepartments'),
        })
    }, [navigation])

    useEffect(() => {
        ;(async () => {
            try {
                if (isFetching != true) {
                    return
                }
                if (!isScreenOnRef.current) return
                if (isFocused) dispatch(setLoading(true))
                const result = await getCachedData<DepartmentType[]>(__cachedKey)
                if (result.success) {
                    setState((prev) => ({
                        ...prev,
                        departments: result.success,
                        isFetching: false,
                    }))
                }
                const db = _getFirestore()
                unsubscribeRef.current = db
                    .collection('DepartmentManage')
                    .where('companyId', '==', companyId)
                    .onSnapshot(async (data) => {
                        const _departmentList = data.docs.map((doc) => doc.data())[0] as DepartmentManageType | undefined
                        setState((prev) => ({ ...prev, departments: _departmentList?.departments?.filter((dep) => dep?.isDefault != true), isFetching: false }))

                        const cachedResult = await updateCachedData({ key: __cachedKey, value: _departmentList?.departments?.filter((dep) => dep?.isDefault != true) ?? [] })
                        if (cachedResult.error) {
                            const _error = cachedResult as CustomResponse
                            dispatch(
                                setToastMessage({
                                    text: getErrorToastMessage(_error),
                                    type: 'error',
                                }),
                            )
                        }
                    })
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
                    dispatch(setIsNavUpdating(false))
                    dispatch(setLoading(false))
                }
            }
        })()
    }, [isFetching])

    const footer = () => {
        return (
            <View
                style={{
                    marginBottom: 100,
                    marginHorizontal: 10,
                }}>
                <AppButton
                    style={{
                        marginTop: 20,
                    }}
                    title={t('admin:AddADepartment')}
                    onPress={() => {
                        navigation.push('CreateDepartment', {
                            departmentNum: (departments?.length ?? 0) + 1,
                        })
                    }}
                />
            </View>
        )
    }

    const onPressDepartment = (department: DepartmentType) => {
        navigation.push('EditDepartment', {
            departmentId: department.departmentId,
            companyId: companyId,
            mode: 'edit',
        })
    }

    const onRefresh = () => {
        dispatch(setIsNavUpdating(true))
    }
    return <DepartmentList departments={departments} onPressDepartment={onPressDepartment} onRefresh={onRefresh} footer={footer} />
}
export default DepartmentManage

const styles = StyleSheet.create({})
