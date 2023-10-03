import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { FlatList, ListRenderItem, ListRenderItemInfo, RefreshControl, StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { RoomUserType } from '../../../../models/roomUser/RoomUser'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { RootStackParamList } from '../../../../screens/Router'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { getMemberListOfEditAdmin, updateChatAdminMembers } from '../../../../usecases/chat/MembersListCase'
import { SCREEN_WIDTH, THEME_COLORS } from '../../../../utils/Constants'
import { SwitchAdminOrWorkerProps } from '../../../../utils/Utils'
import { AppButton } from '../../../atoms/AppButton'
import { WorkerUIType } from '../chatGroupMembers/SelectUsersForCustomGroup'
import { ChatUserItem } from '../SelectGroupUserItem'

type InitialStateType = {
  allUsers?: WorkerUIType[],
  updateCache: number,
  refreshing: boolean
}
const initialState: InitialStateType = {
  allUsers: [],
  updateCache: 0,
  refreshing: false
}
type NavProps = StackNavigationProp<RootStackParamList, 'AdminEditChatAdmin'>
type RouteProps = RouteProp<RootStackParamList, 'AdminEditChatAdmin'>

const EditChatAdmin = (props: Partial<SwitchAdminOrWorkerProps>) => {
  const [{ allUsers, updateCache, refreshing }, setState] = useState(initialState)
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
              const resultList = await getMemberListOfEditAdmin({myCompanyId: myCompanyId ?? 'no-id', myWorkerId: signInUser?.workerId ?? 'no-id', roomId: roomId ?? 'no-id' })
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


    const _content: ListRenderItem<RoomUserType> = (info: ListRenderItemInfo<RoomUserType>) => {
      const { item, index } = info;
      const item2 = {
        ...item.worker,
        roomRole: item.roomRole,
        isShowSelected: true,
        selected: item.roomRole == 'admin',
        onSelect: (workerId: string) => _onSelect(workerId),
        iconSize: 40
      }
      return (
        <ChatUserItem {...item2} />
      )
    }
    const _onRefresh = async () => {
      setState((prev) => ({ ...prev, refreshing: true }))
  }

  const _onSelect = (workerId: string) => {
    const newList = allUsers?.map(user => {
        if (user.workerId == workerId) {
            user.roomRole = user.roomRole == 'admin' ? 'general' : 'admin'
        }
        return user
    })
    
    setState((prev) => ({ ...prev, allUsers: newList }))
  }

  const _updateMembersOfGroup = async () => {
    
    if ((allUsers?.filter(user => user.roomRole == 'admin') ?? []).length == 0) {
      dispatch(
        setToastMessage({
          text: '最低１人の管理者が必要です',
          type: 'error',
        })
      )
      return;
    }
    if (roomId) {
      const updateRoomResult = await updateChatAdminMembers(allUsers ?? [], roomId)
      if (updateRoomResult.error) {
          dispatch(
              setToastMessage({
                  text: updateRoomResult.error,
                  type: 'error',
              }),
          )
      } else if (updateRoomResult.success){
          dispatch(
              setToastMessage({
                  text: '管理者が変更されました',
                  type: 'success',
              }),
          );  
          navigation.goBack();
      }  
    } 
  }


  return (
    <View style={styles.container}>
        <View style={{ width: '100%', height: 60, flexDirection: "row", alignItems: 'center', paddingHorizontal: 10, paddingTop: 10 }}>
            <AppButton
              style={{
                width: SCREEN_WIDTH -20, 
                marginTop: 20,
                marginBottom: 10,
                backgroundColor: "transparent",
                paddingHorizontal: 20,
              }}
              hasShadow={false}
              borderColor={THEME_COLORS.OTHERS.BORDER_COLOR2}
              borderWidth={1}
              textColor={THEME_COLORS.OTHERS.BLACK}
              title={t('admin:ChooseAdminUsers')}
              onPress={() => _updateMembersOfGroup()}
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

export default EditChatAdmin;