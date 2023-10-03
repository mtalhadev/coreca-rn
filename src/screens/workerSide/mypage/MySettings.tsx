import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, ScrollView, Linking, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { ColumnBox } from '../../../components/atoms/ColumnBox'
import { AppButton } from '../../../components/atoms/AppButton'
import { GreenColor } from '../../../utils/Styles'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { signOut } from '../../../usecases/account/CommonAuthCase'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { PRIVACY_POLICY_URL, SPECIFIED_COMMERCIAL_URL, THEME_COLORS, WORKER_TERMS_OF_SERVICE_URL } from '../../../utils/Constants'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { ScrollViewInstead } from '../../../components/atoms/ScrollViewInstead'
import { useIsFocused } from '@react-navigation/native'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { StoreType } from '../../../stores/Store'
import { useTextTranslation } from './../../../fooks/useTextTranslation'
import { resetAllCachedData } from '../../../usecases/CachedDataCase'
import Constants from 'expo-constants'
import { useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { setIsLoggingOff } from '../../../stores/AccountSlice'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    id: string
}

const initialState: InitialStateType = {
    id: '',
}
const MySettings = () => {
    const { t, i18n } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ id }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)

    useEffect(() => {
        if (isFocused && !isNavUpdating) {
            dispatch(setIsNavUpdating(true))
        }
        return () => {
            dispatch(setIsNavUpdating(false))
        }
    }, [isFocused])
    useSafeLoadingUnmount(dispatch, isFocused)
    const _signOut = async () => {
        try {
            const result = await signOut()
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            dispatch(setLocalUpdateScreens([]))
            dispatch(
                setToastMessage({
                    text: `${t('common:logout')}`,
                    type: 'success',
                } as ToastMessage),
            )

            dispatch(setIsLoggingOff(true))
            navigation.push('Launch', {})
            dispatch(setLocalUpdateScreens([]))
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

    const __deleteCache = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            const result = await resetAllCachedData()
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
            dispatch(
                setToastMessage({
                    text: `${t('worker:chacheDeleted')}`,
                    type: 'success',
                } as ToastMessage),
            )
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
        <ScrollViewInstead
            style={{
                paddingTop: 30,
            }}>
            <ColumnBox
                title={t('common:TermsOfUse')}
                hasContent={false}
                onPress={() => {
                    Linking.openURL(WORKER_TERMS_OF_SERVICE_URL)
                }}
            />
            <ColumnBox
                title={t('common:PrivacyPolicy')}
                hasContent={false}
                onPress={() => {
                    Linking.openURL(PRIVACY_POLICY_URL)
                }}
            />
            <ColumnBox
                title={t('common:SpecialCommercialTransactionAct')}
                hasContent={false}
                onPress={() => {
                    Linking.openURL(SPECIFIED_COMMERCIAL_URL)
                }}
            />
            <ColumnBox
                title={t('common:License')}
                hasContent={false}
                onPress={() => {
                    navigation.push('Licenses', {})
                }}
            />
            {/* <ColumnBox
                title={t('common:Language')}
                hasContent={false}
                onPress={() => {
                    navigation.push('LanguageSelector', {})
                }}
            /> */}

            <ColumnBox
                style={{
                    marginTop: 30,
                }}
                hasContent={false}
                title={`${t('common:Version')}  ${Constants.expoConfig?.version}`}
            />
            <ColumnBox
                style={
                    {
                        // marginTop: 20,
                    }
                }
                textStyle={{
                    color: THEME_COLORS.OTHERS.LIGHT_GRAY,
                }}
                hasContent={false}
                title={`${t('common:RunTime')}  ${Constants.expoConfig?.runtimeVersion}`}
            />

            <View
                style={{
                    marginTop: 50,
                    marginHorizontal: 10,
                }}>
                <AppButton
                    color={GreenColor}
                    style={{
                        marginTop: 10,
                    }}
                    title={t('common:Logout')}
                    height={35}
                    fontSize={12}
                    onPress={() => {
                        _signOut()
                    }}
                    hasShadow={false}
                    // isGray={true}
                />
                <AppButton
                    color={GreenColor}
                    style={{
                        marginTop: 10,
                    }}
                    hasShadow={false}
                    onPress={() => {
                        navigation.push('WSelectAccount', {})
                    }}
                    title={t('common:SwitchAccount')}
                    height={35}
                    fontSize={12}
                    // isGray={true}
                />

                <AppButton
                    style={{
                        marginTop: 25,
                    }}
                    title={t('worker:Resetcache')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(`${t('worker:deletedConfirmation')}`, `${t('worker:deletedConfirmationUndone')}`, [
                            { text: `${t('worker:deletion')}`, onPress: () => __deleteCache() },
                            {
                                text: `${t('worker:cancel')}`,
                                style: 'cancel',
                            },
                        ])
                    }}
                />
            </View>
            <BottomMargin />
        </ScrollViewInstead>
    )
}
export default MySettings

const styles = StyleSheet.create({})
