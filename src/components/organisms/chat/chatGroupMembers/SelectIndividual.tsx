import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { isEmpty } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, ListRenderItem, ListRenderItemInfo, RefreshControl } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { ChatUserItem } from '../SelectIndividualItem'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { RoomRoleEnumType } from '../../../../models/roomUser/RoomUser'
import { WorkerCLType, WorkerType } from '../../../../models/worker/Worker'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { StoreType } from '../../../../stores/Store'
import { setLoading, setLocalUpdateScreens, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { genKeyName, getCachedData, updateCachedData } from '../../../../usecases/CachedDataCase'
import { createOntooneRoom, getMembersListForOnetooneChat, GetMembersListResponse } from '../../../../usecases/chat/MembersListCase'
import { deleteScreenOfUpdateScreens } from '../../../../usecases/updateScreens/CommonUpdateScreensCase'
import { RootStackParamList } from '../../../../screens/Router'
import { SwitchAdminOrWorkerProps } from '../../../../utils/Utils'

const USERS: WorkerUIType[] = [
    // {
    //     workerId: 'user-1',
    //     imageUrl: 'https://i.pravatar.cc/50',
    //     name: '佐久木希',
    //     company: {
    //       companyId: 'company-1',
    //       name: '株式会社 力'
    //     },
    // },
    // {
    //     workerId: 'user-2',
    //     imageUrl: 'https://i.pravatar.cc/50',
    //     name: '酒井 啓介',
    //     company: {
    //       companyId: 'company-1',
    //       name: '株式会社 力'
    //     },

    // },
    // {
    //     workerId: 'user-3',
    //     imageUrl: 'https://i.pravatar.cc/50',
    //     name: '高井 悟',
    //     company: {
    //       companyId: 'company-2',
    //       name: '株式会社イージーワークス'
    //     },
    // },
    // {
    //     workerId: 'user-4',
    //     imageUrl: 'https://i.pravatar.cc/50',
    //     name: '中山康二',
    //     company: {
    //       companyId: 'company-2',
    //       name: '株式会社イージーワークス'
    //     },
    // },
]


export type WorkerUIType = WorkerType & {
    onChat?: (worker: WorkerType) => void
}
type InitialStateType = {
  allUsers?: WorkerUIType[],
  updateCache: number,
  refreshing: boolean
}
const initialState: InitialStateType = {
  allUsers: USERS,
  updateCache: 0,
  refreshing: true
}

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

const SelectIndividual = (props: Partial<SwitchAdminOrWorkerProps>) => {
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
  const cachedMembersListKey = genKeyName({ screenName: 'SelectIndividual', accountId: accountId, companyId: myCompanyId ?? '' })



  

    useEffect(() => {
      ;(async () => {
          try {
              if (isEmpty(signInUser?.workerId) || refreshing != true) {
                
                  dispatch(setIsNavUpdating(false))
                  setState((prev) => ({ ...prev, refreshing: false }))
                  return
              }
              dispatch(setLoading(true))
              const membersResult: CustomResponse<GetMembersListResponse> = await getMembersListForOnetooneChat({
                  myWorkerId: signInUser?.workerId ?? 'no-id',
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
              /**
               * キャッシュアップデート前に先に表示データを更新。
               */
              setState((prev) => ({ ...prev, allUsers: membersResult.success ?? []}))
              console.log('chat members: ', membersResult.success);
              
              const cachedResult = await updateCachedData({ key: cachedMembersListKey, value: membersResult.success })
              if (cachedResult.error) {
                  dispatch(
                      setToastMessage({
                          text: cachedResult.error,
                          type: 'error',
                      }),
                  )
              }
              await deleteScreenOfUpdateScreens({ accountId, screenName: 'SelectIndividual' })
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
      const { item, index } = info;
      const item2 = {...item, onChat: (worker: WorkerType) => _onChat(worker)}

      return (
        <ChatUserItem {...item2} />
      )
    }
    const _onRefresh = async () => {
      setState((prev) => ({ ...prev, refreshing: true }))
      console.log("_onRefresh" + refreshing)
    }

    const _onChat = useCallback(
      async (worker: WorkerType) => {
        const makeRoomResult = await createOntooneRoom(worker.workerId ?? 'no-id', signInUser?.workerId ?? 'no-id')
        if (makeRoomResult.error) {
            console.log('_onChat error: ', makeRoomResult.error);
            dispatch(
                setToastMessage({
                    text: makeRoomResult.error,
                    type: 'error',
                }),
            )
        } else if (makeRoomResult.success){
            dispatch(
                setToastMessage({
                    text: t('admin:DMChatCreated'),
                    type: 'success',
                }),
            );
            const {
                roomId,
                rootThreadId,
            } = makeRoomResult.success;

            // if (signInUser?.worker?.companyRole == 'general') {
            //     navigation.push('WorkerChatListRouter')
            // }
            // else {
            //     navigation.push('AdminChatListRouter')
            // }
            navigation.push(side == 'admin' ? 'AdminChatDetail' : 'WorkerChatDetail', {
                roomId: roomId,
                threadId: rootThreadId,
                name: worker?.name ?? '',
            });
        }
      },
      []
    )


  return (
        <FlatList
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#FFF',
              paddingTop: 20
            }}
            contentContainerStyle={{ alignItems:'center' }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={_onRefresh} />}
            data={allUsers}
            renderItem={_content}
            keyExtractor={(item, i) => item.workerId || 'user-'+i}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            />  
  )
}   

export default SelectIndividual;