import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ArrangementCLType, ArrangementType, toArrangementCLType } from './Arrangement'

export type ArrangementListType = CommonListType<ArrangementType> & {
    items?: ArrangementType[]
}

export type ArrangementListCLType = ReplaceAnd<
    ArrangementListType,
    {
        items?: ArrangementCLType[]
    }
>

export const toArrangementListCLType = (data?: ArrangementListType): ArrangementListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items.map((val) => toArrangementCLType(val)) : undefined,
    }
}

/**
 *
 * @param items
 * @returns
 */
export const toArrangementListType = (items?: ArrangementType[], mode?: 'all' | 'none'): ArrangementListType => {
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
