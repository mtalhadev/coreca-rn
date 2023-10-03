/* eslint-disable indent */
import React, { useState, useEffect } from 'react'
import { Text, Pressable, View, ViewStyle, Linking, Alert, AppState } from 'react-native'
import * as Clipboard from 'expo-clipboard'

import { BlueColor, GreenColor, FontStyle } from '../../utils/Styles'
import { THEME_COLORS } from '../../utils/Constants'
import { pickImage } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { AppButton } from '../atoms/AppButton'
import { ColumnBox } from '../atoms/ColumnBox'
import { companyRoleAndIsOfficeWorkerToTitle, companyRoleToText, goToCompanyDetail } from '../../usecases/company/CommonCompanyCase'
import { useDispatch, useSelector } from 'react-redux'
import { StoreType } from '../../stores/Store'
import { BottomMargin } from '../atoms/BottomMargin'
import { editWorkerImage } from '../../usecases/worker/MyWorkerCase'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { CustomDate, dayBaseText, timeBaseText } from '../../models/_others/CustomDate'
import { deleteWorker, departmentsToText, onDeleteWorkerUpdateSiteArrangementCache } from '../../usecases/worker/CommonWorkerCase'
import { useNavigation } from '@react-navigation/native'
import { CompanyCL } from '../organisms/company/CompanyCL'
import { ImageIcon } from '../organisms/ImageIcon'
import { ShadowBoxWithHeader } from '../organisms/shadowBox/ShadowBoxWithHeader'
import { WorkerCLType } from '../../models/worker/Worker'
import { WorkerTagList } from '../organisms/worker/WorkerTagList'
import { match } from 'ts-pattern'
import { ArrangementCLType } from '../../models/arrangement/Arrangement'
import { checkLockOfTarget } from '../../usecases/lock/CommonLockCase'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import { GlobalStyles } from '../../utils/Styles'
import DisplayIdInDev from '../atoms/DisplayIdInDEV'
import { useTextTranslation } from '../../fooks/useTextTranslation'
import { _deleteLocalAccount } from '../../services/account/AccountService'
import { getAccountList } from '../../usecases/account/AccountSelectCase'
import { setSignInUser } from '../../stores/AccountSlice'
import { getInviteUrl, GetInviteWorkerUrlParam } from '../../usecases/worker/InviteMyWorkerCase'

type DisplayType = 'none' | 'display' | 'can-edit'

type DisplaySetting = {
    canEditImage: boolean
    name: DisplayType
    nickname: DisplayType
    phoneNumber: DisplayType
    email: DisplayType
    companyType: 'belong' | 'arrange'
    title: DisplayType
    companyRole: DisplayType
    isOfficeWorker: DisplayType
    offDaysOfWeek: DisplayType
    otherOffDays: DisplayType
    password: DisplayType
    canDelete: boolean
    leftDate: DisplayType
    departments: DisplayType
}

export type WorkerProfileContentType =
    | 'is-mine'
    | 'register-worker-of-mycompany'
    | 'unregister-worker-of-mycompany'
    | 'register-worker-of-other-company'
    | 'request-worker-of-other-company'
    | 'request-worker-of-fake-company'
    | 'other-company'

export type WorkerProfileContentProps = {
    type?: WorkerProfileContentType
    worker?: WorkerCLType
    arrangement?: ArrangementCLType
    side?: 'worker' | 'admin'
    setting?: DisplaySetting
    style?: ViewStyle
}

export const WorkerProfileContent = (props: Partial<WorkerProfileContentProps>) => {
    const { t } = useTextTranslation()
    let { style, worker, type, setting, side, arrangement } = props
    side = side ?? 'admin'
    const dispatch = useDispatch()
    const navigation = useNavigation<any>()
    const [image, setImage] = useState<ImageInfo | undefined>(undefined)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const localUpdateScreens = useSelector((state: StoreType) => state.util.localUpdateScreens)
    const [appState, setAppState] = useState(AppState.currentState)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId)

    setting =
        setting ??
        (match(type)
            .with('is-mine', () => {
                return {
                    canEditImage: true,
                    name: 'can-edit',
                    nickname: side === 'admin' ? 'can-edit' : 'display',
                    phoneNumber: 'can-edit',
                    email: 'can-edit',
                    companyType: 'belong',
                    title: 'can-edit',
                    companyRole: 'display',
                    isOfficeWorker: 'display',
                    offDaysOfWeek: 'can-edit',
                    otherOffDays: 'can-edit',
                    password: 'can-edit',
                    canDelete: false,
                    leftDate: 'can-edit',
                    departments: 'can-edit',
                }
            })
            .with('register-worker-of-mycompany', () => {
                return {
                    canEditImage: false,
                    name: 'display',
                    nickname: 'can-edit',
                    phoneNumber: 'display',
                    email: 'display',
                    companyType: 'belong',
                    title: 'can-edit',
                    companyRole: 'display',
                    isOfficeWorker: 'display',
                    offDaysOfWeek: 'can-edit',
                    otherOffDays: 'can-edit',
                    password: 'none',
                    canDelete: worker?.workerTags?.includes('left-business') ? true : false,
                    leftDate: 'can-edit',
                    departments: 'can-edit',
                }
            })
            .with('unregister-worker-of-mycompany', () => {
                return {
                    canEditImage: true,
                    name: 'can-edit',
                    nickname: 'can-edit',
                    phoneNumber: 'can-edit',
                    email: 'none',
                    companyType: 'belong',
                    title: 'can-edit',
                    companyRole: 'display',
                    isOfficeWorker: 'display',
                    offDaysOfWeek: 'can-edit',
                    otherOffDays: 'can-edit',
                    password: 'none',
                    canDelete: true,
                    leftDate: 'can-edit',
                    departments: 'can-edit',
                }
            })
            .with('register-worker-of-other-company', () => {
                return {
                    canEditImage: false,
                    name: 'display',
                    nickname: 'display',
                    phoneNumber: 'display',
                    email: 'display',
                    companyType: 'arrange',
                    title: 'none',
                    companyRole: 'none',
                    isOfficeWorker: 'none',
                    offDaysOfWeek: 'none',
                    otherOffDays: 'none',
                    password: 'none',
                    canDelete: false,
                    leftDate: 'none',
                    departments: 'display',
                }
            })
            .with('request-worker-of-other-company', () => {
                return {
                    canEditImage: false,
                    name: 'display',
                    nickname: 'display',
                    phoneNumber: 'none',
                    email: 'none',
                    companyType: 'arrange',
                    title: 'none',
                    companyRole: 'none',
                    isOfficeWorker: 'none',
                    offDaysOfWeek: 'none',
                    otherOffDays: 'none',
                    password: 'none',
                    canDelete: false,
                    leftDate: 'none',
                    departments: 'display',
                }
            })
            .with('request-worker-of-fake-company', () => {
                return {
                    canEditImage: true,
                    name: 'can-edit',
                    nickname: 'can-edit',
                    phoneNumber: 'none',
                    email: 'none',
                    companyType: 'belong',
                    title: 'none',
                    companyRole: 'none',
                    isOfficeWorker: 'none',
                    offDaysOfWeek: 'none',
                    otherOffDays: 'none',
                    password: 'none',
                    canDelete: worker?.company?.companyPartnership == 'fake-partner' ? true : false,
                    leftDate: 'none',
                    departments: 'display',
                }
            })
            .with('other-company', () => {
                return {
                    canEditImage: false,
                    name: 'display',
                    nickname: 'display',
                    phoneNumber: 'none',
                    email: 'none',
                    companyType: 'arrange',
                    title: 'none',
                    companyRole: 'none',
                    isOfficeWorker: 'none',
                    offDaysOfWeek: 'none',
                    otherOffDays: 'none',
                    password: 'none',
                    canDelete: false,
                    leftDate: 'none',
                    departments: 'display',
                }
            })
            .otherwise(() => undefined) as DisplaySetting)

    useEffect(() => {
        ;(async () => {
            try {
                if (image == undefined) {
                    return
                }
                const result = await editWorkerImage({
                    workerId: worker?.workerId,
                    image: image,
                })
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }
                dispatch(setSignInUser({ ...signInUser, worker: { ...signInUser?.worker, ...result.success } }))
                dispatch(
                    setToastMessage({
                        text: t('common:ImageChanged'),
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
        })()
    }, [image])

    // AppState.addEventListenerでAppStateが変更された時に発火する
    useEffect(() => {
        const appState = AppState.addEventListener('change', setAppState)
        return () => {
            appState.remove()
        }
    }, [])

    const _delete = async () => {
        try {
            dispatch(setLoading('unTouchable'))
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: worker?.workerId ?? 'no-id',
                modelType: 'worker',
            })
            if (lockResult.error) {
                dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }

            if (worker?.workerId && myCompanyId && accountId) {
                onDeleteWorkerUpdateSiteArrangementCache({
                    workerId: worker?.workerId,
                    accountId: accountId,
                    myCompanyId: myCompanyId,
                })
            }

            /**
             * 退会済みの自社作業員を削除する場合、authとAccountの削除はfunctionsに任せる
             */
            const result = await deleteWorker({ workerId: worker?.workerId })
            if (result.error) {
                throw {
                    error: result.error,
                }
            }

            if (type === 'register-worker-of-mycompany' && worker?.workerTags?.includes('left-business')) {
                const resultGetAccountList = await getAccountList()
                if (resultGetAccountList.error) {
                    throw {
                        error: resultGetAccountList.error,
                    }
                }
                if (resultGetAccountList.success) {
                    const accountList = resultGetAccountList.success
                    const uids = accountList.filter((account) => account.workerId === worker?.workerId)
                    const resultDeleteLocalAccount = await _deleteLocalAccount(uids[0]?.accountId)
                    if (resultDeleteLocalAccount.error) {
                        throw {
                            error: resultDeleteLocalAccount.error,
                        }
                    }
                }
            }

            dispatch(setLoading(false))
            dispatch(setLocalUpdateScreens([...localUpdateScreens, { screenName: 'MyCompanyWorkerList' }]))
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

    const _onPressImage = async () => {
        try {
            const lockResult = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: worker?.workerId ?? 'no-id',
                modelType: 'worker',
            })
            if (lockResult.error) {
                dispatch(setLoading(false))
                throw {
                    error: lockResult.error,
                }
            }
            const _image = await pickImage()
            const lockResult2 = await checkLockOfTarget({
                myWorkerId: signInUser?.workerId ?? 'no-id',
                targetId: worker?.workerId ?? 'no-id',
                modelType: 'worker',
            })
            if (lockResult2.error) {
                dispatch(setLoading(false))
                throw {
                    error: lockResult2.error,
                }
            }
            if (_image == undefined) {
                return
            }
            setImage(_image)
            dispatch(setLocalUpdateScreens([...localUpdateScreens, { screenName: 'MyCompanyWorkerList' }]))
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(setLoading(false))
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    const _issueInvitationURL = async () => {
        try {
            const metroPort = '8081'
            const result = await getInviteUrl({
                myCompanyId,
                workerId: worker?.workerId,
                workerName: worker?.name,
                workerNickname: worker?.nickname,
                metroPort,
            } as GetInviteWorkerUrlParam)
            if (result.error) {
                throw {
                    error: result.error,
                }
            }

            await Clipboard.setStringAsync(result.success as string)
            dispatch(
                setToastMessage({
                    text: t('common:InvitationUrlCopied'),
                    type: 'success',
                }),
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
        <View
            style={{
                flex: 1,
                backgroundColor: THEME_COLORS.OTHERS.BACKGROUND,
                ...style,
            }}>
            {worker != undefined && (
                <>
                    <Pressable
                        style={{
                            alignSelf: 'center',
                            marginVertical: 20,
                            alignItems: 'center',
                        }}
                        disabled={!setting?.canEditImage}
                        onPress={() => _onPressImage()}>
                        {worker?.workerTags != undefined && <WorkerTagList hasBorder types={worker?.workerTags} />}
                        <ImageIcon
                            type={'worker'}
                            size={100}
                            imageUri={image?.uri ?? worker?.imageUrl}
                            imageColorHue={worker?.imageColorHue}
                            style={{
                                marginVertical: 10,
                            }}
                        />
                        {setting?.canEditImage && (
                            <Text
                                style={{
                                    color: THEME_COLORS.OTHERS.LINK_BLUE,
                                    lineHeight: 14,
                                    fontFamily: FontStyle.medium,
                                    fontSize: 12,
                                }}>
                                {t('common:ChangePhoto')}
                            </Text>
                        )}
                    </Pressable>
                    {type == 'unregister-worker-of-mycompany' && worker.workerTags?.includes('left-business') != true && (
                        <>
                            <AppButton
                                color={side == 'admin' ? BlueColor : GreenColor}
                                style={{
                                    marginHorizontal: 10,
                                    marginBottom: 10,
                                }}
                                title={t('common:IssueInvitationUrl')}
                                fontSize={12}
                                onPress={() => {
                                    _issueInvitationURL()
                                }}
                            />
                            <Text
                                style={[
                                    GlobalStyles.smallGrayText,
                                    {
                                        marginBottom: 20,
                                        alignSelf: 'center',
                                    },
                                ]}>
                                {t('admin:NewAccountIsCreatedWhenInvited')}
                            </Text>
                        </>
                    )}
                    {setting?.name != 'none' && (
                        <ColumnBox
                            title={t('common:YourName')}
                            content={worker?.name}
                            onPress={
                                setting?.name == 'can-edit'
                                    ? () => {
                                          if (side == 'admin') {
                                              navigation.push('EditName', {
                                                  workerId: worker?.workerId,
                                                  name: worker?.name,
                                              })
                                          } else {
                                              navigation.push('WEditName', {
                                                  workerId: worker?.workerId,
                                                  name: worker?.name,
                                              })
                                          }
                                      }
                                    : undefined
                            }
                        />
                    )}
                    {setting?.nickname != 'none' && (
                        <ColumnBox
                            title={t('common:YourNickname')}
                            content={worker?.nickname}
                            onPress={
                                setting?.nickname == 'can-edit'
                                    ? () => {
                                          if (side == 'admin') {
                                              navigation.push('EditNickname', {
                                                  workerId: worker?.workerId,
                                                  nickname: worker?.nickname,
                                              })
                                          } else {
                                              navigation.push('WEditNickname', {
                                                  workerId: worker?.workerId,
                                                  nickname: worker?.nickname,
                                              })
                                          }
                                      }
                                    : undefined
                            }
                        />
                    )}
                    {setting?.phoneNumber != 'none' && (
                        <ColumnBox
                            title={t('common:PhoneNumber')}
                            content={worker?.phoneNumber}
                            link={() => {
                                Linking.openURL(`tel:${worker?.phoneNumber}`)
                            }}
                            onPress={
                                setting?.phoneNumber == 'can-edit'
                                    ? () => {
                                          if (side == 'admin') {
                                              navigation.push('EditPhoneNumber', {
                                                  workerId: worker?.workerId,
                                                  phoneNumber: worker?.phoneNumber,
                                              })
                                          } else {
                                              navigation.push('WEditPhoneNumber', {
                                                  workerId: worker?.workerId,
                                                  phoneNumber: worker?.phoneNumber,
                                              })
                                          }
                                      }
                                    : undefined
                            }
                        />
                    )}
                    {setting?.offDaysOfWeek != 'none' && (
                        <ColumnBox
                            title={t('common:Holiday')}
                            content={worker?.offDaysOfWeek != undefined && worker?.offDaysOfWeek?.length > 0 ? worker?.offDaysOfWeek?.join(', ') : undefined}
                            onPress={
                                setting?.offDaysOfWeek == 'can-edit' && side == 'admin'
                                    ? () => {
                                          navigation.push('EditOffDaysOfWeek', {
                                              workerId: worker?.workerId,
                                              offDaysOfWeek: worker?.offDaysOfWeek,
                                          })
                                      }
                                    : undefined
                            }
                        />
                    )}
                    {setting?.otherOffDays != 'none' && (worker?.otherOffDays?.length ?? 0) > 0 && (
                        <ColumnBox
                            title={t('common:OtherHolidays')}
                            content={worker?.otherOffDays?.map((day: CustomDate) => dayBaseText(day)).join(', ')}
                            onPress={
                                setting?.otherOffDays == 'can-edit' && side == 'admin'
                                    ? () => {
                                          navigation.push('EditOtherOffDays', {
                                              workerId: worker?.workerId,
                                              otherOffDays: worker?.otherOffDays,
                                          })
                                      }
                                    : undefined
                            }
                        />
                    )}
                    {setting?.email != 'none' && (
                        <ColumnBox
                            title={t('common:EmailAddress')}
                            link={() => {
                                Linking.openURL(`mailto:${worker?.account?.email}`)
                            }}
                            content={worker?.account?.email}
                            onPress={
                                setting?.email == 'can-edit'
                                    ? () => {
                                          if (side == 'admin') {
                                              navigation.push('EditEmail', {
                                                  workerId: worker?.workerId,
                                                  email: worker?.account?.email,
                                              })
                                          } else {
                                              navigation.push('WEditEmail', {
                                                  workerId: worker?.workerId,
                                                  email: worker?.account?.email,
                                              })
                                          }
                                      }
                                    : undefined
                            }
                        />
                    )}
                    {setting?.password != 'none' && (
                        <ColumnBox
                            title={t('common:Password')}
                            content={'*'.repeat(worker?.account?.password?.length ?? 0)}
                            onPress={
                                setting?.password == 'can-edit'
                                    ? () => {
                                          if (side == 'admin') {
                                              navigation.push('EditPassword', {
                                                  workerId: worker?.workerId,
                                                  password: worker?.account?.password,
                                              })
                                          } else {
                                              navigation.push('WEditPassword', {
                                                  workerId: worker?.workerId,
                                                  password: worker?.account?.password,
                                              })
                                          }
                                      }
                                    : undefined
                            }
                        />
                    )}
                    <View
                        style={{
                            marginTop: 35,
                        }}></View>
                    {/* 仮会社への常用依頼の場合は自社が作成会社だけど手配元はその仮会社になる。 */}
                    {arrangement?.createCompany != undefined && arrangement?.createCompany.companyId != worker?.company?.companyId && worker.company?.companyPartnership != 'fake-partner' && (
                        <ShadowBoxWithHeader
                            style={{
                                marginBottom: 15,
                                marginHorizontal: 10,
                            }}
                            hasShadow={side == 'admin'}
                            onPress={() => {
                                if (side == 'admin' && myCompanyId != undefined) {
                                    goToCompanyDetail(navigation, arrangement?.createCompany?.companyId, arrangement?.createCompany?.name, myCompanyId)
                                }
                            }}
                            title={t('common:CompanyInChargeOfMakingArrangements')}>
                            <CompanyCL
                                style={{
                                    flex: 1,
                                }}
                                company={arrangement?.createCompany}
                            />
                        </ShadowBoxWithHeader>
                    )}
                    <ShadowBoxWithHeader
                        style={{
                            marginHorizontal: 10,
                        }}
                        hasShadow={side == 'admin'}
                        onPress={() => {
                            if (side == 'admin' && myCompanyId != undefined && worker?.company?.companyPartnership == 'fake-partner') {
                                goToCompanyDetail(navigation, worker?.company?.companyId, worker?.company?.name, myCompanyId)
                            }
                        }}
                        title={
                            arrangement?.createCompany != undefined && (arrangement?.createCompany.companyId == worker?.company?.companyId || worker.company?.companyPartnership == 'fake-partner')
                                ? t('common:CompanyArranger')
                                : t('common:CompanyName')
                        }>
                        <CompanyCL
                            style={{
                                flex: 1,
                            }}
                            company={worker?.company}
                        />
                    </ShadowBoxWithHeader>
                    <ColumnBox
                        style={{
                            marginTop: 15,
                        }}
                        title={t('common:Department')}
                        content={worker?.departments?.items != undefined ? departmentsToText(worker.departments?.items) : undefined}
                        onPress={
                            setting?.departments == 'can-edit' && side == 'admin'
                                ? () => {
                                      navigation.push('EditDepartments', {
                                          workerId: worker?.workerId,
                                      })
                                  }
                                : undefined
                        }
                    />
                    {setting?.title != 'none' && (
                        <ColumnBox
                            style={{}}
                            title={t('common:CompanyTitle')}
                            content={
                                companyRoleAndIsOfficeWorkerToTitle({
                                    companyRole: worker?.companyRole,
                                    isOfficeWorker: worker?.isOfficeWorker,
                                }) ?? ''
                            }
                            onPress={
                                setting?.title == 'can-edit' && side == 'admin'
                                    ? () => {
                                          navigation.push('EditTitle', {
                                              workerId: worker?.workerId,
                                              title:
                                                  companyRoleAndIsOfficeWorkerToTitle({
                                                      companyRole: worker?.companyRole,
                                                      isOfficeWorker: worker?.isOfficeWorker,
                                                  }) ?? '',
                                          })
                                      }
                                    : undefined
                            }
                        />
                    )}
                    {__DEV__ && setting?.companyRole != 'none' && (
                        <ColumnBox
                            style={{
                                marginTop: 15,
                            }}
                            title={t('common:CompanyAuthority')}
                            content={worker?.companyRole ? companyRoleToText(worker?.companyRole) : ''}
                            onPress={
                                setting?.companyRole == 'can-edit' && side == 'admin'
                                    ? () => {
                                          navigation.push('EditCompanyRole', {
                                              workerId: worker?.workerId,
                                              companyRole: worker?.companyRole,
                                          })
                                      }
                                    : undefined
                            }
                        />
                    )}
                    {__DEV__ && setting?.isOfficeWorker != 'none' && (
                        <ColumnBox
                            title={t('admin:AreYouAConstructionWorker')}
                            content={worker?.isOfficeWorker == false ? t('common:Yes') : t('common:No')}
                            onPress={
                                setting?.isOfficeWorker == 'can-edit' && side == 'admin'
                                    ? () => {
                                          navigation.push('EditIsOfficeWorker', {
                                              workerId: worker?.workerId,
                                              isOfficeWorker: worker?.isOfficeWorker,
                                          })
                                      }
                                    : undefined
                            }
                        />
                    )}
                    {setting.leftDate != 'none' && worker.companyRole != 'owner' && (
                        <ColumnBox
                            title={t('common:RetirementDay')}
                            content={worker?.leftDate ? timeBaseText(worker?.leftDate) : undefined}
                            onPress={
                                setting?.leftDate == 'can-edit' && side == 'admin'
                                    ? () => {
                                          navigation.push('EditLeftDate', {
                                              workerId: worker?.workerId,
                                              leftDate: worker?.leftDate,
                                          })
                                      }
                                    : undefined
                            }
                        />
                    )}
                    <View
                        style={{
                            marginTop: 40,
                        }}>
                        {setting?.canDelete && (
                            <AppButton
                                color={side == 'admin' ? BlueColor : GreenColor}
                                style={{
                                    marginHorizontal: 10,
                                    marginTop: 15,
                                }}
                                title={t('common:Delete')}
                                isGray={true}
                                height={30}
                                fontSize={12}
                                onPress={() => {
                                    Alert.alert(t('common:WantToRemoveTheWorker'), t('common:OperationCannotBeUndone'), [
                                        { text: t('common:Deletion'), onPress: () => _delete() },
                                        {
                                            text: t('common:Cancel'),
                                            style: 'cancel',
                                        },
                                    ])
                                }}
                            />
                        )}
                    </View>

                    <DisplayIdInDev id={worker?.workerId} label="workerId" />

                    <BottomMargin />
                </>
            )}
        </View>
    )
}
