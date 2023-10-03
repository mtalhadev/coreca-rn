import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { RootStackParamList } from '../../../../screens/Router'
import { StoreType } from '../../../../stores/Store'
import { setToastMessage } from '../../../../stores/UtilSlice'
import { updateGroupName } from '../../../../usecases/chat/MembersListCase'
import { PLACEHOLDER } from '../../../../utils/Constants'
import { SwitchAdminOrWorkerProps } from '../../../../utils/Utils'
import { AppButton } from '../../../atoms/AppButton'
import { InputTextBox } from '../../inputBox/InputTextBox'

type InitialStateType = {
  name: string
  updateCache: number,
  refreshing: boolean
}
const initialState: InitialStateType = {
  name: '',
  updateCache: 0,
  refreshing: false
}

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'AdminEditGroupName'>

const EditGroupName = (props: Partial<SwitchAdminOrWorkerProps>) => {
  const [{ updateCache, refreshing, name }, setState] = useState(initialState)
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
  const { roomId, threadId, name: groupName } = route.params || { roomId: '', threadId: "", name: "" };

    useSafeLoadingUnmount(dispatch, isFocused)

    useSafeUnmount(setState, initialState)

    useEffect(() => {
      setState((prev) => ({...prev, name: groupName ?? 'no-name'}))
    }, [])

    const saveGroupName = async (name: string) => {
      if(name.length===0) return;
      if(roomId) {
        const updateRoomResult = await updateGroupName(roomId, name)
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
                    text: 'Custom group name updated',
                    type: 'success',
                }),
            );  
            navigation.goBack();
        }  
      } 
    }
    
  return (
    <View style={{
      flex: 1,
      backgroundColor: 'white',  
    }}>

      <View style={{ 
        width: '100%',
        paddingLeft: 0,
        paddingTop: 20,
        paddingBottom: 19,
      }}>
          <InputTextBox
              style={{ marginTop: 30, marginHorizontal: 10 }}
              required={true}
              title={t('admin:GroupName')}
              value={name}
              infoText={'Write comprehensive name'}
              placeholder={PLACEHOLDER.GROUP_NAME}
              onValueChangeValid={(value) => {
                  setState((prev) => ({ ...prev, name: value || '' }))
              }}
          />

            <AppButton
                style={{
                    marginTop: 40,
                    marginHorizontal: 20,
                }}
                title={t('common:Save')}
                disabled={name.length==0}
                onPress={() => {
                    saveGroupName(name)
                }}
            />


      </View>
    </View>
  )
}   

export default EditGroupName;