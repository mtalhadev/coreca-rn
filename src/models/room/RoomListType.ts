import { CommonListType, ReplaceAnd } from '../_others/Common'
import { RoomType, RoomCLType, toRoomCLType } from './Room'

export type GetRoomListType = 'all'[]

export type RoomListType = CommonListType<RoomType> & {
    items?: RoomType[]
}

export type RoomListCLType = ReplaceAnd<
    RoomListType,
    {
        items?: RoomCLType[]
    }
>

export const toRoomListCLType = (data?: RoomListType): RoomListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toRoomCLType(val)) : undefined,
    }
}

export const toRoomListType = (items?: RoomType[], mode?: 'all' | 'none'): RoomListType => {
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
