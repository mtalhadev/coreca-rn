import React, { useState, useEffect } from 'react'
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native'
import { useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { HeaderBackButton, HeaderBackButtonProps } from '@react-navigation/elements'
import { useSelector, useDispatch } from 'react-redux'
import { ColorStyle } from '../../utils/Styles'
import { Icon } from './../atoms/Icon'
import { setIsNavUpdating } from '../../stores/NavigationSlice'
import { Badge } from '../atoms/Badge'
import { StoreType } from '../../stores/Store'
import { _getFirestore } from '../../services/firebase/FirestoreService'
import { ImageIcon } from './ImageIcon'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { UnreadNotificationCountModel } from '../../models/notification/Notification'
import { setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { useTextTranslation } from '../../fooks/useTextTranslation'
import { Tag } from './Tag'

export type NavFunctionType =
    | 'none'
    | 'admin_notification'
    | 'admin_home'
    | 'admin_menu'
    | 'worker_notification'
    | 'worker_home'
    | 'worker_menu'
    | 'close'
    | 'back'
    | 'update'
    | 'admin-addNote'
    | 'worker-addNote'
    | 'admin-add-member'
    | 'worker-add-member'
    | 'admin_chat_settings'
    | 'worker_chat_settings'

export type NavIconProps = {
    navFunctionType: NavFunctionType
    colorStyle: ColorStyle
    withBatch?: boolean
    style?: ViewStyle
} & HeaderBackButtonProps

export const NavIcon = React.memo((props: NavIconProps) => {
    const navigation = useNavigation<any>()
    const route = useRoute<any>()
    const params = route.params || {}
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const { navFunctionType, colorStyle, withBatch, style } = props
    const [batchCount, setBatchCount] = useState(0)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId)
    const isNavUpdating = useSelector((state: StoreType) => state.nav.isNavUpdating)
    const activeDepartments = useSelector((state: StoreType) => state.account.activeDepartments)
    const { t } = useTextTranslation()
    const worker = useSelector((state: StoreType) => state.account.signInUser?.worker)

    //console.log('navFunctionType: %s, params: ',navFunctionType, params);

    useEffect(() => {
        let unsubscribe: () => void
        if (withBatch) {
            ;(async () => {
                try {
                    if (accountId) {
                        const side = navFunctionType == 'worker_notification' ? 'worker' : 'admin'

                        const db = _getFirestore()

                        unsubscribe = db
                            .collection('UnreadNotificationCount')
                            .where('accountId', '==', accountId)
                            .onSnapshot(async (data) => {
                                const unreadNotificationCount = data.docs.map((doc) => doc.data() as UnreadNotificationCountModel)[0]
                                const unreadCount = side === 'admin' ? unreadNotificationCount?.unreadCountAdmin : unreadNotificationCount?.unreadCountWorker
                                setBatchCount(unreadCount !== undefined && unreadCount >= 0 ? unreadCount : 0)
                            })
                    }
                } catch (error) {
                    const _error = error as CustomResponse
                    dispatch(
                        setToastMessage({
                            text: getErrorMessage(_error),
                            type: 'error',
                        } as ToastMessage),
                    )
                }
            })()
        }

        return () => {
            if (unsubscribe !== undefined) {
                unsubscribe()
            }
        }
    }, [accountId, batchCount, navFunctionType, withBatch, isFocused])

    switch (navFunctionType) {
        case 'admin_home':
            return (
                <Pressable
                    style={({ pressed }) => [style, styles.icon, { opacity: pressed ? 0.3 : 1 }]}
                    onTouchStart={() => {
                        navigation.reset({
                            index: 0,
                            routes: [
                                {
                                    name: 'AdminHome',
                                    params: {
                                        animation: 'fade',
                                    },
                                },
                            ],
                        })
                    }}>
                    <Icon name={'schedule'} width={25} height={25} fill={colorStyle.textColor} />
                </Pressable>
            )
        case 'worker_home':
            return (
                <Pressable
                    style={({ pressed }) => [style, styles.icon, { opacity: pressed ? 0.3 : 1 }]}
                    onTouchStart={() =>
                        navigation.reset({
                            index: 0,
                            routes: [
                                {
                                    name: 'WorkerHome',
                                    params: {
                                        animation: 'fade',
                                    },
                                },
                            ],
                        })
                    }>
                    <Icon name={'schedule'} width={25} height={25} fill={colorStyle.textColor} />
                </Pressable>
            )
        case 'admin_notification':
            if (withBatch && batchCount != 0) {
                return (
                    <Pressable style={({ pressed }) => [style, styles.icon, { opacity: pressed ? 0.3 : 1 }]} onTouchStart={() => navigation.push('AdminNotification', {})}>
                        <Icon name={'bell'} width={26} height={26} fill={colorStyle.textColor} />
                        <Badge
                            batchCount={batchCount}
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                            }}
                        />
                    </Pressable>
                )
            } else {
                return (
                    <Pressable style={({ pressed }) => [style, styles.icon, { opacity: pressed ? 0.3 : 1 }]} onTouchStart={() => navigation.push('AdminNotification', {})}>
                        <Icon name={'bell'} width={26} height={26} fill={colorStyle.textColor} />
                    </Pressable>
                )
            }
        case 'worker_notification':
            if (withBatch && batchCount != 0) {
                return (
                    <Pressable style={({ pressed }) => [style, styles.icon, { opacity: pressed ? 0.3 : 1 }]} onTouchStart={() => navigation.push('WNotification', {})}>
                        <Icon name={'bell'} width={26} height={26} fill={colorStyle.textColor} />
                        <Badge
                            batchCount={batchCount}
                            style={{
                                position: 'absolute',
                                right: 0,
                                top: 0,
                            }}
                        />
                    </Pressable>
                )
            } else {
                return (
                    <Pressable style={({ pressed }) => [style, styles.icon, { opacity: pressed ? 0.3 : 1 }]} onTouchStart={() => navigation.push('WNotification', {})}>
                        <Icon name={'bell'} width={26} height={26} fill={colorStyle.textColor} />
                    </Pressable>
                )
            }
        case 'admin_menu':
            return (
                <Pressable
                    style={({ pressed }) => [
                        style,
                        {
                            opacity: pressed ? 0.3 : 1,
                            marginRight: 10,
                            alignItems: 'center',
                        },
                    ]}
                    onTouchStart={() => {
                        navigation.push('SelectDepartment', {
                            title: t('common:SwitchDepartment'),
                        })
                    }}>
                    <Tag
                        style={{
                            borderRadius: 3,
                            minWidth: 35,
                            maxWidth: 100,
                        }}
                        fontSize={9}
                        fontColor={'#000'}
                        color={'#fff'}
                        tag={
                            activeDepartments && activeDepartments?.length > 1
                                ? (activeDepartments[0].departmentName ?? '') + ` 他 ${activeDepartments.length - 1}`
                                : activeDepartments?.length == 1 && activeDepartments[0]?.isDefault != true
                                ? activeDepartments[0].departmentName
                                : worker?.company?.name ?? ''
                        }
                        ellipsizeMode={'middle'}
                        numberOfLines={3}
                    />
                </Pressable>
            )
        case 'worker_menu':
            return (
                <Pressable
                    style={({ pressed }) => [style, styles.icon, { opacity: pressed ? 0.3 : 1, marginBottom: 5 }]}
                    onTouchStart={() => {
                        navigation.push('WSelectAccount', {
                            title: t('common:SwitchAccount'),
                        })
                    }}>
                    <ImageIcon size={35} imageUri={worker?.sImageUrl ?? worker?.imageUrl} imageColorHue={worker?.imageColorHue} type={'worker'} />
                </Pressable>
            )
        case 'back':
            return <HeaderBackButton {...props} style={style} />
        case 'close':
            return (
                <Pressable style={({ pressed }) => [style, styles.icon, { opacity: pressed ? 0.3 : 1 }]} onTouchStart={() => navigation.goBack()}>
                    <Icon name={'close'} width={20} height={20} fill={colorStyle.textColor} />
                </Pressable>
            )
        case 'update':
            return (
                <Pressable
                    style={({ pressed }) => [style, styles.icon, { opacity: pressed || isNavUpdating ? 0.3 : 1 }]}
                    onTouchStart={() => {
                        if (!isNavUpdating) {
                            dispatch(setIsNavUpdating(true))
                        }
                    }}>
                    <Icon name={'update'} width={23} height={23} fill={colorStyle.textColor} />
                </Pressable>
            )
        case 'admin-addNote':
            return (
                <Pressable style={({ pressed }) => [style, styles.icon, { opacity: pressed ? 0.3 : 1 }]} onTouchStart={() => navigation.push('AdminAddNote', { ...params })}>
                    <Icon name={'plus'} width={18} height={18} fill={colorStyle.textColor} />
                </Pressable>
            )
        case 'worker-addNote':
            return (
                <Pressable style={({ pressed }) => [style, styles.icon, { opacity: pressed ? 0.3 : 1 }]} onTouchStart={() => navigation.push('WorkerAddNote', { ...params })}>
                    <Icon name={'plus'} width={18} height={18} fill={colorStyle.textColor} />
                </Pressable>
            )
        case 'admin_chat_settings':
            return (
                <Pressable style={({ pressed }) => [style, styles.icon, { opacity: pressed ? 0.3 : 1 }]} onTouchStart={() => navigation.push('AdminChatSettings', { ...params })}>
                    <Icon name={'chatMembers'} width={20} height={20} fill={colorStyle.textColor} style={{ marginTop: 5 }} />
                </Pressable>
            )
        case 'worker_chat_settings':
            return (
                <Pressable style={({ pressed }) => [style, styles.icon, { opacity: pressed ? 0.3 : 1 }]} onTouchStart={() => navigation.push('WorkerChatSettings', { ...params })}>
                    <Icon name={'chatMembers'} width={20} height={20} fill={colorStyle.textColor} style={{ marginTop: 5 }} />
                </Pressable>
            )

        case 'none':
            return <View style={[style, styles.icon]}></View>
        default:
            return <View style={[style, styles.icon]}></View>
    }
})

const styles = StyleSheet.create({
    icon: {
        paddingHorizontal: 25,
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
})
