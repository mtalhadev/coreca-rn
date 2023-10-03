import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ContractType } from './Contract'
import { ContractListCLType, ContractListType, toContractListCLType } from './ContractListType'
import { ContractTreeCLType, ContractTreeType, toContractTreeCLType } from './ContractTreeType'

/**
 * 指定契約以上の契約か以下の契約一覧を指定。
 */
export type GetRelatedContractListType = ('all' | 'sub-contracts' | 'super-contracts')[]

/**
 * superContracts - 上を遡って取得した直属の契約。並列関係などは取得しない。指定した契約に近い順でソート。
 * subContracts - 下の契約全て。指定した契約に近い順でソート。
 */
export type RelatedContractListType<ListType extends CommonListType<ContractType> = ContractListType> = CommonListType<ContractType> & {
    totalContracts?: ListType
    superContracts?: ListType
    subContracts?: ListType
    contractTree?: ContractTreeType
}

export type RelatedContractListCLType<ListCLType extends CommonListType<ContractType> = ContractListCLType> = ReplaceAnd<
    RelatedContractListType,
    {
        totalContracts?: ListCLType
        superContracts?: ListCLType
        subContracts?: ListCLType
        contractTree?: ContractTreeCLType
    }
>

export const toRelatedContractListCLType = (data?: RelatedContractListType): RelatedContractListCLType => {
    return {
        ...data,
        totalContracts: data?.totalContracts ? toContractListCLType(data.totalContracts) : undefined,
        superContracts: data?.superContracts ? toContractListCLType(data.superContracts) : undefined,
        subContracts: data?.subContracts ? toContractListCLType(data.subContracts) : undefined,
        contractTree: data?.contractTree ? toContractTreeCLType(data.contractTree) : undefined,
    }
}
