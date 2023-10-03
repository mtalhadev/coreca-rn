import { CompanyCLType, toCompanyCLType } from '../../models/company/Company'
import { _getCompany, _getPartnerCompaniesOfTargetCompany } from '../../services/company/CompanyService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'

export type GetMyPartnershipCompaniesParam = {
    myCompanyId?: string
}

export type GetMyPartnershipCompaniesResponse = CompanyCLType[] | undefined

export const getMyPartnershipCompaniesWithMyCompany = async (params: GetMyPartnershipCompaniesParam): Promise<CustomResponse<GetMyPartnershipCompaniesResponse>> => {
    try {
        const { myCompanyId } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        const results = await Promise.all([
            _getPartnerCompaniesOfTargetCompany({
                companyId: myCompanyId,
                options: { companyPartnership: { params: { companyId: myCompanyId } }, connectedCompany: { params: { myCompanyId }, companyPartnership: { params: { companyId: myCompanyId } } } },
            }),
            _getCompany({ companyId: myCompanyId }),
        ])

        const companiesResult = results[0]
        const myCompanyResult = results[1]
        const companies = companiesResult.success
        const myCompany = myCompanyResult.success
        if (companiesResult.error || myCompanyResult.error || companies == undefined || myCompany == undefined) {
            throw {
                error: '顧客/取引先または自社情報を取得できません。',
            } as CustomResponse
        }
        const response = [{ ...toCompanyCLType({ ...myCompany }), companyPartnership: 'my-company' }, ...(companies.items?.map((company) => toCompanyCLType(company ?? {})) ?? [])] as CompanyCLType[]

        return Promise.resolve({
            success: response as GetMyPartnershipCompaniesResponse,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const getMyPartnershipCompanies = async (params: GetMyPartnershipCompaniesParam): Promise<CustomResponse<GetMyPartnershipCompaniesResponse | undefined>> => {
    try {
        const { myCompanyId } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        const result = await _getPartnerCompaniesOfTargetCompany({
            companyId: myCompanyId,
            options: { companyPartnership: { params: { companyId: myCompanyId } }, connectedCompany: { params: { myCompanyId }, companyPartnership: { params: { companyId: myCompanyId } } } },
        })

        if (result.error || result.success == undefined) {
            throw {
                error: '顧客/取引先を取得できません。',
            } as CustomResponse
        }
        const response = result?.success?.items?.map((company) => toCompanyCLType(company ?? {})) ?? []
        return Promise.resolve({
            success: response,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
