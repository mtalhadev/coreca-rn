import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, StyleSheet, Pressable, AppState } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { InputTextBox } from '../../components/organisms/inputBox/InputTextBox'
import { AppButton } from '../../components/atoms/AppButton'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { ImageIcon } from '../../components/organisms/ImageIcon'
import { FontStyle } from '../../utils/Styles'
import { LOCK_INTERVAL_TIME, PLACEHOLDER, THEME_COLORS } from '../../utils/Constants'
import { getRandomImageColorHue, getUuidv4, pickImage, resizeImage } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { BottomMargin } from '../../components/atoms/BottomMargin'
import { _createWorker, _getWorker, _updateWorker } from '../../services/worker/WorkerService'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import { setLoading, setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { StoreType } from '../../stores/Store'
import { setBelongCompanyId } from '../../stores/AccountSlice'
import { _getCompany } from '../../services/company/CompanyService'
import isEmpty from 'lodash/isEmpty'
import { getSameNameWorkers, writeMyWorker } from '../../usecases/worker/MyWorkerCase'
import { checkSignInAndSetToStore } from '../../usecases/account/LoginSignUpCase'
import { checkLockOfTarget, updateLockOfTarget } from '../../usecases/lock/CommonLockCase'
import { useIsFocused } from '@react-navigation/native'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../fooks/useUnmount'
import { useTextTranslation } from './../../fooks/useTextTranslation'

type NavProps = StackNavigationProp<RootStackParamList, 'CreateOwnerWorker'>
type RouteProps = RouteProp<RootStackParamList, 'CreateOwnerWorker'>

type InitialStateType = {
    title: string
    disable: boolean
} & MyWorkerUIType

const initialState: InitialStateType = {
    title: '保存して次へ',
    disable: false,
    imageColorHue: getRandomImageColorHue(),
}

export type MyWorkerUIType = {
    name?: string
    nickname?: string
    phoneNumber?: string | undefined
    image?: ImageInfo | undefined
    imageUrl?: string
    sImageUrl?: string
    xsImageUrl?: string
    imageColorHue?: number
}

const CreateOwnerWorker = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const [{ title, name, phoneNumber, image, disable, imageUrl, sImageUrl, xsImageUrl, imageColorHue }, setState] = useState(initialState)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    let companyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const [appState, setAppState] = useState(AppState.currentState)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    useEffect(() => {
        if (isEmpty(name)) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [name])

    useEffect(() => {
        return () => {
            setState({ ...initialState })
        }
    }, [])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

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

    const updateWorker = async () => {
        try {
            if (companyId == undefined) {
                companyId = getUuidv4()
                dispatch(setBelongCompanyId(companyId))
            }
            if (signInUser == undefined) {
                throw {
                    error: t('common:NoAccountInformationPleaseLogin'),
                } as CustomResponse
            }
            if (signInUser?.workerId == undefined) {
                throw {
                    error: t('common:IncompleteAccountInformationPleaseCreateANew'),
                } as CustomResponse
            }
            dispatch(setLoading('unTouchable'))
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

            const sameNameWorkersResult = await getSameNameWorkers({ name: name as string, companyRole: 'owner' })
            if (sameNameWorkersResult.error) {
                throw {
                    error: t('admin:FailedToGetSameNameWorkers'),
                }
            }
            const sameNameWorkers = sameNameWorkersResult.success

            const result = await writeMyWorker({
                workerId: signInUser.workerId,
                name,
                phoneNumber,
                image,
                imageUrl,
                sImageUrl,
                xsImageUrl,
                imageColorHue,
                companyRole: 'owner',
                companyId,
                isOfficeWorker: true,
            })
            if (result.error) {
                throw {
                    error: result.error,
                } as CustomResponse
            }
            // signUp直後にしsignInUserのonStateChangeが反応しない問題があり、遷移がうまくいかないので、ここで入力する。
            // whetherSetBelongingCompanyをfalseにするのは会社を作成前だとcompanyIdがundefinedと上書きされてしまうので、
            await checkSignInAndSetToStore({
                accountId: signInUser.accountId,
                dispatch,
                isSignUping: true,
            })

            if (result.success != 'no-company') {
                if (result.success == 'update') {
                    dispatch(
                        setToastMessage({
                            text: t('common:PersonalProfileEdited'),
                            type: 'success',
                        } as ToastMessage),
                    )
                } else {
                    dispatch(
                        setToastMessage({
                            text: t('common:PersonalProfileCreated'),
                            type: 'success',
                        } as ToastMessage),
                    )
                }
                navigation.push('AdminHome', {})
            } else {
                navigation.push('CreateMyCompany', { ownerName: name, sameNameWorkers })
            }
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
                        {t('admin:ChangePhoto')}
                    </Text>
                </Pressable>
            </View>
            <InputTextBox
                style={{ marginTop: 30 }}
                required={true}
                title={t('common:YourName')}
                placeholder={PLACEHOLDER.PERSON_NAME}
                value={name}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, name: value }))
                }}
            />
            <InputTextBox
                style={{ marginTop: 30 }}
                validation={'phone'}
                required={false}
                title={t('common:PhoneNumber')}
                value={phoneNumber}
                placeholder={PLACEHOLDER.MOBILE_PHONE}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, phoneNumber: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, phoneNumber: undefined }))
                }}
            />
            <AppButton
                style={{
                    marginTop: 40,
                    marginHorizontal: 20,
                }}
                disabled={disable}
                title={title}
                onPress={async () => {
                    updateWorker()
                }}
            />
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default CreateOwnerWorker

const styles = StyleSheet.create({})
