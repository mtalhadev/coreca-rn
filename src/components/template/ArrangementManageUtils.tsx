import { uniq, uniqBy } from 'lodash'
import { ArrangementType } from '../../models/arrangement/Arrangement'
import { SiteArrangementCompanyType, SiteArrangementDataType, SiteArrangementWorkerType } from '../../models/arrangement/SiteArrangementDataType'
import { InvRequestType } from '../../models/invRequest/InvRequestType'
import { InvRequestWorkerModel } from '../../models/invRequest/InvRequestWorker'
import { RequestMeterType } from '../../models/request/RequestMeterType'
import { SiteType } from '../../models/site/Site'
import { SiteMeterType } from '../../models/site/SiteMeterType'
import { getUuidv4 } from '../../utils/Utils'
import { ReservationType } from '../../models/reservation/Reservation'
import { WorkerType } from '../../models/worker/Worker'
import { RequestType } from '../../models/request/Request'

export type RequestTaskStockType = {
    company: SiteArrangementCompanyType
    delta: number
}

/**
 * @param newArrangementId - 新規で手配する際にローカルと情報を合わせるために。
 * @param delta - 追加は1。削除は-1。何もしないは0。それ以外の値は-1, 0, 1にして処理する。
 */
export type ArrangementTaskStockType = {
    worker: SiteArrangementWorkerType
    delta: number
    newArrangementId?: string
}

export const _addLocalInsideWorker = (
    localWorker: SiteArrangementWorkerType,
    workerId: string,
    site: SiteType,
    myCompanyId: string,
    targetMeter?: SiteMeterType | RequestMeterType,
    keepTargetArrangementData?: ArrangementType,
    respondRequestId?: string
): SiteArrangementWorkerType => {
    const localArrangement = keepTargetArrangementData
        ? keepTargetArrangementData
        : ({
              arrangementId: getUuidv4(),
              workerId,
              siteId: site.siteId,
              createCompanyId: myCompanyId,//draftDateDataで使用するため
              respondRequestId,//他社現場での手配数を維持するため
          } as ArrangementType)
    localWorker.targetArrangement = { ...localArrangement }
    localWorker.dailyArrangements = {
        ...localWorker.dailyArrangements,
        items: uniqBy([...(localWorker.dailyArrangements?.items ?? []), { ...localArrangement }], 'arrangementId'),
    }
    if (targetMeter) {
        targetMeter.companyPresentNum = Math.max(0, (targetMeter?.companyPresentNum ?? 0) + 1)
    }
    return localWorker
}

export const _addInvRequestLocalInsideWorker = (
    localWorker: SiteArrangementWorkerType,
    workerId: string,
    invRequestId: string,
    targetMeter: SiteMeterType,
    invRequest: InvRequestType | InvRequestType,
): SiteArrangementWorkerType => {
    const localInvRequest: InvRequestType = {
        invRequestId,
        workerIds: [workerId],
    }
    localWorker.targetInvRequest = { ...localInvRequest }
    localWorker.dailyInvRequests = {
        ...localWorker.dailyInvRequests,
        items: [...(localWorker.dailyInvRequests?.items ?? []), { ...localInvRequest }],
    }
    targetMeter.companyPresentNum = Math.max(0, (targetMeter?.companyPresentNum ?? 0) + 1)
    if (invRequest.targetCompany?.isFake != true) {
        invRequest.isApplication = false
        invRequest.isApproval = 'waiting'
        invRequest.invRequestStatus = 'unapplied'
    }
    invRequest.workerIds = [...(invRequest.workerIds ?? []), workerId]
    if (invRequest.workers?.items) {
        invRequest.workers.items = [...(invRequest.workers.items ?? []), localWorker.worker].filter((data) => data != undefined) as WorkerType[]
    }
    if (localWorker.worker?.invRequestId) {
        invRequest.relatedInvRequestIds = uniq([...(invRequest.relatedInvRequestIds ?? []), localWorker.worker?.invRequestId])
        const _invRequestWorker: InvRequestWorkerModel = {
            invRequestWorkerId: getUuidv4(),
            workerId,
            invRequestId: localWorker.worker?.invRequestId,
        }
        invRequest.invRequestWorkers = [...(invRequest?.invRequestWorkers ?? []), _invRequestWorker]
    } else {
        const _invRequestWorker: InvRequestWorkerModel = {
            invRequestWorkerId: getUuidv4(),
            workerId,
        }
        invRequest.invRequestWorkers = [...(invRequest?.invRequestWorkers ?? []), _invRequestWorker]
    }

    return localWorker
}

export const _addInvReservationLocalInsideWorker = (localWorker: SiteArrangementWorkerType, workerId: string, invReservationId: string, targetMeter: SiteMeterType): SiteArrangementWorkerType => {
    /**
     * TODO:
     * このlocalInvRequestは、あるかないかの判定でしか使われていないため、invReservationIdをinvRequestIdに代入する。template化を見越して、一旦こうしておく。
     * template化しないならば分けた方がいい
     */
    const localInvRequest: InvRequestType = {
        invRequestId: invReservationId,
        workerIds: [workerId],
    }
    localWorker.targetInvRequest = { ...localInvRequest }
    targetMeter.companyPresentNum = Math.max(0, (targetMeter?.companyPresentNum ?? 0) + 1)
    return localWorker
}

export const _deleteLocalInsideWorkerForTargetSite = (
    localWorker: SiteArrangementWorkerType,
    workerId: string,
    targetSiteId: string,
    targetMeter?: SiteMeterType | RequestMeterType,
): SiteArrangementWorkerType => {
    localWorker.targetArrangement = undefined
    localWorker.dailyArrangements = {
        items: [...(localWorker.dailyArrangements?.items?.filter((arr) => arr.workerId == workerId && arr.siteId != targetSiteId) ?? [])],
    }
    if (targetMeter) {
        targetMeter.companyPresentNum = Math.max(0, (targetMeter?.companyPresentNum ?? 0) - 1)
    }
    localWorker.worker = {
        ...localWorker.worker,
        workerTags: localWorker.worker?.workerTags?.filter((tag) => tag != 'is-site-manager'),
    }
    return localWorker
}

export const _deleteInvRequestLocalInsideWorker = (localWorker: SiteArrangementWorkerType, invRequestId: string, targetMeter: SiteMeterType, invRequest: InvRequestType): SiteArrangementWorkerType => {
    /**
     * localWorker変更前にinvRequestを変更
     */
    invRequest.invRequestWorkers = invRequest.invRequestWorkers?.filter((worker) => worker.workerId != localWorker.worker?.workerId)
    invRequest.relatedInvRequestIds = uniq(invRequest.invRequestWorkers?.map((worker) => worker?.invRequestId).filter((data) => data != undefined)) as string[]
    localWorker.targetInvRequest = undefined
    localWorker.dailyInvRequests = {
        ...localWorker.dailyInvRequests,
        items: [...(localWorker.dailyInvRequests?.items?.filter((inv) => inv.invRequestId != invRequestId) ?? [])],
    }
    targetMeter.companyPresentNum = Math.max(0, (targetMeter?.companyPresentNum ?? 0) - 1)
    if (invRequest.targetCompany?.isFake != true) {
        invRequest.isApplication = false
        invRequest.isApproval = 'waiting'
        invRequest.invRequestStatus = 'unapplied'
    }
    invRequest.workerIds = invRequest.workerIds?.filter((id) => id != localWorker.worker?.workerId)
    if (invRequest?.workers) {
        invRequest.workers.items = invRequest.workers.items?.filter((worker) => worker.workerId != localWorker.worker?.workerId)
    }
    return localWorker
}

export const _deleteInvReservationLocalInsideWorker = (localWorker: SiteArrangementWorkerType, targetMeter: SiteMeterType): SiteArrangementWorkerType => {
    //ローカルにて、targetInvRequestがあるかないかの判定でしか使っていないため
    //targetInvReservationの代わりに、targetInvRequestを使用している。targetInvReservationの方が良いか。それとも何か違う方法が良いか。addも同様
    //できれば、siteArrangementManageをテンプレート化して綺麗にしたい。
    //InvReservationではローカルでしか使っていないがinvRequestではサーバー側も関係していたので、やめておく。分割時にもう一度検討。
    localWorker.targetInvRequest = undefined
    targetMeter.companyPresentNum = Math.max(0, (targetMeter?.companyPresentNum ?? 0) - 1)
    return localWorker
}
/**
 *
 * @param localCompany
 * @param targetMeter
 * @param preRequest 確定済みの元々の依頼
 * @returns
 */
export const _addLocalOutsideWorker = (localCompany: SiteArrangementCompanyType, targetMeter: SiteMeterType | RequestMeterType, addCount?: number,preRequest?: RequestType): SiteArrangementCompanyType => {
    localCompany.targetRequest = {
        ...localCompany.targetRequest,
        requestCount: (localCompany.targetRequest?.requestCount ?? 0) + (addCount ?? 1),
    }
    // localCompany.dailyRequests = {
    //     ...localCompany.dailyRequests,
    //     items: uniqBy([...(localCompany.dailyRequests?.items ?? []), { ...localCompany.targetRequest }], (req) => req?.requestId),
    // }
    /**
     * 仮会社の場合は応答手配を自動で
     */
    if (localCompany.requestedCompany?.isFake) {
        localCompany.targetRequest = {
            ...localCompany.targetRequest,
            subRespondCount: (localCompany.targetRequest.subRespondCount ?? 0) + (addCount ?? 1),
        }
    } else if (preRequest?.requestCount != localCompany.targetRequest.requestCount) {
        localCompany.targetRequest = {
            ...localCompany.targetRequest,
            isApplication: false,
            isApproval: 'waiting',
        }
    } else {
        localCompany.targetRequest = {
            ...localCompany.targetRequest,
            isApplication: preRequest?.isApplication,
            isApproval: preRequest?.isApproval,
        }
    }
    targetMeter.companyPresentNum = Math.max(0, (targetMeter?.companyPresentNum ?? 0) + (addCount ?? 1))
    return localCompany
}

export const _deleteLocalOutsideWorker = (
    localCompany: SiteArrangementCompanyType,
    targetMeter: SiteMeterType | RequestMeterType,
    deleteRequestCount?: number,
    preRequest?: RequestType,
): SiteArrangementCompanyType => {
    /**
     * 依頼数が0になっても、ローカルで削除してしまうと再度依頼した際にIDが変わってしまうので、依頼を削除するのはサーバー側
     */
    localCompany.targetRequest = {
        ...localCompany.targetRequest,
        requestCount: Math.max(0, (localCompany.targetRequest?.requestCount ?? 0) - (deleteRequestCount ?? 1)),
    }
    // localCompany.dailyRequests = {
    //     ...localCompany.dailyRequests,
    //     items: uniqBy([...(localCompany.dailyRequests?.items ?? []), { ...localCompany.targetRequest }], (req) => req?.requestId),
    // }

    if (localCompany.requestedCompany?.isFake) {
        localCompany.targetRequest = {
            ...localCompany.targetRequest,
            subRespondCount: Math.max(0, (localCompany.targetRequest.subRespondCount ?? 0) - 1),
        }
    } else if (preRequest?.requestCount !== localCompany.targetRequest.requestCount) {
        localCompany.targetRequest = {
            ...localCompany.targetRequest,
            isApplication: false,
            isApproval: 'waiting',
        }
    } else {
        localCompany.targetRequest = {
            ...localCompany.targetRequest,
            isApplication: preRequest?.isApplication,
            isApproval: preRequest?.isApproval,
        }
    }
    targetMeter.companyPresentNum = Math.max(0, (targetMeter?.companyPresentNum ?? 0) - (deleteRequestCount ?? 1))
    return localCompany
}

export const _deleteLocalReservation = (siteArrangementData?: SiteArrangementDataType, reservationId?: string) => {
    if (siteArrangementData && reservationId) {
        siteArrangementData.otherSide = siteArrangementData.otherSide?.filter((side) => side.targetReservation?.reservationId != reservationId)
    }
}

export const _addLocalReservations = (siteArrangementData?: SiteArrangementDataType, reservations?: ReservationType[]) => {
    if (siteArrangementData && reservations) {
        const addOtherSides: SiteArrangementCompanyType[] = reservations.map((reservation) => {
            return {
                requestedCompany: reservation.targetCompany,
                targetRequest: { isApplication: undefined, reservationId: reservation.reservationId },
                targetReservation: reservation,
            }
        })
        siteArrangementData.otherSide = [...(siteArrangementData.otherSide ?? []), ...addOtherSides]
    }
}

export const _addLocalMyCompanyWorker = (siteArrangementData?: SiteArrangementDataType, worker?: WorkerType) => {
    if (siteArrangementData && worker) {
        const addSelfSide: SiteArrangementWorkerType = {
            worker,
            targetArrangement: undefined,
            targetInvRequest: undefined,
            dailyArrangements: { items: [] },
            dailyInvRequests: { items: [] },
        }
        siteArrangementData.selfSide = [...(siteArrangementData.selfSide ?? []), addSelfSide]
    }
}

export const workerSortMethod = (a: SiteArrangementWorkerType, b: SiteArrangementWorkerType, reverse = false): number => {
    let aCount = 0
    let bCount = 0
    // この現場に手配していたら後退。
    aCount += a?.targetArrangement ? -Infinity : 0
    bCount += b?.targetArrangement ? -Infinity : 0
    // 今日現場に手配していたら後退。手配数に応じて後退。ただしこの現場への手配よりは前に表示。
    aCount += -(a?.dailyArrangements?.items?.length ?? 0)
    bCount += -(b?.dailyArrangements?.items?.length ?? 0)
    // 今日常用で送っていたら後退。手配数に応じて後退。ただしこの現場への手配よりは前に表示。
    aCount += -(a?.dailyInvRequests?.items?.length ?? 0)
    bCount += -(b?.dailyInvRequests?.items?.length ?? 0)
    // 管理者なら後退。
    aCount -= a?.worker?.workerTags?.includes('manager') ? 100 : 1
    bCount -= b?.worker?.workerTags?.includes('manager') ? 100 : 1
    // 休みなら後退。まず捲られない数。
    aCount -= a?.worker?.workerTags?.includes('is-holiday') ? 1000 : 1
    bCount -= b?.worker?.workerTags?.includes('is-holiday') ? 1000 : 1
    // 現場責任者なら前に表示。
    aCount += a?.worker?.workerTags?.includes('is-site-manager') ? 10000 : 1
    bCount += b?.worker?.workerTags?.includes('is-site-manager') ? 10000 : 1
    if (reverse) {
        return aCount - bCount
    }
    return -aCount + bCount
}

export const addRequestTaskToStock = (company: SiteArrangementCompanyType, continuityRequestPropsStocks: RequestTaskStockType[]): RequestTaskStockType[] => {
    if (company.requestedCompany?.companyId == undefined) {
        return continuityRequestPropsStocks
    }
    /**
     * まだ存在しない場合
     */
    if ((continuityRequestPropsStocks.filter((stock) => stock.company.requestedCompany?.companyId == company.requestedCompany?.companyId) ?? [])[0] == undefined) {
        return [
            ...(continuityRequestPropsStocks ?? []),
            {
                company,
                delta: 1,
            },
        ]
    }
    return continuityRequestPropsStocks.map((stock) => {
        if (stock.company.requestedCompany?.companyId == company.requestedCompany?.companyId) {
            return { ...stock, delta: stock.delta + 1 }
        } else {
            return stock
        }
    })
}

export const deleteRequestTaskFromStock = (company: SiteArrangementCompanyType, continuityRequestPropsStocks: RequestTaskStockType[]): RequestTaskStockType[] => {
    if (company.requestedCompany?.companyId == undefined) {
        return continuityRequestPropsStocks
    }
    /**
     * まだ存在しない場合
     */
    if ((continuityRequestPropsStocks.filter((stock) => stock.company.requestedCompany?.companyId == company.requestedCompany?.companyId) ?? [])[0] == undefined) {
        return [
            ...(continuityRequestPropsStocks ?? []),
            {
                company,
                delta: -1,
            },
        ]
    }
    return continuityRequestPropsStocks.map((stock) => {
        if (stock.company.requestedCompany?.companyId == company.requestedCompany?.companyId) {
            return { ...stock, delta: stock.delta - 1 }
        } else {
            return stock
        }
    })
}

export const addArrangementTaskToStock = (worker: SiteArrangementWorkerType, continuityRequestPropsStocks: ArrangementTaskStockType[], newArrangementId?: string): ArrangementTaskStockType[] => {
    if (worker.worker?.workerId == undefined) {
        return continuityRequestPropsStocks
    }
    /**
     * まだ存在しない場合
     */
    if ((continuityRequestPropsStocks.filter((stock) => stock.worker.worker?.workerId == worker.worker?.workerId) ?? [])[0] == undefined) {
        return [
            ...(continuityRequestPropsStocks ?? []),
            {
                worker,
                delta: 1,
                newArrangementId,
            },
        ]
    }
    return continuityRequestPropsStocks.map((stock) => {
        if (stock.worker.worker?.workerId == worker.worker?.workerId) {
            return { ...stock, delta: Math.min(1, stock.delta + 1), newArrangementId }
        } else {
            return stock
        }
    })
}

export const deleteArrangementTaskFromStock = (worker: SiteArrangementWorkerType, continuityRequestPropsStocks: ArrangementTaskStockType[]): ArrangementTaskStockType[] => {
    if (worker.worker?.workerId == undefined) {
        return continuityRequestPropsStocks
    }
    /**
     * まだ存在しない場合
     */
    if ((continuityRequestPropsStocks.filter((stock) => stock.worker.worker?.workerId == worker.worker?.workerId) ?? [])[0] == undefined) {
        return [
            ...(continuityRequestPropsStocks ?? []),
            {
                worker,
                delta: -1,
                newArrangementId: undefined,
            },
        ]
    }
    return continuityRequestPropsStocks.map((stock) => {
        if (stock.worker.worker?.workerId == worker.worker?.workerId) {
            return { ...stock, delta: Math.max(-1, stock.delta - 1), newArrangementId: undefined }
        } else {
            return stock
        }
    })
}
