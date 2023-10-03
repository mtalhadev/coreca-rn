import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Pressable, Linking, ScrollView } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { DefaultStackType, RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { InputTextBox } from '../../../../components/organisms/inputBox/InputTextBox'
import { AppButton } from '../../../../components/atoms/AppButton'
import { FontStyle, ColorStyle, GlobalStyles } from '../../../../utils/Styles'
import { THEME_COLORS } from '../../../../utils/Constants'
import { TextInput } from 'react-native-gesture-handler'
import { NavButton } from '../../../../components/atoms/NavButton'
import { InviteHeader } from '../../../../components/organisms/InviteHeader'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { StoreType } from '../../../../stores/Store'
import { GetInviteCompanyUrlParam, getInviteUrl } from '../../../../usecases/company/InviteCompanyCase'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useIsFocused } from '@react-navigation/native'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'

import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { preventAutoHideAsync } from 'expo-splash-screen'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    invitationUrl: string
    guidance: string
    metroPort: string
}

const initialState: InitialStateType = {
    invitationUrl: 'https://coreca.jp/invite/xousfXuofa987afso',
    guidance: '＊URLは相手企業のアプリ登録状況に関わらず使用できます。',
    metroPort: '8081',
}

const InviteCompany = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)

    const [{ invitationUrl, guidance, metroPort }, setState] = useState(initialState)

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        navigation.setOptions({
            title: t('admin:RegisterANewCompany'),
        })
    }, [navigation])

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        ;(async () => {
            try {
                const result = await getInviteUrl({ myCompanyId: myCompanyId, metroPort: metroPort } as GetInviteCompanyUrlParam)
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                setState({ ...initialState, invitationUrl: result.success as string, metroPort })
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
    }, [metroPort])

    return (
        <KeyboardAwareScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: '#fff', flex: 1 }} keyboardShouldPersistTaps={'always'}>
            <ScrollView>
                <InviteHeader
                    style={{
                        backgroundColor: '#fff',
                        paddingBottom: 40,
                    }}
                    invitationUrl={invitationUrl}
                    guidance={guidance}
                    onPortChanged={(port) => setState((prev) => ({ ...prev, metroPort: port ?? '' }))}
                />
            </ScrollView>
        </KeyboardAwareScrollView>
    )
}
export default InviteCompany

const styles = StyleSheet.create({})
