import { CommonListType, ReplaceAnd } from '../_others/Common'
import { RoomUserType, RoomUserCLType, toRoomUserCLType } from './RoomUser'

export type GetRoomUserListType = 'all'[]

export type RoomUserListType = CommonListType<RoomUserType> & {
    items?: RoomUserType[]
}

export type RoomUserListCLType = ReplaceAnd<
    RoomUserListType,
    {
        items?: RoomUserCLType[]
    }
>

export const toRoomUserListCLType = (data?: RoomUserListType): RoomUserListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toRoomUserCLType(val)) : undefined,
    }
}

export const toRoomUserListType = (items?: RoomUserType[], mode?: 'all' | 'none'): RoomUserListType => {
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
