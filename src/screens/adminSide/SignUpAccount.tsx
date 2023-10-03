//
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { StyleSheet, Text, View } from 'react-native'
import { InputTextBox } from '../../components/organisms/inputBox/InputTextBox'
import { AppButton } from '../../components/atoms/AppButton'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { setLoading, setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { BottomMargin } from '../../components/atoms/BottomMargin'
import { loginOrSignUp } from '../../usecases/account/LoginSignUpCase'
import { PLACEHOLDER, THEME_COLORS } from '../../utils/Constants'
import isEmpty from 'lodash/isEmpty'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import { GlobalStyles } from '../../utils/Styles'
import { Line } from '../../components/atoms/Line'
import { checkPlanTicketValid, writePlanTicket } from '../../usecases/planTicket/CommonPlanTicketCase'
import { StoreType } from '../../stores/Store'
import { setPlanTicketId } from '../../stores/AccountSlice'
import { getUuidv4, openInviteUrl } from '../../utils/Utils'
import { dayBaseTextWithoutDate, newCustomDate } from '../../models/_others/CustomDate'
import { useTextTranslation } from './../../fooks/useTextTranslation'
import ENV from '../../../env/env'
import { setUrlScheme } from '../../stores/NavigationSlice'
import * as Linking from 'expo-linking'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    title: string
    email?: string
    password?: string
    invitedUrl?: string
    planTicketId?: string
    alreadySent: boolean
    disable: boolean
}

const SignUpAccount = () => {
    const { t } = useTextTranslation()

    const initialState: InitialStateType = {
        title: t('admin:CreateOwnerAccount'),
        alreadySent: false,
        disable: true,
    }
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const urlScheme = useSelector((state: StoreType) => state.nav.urlScheme)
    const [{ title, email, password, planTicketId, alreadySent, disable, invitedUrl }, setState] = useState(initialState)

    useEffect(() => {
        if (ENV.IS_PLAN_TICKET_AVAILABLE) {
            if (isEmpty(email) || isEmpty(password) || (isEmpty(urlScheme) && isEmpty(planTicketId))) {
                setState((prev) => ({ ...prev, disable: true }))
                return
            }
        } else {
            if (isEmpty(email) || isEmpty(password)) {
                setState((prev) => ({ ...prev, disable: true }))
                return
            }
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [email, password, urlScheme, planTicketId])

    useEffect(() => {
        return () => {
            setState({ ...initialState })
        }
    }, [])

    const _signUp = async () => {
        try {
            if (ENV.IS_PLAN_TICKET_AVAILABLE) {
                if (urlScheme == undefined && planTicketId == undefined) {
                    return
                }

                if (urlScheme != undefined) {
                    //dispatch(setUrlScheme(Linking.parse(invitedUrl)))
                } else if (planTicketId != undefined) {
                    const planTicketResult = await checkPlanTicketValid({
                        planTicketId: planTicketId,
                    })
                    if (planTicketResult.error) {
                        throw {
                            error: planTicketResult.error,
                            errorCode: planTicketResult.errorCode,
                        }
                    }
                    if (planTicketResult.success == false) {
                        throw {
                            error: t('admin:ThePaidPlanTicketIsInvalid'),
                            errorCode: 'INVALID_TICKET',
                        }
                    }
                    dispatch(setPlanTicketId(planTicketId))
                }
                // } else {
                //     if (invitedUrl) {
                //         dispatch(setUrlScheme(Linking.parse(invitedUrl)))
                //     }
            }
            dispatch(setLoading('unTouchable'))
            const result = await loginOrSignUp({ email, password, invitedUrl, dispatch })
            dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: 'SIGN_UP_ERROR',
                }
            }
            if (result.success == 'signup') {
                /**
                 * 新規作成の一般ルート
                 */
                // 招待URLの有無で遷移先を変更する
                if (invitedUrl != undefined) {
                    openInviteUrl(invitedUrl)
                } else {
                    navigation.push('CreateOwnerWorker', {})
                }

                return
            } else if (result.success == 'no-worker') {
                /**
                 * アカウント作成が途中で作業員がいない場合。
                 */
                navigation.push('CreateOwnerWorker', {})
                return
            } else if (result.success == 'no-company') {
                /**
                 * アカウント作成を途中でやめた場合に発生するルート
                 */
                navigation.push('CreateMyCompany', {})
                return
            } else if (result.success == 'admin-side-login') {
                /**
                 * アカウントが存在する場合に発生。
                 */
                dispatch(
                    setToastMessage({
                        text: t('common:AnAccountAlreadyExistsYouHaveLoggedIn'),
                        type: 'info',
                    } as ToastMessage),
                )
                navigation.push('AdminHome', {})
                return
            } else {
                throw {
                    error: '不明のエラー',
                    errorCode: 'UNDEFINED_ERROR',
                }
            }
        } catch (error) {
            dispatch(setLoading(false))
            const _error = error as CustomResponse
            setState((prev) => ({
                ...prev,
                title: t('admin:CreateOwnerAccount'),
                disable: false,
            }))
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    const __writePlanTicket = async () => {
        try {
            const planStartDate = newCustomDate()
            const planEndDate = undefined
            const paidPlan = 'paid'
            const planTicketId = getUuidv4()
            const result = await writePlanTicket({
                planTicketId,
                paidPlan,
                planStartDate,
                planEndDate,
                forDev: true,
            })
            if (result.error) {
                throw result.error
            }
            setState((prev) => ({
                ...prev,
                planTicketId,
            }))
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
                validation={'email'}
                required={true}
                title={t('common:EmailAddress')}
                placeholder={PLACEHOLDER.EMAIL}
                value={email}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, email: value }))
                }}
            />
            <InputTextBox
                style={{ marginTop: 30 }}
                validation={'password'}
                required={true}
                title={t('common:Password')}
                placeholder={PLACEHOLDER.PASSWORD}
                value={password}
                infoText={t('common:PasswordCondition')}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, password: value }))
                }}
            />
            {!ENV.IS_PLAN_TICKET_AVAILABLE && (
                <InputTextBox
                    style={{ marginTop: 30 }}
                    required={false}
                    title={t('common:InvitationUrl')}
                    placeholder={PLACEHOLDER.INVITE_URL}
                    value={invitedUrl}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, invitedUrl: value }))
                    }}
                />
            )}
            {ENV.IS_PLAN_TICKET_AVAILABLE && (
                <View>
                    <Line
                        style={{
                            marginTop: 25,
                        }}
                    />
                    <Text
                        style={{
                            ...GlobalStyles.smallText,
                            marginTop: 10,
                            marginLeft: 20,
                            marginRight: 20,
                            color: THEME_COLORS.BLUE.MIDDLE,
                        }}>
                        {t('common:ToUseCorecaWithoutInvitation')}
                    </Text>
                    <InputTextBox
                        style={{ marginTop: 30 }}
                        title={t('common:PaidPlanTicketId')}
                        value={planTicketId}
                        required={true}
                        placeholder={t('common:EnterId')}
                        infoText={t('common:IssueFromCorecaSalesRepresentative')}
                        onValueChangeValid={(value) => {
                            setState((prev) => ({ ...prev, planTicketId: value }))
                        }}
                    />
                </View>
            )}

            <AppButton
                style={{
                    marginTop: 40,
                    marginHorizontal: 20,
                }}
                disabled={disable}
                title={title}
                onPress={() => {
                    _signUp()
                }}
            />
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default SignUpAccount

const styles = StyleSheet.create({})
