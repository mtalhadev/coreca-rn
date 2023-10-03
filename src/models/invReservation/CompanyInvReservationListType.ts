import { isNoValueObject } from '../../utils/Utils'
import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ID } from '../_others/ID'
import { InvReservationType } from './InvReservation'
import { InvReservationListType, InvReservationListCLType, toInvReservationListCLType, toInvReservationListType } from './InvReservationListType'
export type GetCompanyInvReservationListType = ('all' | 'receive' | 'order')[]
/**
 * - allInvReservations - その会社の常用で送る( or 送られた)一覧の取得
 * - orderInvReservations - その会社の常用で送る一覧の取得
 * - receiveInvReservations - その会社の常用で来た一覧の取得
 */
export type CompanyInvReservationListType<ListType extends CommonListType<InvReservationType> = InvReservationListType> = CommonListType<InvReservationType> & {
    totalInvReservations?: ListType
    orderInvReservations?: ListType
    receiveInvReservations?: ListType
}
/**
 * - allInvReservations - その会社の常用で送る(or 送られた)一覧の取得
 * - orderInvReservations - その会社の常用で送る一覧の取得
 * - receiveInvReservations - その会社の常用で来た一覧の取得
 */
export type CompanyInvReservationListCLType<ListCLType extends CommonListType<InvReservationType> = InvReservationListCLType> = ReplaceAnd<
    CompanyInvReservationListType,
    {
        totalInvReservations?: ListCLType
        orderInvReservations?: ListCLType
        receiveInvReservations?: ListCLType
    }
>

export const toCompanyInvReservationListCLType = (data?: CompanyInvReservationListType): CompanyInvReservationListCLType => {
    return {
        ...data,
        totalInvReservations: data?.totalInvReservations ? toInvReservationListCLType(data.totalInvReservations) : undefined,
        orderInvReservations: data?.orderInvReservations ? toInvReservationListCLType(data.orderInvReservations) : undefined,
        receiveInvReservations: data?.receiveInvReservations ? toInvReservationListCLType(data.receiveInvReservations) : undefined,
    }
}

export const toCompanyInvReservationListType = (invReservations?: InvReservationType[], companyId?: ID, mode?: 'all' | 'none'): CompanyInvReservationListType => {
    mode = mode ?? 'all'
    if (mode == 'none') {
        return {
            totalInvReservations: toInvReservationListType(invReservations),
        }
    }
    return {
        totalInvReservations: toInvReservationListType(invReservations),
        orderInvReservations: toInvReservationListType(filterOrderInvReservations(invReservations, companyId)),
        receiveInvReservations: toInvReservationListType(filterReceiveInvReservations(invReservations, companyId)),
    }
}

export const filterOrderInvReservations = (invReservations?: InvReservationType[], companyId?: ID): InvReservationType[] => {
    return invReservations?.filter((invReservation) => isOrderInvReservation(invReservation, companyId)).filter((data) => !isNoValueObject(data)) as InvReservationType[]
}
export const isOrderInvReservation = (invReservation?: InvReservationType, companyId?: ID): boolean => {
    return invReservation?.myCompanyId == companyId
}

export const filterReceiveInvReservations = (invReservations?: InvReservationType[], companyId?: ID): InvReservationType[] => {
    return invReservations?.filter((invReservation) => isReceiveInvReservation(invReservation, companyId)).filter((data) => !isNoValueObject(data)) as InvReservationType[]
}
export const isReceiveInvReservation = (invReservation?: InvReservationType, companyId?: ID): boolean => {
    return invReservation?.targetCompanyId == companyId
}
