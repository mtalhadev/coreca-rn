import React, { createContext } from 'react'
import { StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import { useTextTranslation } from './../../../fooks/useTextTranslation'

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { CustomTopTabBar } from '../../../components/template/CustomTopTabBar'
import { BlueColor } from '../../../utils/Styles'
import { RootStackParamList } from '../../Router'
import PartnerCompanyList from '../company/PartnerCompanyList'
import ReceiveList from './ReceiveList'
import OrderList from './OrderList'

type NavProps = StackNavigationProp<RootStackParamList, 'TransactionListRouter'>
type RouteProps = RouteProp<RootStackParamList, 'TransactionListRouter'>
const TabStack = createMaterialTopTabNavigator()

export type TransactionListRouterContextType = {
    update?: number
}
export const TransactionListRouterContext = createContext<TransactionListRouterContextType>({})

const TransactionListRouter = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const initialRouteName = route.params?.target ?? 'ContractingProjectList'
    const { t } = useTextTranslation()

    return (
        <TransactionListRouterContext.Provider
            value={{
                update: route.params?.update,
            }}>
            <TabStack.Navigator sceneContainerStyle={{ overflow: 'visible' }} initialRouteName={initialRouteName} tabBar={(props: any) => <CustomTopTabBar {...props} color={BlueColor} />}>
                <TabStack.Screen name="ReceiveList" component={ReceiveList} options={{ title: t('admin:AcceptingAnOrder') }} />
                <TabStack.Screen name="OrderList" component={OrderList} options={{ title: t('admin:Order') }} />
                <TabStack.Screen name="PartnerCompanyList" component={PartnerCompanyList} options={{ title: t('admin:CustomerBusinessPartner') }} />
            </TabStack.Navigator>
        </TransactionListRouterContext.Provider>
    )
}
export default TransactionListRouter

const styles = StyleSheet.create({})
