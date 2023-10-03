import { Create, Update } from "../_others/Common"
import { ID } from "../_others/ID"

/**
 * 常用で手配した作業員のIDとそれに紐づく上位のinvRequestId,現場手配された場合のattendanceIdを保持する。
 */
export type InvRequestWorkerModel = Partial<{
    invRequestWorkerId: ID
    workerId?: ID,
    /**
     * この作業員がどのinvRequestから来たかを示すため1つのみ。
     */
    invRequestId?: ID,
    /**
     * 同日に複数現場に手配可能なため、配列。
     */
    attendanceIds?: ID[],//ここから先は配列を使えない。サブコレクションにするか？もしくはオブジェクト形式にする。
}>

export const initInvRequestWorker = (application: Create<InvRequestWorkerModel> | Update<InvRequestWorkerModel>): Update<InvRequestWorkerModel> => {
    const newReservation: Update<InvRequestWorkerModel> = {
        invRequestWorkerId: application.invRequestWorkerId,
        workerId: application.workerId,
        invRequestId: application.invRequestId,
        attendanceIds: application.attendanceIds,
    }
    return newReservation
}