import React, { createContext, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Animated, TouchableOpacity, PlatformColor, Easing } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import AdminSettings from './AdminSettings'
import MyCompanyDetail from './MyCompanyDetail'
import MyCompanyWorkerList from './MyCompanyWorkerList'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/core'

import { BlueColor, GreenColor } from './../../../utils/Styles'
import { CustomTopTabBar } from '../../../components/template/CustomTopTabBar'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { useTextTranslation } from './../../../fooks/useTextTranslation'

type NavProps = StackNavigationProp<RootStackParamList, 'AdminMyPageRouter'>
type RouteProps = RouteProp<RootStackParamList, 'AdminMyPageRouter'>

export type AdminMyPageRouterContextType = {
    update?: number
}
export const AdminMyPageRouterContextType = createContext<AdminMyPageRouterContextType>({})

const TabStack = createMaterialTopTabNavigator()
const AdminMyPageRouter = () => {
    const route = useRoute<RouteProps>()
    const navigation = useNavigation<NavProps>()
    const initialRouteName = route.params?.target ?? 'MyCompanyDetail'
    const { t } = useTextTranslation()

    return (
        <AdminMyPageRouterContextType.Provider
            value={{
                update: route.params?.update,
            }}>
            <TabStack.Navigator sceneContainerStyle={{ overflow: 'visible' }} initialRouteName={initialRouteName} tabBar={(props: any) => <CustomTopTabBar {...props} color={BlueColor} />}>
                <TabStack.Screen name="MyCompanyDetail" component={MyCompanyDetail} options={{ title: t('admin:CompanyDetails') }} />
                <TabStack.Screen name="MyCompanyWorkerList" component={MyCompanyWorkerList} options={{ title: t('admin:InhouseWorkers') }} />
                <TabStack.Screen name="AdminSettings" component={AdminSettings} options={{ title: t('admin:Settings') }} />
            </TabStack.Navigator>
        </AdminMyPageRouterContextType.Provider>
    )
}
export default AdminMyPageRouter

const styles = StyleSheet.create({})
