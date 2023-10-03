import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Pressable, Linking, ScrollView } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { DefaultStackType, RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { NavButton } from '../../../../components/atoms/NavButton'
import { THEME_COLORS } from '../../../../utils/Constants'
import { GlobalStyles } from '../../../../utils/Styles'
import { useIsFocused } from '@react-navigation/native'
import { StoreType } from '../../../../stores/Store'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'

type NavProps = StackNavigationProp<RootStackParamList, 'SelectSiteCreateOption'>
type RouteProps = RouteProp<RootStackParamList, 'SelectSiteCreateOption'>

type InitialStateType = {
    id: string
}

const initialState: InitialStateType = {
    id: '',
}

const SelectSiteCreateOption = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const [{ id }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const { t } = useTextTranslation()

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        navigation.setOptions({
            title: t('common:CreateNew'),
        })
    }, [navigation])

    useEffect(() => {
        return () => {
            setState({ ...initialState })
        }
    }, [])

    return (
        <View
            style={{
                // marginTop: 40,
                flexDirection: 'column',
                borderTopWidth: 1,
                borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                backgroundColor: THEME_COLORS.OTHERS.BACKGROUND,
            }}>
            <NavButton
                style={{
                    marginTop: 25,
                }}
                title={t('common:CreateASite')}
                hasIcon={true}
                iconName={'site'}
                iconSize={20}
                onPress={() => {
                    // route stackを調整するため
                    navigation.replace('ConstructionList', {
                        targetDate: route?.params?.targetDate,
                    })
                }}
            />
            <NavButton
                style={{}}
                title={t('admin:CreateACase')}
                hasIcon={true}
                iconName={'project'}
                iconSize={25}
                onPress={() => {
                    // route stackを調整するため
                    // navigation.replace('SelectProjectType', {})
                    navigation.replace('SelectCompany', {
                        selectCompany: {
                            withoutMyCompany: true,
                            title: `${t('common:SelectCustomerClient')}`,
                        },
                        routeNameFrom: 'SelectSiteCreateOption',
                    })
                }}
            />
            <NavButton
                style={{}}
                title={t('common:ApplyForSupport')}
                hasIcon={true}
                iconName={'transfer'}
                iconSize={25}
                onPress={() => {
                    navigation.replace('ConstructionList', {
                        targetDate: route?.params?.targetDate,
                        displayType: 'support',
                    })
                }}
            />
            <BottomMargin />
        </View>
    )
}
export default SelectSiteCreateOption

const styles = StyleSheet.create({})
