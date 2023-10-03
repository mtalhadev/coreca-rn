import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Pressable, Linking } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { DefaultStackType, RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { InputTextBox } from '../../../../components/organisms/inputBox/InputTextBox'
import { AppButton } from '../../../../components/atoms/AppButton'
import { FontStyle, ColorStyle } from '../../../../utils/Styles'
import { THEME_COLORS } from '../../../../utils/Constants'
import { TextInput } from 'react-native-gesture-handler'
import { NavButton } from '../../../../components/atoms/NavButton'
import { InviteHeader } from '../../../../components/organisms/InviteHeader'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { getInviteUrl, GetInviteWorkerUrlParam } from '../../../../usecases/worker/InviteMyWorkerCase'
import { StoreType } from '../../../../stores/Store'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { useIsFocused } from '@react-navigation/native'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'

type NavProps = StackNavigationProp<RootStackParamList, 'InviteMyWorker'>
type RouteProps = RouteProp<RootStackParamList, 'InviteMyWorker'>

type InitialStateType = {
    invitationUrl: string
    guidance: string
    metroPort: string
}

const initialState: InitialStateType = {
    invitationUrl: 'https://coreca.jp/inviteWorker/xousfXuofa987a',
    guidance: '＊招待時にアカウントが新規作成されます。',
    metroPort: '8081',
}

const InviteMyWorker = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const workerId = route.params?.workerId
    const workerName = route.params?.workerName
    const workerNickname = route.params?.workerNickname

    const [{ invitationUrl, guidance, metroPort }, setState] = useState(initialState)

    useEffect(() => {
        navigation.setOptions({
            title: t('common:InviteToApp'),
        })
    }, [navigation])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        ;(async () => {
            try {
                const result = await getInviteUrl({ myCompanyId, workerId, workerName, workerNickname, metroPort } as GetInviteWorkerUrlParam)
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
        <KeyboardAwareScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: '#fff' }} keyboardShouldPersistTaps={'always'}>
            <InviteHeader invitationUrl={invitationUrl} guidance={guidance} onPortChanged={(port) => setState((prev) => ({ ...prev, metroPort: port ?? '' }))} />
        </KeyboardAwareScrollView>
    )
}
export default InviteMyWorker

const styles = StyleSheet.create({})
