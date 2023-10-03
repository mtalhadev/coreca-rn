import React, { useState, useEffect, createContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import ConstructionDetail, { MyConstructionDetailUIType } from './ConstructionDetail'
import ConstructionSiteList from './ConstructionSiteList'
import { CustomTopTabBar } from '../../../../components/template/CustomTopTabBar'
import { BlueColor } from '../../../../utils/Styles'
import { StoreType } from '../../../../stores/Store'
import isEmpty from 'lodash/isEmpty'
import { deleteParamOfLocalUpdateScreens, setLoading, setToastMessage, ToastMessage } from '../../../../stores/UtilSlice'
import { getMyConstructionDetail } from '../../../../usecases/construction/MyConstructionCase'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { EmptyScreen } from '../../../../components/template/EmptyScreen'
import { updateCachedData, getCachedData, genKeyName } from '../../../../usecases/CachedDataCase'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { useIsFocused } from '@react-navigation/native'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { deleteParamOfUpdateScreens, checkUpdateOfTargetScreen } from '../../../../usecases/updateScreens/CommonUpdateScreensCase'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { CustomDate } from '../../../../models/_others/CustomDate'
import { CompanyType } from '../../../../models/company/Company'

type NavProps = StackNavigationProp<RootStackParamList, 'ConstructionDetailRouter'>
type RouteProps = RouteProp<RootStackParamList, 'ConstructionDetailRouter'>
const TabStack = createMaterialTopTabNavigator()

export type ConstructionDetailRouterContextType = {
    constructionId?: string
    projectId?: string
    startDate?: CustomDate | number
    update?: number
    relatedCompanyId?: string
    isNewProject?: boolean
    contractor?: CompanyType
    supportType?: 'support-receive' | 'support-order'
}
export const ConstructionDetailRouterContext = createContext<ConstructionDetailRouterContextType>({})

type initialStateType = {
    construction?: MyConstructionDetailUIType
    isFetching: boolean
}

const initialState: initialStateType = {
    isFetching: false,
}

const ConstructionDetailRouter = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const initialRouteName = route.params?.target ?? 'ConstructionSiteList'
    const dispatch = useDispatch()
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId ?? '')
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const localUpdateScreens = useSelector((state: StoreType) => state?.util?.localUpdateScreens)
    const [{ construction, isFetching }, setState] = useState(initialState)
    const cachedConstructionKey = genKeyName({ screenName: 'ConstructionDetailRouter', accountId: accountId, constructionId: route.params?.constructionId ?? '', companyId: myCompanyId ?? '' })
    const holidays = useSelector((state: StoreType) => state?.util?.holidays)

    useEffect(() => {
        navigation.setOptions({
            title: `${t('common:Construction')} / ${route.params?.title}`,
            headerTitleContainerStyle: {
                right: 20,
            },
        })
    }, [navigation])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, isFetching: true }))
        }
    }, [isNavUpdating])

    /**
     * 作成編集削除により、キャッシュと表示内容が異なる場合にDBフェッチ
     */
    useEffect(() => {
        if (isFocused) {
            ;(async () => {
                const isUpdateResult = await checkUpdateOfTargetScreen({
                    targetId: construction?.constructionId,
                    accountId: accountId,
                    targetScreenName: 'ConstructionDetailRouter',
                    localUpdateScreens,
                })
                if (isUpdateResult.success) {
                    dispatch(setIsNavUpdating(true))
                }
            })()
        }
    }, [isFocused])

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(route.params?.constructionId) || isEmpty(myCompanyId) || isFetching != true) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))
                const constructionResult = await getMyConstructionDetail({
                    constructionId: route.params?.constructionId,
                    myCompanyId,
                    holidays,
                })
                const cachedResult = await getCachedData<MyConstructionDetailUIType>(cachedConstructionKey)
                if (cachedResult.success) {
                    setState((prev) => ({ ...prev, construction: cachedResult.success }))
                    if (constructionResult.success?.constructionId == undefined) return
                    if (cachedResult.success.updatedAt && constructionResult.success.updatedAt && cachedResult.success.updatedAt > constructionResult.success?.updatedAt) {
                        // キャッシュよりDBが古い場合、更新しない
                        return
                    }
                }
                if (constructionResult.error || constructionResult.success == undefined) {
                    throw {
                        error: constructionResult.error,
                    }
                }
                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                setState((prev) => ({ ...prev, construction: constructionResult.success }))
                const cachedConstructionResult = await updateCachedData({ key: cachedConstructionKey, value: constructionResult.success })
                if (cachedConstructionResult.error) {
                    dispatch(
                        setToastMessage({
                            text: cachedConstructionResult.error,
                            type: 'error',
                        }),
                    )
                }
                deleteParamOfLocalUpdateScreens({
                    screens: localUpdateScreens,
                    screenName: 'ConstructionDetailRouter',
                    id: construction?.constructionId,
                    paramName: 'ids',
                })
                await deleteParamOfUpdateScreens({
                    accountId: accountId,
                    screenName: 'ConstructionDetailRouter',
                    id: construction?.constructionId,
                    paramName: 'ids',
                })
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                setState((prev) => ({ ...prev, isFetching: false }))
                if (isFocused) {
                    dispatch(setLoading(false))
                    dispatch(setIsNavUpdating(false))
                }
            }
        })()
    }, [isFetching])

    /**
     * @summary 工事詳細のキャッシュを更新する副作用関数
     * @purpose アプリ側にKVSによるキャッシュを設けて初期表示速度を改善する
     * @author Okuda
     */
    useEffect(() => {
        ;(async () => {
            const result = await getCachedData<MyConstructionDetailUIType>(cachedConstructionKey)
            if (result.error) {
                if (result.errorCode != 'FIRST_FETCH') {
                    dispatch(
                        setToastMessage({
                            text: result.error,
                            type: 'error',
                        }),
                    )
                }
                setState((prev) => ({ ...prev, isFetching: true }))
            } else {
                setState((prev) => ({ ...prev, construction: result.success }))
            }
        })()
    }, [route.params?.update, route.params?.constructionId])

    const EmptyScreenIntermediation = () => {
        return <EmptyScreen text={t('admin:BrokerageConstructionCannotDefineSite')} />
    }

    return (
        <ConstructionDetailRouterContext.Provider
            value={{
                constructionId: route.params?.constructionId,
                projectId: route.params?.projectId,
                startDate: route.params?.startDate,
                update: route.params?.update,
                relatedCompanyId: route.params?.relatedCompanyId,
                isNewProject: route.params?.isNewProject,
                contractor: route.params?.contractor,
                supportType: route.params?.supportType,
            }}>
            <TabStack.Navigator sceneContainerStyle={{ overflow: 'visible' }} initialRouteName={initialRouteName} tabBar={(props: any) => <CustomTopTabBar {...props} color={BlueColor} />}>
                <TabStack.Screen name="ConstructionDetail" component={ConstructionDetail} options={{ title: t('common:ConstructionDetails') }} />
                {construction != undefined && construction?.constructionRelation == 'intermediation' && (
                    <TabStack.Screen name="ConstructionSiteList" component={EmptyScreenIntermediation} options={{ title: t('common:SiteList') }} />
                )}
                {(construction == undefined || construction?.constructionRelation != 'intermediation') && (
                    <TabStack.Screen name="ConstructionSiteList" component={ConstructionSiteList} options={{ title: t('common:SiteList') }} />
                )}
            </TabStack.Navigator>
        </ConstructionDetailRouterContext.Provider>
    )
}
export default ConstructionDetailRouter

const styles = StyleSheet.create({})
