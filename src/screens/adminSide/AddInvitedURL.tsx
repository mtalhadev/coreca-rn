//
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { StyleSheet } from 'react-native'
import { InputTextBox } from '../../components/organisms/inputBox/InputTextBox'
import { AppButton } from '../../components/atoms/AppButton'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import {} from '../../stores/AccountSlice'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { setLoading, setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { BottomMargin } from '../../components/atoms/BottomMargin'
import { PLACEHOLDER } from '../../utils/Constants'
import isEmpty from 'lodash/isEmpty'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import { openInviteUrl } from '../../utils/Utils'
import { useTextTranslation } from './../../fooks/useTextTranslation'
import ENV from '../../../env/env'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    url?: string
    disable: boolean
}

const initialState: InitialStateType = {
    disable: true,
}

const WAddInvitedURL = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const [{ url, disable }, setState] = useState(initialState)

    useEffect(() => {
        if (isEmpty(url)) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [url])

    useEffect(() => {
        return () => {
            setState({ ...initialState })
        }
    }, [])

    const _setInviteUrl = async () => {
        try {
            if (url == undefined) {
                return
            }

            openInviteUrl(url)

            /*
            const __url = Linking.parse(url)
            dispatch(setUrlScheme(__url))
            navigation.push('WSignUpAccount', {})
            */
        } catch (error) {
            dispatch(setLoading(false))
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }
    const { t } = useTextTranslation()

    return (
        <KeyboardAwareScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={'always'}>
            <>
                <InputTextBox
                    style={{ marginTop: 30 }}
                    required={true}
                    title={t('common:InvitationUrl')}
                    placeholder={PLACEHOLDER.INVITE_URL}
                    value={url}
                    infoText={t('common:MustBeInvited')}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, url: value }))
                    }}
                />

                <AppButton
                    style={{
                        marginTop: 40,
                        marginHorizontal: 20,
                    }}
                    disabled={disable}
                    title={t('common:ReceiveInvitation')}
                    onPress={() => {
                        _setInviteUrl()
                    }}
                />
                {ENV.IS_PLAN_TICKET_AVAILABLE && (
                    <AppButton
                        style={{
                            marginTop: 20,
                            marginHorizontal: 20,
                        }}
                        title={t('common:ClickHerePaidPlanTicket')}
                        onPress={() => {
                            navigation.push('SignUpAccount', {})
                        }}
                    />
                )}
                <BottomMargin />
            </>
        </KeyboardAwareScrollView>
    )
}
export default WAddInvitedURL

const styles = StyleSheet.create({})
