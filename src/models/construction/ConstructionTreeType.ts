const flatten = require('lodash/flatten')
import { ContractType } from '../contract/Contract'
import { ConstructionCLType, ConstructionType, toConstructionCLType } from './Construction'

/**
 * 契約関係をツリー構造で把握できるように
 */
export type ConstructionTreeType = {
    construction?: ConstructionType
    subConstructions?: ConstructionTreeType[]
}

export type ConstructionTreeCLType = {
    construction?: ConstructionCLType
    subConstructions?: ConstructionTreeCLType[]
}

export const toConstructionTreeCLType = (data?: ConstructionTreeType): ConstructionTreeCLType => {
    return {
        ...data,
        construction: data?.construction ? toConstructionCLType(data.construction) : undefined,
        subConstructions: data?.subConstructions ? data.subConstructions.map((val) => toConstructionTreeCLType(val)) : undefined,
    }
}

export const toConstructionTreeType = (contracts?: ContractType[], constructions?: ConstructionType[]): ConstructionTreeType | undefined => {
    const topContract = contracts?.filter((contract) => contract.superConstructionId == undefined)[0] as ContractType
    if (topContract == undefined) {
        return undefined
    }
    const topConstruction = constructions?.filter((construction) => construction.contractId == topContract?.contractId)[0]
    if (topConstruction == undefined) {
        return undefined
    }

    const _getSubConstructionOfContractTree = (target?: ConstructionType): ConstructionTreeType[] | undefined => {
        if (target == undefined) {
            return undefined
        }
        const subConstructions = flatten(
            contracts
                ?.filter((contract) => contract.superConstructionId == target.constructionId)
                .map((contract) => constructions?.filter((construction) => construction?.contractId == contract?.contractId)),
        ).filter((data: ConstructionType) => data != undefined) as ConstructionType[]
        return subConstructions.map((construction) => {
            return {
                construction,
                subConstructions: _getSubConstructionOfContractTree(construction),
            }
        })
    }

    const constructionTree = {
        construction: topConstruction,
        subConstructions: _getSubConstructionOfContractTree(topConstruction),
    }
    return constructionTree
}
