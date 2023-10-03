import React, { useState, useEffect, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Linking, Pressable } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { ScrollView } from 'react-native-gesture-handler'
import WorkerProfile from '../../adminSide/worker/workerDetail/WorkerProfile'
import { WorkerProfileContent } from '../../../components/template/WorkerProfileContent'
import isEmpty from 'lodash/isEmpty'
import { StoreType } from '../../../stores/Store'
import { setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { GetWorkerDetailResponse, getWorkerDetail } from '../../../usecases/worker/CommonWorkerCase'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { WorkerDetailRouterContextType } from '../../adminSide/worker/workerDetail/WorkerDetailRouter'
import { MyPageRouterContext } from './MyPageRouter'
import { WorkerCLType } from '../../../models/worker/Worker'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { ScrollViewInstead } from '../../../components/atoms/ScrollViewInstead'
import { useIsFocused } from '@react-navigation/native'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>
type InitialStateType = {
    worker?: WorkerCLType
    localUpdate: number
}

const initialState: InitialStateType = {
    localUpdate: 0,
}

const MyProfile = () => {
    const { t, i18n } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ worker, localUpdate }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const { update } = useContext(MyPageRouterContext)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)

    useEffect(() => {
        return () => setState(initialState)
    }, [signInUser])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, localUpdate: localUpdate + 1 }))
        }
    }, [isFocused])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, localUpdate: localUpdate + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(signInUser?.workerId) || isEmpty(myCompanyId)) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))

                const workerResult: CustomResponse<GetWorkerDetailResponse> = await getWorkerDetail({
                    workerId: signInUser?.workerId,
                    myCompanyId,
                    myWorkerId: signInUser?.workerId,
                })

                if (workerResult.error) {
                    throw {
                        error: workerResult.error,
                    }
                }
                const _worker = workerResult.success?.worker
                setState((prev) => ({ ...prev, worker: _worker }))
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
    }, [signInUser, update, localUpdate])

    return (
        <ScrollViewInstead style={{}}>
            <WorkerProfileContent worker={worker} type={'is-mine'} side="worker" />
        </ScrollViewInstead>
    )
}
export default MyProfile

const styles = StyleSheet.create({})
