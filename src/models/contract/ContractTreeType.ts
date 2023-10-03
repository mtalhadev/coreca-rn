const flatten = require('lodash/flatten')
import { ConstructionType } from '../construction/Construction'
import { ReplaceAnd } from '../_others/Common'
import { ContractCLType, ContractType, toContractCLType } from './Contract'

/**
 * 契約関係をツリー構造で把握できるように
 */
export type ContractTreeType = {
    contract?: ContractType
    subContracts?: ContractTreeType[]
}

export type ContractTreeCLType = ReplaceAnd<
    ContractTreeType,
    {
        contract?: ContractCLType
        subContracts?: ContractTreeCLType[]
    }
>

export const toContractTreeCLType = (data?: ContractTreeType): ContractTreeCLType => {
    return {
        ...data,
        contract: data?.contract ? toContractCLType(data.contract) : undefined,
        subContracts: data?.subContracts ? data.subContracts.map((val) => toContractTreeCLType(val)) : undefined,
    }
}

export const toContractTreeType = (contracts?: ContractType[], constructions?: ConstructionType[]): ContractTreeType | undefined => {
    const topContract = contracts?.filter((contract) => contract.superConstructionId == undefined)[0] as ContractType
    if (topContract == undefined) {
        return undefined
    }

    const _getSubContracts = (target?: ContractType): ContractTreeType[] | undefined => {
        if (target == undefined) {
            return undefined
        }
        const subContracts = flatten(
            constructions
                ?.filter((construction) => construction && construction.contractId == target?.contractId)
                .map((construction) => contracts?.filter((contract) => contract.superConstructionId == construction.constructionId)),
        ).filter((data: ContractType) => data != undefined) as ContractType[]
        return subContracts.map((contract) => {
            return {
                contract,
                subContracts: _getSubContracts(contract),
            }
        })
    }
    const contractTree = {
        contract: topContract,
        subContracts: _getSubContracts(topContract),
    } as ContractTreeType

    return contractTree
}
