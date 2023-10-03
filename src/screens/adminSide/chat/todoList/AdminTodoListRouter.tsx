import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { createContext } from 'react'
import { CustomTopTabBar } from '../../../../components/template/CustomTopTabBar'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { BlueColor } from '../../../../utils/Styles'
import { RootStackParamList } from '../../../Router'
import AdminOngoingTodoList from './AdminOngoingTodoList'
import AdminCompletedTodoList from './AdminCompletedTodoList'

type NavProps = StackNavigationProp<RootStackParamList, 'AdminTodoListRouter'>
type RouteProps = RouteProp<RootStackParamList, 'AdminTodoListRouter'>

export type AdminTodoListRouterContextType = {
    update?: number
}
export const AdminTodoListRouterContextType = createContext<AdminTodoListRouterContextType>({})

const TabStack = createMaterialTopTabNavigator()

const AdminTodoListRouter = () => {
    const route = useRoute<RouteProps>()
    const navigation = useNavigation<NavProps>()
    const initialRouteName = route.params?.target ?? 'AdminProjectTodoList'
    const { t } = useTextTranslation()

    return (
        <AdminTodoListRouterContextType.Provider
            value={{
                update: route.params?.update,
            }}>
            <TabStack.Navigator sceneContainerStyle={{ overflow: 'visible' }} initialRouteName={initialRouteName} tabBar={(props: any) => <CustomTopTabBar {...props} color={BlueColor} />}>
                <TabStack.Screen name="AdminOngoingTodoList" component={AdminOngoingTodoList} options={{ title: t('admin:Ongoing') }} />
                <TabStack.Screen name="AdminCompletedTodoList" component={AdminCompletedTodoList} options={{ title: t('admin:Completed') }} />
            </TabStack.Navigator>
        </AdminTodoListRouterContextType.Provider>
    )
}

export default AdminTodoListRouter
