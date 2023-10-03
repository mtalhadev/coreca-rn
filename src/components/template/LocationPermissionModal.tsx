import React, { useEffect, useState } from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import Modal from 'react-native-modal'
import { getLocationPermissionStatus, requestLocationPermission } from '../../usecases/permission/CommonPermissionCase'
import { _getLocationPermission } from '../../services/_others/PermissionService'
import { useDispatch } from 'react-redux'
import { PermissionScreen } from './PermissionScreen'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import { getNavBarHeight } from '../../utils/Constants'
import { GreenColor } from '../../utils/Styles'
import { useTextTranslation } from '../../fooks/useTextTranslation'

type InitialStateType = {
    visibleWLocationModal: boolean
}
const initialState: InitialStateType = {
    visibleWLocationModal: false,
}
type LocationPermissionModalType = {
    onGranted: () => void
}
const LocationPermissionModal = (props: LocationPermissionModalType) => {
    const { t } = useTextTranslation()
    const { onGranted } = props
    const dispatch = useDispatch()
    const [{ visibleWLocationModal }, setState] = useState(initialState)
    const unauthorizedPermission = 'undetermined'
    const closeLocationModal = async () => {
        setState((prev) => ({
            ...prev,
            visibleWLocationModal: false,
        }))

        /**
         * 許可直後に、現在地をアップデートするため
         */
        const permissionResult = await _getLocationPermission()
        if (permissionResult.success == 'granted') {
            onGranted()
        }
    }
    useEffect(() => {
        getLocationPermissionStatus().then((result) => {
            if (result.success == unauthorizedPermission || (Platform.OS == 'android' && result.success == 'denied')) {
                setState((prev) => ({
                    ...prev,
                    visibleWLocationModal: true,
                }))
            } else {
                closeLocationModal()
            }
        })
    }, [])

    const onPress = async () => {
        try {
            const result = await requestLocationPermission()
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: 'PUSH_REQUEST_ERROR'
                }
            }
            closeLocationModal()
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
                isVisible={visibleWLocationModal}
            >
                <PermissionScreen
                onPress={onPress}
                onClose={() => {
                    closeLocationModal()
                }}
                colorStyle={GreenColor}
                imageType={'locate'}
                text={t('common:TheLocationInformationMustBeShared')}
                colorText={t('common:WhenReportingAttendance')}
                title={t('common:PermissionToShareLocation')}
            />
            </Modal>
        </View>
    )
}
export default LocationPermissionModal

const styles = StyleSheet.create({})
