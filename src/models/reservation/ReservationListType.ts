import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ReservationCLType, ReservationType, toReservationCLType } from './Reservation'

export type GetReservationListType = 'all'[]

export type ReservationListType = CommonListType<ReservationType> & {
    items?: ReservationType[]
}

export type ReservationListCLType = ReplaceAnd<
    ReservationListType,
    {
        items?: ReservationCLType[]
    }
>

export const toReservationListCLType = (data?: ReservationListType): ReservationListCLType => {
    return {
        ...data,
        items: data?.items?.map((val) => toReservationCLType(val)),
    }
}

export const toReservationListType = (items?: ReservationType[], mode?: 'all' | 'none'): ReservationListType => {
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
