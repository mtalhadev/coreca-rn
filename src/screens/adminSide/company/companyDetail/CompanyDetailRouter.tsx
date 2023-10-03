import React, { useState, useRef, useEffect, createContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import CompanyDetail from './CompanyDetail'
import CompanyInvoice from './CompanyInvoice'
import { CustomTopTabBar } from '../../../../components/template/CustomTopTabBar'
import { BlueColor } from '../../../../utils/Styles'
import { StoreType } from '../../../../stores/Store'
import { setUrlScheme } from '../../../../stores/NavigationSlice'
import { createPartnership } from '../../../../usecases/RouteCase'
import { setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { connectFakeCompany } from '../../../../usecases/company/FakeCompanyCase'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'

type NavProps = StackNavigationProp<RootStackParamList, 'CompanyDetailRouter'>
type RouteProps = RouteProp<RootStackParamList, 'CompanyDetailRouter'>

export type CompanyDetailRouterContextType = {
    companyId?: string
    update?: number
}
export const CompanyDetailRouterContext = createContext<CompanyDetailRouterContextType>({})
const TabStack = createMaterialTopTabNavigator()

const CompanyDetailRouter = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const initialRouteName = route.params?.target ?? 'CompanyDetail'
    const urlScheme = useSelector((state: StoreType) => state?.nav?.urlScheme)
    const myCompanyId = useSelector((state: StoreType) => state?.account?.belongCompanyId)
    const [update, setUpdate] = useState<number>(route.params?.update ?? 0)

    const dispatch = useDispatch()

    useEffect(() => {
        navigation.setOptions({
            title: `${t('admin:Company')} / ${route.params?.title}`,
            headerTitleContainerStyle: {
                right: 20,
            },
        })
    }, [navigation])

    useEffect(() => {
        if (urlScheme != undefined) {
            let _fakeCompanyId: string | undefined = undefined
            if (urlScheme.queryParams.fakeCompanyId != undefined) {
                _fakeCompanyId = urlScheme.queryParams.fakeCompanyId as string
            }
            dispatch(setUrlScheme(undefined))
            ;(async () => {
                const rtnResponse = await createPartnership(route?.params?.companyId, myCompanyId as string)
                if (rtnResponse.error) {
                    dispatch(
                        setToastMessage({
                            text: rtnResponse.error,
                            type: 'error',
                        } as ToastMessage),
                    )
                    return
                }

                if (_fakeCompanyId != undefined) {
                    const rtnConnect = await connectFakeCompany({ fakeCompanyId: _fakeCompanyId, realCompanyId: myCompanyId })
                    if (rtnConnect.error) {
                        dispatch(
                            setToastMessage({
                                text: rtnConnect.error,
                                type: 'error',
                            } as ToastMessage),
                        )
                        return
                    }
                }

                setUpdate(update + 1)

                dispatch(
                    setToastMessage({
                        text: rtnResponse.success + t('admin:AddBusinessPartners'),
                        type: 'success',
                    } as ToastMessage),
                )
            })()
        }
    }, [])

    return (
        <CompanyDetailRouterContext.Provider
            value={{
                companyId: route.params?.companyId,
                update: update,
            }}>
            <TabStack.Navigator sceneContainerStyle={{ overflow: 'visible' }} initialRouteName={initialRouteName} tabBar={(props: any) => <CustomTopTabBar {...props} color={BlueColor} />}>
                <TabStack.Screen
                    name="CompanyDetail"
                    component={CompanyDetail}
                    options={{
                        title: t('admin:CompanyDetail'),
                    }}
                />
                <TabStack.Screen
                    name="CompanyInvoice"
                    component={CompanyInvoice}
                    options={{
                        title: t('admin:Particulars'),
                    }}
                />
            </TabStack.Navigator>
        </CompanyDetailRouterContext.Provider>
    )
}
export default CompanyDetailRouter

const styles = StyleSheet.create({})
