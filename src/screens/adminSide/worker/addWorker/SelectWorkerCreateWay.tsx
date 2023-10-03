import React, { useEffect, useState } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { GlobalStyles } from '../../../../utils/Styles'
import { THEME_COLORS } from '../../../../utils/Constants'
import { NavButton } from '../../../../components/atoms/NavButton'
import { BottomMargin } from '../../../../components/atoms/BottomMargin'
import { useIsFocused } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { StoreType } from '../../../../stores/Store'
import { useSafeLoadingUnmount } from '../../../../fooks/useUnmount'
import { useTextTranslation } from './../../../../fooks/useTextTranslation'

type NavProps = StackNavigationProp<RootStackParamList, 'SelectWorkerCreateWay'>
type RouteProps = RouteProp<RootStackParamList, 'SelectWorkerCreateWay'>

type InitialStateType = {
    id: string
}

const initialState: InitialStateType = {
    id: '',
}

const SelectWorkerCreateWay = () => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)

    const [{ id }, setState] = useState(initialState)

    useEffect(() => {
        navigation.setOptions({
            title: t('admin:RegisterANewWorker'),
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
                作業員追加方法を選択
            </Text>
            <NavButton
                style={{
                    marginTop: 10,
                }}
                title={t('admin:AddYourOwnWorkers')}
                hasIcon={false}
                onPress={() => {
                    navigation.replace('AddMyWorker', {})
                }}
            />
            <NavButton
                style={{}}
                title={t('admin:RequestSupportFromOtherCompanies')}
                hasIcon={false}
                onPress={() => {
                    navigation.replace('AddReservation', {
                        initStartDate: route?.params?.initStartDate,
                    })
                }}
            />
            <BottomMargin />
        </View>
    )
}
export default SelectWorkerCreateWay

const styles = StyleSheet.create({})
