/* eslint-disable indent */
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { AppState, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { CustomDate, nextDay, nextMonth } from '../../../../models/_others/CustomDate'
import { InputTextBox } from '../../../../components/organisms/inputBox/InputTextBox'
import { AppButton } from '../../../../components/atoms/AppButton'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { getUuidv4, SwitchEditOrCreateProps } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { LOCK_INTERVAL_TIME, MAX_PROJECT_SPAN, PLACEHOLDER } from '../../../../utils/Constants'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import flatten from 'lodash/flatten'
import isEmpty from 'lodash/isEmpty'
import range from 'lodash/range'
import uniqBy from 'lodash/uniqBy'
import { InputCompanyBox } from '../../../../components/organisms/inputBox/InputCompanyBox'
import { StoreType } from '../../../../stores/Store'
import { useIsFocused } from '@react-navigation/native'
import { writeMyProject } from '../../../../usecases/project/MyProjectCase'
import { InputDateTimeBox } from '../../../../components/organisms/inputBox/InputDateTimeBox'
import { getTargetProject } from '../../../../usecases/project/CommonProjectCase'
import { getMyCompany } from '../../../../usecases/company/MyCompanyCase'
import { CompanyCLType } from '../../../../models/company/Company'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'

import { toCustomDatesListFromStartAndEnd, UpdateScreenType } from '../../../../models/updateScreens/UpdateScreens'
type NavProps = StackNavigationProp<RootStackParamList, 'EditRequest'>
type RouteProps = RouteProp<RootStackParamList, 'EditRequest'>

type InitialStateType = {
    id?: string
    orderCompany?: CompanyCLType
    receiveCompany?: CompanyCLType
    update: number
    disable: boolean
} & EditProjectUIType

export type EditProjectUIType = {
    name?: string
    startDate?: CustomDate
    endDate?: CustomDate
}

const initialState: InitialStateType = {
    update: 0,
    disable: true,
}

const EditRequest = (props: Partial<SwitchEditOrCreateProps>) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const mode = props.mode ?? 'edit'
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const [{ id, name, startDate, endDate, update, orderCompany, receiveCompany, disable }, setState] = useState(initialState)
    const dispatch = useDispatch()

    const isFocused = useIsFocused()
    const [appState, setAppState] = useState(AppState.currentState)
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isFocused])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        navigation.setOptions({
            title: mode == 'new' ? t('admin:CreateACase') : t('admin:EditACase'),
        })
    }, [navigation])

    useEffect(() => {
        ;(async () => {
            try {
                if (id == undefined || mode == 'new') {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const projectResult = await getTargetProject({
                    projectId: id,
                })

                if (projectResult.error) {
                    throw {
                        error: projectResult.error,
                    }
                }
                setState((prev) => ({ ...prev, ...projectResult.success }))
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
    }, [id, update])

    useEffect(() => {
        ;(async () => {
            try {
                if (myCompanyId == undefined || mode == 'edit' || receiveCompany != undefined) {
                    return
                }
                const companyResult = await getMyCompany({
                    myCompanyId,
                })
                if (companyResult.error) {
                    throw {
                        error: companyResult.error,
                    }
                }
                const company = companyResult.success
                setState((prev) => ({ ...prev, receiveCompany: receiveCompany ?? company }))
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
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        if (isEmpty(name) || (mode == 'new' && orderCompany == undefined) || (mode == 'new' && receiveCompany == undefined) || startDate == undefined || endDate == undefined) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [name, startDate, endDate, orderCompany, receiveCompany])

    useEffect(() => {
        if (mode === 'edit') {
            setState((prev) => ({ ...prev, id: route.params?.requestId }))
        } else {
            setState((prev) => ({ ...prev, id: getUuidv4() }))
        }
        return () => {
            setState({ ...initialState })
        }
    }, [])

    useEffect(() => {
        if (id && signInUser?.workerId && appState == 'active' && isFocused) {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: signInUser?.workerId ?? 'no-id',
                        targetId: id ?? 'no-id',
                        modelType: 'project',
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
                        targetId: id ?? 'no-id',
                        modelType: 'project',
                    })
                    return _update
                })(),
                LOCK_INTERVAL_TIME,
            )
            return () => {
                clearInterval(keepLock)
                updateLockOfTarget({
                    myWorkerId: signInUser?.workerId ?? 'no-id',
                    targetId: id ?? 'no-id',
                    modelType: 'project',
                    unlock: true,
                })
            }
        }
    }, [id, signInUser?.workerId, appState, isFocused])

    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    const _writeProject = async () => {
        try {
            if (id == undefined) {
                throw {
                    error: t('common:NoId'),
                }
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: id ?? 'no-id',
                modelType: 'project',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }
            const result = await writeMyProject({
                projectId: id,
                name,
                myCompanyId,
                startDate,
                myWorkerId: signInUser?.workerId,
                endDate,
                orderCompanyId: orderCompany?.companyId,
                receiveCompanyId: receiveCompany?.companyId,
                orderCompany,
            })
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            if (startDate && endDate) {
                const dateList = toCustomDatesListFromStartAndEnd(startDate, endDate)
                const dates = dateList.map((date) => date.totalSeconds)
                const newLocalUpdateScreens: UpdateScreenType[] = [
                    {
                        screenName: 'OrderList',
                        dates: [...flatten(localUpdateScreens.filter((screen) => screen.screenName == 'OrderList').map((screen) => screen.dates)), ...dates]?.filter(
                            (data) => data != undefined,
                        ) as number[],
                    },
                ]
                dispatch(setLocalUpdateScreens(uniqBy([...newLocalUpdateScreens, ...localUpdateScreens], 'screenName')))
            }
            dispatch(
                setToastMessage({
                    text: result.success == 'create' ? t('admin:NewCaseCreated') : t('admin:TheCaseHasBeenUpdated'),
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
            <InputTextBox
                style={{ marginTop: 30 }}
                validation={'none'}
                required={true}
                title={t('common:CaseName')}
                placeholder={PLACEHOLDER.PROJECT_NAME}
                value={name}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, name: value }))
                }}
                infoText={t('admin:ThePrimeContractorForTheProjectWillBeCompanyItself')}
            />
            {mode == 'new' && (
                <InputCompanyBox
                    style={{ marginTop: 30 }}
                    required={true}
                    title={t('admin:ClientCompany')}
                    selectedCompany={orderCompany}
                    infoText={t('admin:ConfirmDetailsOfTheProjectAndConstructionWork')}
                    onValueChangeValid={(value: CompanyCLType | undefined) => {
                        setState((prev) => ({ ...prev, orderCompany: value }))
                    }}
                />
            )}
            {mode == 'new' && (
                <InputCompanyBox
                    style={{ marginTop: 30 }}
                    required={true}
                    title={t('admin:OrderingCompany')}
                    selectedCompany={receiveCompany}
                    infoText={t('admin:YouCanEditTheProjectAndConstructionWork')}
                    onValueChangeValid={(value: CompanyCLType | undefined) => {
                        setState((prev) => ({ ...prev, receiveCompany: value }))
                    }}
                />
            )}

            <InputDateTimeBox
                style={{ marginTop: 30 }}
                required={true}
                title={t('admin:CaseStart')}
                value={startDate}
                initDateInput={startDate}
                dateInputMode="date"
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, startDate: value }))
                }}
            />
            <InputDateTimeBox
                style={{ marginTop: 30 }}
                required={true}
                title={t('admin:CaseEnded')}
                minDateTime={startDate}
                value={endDate}
                initDateInput={endDate}
                maxDateTime={startDate ? nextDay(startDate, MAX_PROJECT_SPAN) : undefined}
                dateInputMode="date"
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, endDate: value }))
                }}
                infoText={`${t('admin:CaseFromStartTo')}${MAX_PROJECT_SPAN}${t('admin:PleaseSetWithinOneDay')}`}
            />
            <AppButton
                style={{ marginTop: 30, marginHorizontal: 20 }}
                title={mode == 'edit' ? t('common:Save') : t('common:Create')}
                disabled={disable}
                onPress={() => {
                    _writeProject()
                }}
            />
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default EditRequest

const styles = StyleSheet.create({})
