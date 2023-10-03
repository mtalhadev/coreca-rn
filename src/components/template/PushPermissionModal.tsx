import React, { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import Modal from 'react-native-modal'
import { getPushPermissionStatus, requestPushPermission } from '../../usecases/permission/CommonPermissionCase'
import { PermissionScreen } from '../../components/template/PermissionScreen'
import { BlueColor, GreenColor } from '../../utils/Styles'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import { useDispatch } from 'react-redux'
import { getNavBarHeight, IOS_NAV_BAR_HEIGHT } from '../../utils/Constants'
import { useTextTranslation } from '../../fooks/useTextTranslation'

type InitialStateType = {
    visiblePushModal: boolean
    visibleWPushModal: boolean
}
const initialState: InitialStateType = {
    visiblePushModal: false,
    visibleWPushModal: false,
}
type PermissionModalProps = {
    type: 'admin' | 'worker'
}
const PermissionModal = (props: PermissionModalProps) => {
    const { t } = useTextTranslation()
    const dispatch = useDispatch()
    const [{ visiblePushModal, visibleWPushModal }, setState] = useState(initialState)
    const { type } = props
    const closePushModal = () => {
        setState(() => ({
            visiblePushModal: false,
            visibleWPushModal: false,
        }))
    }
    useEffect(() => {
        getPushPermissionStatus().then((result) => {
            if (type === 'admin') {
                if (result.success?.status == 'undetermined') {
                    setState((prev) => ({
                        ...prev,
                        visiblePushModal: true,
                    }))
                }
            } else {
                if (result.success?.status == 'undetermined') {
                    setState((prev) => ({
                        ...prev,
                        visibleWPushModal: true,
                    }))
                }
            }
        })
    }, [])

    const onPress = async () => {
        try {
            const result = await requestPushPermission()
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: 'PUSH_REQUEST_ERROR'
                }
            }
            closePushModal()
        } catch (error) {
            const _error = error as CustomResponse
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
        
    }

    return (
        <View>
            <Modal
                style={{
                    flex: 1,
                    top: getNavBarHeight()
                }}
                isVisible={visiblePushModal}>
                <PermissionScreen
                    onPress={onPress}
                    onClose={() => {
                        closePushModal()
                    }}
                    colorStyle={BlueColor}
                    imageType={'push'}
                    text={t('common:YouMustHavePermissionForPushNotifications')}
                    colorText={t('common:NotificationFromTheField')}
                    title={t('common:AllowPushNotifications')}
                />
            </Modal>
            <Modal
                style={{
                    flex: 1,
                    top: getNavBarHeight()
                }}
                isVisible={visibleWPushModal}>
                <PermissionScreen
                    onPress={onPress}
                    onClose={() => {
                        closePushModal()
                    }}
                    colorStyle={GreenColor}
                    imageType={'push'}
                    text={t('common:YouMustHavePermissionForPushNotifications')}
                    colorText={t('common:OnSiteNotifications')}
                    title={t('common:AllowPushNotifications')}
                />
            </Modal>
        </View>
    )
}
export default PermissionModal

const styles = StyleSheet.create({})
