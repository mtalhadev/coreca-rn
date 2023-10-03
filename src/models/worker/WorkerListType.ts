import { CommonListType, ReplaceAnd } from '../_others/Common'
import { WorkerType, WorkerCLType, toWorkerCLType } from './Worker'

export type GetWorkerListType = 'all'[]

export type WorkerListType = CommonListType<WorkerType> & {
    items?: WorkerType[]
}

export type WorkerListCLType = ReplaceAnd<
    WorkerListType,
    {
        items?: WorkerCLType[]
    }
>

export const toWorkerListCLType = (data?: WorkerListType): WorkerListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toWorkerCLType(val)) : undefined,
    }
}

export const toWorkerListType = (items?: WorkerType[], mode?: 'all' | 'none'): WorkerListType => {
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
