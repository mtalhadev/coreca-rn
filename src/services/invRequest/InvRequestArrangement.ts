import { SiteArrangementDataType } from "../../models/arrangement/SiteArrangementDataType"
import { InvRequestType } from "../../models/invRequest/InvRequestType"
import { CustomResponse } from "../../models/_others/CustomResponse"
import { TotalSeconds } from "../../models/_others/TotalSeconds"
import { _callFunctions } from "../firebase/FunctionsService"
import { getErrorMessage } from "../_others/ErrorService"


/**
 * @requires
 * @param invRequestId - 常用申請ID
 * @param orderCompanyId - 常用で送る会社のID
 * @param myWorkerId - 自分の作業員ID
 * 
 * @param date - 日付 workerのdailyInvRequest取得のため
 * @param invRequest - 効率化のため
 */
export type GetInvRequestArrangementDataParam = {
    invRequestId: string
    orderCompanyId: string
    myWorkerId: string
    date?: TotalSeconds
    invRequest?: InvRequestType
}
export type GetInvRequestArrangementDataResponse = SiteArrangementDataType | undefined
/**
 * @remarks 申請手配周りの情報を集約してくれる関数。
 * @objective 複雑な手配周りの情報処理をシンプルかつ普遍化するため。
 * @author Kamiya
 * @param params - {@link GetInvRequestArrangementDataParam}
 * @returns 指定した申請の手配情報全般を整理して出力。主に申請手配画面で使用。{@link GetInvRequestArrangementDataResponse}
 */
 export const _getInvRequestArrangementData = async (params: GetInvRequestArrangementDataParam): Promise<CustomResponse<GetInvRequestArrangementDataResponse>> => {
    try {
        const result = await _callFunctions('IInvRequestArrangement-getInvRequestArrangementData', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}