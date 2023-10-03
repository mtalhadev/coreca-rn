import { CustomDate, toCustomDateFromTotalSeconds } from '../_others/CustomDate'
import { CompanyCLType, CompanyType } from '../company/Company'
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'
import { ID } from '../_others/ID'
import { TotalSeconds } from '../_others/TotalSeconds'

/**
 * 特定日の自社から相手会社への常用依頼手配するための予約数を記録する。予約数を減らすことで常用依頼手配を行う。
 */
export type ReservationModel = Partial<{
    reservationId: ID
    targetCompanyId: ID
    myCompanyId: ID
    constructionId: ID
}> &
    CommonModel

export const initReservation = (reservation: Create<ReservationModel> | Update<ReservationModel>): Update<ReservationModel> => {
    const newReservation: Update<ReservationModel> = {
        reservationId: reservation.reservationId,
        constructionId: reservation.constructionId,
        targetCompanyId: reservation.targetCompanyId,
        myCompanyId: reservation.myCompanyId,
    }
    return newReservation
}

/**
 * {@link WorkerOptionInputParam - 説明}
 */
export type ReservationOptionInputParam = ReplaceAnd<
    GetOptionObjectType<ReservationOptionParam>,
    {
        // workers?: OptionType<{
        //     date?: CustomDate
        //     types?: GetReservationWorkerListType
        // }>
    }
>

/**
 * {@link WorkerOptionParam - 説明}
 */
export type ReservationOptionParam = {
    targetCompany?: CompanyType
    myCompany?: CompanyType
}

export type ReservationType = ReservationModel & ReservationOptionParam
export type GetReservationOptionParam = GetOptionParam<ReservationType, ReservationOptionParam, ReservationOptionInputParam>

export type ReservationCLType = ReplaceAnd<
    ReservationType,
    {
        targetCompany?: CompanyCLType
        myCompany?: CompanyCLType
    } & CommonCLType
>

export const toReservationCLType = (data?: ReservationType): ReservationCLType => {
    if (data == undefined) {
        return {}
    }
    return {
        ...data,
        ...toCommonCLType(data),
        targetCompany: data?.targetCompany ? toCommonCLType(data.targetCompany) : undefined,
        myCompany: data?.myCompany ? toCommonCLType(data.myCompany) : undefined,
    } as ReservationCLType
}
