import { CommonListType, ReplaceAnd } from '../_others/Common'
import { toWorkerCLType, WorkerCLType, WorkerType } from './Worker'

export type ArrangementWorkerType = WorkerType & {
    invRequestId?: string;
}

export type ArrangementWorkerCLType = WorkerCLType & {
    invRequestId?: string;
}
export const toArrangementWorkerCLType = (data?: ArrangementWorkerType): ArrangementWorkerCLType => {
    if (data == undefined) {
        return {};
    }
    return {
        ...toWorkerCLType(data),
    } as ArrangementWorkerCLType;
}

export type ArrangementWorkerListType = CommonListType<ArrangementWorkerType> & {
    items?: ArrangementWorkerType[]
}

export type ArrangementWorkerListCLType = ReplaceAnd<
    ArrangementWorkerListType,
    {
        items?: ArrangementWorkerCLType[]
    }
>

export const toArrangementWorkerListCLType = (data?: ArrangementWorkerListType): ArrangementWorkerListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toArrangementWorkerCLType(val)) : undefined,
    }
}