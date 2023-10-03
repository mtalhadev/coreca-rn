import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { GlobalStyles } from '../../../../utils/Styles'
import { THEME_COLORS } from '../../../../utils/Constants'
import { NavButton } from '../../../../components/atoms/NavButton'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { useIsFocused } from '@react-navigation/native'
import { StoreType } from '../../../../stores/Store'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

type InitialStateType = {
    id: string
}

const initialState: InitialStateType = {
    id: '',
}

const SelectProjectType = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const dispatch = useDispatch()

    const [{ id }, setState] = useState(initialState)

    useEffect(() => {
        navigation.setOptions({
            title: t('admin:SelectTheTypeOfCase'),
        })
    }, [navigation])

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

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
                {t('admin:SelectTheTypeOfCaseYouWantToCreate')}
            </Text>
            <NavButton
                style={{
                    marginTop: 10,
                }}
                title={t('admin:CreateAnOutsourcedCase')}
                subTitle={t('admin:CreateProjectsForWhichTheCompanyRecievesOrders')}
                hasIcon={false}
                onPress={() => {
                    navigation.replace('CreateProject', { isRequestProject: false })
                }}
            />
            <NavButton
                style={{}}
                title={t('admin:CreateACaseForSupport')}
                subTitle={t('admin:UsedWhenSupportIsCalledForbyATemporaryCompany')}
                hasIcon={false}
                onPress={() => {
                    navigation.replace('CreateProject', { isRequestProject: true })
                }}
            />
            <BottomMargin />
        </View>
    )
}
export default SelectProjectType

const styles = StyleSheet.create({})
