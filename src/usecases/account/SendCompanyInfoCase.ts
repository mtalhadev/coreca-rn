import { CustomResponse } from '../../models/_others/CustomResponse'
import { _sendCompanyAccountInfoMail } from '../../services/SendGridMail'
import { getErrorMessage } from '../../services/_others/ErrorService'

export type CompanyAccountInfoMailParams = {
    email?: string
    password?: string
    ownerName?: string
    companyName?: string
    address?: string
    industry?: string
    departmentName?: string
    phoneNumber?: string
}

/**
 * @objective 会社アカウント新規作成時にメールで通知する
 * @requires
 * - ownerName - 代表者名
 * - email - 代表者アカウントのメールアドレス
 * - password - 代表者アカウントのパスワード
 * - name - 屋号
 * - industry - 業種
 * - departmentName - 部署名（任意）
 * - address - 住所
 * - phoneNumber - 電話番号
 * @error
 * - COMPANY_INFO_NOT_ENOUGH - 会社情報が不測している時
 * - ACCOUNT_INFO_NOT_ENOUGH - アカウント情報が不測している時
 * @author Hamada
 * @param params - {@link CompanyAccountInfoMailParams}
 * @returns - boolean
 */
export const sendCompanyAccountInfo = async (params: CompanyAccountInfoMailParams): Promise<CustomResponse> => {
    try {
        const { ownerName, email, password, companyName, industry, departmentName, address, phoneNumber } = params

        if (ownerName === undefined || email === undefined || password === undefined) {
            throw {
                error: 'アカウント情報が足りません。 ',
                errorCode: 'ACCOUNT_INFO_NOT_ENOUGH',
            } as CustomResponse
        }

        if (companyName === undefined || industry === undefined || address === undefined || phoneNumber === undefined) {
            throw {
                error: '会社情報が足りません。 ',
                errorCode: 'COMPANY_INFO_NOT_ENOUGH',
            } as CustomResponse
        }

        const result = await _sendCompanyAccountInfoMail(params)
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: true,
            error: undefined,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
