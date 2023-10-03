import { isEmpty, uniqBy } from 'lodash'
import { ArrangementWorkerType } from '../../models/worker/ArrangementWorkerListType'
import { toWorkerCLType, WorkerCLType, WorkerType } from '../../models/worker/Worker'
import { toWorkerListCLType, toWorkerListType } from '../../models/worker/WorkerListType'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { _getSiteListOfTargetConstruction } from '../../services/site/SiteService'
import { _getWorkerListOfTargetCompany } from '../../services/worker/WorkerService'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { getArrangementDataOfTargetSite, GetArrangementDataOfTargetSiteResponse } from '../arrangement/SiteArrangementCase'

export type GetDistinctArrangedUsersParam = {
    constructionId?: string
    myCompanyId?: string
    myWorkerId?: string
}

export type GetDistinctArrangedUsersResponse =
    | {
          workers?: WorkerType[]
      }
    | undefined

export const getDistinctArrangedUsers = async (params: GetDistinctArrangedUsersParam): Promise<CustomResponse<GetDistinctArrangedUsersResponse>> => {
    try {
        const { constructionId, myCompanyId, myWorkerId } = params
        if (isEmpty(constructionId) || constructionId == undefined) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }
        if (myWorkerId == undefined) {
            throw {
                error: 'ログインユーザー情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        const resultSites = await _getSiteListOfTargetConstruction({ constructionId })
        if (resultSites.error) {
            throw {
                error: resultSites.error,
            }
        }

        const siteIds = resultSites.success?.items?.map((site) => site.siteId ?? 'no-id') ?? []

        const results = await Promise.all(
            siteIds?.map((siteId) =>
                getArrangementDataOfTargetSite({
                    siteId,
                    myCompanyId,
                    myWorkerId,
                    respondRequestId: undefined,
                }),
            ) ?? [],
        )
        results.forEach((result) => {
            if (result.error) {
                throw { error: result.error }
            }
        })

        let workers: ArrangementWorkerType[] = []
        let funcArray: any[] = []

        results.forEach((result) => {
            result.success?.siteArrangementData?.selfSide?.forEach((side) => {
                if (side.targetArrangement != undefined && side.worker != undefined) {
                    workers.push(side.worker)
                }
            })

            result.success?.siteArrangementData?.otherSide?.forEach((side) => {
                const reqCount = side.targetRequest?.requestCount ?? 0
                const subRespondCount = side.targetRequest?.subRespondCount ?? 0
                if (reqCount > 0 && subRespondCount > 0) {
                    funcArray.push(
                        getArrangementDataOfTargetSite({
                            siteId: result.success?.site?.siteId ?? 'no-id',
                            myCompanyId: side.requestedCompany?.companyId ?? 'no-id',
                            myWorkerId: 'no-id',
                            respondRequestId: side.targetRequest?.requestId,
                        }),
                    )
                }
            })
        })

        //一層下の会社の手配までをチェック
        const results2 = (await Promise.all(funcArray)) as CustomResponse<GetArrangementDataOfTargetSiteResponse>[]
        results2.forEach((result) => {
            if (result.error) {
                throw { error: result.error }
            }
        })

        results2.forEach((result) => {
            result.success?.siteArrangementData?.selfSide?.forEach((side) => {
                if (side.targetArrangement != undefined && side.worker != undefined) {
                    workers.push(side.worker)
                }
            })
        })

        workers = uniqBy(workers, 'workerId')

        return Promise.resolve({
            success: {
                workers: workers,
            } as GetDistinctArrangedUsersResponse,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetUsersFilteredByRoleParam = {
    filter: 'over-manager' | 'all'
    myCompanyId?: string
    myWorkerId?: string
}

export type GetUsersFilteredByRoleResponse =
    | {
          workers?: WorkerCLType[]
      }
    | undefined

export const GetUsersFilteredByRole = async (params: GetUsersFilteredByRoleParam): Promise<CustomResponse<GetUsersFilteredByRoleResponse>> => {
    try {
        const { filter, myCompanyId, myWorkerId } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }
        if (myWorkerId == undefined) {
            throw {
                error: 'ログインユーザー情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        const result = await _getWorkerListOfTargetCompany({ companyId: myCompanyId })
        if (result.error) {
            throw { error: result.error }
        }

        let workers: WorkerCLType[] = []
        if (filter == 'over-manager') {
            const array: WorkerType[] = result.success?.items?.filter((item) => item.companyRole == 'manager' || item.companyRole == 'owner') ?? []
            workers = array.map((item) => toWorkerCLType(item)).filter((item) => item.workerId != myWorkerId)
        } else if (filter == 'all') {
            const array: WorkerType[] = result.success?.items ?? []
            workers = array.map((item) => toWorkerCLType(item)).filter((item) => item.workerId != myWorkerId)
        }

        return Promise.resolve({
            success: {
                workers: workers,
            } as GetUsersFilteredByRoleResponse,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
