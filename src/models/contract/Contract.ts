import { CustomDate, toCustomDateFromTotalSeconds } from '../_others/CustomDate'
import { CommonCLType, CommonModel, Create, ReplaceAnd, toCommonCLType, Update } from '../_others/Common'
import { CompanyCLType, CompanyType, toCompanyCLType } from '../company/Company'
import { ConstructionCLType, ConstructionType, toConstructionCLType } from '../construction/Construction'
import { ProjectCLType, ProjectType, toProjectCLType } from '../project/Project'
import { GetRelatedContractListType, RelatedContractListCLType, RelatedContractListType, toRelatedContractListCLType } from './RelatedContractListType'
import { toWorkerCLType, WorkerCLType, WorkerType } from '../worker/Worker'
import { GetRelatedConstructionListType } from '../construction/RelatedConstructionListType'
import { GetOptionObjectType, OptionType, GetOptionParam } from '../_others/Option'
import { ConstructionListCLType, ConstructionListType, toConstructionListCLType } from '../construction/ConstructionListType'
import { TotalSeconds } from '../_others/TotalSeconds'
import { ID } from '../_others/ID'
import { DepartmentListType } from '../department/DepartmentListType'
import { ContractLogListType } from '../contractLog/ContractLogListType'

/**
 * superConstructionId - 契約につながる発注工事。上位
 * receiveDepartmentIds - 案件に紐づいた最上位の契約のみ指定可能。
 */
export type ContractModel = Partial<{
    contractId: ID
    orderCompanyId?: ID
    receiveCompanyId: ID
    superConstructionId: ID
    remarks: string
    projectId: ID
    updateWorkerId: ID
    contractAt: TotalSeconds
    orderDepartmentIds?: ID[]
    receiveDepartmentIds: ID[]
    status: 'created' | 'edited' | 'approved'
}> &
    CommonModel

export const initContract = (contract: Create<ContractModel> | Update<ContractModel>): Update<ContractModel> => {
    const newContract: Update<ContractModel> = {
        contractId: contract.contractId,
        orderCompanyId: contract.orderCompanyId,
        receiveCompanyId: contract.receiveCompanyId,
        superConstructionId: contract.superConstructionId,
        remarks: contract.remarks,
        projectId: contract.projectId,
        updateWorkerId: contract.updateWorkerId,
        contractAt: contract.contractAt,
        orderDepartmentIds: contract.orderDepartmentIds,
        receiveDepartmentIds: contract.receiveDepartmentIds,
        status: contract.status,
    }
    return newContract
}

/**
 * {@link WorkerOptionInputParam - 説明}
 */
export type ContractOptionInputParam = ReplaceAnd<
    GetOptionObjectType<ContractOptionParam>,
    {
        relatedConstructions?: OptionType<{
            types?: GetRelatedConstructionListType
        }>
        relatedContracts?: OptionType<{
            types?: GetRelatedContractListType
        }>
    }
>

/**
 * {@link WorkerOptionParam - 説明}
 */
export type ContractOptionParam = {
    orderCompany?: CompanyType
    receiveCompany?: CompanyType
    subConstructions?: ConstructionListType
    superConstruction?: ConstructionType
    project?: ProjectType
    updateWorker?: WorkerType
    relatedContracts?: RelatedContractListType
    orderDepartments?: DepartmentListType
    receiveDepartments?: DepartmentListType
    contractLog?: ContractLogListType
}

export type GetContractOptionParam = GetOptionParam<ContractType, ContractOptionParam, ContractOptionInputParam>

/**
 * superConstruction - 契約につながる発注工事。上位
 */
export type ContractType = ContractModel & ContractOptionParam

export type ContractCLType = ReplaceAnd<
    ContractType,
    {
        orderCompany?: CompanyCLType
        receiveCompany?: CompanyCLType
        subConstructions?: ConstructionListCLType
        superConstruction?: ConstructionCLType
        project?: ProjectCLType
        updateWorker?: WorkerCLType
        contractAt?: CustomDate
        relatedContracts?: RelatedContractListCLType
    } & CommonCLType
>

export const toContractCLType = (data?: ContractType): ContractCLType => {
    return {
        ...data,
        ...toCommonCLType(data),
        orderCompany: data?.orderCompany ? toCompanyCLType(data?.orderCompany) : undefined,
        receiveCompany: data?.receiveCompany ? toCompanyCLType(data?.receiveCompany) : undefined,
        subConstructions: data?.subConstructions ? toConstructionListCLType(data?.subConstructions) : undefined,
        superConstruction: data?.superConstruction ? toConstructionCLType(data?.superConstruction) : undefined,
        project: data?.project ? toProjectCLType(data?.project) : undefined,
        updateWorker: data?.updateWorker ? toWorkerCLType(data?.updateWorker) : undefined,
        contractAt: data?.contractAt ? toCustomDateFromTotalSeconds(data?.contractAt, true) : undefined,
        relatedContracts: data?.relatedContracts ? toRelatedContractListCLType(data.relatedContracts) : undefined,
    } as ContractCLType
}
