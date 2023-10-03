import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { View, StyleSheet, AppState } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { AppButton } from '../../../../components/atoms/AppButton'
import { LOCK_INTERVAL_TIME, PLACEHOLDER } from '../../../../utils/Constants'
import { editIsOfficeWorker, editWorkerCompanyRole } from '../../../../usecases/worker/MyWorkerCase'
import isEmpty from 'lodash/isEmpty'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { InputDropDownBox } from '../../../../components/organisms/inputBox/InputDropdownBox'
import { companyRoleAndIsOfficeWorkerToTitle, titleTextList, titleToCompanyRole, titleToIsOfficeWorker } from '../../../../usecases/company/CommonCompanyCase'
import { StoreType } from '../../../../stores/Store'
import { CompanyRoleEnumType } from '../../../../models/worker/CompanyRoleEnumType'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { useIsFocused } from '@react-navigation/native'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { onUpdateWorkerUpdateSiteArrangementCache } from '../../../../usecases/worker/CommonWorkerCase'
import { WorkerType } from '../../../../models/worker/Worker'

type NavProps = StackNavigationProp<RootStackParamList, 'EditTitle'>
type RouteProps = RouteProp<RootStackParamList, 'EditTitle'>

type InitialStateType = {
    workerId?: string
    title?: string[]
    disable: boolean
    update: number
}

const initialState: InitialStateType = {
    disable: false,
    update: 0,
}
const EditTitle = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const [{ workerId, disable, title, update }, setState] = useState(initialState)
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId)

    useEffect(() => {
        setState((prev) => ({ ...prev, title: route?.params?.title ? [route.params?.title] : undefined, workerId: route?.params?.workerId }))
    }, [route])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        if (isEmpty(title)) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [title])

    useEffect(() => {
        if (isFocused && signInUser?.workerId && workerId && appState == 'active') {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: signInUser?.workerId ?? 'no-id',
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
                        myWorkerId: signInUser?.workerId ?? 'no-id',
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
                    myWorkerId: signInUser?.workerId ?? 'no-id',
                    targetId: workerId ?? 'no-id',
                    modelType: 'worker',
                    unlock: true,
                })
            }
        }
    }, [workerId, signInUser?.workerId, appState, isFocused])

    // AppState.addEventListenerでAppStateが変更された時に発火する
    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    const _write = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: workerId ?? 'no-id',
                modelType: 'worker',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }

            const companyRole = titleToCompanyRole(title?.[0]) as CompanyRoleEnumType
            const isOfficeWorker = titleToIsOfficeWorker(title?.[0])

            const newWorker = {
                workerId: workerId,
                companyRole,
                isOfficeWorker,
            } as WorkerType
            if (newWorker && myCompanyId && accountId) {
                onUpdateWorkerUpdateSiteArrangementCache({
                    newWorker: newWorker,
                    myCompanyId: myCompanyId,
                    accountId: accountId,
                })
            }

            const results = await Promise.all([editWorkerCompanyRole({ workerId, companyRole }), editIsOfficeWorker({ workerId, isOfficeWorker })])

            if (isFocused) dispatch(setLoading(false))

            results.forEach((result) => {
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
            })

            dispatch(setLocalUpdateScreens([...localUpdateScreens, { screenName: 'MyCompanyWorkerList' }]))
            await updateLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: workerId ?? 'no-id',
                modelType: 'worker',
                unlock: true,
            })
            dispatch(
                setToastMessage({
                    text: t('admin:TitleChanged'),
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
        <View>
            <InputDropDownBox
                title={t('admin:Title')}
                required={true}
                placeholder={PLACEHOLDER.TITLE}
                selectableItems={
                    title?.[0] != undefined
                        ? title?.[0] == '代表者' || title?.[0] == '一人親方'
                            ? titleTextList.filter((_title) => _title == '代表者' || _title == '一人親方')
                            : titleTextList.filter((_title) => _title != '代表者' && _title != '一人親方')
                        : undefined
                }
                selectNum={1}
                value={title}
                style={{
                    marginVertical: 40,
                }}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, title: value }))
                }}
            />
            <View
                style={{
                    marginHorizontal: 20,
                }}>
                <AppButton
                    disabled={disable}
                    title={t('common:Save')}
                    height={50}
                    onPress={() => {
                        _write()
                    }}
                />
            </View>
        </View>
    )
}
export default EditTitle

const styles = StyleSheet.create({})
