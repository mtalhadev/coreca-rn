import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet, Pressable, Linking, ScrollView } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { DefaultStackType, RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { InputBox } from '../../../../components/atoms/InputBox'
import { AppButton } from '../../../../components/atoms/AppButton'
import { FontStyle, ColorStyle, GlobalStyles } from '../../../../utils/Styles'
import { THEME_COLORS } from '../../../../utils/Constants'
import { TextInput } from 'react-native-gesture-handler'
import { NavButton } from '../../../../components/atoms/NavButton'
import { InviteHeader } from '../../../../components/organisms/InviteHeader'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { useIsFocused } from '@react-navigation/native'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { StoreType } from '../../../../stores/Store'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'

type NavProps = StackNavigationProp<RootStackParamList, 'SelectCompanyCreateWay'>
type RouteProps = RouteProp<RootStackParamList, 'SelectCompanyCreateWay'>

type InitialStateType = {
    id: string
}

const initialState: InitialStateType = {
    id: '',
}

const SelectCompanyCreateWay = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const dispatch = useDispatch()
    const [{ id }, setState] = useState(initialState)

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        navigation.setOptions({
            title: t('admin:RegisterANewCompany'),
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
                paddingTop: 40,
                borderTopWidth: 1,
                borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                backgroundColor: THEME_COLORS.OTHERS.BACKGROUND,
            }}>
            <Text
                style={{
                    ...GlobalStyles.mediumText,
                    color: THEME_COLORS.BLUE.MIDDLE_DEEP,
                    marginLeft: 20,
                }}>
                {t('admin:SelectCompanyRegisterationMethod')}
            </Text>
            <NavButton
                style={{
                    marginTop: 10,
                }}
                title={t('admin:Invite')}
                subTitle={t('admin:OtherPartyUsingCoreca')}
                hasIcon={false}
                onPress={() => {
                    // route stackを調整するため
                    navigation.replace('InviteCompany', {})
                }}
            />
            <NavButton
                style={{}}
                title={t('admin:CreateATemporaryCompany')}
                subTitle={t('admin:OtherPartyNotUsingCoreca')}
                hasIcon={false}
                onPress={() => {
                    // route stackを調整するため
                    navigation.replace('CreateFakeCompany', {
                        routeNameFrom: route.params?.routeNameFrom,
                        targetDate: route.params?.targetDate,
                    })
                }}
            />
            <BottomMargin />
        </View>
    )
}
export default SelectCompanyCreateWay

const styles = StyleSheet.create({})
