import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { createContext } from 'react'
import { CustomTopTabBar } from '../../../../components/template/CustomTopTabBar'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { BlueColor, GreenColor } from '../../../../utils/Styles'
import { RootStackParamList } from '../../../Router'
import WorkerOngoingTodoList from './WorkerOngoingTodoList'
import WorkerCompletedTodoList from './WorkerCompletedTodoList'

type NavProps = StackNavigationProp<RootStackParamList, 'WorkerTodoListRouter'>
type RouteProps = RouteProp<RootStackParamList, 'WorkerTodoListRouter'>

export type WorkerTodoListRouterContextType = {
    update?: number
}
export const WorkerTodoListRouterContextType = createContext<WorkerTodoListRouterContextType>({})

const TabStack = createMaterialTopTabNavigator()

const WorkerTodoListRouter = () => {
    const route = useRoute<RouteProps>()
    const navigation = useNavigation<NavProps>()
    const initialRouteName = route.params?.target ?? 'WorkerProjectTodoList'
    const { t } = useTextTranslation()

    return (
        <WorkerTodoListRouterContextType.Provider
            value={{
                update: route.params?.update,
            }}>
            <TabStack.Navigator sceneContainerStyle={{ overflow: 'visible' }} initialRouteName={initialRouteName} tabBar={(props: any) => <CustomTopTabBar {...props} color={GreenColor} />}>
                <TabStack.Screen name="WorkerOngoingTodoList" component={WorkerOngoingTodoList} options={{ title: t('admin:Ongoing') }} />
                <TabStack.Screen name="WorkerCompletedTodoList" component={WorkerCompletedTodoList} options={{ title: t('admin:Completed') }} />
            </TabStack.Navigator>
        </WorkerTodoListRouterContextType.Provider>
    )
}

export default WorkerTodoListRouter
