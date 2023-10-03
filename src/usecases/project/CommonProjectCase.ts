import { ContractType, toContractCLType } from '../../models/contract/Contract'
import { ProjectCLType, ProjectType, toProjectCLType } from '../../models/project/Project'
import { _getContract } from '../../services/contract/ContractService'
import { _deleteProject, _getProject } from '../../services/project/ProjectService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'

export type GetTargetProjectParam = {
    projectId?: string
}

export type GetTargetProjectResponse = ProjectCLType | undefined

export const getTargetProject = async (params: GetTargetProjectParam): Promise<CustomResponse<GetTargetProjectResponse>> => {
    try {
        const { projectId } = params
        if (projectId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }

        const result = await _getProject({ projectId })
        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: toProjectCLType(result.success),
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetProjectDetailParam = {
    contractId?: string
    myCompanyId?: string
}

export type GetProjectDetailResponse = ContractType | undefined

/**
 * 
 * @param params withProject: {
                withCreateCompany: true
            },
            withOrderCompany: true
 * @returns 
 */
export const getContractingProjectDetail = async (params: GetProjectDetailParam): Promise<CustomResponse<GetProjectDetailResponse>> => {
    try {
        const { contractId, myCompanyId } = params
        if (contractId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }

        const result = await _getContract({
            contractId,
            options: {
                contractLog: true,
                project: {
                    createCompany: true,
                    updateWorker: {
                        company: true,
                    },
                },
                orderCompany: {
                    companyPartnership: {
                        params: {
                            companyId: myCompanyId,
                        },
                    },
                },
                receiveCompany: {
                    companyPartnership: {
                        params: {
                            companyId: myCompanyId,
                        },
                    },
                },
                orderDepartments: true,
                receiveDepartments: true,
            },
        })
        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type DeleteTargetProjectParam = {
    projectId?: string
}

export type DeleteTargetProjectResponse = boolean | undefined

export const deleteTargetProject = async (params: DeleteTargetProjectParam): Promise<CustomResponse<DeleteTargetProjectResponse>> => {
    try {
        const { projectId } = params
        if (projectId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }

        const projectResult = await _deleteProject(projectId)
        if (projectResult.error) {
            throw {
                error: projectResult.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
