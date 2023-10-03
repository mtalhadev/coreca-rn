import { ReservationListCLType, ReservationListType, toReservationListCLType } from '../reservation/ReservationListType'
import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ArrangementWorkerListType, ArrangementWorkerListCLType, toArrangementWorkerListCLType } from './ArrangementWorkerListType'
import { WorkerType } from './Worker'

export type GetCompanyWorkerListType = ('all' | 'workers' | 'reservations')[]
/**
 *  会社に紐づく作業員一覧を表現する型。reservationsは日付制約をした方が意味のあるデータになる。
 *  @param workers - 実際の作業員
 *  @param reservations - 指定した日の指定した会社による常用予約
 */
export type CompanyWorkerListType = CommonListType<WorkerType> & {
    workers?: ArrangementWorkerListType
    reservations?: ReservationListType
}

export type CompanyWorkerListCLType = ReplaceAnd<
    CompanyWorkerListType,
    {
        workers?: ArrangementWorkerListCLType
        reservations?: ReservationListCLType
    }
>

export const toCompanyWorkerListCLType = (data?: CompanyWorkerListType): CompanyWorkerListCLType => {
    return {
        ...data,
        workers: data?.workers ? toArrangementWorkerListCLType(data.workers) : undefined,
        reservations: data?.reservations ? toReservationListCLType(data.reservations) : undefined,
    }
}
