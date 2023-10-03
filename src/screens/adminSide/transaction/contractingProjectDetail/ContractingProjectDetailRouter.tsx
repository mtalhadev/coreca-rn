import React, { useState, useRef, useEffect, createContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import ContractingProjectDetail from './ContractingProjectDetail'
import ContractingProjectConstructionList from './ContractingProjectConstructionList'
import { CustomTopTabBar } from '../../../../components/template/CustomTopTabBar'
import { BlueColor } from '../../../../utils/Styles'
import { CustomDate } from '../../../../models/_others/CustomDate'
import { CompanyType } from '../../../../models/company/Company'

type NavProps = StackNavigationProp<RootStackParamList, 'ContractingProjectDetailRouter'>
type RouteProps = RouteProp<RootStackParamList, 'ContractingProjectDetailRouter'>
const TabStack = createMaterialTopTabNavigator()

export type ContractingProjectDetailRouterContextType = {
    projectId?: string
    contractId?: string
    constructionIds?: string[]
    update?: number
    routerContextSelectedMonth?: CustomDate
    contractor?: CompanyType
}
export const ContractingProjectDetailRouterContext = createContext<ContractingProjectDetailRouterContextType>({})

const ContractingProjectDetailRouter = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const initialRouteName = route.params?.target ?? 'ContractingProjectConstructionList'
    const selectedMonth = route.params?.selectedMonth
    useEffect(() => {
        navigation.setOptions({
            title: `${route.params?.isFakeCompanyManage ? t('admin:SupportRequest') : t('admin:ContractAgreement')} / ${route.params?.title}`,
            headerTitleContainerStyle: {
                right: 20,
            },
        })
    }, [navigation])

    return (
        <ContractingProjectDetailRouterContext.Provider
            value={{
                projectId: route.params?.projectId,
                contractId: route.params?.contractId,
                constructionIds: route.params?.constructionIds,
                update: route.params?.update,
                routerContextSelectedMonth: route.params?.selectedMonth,
                contractor: route.params?.contractor,
            }}>
            <TabStack.Navigator sceneContainerStyle={{ overflow: 'visible' }} initialRouteName={initialRouteName} tabBar={(props: any) => <CustomTopTabBar {...props} color={BlueColor} />}>
                <TabStack.Screen
                    name="ContractingProjectDetail"
                    component={ContractingProjectDetail}
                    options={{
                        title: route.params?.isFakeCompanyManage ? t('admin:SupportRequestDetails') : t('admin:ContractDetails'),
                    }}
                />
                <TabStack.Screen
                    name="ContractingProjectConstructionList"
                    component={ContractingProjectConstructionList}
                    options={{
                        title: t('admin:ConstructionList'),
                    }}
                />
            </TabStack.Navigator>
        </ContractingProjectDetailRouterContext.Provider>
    )
}
export default ContractingProjectDetailRouter

const styles = StyleSheet.create({})
