import { maxBy } from 'lodash'
import { CommonListType } from '../_others/Common'
import { ContractLogType } from './ContractLog'

export type GetContractLogListType = 'all'[]

export type ContractLogListType = CommonListType<ContractLogType> & {
    latestContractLog?: number
    totalContractLogs?: {
        items?: ContractLogType[]
    }
}

export const toContractLogListType = (items?: ContractLogType[], mode?: 'all' | 'none'): ContractLogListType => {
    mode = mode ?? 'all'
    const latest = maxBy(items, 'updatedAt')
    if (mode == 'none') {
        return {
            latestContractLog: items?.map((data, index) => (data.contractLogId == latest?.contractLogId ? index : undefined))[0],
            totalContractLogs: { items },
        }
    }
    return {
        latestContractLog: items?.map((data, index) => (data.contractLogId == latest?.contractLogId ? index : undefined))[0],
        totalContractLogs: { items },
    }
}
