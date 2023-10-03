import { ContractType } from '../../models/contract/Contract'
import { _getContractListOfTargetCompany, _getContractListOfTargetCompanyAndMonth } from '../../services/contract/ContractService'
import { _getProject, _getProjectListByIds, _getProjectListOfTargetCompany } from '../../services/project/ProjectService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { separateListByMonth } from '../CommonCase'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { ProjectCLType, ProjectType, toProjectCLType } from '../../models/project/Project'
import uniqBy from 'lodash/uniqBy'
import flatten from 'lodash/flatten'
import groupBy from 'lodash/groupBy'
import { toCompanyContractListCLType, toCompanyContractListType } from '../../models/contract/CompanyContractListType'
import { _getPartnerCompaniesOfTargetCompany } from '../../services/company/CompanyService'
import { _getConstructionMeterOfTargetConstruction } from '../../services/construction/ConstructionService'
import { CustomDate, getMonthlyFinalDay, getYYYYMMTotalSeconds } from '../../models/_others/CustomDate'
export type GetProjectListOfTargetCompanyParam = {
    companyId?: string
}
/**
 * Month := monthBaseText(date)
 */
export type ProjectListUIType = { [Month in string]: ProjectCLType[] }

export type GetProjectListOfTargetCompanyResponse = ProjectListUIType | undefined

export const toContractingProjectUItype = (contracts?: ContractType[], project?: ProjectType, companyId?: string): ProjectCLType => {
    const res = {
        ...toProjectCLType(project),
        companyContracts: toCompanyContractListCLType(toCompanyContractListType(contracts, companyId)),
    }
    return res
}

export const toProjectListUIType = (contracts?: Record<string, ContractType[]>, companyId?: string): ProjectListUIType => {
    const separate = separateListByMonth<ProjectCLType>(Object.keys(contracts ?? {})?.map((key) => toContractingProjectUItype((contracts ?? {})[key], (contracts ?? {})[key][0].project, companyId)))
    return separate
}

export const getProjectListOfTargetCompany = async (params: GetProjectListOfTargetCompanyParam): Promise<CustomResponse<GetProjectListOfTargetCompanyResponse>> => {
    try {
        const { companyId } = params
        if (companyId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }
        const companiesResult = await _getPartnerCompaniesOfTargetCompany({
            companyId,
        })
        if (companiesResult.error) {
            throw companiesResult.error
        }
        // 仮会社の場合は常用用案件があるので取得必要。
        const companyIds = [companyId, ...(companiesResult.success?.items?.filter((data) => data.isFake).map((company) => company.companyId) as string[])]
        const results = await Promise.all(
            companyIds.map((id) =>
                _getContractListOfTargetCompany({
                    companyId: id,
                    types: id == companyId ? ['all'] : ['receive'],
                    options: {
                        orderCompany: {
                            companyPartnership: {
                                params: {
                                    companyId,
                                },
                            },
                        },
                        receiveCompany: {
                            companyPartnership: {
                                params: {
                                    companyId,
                                },
                            },
                        },
                    },
                }),
            ) ?? [],
        )
        results.forEach((_res) => {
            if (_res.error) {
                throw _res.error
            }
        })

        let contracts = uniqBy(
            flatten(results.map((_res) => _res.success?.totalContracts?.items)).filter((data) => data != undefined),
            (data) => data?.contractId,
        ) as ContractType[]
        const projectIds = contracts?.map((contract) => contract?.projectId).filter((id) => id != undefined) as string[]
        const projectsResult = await _getProjectListByIds({
            projectIds,
            options: {
                projectConstructions: {
                    constructionRelation: {
                        params: {
                            companyId,
                        },
                    },
                    constructionMeter: { params: { companyId: companyId } },
                    displayName: true,
                },
            },
        })
        if (projectsResult.error) {
            throw {
                error: projectsResult.error,
            }
        }

        contracts = contracts?.map((contract) => ({ ...contract, project: projectsResult.success?.filter((project) => project.projectId == contract.projectId)[0] }))
        const res = toProjectListUIType(
            groupBy(contracts, (contract) => contract.projectId),
            companyId,
        )
        return Promise.resolve({
            success: res,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export type GetProjectListOfTargetCompanyAndMonthParam = {
    companyId?: string
    month?: CustomDate
}
export type GetProjectListOfTargetCompanyAndMonthResponse = ProjectListUIType | undefined
export const getProjectListOfTargetCompanyAndMonth = async (params: GetProjectListOfTargetCompanyAndMonthParam): Promise<CustomResponse<GetProjectListOfTargetCompanyAndMonthResponse>> => {
    try {
        const { companyId, month } = params
        if (companyId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }
        if (month == undefined) {
            throw {
                error: 'monthが足りません。',
            } as CustomResponse
        }
        const companiesResult = await _getPartnerCompaniesOfTargetCompany({
            companyId,
        })
        if (companiesResult.error) {
            throw companiesResult.error
        }
        // 仮会社の場合は常用用案件があるので取得必要。
        const companyIds = [companyId, ...(companiesResult.success?.items?.filter((data) => data.isFake).map((company) => company.companyId) as string[])]
        const results = await Promise.all(
            companyIds.map((id) =>
                _getContractListOfTargetCompanyAndMonth({
                    companyId: id,
                    types: id == companyId ? ['all'] : ['receive'],
                    month: getYYYYMMTotalSeconds(month),
                    endOfMonth: getMonthlyFinalDay(month).totalSeconds,
                    options: {
                        orderCompany: {
                            companyPartnership: {
                                params: {
                                    companyId,
                                },
                            },
                        },
                        receiveCompany: {
                            companyPartnership: {
                                params: {
                                    companyId,
                                },
                            },
                        },
                    },
                }),
            ) ?? [],
        )
        results.forEach((_res) => {
            if (_res.error) {
                throw _res.error
            }
        })

        let contracts = uniqBy(
            flatten(results.map((_res) => _res.success?.totalContracts?.items)).filter((data) => data != undefined),
            (data) => data?.contractId,
        ) as ContractType[]

        const projectIds = contracts?.map((contract) => contract?.projectId).filter((id) => id != undefined) as string[]
        const projectsResult = await _getProjectListByIds({
            projectIds,
            options: {
                projectConstructions: {
                    constructionRelation: {
                        params: {
                            companyId,
                        },
                    },
                    constructionMeter: { params: { companyId: companyId } },
                    displayName: true,
                },
            },
        })
        if (projectsResult.error) {
            throw {
                error: projectsResult.error,
            }
        }

        contracts = contracts?.map((contract) => ({ ...contract, project: projectsResult.success?.filter((project) => project.projectId == contract.projectId)[0] }))
        const res = toProjectListUIType(
            groupBy(contracts, (contract) => contract.projectId),
            companyId,
        )
        return Promise.resolve({
            success: res,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
