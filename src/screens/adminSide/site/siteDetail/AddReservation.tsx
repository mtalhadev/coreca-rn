import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { compareWithAnotherDate, toCustomDateFromTotalSeconds, CustomDate, getDailyEndTime, getDailyStartTime, newCustomDate, nextDay, getMonthlyFirstDay } from '../../../../models/_others/CustomDate'
import { AppButton } from '../../../../components/atoms/AppButton'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { InputNumberBox } from '../../../../components/organisms/inputBox/InputNumberBox'
import { InputDateTimeBox } from '../../../../components/organisms/inputBox/InputDateTimeBox'
import { InputCompanyBox } from '../../../../components/organisms/inputBox/InputCompanyBox'
import { GlobalStyles } from '../../../../utils/Styles'
import { getMyPartnershipCompanies, GetMyPartnershipCompaniesResponse } from '../../../../usecases/company/CompanyListCase'
import { StoreType } from '../../../../stores/Store'
import isEmpty from 'lodash/isEmpty'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { MAX_DAMMY_WORKER_SPAN } from '../../../../utils/Constants'
import { addReservations } from '../../../../usecases/reservation/ReservationCase'
import { CompanyCLType } from '../../../../models/company/Company'
import { useIsFocused } from '@react-navigation/native'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { InputConstructionBox } from '../../../../components/organisms/inputBox/InputConstructionBox'
import { ConstructionCLType } from '../../../../models/construction/Construction'

type NavProps = StackNavigationProp<RootStackParamList, 'AddReservation'>
type RouteProps = RouteProp<RootStackParamList, 'AddReservation'>

type InitialStateType = {
    company?: CompanyCLType
    companies: CompanyCLType[]
    construction?: ConstructionCLType
    disable: boolean
    update: number
}

const initialState: InitialStateType = {
    companies: [],
    disable: true,
    update: 0,
}

const AddReservation = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ company, companies, disable, update, construction }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const { companyId, initStartDate, supportingCompany } = route?.params ?? {}
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const { t } = useTextTranslation()

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        navigation.setOptions({
            title: t('common:RequestForSupport'),
        })
    }, [navigation])

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(myCompanyId)) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const companiesResult: CustomResponse<GetMyPartnershipCompaniesResponse> = await getMyPartnershipCompanies({
                    myCompanyId,
                })
                if (companiesResult.error) {
                    throw {
                        error: companiesResult.error,
                    }
                }
                setState((prev) => ({ ...prev, companies: companiesResult.success ?? [] }))
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
        return () => setState(initialState)
    }, [myCompanyId, update])

    useEffect(() => {
        if (companyId) {
            setState((prev) => ({ ...prev, company: companies.find((company) => companyId == company.companyId) }))
        }
    }, [companyId, companies])

    useEffect(() => {
        if (isEmpty(company) || construction == undefined) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [company, construction])

    useEffect(() => {
        if (supportingCompany) {
            setState((prev) => ({ ...prev, company: supportingCompany }))
        }
    }, [supportingCompany])

    const _addRequestWorkers = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            const result = await addReservations({
                myCompanyId,
                requestedCompanyId: company?.companyId,
                constructionIds: [construction?.constructionId].filter(data => data != undefined) as string[]
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }

            dispatch(
                setToastMessage({
                    text: t('admin:SupportRequestedArrangeASupportWorker'),
                    type: 'success',
                } as ToastMessage),
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
        }
    }

    return (
        <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
            <InputCompanyBox
                style={{ marginTop: 30 }}
                required={true}
                title={t('admin:CompanyRequestingSupport')}
                withoutMyCompany
                selectedCompany={company}
                isCompanyAlreadyExists={!!supportingCompany}
                infoText={t('admin:SupportIsConfirmedByArrangements')}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, company: value }))
                }}
            />
            <InputConstructionBox
                style={{ marginTop: 30 }}
                required={true}
                title={t('admin:ConstructionWorkRequestingPermanentUse')}
                targetMonth={initStartDate ? getMonthlyFirstDay(toCustomDateFromTotalSeconds(initStartDate)) : undefined}
                selectedConstruction={construction}
                onValueChangeValid={(value) => {
                    setState((prev) => ({
                        ...prev,
                        construction: value,
                    }))
                }}
            />
            <AppButton
                disabled={disable}
                style={{
                    marginTop: 40,
                    marginHorizontal: 20,
                }}
                title={t('common:Request')}
                onPress={() => {
                    _addRequestWorkers()
                }}
            />
            <Text
                style={[
                    GlobalStyles.smallGrayText,
                    {
                        alignSelf: 'center',
                        marginTop: 15,
                    },
                ]}>
                {t('admin:SupportConfirmedByArrangements')}
            </Text>
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default AddReservation

const styles = StyleSheet.create({})
