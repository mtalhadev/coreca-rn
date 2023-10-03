import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, StyleSheet, Pressable } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { InputTextBox } from '../../../../components/organisms/inputBox/InputTextBox'
import { AppButton } from '../../../../components/atoms/AppButton'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { ImageIcon } from '../../../../components/organisms/ImageIcon'
import { FontStyle } from '../../../../utils/Styles'
import { PLACEHOLDER, THEME_COLORS, dMarginTop } from '../../../../utils/Constants'
import { getRandomImageColorHue, getRandomName, getUuidv4, pickImage } from '../../../../utils/Utils'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { InputDropDownBox } from '../../../../components/organisms/inputBox/InputDropdownBox'
import { weekDayList, WeekOfDay } from '../../../../utils/ext/Date.extensions'
import isEmpty from 'lodash/isEmpty'
import { createMyCompanyWorker } from '../../../../usecases/worker/MyWorkerCase'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import {
    companyRoleAndIsOfficeWorkerToTitle,
    companyRoleTextList,
    textToCompanyRole,
    titleTextList,
    titleToCompanyRoleText,
    titleToIsOfficeWorker,
} from '../../../../usecases/company/CommonCompanyCase'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { useIsFocused } from '@react-navigation/native'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { InputObject, InputObjectDropdownBox } from '../../../../components/organisms/inputBox/InputObjectDropdownBox'
import { _getFirestore } from '../../../../services/firebase/FirestoreService'
import { DepartmentManageType } from '../../../../models/department/DepartmentManageType'
import { WorkerType } from '../../../../models/worker/Worker'
import { onCreateWorkerUpdateSiteArrangementCache } from '../../../../usecases/worker/CommonWorkerCase'
import { _addLocalMyCompanyWorker } from '../../../../components/template/ArrangementManageUtils'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'AddMyWorker'>

type InitialStateType = {
    id?: string
    image?: ImageInfo
    disable: boolean
    companyDepartments?: InputObject[]
    workerDepartments?: InputObject[]
} & MyCompanyWorkerUIType

export type MyCompanyWorkerUIType = {
    name?: string
    nickname?: string
    phoneNumber?: string | undefined
    title?: string[]
    companyRole?: string[]
    offDaysOfWeek?: WeekOfDay[]
    imageUrl?: string
    sImageUrl?: string
    xsImageUrl?: string
    imageColorHue?: number
    isOfficeWorker?: boolean
}

const initialState: InitialStateType = {
    disable: false,
}

const AddMyWorker = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const [
        { id, name, nickname, phoneNumber, title, companyRole, isOfficeWorker, offDaysOfWeek, image, imageUrl, sImageUrl, xsImageUrl, imageColorHue, disable, companyDepartments, workerDepartments },
        setState,
    ] = useState(initialState)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const activeDepartments = useSelector((state: StoreType) => state.account.activeDepartments)

    const unsubscribeRef = useRef<any>(null)
    const isScreenOnRef = useRef<boolean>(false)
    const holidays = useSelector((state: StoreType) => state.util.holidays)
    const isDefaultDepartment = useMemo(() => activeDepartments?.map((dep) => dep?.isDefault)[0], [activeDepartments])
    const invRequestId = route.params?.invRequestId
    const siteId = route.params?.siteId

    useMemo(() => {
        const defaultDepartments = activeDepartments
            ?.map((dep) => {
                if (dep.departmentName && dep.departmentId) {
                    return {
                        tag: dep.departmentName,
                        value: dep.departmentId,
                    } as InputObject
                }
            })
            .filter((data) => data != undefined) as InputObject[]
        setState((prev) => ({ ...prev, workerDepartments: defaultDepartments }))
    }, [])

    useEffect(() => {
        if (isEmpty(name) || isEmpty(companyRole) || (workerDepartments?.length ?? 0) == 0) {
            setState((prev) => ({ ...prev, disable: true }))
            return
        }
        setState((prev) => ({ ...prev, disable: false }))
    }, [name, companyRole, workerDepartments])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        isScreenOnRef.current = isFocused
        return () => {
            if (unsubscribeRef.current && isScreenOnRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
                isScreenOnRef.current = false
            }
        }
    }, [isFocused])

    useEffect(() => {
        const defaultRole = ['一般作業員']
        setState((prev) => ({
            ...prev,
            id: getUuidv4(),
            imageColorHue: getRandomImageColorHue(),
            companyRole: defaultRole,
            title: __companyRoleAndIsOfficeWorkerToTitle(defaultRole),
            offDaysOfWeek: __companyRoleToOffDaysOfWeek(defaultRole),
            isOfficeWorker: __companyRoleToIsOfficeWorker(defaultRole),
            ...(__DEV__
                ? {
                      name: getRandomName('従業員', 5),
                  }
                : {}),
        }))

        return () => {
            setState({ ...initialState })
        }
    }, [])

    useEffect(() => {
        navigation.setOptions({
            title: t('admin:RegisterNewInHouseWorkers'),
        })
    }, [navigation])

    const _writeMyCompanyWorker = async () => {
        try {
            if (myCompanyId == undefined) {
                throw {
                    error: t('admin:YourCompanyInformationisMissingPleaseLoginAgain'),
                }
            }
            dispatch(setLoading('unTouchable'))
            const newWorker = {
                workerId: id,
                name,
                nickname,
                companyId: myCompanyId,
                phoneNumber: phoneNumber,
                companyRole: textToCompanyRole((companyRole as string[])[0]),
                offDaysOfWeek: offDaysOfWeek as string[],
                imageUrl,
                sImageUrl,
                xsImageUrl,
                imageColorHue,
                isOfficeWorker: isOfficeWorker !== false,
                departmentIds: workerDepartments?.map((obj) => obj?.value).filter((data) => data != undefined) as string[],
            } as WorkerType
            if (accountId) {
                onCreateWorkerUpdateSiteArrangementCache({
                    newWorker: newWorker,
                    myCompanyId: myCompanyId,
                    accountId: accountId,
                    holidays: holidays,
                    siteId: route?.params?.siteId,
                })
            }
            const result = await createMyCompanyWorker({
                workerId: id,
                myCompanyId,
                image,
                name,
                nickname,
                phoneNumber,
                companyRole,
                offDaysOfWeek,
                imageColorHue,
                imageUrl,
                sImageUrl,
                isOfficeWorker,
                xsImageUrl,
                departmentIds: workerDepartments?.map((obj) => obj?.value).filter((data) => data != undefined) as string[],
            })
            // if (invRequestId) {
            //     const arrCachedKey = genKeyName({
            //         screenName: 'InvRequestArrangement',
            //         accountId: accountId as string,
            //         companyId: myCompanyId as string,
            //         invRequestId: invRequestId as string,
            //     })
            //     const siteArrangementCacheData = await getCachedData<InvRequestArrangementModel>(arrCachedKey)
            //     let _siteArrangementData: InvRequestArrangementModel = {
            //         ...siteArrangementCacheData.success,
            //         updatedAt: Number(new Date()),
            //     }
            //     if (siteArrangementCacheData.error) {
            //         throw {
            //             error: siteArrangementCacheData.error,
            //             errorCode: siteArrangementCacheData.errorCode,
            //         }
            //     }
            //     _addLocalMyCompanyWorker(toSiteArrangementDataCLType(_siteArrangementData.invRequestArrangementData), toWorkerCLType(newWorker))
            //     const cachedResult = await updateCachedData({ key: arrCachedKey, value: _siteArrangementData ?? {} })
            //     if (cachedResult.error) {
            //         const _error = cachedResult as CustomResponse
            //         dispatch(
            //             setToastMessage({
            //                 text: getErrorToastMessage(_error),
            //                 type: 'error',
            //             }),
            //         )
            //     }
            // }
            if (isFocused) dispatch(setLoading(false))
            if (result.error) {
                throw {
                    error: result.error,
                }
            }

            dispatch(setLocalUpdateScreens([...localUpdateScreens, { screenName: 'MyCompanyWorkerList' }]))
            dispatch(
                setToastMessage({
                    text: t('admin:InHouseWorkersWereCreated'),
                    type: 'success',
                } as ToastMessage),
            )
            navigation.goBack()
            navigation.push('WorkerDetailRouter', {
                workerId: id,
                title: name,
            })
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

    const __companyRoleToOffDaysOfWeek = (value: string[] | undefined): WeekOfDay[] => {
        return value?.includes('代表者') || value?.includes('管理者') ? ['日', '祝'] : ['日', '祝']
    }

    const __companyRoleToIsOfficeWorker = (value: string[] | undefined): boolean => {
        return value?.includes('代表者') || value?.includes('管理者') ? true : false
    }

    const __companyRoleAndIsOfficeWorkerToTitle = (value: string[] | undefined): string[] => {
        return [companyRoleAndIsOfficeWorkerToTitle({ companyRole: textToCompanyRole(value?.[0]), isOfficeWorker: __companyRoleToIsOfficeWorker(value) }) ?? '']
    }

    useEffect(() => {
        ;(async () => {
            try {
                if (isFocused != true) {
                    return
                }
                if (!isScreenOnRef.current) return
                if (isFocused) dispatch(setLoading(true))
                const db = _getFirestore()
                unsubscribeRef.current = db
                    .collection('DepartmentManage')
                    .where('companyId', '==', myCompanyId)
                    .onSnapshot(async (data) => {
                        const _departmentList = data.docs.map((doc) => doc.data())[0] as DepartmentManageType | undefined
                        const _companyDepartments = _departmentList?.departments?.map((dep) => {
                            return {
                                tag: dep.departmentName,
                                value: dep.departmentId,
                            } as InputObject
                        })
                        setState((prev) => ({
                            ...prev,
                            companyDepartments: _companyDepartments,
                        }))
                        dispatch(setLoading(false))
                        dispatch(setIsNavUpdating(false))
                    })
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
    }, [isFocused])

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
                        {t('common:ChangePhoto')}
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
                style={{ marginTop: 30 - dMarginTop }}
                required={false}
                title={t('common:YourNickname')}
                placeholder={PLACEHOLDER.PERSON_NICKNAME}
                infoText={t('common:NicknameInfo')}
                value={nickname}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, nickname: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, nickname: undefined }))
                }}
            />
            <InputTextBox
                style={{ marginTop: 30 - dMarginTop }}
                validation={'phone'}
                required={false}
                title={t('common:PhoneNumber')}
                placeholder={PLACEHOLDER.MOBILE_PHONE}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, phoneNumber: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, phoneNumber: undefined }))
                }}
            />
            <InputDropDownBox
                style={{ marginTop: 40 - dMarginTop }}
                title={t('admin:Title')}
                selectableItems={titleTextList.filter((title) => title != '代表者' && title != '一人親方')}
                required={true}
                value={title}
                selectNum={1}
                placeholder={PLACEHOLDER.TITLE}
                onValueChangeValid={(value) => {
                    const _companyRole = titleToCompanyRoleText(value?.[0])
                    const _isOfficeWorker = titleToIsOfficeWorker(value?.[0])
                    setState((prev) => ({
                        ...prev,
                        title: value,
                        companyRole: _companyRole ? [_companyRole] : undefined,
                        isOfficeWorker: _isOfficeWorker,
                        offDaysOfWeek: __companyRoleToOffDaysOfWeek(_companyRole ? [_companyRole] : undefined),
                    }))
                }}
            />
            <InputDropDownBox
                style={{ marginTop: 30 - dMarginTop }}
                title={t('admin:Authority')}
                required={true}
                disable
                selectableItems={companyRoleTextList}
                value={companyRole}
                selectNum={1}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, companyRole: value, offDaysOfWeek: __companyRoleToOffDaysOfWeek(value), isOfficeWorker: __companyRoleToIsOfficeWorker(value) }))
                }}
            />
            <InputDropDownBox
                title={t('admin:AreYouAConstructionWorker')}
                required={true}
                disable
                infoText={'＊現場への手配が可能かどうか。'}
                selectableItems={[t('common:Yes'), t('common:No')]}
                selectNum={1}
                value={isOfficeWorker ? [t('common:No')] : [t('common:Yes')]}
                style={{
                    marginTop: 30 - dMarginTop,
                }}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, isOfficeWorker: value?.includes(t('common:Yes')) ? false : true }))
                }}
            />
            <InputDropDownBox
                style={{ marginTop: 30 - dMarginTop }}
                title={t('common:Holiday')}
                infoText={t('admin:EnterTheDaysOffFromFieldWork')}
                required={false}
                selectableItems={weekDayList as string[]}
                value={offDaysOfWeek as string[]}
                selectNum={'any'}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, offDaysOfWeek: value }))
                }}
                onClear={() => {
                    setState((prev) => ({ ...prev, offDaysOfWeek: undefined }))
                }}
            />
            {!isDefaultDepartment && (
                <InputObjectDropdownBox
                    title={t('common:Department')}
                    placeholder={PLACEHOLDER.DEPARTMENT}
                    selectableItems={companyDepartments ?? []}
                    selectNum={'any'}
                    value={workerDepartments}
                    style={{
                        marginVertical: 40 - dMarginTop,
                    }}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({ ...prev, workerDepartments: value }))
                    }}
                    required
                />
            )}
            <AppButton
                style={{
                    marginTop: 40,
                    marginHorizontal: 20,
                }}
                disabled={disable}
                title={t('common:Register')}
                onPress={() => {
                    _writeMyCompanyWorker()
                }}
            />
            <BottomMargin />
        </KeyboardAwareScrollView>
    )
}
export default AddMyWorker

const styles = StyleSheet.create({})
