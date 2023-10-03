import { CommonListType, ReplaceAnd } from '../_others/Common'
import { InvReservationCLType, InvReservationType, toInvReservationCLType } from './InvReservation'


export type InvReservationListType = CommonListType<InvReservationType> & {
    items?: InvReservationType[]
}

export type InvReservationListCLType = ReplaceAnd<
    InvReservationListType,
    {
        items?: InvReservationCLType[]
    }
>

export const toInvReservationListCLType = (data?: InvReservationListType): InvReservationListCLType => {
    return {
        ...data,
        items: data?.items ? data.items.map((val) => toInvReservationCLType(val)) : undefined,
    }
}

export const toInvReservationListType = (items?: InvReservationType[], mode?: 'all' | 'none'): InvReservationListType => {
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
