import { ConstructionType } from '../construction/Construction'
import { CommonListType, filterIndexArray, ReplaceAnd } from '../_others/Common'
import { ContractCLType, ContractType, toContractCLType } from './Contract'
import { ContractListType, ContractListCLType, toContractListCLType, toContractListType } from './ContractListType'
import { ContractTreeCLType, ContractTreeType, toContractTreeCLType, toContractTreeType } from './ContractTreeType'

export type GetProjectContractListType = ('all' | 'top-contracts' | 'bottom-contracts' | 'intermediate-contracts')[]

export type ProjectContractListType<ListType extends CommonListType<ContractType> = ContractListType> = CommonListType<ContractType> & {
    totalContracts?: ListType
    topContract?: number
    intermediateContracts?: number[]
    bottomContracts?: number[]
}

export type ProjectContractListCLType<ListCLType extends CommonListType<ContractType> = ContractListCLType> = ReplaceAnd<
    ProjectContractListType,
    {
        totalContracts?: ListCLType
        topContract?: number
        intermediateContracts?: number[]
        bottomContracts?: number[]
    }
>

export const toProjectContractListCLType = (data?: ProjectContractListType): ProjectContractListCLType => {
    return {
        ...data,
        totalContracts: data?.totalContracts ? toContractListCLType(data.totalContracts) : undefined,
    }
}

export const toProjectContractListType = (constructions?: ConstructionType[], contracts?: ContractType[]): ProjectContractListType | undefined => {
    const topContract = contracts?.map((contract, index) => contract.superConstructionId == undefined ? index : undefined).filter((index) => index != undefined)[0]
    const bottomContracts = contracts
        ?.map((contract, index) => {
            const subConstructionIds = constructions?.filter((construction) => construction.contractId == contract?.contractId).map((construction) => construction.constructionId)
            // subConstructionIdsの下に契約が一つもなければbottomとする。
            return subConstructionIds?.filter((id) => contracts.filter((_contract) => _contract.superConstructionId == id).length == 0).length == 0 ? index : undefined
        })
        .filter((data) => data != undefined) as number[] ?? []
    const topContractData = topContract ? contracts[topContract] : undefined
    const bottomContractsData = filterIndexArray(contracts ?? [], bottomContracts ?? [])
    const intermediateContracts = contracts
        ?.map((contract, index) => topContractData?.contractId != contract?.contractId && !bottomContractsData?.map((bottom) => bottom.contractId).includes(contract?.contractId) ? index : undefined)
        .filter((data) => data != undefined) as number[] ?? []
    return {
        totalContracts: toContractListType(contracts),
        topContract: topContract,
        bottomContracts: bottomContracts,
        intermediateContracts: intermediateContracts,
    }
}
