import { toMessageCLType, MessageCLType, MessageType } from '../message/Message';
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common';
import { ID } from '../_others/ID';
import { GetOptionObjectType, GetOptionParam } from '../_others/Option';



export type TodoModel = Partial<{
    todoId: ID;
    threadId: ID;
    messageId: ID;
    roomId: ID;
    roomName: string;
    description: string;
    isCompleted: boolean;
    threadMessageCount: number;
}> &
    CommonModel;

export const initTodo = (todo: Create<TodoModel> | Update<TodoModel>): Update<TodoModel> => {
    const newTodo: Update<TodoModel> = {
      todoId: todo.todoId,
      messageId: todo.messageId,
      description: todo.description,
      isCompleted: todo.isCompleted
      };
    return newTodo;
};


/**
 * {@link MessageOptionInputParam - 説明}
 */
 export type TodoOptionInputParam = ReplaceAnd<
    GetOptionObjectType<TodoOptionParam>,
    {
        //
    }
>;

/**
 * {@link MessageOptionParam - 説明}
 */
export type TodoOptionParam = {
    message?: MessageType;
};

export type TodoType = TodoModel & TodoOptionParam;
export type GetTodoOptionParam = GetOptionParam<TodoType, TodoOptionParam, TodoOptionInputParam>;


export type TodoCLType = ReplaceAnd<
  TodoType,
  {
    message?: MessageCLType;
  } & CommonCLType
>;

export const toTodoCLType = (data?: TodoType): TodoCLType => {
  return {
    ...data,
    ...toCommonCLType(data),
    message: data?.message ? toMessageCLType(data?.message) : undefined,
  } as TodoCLType;
};


