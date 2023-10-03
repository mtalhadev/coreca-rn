import { SiteCLType, SiteModel, SiteType, toSiteCLType } from '../../models/site/Site'
import { SiteEditUIType } from '../../screens/adminSide/site/editSite/EditSite'
import { _getArrangementListOfTargetConstruction, _getArrangementListOfTargetSite } from '../../services/arrangement/ArrangementService'
import { _getConstruction, _getConstructionRelationType } from '../../services/construction/ConstructionService'
import {
    _createSite,
    _deleteSite,
    _getSite,
    _getSiteListOfTargetConstruction,
    _getSiteListOfTargetConstructionAndDate,
    _getSiteMeterOfTargetSite,
    _getSiteNameData,
    _updateSite,
} from '../../services/site/SiteService'
import { _getWorker } from '../../services/worker/WorkerService'
import { DEFAULT_SITE_END_TIME, DEFAULT_SITE_START_TIME } from '../../utils/Constants'
import { combineTimeAndDay, CustomDate, getYYYYMMDDTotalSeconds, nextDay, toCustomDateFromTotalSeconds } from '../../models/_others/CustomDate'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _createRequest, _getRequest, _getRequestOfTargetSiteAndCompanies, _updateRequest } from '../../services/request/RequestService'
import { RequestCLType, toRequestCLType } from '../../models/request/Request'
import { ConstructionRelationType } from '../../models/construction/ConstructionRelationType'
import { _getCompanyListOfTargetConstruction } from '../../services/company/CompanyService'
import { AttendanceCLType, toAttendanceCLType } from '../../models/attendance/Attendance'
import { _getAttendanceListOfTargetSite, _getAttendanceListOfTargetSiteAndWorker } from '../../services/attendance/AttendanceService'
import { _getProject, _updateProject } from '../../services/project/ProjectService'
import { Create, Update } from '../../models/_others/Common'
import { deleteFieldParam } from '../../services/firebase/FirestoreService'
import { numberFieldValue, stringFieldValue } from '../../utils/Utils'

export const updateSite = async (params: Update<SiteModel>): Promise<CustomResponse> => {
    try {
        const newSite: Update<SiteModel> = {
            ...params,
            meetingDate: params.meetingDate ?? deleteFieldParam(),
        }
        const result = await _updateSite(newSite)
        if (result.error) {
            throw { ...result }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type WriteConstructionSiteParam = {
    siteId?: string
    myCompanyId?: string
    constructionId?: string
    date?: CustomDate
    startTime?: CustomDate
    siteStartTimeIsNextDay?: boolean
    endTime?: CustomDate
    siteEndTimeIsNextDay?: boolean
    meetingTime?: CustomDate
    requiredNum?: number
    managerWorkerId?: string
    address?: string
    belongings?: string
    remarks?: string
    projectId?: string
    /**
     * 効率化のため
     */
    constructionRelation?: ConstructionRelationType
}

export type WriteConstructionSiteResponse = 'update' | 'create' | 'siteAlreadyExistsOnTheDay'

export const writeConstructionSite = async (params: WriteConstructionSiteParam): Promise<CustomResponse<WriteConstructionSiteResponse>> => {
    try {
        const {
            siteId,
            constructionId,
            constructionRelation,
            myCompanyId,
            date,
            startTime,
            siteStartTimeIsNextDay,
            endTime,
            siteEndTimeIsNextDay,
            meetingTime,
            requiredNum,
            managerWorkerId,
            address,
            belongings,
            remarks,
            projectId,
        } = params
        if (date == undefined) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。',
            }
        }

        if (constructionId == undefined) {
            throw {
                error: '工事情報がありません。',
            } as CustomResponse
        }

        if (siteId == undefined) {
            throw {
                error: '現場IDがありません。',
            } as CustomResponse
        }
        const [constructionRelationResult, existSiteResult, managerCompanyResult] = await Promise.all([
            constructionRelation
                ? undefined
                : _getConstructionRelationType({
                      companyId: myCompanyId,
                      constructionId,
                  }),
            _getSiteListOfTargetConstructionAndDate({ constructionId, date: getYYYYMMDDTotalSeconds(date) }),
            _getCompanyListOfTargetConstruction({
                constructionId,
                types: ['manager'],
            }),
        ])

        if (existSiteResult.error || constructionRelationResult?.error || managerCompanyResult.error) {
            throw {
                error: `工事: ${constructionRelationResult?.error} /現場: ${existSiteResult.error} / 会社: ${managerCompanyResult.error}`,
            }
        }
        const _constructionRelation = constructionRelation ?? constructionRelationResult?.success
        if (_constructionRelation != 'fake-company-manager' && _constructionRelation != 'manager') {
            throw {
                error: '施工会社しか現場を追加・編集できません。',
            }
        }
        const existSiteId = existSiteResult.success?.siteId

        // すでに現場が存在する日付に変更した場合、メッセージを表示
        if (existSiteId && existSiteId !== siteId) {
            return Promise.resolve({
                error: 'siteAlreadyExistsOnTheDay',
            })
        }

        const startDate = combineTimeAndDay(startTime ?? DEFAULT_SITE_START_TIME, nextDay(date, siteStartTimeIsNextDay ? 1 : 0))?.totalSeconds
        const endDate = combineTimeAndDay(endTime ?? DEFAULT_SITE_END_TIME, nextDay(date, siteEndTimeIsNextDay ? 1 : 0))?.totalSeconds
        const meetingDate = combineTimeAndDay(meetingTime, date)?.totalSeconds

        if (startDate && endDate && startDate > endDate) {
            throw {
                error: '開始時間は終了時間より以前にしてください。',
            }
        }
        if (meetingDate && endDate && meetingDate > endDate) {
            throw {
                error: '集合時間は終了時間より以前にしてください。',
            }
        }
        if (meetingDate && startDate && meetingDate > startDate) {
            throw {
                error: '集合時間は開始時間より以前にしてください。',
            }
        }

        // 現場の作業日が工期外の場合、作業日を含むように案件の工期を拡張する
        if (projectId) {
            const projectResult = await _getProject({
                projectId,
            })

            if (projectResult.error) {
                throw {
                    error: projectResult.error,
                }
            }

            if (startDate && projectResult.success?.startDate && (getYYYYMMDDTotalSeconds(toCustomDateFromTotalSeconds(projectResult.success?.startDate)) ?? 0) > startDate) {
                const updateProjectResult = await _updateProject({
                    projectId: projectResult.success.projectId,
                    startDate: getYYYYMMDDTotalSeconds(toCustomDateFromTotalSeconds(startDate)),
                })
                if (updateProjectResult.error) {
                    throw {
                        error: '案件の工期拡張に失敗しました。',
                        // error: updateProjectResult.error,
                    }
                }
            }

            if (endDate && projectResult.success?.endDate && (getYYYYMMDDTotalSeconds(nextDay(toCustomDateFromTotalSeconds(projectResult.success?.endDate), 1)) ?? Infinity) < endDate) {
                const updateProjectResult = await _updateProject({
                    projectId: projectResult.success.projectId,
                    endDate: getYYYYMMDDTotalSeconds(toCustomDateFromTotalSeconds(endDate)),
                })
                if (updateProjectResult.error) {
                    throw {
                        error: '案件の工期拡張に失敗しました。',
                        // error: updateProjectResult.error,
                    }
                }
            }
        }

        const siteDate = meetingDate ? getYYYYMMDDTotalSeconds(toCustomDateFromTotalSeconds(meetingDate)) : date ? getYYYYMMDDTotalSeconds(date) : undefined

        /**
         * @remarks 仮会社施工の場合は、仮会社からの常用依頼として捉えるため、現場作成と同時に常用依頼を作成する。
         * そうすることで明細などの集計時に常用依頼として扱えて、場合分する必要がなくなる。
         * @returns
         */
        const __createRequest = () =>
            existSiteId == undefined && constructionRelation == 'fake-company-manager'
                ? _createRequest({
                      request: {
                          companyId: (managerCompanyResult.success?.companies?.items ?? [])[0]?.companyId,
                          requestedCompanyId: myCompanyId,
                          siteId: siteId,
                          requestCount: requiredNum,
                          isFakeCompanyRequest: true,
                          date: siteDate,
                          isApplication: true,
                          isApproval: true,
                      },
                  })
                : undefined

        const isUpdate = existSiteId != undefined
        const newSite = {
            siteId: existSiteId ?? siteId,
            constructionId,
            startDate,
            endDate,
            meetingDate,
            managerWorkerId,
            siteDate,
            requiredNum: numberFieldValue({ isUpdate, value: requiredNum }),
            address: stringFieldValue({ isUpdate, value: address }),
            belongings: stringFieldValue({ isUpdate, value: belongings }),
            remarks: stringFieldValue({ isUpdate, value: remarks }),
        } as Update<SiteType>

        if (isUpdate) {
            const [result, requestResult] = await Promise.all([
                updateSite(newSite),
                /**
                 * 仮会社の場合はRequestのrequestCountも更新する必要がある。
                 */
                _constructionRelation == 'fake-company-manager' && (managerCompanyResult.success?.companies?.items ?? [])[0]?.companyId != undefined
                    ? _getRequestOfTargetSiteAndCompanies({
                          siteId,
                          companyId: (managerCompanyResult.success?.companies?.items ?? [])[0]?.companyId ?? 'no-id',
                          requestedCompanyId: myCompanyId,
                      })
                    : undefined,
            ])
            if (result.error) {
                throw {
                    error: '現場のアップデートに失敗しました。',
                } as CustomResponse
            }
            if (requestResult?.error) {
                throw {
                    error: requestResult.error,
                    errorCode: 'GET_REQUEST_ERROR',
                }
            }
            if (_constructionRelation == 'fake-company-manager' && requestResult?.success != undefined) {
                const updateResult = await _updateRequest({
                    request: {
                        requestId: requestResult?.success.requestId,
                        requestCount: newSite.requiredNum,
                    },
                })
                if (updateResult.error) {
                    throw {
                        error: updateResult.error,
                        errorCode: 'REQUEST_UPDATE_ERROR',
                    }
                }
            }
            return Promise.resolve({
                success: 'update',
            })
        } else {
            const [result, requestResult] = await Promise.all([_createSite(newSite as Create<SiteType>), __createRequest()])
            if (result.error) {
                throw {
                    error: '現場の作成に失敗しました。',
                } as CustomResponse
            }
            if (requestResult?.error) {
                throw {
                    error: requestResult.error,
                    errorCode: 'REQUEST_CREATE_ERROR',
                }
            }
            return Promise.resolve({
                success: 'create',
            })
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type DeleteConstructionSiteParam = {
    siteId?: string
}

export type DeleteConstructionSiteResponse = boolean

export const deleteConstructionSite = async (params: DeleteConstructionSiteParam): Promise<CustomResponse<DeleteConstructionSiteResponse>> => {
    try {
        const { siteId } = params
        if (siteId == undefined) {
            throw {
                error: '現場IDがありません。',
            } as CustomResponse
        }

        const result = await _deleteSite(siteId)
        if (result.error) {
            throw {
                error: result.error,
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetConstructionSiteForEditParam = {
    siteId?: string
    myCompanyId?: string
}

export type GetConstructionSiteForEditResponse = SiteEditUIType | undefined

export const toSiteEditUIType = (site?: SiteType): SiteEditUIType => {
    const _date = site?.meetingDate ?? site?.siteDate ?? site?.startDate
    return {
        ...site,
        date: _date ? toCustomDateFromTotalSeconds(_date) : _date,
        startTime: site?.startDate ? toCustomDateFromTotalSeconds(site?.startDate) : site?.startDate,
        endTime: site?.endDate ? toCustomDateFromTotalSeconds(site?.endDate) : site?.endDate,
        meetingTime: site?.meetingDate ? toCustomDateFromTotalSeconds(site?.meetingDate) : site?.meetingDate,
        updatedAt: site?.updatedAt,
    } as SiteEditUIType
}

export const getConstructionSiteForEdit = async (params: GetConstructionSiteForEditParam): Promise<CustomResponse<GetConstructionSiteForEditResponse>> => {
    try {
        const { siteId, myCompanyId } = params
        if (siteId == undefined) {
            throw {
                error: '現場IDがありません。',
            } as CustomResponse
        }

        const result = await _getSite({
            siteId,
            options: {
                construction: {
                    contract: {
                        orderDepartments: true,
                        receiveDepartments: true,
                    },
                    project: true,
                    displayName: true,
                    constructionRelation: {
                        params: {
                            companyId: myCompanyId,
                        },
                    },
                },
            },
        })
        if (result.error) {
            throw {
                error: result.error,
            }
        }
        return Promise.resolve({
            success: toSiteEditUIType(result.success),
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetSiteDetailParam = {
    siteId?: string
    myCompanyId?: string
    myWorkerId?: string
    requestId?: string
}

export type GetSiteDetailResponse =
    | {
          site?: SiteCLType
          request?: RequestCLType
      }
    | undefined

export const getSiteDetail = async (params: GetSiteDetailParam): Promise<CustomResponse<GetSiteDetailResponse>> => {
    try {
        const { siteId, myCompanyId, myWorkerId, requestId } = params
        if (siteId == undefined) {
            throw {
                error: '現場IDがありません。',
            } as CustomResponse
        }

        if (myWorkerId == undefined) {
            throw {
                error: '認証情報がありません。',
            } as CustomResponse
        }

        if (myCompanyId == undefined) {
            throw {
                error: '自社IDがありません。',
            } as CustomResponse
        }
        let rtnObj = {} as GetSiteDetailResponse
        if (requestId && requestId != 'no-id') {
            const requestResult = await _getRequest({
                requestId: requestId,
                options: {
                    company: {
                        companyPartnership: {
                            params: {
                                companyId: myCompanyId,
                            },
                        },
                    },
                    requestMeter: true,
                },
            })
            if (requestResult.error) {
                throw {
                    error: requestResult.error,
                }
            }
            rtnObj = { ...rtnObj, request: toRequestCLType(requestResult.success) }
        }

        const result = await _getSite({
            siteId,
            options: {
                siteRelation: {
                    params: {
                        companyId: myCompanyId,
                    },
                },
                siteNameData: true,
                managerWorker: {
                    account: true,
                },
                construction: {
                    constructionRelation: { params: { companyId: myCompanyId } },
                    displayName: true,
                    constructionMeter: { params: { companyId: myCompanyId } },
                    project: true,
                    contract: {
                        receiveDepartments: true,
                    },
                },
                siteCompanies: {
                    companyPartnership: {
                        params: {
                            companyId: myCompanyId,
                        },
                    },
                    params: {
                        types: ['order', 'manager'],
                    },
                },
            },
        })
        if (result.error) {
            throw {
                error: result.error,
            }
        }
        const site = result.success
        const meterResult = await _getSiteMeterOfTargetSite({
            siteId,
            companyId: myCompanyId,
        })
        if (meterResult.error) {
            throw {
                error: meterResult.error,
            }
        }
        rtnObj = { ...rtnObj, site: toSiteCLType({ ...site, siteMeter: meterResult.success }) }
        return Promise.resolve({
            success: rtnObj,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetWSiteDetailParam = {
    siteId?: string
    myCompanyId?: string
    myWorkerId?: string
}

export type GetWSiteDetailResponse =
    | {
          site?: SiteCLType
          attendances?: AttendanceCLType[]
      }
    | undefined

export const getWSiteDetail = async (params: GetWSiteDetailParam): Promise<CustomResponse<GetWSiteDetailResponse>> => {
    try {
        const { siteId, myCompanyId, myWorkerId } = params
        if (siteId == undefined) {
            throw {
                error: '現場IDがありません。',
            } as CustomResponse
        }

        if (myWorkerId == undefined) {
            throw {
                error: '認証情報がありません。',
            } as CustomResponse
        }

        if (myCompanyId == undefined) {
            throw {
                error: '自社IDがありません。',
            } as CustomResponse
        }
        const [siteResult, attendancesResult] = await Promise.all([
            _getSite({
                siteId,
                options: {
                    siteRelation: {
                        params: {
                            companyId: myCompanyId,
                        },
                    },
                    siteNameData: true,
                    managerWorker: {
                        account: true,
                    },
                },
            }),
            _getAttendanceListOfTargetSiteAndWorker({
                siteId,
                workerId: myWorkerId,
            }),
        ])
        if (attendancesResult.error) {
            throw {
                error: attendancesResult.error,
                errorCode: 'GET_ATTENDANCES_ERROR',
            }
        }
        if (siteResult.error) {
            throw {
                error: siteResult.error,
            }
        }
        const site = siteResult.success
        const rtnObj = { site: toSiteCLType({ ...site }), attendances: attendancesResult.success?.map((att) => toAttendanceCLType(att)) }
        return Promise.resolve({
            success: rtnObj,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
