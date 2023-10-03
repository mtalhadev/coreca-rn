import { _deletePartnership, _getPartnershipOfTargetCompanies } from '../../services/partnership/PartnershipService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'

export const deletePartnership = async (targetCompanyId: string, myCompanyId: string): Promise<CustomResponse> => {
    try {
        const _partnership = await _getPartnershipOfTargetCompanies({ companyId: targetCompanyId, companyId2: myCompanyId })
        if (_partnership.error) {
            throw {
                error: _partnership.error,
            }
        }
        if (_partnership.success != undefined) {
            try {
                await _deletePartnership(_partnership.success?.partnershipId as string)
            } catch (error) {
                throw {
                    error: '顧客/取引先情報の削除に失敗しました',
                } as CustomResponse
            }
        } else {
            throw {
                error: '顧客/取引先情報が存在しません',
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type updatePartnerCompanyListCacheOnWriteCompanyParam = {
    // updateDataのモデル
}

export const updatePartnerCompanyListCacheOnWriteCompany = async (params: updatePartnerCompanyListCacheOnWriteCompanyParam): Promise<CustomResponse> => {
    try {
        /**
         *      1. PartnerCompanyListのキャッシュ取得
         *      2. そのキャッシュデータにupdateDataを入れて良い感じに整形する。
         *      3. 整形したデータでPartnerCompanyListのキャッシュ更新
         */
        return Promise.resolve({
            success: true
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}