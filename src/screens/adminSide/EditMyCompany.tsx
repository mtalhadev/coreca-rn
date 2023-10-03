/* eslint-disable indent */
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Pressable, AppState, Linking } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { DefaultStackType, RootStackParamList } from '../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { AppButton } from '../../components/atoms/AppButton'
import { ImageIcon } from '../../components/organisms/ImageIcon'
import { fetchTestModule, getRandomImageColorHue, getUuidv4, pickImage, resizeImage, SwitchEditOrCreateProps, getUpdateNumber } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { FontStyle } from '../../utils/Styles'
import { COMPANY_TERMS_OF_SERVICE_URL, LOCK_INTERVAL_TIME, PLACEHOLDER, PRIVACY_POLICY_URL, THEME_COLORS, dMarginTop } from '../../utils/Constants'
import { BottomMargin } from '../../components/atoms/BottomMargin'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import { _createCompany, _getCompany, _updateCompany } from '../../services/company/CompanyService'
import { setLoading, setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { _createPartnership, _updatePartnership } from '../../services/partnership/PartnershipService'
import { StoreType } from '../../stores/Store'
import isEmpty from 'lodash/isEmpty'
import { InputTextBox } from '../../components/organisms/inputBox/InputTextBox'
import { getSameNameCompanies, getMyCompany, GetMyCompanyResponse, writeMyCompany } from '../../usecases/company/MyCompanyCase'
import { getNextRoute, getOnlyCompanyName } from '../../usecases/RouteCase'
import { checkSignInAndSetToStore } from '../../usecases/account/LoginSignUpCase'
import { checkLockOfTarget, updateLockOfTarget } from '../../usecases/lock/CommonLockCase'
import { useIsFocused } from '@react-navigation/native'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import { applyPlanTicket } from '../../usecases/planTicket/CommonPlanTicketCase'
import { setPlanTicketId } from '../../stores/AccountSlice'
import { setIsNavUpdating } from '../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../fooks/useUnmount'
import { useTextTranslation } from './../../fooks/useTextTranslation'
import { CompanyAccountInfoMailParams, sendCompanyAccountInfo } from '../../usecases/account/SendCompanyInfoCase'

type NavProps = StackNavigationProp<RootStackParamList, 'EditMyCompany'>
type RouteProps = RouteProp<RootStackParamList, 'EditMyCompany'>

type InitialStateType = {
    id?: string
    image?: ImageInfo
    disable: boolean
    update: number
} & MyCompanyUIType

export type MyCompanyUIType = {
    name?: string
    address?: string
    imageUrl?: string
    sImageUrl?: string
    xsImageUrl?: string
    imageColorHue?: number
    phoneNumber?: string
    industry?: string
    departmentName?: string
}

const initialState: InitialStateType = {
    id: '',
    disable: false,
    update: 0,
}

const EditMyCompany = (props: Partial<SwitchEditOrCreateProps>) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const mode = props.mode ?? 'edit'
    const urlScheme = useSelector((state: StoreType) => state.nav.urlScheme)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const planTicketId = useSelector((state: StoreType) => state.account.planTicketId)
    const dispatch = useDispatch()
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const [{ id, name, industry, departmentName, phoneNumber, address, image, imageUrl, sImageUrl, xsImageUrl, imageColorHue, disable, update }, setState] = useState(initialState)

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, update: update + 1 }))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        navigation.setOptions({
            title: mode == 'new' ? t('admin:RegisterYourCompany') : t('admin:EditYourCompany'),
        })
    }, [navigation])

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])
    useEffect(() => {
        if (mode == 'edit' && !isEmpty(id)) {
            ;(async () => {
                try {
                    dispatch(setLoading(true))
                    const result: CustomResponse<GetMyCompanyResponse | undefined> = await getMyCompany({
                        myCompanyId,
                    })

                    if (result.error) {
                        throw {
                            error: result.error,
                        }
                    }
                    const company = result.success
                    setState((prev) => ({ ...prev, ...company }))
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
        }
        dispatch(setIsNavUpdating(false))
    }, [id, update])

    useEffect(() => {
        if (isEmpty(name) || isEmpty(address) || isEmpty(phoneNumber) || isEmpty(industry)) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [name, address, phoneNumber, industry])

    useEffect(() => {
        if (mode === 'edit') {
            setState((prev) => ({ ...prev, id: myCompanyId }))
        } else {
            setState((prev) => ({ ...prev, id: getUuidv4(), imageColorHue: getRandomImageColorHue() }))
        }
        return () => {
            setState({ ...initialState })
        }
    }, [])

    useEffect(() => {
        if (isFocused && myCompanyId && signInUser?.workerId && appState == 'active') {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: signInUser?.workerId ?? 'no-id',
                        targetId: myCompanyId ?? 'no-id',
                        modelType: 'company',
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
                        targetId: myCompanyId ?? 'no-id',
                        modelType: 'company',
                    })
                    return _update
                })(),
                LOCK_INTERVAL_TIME,
            )
            return () => {
                clearInterval(keepLock)
                updateLockOfTarget({
                    myWorkerId: signInUser?.workerId ?? 'no-id',
                    targetId: myCompanyId ?? 'no-id',
                    modelType: 'company',
                    unlock: true,
                })
            }
        }
    }, [myCompanyId, signInUser?.workerId, appState, isFocused])

    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    const _writeMyCompany = async () => {
        try {
            if (isFocused) dispatch(setLoading(true))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: myCompanyId ?? 'no-id',
                modelType: 'company',
            })
            if (lockResult.error) {
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                throw {
                    error: lockResult.error,
                }
            }

            const sameNameWorkers = route.params?.sameNameWorkers

            if (mode == 'new' && sameNameWorkers != undefined && sameNameWorkers.length > 0) {
                const companyIds = sameNameWorkers.map((worker) => worker?.companyId).filter((id) => id != undefined) as string[]

                if (companyIds.length > 0) {
                    const result = await getSameNameCompanies({ name, companyIds, isFake: false })

                    if (result.error) {
                        throw {
                            error: t('admin:FailedToGetSameNameCompanies'),
                        }
                    }

                    if (result.success) {
                        const sameNameCompanies = result.success
                        if (sameNameCompanies.length > 0) {
                            if (isFocused) dispatch(setLoading(false))
                            //最初の名前で代表する
                            const sameName = sameNameWorkers[0].name
                            const sameCompanyName = sameNameCompanies[0].name
                            dispatch(
                                setToastMessage({
                                    text: `${t('admin:CompanyName')}: ${sameCompanyName}${t('common:comma')}${t('admin:OwnerName')}: ${sameName} ${t('admin:CompanyAlreadyExists')}`,
                                    type: 'warn',
                                } as ToastMessage),
                            )

                            return Promise.resolve({ success: undefined })
                        }
                    }
                }
            }

            const result = await writeMyCompany({
                myCompanyId,
                image,
                name,
                address,
                industry,
                departmentName,
                phoneNumber,
                imageColorHue,
                imageUrl,
                sImageUrl,
                xsImageUrl,
                dispatch,
                myWorkerId: signInUser?.workerId,
            })
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            if (planTicketId && mode == 'new') {
                const planResult = await applyPlanTicket({
                    planTicketId: planTicketId,
                    myCompanyId,
                })
                if (planResult.error) {
                    throw planResult.error
                }
                dispatch(setPlanTicketId(undefined))
            }
            await checkSignInAndSetToStore({
                accountId: signInUser?.accountId,
                dispatch,
                isSignUping: mode == 'new',
            })
            if (result.success == 'update') {
                dispatch(
                    setToastMessage({
                        text: t('admin:EditedOurCompany'),
                        type: 'success',
                    } as ToastMessage),
                )
            } else {
                dispatch(
                    setToastMessage({
                        text: t('admin:CompanyCreated'),
                        type: 'success',
                    } as ToastMessage),
                )
            }
            if (mode == 'edit') {
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                navigation.push('AdminMyPageRouter', {
                    update: getUpdateNumber(),
                    isHeaderLeftBack: false,
                })
            } else {
                const rtnRoute = await getNextRoute('EditMyCompany', urlScheme?.path, signInUser)
                if (rtnRoute.error) {
                    throw {
                        error: rtnRoute.error,
                    }
                }
                let retCompanyName: CustomResponse<string>
                if (urlScheme?.queryParams.companyId != undefined) {
                    retCompanyName = await getOnlyCompanyName(urlScheme?.queryParams.companyId as unknown as string)
                }
                if (isFocused) {
                    dispatch(setLoading(false))
                }
                if (rtnRoute.success != undefined) {
                    rtnRoute.success?.forEach((route) => {
                        if (route != 'CompanyDetailRouter') {
                            navigation.push(route as never, {} as never)
                        } else {
                            navigation.push(route, { companyId: urlScheme?.queryParams.companyId as unknown as string, title: retCompanyName.success })
                        }
                    })
                }
            }

            return Promise.resolve({ success: true })
        } catch (error) {
            const _error = error as CustomResponse
            if (isFocused) {
                dispatch(setLoading(false))
            }
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    const _sendCompanyAccountInfo = async () => {
        try {
            const companyAccountInfo: CompanyAccountInfoMailParams = {
                ownerName: route.params?.ownerName,
                email: signInUser?.email,
                password: signInUser?.password,
                companyName: name,
                address,
                industry,
                departmentName,
                phoneNumber,
            }

            const result = await sendCompanyAccountInfo(companyAccountInfo)
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
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
                        if (result) {
                            setState((prev) => ({ ...prev, image: result }))
                        }
                    }}>
                    <ImageIcon
                        style={{
                            marginTop: 25,
                        }}
                        size={120}
                        type={'company'}
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
                        {t('admin:ChangePhoto')}
                    </Text>
                </Pressable>
            </View>
            <InputTextBox
                style={{ marginTop: 30 - dMarginTop }}
                required={true}
                title={t('admin:CompanyName')}
                value={name}
                infoText={t('admin:CompanyNameTradeOrPersonal')}
                placeholder={PLACEHOLDER.COMPANY_NAME}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, name: value }))
                }}
            />
            {mode == 'new' && (
                <InputTextBox
                    style={{ marginTop: 30 - dMarginTop }}
                    required={false}
                    title={t('admin:DepartmentName')}
                    value={departmentName}
                    placeholder={PLACEHOLDER.DEPARTMENT}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, departmentName: value }))
                    }}
                    onClear={() => {
                        setState((prev) => ({ ...prev, departmentName: undefined }))
                    }}
                />
            )}
            <InputTextBox
                style={{ marginTop: 30 - dMarginTop }}
                required={true}
                title={t('common:Address')}
                value={address}
                placeholder={PLACEHOLDER.ADDRESS}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, address: value }))
                }}
            />
            <InputTextBox
                style={{ marginTop: 30 - dMarginTop }}
                required={true}
                validation={'phone'}
                title={t('common:PhoneNumber')}
                value={phoneNumber}
                placeholder={PLACEHOLDER.COMPANY_PHONE}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, phoneNumber: value }))
                }}
            />
            <InputTextBox
                style={{ marginTop: 30 - dMarginTop }}
                required={true}
                title={t('admin:Industry')}
                value={industry}
                placeholder={PLACEHOLDER.INDUSTRY}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, industry: value }))
                }}
            />
            {mode == 'new' && (
                <View
                    style={{
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        alignSelf: 'center',
                        marginTop: 40 - dMarginTop,
                    }}>
                    <Text
                        style={{
                            fontFamily: FontStyle.regular,
                            lineHeight: 18,
                            fontSize: 12,
                        }}>
                        <Text
                            style={{
                                color: THEME_COLORS.BLUE.MIDDLE,
                                textDecorationLine: 'underline',
                            }}
                            onPress={() => {
                                Linking.openURL(COMPANY_TERMS_OF_SERVICE_URL)
                            }}>
                            {t('common:TermsAndConditions')}
                        </Text>
                        {t('common:And')}
                        <Text
                            style={{
                                color: THEME_COLORS.BLUE.MIDDLE,
                                textDecorationLine: 'underline',
                            }}
                            onPress={() => {
                                Linking.openURL(PRIVACY_POLICY_URL)
                            }}>
                            {t('common:PrivacyPolicy')}
                        </Text>
                        {t('common:Two')}
                    </Text>
                    <Text
                        style={{
                            fontFamily: FontStyle.regular,
                            lineHeight: 18,
                            fontSize: 12,
                        }}>
                        {t('common:TapRegsiterAfterAgreeingToTerms')}
                    </Text>
                </View>
            )}
            <AppButton
                style={{
                    marginTop: 40,
                    marginHorizontal: 20,
                }}
                disabled={disable}
                title={mode == 'new' ? t('common:Register') : t('common:Save')}
                onPress={async () => {
                    const result = await _writeMyCompany()

                    if (mode === 'new' && result?.success) {
                        await _sendCompanyAccountInfo()
                    }
                }}
            />
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default EditMyCompany

const styles = StyleSheet.create({})
