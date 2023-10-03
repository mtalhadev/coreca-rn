import React, { createContext, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import WorkerAttendanceList from './WorkerAttendanceList'
import WorkerProfile from './WorkerProfile'
import { CustomTopTabBar } from '../../../../components/template/CustomTopTabBar'
import { BlueColor } from '../../../../utils/Styles'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'

type NavProps = StackNavigationProp<RootStackParamList, 'WorkerDetailRouter'>
type RouteProps = RouteProp<RootStackParamList, 'WorkerDetailRouter'>
const TabStack = createMaterialTopTabNavigator()

export type WorkerDetailRouterContextType = {
    workerId?: string
    arrangementId?: string
    update?: number
}
export const WorkerDetailRouterContextType = createContext<WorkerDetailRouterContextType>({})

const WorkerDetailRouter = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const initialRouteName = route.params?.target ?? 'WorkerProfile'
    useEffect(() => {
        navigation.setOptions({
            title: `${route.params?.arrangementId != undefined ? t('admin:WorkerArrangement') : t('common:Labourer')} / ${route.params?.title}`,
        })
    }, [navigation])
    return (
        <WorkerDetailRouterContextType.Provider
            value={{
                workerId: route.params?.workerId,
                arrangementId: route.params?.arrangementId,
                update: route.params?.update,
            }}>
            <TabStack.Navigator sceneContainerStyle={{ overflow: 'visible' }} initialRouteName={initialRouteName} tabBar={(props: any) => <CustomTopTabBar {...props} color={BlueColor} />}>
                <TabStack.Screen
                    name="WorkerProfile"
                    component={WorkerProfile}
                    options={{
                        title: t('common:Profile'),
                    }}
                />
                <TabStack.Screen
                    name="WorkerAttendanceList"
                    component={WorkerAttendanceList}
                    options={{
                        title: t('admin:AttendanceRecorded'),
                    }}
                />
            </TabStack.Navigator>
        </WorkerDetailRouterContextType.Provider>
    )
}
export default WorkerDetailRouter

const styles = StyleSheet.create({})
