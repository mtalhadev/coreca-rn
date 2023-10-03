import React, { useState, useRef, useEffect, createContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import MyAttendanceList from './MyAttendanceList'
import MyProfile from './MyProfile'
import MySettings from './MySettings'
import { GreenColor } from '../../../utils/Styles'
import { CustomTopTabBar } from '../../../components/template/CustomTopTabBar'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>
const TabStack = createMaterialTopTabNavigator()

export type MyPageRouterContextType = {
    update?: number
}
export const MyPageRouterContext = createContext<MyPageRouterContextType>({})

const MyPageRouter = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const initialRouteName = route.params?.target ?? 'MyProfile'
    const { t, i18n } = useTextTranslation()

    return (
        <MyPageRouterContext.Provider
            value={{
                update: route?.params?.update,
            }}>
            <TabStack.Navigator sceneContainerStyle={{ overflow: 'visible' }} initialRouteName={initialRouteName} tabBar={(props: any) => <CustomTopTabBar {...props} color={GreenColor} />}>
                <TabStack.Screen
                    name="MyProfile"
                    component={MyProfile}
                    options={{
                        title: t('worker:Profile'),
                    }}
                />
                <TabStack.Screen
                    name="MyAttendanceList"
                    component={MyAttendanceList}
                    options={{
                        title: t('worker:AttendanceHistory'),
                    }}
                />
                <TabStack.Screen
                    name="MySettings"
                    component={MySettings}
                    options={{
                        title: t('worker:Setting'),
                    }}
                />
            </TabStack.Navigator>
        </MyPageRouterContext.Provider>
    )
}
export default MyPageRouter

const styles = StyleSheet.create({})
