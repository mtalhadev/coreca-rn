import { ConstructionType } from './Construction'
import { ConstructionListCLType, ConstructionListType, toConstructionListCLType } from './ConstructionListType'
import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ConstructionTreeCLType, ConstructionTreeType, toConstructionTreeCLType } from './ConstructionTreeType'

/**
 * 指定した工事の親か子か
 */
export type GetRelatedConstructionListType = ('all' | 'sub-constructions' | 'super-constructions')[]

/**
 * superConstructions - 上を遡って取得した直属の契約。並列関係などは取得しない。
 */
export type RelatedConstructionListType<ListType extends CommonListType<ConstructionType> = ConstructionListType> = CommonListType<ConstructionType> & {
    totalConstructions?: ListType
    subConstructions?: ListType
    superConstructions?: ListType
    constructionTree?: ConstructionTreeType
}

export type RelatedConstructionListCLType<ListCLType extends CommonListType<ConstructionType> = ConstructionListCLType> = ReplaceAnd<
    RelatedConstructionListType,
    {
        totalConstructions?: ListCLType
        subConstructions?: ListCLType
        superConstructions?: ListCLType
        constructionTree?: ConstructionTreeCLType
    }
>

export const toRelatedConstructionListCLType = (data?: RelatedConstructionListType): RelatedConstructionListCLType => {
    return {
        ...data,
        totalConstructions: data?.totalConstructions ? toConstructionListCLType(data.totalConstructions) : undefined,
        subConstructions: data?.subConstructions ? toConstructionListCLType(data.subConstructions) : undefined,
        superConstructions: data?.superConstructions ? toConstructionListCLType(data.superConstructions) : undefined,
        constructionTree: data?.constructionTree ? toConstructionTreeCLType(data.constructionTree) : undefined,
    }
}
