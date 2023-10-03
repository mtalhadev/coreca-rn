import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { createContext } from 'react'
import { CustomTopTabBar } from '../../../../components/template/CustomTopTabBar'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { BlueColor } from '../../../../utils/Styles'
import { RootStackParamList } from '../../../Router'
import AdminDMRoomList from './AdminDMRoomList'
import AdminChatProjectList from './AdminChatProjectList'
import AdminThreadList from './AdminThreadList'

type NavProps = StackNavigationProp<RootStackParamList, 'AdminChatListRouter'>
type RouteProps = RouteProp<RootStackParamList, 'AdminChatListRouter'>

export type AdminChatListRouterContextType = {
    update?: number
}
export const AdminChatListRouterContextType = createContext<AdminChatListRouterContextType>({})

const TabStack = createMaterialTopTabNavigator()
const AdminChatListRouter = () => {
    const route = useRoute<RouteProps>()
    const navigation = useNavigation<NavProps>()
    const initialRouteName = route.params?.target ?? 'AdminProjectChatList'
    const { t } = useTextTranslation()

    return (
        <AdminChatListRouterContextType.Provider
            value={{
                update: route.params?.update,
            }}>
            <TabStack.Navigator sceneContainerStyle={{ overflow: 'visible' }} initialRouteName={initialRouteName} tabBar={(props: any) => <CustomTopTabBar {...props} color={BlueColor} />}>
                <TabStack.Screen name="AdminProjectChatList" component={AdminChatProjectList} options={{ title: t('admin:Project') }} />
                <TabStack.Screen name="AdminThreadList" component={AdminThreadList} options={{ title: t('admin:Thread') }} />
                <TabStack.Screen name="AdminDMRoomList" component={AdminDMRoomList} options={{ title: t('admin:DM') }} />
            </TabStack.Navigator>
        </AdminChatListRouterContextType.Provider>
    )
}

export default AdminChatListRouter
