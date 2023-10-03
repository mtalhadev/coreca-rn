import { RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { isEmpty } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, ListRenderItem, ListRenderItemInfo, RefreshControl } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { useTextTranslation } from '../../../../fooks/useTextTranslation'
import { useSafeLoadingUnmount, useSafeUnmount } from '../../../../fooks/useUnmount'
import { CustomResponse } from '../../../../models/_others/CustomResponse'
import { RoomUserType } from '../../../../models/roomUser/RoomUser'
import { RootStackParamList } from '../../../../screens/Router'
import { getErrorToastMessage } from '../../../../services/_others/ErrorService'
import { _updateTodo } from '../../../../services/todo/TodoService'
import { setIsNavUpdating } from '../../../../stores/NavigationSlice'
import { StoreType } from '../../../../stores/Store'
import { ToastMessage, setLoading, setToastMessage } from '../../../../stores/UtilSlice'
import { GetTodoListResponse, getTodoList } from '../../../../usecases/chat/TodoListCase'
import { deleteScreenOfUpdateScreens } from '../../../../usecases/updateScreens/CommonUpdateScreensCase'
import { SCREEN_WIDTH, THEME_COLORS } from '../../../../utils/Constants'
import { SwitchAdminOrWorkerProps } from '../../../../utils/Utils'
import { BottomMargin } from '../../../atoms/BottomMargin'
import { Search } from '../../Search'
import { TodoItem, TodoItemUIType } from './TodoItem'

type NavProps = StackNavigationProp<RootStackParamList, 'AdminCompletedTodoList'>
type RouteProps = RouteProp<RootStackParamList, 'AdminCompletedTodoList'>

type InitialStateType = {
    filteredTodos: TodoItemUIType[]
    allTodos: TodoItemUIType[]
    refreshing: boolean
}
const initialState: InitialStateType = {
    filteredTodos: [],
    allTodos: [],
    refreshing: false,
}

const CompletedTodoList = (props: Partial<SwitchAdminOrWorkerProps>) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const side = props.side ?? 'admin'
    const screenName: string = side == 'admin' ? 'AdminCompletedTodoList' : 'WorkerCompletedTodoList'

    const [{ filteredTodos, allTodos, refreshing }, setState] = useState(initialState)
    const dispatch = useDispatch()
    const isFocused = useIsFocused()
    const isNavUpdating = useSelector((state: StoreType) => state?.nav?.isNavUpdating)
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const accountId = signInUser?.accountId ?? ''

    const [textFilter, setTextFilter] = useState<string | undefined>(undefined)

    //productionでのログ出力抑制
    !__DEV__ && (console.log = () => {})

    useEffect(() => {
        if (isFocused && isNavUpdating) {
            setState((prev) => ({ ...prev, refreshing: true }))
        }
    }, [isNavUpdating, isFocused])

    useEffect(() => {
        ;(async () => {
            try {
                // if (isEmpty(signInUser?.workerId) || refreshing != true) {
                //     dispatch(setIsNavUpdating(false))
                //     setState((prev) => ({ ...prev, refreshing: false }))
                //     return
                // }
                if (isFocused) dispatch(setLoading(true))
                const todosResult: CustomResponse<GetTodoListResponse> = await getTodoList({ status: 'completed' })
                if (todosResult.error) {
                    dispatch(
                        setToastMessage({
                            text: todosResult.error,
                            type: 'error',
                        } as ToastMessage),
                    )
                    return
                }
                /**
                 * キャッシュアップデート前に先に表示データを更新。
                 */
                setState((prev) => ({
                    ...prev,
                    allTodos: todosResult.success ?? [],
                    filteredTodos: todosResult.success ?? [],
                }))
                await deleteScreenOfUpdateScreens({ accountId, screenName: screenName })
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            } finally {
                setState((prev) => ({ ...prev, refreshing: false }))
                if (isFocused) {
                    dispatch(setIsNavUpdating(false))
                    dispatch(setLoading(false))
                }
            }
        })()
    }, [refreshing])

    useSafeLoadingUnmount(dispatch, isFocused)

    useSafeUnmount(setState, initialState)

    useEffect(() => {
        const dataFilteredByTodo = filteredByTodoName(allTodos) as TodoItemUIType[]
        if (textFilter && textFilter.length > 0) {
            if (dataFilteredByTodo.length > 0) {
                setState((prev) => ({ ...prev, filteredTodos: dataFilteredByTodo }))
            } else {
                setState((prev) => ({ ...prev, filteredTodos: [] }))
            }
        } else {
            setState((prev) => ({ ...prev, filteredTodos: allTodos }))
        }
    }, [textFilter])

    const _content: ListRenderItem<TodoItemUIType> = (info: ListRenderItemInfo<TodoItemUIType>) => {
        const { item, index } = info
        const item2 = { 
            ...item, 
            onPress: (todoId?: string) => _onPressTodo(todoId),
            onMsgCountPress: () => _onMsgCountPress(item)
        }
        return <TodoItem {...item2} />
    }

    const _header = (
        <Search
            style={{
                marginTop: 8,
                marginBottom: 10,
                marginHorizontal: 10,
                backgroundColor: '#FFF',
                width: SCREEN_WIDTH - 20,
            }}
            text={textFilter}
            title={t('common:SearchByTodoDescription')}
            onChange={setTextFilter}
            clearText={() => setTextFilter(undefined)}
            placeholder={t('common:SearchByTodoDescription')}
            onBlur={undefined}
        />
    )

    const filteredByTodoName = useCallback(
        (data: TodoItemUIType[]) => {
            return data.filter(({ description }) => {
                if (description && textFilter && textFilter.length > 0) {
                    return description.indexOf(textFilter) > -1
                }
            })
        },
        [textFilter],
    )

    const _onRefresh = async () => {
        setState((prev) => ({ ...prev, refreshing: true }))
    }

    const _onPressTodo = async (todoId?: string, messageId?: string, threadId?: string) => {
        const updateTodoList = [ ...filteredTodos ]
        const index = filteredTodos.findIndex(item => item.todoId === todoId && item.messageId === messageId && item.threadId === threadId)
        if(index > -1){
            const todo = updateTodoList[index];
            todo.isCompleted = false
            dispatch(setLoading(true))
            const updateResponse = await _updateTodo(todo)
            if(updateResponse.error)
                dispatch(
                    setToastMessage({
                        text: updateResponse.error,
                        type: 'error',
                    } as ToastMessage),
                )
            if(updateResponse.success?.items)
                updateTodoList.splice(index, 1)
        }
        dispatch(setLoading(false))
        setState((prev) => ({
            ...prev,
            filteredTodos: updateTodoList ?? [],
        }))
    }
    const _onMsgCountPress = (todo: TodoItemUIType) => {
        navigation.push(side == 'admin' ? 'AdminChatDetail' : 'WorkerChatDetail', {
            roomId: todo.roomId ?? '', 
            threadId: todo.threadId ?? '', 
            name: todo.roomName ?? 'no-name'
        })
    }

    return (
        <FlatList
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: THEME_COLORS.OTHERS.BACKGROUND,
            }}
            contentContainerStyle={{ alignItems: 'center' }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={_onRefresh} />}
            data={filteredTodos}
            renderItem={_content}
            keyExtractor={(item, i) => item.todoId || 'todo-'+i}
            ListHeaderComponent={_header}
            ListFooterComponent={() => <BottomMargin />}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
        />
    )
}

export default CompletedTodoList
