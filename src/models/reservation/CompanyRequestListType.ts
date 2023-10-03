import { isNoValueObject } from '../../utils/Utils';
import { CommonListType, ReplaceAnd } from '../_others/Common';
import { ID } from '../_others/ID';
import { ReservationType } from './Reservation';
import { ReservationListType, ReservationListCLType, toReservationListCLType, toReservationListType } from './ReservationListType';

export type GetCompanyReservationListType = ('all' | 'receive' | 'order')[];

export type CompanyReservationListType = CommonListType<ReservationType> & {
    orderReservations?: ReservationListType;
    receiveReservations?: ReservationListType;
    totalReservations?: ReservationListType;
};

export type CompanyReservationListCLType = ReplaceAnd<
    CompanyReservationListType,
    {
        orderReservations?: ReservationListCLType;
        receiveReservations?: ReservationListCLType;
        totalReservations?: ReservationListCLType;
    }
>;

export const toCompanyReservationListCLType = (data?: CompanyReservationListType): CompanyReservationListCLType => {
    return {
        ...data,
        totalReservations: data?.totalReservations ? toReservationListCLType(data?.totalReservations) : undefined,
        orderReservations: data?.orderReservations ? toReservationListCLType(data?.orderReservations) : undefined,
        receiveReservations: data?.receiveReservations ? toReservationListCLType(data?.receiveReservations) : undefined,
    } as CompanyReservationListCLType;
};

export const toCompanyReservationListType = (reservations?: ReservationType[], companyId?: ID, mode?: 'all' | 'none'): CompanyReservationListType => {
    mode = mode ?? 'all';
    if (mode == 'none') {
        return {
            totalReservations: toReservationListType(reservations),
        };
    }
    return {
        totalReservations: reservations,
        orderReservations: toReservationListType(filterOrderReservations(reservations, companyId)),
        receiveReservations: toReservationListType(filterReceiveReservations(reservations, companyId)),
    } as CompanyReservationListType;
};

export const filterOrderReservations = (reservations?: ReservationType[], companyId?: ID): ReservationType[] => {
    return reservations?.filter((reservation) => isOrderReservation(reservation, companyId)).filter((data) => !isNoValueObject(data)) as ReservationType[];
};
export const isOrderReservation = (reservation?: ReservationType, companyId?: ID): boolean => {
    return reservation?.myCompanyId == companyId;
};

export const filterReceiveReservations = (reservations?: ReservationType[], companyId?: ID): ReservationType[] => {
    return reservations?.filter((reservation) => isReceiveReservation(reservation, companyId)).filter((data) => !isNoValueObject(data)) as ReservationType[];
};
export const isReceiveReservation = (reservation?: ReservationType, companyId?: ID): boolean => {
    return reservation?.targetCompanyId == companyId;
};
