import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, ListRenderItem, ListRenderItemInfo, RefreshControl, StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { AppButton } from '../../../../components/atoms/AppButton'
import { ChatUserItem } from '../../../../components/organisms/chat/SelectGroupUserItem'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { WorkerType } from '../../../../models/worker/Worker'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { RootStackParamList } from '../../../../screens/Router'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { getMemberListOfPCCOC, updateGroupMembers } from '../../../../usecases/chat/MembersListCase'
import { SCREEN_WIDTH, THEME_COLORS } from '../../../../utils/Constants'
import { SwitchAdminOrWorkerProps } from '../../../../utils/Utils'

export type WorkerUIType = WorkerType & {
  isShowSelected?: boolean
  selected?: boolean
  onSelect?: (workerId: string) => void
}

type InitialStateType = {
  allUsers?: WorkerUIType[],
  selectedUsers?: Map<string, boolean>,
  updateCache: number,
  refreshing: boolean
}
const initialState: InitialStateType = {
  allUsers: [],
  selectedUsers: new Map(),
  updateCache: 0,
  refreshing: false
}
type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'AdminSelectUsersForPCCOC'>

const SelectUsersForPCCOC = (props: Partial<SwitchAdminOrWorkerProps>) => {
  const [{ allUsers, selectedUsers, updateCache, refreshing }, setState] = useState(initialState)
  const { t } = useTextTranslation()
  const navigation = useNavigation<NavProps>()
  const route = useRoute<RouteProps>()
  const side = props.side ?? 'admin'
  const dispatch = useDispatch();
  const isFocused = useIsFocused();
  const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
  const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
  const signInUser = useSelector((state: StoreType) => state.account.signInUser)
  const accountId = signInUser?.accountId ?? ''
  const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
  const { roomId, threadId, name } = route.params || { roomId: '', threadId: "", name: "" };

    useEffect(() => {
      ;(async () => {
          try {
              dispatch(setLoading(true))
              const resultList = await getMemberListOfPCCOC({myCompanyId: myCompanyId ?? 'no-id', myWorkerId: signInUser?.workerId ?? 'no-id', roomId: roomId ?? 'no-id' })
              if (resultList.error) {
                  dispatch(
                      setToastMessage({
                          text: resultList.error,
                          type: 'error',
                      } as ToastMessage),
                  )
                  return
              }
              
              
              setState((prev) => ({ ...prev, allUsers: resultList.success ?? []}))
              
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
          }
      })()
  }, [])

    useSafeLoadingUnmount(dispatch, isFocused)

    useSafeUnmount(setState, initialState)


    const _content: ListRenderItem<WorkerUIType> = (info: ListRenderItemInfo<WorkerUIType>) => {
      const { item, index } = info;
      const item2 = {
        ...item,
        isShowSelected: true,
        selected: item.workerId ? selectedUsers?.get(item.workerId) : false,
        onSelect: (workerId: string) => _onSelect(workerId),
        iconSize: 35
      }
      return (
        <ChatUserItem {...item2} />
      )
    }
    const _onRefresh = async () => {
      setState((prev) => ({ ...prev, refreshing: true }))
  }

  const _onSelect = useCallback(
    async (workerId: string) => {
      const newSelected = new Map(selectedUsers);
      newSelected.set(workerId, !newSelected.get(workerId))
      setState((prev) => ({ ...prev, selectedUsers: newSelected }))
    },
    [selectedUsers]
  )

  const _updateMembersOfGroup = async () => {
    const selectedUserIds: string[] = [];
    
    for (let i = 0; i < (allUsers?.length || 0); i++) {
      const user = allUsers ? allUsers[i] : undefined;
      if(user && user.workerId && selectedUsers?.get(user.workerId)) {
        selectedUserIds.push(user.workerId);
      }
    }
    if(selectedUserIds.length===0){
      dispatch(
        setToastMessage({
          text: 'No member selected!',
          type: 'error',
        })
      )
      return;
    }
    if(roomId){
      const updateRoomResult = await updateGroupMembers(selectedUserIds, roomId)
      if (updateRoomResult.error) {
          console.log('updateRoomResult error: ', updateRoomResult.error);
          dispatch(
              setToastMessage({
                  text: updateRoomResult.error,
                  type: 'error',
              }),
          )
      } else if (updateRoomResult.success){
          dispatch(
              setToastMessage({
                  text: 'group members added',
                  type: 'success',
              }),
          );  
          navigation.goBack();
      }  
    } 
  }

  let _selectedUserCount = 0;
  selectedUsers?.forEach((value, key) => {
    if(value===true) 
      _selectedUserCount++;
  })

  return (
    <View style={styles.container}>
        <View style={{ width: '100%', height: 60, flexDirection: "row", alignItems: 'center', paddingHorizontal: 10, paddingTop: 10 }}>
            <AppButton
              style={{
                width: SCREEN_WIDTH-20,
                marginTop: 20,
                marginBottom: 10,
                backgroundColor: "transparent",
                paddingHorizontal: 20,
              }}
              hasShadow={false}
              borderColor={THEME_COLORS.OTHERS.BORDER_COLOR2}
              borderWidth={1}
              textColor={THEME_COLORS.OTHERS.BLACK}
              title={t('admin:AddSelectedUsers')}
              onPress={() => _updateMembersOfGroup()}
              disabled={_selectedUserCount===0}
            />
        </View>
        <FlatList
            style={{
              width: '90%',
              height: '100%',
              backgroundColor: '#FFF',
              marginTop: 20,
            }}
            contentContainerStyle={{ alignItems:'center' }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={_onRefresh} />}
            data={allUsers}
            extraData={selectedUsers}
            renderItem={_content}
            keyExtractor={(item, i) => item.workerId || 'user-'+i}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            />  
    </View>
  )
}   

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#FFF',
	},
});

export default SelectUsersForPCCOC;