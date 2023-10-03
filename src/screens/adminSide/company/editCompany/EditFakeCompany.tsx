/* eslint-disable indent */
import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Pressable, Linking, AppState } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { DefaultStackType, RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { AppButton } from '../../../../components/atoms/AppButton'
import { ImageIcon } from '../../../../components/organisms/ImageIcon'
import { fetchTestModule, getRandomImageColorHue, getUuidv4, pickImage, resizeImage, SwitchEditOrCreateProps, getUpdateNumber } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { FontStyle } from '../../../../utils/Styles'
import { LOCK_INTERVAL_TIME, PLACEHOLDER, THEME_COLORS, dMarginTop } from '../../../../utils/Constants'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import { _createCompany, _getCompany, _updateCompany } from '../../../../services/company/CompanyService'
import { CompanyCLType, CompanyType, toCompanyCLType } from '../../../../models/company/Company'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { _createPartnership, _updatePartnership } from '../../../../services/partnership/PartnershipService'
import { StoreType } from '../../../../stores/Store'
import isEmpty from 'lodash/isEmpty'
import { getFakeCompany, GetFakeCompanyResponse, toFakeCompanyUIType, writeFakeCompany } from '../../../../usecases/company/FakeCompanyCase'
import { InputTextBox } from '../../../../components/organisms/inputBox/InputTextBox'
import { checkLockOfTarget, updateLockOfTarget } from '../../../../usecases/lock/CommonLockCase'
import { useIsFocused } from '@react-navigation/native'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { genKeyName, getCachedData, updateCachedData } from '../../../../usecases/CachedDataCase'
import { PartnerCompanyListType } from '../../../../models/company/PartnerCompanyListType'

type NavProps = StackNavigationProp<RootStackParamList, 'EditFakeCompany'>
type RouteProps = RouteProp<RootStackParamList, 'EditFakeCompany'>

type InitialStateType = {
    id?: string
    image?: ImageInfo
    disable: boolean
    update: number
} & FakeCompanyUIType

export type FakeCompanyUIType = {
    name?: string
    address?: string
    ownerName?: string
    ownerEmail?: string
    ownerPhoneNumber?: string
    industry?: string
    imageUrl?: string
    sImageUrl?: string
    xsImageUrl?: string
    imageColorHue?: number
    updatedAt?: number
}

const initialState: InitialStateType = {
    id: '',
    disable: false,
    update: 0,
}

const EditFakeCompany = (props: Partial<SwitchEditOrCreateProps>) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const myCompanyId = useSelector((state: StoreType) => state?.account?.belongCompanyId)
    const myWorkerId = useSelector((state: StoreType) => state?.account?.signInUser?.accountId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const mode = props.mode ?? 'edit'
    const dispatch = useDispatch()
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const [{ id, name, ownerEmail, ownerName, ownerPhoneNumber, address, industry, image, imageUrl, sImageUrl, xsImageUrl, imageColorHue, disable, update }, setState] = useState(initialState)

    useEffect(() => {
        navigation.setOptions({
            title: mode == 'new' ? t('admin:CreateATemporaryCompany') : t('admin:EditTemporaryCompany'),
        })
    }, [navigation])

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
        if (mode == 'edit' && !isEmpty(id)) {
            ;(async () => {
                try {
                    const result: CustomResponse<GetFakeCompanyResponse | undefined> = await getFakeCompany({
                        id,
                        myCompanyId,
                    })

                    if (result.error) {
                        throw {
                            error: result.error,
                        }
                    }
                    const __cachedKey = genKeyName({
                        screenName: 'PartnerCompanyList',
                        accountId: accountId,
                        companyId: myCompanyId as string,
                    })
                    const partnerCompanyListCacheData = await getCachedData<PartnerCompanyListType>(__cachedKey)
                    const targetCompany = partnerCompanyListCacheData.success?.companies?.find((item) => item.companyId == id)
                    if (targetCompany) {
                        setState((prev) => ({ ...prev, ...toFakeCompanyUIType(targetCompany as CompanyType) }))
                        if (result?.success?.name == undefined) {
                            return
                        }
                        if (targetCompany.updatedAt && result?.success.updatedAt && targetCompany.updatedAt.totalSeconds > result?.success.updatedAt) {
                            // キャッシュよりDBが古い場合、更新しない
                            return
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
                }
            })()
        }
        dispatch(setIsNavUpdating(false))
    }, [id, update])

    useEffect(() => {
        if (isEmpty(name)) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [name, ownerName])

    useEffect(() => {
        if (mode === 'edit') {
            setState((prev) => ({ ...prev, id: route?.params?.companyId }))
        } else {
            setState((prev) => ({ ...prev, id: getUuidv4(), imageColorHue: getRandomImageColorHue() }))
        }
        return () => {
            setState({ ...initialState })
        }
    }, [])

    useEffect(() => {
        if (isFocused && id && myWorkerId && appState == 'active') {
            ;(async () => {
                try {
                    const lockResult = await checkLockOfTarget({
                        myWorkerId: myWorkerId ?? 'no-id',
                        targetId: id ?? 'no-id',
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
                        myWorkerId: myWorkerId ?? 'no-id',
                        targetId: id ?? 'no-id',
                        modelType: 'company',
                    })
                    return _update
                })(),
                LOCK_INTERVAL_TIME,
            )
            return () => {
                clearInterval(keepLock)
                updateLockOfTarget({
                    myWorkerId: myWorkerId ?? 'no-id',
                    targetId: id ?? 'no-id',
                    modelType: 'company',
                    unlock: true,
                })
            }
        }
    }, [id, myWorkerId, appState, isFocused])

    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    const _updatePartnerCompanyListCache = async (company: CompanyType) => {
        const __cachedKey = genKeyName({
            screenName: 'PartnerCompanyList',
            accountId: accountId,
            companyId: myCompanyId as string,
        })
        const partnerCompanyListCacheData = await getCachedData<PartnerCompanyListType>(__cachedKey)
        if (partnerCompanyListCacheData.success) {
            const targetCompany = partnerCompanyListCacheData.success.companies?.find((item) => item.companyId == company.companyId)
            if (targetCompany) {
                const newCompanies = partnerCompanyListCacheData.success.companies?.map((item) => {
                    if (item.companyId == company.companyId) {
                        return toCompanyCLType(company)
                    } else {
                        return item
                    }
                })
                partnerCompanyListCacheData.success.companies = newCompanies
            } else {
                partnerCompanyListCacheData.success.companies?.push(toCompanyCLType(company))
            }
            partnerCompanyListCacheData.success.updatedAt = Number(new Date())
        }
        await updateCachedData({
            key: __cachedKey,
            value: partnerCompanyListCacheData.success,
        })
    }

    const _writeFakeCompany = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: myWorkerId ?? 'no-id',
                targetId: id ?? 'no-id',
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
            const updateData = {
                id,
                myCompanyId,
                image,
                name,
                address,
                ownerName,
                ownerEmail,
                ownerPhoneNumber,
                industry,
                imageColorHue,
                imageUrl,
                sImageUrl,
                xsImageUrl,
            }
            const newCompany: CompanyType = {
                companyId: id,
                name,
                address,
                ownerEmail,
                ownerName,
                ownerPhoneNumber,
                industry,
                imageUrl,
                sImageUrl,
                xsImageUrl,
                imageColorHue,
                isFake: true,
                companyPartnership: 'fake-partner',
                updatedAt: Number(new Date()),
            }
            await _updatePartnerCompanyListCache(newCompany)
            const result = await writeFakeCompany(updateData)
            if (isFocused) {
                dispatch(setLoading(false))
            }
            if (result.error) {
                throw {
                    error: result.error,
                }
            }

            if (result.success == 'create') {
                dispatch(
                    setToastMessage({
                        text: t('admin:ATemporaryCompanyWasCreated'),
                        type: 'success',
                    } as ToastMessage),
                )

                if (route.params?.routeNameFrom === 'AdminHome' || route.params?.routeNameFrom === 'ContractingProjectList') {
                    const getFakeCompanyResult: CustomResponse<GetFakeCompanyResponse | undefined> = await getFakeCompany({
                        id,
                        myCompanyId,
                    })
                    if (getFakeCompanyResult.error) {
                        throw {
                            error: getFakeCompanyResult.error,
                        }
                    }

                    navigation.replace('CreateProject', { company: toCompanyCLType(getFakeCompanyResult.success), targetDate: route.params?.targetDate })

                    return
                }
            } else {
                dispatch(
                    setToastMessage({
                        text: t('admin:TemporaryCompanyEdited'),
                        type: 'success',
                    } as ToastMessage),
                )
            }
            /**
             * usecaseにて以下定義の関数をここで実行。
             * PartnerCompanyCaseにて、updatePartnerCompanyListCacheOnWriteCompany := (引数: 上のupdateData) => 返り値: なし = {
             *      1. PartnerCompanyListのキャッシュ取得
             *      2. そのキャッシュデータにupdateDataを入れて良い感じに整形する。
             *      3. 整形したデータでPartnerCompanyListのキャッシュ更新
             * }
             *
             * SelectCompanyも同様
             */
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
                style={{ marginTop: 30 }}
                required={true}
                title={t('admin:CompanyName')}
                value={name}
                placeholder={PLACEHOLDER.COMPANY_NAME}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, name: value }))
                }}
            />
            <InputTextBox
                style={{ marginTop: 30 - dMarginTop }}
                title={t('common:EmailAddress')}
                placeholder={PLACEHOLDER.EMAIL}
                validation={'email'}
                value={ownerEmail}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, ownerEmail: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, ownerEmail: undefined }))
                }}
            />
            <InputTextBox
                style={{ marginTop: 30 - dMarginTop }}
                title={t('admin:NameOfIncharge')}
                value={ownerName}
                placeholder={PLACEHOLDER.PERSON_NAME}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, ownerName: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, ownerName: undefined }))
                }}
            />
            <InputTextBox
                style={{ marginTop: 30 - dMarginTop }}
                validation={'phone'}
                title={t('admin:PhoneNumber')}
                value={ownerPhoneNumber}
                placeholder={PLACEHOLDER.COMPANY_PHONE}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, ownerPhoneNumber: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, ownerPhoneNumber: undefined }))
                }}
            />
            <InputTextBox
                style={{ marginTop: 30 - dMarginTop }}
                title={t('common:Address')}
                value={address}
                placeholder={PLACEHOLDER.ADDRESS}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, address: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, address: undefined }))
                }}
            />
            <InputTextBox
                style={{ marginTop: 30 - dMarginTop }}
                required={false}
                title={t('admin:Industry')}
                value={industry}
                placeholder={PLACEHOLDER.INDUSTRY}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, industry: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, industry: undefined }))
                }}
            />

            <AppButton
                style={{
                    marginTop: 40,
                    marginHorizontal: 20,
                }}
                disabled={disable}
                title={mode == 'edit' ? t('common:Save') : t('common:Create')}
                onPress={() => {
                    _writeFakeCompany()
                }}
            />
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default EditFakeCompany

const styles = StyleSheet.create({})
