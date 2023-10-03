/* eslint-disable react/jsx-key */
import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import cloneDeep from 'lodash/cloneDeep'

import { NotificationListScreen, NotificationsTagType } from '../../components/template/NotificationListScreen'
import { useIsFocused } from '@react-navigation/native'
import { StoreType } from '../../stores/Store'
import { setLoading, setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { CustomResponse } from '../../models/_others/CustomResponse'
import {
    getNotifications,
    getUnreadNotificationCountOfTargetAccount,
    updateAlreadyReadNotifications,
    updateUnreadNotificationCountOfTargetAccount,
} from '../../usecases/notification/CommonNotificationCase'
import { AccountNotificationListCLType } from '../../models/notification/AccountNotificationListType'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import { useSafeLoadingUnmount } from '../../fooks/useUnmount'
import { _getFirestore } from '../../services/firebase/FirestoreService'
import { newCustomDate, nextDay } from '../../models/_others/CustomDate'

type InitialStateType = {
    accountNotificationList?: AccountNotificationListCLType
    displayAccountNotificationList?: AccountNotificationListCLType
    update: number
    unreadNotificationCount?: number
    contentsType: Exclude<NotificationsTagType, 'transaction'>
}

const initialState: InitialStateType = {
    accountNotificationList: {},
    displayAccountNotificationList: {},
    update: 0,
    contentsType: 'all',
}

const initialPage = { all: 0, site: 0, others: 0 }
const initialIsLastItemOfTheList = { all: false, site: false, others: false }
const initialIsContentsFetched = { all: true, site: true, others: true }
const initialLastItemCreatedAt = {
    all: nextDay(newCustomDate()).totalSeconds,
    site: nextDay(newCustomDate()).totalSeconds,
    others: nextDay(newCustomDate()).totalSeconds,
} // the initial lastItemCreatedAt must be larger than any createdAt in the list

const WNotification = () => {
    const dispatch = useDispatch()
    const accountId = useSelector((state: StoreType) => state.account.signInUser?.accountId)
    const isLoading = useSelector((state: StoreType) => state.util?.loading)
    const [{ accountNotificationList, displayAccountNotificationList, unreadNotificationCount, update, contentsType }, setState] = useState(initialState)

    const [page, setPage] = useState(initialPage)
    const [isLastItemOfTheList, setIsLastItemOfTheList] = useState(initialIsLastItemOfTheList)
    const [lastItemCreatedAt, setLastItemCreatedAt] = useState(initialLastItemCreatedAt)
    const [isContentsFetched, setIsContentsFetched] = useState(initialIsContentsFetched)
    const [isAllUnread, setIsAllUnread] = useState<boolean>(false) // 全お知らせの既読処理用フラグ（ローカルデータ・アップデート）

    // 再レンダリングを避けるためと、useCallbackの中でも変更が反映されるようにuseRefを使う
    const handledNotificationIds = useRef<string[]>([])
    const unreadNotificationIds = useRef<string[]>([])
    const uniqueNotificationIds = useRef<string[]>([])
    const isAllUnReadRef = useRef<boolean>(false) // 全お知らせの既読処理用フラグ（サーバー関連）

    const isFocused = useIsFocused()

    useEffect(() => {
        return () => {
            setState(initialState)
            setPage(initialPage)
            setIsLastItemOfTheList(initialIsLastItemOfTheList)
            setLastItemCreatedAt(initialLastItemCreatedAt)
            setIsContentsFetched(initialIsContentsFetched)
        }
    }, [accountId])

    useSafeLoadingUnmount(dispatch, isFocused)

    useEffect(() => {
        ;(async () => {
            try {
                if (accountId === undefined) {
                    return
                }

                const getUnreadCountResult = await getUnreadNotificationCountOfTargetAccount({
                    accountId: accountId,
                    side: 'worker',
                })
                if (getUnreadCountResult.error) {
                    throw {
                        error: getUnreadCountResult.error,
                    }
                }
                setState((prev) => ({ ...prev, unreadNotificationCount: getUnreadCountResult.success }))

                const jsonValue = await AsyncStorage.getItem('unhandled-notificationIds')
                if (jsonValue !== null) {
                    const _unhandledNotificationIds = JSON.parse(jsonValue)
                    if (Array.isArray(_unhandledNotificationIds) && _unhandledNotificationIds.length > 0) {
                        await updateAlreadyReadNotifications(_unhandledNotificationIds)
                        handledNotificationIds.current = _unhandledNotificationIds
                    }
                    await AsyncStorage.removeItem('unhandled-notificationIds')
                }
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            }
        })()
    }, [accountId])

    useEffect(() => {
        ;(async () => {
            try {
                if (accountId === undefined) {
                    return
                }
                if (!isContentsFetched[contentsType]) {
                    return
                }
                if (isFocused) dispatch(setLoading(true))

                const notificationsResult = await getNotifications({
                    accountId: accountId ?? '',
                    side: 'worker',
                    contentsType,
                    limit: 20,
                    lastItemCreatedAt: lastItemCreatedAt[contentsType],
                })
                if (isFocused) dispatch(setLoading(false))
                if (notificationsResult.error) {
                    throw {
                        error: notificationsResult.error,
                    }
                }
                const accountNotificationList = notificationsResult.success as AccountNotificationListCLType
                setState((prev) => ({ ...prev, accountNotificationList }))
                setIsContentsFetched((prev) => ({ ...prev, [contentsType]: false }))

                // get createdAt of the last item for the starting point of the next page
                const items = accountNotificationList[contentsType]?.items?.sort((a, b) => (b.createdAt?.totalSeconds ?? Infinity) - (a.createdAt?.totalSeconds ?? Infinity))
                const _lastItemCreatedAt = items !== undefined && items?.length > 0 ? items[items.length - 1]?.createdAt?.totalSeconds : undefined
                if (_lastItemCreatedAt !== undefined) {
                    setLastItemCreatedAt((prev) => ({ ...prev, [contentsType]: _lastItemCreatedAt }))
                }

                if (accountNotificationList[contentsType]?.items?.length === 0) {
                    setIsLastItemOfTheList((prev) => ({ ...prev, [contentsType]: true }))
                }
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            }
        })()
    }, [accountId, dispatch, isFocused, update, contentsType, page[contentsType], isContentsFetched[contentsType]])

    // add next page to displayAccountNotificationList
    useEffect(() => {
        if (accountNotificationList !== undefined && displayAccountNotificationList !== undefined) {
            const currentTotalItemList = displayAccountNotificationList[contentsType]?.items ?? []
            const fetchedItemList = accountNotificationList[contentsType]?.items ?? []

            const newDisplayAccountNotificationList = { ...cloneDeep(displayAccountNotificationList), [contentsType]: { items: [...cloneDeep(currentTotalItemList), ...cloneDeep(fetchedItemList)] } }

            setState((prev) => ({ ...prev, displayAccountNotificationList: newDisplayAccountNotificationList }))
        } else {
            setState((prev) => ({ ...prev, displayAccountNotificationList: accountNotificationList }))
        }
    }, [accountNotificationList])

    // お知らせ全てを既読にするボタンをタップ時に、取得済おしらせのローカルデータを既読にする
    useEffect(() => {
        if (isAllUnread && displayAccountNotificationList !== undefined) {
            for (let contentsType of ['all', 'site', 'others'] as NotificationsTagType[]) {
                displayAccountNotificationList[contentsType]?.items?.forEach((item) => {
                    item.isAlreadyRead = true
                })
            }
            setState((prev) => ({ ...prev, displayAccountNotificationList }))
        }
    }, [isAllUnread])

    // お知らせ画面を閉じたときに、既読処理を行う
    useEffect(() => {
        return () => {
            // お知らせ全てを既読にするボタンをタップした場合は、必要なし
            if (accountId && !isAllUnReadRef.current) {
                try {
                    if (uniqueNotificationIds.current.length > 0) {
                        ;(async () => await updateAlreadyReadNotifications(uniqueNotificationIds.current, accountId, 'worker'))()
                    }
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

            handledNotificationIds.current = []
            unreadNotificationIds.current = []
            uniqueNotificationIds.current = []
            ;(async () => await AsyncStorage.removeItem('unhandled-notificationIds'))()
        }
    }, [])

    // 一括して既読処理、処理済みは除く
    useEffect(() => {
        if (!isAllUnReadRef.current && uniqueNotificationIds.current.length > 0) {
            try {
                ;(async () => {
                    const result = await updateAlreadyReadNotifications(uniqueNotificationIds.current, accountId, 'worker')
                    if (result.error) {
                        throw {
                            error: result.error,
                            errorCode: result.errorCode,
                        }
                    }
                })()

                handledNotificationIds.current = [...handledNotificationIds.current, ...uniqueNotificationIds.current]
                unreadNotificationIds.current = []
                uniqueNotificationIds.current = []
                ;async () => await AsyncStorage.removeItem('unhandled-notificationIds')
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
    }, [page[contentsType], contentsType])

    const onRefresh = () => {
        setState((prev) => ({ ...prev, update: update + 1 }))
    }

    const onEndReached = () => {
        if (!isLastItemOfTheList[contentsType]) {
            setPage((prev) => ({ ...prev, [contentsType]: prev[contentsType] + 1 }))
            setIsContentsFetched((prev) => ({ ...prev, [contentsType]: true }))
        }
    }

    const onContentsChanged = (value: NotificationsTagType) => {
        setState((prev) => ({ ...prev, contentsType: value as Exclude<NotificationsTagType, 'transaction'> }))
    }

    const onAllUnread = () => {
        isAllUnReadRef.current = true
        setIsAllUnread(true)
        setState((prev) => ({ ...prev, unreadNotificationCount: 0 }))
    }

    const onItemChanged = (id: string) => {
        // 既読にしたお知らせのID、重複・処理済は除く
        unreadNotificationIds.current = [...unreadNotificationIds.current, id]
        const uniqueIds = [...new Set(unreadNotificationIds.current)].filter((id) => !handledNotificationIds.current.includes(id))
        uniqueNotificationIds.current = uniqueIds

        const jsonValue = JSON.stringify(uniqueIds)
        ;(async () => {
            await AsyncStorage.setItem('unhandled-notificationIds', jsonValue)
        })()
    }

    return (
        <NotificationListScreen
            accountId={accountId}
            type={'worker'}
            accountNotificationList={displayAccountNotificationList ?? {}}
            unreadNotificationCount={unreadNotificationCount ?? 0}
            onContentsChanged={onContentsChanged}
            onEndReached={onEndReached}
            onRefresh={onRefresh}
            onAllUnread={onAllUnread}
            onItemChanged={onItemChanged}
            isLoading={isLoading as boolean}
        />
    )
}
export default WNotification

const styles = StyleSheet.create({})
