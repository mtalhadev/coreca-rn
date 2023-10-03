import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Pressable, Platform, AppState } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { InputTextBox } from '../../components/organisms/inputBox/InputTextBox'
import { AppButton } from '../../components/atoms/AppButton'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { ImageIcon } from '../../components/organisms/ImageIcon'
import { FontStyle, GreenColor } from '../../utils/Styles'
import { LOCK_INTERVAL_TIME, PLACEHOLDER, THEME_COLORS, dMarginTop } from '../../utils/Constants'
import * as ImagePicker from 'expo-image-picker'
import { getRandomImageColorHue, pickImage } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { BottomMargin } from '../../components/atoms/BottomMargin'
import { companyRoleToText, getAnyCompany } from '../../usecases/company/CommonCompanyCase'
import isEmpty from 'lodash/isEmpty'
import { InputCompanyBox } from '../../components/organisms/inputBox/InputCompanyBox'
import { writeMyWorker } from '../../usecases/worker/MyWorkerCase'
import { setLoading, setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { MyWorkerUIType } from '../adminSide/CreateOwnerWorker'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import { StoreType } from '../../stores/Store'
import { getMyCompany } from '../../usecases/company/MyCompanyCase'
import { MyCompanyUIType } from '../adminSide/EditMyCompany'
import { CompanyRoleEnumType } from '../../models/worker/CompanyRoleEnumType'
import { CompanyCLType } from '../../models/company/Company'
import { checkSignInAndSetToStore } from '../../usecases/account/LoginSignUpCase'
import { checkLockOfTarget, updateLockOfTarget } from '../../usecases/lock/CommonLockCase'
import { useIsFocused } from '@react-navigation/native'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../stores/NavigationSlice'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../fooks/useUnmount'
import { useTextTranslation } from './../../fooks/useTextTranslation'
import { InputObject, InputObjectDropdownBox } from '../../components/organisms/inputBox/InputObjectDropdownBox'
import { DepartmentManageType } from '../../models/department/DepartmentManageType'
import { _getFirestore } from '../../services/firebase/FirestoreService'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    title: string
    disable?: boolean
    companyRole?: CompanyRoleEnumType
    belongingCompany?: CompanyCLType
    companyDepartments?: InputObject[]
    workerDepartments?: InputObject[]
    update: number
} & MyWorkerUIType

const initialState: InitialStateType = {
    title: '保存して次へ',
    imageColorHue: getRandomImageColorHue(),
    update: 0,
}

const CreateWorker = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const urlScheme = useSelector((state: StoreType) => state.nav.urlScheme)

    const [
        { title, name, nickname, phoneNumber, image, disable, companyRole, belongingCompany, imageUrl, sImageUrl, xsImageUrl, imageColorHue, companyDepartments, workerDepartments, update },
        setState,
    ] = useState(initialState)
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)

    const unsubscribeRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)
    const activeDepartments = useSelector((state: StoreType) => state?.account?.activeDepartments)
    const isDefaultDepartment = useMemo(() => activeDepartments?.map((dep) => dep?.isDefault)[0], [activeDepartments])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)
    useSafeUnmount(setState, initialState)

    useEffect(() => {
        if (isEmpty(name) || (workerDepartments?.length ?? 0) == 0) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [name, workerDepartments])

    useEffect(() => {
        const name = urlScheme?.queryParams?.workerName as string
        const nickname = urlScheme?.queryParams?.workerNickname as string
        if (!isEmpty(name)) {
            setState((prev) => ({ ...prev, name }))
        }
        if (!isEmpty(nickname)) {
            setState((prev) => ({ ...prev, nickname }))
        }
    }, [urlScheme?.queryParams?.name, urlScheme?.queryParams?.nickname])

    useEffect(() => {
        return () => {
            setState((prev) => ({ ...prev, ...initialState }))
        }
    }, [signInUser])

    useEffect(() => {
        isScreenOnRef.current = isFocused
        return () => {
            if (unsubscribeRef.current && isScreenOnRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
                isScreenOnRef.current = false
            }
        }
    }, [isFocused])

    useEffect(() => {
        if (signInUser?.workerId && appState == 'active' && isFocused) {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: signInUser?.workerId ?? 'no-id',
                        targetId: signInUser?.workerId ?? 'no-id',
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
                        targetId: signInUser?.workerId ?? 'no-id',
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
                    targetId: signInUser?.workerId ?? 'no-id',
                    modelType: 'worker',
                    unlock: true,
                })
            }
        }
    }, [signInUser?.workerId, appState, isFocused])

    // AppState.addEventListenerでAppStateが変更された時に発火する
    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    useEffect(() => {
        ;(async () => {
            try {
                if (!isScreenOnRef.current) return
                const companyResult = await getAnyCompany({
                    myCompanyId,
                    companyId: myCompanyId,
                    workerId: urlScheme?.queryParams.workerId as string, //signInUser?.workerId,
                })
                if (companyResult.error) {
                    throw {
                        error: companyResult.error,
                    }
                }
                const _workerDepartments = companyResult.success?.worker?.departments?.items?.map((dep) => {
                    return { tag: dep.departmentName, value: dep.departmentId } as InputObject
                })
                setState((prev) => ({ ...prev, belongingCompany: companyResult.success?.company, companyRole: companyResult.success?.worker?.companyRole, workerDepartments: _workerDepartments }))
                const db = _getFirestore()
                unsubscribeRef.current = db
                    .collection('DepartmentManage')
                    .where('companyId', '==', myCompanyId)
                    .onSnapshot(async (data) => {
                        const _departmentList = data.docs.map((doc) => doc.data())[0] as DepartmentManageType | undefined
                        const _companyDepartments = _departmentList?.departments?.map((dep) => {
                            return {
                                tag: dep.departmentName,
                                value: dep.departmentId,
                            } as InputObject
                        })
                        setState((prev) => ({
                            ...prev,
                            companyDepartments: _companyDepartments,
                        }))
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
                dispatch(setLoading(false))
                dispatch(setIsNavUpdating(false))
            }
        })()
    }, [myCompanyId, update])

    const updateWorker = async () => {
        try {
            if (belongingCompany?.companyId == undefined) {
                throw {
                    error: t('worker:noCompanyError'),
                } as CustomResponse
            }
            if (signInUser?.workerId == undefined || myCompanyId == undefined) {
                throw {
                    error: 'worker:noAccountError',
                } as CustomResponse
            }
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: signInUser?.workerId ?? 'no-id',
                modelType: 'worker',
            })
            if (lockResult.error) {
                if (isFocused) dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }
            const result = await writeMyWorker({
                workerId: signInUser.workerId,
                name,
                nickname,
                phoneNumber,
                image,
                imageUrl,
                sImageUrl,
                xsImageUrl,
                imageColorHue,
                companyRole,
                companyId: belongingCompany?.companyId,
                departmentIds: workerDepartments?.map((obj) => obj?.value).filter((data) => data != undefined) as string[],
            })

            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                } as CustomResponse
            }
            await checkSignInAndSetToStore({
                accountId: signInUser.accountId,
                dispatch,
            })

            if (result.success != 'no-company') {
                if (result.success == 'update') {
                    dispatch(
                        setToastMessage({
                            text: t('worker:EditedPersonalProfile'),
                            type: 'success',
                        } as ToastMessage),
                    )
                } else {
                    dispatch(
                        setToastMessage({
                            text: t('worker:PersonalProfile'),
                            type: 'success',
                        } as ToastMessage),
                    )
                }
                navigation.push('WorkerHome', {})
            } else {
                throw {
                    error: t('worker:companyNotExist'),
                } as CustomResponse
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
        <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
            <View
                style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                <Pressable
                    style={({ pressed }) => ({
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.3 : 1,
                    })}
                    onPress={async () => {
                        const result = await pickImage()
                        if (result?.uri) {
                            setState((prev) => ({ ...prev, image: result }))
                        }
                    }}>
                    <ImageIcon
                        style={{
                            marginTop: 25,
                        }}
                        size={120}
                        type={'worker'}
                        imageUri={image?.uri ?? imageUrl}
                        imageColorHue={imageColorHue}
                    />
                    <Text
                        style={{
                            marginTop: 10,
                            fontFamily: FontStyle.regular,
                            fontSize: 11,
                            color: THEME_COLORS.BLUE.MIDDLE,
                        }}>
                        {t('worker:ChangePhoto')}
                    </Text>
                </Pressable>
            </View>
            <InputTextBox
                color={GreenColor}
                style={{ marginTop: 30 - dMarginTop }}
                required={true}
                title={t('worker:YourName')}
                placeholder={PLACEHOLDER.PERSON_NAME}
                value={name}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, name: value }))
                }}
            />
            <InputTextBox
                color={GreenColor}
                style={{ marginTop: 30 - dMarginTop }}
                disable
                required={true}
                title={t('worker:YourNickname')}
                placeholder={PLACEHOLDER.PERSON_NICKNAME}
                infoText={t('common:NicknameInfo')}
                value={nickname}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, nickname: value }))
                }}
            />
            <InputTextBox
                color={GreenColor}
                style={{ marginTop: 30 - dMarginTop }}
                validation={'phone'}
                required={false}
                title={t('worker:PhoneNumber')}
                placeholder={PLACEHOLDER.MOBILE_PHONE}
                value={phoneNumber}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, phoneNumber: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, phoneNumber: undefined }))
                }}
            />
            <InputCompanyBox
                color={GreenColor}
                disable
                style={{ marginTop: 30 - dMarginTop }}
                required={true}
                title={t('worker:CompanyName')}
                selectedCompany={belongingCompany}
                placeholder={t('worker:NoCompany')}
            />
            <InputTextBox
                color={GreenColor}
                placeholder={t('worker:NoCompanyAuthority')}
                disable
                style={{ marginTop: 30 - dMarginTop }}
                required={true}
                title={t('worker:CorporateAuthority')}
                value={companyRoleToText(companyRole)}
            />
            {companyRole != 'owner' && !isDefaultDepartment && (
                <InputObjectDropdownBox
                    disable={companyRole == 'general'}
                    color={GreenColor}
                    title={t('common:Department')}
                    placeholder={PLACEHOLDER.DEPARTMENT}
                    selectableItems={companyDepartments ?? []}
                    selectNum={'any'}
                    value={workerDepartments}
                    style={{
                        marginVertical: 40 - dMarginTop,
                    }}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, workerDepartments: value }))
                    }}
                    required={true}
                />
            )}
            <AppButton
                style={{
                    marginTop: 40,
                    marginHorizontal: 20,
                }}
                color={GreenColor}
                disabled={disable}
                title={title}
                onPress={() => {
                    updateWorker()
                }}
            />
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default CreateWorker

const styles = StyleSheet.create({})
