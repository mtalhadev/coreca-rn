import React, { useState, useEffect, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Linking, Pressable, BackHandler } from 'react-native'
import { useNavigation, useRoute, RouteProp, useFocusEffect, useIsFocused } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { ScrollView } from 'react-native-gesture-handler'
import { WorkerProfileContent, WorkerProfileContentType } from '../../../../components/template/WorkerProfileContent'
import { getWorkerDetail, GetWorkerDetailResponse } from '../../../../usecases/worker/CommonWorkerCase'
import isEmpty from 'lodash/isEmpty'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { WorkerDetailRouterContextType } from './WorkerDetailRouter'
import { THEME_COLORS } from '../../../../utils/Constants'
import { ArrangementCLType } from '../../../../models/arrangement/Arrangement'
import { WorkerCLType } from '../../../../models/worker/Worker'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { ScrollViewInstead } from '../../../../components/atoms/ScrollViewInstead'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    worker?: WorkerCLType
    type?: WorkerProfileContentType
    arrangement?: ArrangementCLType
    localUpdate: number
}

const initialState: InitialStateType = {
    localUpdate: 0,
}

const WorkerProfile = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ worker, type, localUpdate, arrangement }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const { workerId, arrangementId, update } = useContext(WorkerDetailRouterContextType)

    const isFocused = useIsFocused()

    useSafeUnmount(setState, initialState)

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
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(workerId) || isEmpty(myCompanyId) || isEmpty(signInUser?.workerId)) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))

                const workerResult: CustomResponse<GetWorkerDetailResponse> = await getWorkerDetail({
                    workerId: workerId,
                    myCompanyId,
                    arrangementId,
                    myWorkerId: signInUser?.workerId,
                })

                if (workerResult.error) {
                    throw {
                        error: workerResult.error,
                    }
                }
                const _worker = workerResult.success?.worker

                setState((prev) => ({ ...prev, worker: _worker, type: workerResult.success?.type, arrangement: workerResult.success?.arrangement }))
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
    }, [workerId, update, localUpdate])

    return (
        <ScrollViewInstead
            style={{
                backgroundColor: THEME_COLORS.OTHERS.BACKGROUND,
            }}>
            <WorkerProfileContent worker={worker} type={type} side="admin" arrangement={arrangement} />
        </ScrollViewInstead>
    )
}
export default WorkerProfile

const styles = StyleSheet.create({})
