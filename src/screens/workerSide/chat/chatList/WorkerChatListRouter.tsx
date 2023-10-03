import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { createContext } from 'react'
import { CustomTopTabBar } from '../../../../components/template/CustomTopTabBar'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { BlueColor, GreenColor } from '../../../../utils/Styles'
import { RootStackParamList } from '../../../Router'
import WorkerDMRoomList from './WorkerDMRoomList'
import WorkerChatProjectList from './WorkerChatProjectList'
import WorkerThreadList from './WorkerThreadList'

type NavProps = StackNavigationProp<RootStackParamList, 'WorkerChatListRouter'>
type RouteProps = RouteProp<RootStackParamList, 'WorkerChatListRouter'>

export type WorkerChatListRouterContextType = {
    update?: number
}
export const WorkerChatListRouterContextType = createContext<WorkerChatListRouterContextType>({})

const TabStack = createMaterialTopTabNavigator()
const WorkerChatListRouter = () => {
    const route = useRoute<RouteProps>()
    const navigation = useNavigation<NavProps>()
    const initialRouteName = route.params?.target ?? 'WorkerProjectChatList'
    const { t } = useTextTranslation()

    return (
        <WorkerChatListRouterContextType.Provider
            value={{
                update: route.params?.update,
            }}>
            <TabStack.Navigator sceneContainerStyle={{ overflow: 'visible' }} initialRouteName={initialRouteName} tabBar={(props: any) => <CustomTopTabBar {...props} color={GreenColor} />}>
                <TabStack.Screen name="WorkerProjectChatList" component={WorkerChatProjectList} options={{ title: t('admin:Project') }} />
                <TabStack.Screen name="WorkerThreadList" component={WorkerThreadList} options={{ title: t('admin:Thread') }} />
                <TabStack.Screen name="WorkerDMRoomList" component={WorkerDMRoomList} options={{ title: t('admin:DM') }} />
            </TabStack.Navigator>
        </WorkerChatListRouterContextType.Provider>
    )
}

export default WorkerChatListRouter
