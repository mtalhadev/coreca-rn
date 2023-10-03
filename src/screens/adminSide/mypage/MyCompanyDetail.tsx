import React, { useState, useRef, useEffect, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, ScrollView } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { ImageIcon } from '../../../components/organisms/ImageIcon'
import { CompanyProfile } from '../../../components/template/CompanyProfile'
import { AdminMyPageRouterContextType } from './AdminMyPageRouter'
import isEmpty from 'lodash/isEmpty'
import { StoreType } from '../../../stores/Store'
import { setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { GetAnyCompanyProfileWithOwnerWorkerResponse, getAnyCompanyProfileWithOwnerWorker } from '../../../usecases/company/CommonCompanyCase'
import { CustomDate } from '../../../models/_others/CustomDate'
import { fetchTestModule, getUuidv4 } from '../../../utils/Utils'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { useIsFocused } from '@react-navigation/native'
import { CompanyCLType } from '../../../models/company/Company'
import { WorkerCLType } from '../../../models/worker/Worker'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { ScrollViewInstead } from '../../../components/atoms/ScrollViewInstead'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
export type MyCompanyDetailNavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    company?: CompanyCLType
    worker?: WorkerCLType
    routeUpdate: number
}

const initialState: InitialStateType = {
    routeUpdate: 0,
}

const MyCompanyDetail = () => {
    const navigation = useNavigation<MyCompanyDetailNavProps>()
    const route = useRoute<RouteProps>()
    const [{ company, worker, routeUpdate }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)

    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const { update } = useContext(AdminMyPageRouterContextType)

    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)

    useSafeUnmount(setState, initialState)

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, routeUpdate: routeUpdate + 1 }))
        }
    }, [isFocused])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, routeUpdate: routeUpdate + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        setState((prev) => ({ ...prev, routeUpdate: routeUpdate + 1 }))
    }, [route])

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(myCompanyId)) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))

                const companyResult: CustomResponse<GetAnyCompanyProfileWithOwnerWorkerResponse> = await getAnyCompanyProfileWithOwnerWorker({
                    companyId: myCompanyId,
                    myCompanyId,
                    myWorkerId: signInUser?.workerId,
                })

                if (companyResult.error || companyResult.success == undefined || companyResult.success?.company == undefined) {
                    throw {
                        error: companyResult.error,
                    }
                }
                setState((prev) => ({ ...prev, company: companyResult.success?.company, worker: companyResult.success?.worker }))
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
    }, [myCompanyId, update, routeUpdate])

    return (
        <ScrollViewInstead
            style={{
                flex: 1,
                backgroundColor: '#fff',
            }}>
            <CompanyProfile
                company={company}
                worker={worker}
                type={'my-company'}
                style={{
                    margin: 10,
                }}
                myCompanyDetailNavigation={navigation}
                updateCompanyData={() => {
                    setState((prev) => ({ ...prev, routeUpdate: routeUpdate + 1 }))
                }}
            />
        </ScrollViewInstead>
    )
}
export default MyCompanyDetail

const styles = StyleSheet.create({})
