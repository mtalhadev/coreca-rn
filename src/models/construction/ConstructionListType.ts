import { ConstructionCLType, ConstructionType, toConstructionCLType } from './Construction'
import { CommonListType, ReplaceAnd } from '../_others/Common'

export type GetConstructionListType = 'all'[]

/**
 * superConstructions - 上を遡って取得した直属の契約。並列関係などは取得しない。
 */
export type ConstructionListType = CommonListType<ConstructionType> & {
    items?: ConstructionType[]
}

export type ConstructionListCLType = ReplaceAnd<
    ConstructionListType,
    {
        items?: ConstructionCLType[]
    }
>

export const toConstructionListCLType = (data?: ConstructionListType): ConstructionListCLType => {
    return {
        ...data,
        items: data?.items ? data.items.map((val) => toConstructionCLType(val)) : undefined,
    }
}

export const toConstructionListType = (items?: ConstructionType[], mode?: 'all' | 'none'): ConstructionListType => {
    mode = mode ?? 'all'
    if (mode == 'none') {
        return {
            items,
        }
    }
    return {
        items,
    }
}
