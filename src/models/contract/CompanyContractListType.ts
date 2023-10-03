import { isNoValueObject } from '../../utils/Utils'
import { CommonListType, ReplaceAnd } from '../_others/Common'
import { ID } from '../_others/ID'
import { ContractType } from './Contract'
import { ContractListCLType, ContractListType, toContractListCLType, toContractListType } from './ContractListType'

export type GetCompanyContractListType = ('all' | 'receive' | 'order')[]

export type CompanyContractListType<ListType extends CommonListType<ContractType> = ContractListType> = CommonListType<ContractType> & {
    totalContracts?: ListType
    orderContracts?: number[]
    receiveContracts?: number[]
}

export type CompanyContractListCLType<ListCLType extends CommonListType<ContractType> = ContractListCLType> = ReplaceAnd<
    CompanyContractListType,
    {
        totalContracts?: ListCLType
        orderContracts?: number[]
        receiveContracts?: number[]
    }
>

export const toCompanyContractListCLType = (data?: CompanyContractListType): CompanyContractListCLType => {
    return {
        ...data,
        totalContracts: data?.totalContracts ? toContractListCLType(data.totalContracts) : undefined,
    }
}

export const toCompanyContractListType = (contracts?: ContractType[], companyId?: ID, mode?: 'all' | 'none'): CompanyContractListType => {
    mode = mode ?? 'all'
    if (mode == 'none') {
        return {
            totalContracts: toContractListType(contracts),
        }
    }
    return {
        totalContracts: toContractListType(contracts),
        orderContracts: filterOrderContracts(contracts, companyId),
        receiveContracts: filterReceiveContracts(contracts, companyId),
    }
}

export const filterOrderContracts = (contracts?: ContractType[], companyId?: ID): number[] => {
    return contracts?.map((contract, index) => isOrderContract(contract, companyId) ? index : undefined).filter((data) => data != undefined) as number[]
}
export const isOrderContract = (contract?: ContractType, companyId?: ID): boolean => {
    return contract?.orderCompanyId == companyId
}

export const filterReceiveContracts = (contracts?: ContractType[], companyId?: ID): number[] => {
    return contracts?.map((contract, index) => isReceiveContract(contract, companyId) ? index : undefined).filter((data) => data != undefined) as number[]
}
export const isReceiveContract = (contract?: ContractType, companyId?: ID): boolean => {
    return contract?.receiveCompanyId == companyId
}
