import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { Alert, FlatList, ListRenderItem, ListRenderItemInfo, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { RoomType } from '../../../../models/room/Room'
import { RoomRoleEnumType, RoomUserType } from '../../../../models/roomUser/RoomUser'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { RootStackParamList } from '../../../../screens/Router'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { resetTargetCachedData } from '../../../../usecases/CachedDataCase'
import { canLeaveFromRoom, getRoomInfo, getRoomInfoResponse, removeGroupMember } from '../../../../usecases/chat/MembersListCase'
import { THEME_COLORS } from '../../../../utils/Constants'
import { FontStyle } from '../../../../utils/Styles'
import { SwitchAdminOrWorkerProps } from '../../../../utils/Utils'
import { NavButton } from '../../../atoms/NavButton'
import { ChatUserItem } from '../SelectGroupUserItem'

type InitialStateType = {
    room?: RoomType
    roomUsers?: RoomUserType[]
    roomRole?: RoomRoleEnumType
    updateCache: number
    refreshing: boolean
}
const initialState: InitialStateType = {
    updateCache: 0,
    refreshing: false,
}

type NavProps = StackNavigationProp<RootStackParamList, 'AdminChatSettings'>
type RouteProps = RouteProp<RootStackParamList, 'AdminChatSettings'>

const ChatSettings = (props: Partial<SwitchAdminOrWorkerProps>) => {
    const [{ room, roomUsers, roomRole, updateCache, refreshing }, setState] = useState(initialState)
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const side = props.side ?? 'admin'
    const dispatch = useDispatch()
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = signInUser?.accountId ?? ''
    const isFocused = useIsFocused()
    const { roomId, threadId, name } = route.params || { roomId: '', threadId: '', name: '' }

    useEffect(() => {
        if (refreshing == false) {
            return
        }

        ;(async () => {
            try {
                dispatch(setLoading(true))
                const roomResult: CustomResponse<getRoomInfoResponse> = await getRoomInfo(roomId ?? 'no-id', signInUser?.workerId ?? 'no-id')
                if (roomResult.error) {
                    dispatch(
                        setToastMessage({
                            text: roomResult.error,
                            type: 'error',
                        } as ToastMessage),
                    )
                    return
                }
                setState((prev) => ({ ...prev, room: roomResult.success?.room, roomUsers: roomResult.success?.roomUsers, roomRole: roomResult.success?.roomRole }))
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                dispatch(setLoading(false))
                setState((prev) => ({ ...prev, refreshing: false }))
            }
        })()
    }, [refreshing])

    useEffect(() => {
        if (isFocused) {
            setState((prev) => ({ ...prev, refreshing: true }))
        }
    }, [isFocused])

    useEffect(() => {}, [room])

    useSafeLoadingUnmount(dispatch, isFocused)

    useSafeUnmount(setState, initialState)

    const leaveFromRoom = async () => {
        if (roomId && signInUser?.workerId && myCompanyId) {
            const checkResult = await canLeaveFromRoom({ myCompanyId, myWorkerId: signInUser.workerId, roomId: roomId })
            if (checkResult.error) {
                dispatch(
                    setToastMessage({
                        text: checkResult.error,
                        type: 'error',
                    }),
                )
                return
            } else if (checkResult.success?.can == false) {
                dispatch(
                    setToastMessage({
                        text: checkResult.success?.errorMessage,
                        type: 'error',
                    }),
                )
                return
            }

            Alert.alert(t('common:WantToLeaveFromRoom'), t('common:OperationCannotBeUndone'), [
                {
                    text: t('common:Deletion'),
                    onPress: async () => {
                        const updateRoomResult = await removeGroupMember(roomId ?? 'no-id', signInUser?.workerId ?? 'no-id')

                        if (room?.roomType == 'onetoone' || room?.roomType == 'custom') {
                            await resetTargetCachedData(side == 'admin' ? 'AdminDMRoomList' : 'WorkerDMRoomList')
                        } else {
                            await resetTargetCachedData(side == 'admin' ? 'AdminChatProjectList' : 'WorkerChatProjectList')
                        }

                        if (updateRoomResult.error) {
                            console.log('updateRoomResult error: ', updateRoomResult.error)
                            dispatch(
                                setToastMessage({
                                    text: updateRoomResult.error,
                                    type: 'error',
                                }),
                            )
                        } else if (updateRoomResult.success) {
                            dispatch(
                                setToastMessage({
                                    text: 'Group left successfully',
                                    type: 'success',
                                }),
                            )
                            navigation.pop(2)
                        }
                    },
                },
                {
                    text: t('common:Cancel'),
                    style: 'cancel',
                },
            ])
        }
    }
    const _removeMember = async (workerId: string) => {
        if (roomId && signInUser?.workerId && myCompanyId) {
            const checkResult = await canLeaveFromRoom({ myCompanyId, myWorkerId: workerId, roomId: roomId })
            if (checkResult.error) {
                dispatch(
                    setToastMessage({
                        text: checkResult.error,
                        type: 'error',
                    }),
                )
                return
            } else if (checkResult.success?.can == false) {
                dispatch(
                    setToastMessage({
                        text: checkResult.success?.errorMessage,
                        type: 'error',
                    }),
                )
                return
            }

            Alert.alert(t('admin:RemoveMember'), t('common:OperationCannotBeUndone'), [
                {
                    text: t('common:Deletion'),
                    onPress: async () => {
                        const updateRoomResult = await removeGroupMember(roomId ?? 'no-id', workerId)

                        if (room?.roomType == 'onetoone' || room?.roomType == 'custom') {
                            await resetTargetCachedData(side == 'admin' ? 'AdminDMRoomList' : 'WorkerDMRoomList')
                        } else {
                            await resetTargetCachedData(side == 'admin' ? 'AdminChatProjectList' : 'WorkerChatProjectList')
                        }

                        if (updateRoomResult.error) {
                            console.log('updateRoomResult error: ', updateRoomResult.error)
                            dispatch(
                                setToastMessage({
                                    text: updateRoomResult.error,
                                    type: 'error',
                                }),
                            )
                        } else if (updateRoomResult.success) {
                            dispatch(
                                setToastMessage({
                                    text: 'Removed successfully',
                                    type: 'success',
                                }),
                            )
                            setState((prev) => ({ ...prev, refreshing: true }))
                        }
                    },
                },
                {
                    text: t('common:Cancel'),
                    style: 'cancel',
                },
            ])
        }
    }
    const _content: ListRenderItem<RoomUserType> = (info: ListRenderItemInfo<RoomUserType>) => {
        const { item, index } = info
        const item2 = {
            ...item.worker,
            roomRole: item.roomRole,
            onRemove: roomRole == 'admin' ? () => _removeMember(item.worker?.workerId ?? 'no-id') : undefined,
            isShowSelected: false,
            iconSize: 40,
        }

        return <ChatUserItem {...item2} />
    }

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: 'white',
            }}>
            {room?.roomType == 'custom' && roomRole == 'admin' && (
                <NavButton
                    style={{}}
                    title={t('admin:AddMembers')}
                    hasIcon={false}
                    height={50}
                    onPress={() => {
                        navigation.push(side == 'admin' ? 'AdminSelectUsersForCustomGroup' : 'WorkerSelectUsersForCustomGroup', { roomId, threadId, name })
                    }}
                />
            )}
            {roomRole == 'admin' && (room?.roomType == 'project' || room?.roomType == 'construction' || room?.roomType == 'contract' || room?.roomType == 'owner' || room?.roomType == 'company') && (
                <NavButton
                    style={{}}
                    title={t('admin:AddMembers')}
                    hasIcon={false}
                    height={50}
                    onPress={() => {
                        navigation.push(side == 'admin' ? 'AdminSelectUsersForPCCOC' : 'WorkerSelectUsersForPCCOC', { roomId, threadId, name })
                    }}
                />
            )}
            {roomRole == 'admin' && room?.roomType != 'onetoone' && (
                <NavButton
                    style={{}}
                    title={t('admin:EditChatAdmin')}
                    hasIcon={false}
                    height={50}
                    onPress={() => {
                        navigation.push(side == 'admin' ? 'AdminEditChatAdmin' : 'WorkerEditChatAdmin', { roomId, threadId, name })
                    }}
                />
            )}
            {room?.roomType == 'custom' && (
                <NavButton
                    style={{}}
                    title={t('admin:EditGroupName')}
                    hasIcon={false}
                    height={50}
                    onPress={() => {
                        navigation.push(side == 'admin' ? 'AdminEditGroupName' : 'WorkerEditGroupName', { roomId, threadId, name })
                    }}
                />
            )}
            {!(room?.roomType == 'onetoone') && (
                <NavButton
                    style={{}}
                    title={t('admin:LeaveFromRoom')}
                    hasIcon={false}
                    height={50}
                    onPress={() => {
                        Alert.alert(t('admin:LeaveFromRoom'), t('admin:WantToLeaveRoom'), [
                            {
                                text: t('admin:LeaveFromRoom'),
                                onPress: () => leaveFromRoom(),
                            },
                            {
                                text: t('admin:Cancel'),
                                style: 'cancel',
                            },
                        ])
                    }}
                />
            )}

            <View
                style={{
                    paddingLeft: 15,
                    paddingTop: 36,
                }}>
                <Text style={{ color: THEME_COLORS.BLUE.MIDDLE, fontSize: 15, fontFamily: FontStyle.medium }}>{t('admin:MembersOfChat')}</Text>
            </View>
            <FlatList
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#FFF',
                    paddingTop: 15,
                }}
                contentContainerStyle={{ alignItems: 'center' }}
                data={roomUsers}
                renderItem={_content}
                keyExtractor={(item, i) => item.workerId || 'user-' + i}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
            />
        </View>
    )
}

export default ChatSettings
