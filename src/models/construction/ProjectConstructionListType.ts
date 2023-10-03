import { ContractType } from '../contract/Contract'
import { CommonListType, filterIndexArray, ReplaceAnd } from '../_others/Common'
import { ConstructionCLType, ConstructionType, toConstructionCLType } from './Construction'
import { ConstructionListType, ConstructionListCLType, toConstructionListCLType, toConstructionListType } from './ConstructionListType'
import { ConstructionTreeType, ConstructionTreeCLType, toConstructionTreeCLType, toConstructionTreeType } from './ConstructionTreeType'

export type GetProjectConstructionListType = ('all' | 'top-constructions' | 'bottom-constructions' | 'intermediate-constructions')[]

export type ProjectConstructionListType<ListType extends CommonListType<ConstructionType> = ConstructionListType> = CommonListType<ConstructionType> & {
    totalConstructions?: ListType
    topConstruction?: number
    intermediateConstructions?: number[]
    bottomConstructions?: number[]
}

export type ProjectConstructionListCLType<ListCLType extends CommonListType<ConstructionType> = ConstructionListCLType> = ReplaceAnd<
    ProjectConstructionListType,
    {
        totalConstructions?: ListCLType
        topConstruction?: number
        intermediateConstructions?: number[]
        bottomConstructions?: number[]
    }
>

export const toProjectConstructionListCLType = (data?: ProjectConstructionListType): ProjectConstructionListCLType => {
    return {
        ...data,
        totalConstructions: data?.totalConstructions ? toConstructionListCLType(data.totalConstructions) : undefined,
    }
}

export const toProjectConstructionListType = (constructions?: ConstructionType[], contracts?: ContractType[]): ProjectConstructionListType | undefined => {
    const topContract = contracts?.filter((contract) => contract.superConstructionId == undefined)[0] as ContractType
    if (topContract == undefined) {
        return undefined
    }
    const topConstruction = constructions?.map((construction, index) => construction.contractId == topContract?.contractId ? index : undefined).filter((index) => index != undefined)[0]
    const bottomConstructions = constructions
        ?.map((construction, index) => contracts?.filter((contract) => contract.superConstructionId == construction.constructionId).length == 0 ? index : undefined)
        .filter((data) => data != undefined) as number[] ?? []
    const topConstructionData = topConstruction ? constructions[topConstruction] : undefined
    const bottomConstructionsData = filterIndexArray(constructions ?? [], bottomConstructions ?? [])
    const intermediateConstructions = constructions
        ?.map((construction, index) => topConstructionData?.constructionId != construction.constructionId && !bottomConstructionsData?.map((bottom) => bottom.constructionId).includes(construction.constructionId) ? index : undefined)
        .filter((data) => data != undefined) as number[] ?? []
    return {
        totalConstructions: toConstructionListType(constructions),
        topConstruction: topConstruction,
        bottomConstructions: bottomConstructions,
        intermediateConstructions: intermediateConstructions,
    }
}
