import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { isEmpty } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, ListRenderItem, ListRenderItemInfo, RefreshControl, StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppButton } from '../../../../components/atoms/AppButton'
import { ChatUserItem } from '../../../../components/organisms/chat/SelectGroupUserItem'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { RoomRoleEnumType } from '../../../../models/roomUser/RoomUser'
import { WorkerCLType, WorkerType } from '../../../../models/worker/Worker'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { createCustomGroup, updateGroupMembers, getMembersListForCustomGroup, GetMembersListResponse } from '../../../../usecases/chat/MembersListCase'
import { SCREEN_WIDTH, THEME_COLORS } from '../../../../utils/Constants'
import { RootStackParamList } from '../../../../screens/Router'
import { SwitchAdminOrWorkerProps } from '../../../../utils/Utils'

export type WorkerUIType = WorkerType & {
    roomRole?: RoomRoleEnumType
    isShowSelected?: boolean
    selected?: boolean
    onSelect?: (workerId: string) => void
    onRemove?: () => void
    iconSize?: number
}

type InitialStateType = {
    allUsers?: WorkerUIType[]
    selectedUsers?: Map<string, boolean>
    updateCache: number
    refreshing: boolean
}
const initialState: InitialStateType = {
    allUsers: [],
    selectedUsers: new Map(),
    updateCache: 0,
    refreshing: true,
}
type NavProps = StackNavigationProp<RootStackParamList, 'AdminSelectUsersForCustomGroup'>
type RouteProps = RouteProp<RootStackParamList, 'AdminSelectUsersForCustomGroup'>

const SelectUsersForCustomGroup = (props: Partial<SwitchAdminOrWorkerProps>) => {
    const [{ allUsers, selectedUsers, updateCache, refreshing }, setState] = useState(initialState)
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const side = props.side ?? 'admin'
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const accountId = signInUser?.accountId ?? ''
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const { roomId, threadId, name } = route.params || { roomId: '', threadId: '', name: '' }

    console.log('selectedUsers: ', selectedUsers)

    useEffect(() => {
        setState((prev) => ({ ...prev, selectedUsers: new Map<string, boolean>() }))
    }, [])

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(signInUser?.workerId) || refreshing != true) {
                    dispatch(setIsNavUpdating(false))
                    setState((prev) => ({ ...prev, refreshing: false }))
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const membersResult: CustomResponse<GetMembersListResponse> = await getMembersListForCustomGroup({
                    myWorkerId: signInUser?.workerId ?? 'no-id',
                    roomId: roomId,
                })
                if (membersResult.error) {
                    dispatch(
                        setToastMessage({
                            text: membersResult.error,
                            type: 'error',
                        } as ToastMessage),
                    )
                    return
                }
                setState((prev) => ({ ...prev, allUsers: membersResult.success ?? [] }))
                console.log('chat members: ', membersResult.success)
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                setState((prev) => ({ ...prev, refreshing: false }))
                if (isFocused) {
                    dispatch(setIsNavUpdating(false))
                    dispatch(setLoading(false))
                }
            }
        })()
    }, [refreshing])

    useSafeLoadingUnmount(dispatch, isFocused)

    useSafeUnmount(setState, initialState)

    const _content: ListRenderItem<WorkerUIType> = (info: ListRenderItemInfo<WorkerUIType>) => {
        const { item, index } = info
        const item2 = {
            ...item,
            isShowSelected: true,
            selected: item.workerId ? selectedUsers?.get(item.workerId) : false,
            onSelect: (workerId: string) => _onSelect(workerId),
            iconSize: 35,
        }
        return <ChatUserItem {...item2} />
    }
    const _onRefresh = async () => {
        setState((prev) => ({ ...prev, refreshing: true }))
    }

    const _onSelect = useCallback(
        async (workerId: string) => {
            const newSelected = new Map(selectedUsers)
            newSelected.set(workerId, !newSelected.get(workerId))
            setState((prev) => ({ ...prev, selectedUsers: newSelected }))
        },
        [selectedUsers],
    )

    const _createCustomGroup = async () => {
        const selectedUserIds: string[] = []

        for (let i = 0; i < (allUsers?.length || 0); i++) {
            const user = allUsers ? allUsers[i] : undefined
            if (user && user.workerId && selectedUsers?.get(user.workerId)) {
                selectedUserIds.push(user.workerId)
            }
        }
        if (selectedUserIds.length === 0) {
            dispatch(
                setToastMessage({
                    text: t('admin:NoMemberSelected'),
                    type: 'error',
                }),
            )
            return
        }
        if (roomId) {
            const updateRoomResult = await updateGroupMembers(selectedUserIds, roomId)
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
                        text: t('admin:CustomGroupMembersAdded'),
                        type: 'success',
                    }),
                )
                navigation.goBack()
            }
        } else {
            const makeRoomResult = await createCustomGroup(selectedUserIds, signInUser?.workerId ?? 'no-id')
            if (makeRoomResult.error) {
                console.log('_onChat error: ', makeRoomResult.error)
                dispatch(
                    setToastMessage({
                        text: makeRoomResult.error,
                        type: 'error',
                    }),
                )
            } else if (makeRoomResult.success) {
                dispatch(
                    setToastMessage({
                        text: t('admin:CustomGroupCreated'),
                        type: 'success',
                    }),
                )
                const { roomId, rootThreadId, name } = makeRoomResult.success

                // if (signInUser?.worker?.companyRole == 'general') {
                //   navigation.push('WorkerChatListRouter')
                // } else {
                //   navigation.push('AdminChatListRouter')
                // }
                navigation.push(side == 'admin' ? 'AdminChatDetail' : 'WorkerChatDetail', {
                    roomId: roomId,
                    threadId: rootThreadId,
                    name: name ?? '',
                })
            }
        }
    }

    let _selectedUserCount = 0
    selectedUsers?.forEach((value, key) => {
        if (value === true) _selectedUserCount++
    })

    return (
        <View style={styles.container}>
            <AppButton
                style={{
                    margin: 15,
                }}
                isGray
                hasShadow={false}
                title={t('admin:AddSelectedUsers')}
                onPress={() => _createCustomGroup()}
                disabled={_selectedUserCount === 0}
            />
            <FlatList
                style={{
                    backgroundColor: '#FFF',
                    marginTop: 20,
                }}
                contentContainerStyle={{ alignItems: 'center' }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={_onRefresh} />}
                data={allUsers}
                extraData={selectedUsers}
                renderItem={_content}
                keyExtractor={(item, i) => item.workerId || 'user-' + i}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
    },
})

export default SelectUsersForCustomGroup
