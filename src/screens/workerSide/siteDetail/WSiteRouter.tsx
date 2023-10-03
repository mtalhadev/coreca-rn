import React, { useState, useRef, useEffect, createContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import WSiteDetail from './WSiteDetail'
import WSiteWorkerList from './WSiteWorkerList'
import { CustomTopTabBar } from '../../../components/template/CustomTopTabBar'
import { GreenColor } from '../../../utils/Styles'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

type NavProps = StackNavigationProp<RootStackParamList, 'WSiteRouter'>
type RouteProps = RouteProp<RootStackParamList, 'WSiteRouter'>

const TabStack = createMaterialTopTabNavigator()

export type WSiteRouterContextType = {
    siteId?: string
    update?: number
}
export const WSiteRouterContext = createContext<WSiteRouterContextType>({})

const WSiteRouter = () => {
    const { t, i18n } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const initialRouteName = route.params?.target ?? 'WSiteDetail'
    return (
        <WSiteRouterContext.Provider
            value={{
                siteId: route.params?.siteId,
                update: route.params?.update,
            }}>
            <TabStack.Navigator sceneContainerStyle={{ overflow: 'visible' }} initialRouteName={initialRouteName} tabBar={(props: any) => <CustomTopTabBar {...props} color={GreenColor} />}>
                <TabStack.Screen
                    name="WSiteDetail"
                    component={WSiteDetail}
                    options={{
                        title: `${t('worker:SiteDetails')}`,
                    }}
                />
                <TabStack.Screen
                    name="WSiteWorkerList"
                    component={WSiteWorkerList}
                    options={{
                        title: `${t('worker:ListOfWorker')}`,
                    }}
                />
            </TabStack.Navigator>
        </WSiteRouterContext.Provider>
    )
}
export default WSiteRouter

const styles = StyleSheet.create({})
