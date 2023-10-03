import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Text, View, Button, StyleSheet } from 'react-native'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { AppButton } from '../../../components/atoms/AppButton'
import { InputTextBox } from '../../../components/organisms/inputBox/InputTextBox'
import { GreenColor } from '../../../utils/Styles'
import { useIsFocused } from '@react-navigation/native'
import { StoreType } from '../../../stores/Store'
import { setIsNavUpdating } from '../../../stores/NavigationSlice'
import { useSafeLoadingUnmount } from '../../../fooks/useUnmount'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { setIsBottomOff } from '../../../stores/UtilSlice'
type NavProps = StackNavigationProp<RootStackParamList, 'WEditComment'>
type RouteProps = RouteProp<RootStackParamList, 'WEditComment'>

type InitialStateType = {
    id: string
    comment?: string
}

const initialState: InitialStateType = {
    id: '',
    comment: '',
}

const WEditComment = () => {
    const { t, i18n } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const [{ id, comment }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const onClose = route?.params?.onClose
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)

    const _initTest = () => {
        setState((prev) => ({
            ...prev,
        }))
    }

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            dispatch(setIsNavUpdating(false))
        }
    }, [isNavUpdating])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        _initTest()
    }, [])

    useEffect(() => {
        setState((prev) => ({ ...prev, comment: route?.params?.comment }))
    }, [])

    return (
        <View>
            <InputTextBox
                title={'コメント'}
                placeholder={'コメントを入力する'}
                color={GreenColor}
                multiline={true}
                required={true}
                value={comment}
                style={{
                    marginVertical: 40,
                }}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, comment: value }))
                }}
            />
            <View
                style={{
                    marginHorizontal: 20,
                }}>
                <AppButton
                    title={'保存する'}
                    height={50}
                    color={GreenColor}
                    onPress={() => {
                        /**
                         * 開発者用：勤怠登録するまで画面を表示するフローで、勤怠登録せずに画面を閉じるときに使用する隠しコマンド
                         */
                        if (comment?.trim()?.toLowerCase() == 'admintest') {
                            navigation.push('MyPageRouter')
                            dispatch(setIsBottomOff(false))

                            return
                        }

                        if (onClose) {
                            onClose(comment)
                        }
                        navigation.goBack()
                    }}
                />
            </View>
        </View>
    )
}
export default WEditComment

const styles = StyleSheet.create({})
