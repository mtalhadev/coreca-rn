import { CommonListType, ReplaceAnd } from '../_others/Common'
import { MessageType, MessageCLType, toMessageCLType } from './Message'

export type GetMessageListType = 'all'[]

export type MessageListType = CommonListType<MessageType> & {
    items?: MessageType[]
}

export type MessageListCLType = ReplaceAnd<
    MessageListType,
    {
        items?: MessageCLType[]
    }
>

export const toMessageListCLType = (data?: MessageListType): MessageListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toMessageCLType(val)) : undefined,
    }
}

export const toMessageListType = (items?: MessageType[], mode?: 'all' | 'none'): MessageListType => {
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
