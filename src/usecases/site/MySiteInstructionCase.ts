import { SiteCLType, SiteType, toSiteCLType } from '../../models/site/Site'
import { SiteEditUIType } from '../../screens/adminSide/site/editSite/EditSite'
import { _getArrangementListOfTargetConstruction, _getArrangementListOfTargetSite } from '../../services/arrangement/ArrangementService'
import { _getConstruction, _getConstructionRelationType } from '../../services/construction/ConstructionService'
import { _createSite, _deleteSite, _getSite, _getSiteListOfTargetConstruction, _getSiteListOfTargetConstructionAndDate, _getSiteNameData } from '../../services/site/SiteService'
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
import { InstructionModel } from '../../models/instruction/Instruction'
import { _createInstruction, _getInstructionListByConstructionId, _getInstructionSites, _updateInstruction } from '../../services/instruction/InstructionService'
import { getUuidv4 } from '../../utils/Utils'
import isEmpty from 'lodash/isEmpty'
import { _getProject, _updateProject } from '../../services/project/ProjectService'
import { toSiteEditUIType } from './MySiteCase'

export type WriteConstructionSiteInstructionParam = {
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
    contractId?: string
    /**
     * 効率化のため
     */
    constructionRelation?: ConstructionRelationType
    projectId?: string
}

export type WriteConstructionSiteInstructionResponse = 'update' | 'create' | 'siteAlreadyExistsOnTheDay'

export const writeConstructionSiteInstruction = async (params: WriteConstructionSiteInstructionParam): Promise<CustomResponse<WriteConstructionSiteInstructionResponse>> => {
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
            contractId,
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
        const siteDate = meetingDate ? getYYYYMMDDTotalSeconds(toCustomDateFromTotalSeconds(meetingDate)) : date ? getYYYYMMDDTotalSeconds(date) : undefined

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
        const constructionResult = await _getConstruction({ constructionId })
        if (constructionResult.error) {
            throw {
                error: constructionResult.error,
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

        const instructionType = 'site'
        const instructionListResult = await _getInstructionListByConstructionId({ constructionId, instructionType })
        let isExist = false
        let existInstruction = undefined
        if (instructionListResult.success?.items != undefined) {
            for (const instruction of instructionListResult?.success?.items) {
                if (instruction.instructionInfo?.siteId == siteId) {
                    isExist = true
                    existInstruction = instruction
                }
            }
        }
        const originInfo = await _getSite({ siteId })
        if (isExist) {
            const newSite = {
                siteId: siteId,
                constructionId,
                startDate,
                endDate,
                siteDate,
                requiredNum,
                managerWorkerId,
                address,
                belongings,
                remarks,
                //meetingDateがundefinedではない場合、{meetingDate: meetingDate}を追加する
                ...(meetingDate ? { meetingDate: meetingDate } : {}),
            } as SiteType
            const newInstruction = {
                instructionId: existInstruction?.instructionId,
                instructionType: isEmpty(originInfo) ? 'siteCreate' : 'site',
                targetRequestId: existInstruction?.targetRequestId,
                contractId: existInstruction?.contractId,
                instructionStatus: 'edited',
                instructionInfo: newSite,
                originInfo: existInstruction?.originInfo,
            } as InstructionModel

            const result = await _updateInstruction(newInstruction)
            if (result.error) {
                throw {
                    error: '指示の更新に失敗しました。',
                } as CustomResponse
            }
            return Promise.resolve({
                success: 'update',
            })
        } else {
            if (isEmpty(originInfo)) {
                const newSiteId = getUuidv4()
                const newSite: SiteType = {
                    siteId: newSiteId,
                    constructionId,
                    siteDate,
                    startDate,
                    endDate,
                    requiredNum,
                    managerWorkerId,
                    address,
                    belongings,
                    remarks,
                    //meetingDateがundefinedではない場合、{meetingDate: meetingDate}を追加する
                    ...(meetingDate ? { meetingDate: meetingDate } : {}),
                }
                const newInstruction = {
                    instructionId: getUuidv4(),
                    instructionType: 'siteCreate',
                    targetRequestId: newSiteId,
                    contractId: contractId,
                    instructionStatus: 'created',
                    instructionInfo: newSite,
                    originInfo: originInfo.success,
                } as InstructionModel

                const result = await _createInstruction(newInstruction)
                if (result.error) {
                    throw {
                        error: '指示の作成に失敗しました。',
                    } as CustomResponse
                }
                return Promise.resolve({
                    success: 'create',
                })
            } else {
                const newSite: SiteType = {
                    siteId: siteId,
                    constructionId,
                    siteDate,
                    startDate,
                    endDate,
                    //meetingDateがundefinedではない場合、{meetingDate: meetingDate}を追加する
                    ...(meetingDate ? { meetingDate: meetingDate } : {}),
                    requiredNum,
                    managerWorkerId,
                    address,
                    belongings,
                    remarks,
                }
                const newInstruction = {
                    instructionId: getUuidv4(),
                    instructionType: 'site',
                    targetRequestId: siteId,
                    contractId: contractId,
                    instructionStatus: 'created',
                    instructionInfo: newSite,
                    originInfo: originInfo.success,
                } as InstructionModel

                const result = await _createInstruction(newInstruction)
                if (result.error) {
                    throw {
                        error: '指示の作成に失敗しました。',
                    } as CustomResponse
                }
                return Promise.resolve({
                    success: 'create',
                })
            }
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type DeleteConstructionSiteInstructionParam = {
    siteId?: string
    contractId?: string
}

export type DeleteConstructionSiteInstructionResponse = boolean

export const createDeletingSiteInstruction = async (params: DeleteConstructionSiteInstructionParam): Promise<CustomResponse<DeleteConstructionSiteInstructionResponse>> => {
    try {
        const { siteId, contractId } = params
        if (siteId == undefined || contractId == undefined) {
            throw {
                error: 'IDがありません。',
            } as CustomResponse
        }

        const instructionType = 'siteDelete'
        const originSite = await _getSite({ siteId })
        const newInstruction = {
            instructionId: getUuidv4(),
            instructionType: instructionType,
            targetRequestId: siteId,
            contractId: contractId,
            instructionStatus: 'created',
            instructionInfo: originSite.success,
            originInfo: originSite.success,
        } as InstructionModel

        const result = await _createInstruction(newInstruction)
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

export type GetConstructionSiteInstructionForEditParam = {
    siteId?: string
}

export type GetConstructionSiteInstructionForEditResponse = SiteEditUIType | undefined

export const getConstructionSiteInstructionForEdit = async (params: GetConstructionSiteInstructionForEditParam): Promise<CustomResponse<GetConstructionSiteInstructionForEditResponse>> => {
    try {
        const { siteId } = params
        if (siteId == undefined) {
            throw {
                error: '現場IDがありません。',
            } as CustomResponse
        }

        const result = await _getSite({ siteId })
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

export const getSiteInstructionDetail = async (params: GetSiteDetailParam): Promise<CustomResponse<GetSiteDetailResponse>> => {
    try {
        const { siteId, myCompanyId, myWorkerId, requestId } = params
        if (siteId == undefined) {
            throw {
                error: '現場IDがありません。',
                errorCode: 'GET_SITE_INSTRUCTION_DETAIL_ERROR',
            } as CustomResponse
        }

        if (myWorkerId == undefined) {
            throw {
                error: '認証情報がありません。',
                errorCode: 'GET_SITE_INSTRUCTION_DETAIL_ERROR',
            } as CustomResponse
        }

        if (myCompanyId == undefined) {
            throw {
                error: '自社IDがありません。',
                errorCode: 'GET_SITE_INSTRUCTION_DETAIL_ERROR',
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
                    errorCode: requestResult.error + ',GET_SITE_INSTRUCTION_DETAIL_ERROR',
                }
            }
            rtnObj = { ...rtnObj, request: toRequestCLType(requestResult.success) }
        }
        const result = await _getSite({
            siteId,
            options: {
                construction: {
                    constructionRelation: { params: { companyId: myCompanyId } },
                    contract: {
                        orderDepartments: true,
                        receiveDepartments: true,
                    },
                },
                isInstruction: true,
            },
        })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.error + ',GET_SITE_INSTRUCTION_DETAIL_ERROR',
            }
        }
        const site = result.success
        rtnObj = { ...rtnObj, site: toSiteCLType({ ...site }) }
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
