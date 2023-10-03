import React, { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'
import { AppButton } from '../../../components/atoms/AppButton'
import { UserInfoForInquiry } from '../../../components/template/UserInfoForInquiry'
import { sendInquiry } from '../../../usecases/inquiry/InquiryCase'
import { UserInfoForInquiryType } from '../../../models/_others/Inquiry'
import { useDispatch } from 'react-redux'
import { setLoading, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { RootStackParamList } from '../../Router'
import { useTextTranslation } from './../../../fooks/useTextTranslation'
import isEmpty from 'lodash/isEmpty'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { getAnyCompanyProfileWithOwnerWorker, GetAnyCompanyProfileWithOwnerWorkerParam, GetAnyCompanyProfileWithOwnerWorkerResponse } from '../../../usecases/company/CommonCompanyCase'
import { getErrorToastMessage } from '../../../services/_others/ErrorService'
import { ifIphoneX } from 'react-native-iphone-screen-helper'
import { WorkerCLType } from '../../../models/worker/Worker'
import { CompanyCLType } from '../../../models/company/Company'

type NavProps = StackNavigationProp<RootStackParamList, 'BillingInquiry'>
type RouteProps = RouteProp<RootStackParamList, 'BillingInquiry'>

type InitialStateType = {
    worker?: WorkerCLType
    company?: CompanyCLType
}

const initialState: InitialStateType = {}

const BillingInquiry = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const isFocused = useIsFocused()
    const dispatch = useDispatch()
    const [{ worker, company }, setState] = useState(initialState)

    const userData = route.params ?? {}
    const companyId = userData.company?.companyId
    const workerId = userData.workerId

    useEffect(() => {
        if (userData.worker === undefined || userData.company === undefined) {
            ;(async () => {
                try {
                    if (isEmpty(companyId) && isEmpty(workerId)) {
                        return
                    }
                    if (isFocused) dispatch(setLoading(true))

                    const companyResult: CustomResponse<GetAnyCompanyProfileWithOwnerWorkerResponse> = await getAnyCompanyProfileWithOwnerWorker({
                        companyId,
                        myCompanyId: companyId,
                        myWorkerId: workerId,
                    })

                    if (companyResult.error || companyResult.success == undefined || companyResult.success?.company == undefined) {
                        throw {
                            error: companyResult.error,
                        }
                    }

                    setState((prev) => ({ ...prev, company: companyResult?.success?.company, worker: companyResult.success?.worker }))
                } catch (error) {
                    const _error = error as CustomResponse
                    dispatch(
                        setToastMessage({
                            text: getErrorToastMessage(_error),
                            type: 'error',
                        } as ToastMessage),
                    )
                } finally {
                    if (isFocused) {
                        dispatch(setLoading(false))
                    }
                }
            })()
        }
    }, [])

    const userInfo: UserInfoForInquiryType = {
        workerData: {
            name: userData?.worker?.name ?? worker?.name,
            mailAddress: userData?.worker?.account?.email ?? worker?.account?.email,
            phoneNumber: userData.worker?.phoneNumber ?? worker?.phoneNumber,
        },
        companyData: {
            address: userData.company?.address ?? company?.address,
            name: userData?.company?.name ?? company?.name,
            phoneNumber: userData.company?.phoneNumber ?? company?.phoneNumber,
        },
        inquiryType: 'billing',
    }
    const phoneNumber = userInfo.companyData.phoneNumber ?? userInfo.workerData.phoneNumber
    const _submitInquiry = useCallback(async () => {
        if (
            userInfo.companyData.address !== undefined &&
            userInfo.workerData.name !== undefined &&
            userInfo.companyData.name !== undefined &&
            phoneNumber !== undefined &&
            userInfo.workerData.mailAddress !== undefined
        ) {
            const sendResult = await sendInquiry(userInfo)
            if (sendResult.success) {
                dispatch(
                    setToastMessage({
                        text: t('admin:InquirySent'),
                        type: 'success',
                    }),
                )
            } else {
                dispatch(
                    setToastMessage({
                        text: t('admin:InquiryFailed'),
                        type: 'error',
                    }),
                )
            }
        } else {
            const toastMessageName = userInfo.workerData.name !== undefined ? '' : t('common:Name')
            const toastMessageAddress = userInfo.companyData.address !== undefined ? '' : t('common:Address')
            const toastMessageCompanyName = userInfo.companyData.name !== undefined ? '' : t('common:TradeName')
            const toastMessagePhoneNumber = phoneNumber !== undefined ? '' : t('common:PhoneNumber')
            const toastMailAddress = userInfo.workerData.mailAddress !== undefined ? '' : t('common:EmailAddress')
            dispatch(
                setToastMessage({
                    text: toastMessageName + toastMessageAddress + toastMessageCompanyName + toastMessagePhoneNumber + toastMailAddress + t('admin:EnterOnYourOwnPage'),
                    type: 'error',
                }),
            )
        }
    }, [])
    return (
        <View
            style={{
                flex: 1,
            }}>
            <UserInfoForInquiry workerData={userInfo.workerData} companyData={userInfo.companyData} />
            <AppButton
                style={{
                    margin: 40,
                }}
                title={t('admin:SubmitAnInquiry')}
                onPress={() => {
                    _submitInquiry()
                }}
            />
        </View>
    )
}
export default BillingInquiry
