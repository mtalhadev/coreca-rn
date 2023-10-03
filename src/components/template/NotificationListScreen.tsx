import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { View, StyleSheet, FlatList, RefreshControl, ListRenderItem, ListRenderItemInfo, ViewStyle, ViewabilityConfig } from 'react-native'

import { NotificationHeaderTab } from '../organisms/notification/NotificationHeaderTab'
import { Notification } from '../organisms/notification/Notification'

import { BottomMargin } from '../atoms/BottomMargin'
import { EmptyScreen } from './EmptyScreen'
import { NotificationListCLType } from '../../models/notification/NotificationListType'
import { ContentsEnumType, NotificationCLType, NotificationType } from '../../models/notification/Notification'
import { setUnreadNotificationCountToBadge } from '../../usecases/notification/CommonNotificationCase'
import { AccountNotificationListCLType } from '../../models/notification/AccountNotificationListType'
import { getUuidv4 } from '../../utils/Utils'
import { useSafeUnmount } from '../../fooks/useUnmount'
import { useTextTranslation } from '../../fooks/useTextTranslation'
import { _getNotification, _updateNotification } from '../../services/notification/NotificationService'

type NotificationListScreenProps = {
    // 管理者サイド or 現場サイド
    accountId?: string
    type: 'admin' | 'worker'
    accountNotificationList: AccountNotificationListCLType
    unreadNotificationCount: number
    onContentsChanged?: (value: NotificationsTagType) => void
    onRefresh?: () => void
    onEndReached?: () => void
    onAllUnread?: () => void
    onItemChanged?: (id: string) => void
    isLoading?: boolean
    style?: ViewStyle
}

export type NotificationsTagType = 'all' | Exclude<ContentsEnumType, 'personal'>

type InitialStateType = {
    displayNotifications?: NotificationListCLType
    refreshing: boolean
    notificationsType: NotificationsTagType
}
const initialState: InitialStateType = {
    displayNotifications: { items: [] },
    refreshing: false,
    notificationsType: 'all',
}

export const NotificationListScreen = (props: NotificationListScreenProps) => {
    const { accountId, type, style, accountNotificationList, unreadNotificationCount, isLoading, onContentsChanged, onRefresh, onEndReached, onAllUnread, onItemChanged } = props
    const [{ displayNotifications, refreshing, notificationsType }, setState] = useState(initialState)
    const { t } = useTextTranslation()

    const getWorkerNotifications = () => {
        const _accountNotificationAllList = accountNotificationList?.all?.items?.sort((a, b) => (b.createdAt?.totalSeconds ?? Infinity) - (a.createdAt?.totalSeconds ?? Infinity))
        const _accountNotificationSiteList = accountNotificationList?.site?.items?.sort((a, b) => (b.createdAt?.totalSeconds ?? Infinity) - (a.createdAt?.totalSeconds ?? Infinity))
        const _accountNotificationTransactionList = accountNotificationList?.transaction?.items?.sort((a, b) => (b.createdAt?.totalSeconds ?? Infinity) - (a.createdAt?.totalSeconds ?? Infinity))
        const _accountNotificationOthersList = accountNotificationList?.others?.items?.sort((a, b) => (b.createdAt?.totalSeconds ?? Infinity) - (a.createdAt?.totalSeconds ?? Infinity))
        return {
            all: {
                items: _accountNotificationAllList,
            },
            site: {
                items: _accountNotificationSiteList,
            },
            transaction: {
                items: _accountNotificationTransactionList,
            },
            others: {
                items: _accountNotificationOthersList,
            },
        } as AccountNotificationListCLType
    }

    useSafeUnmount(setState, initialState)
    useEffect(() => {
        const _accountNotificationList = getWorkerNotifications()

        ;(async () => {
            await setUnreadNotificationCountToBadge()
        })()

        setState((prev) => ({
            ...prev,
            accountNotificationList: _accountNotificationList,
            displayNotifications: _accountNotificationList[notificationsType] ?? {},
        }))
    }, [accountNotificationList, type])

    const _onRefresh = async () => {
        setState((prev) => ({
            ...prev,
            refreshing: true,
        }))
        if (onRefresh) {
            await onRefresh()
        }
        setState((prev) => ({
            ...prev,
            refreshing: false,
        }))
    }

    const _footer = (): JSX.Element => {
        return <BottomMargin />
    }

    const _content: ListRenderItem<NotificationCLType> = (info: ListRenderItemInfo<NotificationCLType>) => {
        const { item, index } = info
        return (
            <Notification
                style={{
                    marginTop: 10,
                    marginHorizontal: 10,
                }}
                key={item.notificationId}
                userType={type}
                notification={item}
            />
        )
    }

    const onNotificationsTypeChange = (value: NotificationsTagType) => {
        if (onContentsChanged !== undefined) {
            onContentsChanged(value)
        }

        setState((prev) => ({
            ...prev,
            notificationsType: value,
            displayNotifications: accountNotificationList[value] ?? {},
        }))
    }

    const listKey = useMemo(() => getUuidv4(), [])

    const _viewabilityConfig: ViewabilityConfig = {
        minimumViewTime: 0,
        itemVisiblePercentThreshold: 100,
        waitForInteraction: false,
    }

    const _onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
        viewableItems?.forEach(async ({ item }) => {
            const { notificationId, isAlreadyRead } = item as NotificationType
            if (isAlreadyRead !== true && notificationId !== undefined && onItemChanged) {
                onItemChanged(notificationId)
            }
        })
    }, [])

    return (
        <View
            style={[
                {
                    flex: 1,
                },
                style,
            ]}>
            {/* お知らせタブ */}
            <NotificationHeaderTab
                accountId={accountId}
                tabType={type}
                onNotificationsTypeChange={onNotificationsTypeChange}
                unReadCount={unreadNotificationCount}
                onAllUnread={onAllUnread}
                isLoading={isLoading}
            />
            {/* お知らせ一覧 */}
            <FlatList
                listKey={listKey}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={_onRefresh} />}
                data={displayNotifications?.items ?? []}
                ListEmptyComponent={<EmptyScreen text={t('common:ThereAreNoAnnouncements')} />}
                renderItem={_content}
                ListFooterComponent={_footer}
                keyExtractor={(item, index) => index.toString()}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                viewabilityConfig={_viewabilityConfig}
                onViewableItemsChanged={_onViewableItemsChanged}
            />
        </View>
    )
}

const styles = StyleSheet.create({})
