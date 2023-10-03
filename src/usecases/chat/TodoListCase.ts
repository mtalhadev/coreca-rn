import { CustomResponse } from "../../models/_others/CustomResponse";
import { MessageType } from "../../models/message/Message";
import { TodoType } from "../../models/todos/Todo";
import { getErrorMessage } from "../../services/_others/ErrorService";
import { _getThreadHead } from "../../services/threadHead/ThreadHeadService";
import { _createTodo, _getTodoList } from "../../services/todo/TodoService";
import { getUuidv4 } from "../../utils/Utils";
import { getRoomInfo } from "./MembersListCase";

export type GetTodoListParam = {
    status: 'ongoing' | 'completed'
}

export type GetTodoListResponse =
    | TodoType[]
    | undefined

export const getTodoList = async(param: GetTodoListParam) : Promise<CustomResponse<GetTodoListResponse>> => {
    try {
        const { status } = param

        const result = await _getTodoList()

        if (result.error) {
            throw {error: result.error}
        }

        const rtnList: TodoType[] = result.success?.items?.filter(todo => (todo.isCompleted === (status === 'completed'))) || []

        return Promise.resolve({
            success: rtnList
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type CreateTodoParam = {
    message: MessageType;
    roomId: string;
    threadId: string;
    myWorkerId: string;
}

export type CreateTodoResponse =
    | TodoType
    | undefined

export const createTodo = async(param: CreateTodoParam) : Promise<CustomResponse<CreateTodoResponse>> => {
    
    const { message, roomId, threadId, myWorkerId } = param
    
    try {
        const resultThreadHead = await _getThreadHead({ threadId: threadId })
        if (resultThreadHead.error) {
            throw {error: resultThreadHead.error}
        }
        const threadMessageCount = resultThreadHead.success?.messageCount || 0

        const roomResult = await getRoomInfo(roomId, myWorkerId)
        if (roomResult.error) {
            throw {error: roomResult.error}
        }
       const createTaskResult =  await _createTodo({
            todoId: getUuidv4(),
            messageId: message.messageId,
            description: message.message,
            isCompleted: false,
            threadId: threadId,
            threadMessageCount,
            roomId: roomResult.success?.room.roomId,
            roomName: roomResult.success?.room.name
        })

        if (createTaskResult.error) {
            throw {error: createTaskResult.error}
        }

        return Promise.resolve({
            success: createTaskResult.success
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
