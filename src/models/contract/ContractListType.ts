import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ContractCLType, ContractType, toContractCLType } from './Contract'

export type GetContractListType = 'all'[]

export type ContractListType = CommonListType<ContractType> & {
    items?: ContractType[]
}

export type ContractListCLType = ReplaceAnd<
    ContractListType,
    {
        items?: ContractCLType[]
    }
>

export const toContractListCLType = (data?: ContractListType): ContractListCLType => {
    return {
        ...data,
        items: data?.items ? data.items.map((val) => toContractCLType(val)) : undefined,
    }
}

export const toContractListType = (items?: ContractType[], mode?: 'all' | 'none'): ContractListType => {
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
