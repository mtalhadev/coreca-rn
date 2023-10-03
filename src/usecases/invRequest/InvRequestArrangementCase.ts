import flatten from 'lodash/flatten'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'
import { SiteArrangementDataType } from '../../models/arrangement/SiteArrangementDataType'
import { InvRequestType } from '../../models/invRequest/InvRequestType'
import { InvRequestWorkerModel } from '../../models/invRequest/InvRequestWorker'
import { SiteType } from '../../models/site/Site'
import { ArrangementWorkerType } from '../../models/worker/ArrangementWorkerListType'
import { getDailyStartTime, toCustomDateFromTotalSeconds } from '../../models/_others/CustomDate'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { ID } from '../../models/_others/ID'
import { _getArrangementListOfTargetSiteAndCompany, _getLocalArrangement } from '../../services/arrangement/ArrangementService'
import { _getCompany, _getCompanyListByIds } from '../../services/company/CompanyService'
import { _getInvRequest, _getInvRequestListOfTargetDateAndCompany, _updateInvRequest } from '../../services/invRequest/InvRequestService'
import { _getRequestListOfTargetSiteAndCompany } from '../../services/request/RequestService'
import { _addInsideWorkersArrangement } from '../../services/site/SiteArrangementUpdateService'
import { _getSite, _getSiteOfTargetFakeCompanyInvRequestId } from '../../services/site/SiteService'
import { _getArrangeableWorkersOfTargetSiteAndCompany } from '../../services/worker/WorkerService'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { getUuidv4 } from '../../utils/Utils'
import { addInsideWorkersArrangement, ChangeRequestType, deleteInsideWorkerArrangement, addOutsideWorkerRequest, deleteOutsideWorkerRequest } from '../arrangement/SiteArrangementCase'
import { checkMyDepartment } from '../department/DepartmentCase'
import { AttendanceType } from '../../models/attendance/Attendance'

/**
 * @requires
 * @param invRequestId - 手配する常用で送るId
 * @param workerIds - 追加または削除する作業員リスト。
 * @param myWorkerId - 自身。作成者を特定するため。
 * @param type - 作業員の追加か削除
 * @param relatedInvRequestIds - 追加または削除するinvRequestIds
 * @param invRequestWorkers - 追加するInvRequestWorkers
 */
export type ChangeInsideWorkersInvRequestParams = {
    myCompanyId?: string
    invRequestId?: string
    workerIds?: string[]
    workers?: ArrangementWorkerType[]
    myWorkerId?: string
    relatedInvRequestIds?: string[]
    invRequestWorkers?: InvRequestWorkerModel[]
    type?: 'add' | 'delete'
    fakeSite?: SiteType
    respondRequestId?: string
}
/**
 * 作成した勤怠データと削除した手配IDを返す。フロントで作成したArrangementにはAttendanceが含まれないから。
 */
export type ChangeInsideWorkersInvRequestResponse =
    | {
          addAttendances?: AttendanceType[]
          deleteArrangementIds?: string[]
      }
    | undefined

/**
 * @remarks 自社作業員を常用申請に手配する。複数入力対応。
 * @objective SiteArrangementManage.tsxにおいて自社作業員を手配をするため。
 * @author Kamiya
 * @param params - {@link ChangeInsideWorkersInvRequestParams}
 * @returns - {@link ChangeInsideWorkersInvRequestResponse}
 */
export const changeInsideWorkersInvRequest = async (params: ChangeInsideWorkersInvRequestParams): Promise<CustomResponse<ChangeInsideWorkersInvRequestResponse>> => {
    try {
        const { myCompanyId, invRequestId, workerIds, workers, myWorkerId, relatedInvRequestIds, type, fakeSite, invRequestWorkers, respondRequestId } = params
        if (workerIds == undefined || invRequestId == undefined || myWorkerId == undefined || type == undefined) {
            throw {
                error: `invRequestId: ${invRequestId}, workerIds: ${workerIds}, myWorkerId: ${myWorkerId}, type: ${type}, ${'情報が足りません'}`,
            }
        }
        if (workerIds.length == 0) {
            return Promise.resolve({
                success: undefined,
            })
        }
        let addAttendances: AttendanceType[] = []
        let deleteArrangementIds: string[] = []
        const invRequestResult = await _getInvRequest({
            invRequestId,
            options: {
                invRequestWorkers: true,
                targetCompany: true,
                attendances: true,
            },
        })
        if (invRequestResult.error) {
            throw {
                error: invRequestResult.error,
                errorCode: invRequestResult.errorCode,
            }
        }
        if (type == 'add') {
            const result = await _updateInvRequest({
                invRequest: {
                    ...invRequestResult.success,
                    workerIds: uniq([...(invRequestResult.success?.workerIds ?? []), ...workerIds]),
                    // isApplication: invRequestResult.success?.targetCompany?.isFake ? true : false,  //手配変更はLocalに留まるので手配変更が反映されるときは申請がtrueになるとき
                    isApproval: invRequestResult.success?.targetCompany?.isFake ? true : 'waiting',
                    updateWorkerId: myWorkerId,
                    relatedInvRequestIds: uniq([...(invRequestResult.success?.relatedInvRequestIds ?? []), ...(relatedInvRequestIds ?? [])]),
                    invRequestWorkers: uniqBy([...(invRequestResult.success?.invRequestWorkers ?? []), ...(invRequestWorkers ?? [])], 'workerId'),
                },
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            if (myCompanyId && fakeSite) {
                /**
                 * 申請先が仮会社の場合は、そのInvRequestIdを持っているSiteに、その作業員を手配して、ArrangementとAttendanceを作成する。
                 * 元々この関数は、SiteArrangementManageCaseでしか使っていなかった。しかし、仮会社への常用で送る場合には、同時に仮会社施工への現場手配も必要になるので、こちらでも追加した。
                 * 仮会社施工はでは、手配のヒモづかない勤怠は存在しないためnewArrangementIdsは不要。手配を取り消した時点で勤怠が削除され、それにひもづく手配がtriggerによって削除される。
                 */
                const arrangementResult = await addInsideWorkersArrangement({
                    myCompanyId,
                    siteId: fakeSite?.siteId ?? 'no-id',
                    workerIds,
                    myWorkerId,
                    workers,
                    isFakeCompanyManageSite: true,
                    respondRequestId,
                    fakeCompanyInvRequestId: invRequestId,
                })
                if (arrangementResult.error) {
                    throw {
                        error: arrangementResult.error,
                        errorCode: arrangementResult.errorCode,
                    }
                }
                addAttendances = arrangementResult.success ?? []
            }
        } else if (type == 'delete') {
            const deletedRelatedInvRequestIdsSet = new Set(relatedInvRequestIds)
            const result = await _updateInvRequest({
                invRequest: {
                    ...invRequestResult.success,
                    workerIds: invRequestResult.success?.workerIds?.filter((id) => !workerIds.includes(id)) ?? [],
                    // isApplication: invRequestResult.success?.targetCompany?.isFake ? true : false, //手配変更はLocalに留まるので手配変更が反映されるときは申請がtrueになるとき
                    isApproval: invRequestResult.success?.targetCompany?.isFake ? true : 'waiting',
                    updateWorkerId: myWorkerId,
                    relatedInvRequestIds: invRequestResult.success?.relatedInvRequestIds?.filter((id) => !deletedRelatedInvRequestIdsSet.has(id)),
                    //invRequestWorkersは直接代入すると、attendanceIdsがローカルで保持できていないので消えてしまう。
                    invRequestWorkers: invRequestResult.success?.invRequestWorkers?.filter((iWorker) => !workerIds?.some((id) => id == iWorker.workerId)),
                },
            })
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
            if (myCompanyId && fakeSite) {
                //申請先が仮会社の場合は、そのInvRequestIdを持っているSiteに、その作業員の手配を削除する
                const arrangementResult = await deleteInsideWorkerArrangement({
                    myCompanyId,
                    siteId: fakeSite?.siteId ?? 'no-id',
                    workerIds,
                    isFakeCompanyManageSite: true,
                    site: fakeSite,
                    //    targetArrangementIds: deleteArrangementIds,
                    respondRequestId,
                })
                if (arrangementResult.error) {
                    throw {
                        error: arrangementResult.error,
                        errorCode: arrangementResult.errorCode,
                    }
                }
                //申請先が仮会社の場合は、その作業員の手配のみを削除
                deleteArrangementIds =
                    (invRequestResult.success?.attendances
                        ?.filter((att) => att.workerId && workerIds?.includes(att.workerId))
                        ?.map((att) => att.arrangementId)
                        .filter((id) => id == undefined) as string[]) ?? []
            } else {
                //申請先が仮会社でない場合は、全ての手配を削除
                deleteArrangementIds = (invRequestResult.success?.attendances?.map((att) => att.arrangementId).filter((id) => id == undefined) as string[]) ?? []
            }
        }
        return Promise.resolve({
            success: {
                addAttendances,
                deleteArrangementIds,
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * @param invRequestIds - 手配する常用で送るId
 * @param workerIds - 手配する自社作業員リスト。
 * @param myWorkerId - 自身。作成者を特定するため。
 * @param myCompanyId - 自社ID。仮会社施工の現場を確定する場合に必要
 * @param workers - 手配した作業員ID。仮会社施工の現場を確定する場合に必要
 */
export type SetInvRequestsArrangementParam = {
    invRequestIds?: string[]
    workerIds?: string[]
    myWorkerId?: string
    myCompanyId?: string
    workers?: ArrangementWorkerType[]
}
/**
 * 成否を返す。
 */
export type SetInvRequestsArrangementResponse = boolean | undefined
/**
 * @remarks 自社作業員をまとめて複数の常用申請に手配する。
 * @objective SiteArrangementManage.tsxにおいて自社作業員を手配をするため。
 * @error
 * GET_INVREQUEST_ERROR - 申請の取得に失敗
 * UPDATE_INVREQUEST_ERROR - 手配のアップデートに失敗
 * @author Kamiya
 * @param params - {@link SetInvRequestsArrangementParam}
 * @returns - {@link SetInvRequestsArrangementResponse}
 */
export const setInvRequestsArrangement = async (params: SetInvRequestsArrangementParam): Promise<CustomResponse<SetInvRequestsArrangementResponse>> => {
    try {
        const { invRequestIds, workerIds, myWorkerId, myCompanyId, workers } = params
        if (workerIds == undefined || invRequestIds == undefined || myWorkerId == undefined) {
            throw {
                error: `invRequestIds: ${invRequestIds}, workerIds: ${workerIds}, myWorkerId: ${myWorkerId}, ${'情報が足りません'}`,
            }
        }
        if (workerIds.length == 0) {
            return Promise.resolve({
                success: true,
            })
        }
        const invRequestResults = await Promise.all(invRequestIds.map((invRequestId) => _getInvRequest({ invRequestId, options: { targetCompany: true, site: true } })))
        invRequestResults.forEach((result) => {
            if (result?.error) {
                throw {
                    error: result.error,
                    errorCode: 'GET_INVREQUEST_ERROR',
                }
            }
        })
        const updateInvRequests = invRequestResults
            .map((result) => result?.success)
            .filter(
                (invRequest) =>
                    invRequest != undefined &&
                    (invRequest?.workerIds == undefined || (invRequest?.workerIds && invRequest?.workerIds?.length == 0 && (invRequest.site == undefined || invRequest.site.isConfirmed != true))),
            ) as InvRequestType[]
        const invRequestWorkers = workerIds.map((id) => {
            return {
                invRequestWorkerId: getUuidv4(),
                workerId: id,
            } as InvRequestWorkerModel
        })
        const results = await Promise.all(
            updateInvRequests?.map((_invRequest) =>
                _updateInvRequest({
                    invRequest: {
                        invRequestId: _invRequest?.invRequestId ?? 'no-id',
                        workerIds,
                        isApplication: _invRequest?.targetCompany?.isFake ? true : false,
                        isApproval: _invRequest?.targetCompany?.isFake ? true : 'waiting',
                        updateWorkerId: myWorkerId,
                        invRequestWorkers: invRequestWorkers,
                    },
                }),
            ),
        )
        results.forEach((result) => {
            if (result?.error) {
                throw {
                    error: result.error,
                    errorCode: 'UPDATE_INVREQUEST_ERROR',
                }
            }
        })

        const sites = invRequestResults.map((result) => result.success?.site).filter((data) => data != undefined) as SiteType[]
        /**
         * 仮会社へ送っている場合は現場手配。
         */
        if (invRequestResults.map((result) => result.success)[0]?.targetCompany?.isFake) {
            const fakeSiteResult = await setFakeSitesArrangement({
                workerIds,
                myWorkerId,
                myCompanyId,
                workers,
                sites,
            })
            if (fakeSiteResult?.error) {
                throw {
                    error: fakeSiteResult.error,
                    errorCode: fakeSiteResult.errorCode,
                }
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * @param workerIds - 手配する自社作業員リスト。
 * @param myWorkerId - 自身。作成者を特定するため。
 * @param myCompanyId - 自社ID。仮会社施工の現場を確定する場合に必要
 * @param workers - 手配した作業員ID。仮会社施工の現場を確定する場合に必要
 * @param sites - 手配する現場
 */
export type SetFakeSitesArrangementParam = {
    workerIds?: string[]
    myWorkerId?: string
    myCompanyId?: string
    workers?: ArrangementWorkerType[]
    sites?: SiteType[]
}
/**
 * 成否を返す。
 */
export type SetFakeSitesArrangementResponse = boolean | undefined
/**
 * @remarks 常用申請に紐づく仮施工現場に手配を反映する。
 * @error
 * @author Kamiya
 * @param params - {@link SetFakeSitesArrangementParam}
 * @returns - {@link SetFakeSitesArrangementResponse}
 */
export const setFakeSitesArrangement = async (params: SetFakeSitesArrangementParam): Promise<CustomResponse<SetFakeSitesArrangementResponse>> => {
    try {
        const { workerIds, myWorkerId, myCompanyId, workers, sites } = params
        if (workerIds == undefined || myWorkerId == undefined || myCompanyId == undefined || sites == undefined) {
            throw {
                error: `workerIds: ${workerIds}, myWorkerId: ${myWorkerId},  myCompanyId: ${myCompanyId}, ${'情報が足りません'}`,
            }
        }
        /**
         * 更新するinvRequestIdとひもづく現場を取得
         * その現場（仮会社施工）に対して、まとめて常用申請手配された作業員を現場手配する。
         */
        const getSitesResults = await Promise.all(
            sites?.map((site) =>
                _getSite({
                    siteId: site.siteId ?? 'no-id',
                    options: {
                        companyRequests: {
                            params: {
                                companyId: myCompanyId,
                                types: ['receive'],
                            },
                        },
                    },
                }),
            ),
        )
        getSitesResults.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        })
        const updateSites = getSitesResults.map((result) => result.success).filter((site) => site != undefined && site.isConfirmed != true) as SiteType[]
        /**
         * updateSitesに対して、作業員を手配をする
         */
        const updateArrResult = await Promise.all(
            updateSites.map((site) =>
                _addInsideWorkersArrangement({
                    myCompanyId: myCompanyId,
                    siteId: site.siteId ?? 'no-id',
                    workerIds,
                    myWorkerId,
                    respondRequestId: site.companyRequests?.receiveRequests?.items && site.companyRequests?.receiveRequests?.items[0]?.requestId,
                    // newArrangementIds: string[],//手配を追加したり削除したりというのをリアルタイムで更新しないので、ここでは不要。
                    workers: workers,
                    isFakeCompanyManageSite: true,
                    fakeCompanyInvRequestId: site.fakeCompanyInvRequestId,
                }),
            ),
        )
        updateArrResult.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        })
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * invRequestId - 常用申請Id
 * isApplication - 申請状況
 * myCompanyId - 自社Id
 * @partial
 * isDailyBundle - 同日に同会社に同作業員を申請手配しないようチェックする際に、申請済みかどうかの切り替え。日付ごとにまとめて申請する場合には、未申請でもチェックが必要だが、一度に同じ日に複数の申請を出さないのであれば、申請済みのものだけをチェックする
 * 効率化のため
 * invRequest - 申請
 */
export type SetInvRequestApplicationParam = {
    invRequestId?: string
    isApplication?: boolean
    myCompanyId?: string
    invRequest?: InvRequestType
    isDailyBundle?: boolean
}

export type SetInvRequestApplicationResponse = boolean | undefined

export const setInvRequestApplication = async (params: SetInvRequestApplicationParam): Promise<CustomResponse<SetInvRequestApplicationResponse>> => {
    try {
        const { invRequestId, isApplication, myCompanyId, invRequest, isDailyBundle } = params
        if (invRequestId == undefined) {
            throw {
                error: '常用申請Idが足りません。',
            } as CustomResponse
        }
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。',
            } as CustomResponse
        }
        let targetCompany = invRequest?.targetCompany
        let _invRequest = invRequest
        if (_invRequest == undefined) {
            const getResult = await _getInvRequest({
                invRequestId,
                options: {
                    ...(targetCompany
                        ? {}
                        : {
                              targetCompany: true,
                          }),
                },
            })
            if (getResult.error) {
                throw {
                    error: getResult.error,
                }
            }
            _invRequest = getResult.success
            targetCompany = targetCompany ?? getResult.success?.targetCompany
        }
        if (_invRequest?.myCompanyId != myCompanyId) {
            throw {
                error: '常用で送る会社のみ申請できます。',
            }
        }
        if (_invRequest?.workerIds == undefined || _invRequest.workerIds.length == 0) {
            throw {
                error: '作業員が手配されていません',
            }
        }
        const duplicateCheckResult = await checkDuplicateInvRequestWorker({
            targetCompanyId: _invRequest.targetCompanyId,
            invRequest: _invRequest,
            isDailyBundle: isDailyBundle,
        })
        if (duplicateCheckResult.error) {
            throw {
                error: duplicateCheckResult.error,
            }
        }

        const result = await _updateInvRequest({
            invRequest: {
                invRequestId,
                isApplication: isApplication == undefined || isApplication == true || targetCompany?.isFake ? true : false,
                workerCount: _invRequest.workerIds.length,
                isApproval: targetCompany?.isFake ? true : 'waiting',
            },
        })

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

/**
 * invRequestIds - 申請したいinvRequestId
 * myCompanyId - 申請元会社Id
 */
export type SetInvRequestsApplicationParam = {
    invRequestIds?: string[]
    myCompanyId?: string
}

export type SetInvRequestsApplicationResponse = boolean | undefined
/**
 * まとめて申請手配で、手配済みの作業員の常用申請を確定して申請する。
 * @param params {@link SetInvRequestsApplicationParam}
 * @returns - {@link SetInvRequestsApplicationResponse}
 */
export const setInvRequestsApplication = async (params: SetInvRequestsApplicationParam): Promise<CustomResponse<SetInvRequestsApplicationResponse>> => {
    try {
        const { invRequestIds, myCompanyId } = params
        if (invRequestIds == undefined) {
            throw {
                error: '常用申請Idが足りません。',
            } as CustomResponse
        }
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。',
            } as CustomResponse
        }

        const getInvRequestResults =
            (await Promise.all(
                invRequestIds.map((invRequestId) =>
                    _getInvRequest({
                        invRequestId,
                    }),
                ),
            )) ?? []
        let _error
        getInvRequestResults?.forEach((result) => {
            if (result?.error) {
                _error = result.error
            }
            if (result.success?.workerIds == undefined || result.success.workerIds.length == 0) {
                _error = '手配されていない日があります。'
            }
            if (result.success?.isApplication == false && result.success?.workerCount != result.success?.workerIds?.length) {
                _error = '常用で送る人数と手配人数が違う日があります。'
            }
        })
        if (_error) {
            throw {
                error: _error,
            } as CustomResponse
        }
        const InvReservationInvRequests = getInvRequestResults?.map((result) => result.success).filter((data) => data != undefined && data?.isApplication == false) as InvRequestType[]
        const duplicateCheckResult = await Promise.all(
            InvReservationInvRequests?.map((inv) =>
                checkDuplicateInvRequestWorker({
                    targetCompanyId: inv.targetCompanyId,
                    invRequest: inv,
                    isDailyBundle: false,
                }),
            ),
        )
        duplicateCheckResult.forEach((result) => {
            if (result?.error) {
                throw {
                    error: result.error,
                }
            }
        })
        const results = await Promise.all(
            InvReservationInvRequests?.map((inv) => inv?.invRequestId)?.map((invRequestId) =>
                setInvRequestApplication({
                    invRequestId,
                    myCompanyId,
                    isApplication: true,
                }),
            ),
        )
        results.forEach((result) => {
            if (result?.error) {
                throw {
                    error: result.error,
                }
            }
        })
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
type CheckDuplicateInvRequestWorkerParams = {
    targetCompanyId?: string
    invRequest?: InvRequestType
    isDailyBundle?: boolean
}
/**
 * 申請時に、既にその作業員が申請先の会社に申請手配されていないかを確認する。
 * @param params {@link CheckDuplicateInvRequestWorkerParams}
 * @returns 成否を返す
 */
export const checkDuplicateInvRequestWorker = async (params: CheckDuplicateInvRequestWorkerParams): Promise<CustomResponse<boolean>> => {
    const { targetCompanyId, invRequest, isDailyBundle } = params
    try {
        if (targetCompanyId == undefined || invRequest == undefined) {
            throw {
                error: '作業員の重複を確認するための情報が足りません',
            }
        }
        if (invRequest.date == undefined) {
            throw {
                error: '日付情報がありません',
            }
        }
        const invRequestsResult = await _getInvRequestListOfTargetDateAndCompany({
            companyId: targetCompanyId,
            date: getDailyStartTime(toCustomDateFromTotalSeconds(invRequest.date)).totalSeconds,
            types: ['receive'],
            isApplication: isDailyBundle ? undefined : true,
        })
        if (invRequestsResult.error) {
            throw {
                error: invRequestsResult.error,
            }
        }
        let otherInvRequestWorkerIds: string[] = []
        if (isDailyBundle == true) {
            //その日の常用で送るをまとめて申請する場合は、未申請であっても今回でダブりが発生する可能性があるため、自社からの申請に限り未申請も含めて確認を行う。
            const myCompanyInvRequestWorkerIds =
                flatten(
                    invRequestsResult.success?.receiveInvRequests?.items
                        ?.filter((inv) => inv.myCompanyId == invRequest?.myCompanyId && invRequest.invRequestId != inv.invRequestId)
                        .map((inv: InvRequestType) => inv.workerIds),
                ).filter((data) => data != undefined) ?? ([] as string[])
            const otherCompanyInvRequestWorkerIds =
                flatten(
                    invRequestsResult.success?.receiveInvRequests?.items
                        ?.filter((inv) => inv.isApplication == true && inv.myCompanyId != invRequest?.myCompanyId)
                        .map((inv: InvRequestType) => inv.workerIds),
                ).filter((data) => data != undefined) ?? ([] as string[])
            otherInvRequestWorkerIds = [...myCompanyInvRequestWorkerIds, ...otherCompanyInvRequestWorkerIds].filter((data) => data != undefined) as string[]
        } else {
            otherInvRequestWorkerIds = flatten(
                invRequestsResult.success?.receiveInvRequests?.items?.filter((inv) => inv.invRequestId != invRequest?.invRequestId).map((inv: InvRequestType) => inv.workerIds),
            ).filter((data) => data != undefined) as string[]
        }
        const duplicationWorkerCount = invRequest.workerIds?.filter((id) => otherInvRequestWorkerIds.filter((_id) => _id == id).length > 0).length ?? 0
        if (duplicationWorkerCount > 0) {
            throw {
                error: `既に別の常用申請でこの会社へ手配されている作業員がいます`,
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
export type ApplyDraftInvRequestArrangementDataResponse =
    | {
          addAttendances?: AttendanceType[]
          deleteArrangementIds?: ID[]
          invRequestId?: ID
          fakeSiteId?: ID
      }
    | undefined

export type ApplyDraftInvRequestArrangementDataParam = {
    keepInvRequestArrangementData?: SiteArrangementDataType
    invRequestArrangementData?: SiteArrangementDataType
    invRequestId?: ID
    respondRequestId?: ID
    myCompanyId?: ID
    myWorkerId?: ID
    fakeSite?: SiteType
    activeDepartmentIds?: ID[]
}
/**
 * 編集途中の手配データを確定してサーバーに反映
 * @param params - {@link ApplyDraftInvRequestArrangementDataParam}
 * @returns CustomResponse
 */
export const applyDraftInvRequestArrangementData = async (params: ApplyDraftInvRequestArrangementDataParam): Promise<CustomResponse<ApplyDraftInvRequestArrangementDataResponse>> => {
    try {
        const { keepInvRequestArrangementData, invRequestArrangementData, invRequestId, respondRequestId, myCompanyId, myWorkerId, fakeSite, activeDepartmentIds } = params
        if (invRequestId == undefined || myCompanyId == undefined || myWorkerId == undefined) {
            throw {
                error: 'IDが足りません',
                errorCode: 'INV_APPLY_DRAFT_ERROR',
            }
        }
        //invRequestWorkersの数と、workerIdの数が同じでない場合は、workerIdsに入っていないInvRequestWorkerを削除する。
        const keepSelfSideWorkers = keepInvRequestArrangementData?.selfSide?.map((data) => data).filter((worker) => worker.targetInvRequest?.invRequestId != undefined)
        const updateSelfSideWorkers = invRequestArrangementData?.selfSide?.map((data) => data).filter((worker) => worker.targetInvRequest?.invRequestId != undefined)

        const updateInvRequest = updateSelfSideWorkers?.map((side) => side.targetInvRequest).filter((data) => data != undefined)[0]
        if (fakeSite == undefined && (updateInvRequest?.workerIds == undefined || updateInvRequest.workerIds.length == 0)) {
            throw {
                error: '作業員が手配されていません。',
                errorCode: 'INV_APPLY_DRAFT_ERROR',
            }
        }
        if (updateInvRequest?.workerIds?.length !== updateInvRequest?.invRequestWorkers?.length) {
            throw {
                error: '手配データに問題があります。作業員の手配をやり直してください。',
                errorCode: 'INV_APPLY_DRAFT_ERROR',
            }
        }
        let addAttendances: AttendanceType[] = []
        let deleteArrangementIds: ID[] = []
        const updateSelfSideWorkerIds = (updateSelfSideWorkers?.map((worker) => worker.worker?.workerId).filter((data) => data != undefined) as string[]) ?? []
        const keepSelfSideWorkerIds = (keepSelfSideWorkers?.map((worker) => worker.worker?.workerId).filter((data) => data != undefined) as string[]) ?? []

        const deleteSelfSideWorkers = keepSelfSideWorkers?.filter((worker) => !updateSelfSideWorkerIds?.some((id) => id == worker.worker?.workerId))
        const addSelfSideWorkers = updateSelfSideWorkers?.filter((worker) => !keepSelfSideWorkerIds?.some((id) => id == worker.worker?.workerId))
        const otherDepartmentWorkersNum =
            (deleteSelfSideWorkers?.filter((worker) => worker.worker?.invRequestId == undefined && !checkMyDepartment({ targetDepartmentIds: worker.worker?.departmentIds, activeDepartmentIds }))
                .length ?? 0) +
            (addSelfSideWorkers?.filter((worker) => worker.worker?.invRequestId == undefined && !checkMyDepartment({ targetDepartmentIds: worker.worker?.departmentIds, activeDepartmentIds }))
                .length ?? 0)
        if (otherDepartmentWorkersNum > 0) {
            throw {
                error: '他部署の作業員の手配を変更しています。部署を切り替えてください。',
                errorCode: 'INV_APPLY_DRAFT_ERROR',
            }
        }
        if (deleteSelfSideWorkers && deleteSelfSideWorkers?.length > 0) {
            /**
             * 自社作業員手配削除
             */
            const deleteWorkers = (deleteSelfSideWorkers?.map((worker) => worker.worker).filter((data) => data != undefined) as ArrangementWorkerType[]) ?? []
            const deleteWorkerIds = (deleteWorkers?.map((worker) => worker?.workerId).filter((data) => data != undefined) as string[]) ?? []
            //同一invRequestから来た作業員の一部が手配削除された場合の対応
            const remainInvRequestIds = (updateSelfSideWorkers?.map((side) => side.worker?.invRequestId).filter((data) => data != undefined) as string[]) ?? []
            const remainInvRequestIdsSet = new Set(remainInvRequestIds)
            const deleteInSideResult = await changeInsideWorkersInvRequest({
                myCompanyId,
                invRequestId,
                workerIds: deleteWorkerIds,
                workers: deleteWorkers,
                myWorkerId,
                type: 'delete',
                relatedInvRequestIds: (deleteWorkers?.map((worker) => worker?.invRequestId).filter((data) => data != undefined && !remainInvRequestIdsSet.has(data)) as string[]) ?? [],
                fakeSite,
                respondRequestId: fakeSite?.companyRequests?.receiveRequests?.items && fakeSite?.companyRequests?.receiveRequests?.items[0].requestId,
            })
            if (deleteInSideResult.error) {
                throw {
                    error: deleteInSideResult.error,
                    errorCode: deleteInSideResult.errorCode + ',APPLY_DRAFT',
                }
            }
            deleteArrangementIds = deleteInSideResult.success?.deleteArrangementIds ?? []
        }

        if (respondRequestId && fakeSite) {
            //仮会社施工の場合
            const keepOtherSideCompanies = keepInvRequestArrangementData?.otherSide?.map((data) => data).filter((company) => company.targetRequest?.requestId != undefined)
            const updateOtherSideCompanies = invRequestArrangementData?.otherSide?.map((data) => data).filter((company) => company.targetRequest?.requestId != undefined)
            const deleteOtherSides = keepOtherSideCompanies
                ?.map((company) => {
                    const updateRequestCount = updateOtherSideCompanies?.filter((data) => data.targetRequest?.requestId == company.targetRequest?.requestId)[0]?.targetRequest?.requestCount ?? 0
                    //元々の依頼数-変更後の依頼数
                    const deleteCount = (company.targetRequest?.requestCount ?? 0) - updateRequestCount
                    if (deleteCount > 0) {
                        return {
                            ...company,
                            deleteCount,
                        } as ChangeRequestType
                    } else {
                        return undefined
                    }
                })
                .filter((data) => data != undefined) as ChangeRequestType[] ?? []
            const addOtherSides = updateOtherSideCompanies
                ?.map((company) => {
                    const keepRequestCount = keepOtherSideCompanies?.filter((data) => data.targetRequest?.requestId == company.targetRequest?.requestId)[0]?.targetRequest?.requestCount ?? 0
                    //変更後の依頼数-元々の依頼数
                    const addCount = (company.targetRequest?.requestCount ?? 0) - keepRequestCount
                    if (addCount > 0) {
                        return {
                            ...company,
                            addCount,
                        } as ChangeRequestType
                    } else {
                        return undefined
                    }
                })
                .filter((data) => data != undefined) as ChangeRequestType[] ?? []
            for (const company of deleteOtherSides) {
                const result = await deleteOutsideWorkerRequest({
                    myWorkerId,
                    targetRequestId: company.targetRequest?.requestId ?? '',
                    deleteCount: company?.deleteCount ?? 0,
                    respondRequestId: respondRequestId,
                    myCompanyId,
                    siteId: fakeSite?.siteId ?? 'no-id',
                    isFakeCompanyManageSite: true,
                    isFakeRequestedCompany: company.requestedCompany?.isFake,
                })
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode + ',APPLY_DRAFT',
                    }
                }
                deleteArrangementIds = [...deleteArrangementIds, ...(result.success ?? [])]
            }
            for (const company of addOtherSides) {
                const result = await addOutsideWorkerRequest({
                    myCompanyId,
                    siteId: fakeSite?.siteId ?? 'no-id',
                    requestedCompanyId: company?.requestedCompany?.companyId ?? 'no-id',
                    myWorkerId,
                    addCount: company?.addCount ?? 0,
                    reservationId: company.targetReservation?.reservationId ?? 'no-id',
                    // 初回のみSiteArrangementManage.tsxにて新規作成している。
                    targetRequestId: company.targetRequest?.requestId ?? 'no-id',
                    // reservation: company.targetReservation,//そのまま渡してしまうとleftCountを２倍消費してしまう。
                    respondRequestId: respondRequestId,
                    isFakeCompanyManageSite: true,
                    isFakeRequestedCompany: company.requestedCompany?.isFake,
                })
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode + ',APPLY_DRAFT',
                    }
                }
                addAttendances = [...addAttendances, ...(result.success ?? [])]
            }
        }
        if (addSelfSideWorkers && addSelfSideWorkers?.length > 0) {
            /**
             * 自社作業員手配追加
             */
            const addInSideResult = await changeInsideWorkersInvRequest({
                myCompanyId,
                invRequestId,
                workerIds: (addSelfSideWorkers?.map((worker) => worker.worker?.workerId).filter((data) => data != undefined) as string[]) ?? [],
                workers: (addSelfSideWorkers?.map((worker) => worker.worker).filter((data) => data != undefined) as ArrangementWorkerType[]) ?? [],
                myWorkerId,
                type: 'add',
                relatedInvRequestIds: (addSelfSideWorkers?.map((worker) => worker.worker?.invRequestId).filter((data) => data != undefined) as string[]) ?? [],
                invRequestWorkers:
                    (addSelfSideWorkers
                        ?.map((worker) => worker.targetInvRequest?.invRequestWorkers?.filter((data) => data.workerId == worker.worker?.workerId)[0])
                        .filter((data) => data != undefined) as InvRequestWorkerModel[]) ?? [],
                fakeSite,
                respondRequestId: fakeSite?.companyRequests?.receiveRequests?.items && fakeSite?.companyRequests?.receiveRequests?.items[0].requestId,
            })
            if (addInSideResult.error) {
                throw {
                    error: addInSideResult.error,
                    errorCode: addInSideResult.errorCode + ',APPLY_DRAFT',
                }
            }
            addAttendances = [...addAttendances, ...(addInSideResult.success?.addAttendances ?? [])]
        }

        return Promise.resolve({
            success: {
                addAttendances,
                deleteArrangementIds,
                fakeSiteId: fakeSite?.siteId,
                invRequestId,
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
