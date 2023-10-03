/* eslint-disable no-irregular-whitespace */
import { _callFunctions } from '../firebase/FunctionsService'
import { Create, Update } from '../../models/_others/Common'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../_others/ErrorService'
import { InstructionModel, InstructionType } from '../../models/instruction/Instruction'
import { SiteListType } from '../../models/site/SiteListType'
import { InstructionListType } from '../../models/instruction/InstructionListType'

export const _createInstruction = async (instruction: Create<InstructionModel>): Promise<CustomResponse<string>> => {
    try {
        const result = await _callFunctions('IInstruction-createInstruction', instruction)

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

export type GetInstructionParam = {
    targetRequestId: string,
    instructionType: InstructionType,
    instructionId?: string,
}

export type GetInstructionResponse = InstructionModel | undefined

export const _getInstruction = async (params: GetInstructionParam): Promise<CustomResponse<GetInstructionResponse>> => {
    try {
        const result = await _callFunctions('IInstruction-getInstruction', params)
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

export type GetInstructionSitesResponse = SiteListType | undefined

export const _getInstructionSites = async (params: GetInstructionListByConstructionIdParam): Promise<CustomResponse<GetInstructionSitesResponse>> => {
    try {
        const result = await _callFunctions('IInstruction-getInstructionSites', params)

        if (result.error) {
            throw {...result}
        }
        return Promise.resolve({
            success: result.success,
            detail: result.detail
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type GetInstructionListResponse = InstructionListType | undefined


export type GetInstructionListByConstructionIdParam = {
    instructionType: InstructionType,
    constructionId: string,
}

export const _getInstructionListByConstructionId = async (params: GetInstructionListByConstructionIdParam): Promise<CustomResponse<GetInstructionListResponse>> => {
    try {
        const result = await _callFunctions('IInstruction-getInstructionListByConstructionId', params)

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

export const _updateInstruction = async (instruction: Update<InstructionModel>): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IInstruction-updateInstruction', instruction)

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

export type UpdateInstructionParam = {
    instructionId?: string,
    targetRequestId?: string,
}

export const _approveInstruction = async (params: UpdateInstructionParam): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IInstruction-approveInstruction', params)
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

export const _unApproveInstruction = async (params: UpdateInstructionParam): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IInstruction-unApproveInstruction', params)
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

export const _deleteTargetInstruction = async (instructionId: string): Promise<CustomResponse> => {
    try {
        const result = await _callFunctions('IInstruction-deleteTargetInstruction', instructionId)
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