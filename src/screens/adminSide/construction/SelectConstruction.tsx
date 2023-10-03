import React, { useEffect, useMemo, useState } from 'react'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { ConstructionListScreen } from '../../../components/template/ConstructionListScreen'
import { useIsFocused } from '@react-navigation/native'
import { setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { getMyPartnershipCompaniesWithMyCompany } from '../../../usecases/company/CompanyListCase'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { useDispatch, useSelector } from 'react-redux'
import { StoreType } from '../../../stores/Store'
import { ConstructionCLType } from '../../../models/construction/Construction'
import { CustomDate } from '../../../models/_others/CustomDate'
import {
    getSelectableConstructionList,
    getSelectableConstructionListFilteredTargetDate,
    getSelectableConstructionListFilteredTargetMonth,
    GetSelectableConstructionListResponse,
} from '../../../usecases/construction/ConstructionListCase'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { useSafeUnmount, useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../fooks/useTextTranslation'
import { checkMyDepartment } from '../../../usecases/department/DepartmentCase'
type NavProps = StackNavigationProp<RootStackParamList, 'SelectConstruction'>
type RouteProps = RouteProp<RootStackParamList, 'SelectConstruction'>

export type SelectConstructionType = {
    title?: string
    targetDate?: CustomDate
    targetMonth?: CustomDate
    screenFrom?: string
    onPressConstruction?: (construction: ConstructionCLType) => void
}

type InitialStateType = {
    constructions?: ConstructionCLType[]
    displayConstructions?: ConstructionCLType[]
    update: number
}

const initialState: InitialStateType = {
    update: 0,
}

const SelectConstruction = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const [{ constructions, displayConstructions, update }, setState] = useState(initialState)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const activeDepartments = useSelector((state: StoreType) => state.account.activeDepartments)
    const activeDepartmentIds = useMemo(() => activeDepartments?.map((dep) => dep?.departmentId).filter((data) => data != undefined) as string[], [activeDepartments])

    useSafeUnmount(setState, initialState)

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isFocused])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        navigation.setOptions({
            title: route.params?.selectConstruction?.title ?? t('common:SelectConstruction'),
        })
    }, [navigation, route.params?.selectConstruction?.title])

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isNavUpdating])

    useEffect(() => {
        ;(async () => {
            try {
                if (isFocused) dispatch(setLoading(true))

                let constructionsResult: CustomResponse<GetSelectableConstructionListResponse>
                if (route.params?.selectConstruction?.targetDate == undefined && route.params?.selectConstruction?.targetMonth == undefined) {
                    constructionsResult = await getSelectableConstructionList({
                        myCompanyId,
                    })
                } else if (route.params?.selectConstruction?.targetDate != undefined) {
                    constructionsResult = await getSelectableConstructionListFilteredTargetDate({
                        myCompanyId,
                        targetDate: route.params?.selectConstruction?.targetDate,
                    })
                } else {
                    constructionsResult = await getSelectableConstructionListFilteredTargetMonth({
                        myCompanyId,
                        targetMonth: route.params?.selectConstruction?.targetMonth,
                    })
                }

                if (constructionsResult.error) {
                    throw {
                        error: constructionsResult.error,
                    }
                }

                setState((prev) => ({ ...prev, constructions: constructionsResult.success }))
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
    }, [update])

    useEffect(() => {
        const _displayConstructions = constructions?.filter(
            (construction) =>
                construction.contract?.receiveCompanyId != myCompanyId ||
                checkMyDepartment({
                    targetDepartmentIds: construction.contract?.receiveDepartmentIds,
                    activeDepartmentIds,
                }),
        )
        setState((prev) => ({ ...prev, displayConstructions: _displayConstructions }))
    }, [activeDepartmentIds, constructions])

    return (
        <ConstructionListScreen
            constructions={displayConstructions ?? []}
            onPressConstruction={(construction) => {
                if (route.params?.selectConstruction?.onPressConstruction) {
                    //navigation.goBack()
                    route.params.selectConstruction?.onPressConstruction(construction)
                }
            }}
        />
    )
}
export default SelectConstruction
