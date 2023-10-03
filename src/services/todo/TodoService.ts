import { Create } from '../../models/_others/Common'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { TodoModel, TodoType } from '../../models/todos/Todo'
import { TodoListType } from '../../models/todos/TodoListType'
import { MY_TODOS } from '../../utils/Constants'
import LocalStorage from '../../utils/LocalStorage'
import { getErrorMessage } from '../_others/ErrorService'

export type GetTodoListResponse = TodoListType | undefined

export const _createTodo = async (todo: TodoType): Promise<CustomResponse<TodoType>> => {
    try {
        let todos: TodoType[] = await LocalStorage.getData(MY_TODOS)
        if(todos && Array.isArray(todos)) {
            todos.push(todo)
        }
        else {
            todos = [todo]
        }
        const createResult = await LocalStorage.storeData(MY_TODOS, todos)
        if(!createResult){
            throw {
                error: 'Create task failed!'
            }
        }
        return Promise.resolve({
            success: todo
        })

    } catch (error: any) {
        return getErrorMessage(error)
    }
}


export const _getTodoList = async (): Promise<CustomResponse<GetTodoListResponse>> => {
    try {
        const todos: TodoType[] = await LocalStorage.getData(MY_TODOS)
        if (!todos) {
            throw {
                error: 'No Todos found'
            }
        }
        return Promise.resolve({
            success: {
                items: todos
            }
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export const _updateTodo = async (todo: TodoType): Promise<CustomResponse<GetTodoListResponse>> => {
    try {
        const todos: TodoType[] = await LocalStorage.getData(MY_TODOS)
        if (!todos) {
            throw {
                error: 'No todos found'
            }
        }
        if(todos && Array.isArray(todos)) {
            const index = todos.findIndex(item => item.todoId === todo.todoId)
            if(index!=-1) todos[index] = todo;
            else throw { error: 'Item not found!' }
            await LocalStorage.storeData(MY_TODOS, todos);
        }
        return Promise.resolve({
            success: {
                items: todos
            }
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export const _deleteTodo = async (todoId: string): Promise<CustomResponse<GetTodoListResponse>> => {
    try {
        let todos: TodoType[] = await LocalStorage.getData(MY_TODOS)
        if (!todos) {
            throw {
                error: 'No todos found'
            }
        }
        if(todos && Array.isArray(todos)) {
            const index = todos.findIndex(item => item.todoId === todoId)
            if(index!=-1) todos.splice(index, 1);
            else throw { error: 'Item not found!' }
            await LocalStorage.storeData(MY_TODOS, todos);
        }
        return Promise.resolve({
            success: {
                items: todos
            }
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}