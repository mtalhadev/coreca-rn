import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { View, StyleSheet, ViewStyle } from 'react-native'

import { SelectButton } from '../SelectButton'
import { IconParam } from '../IconParam'

import { THEME_COLORS } from '../../../utils/Constants'
import { BlueColor, GreenColor, ColorStyle } from '../../../utils/Styles'
import { NotificationsTagType } from '../../template/NotificationListScreen'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { AppButton } from '../../atoms/AppButton'
import { markAllNotificationsOfTargetAccountAsRead } from '../../../usecases/notification/CommonNotificationCase'
import { ToastMessage, setToastMessage } from '../../../stores/UtilSlice'
import { getErrorMessage, getErrorToastMessage } from '../../../services/_others/ErrorService'
import { CustomResponse } from '../../../models/_others/CustomResponse'

type NotificationHeaderTabProps = {
    // 管理者サイド or 現場サイド
    accountId?: string
    tabType: 'admin' | 'worker'
    unReadCount: number
    isLoading?: boolean
    onNotificationsTypeChange?: (type: NotificationsTagType) => void
    onAllUnread?: () => void
    style?: ViewStyle
}

type InitialStateType = {
    displayType?: 'すべて' | '取引' | '現場' | 'その他'
    isDisabled?: boolean
}

const initialState: InitialStateType = {
    displayType: 'すべて',
    isDisabled: false,
}

export const NotificationHeaderTab = (props: NotificationHeaderTabProps) => {
    const { accountId, tabType, unReadCount, isLoading, onNotificationsTypeChange, onAllUnread, style } = props
    const [{ displayType, isDisabled }, setState] = useState(initialState)
    const { t } = useTextTranslation()
    const dispatch = useDispatch()

    const notificationHeaderItems = new NotificationHeaderItems(tabType)

    return (
        <View style={[styles.tabContainer, style]}>
            <SelectButton
                items={notificationHeaderItems.tabItems()}
                color={notificationHeaderItems.color()}
                selected={displayType}
                onChangeItem={(value) => {
                    if (onNotificationsTypeChange) {
                        if (value == 'すべて') {
                            onNotificationsTypeChange('all')
                            setState((prev) => ({ ...prev, displayType: value }))
                        }
                        if (value == '取引') {
                            onNotificationsTypeChange('transaction')
                            setState((prev) => ({ ...prev, displayType: value }))
                        }
                        if (value == '現場') {
                            onNotificationsTypeChange('site')
                            setState((prev) => ({ ...prev, displayType: value }))
                        }
                        if (value == 'その他') {
                            onNotificationsTypeChange('others')
                            setState((prev) => ({ ...prev, displayType: value }))
                        }
                    }
                }}
            />
            <View style={styles.batchContainer}>
                {/* お知らせ */}
                {/* <IconParam paramName={t('common:Notification')} color={'#000'} iconName={'bell'} count={allCount} flex={1} /> */}
                {/* 未読 */}
                <IconParam paramName={t('common:Unread')} color={THEME_COLORS.OTHERS.ALERT_RED} iconName={'bell'} count={unReadCount} />
                {/* 余白 */}
                <IconParam color={'#fff'} iconName={'bell'} count={1} flex={1} />
            </View>
            <AppButton
                isGray={true}
                disabled={isLoading || isDisabled || unReadCount === 0}
                style={{
                    marginTop: 3,
                    marginHorizontal: 15,
                }}
                title={t('admin:MarkAllNotificationsAsRead')}
                onPress={async () => {
                    try {
                        dispatch(
                            setToastMessage({
                                text: t('common:MarkingAllNotificationsAsRead'),
                                type: 'success',
                            } as ToastMessage),
                        )
                        setState((prev) => ({ ...prev, isDisabled: true }))
                        const result = await markAllNotificationsOfTargetAccountAsRead(accountId, tabType)
                        if (result.error) {
                            throw {
                                error: result.error,
                                errorCode: result.errorCode,
                            }
                        }

                        if (onAllUnread) {
                            onAllUnread()
                        }

                        dispatch(
                            setToastMessage({
                                text: t('common:MarkedAllNotificationsAsRead'),
                                type: 'success',
                            } as ToastMessage),
                        )
                    } catch (error) {
                        const _error = error as CustomResponse
                        dispatch(
                            setToastMessage({
                                text: getErrorToastMessage(_error),
                                type: 'error',
                            } as ToastMessage),
                        )
                    } finally {
                        setState((prev) => ({ ...prev, isDisabled: false }))
                    }
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    tabContainer: {
        paddingTop: 10,
        paddingHorizontal: 10,
        paddingBottom: 10,
        borderColor: '#c9c9c9',
        borderStyle: 'solid',
        borderWidth: 1,
        backgroundColor: '#fff',
    },
    batchContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 10,
    },
})

class NotificationHeaderItems {
    type: 'admin' | 'worker'
    constructor(type: 'admin' | 'worker') {
        this.type = type
    }
    tabItems(): string[] {
        if (this.type === 'admin') return ['すべて', '取引', '現場', 'その他']
        if (this.type === 'worker') return ['すべて', '現場', 'その他']
        return []
    }
    color(): ColorStyle | undefined {
        if (this.type === 'admin') return BlueColor
        if (this.type === 'worker') return GreenColor
        return undefined
    }
}
