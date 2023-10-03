import { _createWorker, _deleteWorker, _getAllWorker } from '../../services/worker/WorkerService'
import { MAX_DAMMY_WORKER_SPAN } from '../../utils/Constants'
import { compareWithAnotherDate, CustomDate, getDailyEndTime, getDailyStartTime, nextDay } from '../../models/_others/CustomDate'
import { getUuidv4 } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _createReservation, _deleteReservation, _getReservationListByIds, _getReservationOfTargetConstructionAndCompanies, _updateReservation } from '../../services/reservation/ReservationService'
import cloneDeep from 'lodash/cloneDeep'
import range from 'lodash/range'
import { ID } from '../../models/_others/ID'
import { _getRequestListByReservationId } from '../../services/request/RequestService'
import { GetReservationOptionParam, ReservationType } from '../../models/reservation/Reservation'

export type AddRequestWorkersParam = {
    myCompanyId?: string
    requestedCompanyId?: string
    requestNum?: number
    startDate?: CustomDate
    endDate?: CustomDate

    // 作業員ID指定用
    workerIds?: string[]
}

export type AddRequestWorkersResponse = boolean

export const getRequestWorkerName = (id: string) => {
    return `常用作業員 - ${id}`
}

export const getRespondWorkerName = (id: string) => {
    return `応答作業員 - ${id}`
}

export type AddReservationsParam = {
    myCompanyId?: string
    requestedCompanyId?: string
    constructionIds?: ID[]
    /**
     * 外部指定用
     */
    newReservationId?: string
}

export type AddReservationsResponse = ID[]

export const addReservations = async (params: AddReservationsParam): Promise<CustomResponse<AddReservationsResponse>> => {
    try {
        const { myCompanyId, requestedCompanyId, newReservationId, constructionIds } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        if (requestedCompanyId == undefined) {
            throw {
                error: '常用する会社を選択してください。',
            } as CustomResponse
        }

        if (constructionIds == undefined) {
            throw {
                error: '工事情報が足りません。',
                errorCode: 'ADD_RESERVATION_ERROR'
            } as CustomResponse
        }
        const existsResult = await Promise.all(
            constructionIds.map(id => 
                _getReservationOfTargetConstructionAndCompanies({
                    targetCompanyId: requestedCompanyId,
                    myCompanyId: myCompanyId,
                    constructionId: id,
                })
            )
        )
        const existConstructionIds:string[] = []
        existsResult.forEach(result =>{
            if (result.success?.constructionId) {
                existConstructionIds.push(result.success.constructionId)
            }
        })
        const createConstructionIds = constructionIds.filter(id => !existConstructionIds?.includes(id))
        
        const results = await Promise.all(
            createConstructionIds?.map(id => 
                _createReservation({
                    reservationId: newReservationId ?? getUuidv4(),
                    targetCompanyId: requestedCompanyId,
                    myCompanyId: myCompanyId,
                    constructionId: id
                })
            ) 
        )
        results.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                } as CustomResponse
            }
        })
        return Promise.resolve({
            success: results.map(result => result.success).filter(data => data != undefined) as ID[],
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type UpdateReservationParam = {
    myCompanyId?: string
    requestedCompanyId?: string
    date?: CustomDate
    deleteNum?: number
}

export type UpdateReservationResponse = boolean

export const updateReservation = async (params: UpdateReservationParam): Promise<CustomResponse<UpdateReservationResponse>> => {
    try {
        const { myCompanyId, requestedCompanyId, deleteNum, date } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        if (requestedCompanyId == undefined) {
            throw {
                error: '常用する会社を選択してください。',
            } as CustomResponse
        }

        if (deleteNum == undefined || date == undefined) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type DeleteReservationParam = {
    reservationId?: ID
}
export const deleteReservation = async (params: DeleteReservationParam): Promise<CustomResponse> => {
    try {
        const { reservationId } = params
        if (reservationId == undefined) {
            throw {
                error: '常用予約IDがありません',
                errorCode: 'DELETE_RESERVATION_ERROR',
            }
        }
        const reservationResult = await _getRequestListByReservationId({
            reservationId
        })
        if (reservationResult.error) {
            throw {
                error: reservationResult.error,
                errorCode: reservationResult.errorCode,
            }
        }
        if ((reservationResult.success?.items?.length ?? 0) > 0) {
            throw {
                error: '既にこの工事で常用依頼がされています',
                errorCode: 'DELETE_RESERVATION_ERROR',
            }
        }

        const result = await _deleteReservation(reservationId)
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetReservationListByIdsParam = {
    reservationIds?: ID[]
    options?: GetReservationOptionParam
}
export const getReservationListByIds = async (params:GetReservationListByIdsParam ):Promise<CustomResponse<ReservationType[] | undefined>> => {
    try {
        const { reservationIds, options } = params
        if (reservationIds == undefined) {
            throw {
                error: '常用予約IDがありません',
                errorCode: 'GET_RESERVATIONS_ERROR'
            }
        }
        const result = await _getReservationListByIds({reservationIds, options})
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: result.success?.items
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
