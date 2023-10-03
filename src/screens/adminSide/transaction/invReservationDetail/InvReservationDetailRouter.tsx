import React, { createContext, useCallback, useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import InvReservationDetail from './InvReservationDetail'
import { CustomTopTabBar } from '../../../../components/template/CustomTopTabBar'
import { BlueColor } from '../../../../utils/Styles'
import InvReservationInvRequestList from './InvReservationInvRequestList'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'

type NavProps = StackNavigationProp<RootStackParamList, 'InvReservationDetailRouter'>
type RouteProps = RouteProp<RootStackParamList, 'InvReservationDetailRouter'>
const TabStack = createMaterialTopTabNavigator()

export type InvReservationDetailRouterContextType = {
    invReservationId?: string
    // tabを超えて戻る。
    goBackBeyondTab?: () => void
}
export const InvReservationDetailRouterContext = createContext<InvReservationDetailRouterContextType>({})

const InvReservationDetailRouter = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const initialRouteName = route.params?.target ?? 'InvReservationDetail'

    const goBackBeyondTab = useCallback(() => {
        navigation.goBack()
    }, [navigation])

    useEffect(() => {
        navigation.setOptions({
            title: route.params?.type == 'order' ? t('admin:WillBeSendingInSupport') : t('admin:WillBeComingInSupport'),
        })
    }, [navigation])
    return (
        <InvReservationDetailRouterContext.Provider
            value={{
                invReservationId: route.params?.invReservationId,
                goBackBeyondTab,
            }}>
            <TabStack.Navigator sceneContainerStyle={{ overflow: 'visible' }} initialRouteName={initialRouteName} tabBar={(props: any) => <CustomTopTabBar {...props} color={BlueColor} />}>
                <TabStack.Screen
                    name="InvReservationDetail"
                    component={InvReservationDetail}
                    options={{
                        title: t('admin:Details'),
                    }}
                />
                <TabStack.Screen
                    name="InvReservationInvRequestList"
                    component={InvReservationInvRequestList}
                    options={{
                        title: route.params?.type == 'order' ? t('admin:ListOfSendInSupport') : t('admin:ListComingInSupport'),
                    }}
                />
            </TabStack.Navigator>
        </InvReservationDetailRouterContext.Provider>
    )
}
export default InvReservationDetailRouter

const styles = StyleSheet.create({})
