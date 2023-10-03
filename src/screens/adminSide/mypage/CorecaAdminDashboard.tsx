import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Linking, Alert } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { ColumnBox } from '../../../components/atoms/ColumnBox'
import { AppButton } from '../../../components/atoms/AppButton'
import { ScrollView } from 'react-native-gesture-handler'
import { BottomMargin } from '../../../components/atoms/BottomMargin'
import { checkIsCompanyOwner, CheckIsCompanyOwnerResponse, signOut } from '../../../usecases/account/CommonAuthCase'
import { CustomResponse } from '../../../models/_others/CustomResponse'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../stores/UtilSlice'
import { StoreType } from '../../../stores/Store'
import isEmpty from 'lodash/isEmpty'
import { _deleteLoginAccountAndLocalAccount, _deleteLocalAccount } from '../../../services/account/AccountService'
import { _deleteCompany } from '../../../services/company/CompanyService'
import { COMPANY_TERMS_OF_SERVICE_URL, PRIVACY_POLICY_URL, SPECIFIED_COMMERCIAL_URL, THEME_COLORS } from '../../../utils/Constants'
import { getErrorMessage, getErrorToastMessage } from '../../../services/_others/ErrorService'
import { ScrollViewInstead } from '../../../components/atoms/ScrollViewInstead'
import { useIsFocused } from '@react-navigation/native'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { _getCurrentUser } from '../../../services/firebase/AuthService'
import { resetAllCachedData } from '../../../usecases/CachedDataCase'
import Constants from 'expo-constants'
import { useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { _callFunctions } from '../../../services/firebase/FunctionsService'
import { makeAllRoomForChat } from '../../../usecases/chat/ChatBatchCase'

type NavProps = StackNavigationProp<RootStackParamList, 'CorecaAdminDashboard'>
type RouteProps = RouteProp<RootStackParamList, 'CorecaAdminDashboard'>

type InitialStateType = {
    isOwner?: boolean
    isCorecaAdmin?: boolean
}

const initialState: InitialStateType = {
    //
}
const CorecaAdminDashboard = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ isOwner, isCorecaAdmin }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const { t } = useTextTranslation()

    useEffect(() => {
        return () => setState(initialState)
    }, [myCompanyId])

    useEffect(() => {
        if (isFocused && !isNavUpdating) {
            dispatch(setIsNavUpdating(true))
        }
        return () => {
            dispatch(setIsNavUpdating(false))
        }
    }, [isFocused])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(myCompanyId)) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const result: CustomResponse<CheckIsCompanyOwnerResponse> = await checkIsCompanyOwner({
                    workerId: signInUser?.workerId,
                    myCompanyId,
                })

                if (isFocused) dispatch(setLoading(false))
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                setState((prev) => ({ ...prev, isOwner: result.success?.isOwner, isCorecaAdmin: result.success?.isCorecaAdmin }))
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
    }, [signInUser, myCompanyId])

    useEffect(() => {
        if (isOwner != true || isCorecaAdmin != true) {
            navigation.push('AdminHomeRouter', {})
        }
    }, [isOwner, isCorecaAdmin])

    return (
        <ScrollViewInstead
            style={{
                paddingTop: 30,
            }}>
            <View
                style={{
                    marginHorizontal: 10,
                }}>
                <AppButton
                    style={{
                        marginTop: 10,
                    }}
                    title={t('common:ResetAllDateData')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('common:DoYouWantToResetAllDBDateData'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:Reset'),
                                onPress: async () => {
                                    const result = await _callFunctions('DateDataSSG-updateAllSiteToCreateDateDataForAdmin', {})
                                    if (result?.error) {
                                        console.log(result.error)
                                        // throw { ...result }
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('common:ResetAllMonthlyProjectData')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('common:DoYouWantToResetTheMonthlyCaseDataForAllDBs'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:Reset'),
                                onPress: async () => {
                                    const result = await _callFunctions('ProjectSSG-updateAllCompanyToCreateMonthlyProjectForAdmin', {})
                                    if (result.error) {
                                        throw { ...result }
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('common:PutApplicationAndApprovalInformationInRequest')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('common:DoYouWantToIncludeApplicationAndApprovalInformationInTheRequestDataOfAllDBs'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:PutInApplicationAndApprovalInformation'),
                                onPress: async () => {
                                    const result = await _callFunctions('IRequest-subscribeRequestIsApplication', {})
                                    if (result.error) {
                                        throw { ...result }
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={'全お知らせ未読数データリセット'}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert('全お知らせ未読数データをリセットしますか？', '＊この操作は元に戻せません。', [
                            {
                                text: 'リセットする',
                                onPress: async () => {
                                    const result = await _callFunctions('INotification-resetAllUnreadNotificationCount', {})
                                    if (result.error) {
                                        throw { ...result }
                                    }
                                },
                            },
                            {
                                text: 'キャンセル',
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('admin:ResetAllMonthlySite')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('admin:DoYouWantToResetAllMonthlySite'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:Reset'),
                                onPress: async () => {
                                    const result = await _callFunctions('SiteSSG-updateAllSiteToCreateMonthlySiteForAdmin', {})
                                    if (result && result.error) {
                                        throw { ...result }
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('admin:ResetAllContractingProjectConstructionList')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('admin:DoYouWantToResetAllContractingProjectConstructionList'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:Reset'),
                                onPress: async () => {
                                    const result = await _callFunctions('ConstructionSSG-updateAllConstructionToCreateSSGForAdmin', {})
                                    if (result && result.error) {
                                        throw { ...result }
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('admin:ResetAllPartnerCompanyList')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('admin:DoYouWantToResetAllPartnerCompanyList'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:Reset'),
                                onPress: async () => {
                                    const result = await _callFunctions('CompanySSG-updateAllCompanyToCreatePartnerCompanyListForAdmin', {})
                                    if (result && result.error) {
                                        throw { ...result }
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('admin:MakeAllChatRooms')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('admin:DoYouWantToMakeAllChatRooms'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:Reset'),
                                onPress: async () => {
                                    const result = await makeAllRoomForChat()
                                    if (result && result.error) {
                                        dispatch(
                                            setToastMessage({
                                                text: result.error,
                                                type: 'error',
                                            }),
                                        )
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('common:ResetAllSiteArrangement')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('common:DoYouWantToResetAllSiteArrangement'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:Reset'),
                                onPress: async () => {
                                    const result = await _callFunctions('ArrangementSSG-updateAllArrangementToCreateSSGDataForAdmin', {})
                                    if (result && result.error) {
                                        throw { ...result }
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('common:ResetAllInvRequestArrangement')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('common:DoYouWantToResetAllInvRequestArrangement'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:Reset'),
                                onPress: async () => {
                                    const result = await _callFunctions('InvRequestSSG-updateAllInvArrToCreateSSGDataForAdmin', {})
                                    if (result && result.error) {
                                        throw { ...result }
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('common:ResetAllInvRequestList')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('common:DoYouWantToResetAllInvRequestList'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:Reset'),
                                onPress: async () => {
                                    const result = await _callFunctions('InvRequestSSG-updateAllMonthInvToCreateSSGDataForAdmin', {})
                                    if (result && result.error) {
                                        throw { ...result }
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('common:DeleteUpdateScreensThatIsNoLongerRequired')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('common:DoYouWantToDeleteUpdateScreensThatIsNoLongerRequired'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:Reset'),
                                onPress: async () => {
                                    const result = await _callFunctions('updateScreens-deleteUnnecessaryUpdateScreensForAdmin', {})
                                    if (result && result.error) {
                                        throw { ...result }
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('admin:UpdateReservationWithConstructionId')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('admin:DoYouWantToUpdateReservationWithConstructionId'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('admin:Update'),
                                onPress: async () => {
                                    const result = await _callFunctions('IReservation-allReservationChangeToInfinity', {})
                                    if (result && result.error) {
                                        dispatch(getErrorToastMessage(getErrorMessage(result)))
                                    }
                                    const result2 = await _callFunctions('IReservation-createReservationWithConstructionId', {})
                                    if (result2 && result2.error) {
                                        dispatch(getErrorToastMessage(getErrorMessage(result2)))
                                    }
                                    const result3 = await _callFunctions('IReservation-reConnectRequestAndReservationId', {})
                                    if (result3 && result3.error) {
                                        dispatch(getErrorToastMessage(getErrorMessage(result3)))
                                    }
                                    const result4 = await _callFunctions('IReservation-deleteAllReservationWithReserveDate', {})
                                    if (result4 && result4.error) {
                                        dispatch(getErrorToastMessage(getErrorMessage(result4)))
                                    }
                                    dispatch(
                                        setToastMessage({
                                            text: 'Done',
                                        }),
                                    )
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('admin:ConfirmationOfAReservationLinkedToARequest')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={async () => {
                        const result = await _callFunctions('IRequest-checkRequestReservation', {})
                        if (result && result.error) {
                            throw { ...result }
                        }
                        if (result.success) {
                            dispatch(
                                setToastMessage({
                                    text: 'No problem',
                                }),
                            )
                        }
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('common:ResetAllMonthlyInvReservation')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('common:DoYouWantToResetAllMonthlyInvReservation'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:Reset'),
                                onPress: async () => {
                                    const result = await _callFunctions('InvReservationSSG-updateAllMonthInvResToCreateSSGDataForAdmin', {})
                                    if (result && result.error) {
                                        throw { ...result }
                                    }
                                    if (result.success) {
                                        dispatch(
                                            setToastMessage({
                                                text: 'Done',
                                            }),
                                        )
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('common:ResetAllMonthlyConstructionRequest')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('common:DoYouWantToResetAllMonthlyConstructionRequest'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:Reset'),
                                onPress: async () => {
                                    const result = await _callFunctions('RequestSSG-updateAllRequestToCreateSSGDataForAdmin', {})
                                    if (result && result.error) {
                                        throw { ...result }
                                    }
                                    if (result.success) {
                                        dispatch(
                                            setToastMessage({
                                                text: 'Done',
                                            }),
                                        )
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('common:AddingASiteDateToASiteWithoutASiteDate')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('common:AddASiteDateToASiteWithoutASiteDate'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:Add'),
                                onPress: async () => {
                                    const result = await _callFunctions('ISite-updateSiteDate', {})
                                    if (result && result.error) {
                                        throw { ...result }
                                    }
                                    if (result.success) {
                                        dispatch(
                                            setToastMessage({
                                                text: 'Done',
                                            }),
                                        )
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('common:CheckToSeeIfAllSitesHaveSiteDate')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={async () => {
                        const result = await _callFunctions('ISite-checkSiteDate', {})
                        if (result && result.error) {
                            throw { ...result }
                        }
                        if (result.success != undefined) {
                            dispatch(
                                setToastMessage({
                                    text: result.success == true ? 'No problem' : 'Problem',
                                }),
                            )
                        }
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('common:ResetAllSiteAttendance')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('common:DoYouWantToResetAllSiteAttendance'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:Reset'),
                                onPress: async () => {
                                    const result = await _callFunctions('SiteAttendanceSSG-updateAllAttendanceToCreateSSGDataForAdmin', {})
                                    if (result && result.error) {
                                        throw { ...result }
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
                <AppButton
                    style={{
                        marginTop: 30,
                    }}
                    title={t('common:ResetAllSiteDateData')}
                    height={35}
                    fontSize={12}
                    isGray={true}
                    onPress={() => {
                        Alert.alert(t('common:DoYouWantToResetAllSiteDateData'), t('common:OperationCannotBeUndone'), [
                            {
                                text: t('common:Reset'),
                                onPress: async () => {
                                    const result = await _callFunctions('SiteDateSSG-updateAllSiteDateToCreateSiteDateForAdmin', {})
                                    if (result && result.error) {
                                        throw { ...result }
                                    }
                                },
                            },
                            {
                                text: t('common:Cancel'),
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
export default CorecaAdminDashboard

const styles = StyleSheet.create({})
