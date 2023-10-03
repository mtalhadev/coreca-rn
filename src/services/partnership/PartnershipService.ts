import { Create, Update } from '../../models/_others/Common'
import { _callFunctions } from '../firebase/FunctionsService'
import { GetPartnershipOptionParam, PartnershipModel, PartnershipType } from '../../models/partnership/Partnership'
import { CompanyPartnershipType } from '../../models/company/CompanyPartnershipType'
import { getErrorMessage } from '../_others/ErrorService'
import { CustomResponse } from '../../models/_others/CustomResponse'


export const _createPartnership = async (partnership: Create<PartnershipModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IPartnership-createPartnership', partnership)
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

export type GetPartnershipParam = {
    partnershipId: string
    options?: GetPartnershipOptionParam
}
// export type GetPartnershipOptionParam = {
//     withoutSelf?: PartnershipType
//     withFromCompany?: OptionParam<GetCompanyOptionParam>
//     withToCompany?: OptionParam<GetCompanyOptionParam>
// }
export type GetPartnershipResponse = PartnershipType | undefined
/**
 * 
 * @param params 
 *  - 
 *  - withoutSelf?: PartnershipType
    - withFromCompany?: OptionParam<GetCompanyOptionParam>
    - withToCompany?: OptionParam<GetCompanyOptionParam>
 * @returns 
 */
export const _getPartnership = async (params: GetPartnershipParam): Promise<CustomResponse<GetPartnershipResponse>> => {
    try {
        const result = await _callFunctions('IPartnership-getPartnership', params)
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

export const _updatePartnership = async (partnership: Update<PartnershipModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IPartnership-updatePartnership', partnership)
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

export const _deletePartnership = async (partnershipId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IPartnership-deletePartnership', partnershipId)
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

export type _getPartnershipOfTargetCompaniesParam = {
    companyId: string
    companyId2: string
    options?: GetPartnershipOptionParam
}
export type GetPartnershipOfTargetCompaniesResponse = PartnershipType | undefined
export const _getPartnershipOfTargetCompanies = async (params: _getPartnershipOfTargetCompaniesParam): Promise<CustomResponse<GetPartnershipOfTargetCompaniesResponse>> => {
    try {
        const result = await _callFunctions('IPartnership-getPartnershipOfTargetCompanies', params)
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        const _error = error
        return Promise.resolve({
            error: _error.code ?? _error.error,
        })
    }
}


export type GetCompanyPartnershipOfTargetCompaniesResponse = CompanyPartnershipType | undefined
export const _getCompanyPartnershipOfTargetCompanies = async (companyId: string, myCompanyId: string): Promise<CustomResponse<GetCompanyPartnershipOfTargetCompaniesResponse>> => {
    try {
        const result = await _callFunctions('IPartnership-getCompanyPartnershipOfTargetCompanies', {companyId, myCompanyId})
        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success
        })
    } catch (error: any) {
        const _error = error
        return Promise.resolve({
            error: _error.code ?? _error.error,
        })
    }
}
