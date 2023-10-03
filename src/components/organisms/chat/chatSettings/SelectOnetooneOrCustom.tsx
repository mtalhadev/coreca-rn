import { useIsFocused, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React from 'react'
import { Text, View } from 'react-native'
import { useDispatch } from 'react-redux'
import { NavButton } from '../../../atoms/NavButton'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { THEME_COLORS } from '../../../../utils/Constants'
import { FontStyle } from '../../../../utils/Styles'
import { RootStackParamList } from '../../../../screens/Router'
import { SwitchAdminOrWorkerProps } from '../../../../utils/Utils'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>

const SelectOnetooneOrCustom = (props: Partial<SwitchAdminOrWorkerProps>) => {
  const { t } = useTextTranslation()
  const navigation = useNavigation<NavProps>()
  const side = props.side ?? 'admin'

  const dispatch = useDispatch();
	const isFocused = useIsFocused();

    useSafeLoadingUnmount(dispatch, isFocused)

  return (
    <View style={{
      flex: 1,
      backgroundColor: 'white',  
    }}>

      <View style={{ 
        width: '100%',
        paddingLeft: 30,
        paddingTop: 36,
        paddingBottom: 19,
      }}>
        <Text style={{ color: THEME_COLORS.BLUE.MIDDLE, fontSize: 15, fontFamily: FontStyle.medium }}>
          {t('admin:SelectRoomType')}
        </Text>
      </View>

      <NavButton
          style={{}}
          title={t('admin:Onetoone')}
          hasIcon={false}
          onPress={() => {
            navigation.navigate(side == 'admin' ? 'AdminSelectIndividual' : 'WorkerSelectIndividual');
          }}
      />
      <NavButton
          style={{}}
          title={t('admin:CustomGroup')}
          hasIcon={false}
          onPress={() => {
            navigation.navigate(side == 'admin' ? 'AdminSelectUsersForCustomGroup' : 'WorkerSelectUsersForCustomGroup');
          }}
      />

    </View>
  )
}   

export default SelectOnetooneOrCustom;