import { AccountType } from '../models/account/Account'
import { _getLocalAccountList, _updateAccount } from '../services/account/AccountService'
import { _getCompany } from '../services/company/CompanyService'
import { _createPartnership, _getPartnershipOfTargetCompanies } from '../services/partnership/PartnershipService'
import { getUuidv4 } from '../utils/Utils'
import { CustomResponse } from '../models/_others/CustomResponse'
import { getErrorMessage, getErrorToastMessage } from '../services/_others/ErrorService'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { StackNavigationProp } from '@react-navigation/stack'
import { setLoading, setToastMessage, ToastMessage } from '../stores/UtilSlice'
import { checkSignInAndSetToStore, loginOrSignUp } from './account/LoginSignUpCase'
import { Dispatch } from 'react'
import { createRoomForPartner } from './chat/ChatBatchCase'

export const getNextRoute = async (currentRoute: string, receivePath: string | undefined, signInUser: AccountType | undefined): Promise<CustomResponse<string[] | undefined>> => {
    try {
        if (__DEV__) {
            receivePath = receivePath?.replace('--/', '')
        }
        if (currentRoute == 'Router') {
            if (receivePath == 'inviteCompany/') {
                const accounts: AccountType[] = await _getLocalAccountList()
                //未ログイン
                if (signInUser == undefined) {
                    if (accounts.length > 0) {
                        return {
                            success: ['SelectAccount'],
                        } as CustomResponse<string[] | undefined>
                    } else {
                        return {
                            success: ['SignUpAccount'],
                        } as CustomResponse<string[] | undefined>
                    }
                } else {
                    return {
                        success: ['CreateOwnerWorker'],
                    } as CustomResponse<string[] | undefined>
                    // if (accounts.length == 1) {
                    //     return {
                    //         success: ['PartnerCompanyList', 'CompanyDetailRouter'],
                    //     } as CustomResponse<string[] | undefined>
                    // }
                    // //２個以上のアカウントを使い分けている場合
                    // else {
                    //     return {
                    //         success: ['SelectAccount'],
                    //     } as CustomResponse<string[] | undefined>
                    // }
                }
            } else if (receivePath == 'inviteWorker/') {
                return {
                    success: ['WSignUpAccount'],
                } as CustomResponse<string[] | undefined>
            }
        } else if (currentRoute == 'SelectAccount') {
            if (receivePath == 'inviteCompany/') {
                return {
                    success: ['PartnerCompanyList', 'CompanyDetailRouter'],
                } as CustomResponse<string[] | undefined>
            } else {
                return {
                    success: ['AdminHome'],
                } as CustomResponse<string[] | undefined>
            }
        } else if (currentRoute == 'EditMyCompany') {
            if (receivePath == 'inviteCompany/') {
                return {
                    success: ['PartnerCompanyList', 'CompanyDetailRouter'],
                } as CustomResponse<string[] | undefined>
            } else {
                return {
                    success: ['AdminHome'],
                } as CustomResponse<string[] | undefined>
            }
        } else {
            //alert(receivePath)
        }
        return new CustomResponse()
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export const createPartnership = async (id?: string, myCompanyId?: string): Promise<CustomResponse<string>> => {
    try {
        if (id == undefined || myCompanyId == undefined) {
            throw {
                error: 'idかmyCompanyIdがありません。',
            } as CustomResponse
        }
        if (id == myCompanyId) {
            throw {
                error: '顧客/取引先宛に発行した招待URLを自社で利用することはできません。',
            } as CustomResponse
        }

        const _partnership = await _getPartnershipOfTargetCompanies({ companyId: id, companyId2: myCompanyId })

        if (!_partnership.success) {
            const result = await _createPartnership({
                partnershipId: getUuidv4(),
                toCompanyId: id,
                fromCompanyId: myCompanyId,
                isAccepted: true,
            })
            if (result.error) {
                throw {
                    error: '会社関係の作成に失敗しました。',
                } as CustomResponse
            }

            const resultRoom = await createRoomForPartner(id, myCompanyId)
            if (resultRoom.error) {
                throw {
                    error: 'チャットルームの作成に失敗しました。',
                } as CustomResponse
            }
        }

        const targetCompany = await _getCompany({ companyId: id })
        if (targetCompany.error) {
            throw {
                error: '会社関係情報の取得に失敗しました。',
            } as CustomResponse
        }

        return {
            success: targetCompany.success?.name as string,
        } as CustomResponse<string>
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const getOnlyCompanyName = async (companyId: string): Promise<CustomResponse<string>> => {
    try {
        const _company = await _getCompany({ companyId })
        if (_company.error) {
            throw {
                error: '会社情報の取得に失敗しました',
            } as CustomResponse
        }

        return {
            success: _company.success?.name,
        } as CustomResponse<string>
    } catch (error) {
        return getErrorMessage(error) as CustomResponse<string>
    }
}

export const setDeviceTokenToAccount = async (accountId: string): Promise<CustomResponse> => {
    if (Device.isDevice == false) {
        return {
            success: true,
        } as CustomResponse<boolean>
    }

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync()
            finalStatus = status
        }
        if (finalStatus !== 'granted') {
            throw {
                error: '通知機能許可の設定に失敗しました',
            }
        }

        let token: string = ''

        try {
            token = (await Notifications.getExpoPushTokenAsync()).data
            //const token = (await Notifications.getDevicePushTokenAsync()).data
            //alert(token)
        } catch (e: any) {
            //alert(e.message)
            throw {
                error: 'デバイストークンの取得に失敗しました。',
            }
        }

        const result = await _updateAccount({
            accountId: accountId,
            token: token,
        })
        if (result.error) {
            throw {
                error: 'デバイストークンの設定に失敗しました',
            }
        }

        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            })
        }

        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        })

        return {
            success: true,
        } as CustomResponse<boolean>
    } catch (error) {
        //alert(error.error)
        return getErrorMessage(error) as CustomResponse<boolean>
    }
}

export const goToNotificationTarget = async (signInUser: AccountType | undefined, navigate: any, data: any, dispatch: Dispatch<any>) => {
    if (signInUser == undefined || signInUser.accountId != data.accountId) {
        const _accounts = await _getLocalAccountList()
        const _account = _accounts.find((acc) => acc.accountId == data.accountId)
        if (_account == undefined) {
            return
        }

        try {
            dispatch(setLoading('unTouchable'))
            const result = await loginOrSignUp({ email: _account.email, password: _account.password, dispatch, dontSignUp: true })
            dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: 'LOGIN_ERROR',
                }
            }
            if (result.success == 'admin-side-login' || result.success == 'worker-side-login') {
                await checkSignInAndSetToStore({
                    accountId: _account.accountId,
                    dispatch,
                })
                dispatch(
                    setToastMessage({
                        text: _account.email + ' で、ログインし直しました。',
                        type: 'success',
                    } as ToastMessage),
                )
                //return
            } else {
                dispatch(
                    setToastMessage({
                        text: 'アカウントが存在しません。新規作成してください。',
                        type: 'error',
                    } as ToastMessage),
                )
            }
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

    // 管理者側
    if (data.screenName == 'ConstructionDetailRouter') {
        navigate(data.screenName, {
            title: data?.param2,
            constructionId: data?.param,
            projectId: data?.param3,
        })
    } else if (data.screenName == 'CompanyDetailRouter') {
        navigate(data.screenName, {
            title: data?.param2,
            companyId: data?.param,
        })
    } else if (data.screenName == 'AdminMyPageRouter') {
        navigate(data.screenName, {
            isHeaderLeftBack: false,
        })
    } else if (data.screenName == 'PartnerCompanyList') {
        navigate(data.screenName, {})
    } else if (data.screenName == 'ContractingProjectDetailRouter') {
        navigate(data.screenName, {
            contractId: data?.param,
            title: data?.param2,
            projectId: data?.param3,
        })
    } else if (data.screenName == 'WorkerDetailRouter') {
        navigate(data.screenName, {
            workerId: data?.param,
            title: data?.param2,
        })
    } else if (data.screenName == 'SiteDetail') {
        navigate(data.screenName, {
            siteId: data?.param,
            title: data?.param2,
            requestId: data?.param3,
        })
    } else if (data.screenName == 'AttendanceDetail') {
        navigate(data.screenName, {
            attendanceId: data?.param,
            arrangementId: data?.param2,
            siteId: data?.param3 ?? '',
        })
    } else if (data.screenName == 'DateRouter') {
        navigate(data.screenName, {})
    }

    // 現場側
    else if (data.screenName == 'WSiteRouter') {
        navigate(data.screenName, {
            siteId: data?.param,
        })
    } else if (data.screenName == 'WorkerHome') {
        navigate(data.screenName, {})
    } else if (data.screenName == 'AttendancePopup') {
        navigate(data.screenName, {
            attendanceId: data?.param,
            type: 'start',
        })
    } else if (data.screenName == 'MyPageRouter') {
        navigate(data.screenName, {})
    }

    return
}
