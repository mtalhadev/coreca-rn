import { CommonListType, ReplaceAnd } from '../_others/Common'
import { TodoType, TodoCLType, toTodoCLType } from './Todo'

export type GetTodoListType = 'all'[]

export type TodoListType = CommonListType<TodoType> & {
    items?: TodoType[]
}

export type TodoListCLType = ReplaceAnd<
    TodoListType,
    {
        items?: TodoCLType[]
    }
>

export const toTodoListCLType = (data?: TodoListType): TodoListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toTodoCLType(val)) : undefined,
    }
}

export const toTodoListType = (items?: TodoType[], mode?: 'all' | 'none'): TodoListType => {
    mode = mode ?? 'all'
    if (mode == 'none') {
        return {
            items,
        }
    }
    return {
        items,
    }
}
