import { ConstructionCLType, ConstructionModel, ConstructionType, toConstructionCLType } from '../../models/construction/Construction'
import { InstructionCLType, InstructionModel, InstructionType, toInstructionCLType } from '../../models/instruction/Instruction'
import { WorkerType } from '../../models/worker/Worker'
import { MyConstructionDetailUIType } from '../../screens/adminSide/construction/constructionDetail/ConstructionDetail'
import { _getCompany } from '../../services/company/CompanyService'
import { _getConstructionRelationType, _getConstruction } from '../../services/construction/ConstructionService'
import { _getWorker } from '../../services/worker/WorkerService'
import { MAX_PROJECT_SPAN } from '../../utils/Constants'
import {
    combineTimeAndDay,
    CustomDate,
    dayBaseText,
    dayBaseTextWithoutDate,
    getDailyStartTime,
    getYYYYMMDDTotalSeconds,
    isHoliday,
    nextDay,
    toCustomDateFromTotalSeconds,
} from '../../models/_others/CustomDate'
import { getUuidv4, isNoValueObject } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getMyPartnershipCompanies, getMyPartnershipCompaniesWithMyCompany } from '../company/CompanyListCase'
import { calculateConstructionDays } from './CommonConstructionCase'
import { countConstructionArrangements } from './ConstructionListCase'
import { DEFAULT_SITE_END_TIME, DEFAULT_SITE_START_TIME, THEME_COLORS, WINDOW_WIDTH } from '../../utils/Constants'
import { _getSiteListOfTargetConstruction, _createSite } from '../../services/site/SiteService'
import { SiteType } from '../../models/site/Site'
import { CompanyCLType, CompanyType } from '../../models/company/Company'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _getContract, _getContractOfTargetConstruction, _getSubContractOfTargetConstruction } from '../../services/contract/ContractService'
import { _getProject, _getProjectOfTargetConstruction, _getProjectOfTargetContract, _updateProject } from '../../services/project/ProjectService'
import { ProjectCLType, toProjectCLType } from '../../models/project/Project'
import { WeekOfDay, newDate } from '../../utils/ext/Date.extensions'
import {
    GetInstructionListByConstructionIdParam,
    _approveInstruction,
    _createInstruction,
    _deleteTargetInstruction,
    _getInstruction,
    _getInstructionListByConstructionId,
    _getInstructionSites,
    _unApproveInstruction,
    _updateInstruction,
} from '../../services/instruction/InstructionService'
import { InstructionListCLType } from '../../models/instruction/InstructionListType'
import { toSiteDateInfoType } from '../site/SiteListCase'
import { separateListByDay } from '../CommonCase'
import { SiteDateObjectUIType } from '../../screens/adminSide/construction/constructionDetail/ConstructionSiteList'
import { SiteListCLType } from '../../models/site/SiteListType'
import { deleteFieldParam } from '../../services/firebase/FirestoreService'
import { SiteDateInfoType } from '../../components/organisms/site/SiteDateBox'
import { HolidayType } from '../../services/_others/HolidaySercvice'

export type WriteMyConstructionInstructionParam = {
    instructionId?: string
    constructionId?: string
    updateWorkerId?: string
    myCompanyId?: string
    contractId?: string
    construction?: ConstructionCLType
    project?: ProjectCLType
}

export type WriteMyConstructionInstructionResponse = 'update' | 'create'

export const writeMyConstructionInstruction = async (params: WriteMyConstructionInstructionParam): Promise<CustomResponse<WriteMyConstructionInstructionResponse>> => {
    try {
        const { instructionId, constructionId, contractId, project, myCompanyId, updateWorkerId, construction } = params
        if (project?.startDate == undefined || project.endDate == undefined) {
            throw {
                error: '情報が足りません。',
                errorCode: 'WRITE_MY_CONSTRUCTION_INSTRUCTION_ERROR',
            } as CustomResponse
        }
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
                errorCode: 'WRITE_MY_CONSTRUCTION_INSTRUCTION_ERROR',
            } as CustomResponse
        }
        if (constructionId == undefined || contractId == undefined || project?.projectId == undefined) {
            throw {
                error: 'idがありません。',
                errorCode: 'WRITE_MY_CONSTRUCTION_INSTRUCTION_ERROR',
            } as CustomResponse
        }
        if (project.startDate.totalSeconds > project.endDate.totalSeconds) {
            throw {
                error: '工期開始は工期終了より以前にする必要があります。',
                errorCode: 'WRITE_MY_CONSTRUCTION_INSTRUCTION_ERROR',
            } as CustomResponse
        }

        if (project.endDate.totalSeconds > nextDay(project.startDate, MAX_PROJECT_SPAN).totalSeconds) {
            throw {
                error: `工期終了は開始から${MAX_PROJECT_SPAN}日以内にする必要があります。`,
                errorCode: 'WRITE_MY_CONSTRUCTION_INSTRUCTION_ERROR',
            } as CustomResponse
        }
        const sitesResult = await _getSiteListOfTargetConstruction({
            constructionId,
        })
        if (sitesResult.error) {
            throw {
                error: sitesResult.error,
                errorCode: sitesResult.errorCode,
            }
        }
        if (
            sitesResult.success?.items?.some(
                (site) => site?.startDate && project.startDate && getDailyStartTime(toCustomDateFromTotalSeconds(site?.startDate)).totalSeconds < getDailyStartTime(project.startDate)?.totalSeconds,
            ) ||
            sitesResult.success?.items?.some(
                (site) => site?.endDate && project.endDate && getDailyStartTime(toCustomDateFromTotalSeconds(site?.endDate)).totalSeconds > getDailyStartTime(project.endDate)?.totalSeconds,
            )
        ) {
            throw {
                error: '工事の工期は作成された現場の期間内にする必要があります。',
                errorCode: 'WRITE_MY_CONSTRUCTION_INSTRUCTION_ERROR',
            }
        }

        //工期が変更されていた場合は、工期を直接変更する
        if (project?.projectId != undefined) {
            const getResult = await _getProject({ projectId: project.projectId })
            if (
                project?.startDate != undefined &&
                project?.endDate != undefined &&
                (getResult.success?.startDate != project?.startDate.totalSeconds || getResult.success.endDate != project.endDate.totalSeconds)
            ) {
                const result = await _updateProject({
                    projectId: project.projectId,
                    startDate: project.startDate.totalSeconds,
                    endDate: project.endDate.totalSeconds,
                })
                if (result.error) {
                    throw {
                        error: result.error,
                        errorCode: result.errorCode,
                    }
                }
            }
        }

        const exist = await _getConstruction({ constructionId })
        const newConstruction = {
            ...construction,
            constructionId,
            updateWorkerId,
            contractId,
            projectId: project.projectId,
            offDaysOfWeek: construction?.offDaysOfWeek as string[] | undefined,
            otherOffDays: construction?.otherOffDays?.map((day) => day.totalSeconds),
            //siteMeetingTimeがundefinedではない場合、{siteMeetingTime: siteMeetingTime}を追加する
            ...(construction?.siteMeetingTime?.totalSeconds ? { siteMeetingTime: construction?.siteMeetingTime?.totalSeconds } : {}),
            siteStartTime: construction?.siteStartTime?.totalSeconds,
            siteEndTime: construction?.siteEndTime?.totalSeconds,
            siteStartTimeIsNextDay: construction?.siteStartTimeIsNextDay,
            siteEndTimeIsNextDay: construction?.siteEndTimeIsNextDay,
        } as ConstructionModel

        if (!isNoValueObject(exist.success)) {
            const relationResult = await _getConstructionRelationType({
                companyId: myCompanyId,
                constructionId,
            })
            if (relationResult.error) {
                throw {
                    error: `relationResult: ${relationResult.error}`,
                    errorCode: 'WRITE_MY_CONSTRUCTION_INSTRUCTION_ERROR',
                }
            }
            if (relationResult.success != 'manager' && relationResult.success != 'fake-company-manager' && relationResult.success != 'order-children') {
                throw {
                    error: '工事の作成・編集権限がありません。',
                    errorCode: 'WRITE_MY_CONSTRUCTION_INSTRUCTION_ERROR',
                }
            }
            const targetRequestId = constructionId
            const instructionType = 'construction'
            const existInstruction = await _getInstruction({ targetRequestId, instructionType })

            if (!isNoValueObject(existInstruction.success)) {
                const newInstruction = {
                    instructionId: existInstruction.success?.instructionId,
                    instructionType: 'construction',
                    targetRequestId: constructionId,
                    contractId: contractId,
                    instructionStatus: 'edited',
                    instructionInfo: newConstruction,
                    originInfo: existInstruction.success?.originInfo,
                } as InstructionModel
                const result = await _updateInstruction(newInstruction)
                if (result.error) {
                    throw {
                        error: '指示のアップデートに失敗しました。',
                        errorCode: 'WRITE_MY_CONSTRUCTION_INSTRUCTION_ERROR',
                    } as CustomResponse
                }
                return Promise.resolve({
                    success: 'update',
                })
            } else {
                const newInstruction = {
                    instructionId: instructionId,
                    instructionType: 'construction',
                    targetRequestId: constructionId,
                    contractId: contractId,
                    instructionStatus: 'created',
                    instructionInfo: newConstruction,
                    originInfo: existInstruction.success?.originInfo,
                } as InstructionModel
                const result = await _createInstruction(newInstruction)
                if (result.error) {
                    throw {
                        error: '指示の作成に失敗しました。',
                        errorCode: 'WRITE_MY_CONSTRUCTION_INSTRUCTION_ERROR',
                    } as CustomResponse
                }
                return Promise.resolve({
                    success: 'create',
                })
            }
        } else {
            throw {
                error: '指示の作成に失敗しました。',
                errorCode: 'WRITE_MY_CONSTRUCTION_INSTRUCTION_ERROR',
            } as CustomResponse
        }
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetConstructionSelectableCompaniesParam = {
    myCompanyId?: string
}

export type GetConstructionSelectableCompaniesResponse = CompanyCLType[]

export const getConstructionSelectableCompanies = async (params: GetConstructionSelectableCompaniesParam): Promise<CustomResponse<GetConstructionSelectableCompaniesResponse>> => {
    try {
        const { myCompanyId } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        const result = await getMyPartnershipCompaniesWithMyCompany({ myCompanyId })
        if (result.error || result.success == undefined) {
            throw {
                error: '顧客/取引先または自社情報を取得できません。',
            } as CustomResponse
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetMyTotalConstructionParam = {
    id?: string
}

export type GetMyTotalConstructionResponse =
    | ({
          id?: string
      } & ConstructionCLType)
    | undefined

export const getMyTotalConstructionInstruction = async (params: GetMyTotalConstructionParam): Promise<CustomResponse<GetMyTotalConstructionResponse>> => {
    try {
        const { id } = params
        if (id == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }
        const instructionResult = await _getInstruction({ targetRequestId: id, instructionType: 'construction' })
        if (instructionResult.error) {
            throw {
                error: '工事がありません。',
            } as CustomResponse
        }
        const construction = instructionResult.success?.instructionInfo
        const response = {
            id,
            ...toConstructionCLType(construction),
        }

        return Promise.resolve({
            success: response,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetProjectFromContractIdParam = {
    contractId?: string
}

export type GetProjectFromContractIdResponse = ProjectCLType | undefined

export const getProjectFromContractId = async (params: GetProjectFromContractIdParam): Promise<CustomResponse<GetProjectFromContractIdResponse>> => {
    try {
        const { contractId } = params
        if (contractId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }
        const projectResult = await _getProjectOfTargetContract({
            contractId,
        })
        if (projectResult.error) {
            throw {
                error: projectResult.error,
            }
        }
        return Promise.resolve({
            success: toProjectCLType(projectResult.success),
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetMyConstructionDetailParam = {
    constructionId?: string
    myCompanyId?: string
    holidays?: HolidayType
}

export type GetMyConstructionDetailResponse =
    | (ConstructionCLType & {
          dayCount: number | undefined
      })
    | undefined

export const getMyConstructionDetail = async (params: GetMyConstructionDetailParam): Promise<CustomResponse<GetMyConstructionDetailResponse>> => {
    try {
        const { constructionId, myCompanyId, holidays } = params
        if (constructionId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }

        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }
        const constructionResult = await _getConstruction({
            constructionId,
            options: {
                sites: true,
                displayName: true,
                constructionRelation: {
                    params: {
                        companyId: myCompanyId,
                    },
                },
                updateWorker: {
                    company: true,
                },
                contract: {
                    orderCompany: {
                        companyPartnership: {
                            params: {
                                companyId: myCompanyId,
                            },
                        },
                    },
                    receiveCompany: {
                        companyPartnership: {
                            params: {
                                companyId: myCompanyId,
                            },
                        },
                    },
                    superConstruction: {
                        displayName: true,
                        constructionRelation: {
                            params: {
                                companyId: myCompanyId,
                            },
                        },
                    },
                },
                constructionMeter: { params: { companyId: myCompanyId } },
                subContract: {
                    orderCompany: {
                        companyPartnership: {
                            params: {
                                companyId: myCompanyId,
                            },
                        },
                    },
                    receiveCompany: {
                        companyPartnership: {
                            params: {
                                companyId: myCompanyId,
                            },
                        },
                    },
                },
                project: true,
            },
        })
        if (constructionResult.error) {
            throw {
                error: '工事がありません。',
            } as CustomResponse
        }
        const construction = constructionResult.success
        const dayCount =
            construction?.project?.startDate &&
            construction?.project?.endDate &&
            calculateConstructionDays(
                toCustomDateFromTotalSeconds(construction?.project.startDate),
                toCustomDateFromTotalSeconds(construction?.project.endDate),
                construction.offDaysOfWeek,
                construction.otherOffDays?.map((day) => toCustomDateFromTotalSeconds(day)),
                holidays,
            )
        return Promise.resolve({
            success: { ...toConstructionCLType(construction ?? {}), dayCount },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type WriteSitesForSpanParam = {
    constructionId?: string
    startDate?: CustomDate
    endDate?: CustomDate
    offDaysOfWeek?: WeekOfDay[]
    otherOffDays?: CustomDate[]
    holidays: { [x: string]: string }
}

export const writeSitesForSpan = async (params: WriteSitesForSpanParam): Promise<CustomResponse<number>> => {
    try {
        const { constructionId, startDate, endDate, offDaysOfWeek, otherOffDays, holidays } = params

        if (constructionId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }
        if (startDate == undefined) {
            throw {
                error: '追加する最初の日が足りません。',
            } as CustomResponse
        }
        if (endDate == undefined) {
            throw {
                error: '追加する最後の日が足りません。',
            } as CustomResponse
        }

        const constructionResult = await _getConstruction({ constructionId, options: { project: true } })
        if (constructionResult.error) {
            throw {
                error: '工事がありません。',
            } as CustomResponse
        }
        const construction = constructionResult.success

        if (
            (construction?.project?.startDate && (getDailyStartTime(toCustomDateFromTotalSeconds(construction?.project?.startDate)).totalSeconds ?? 0) > startDate.totalSeconds) ||
            (construction?.project?.endDate && (getDailyStartTime(nextDay(toCustomDateFromTotalSeconds(construction?.project?.endDate), 1)).totalSeconds ?? Infinity) < endDate.totalSeconds)
        ) {
            throw {
                error: '作成する現場は工事の工期内にする必要があります。',
                errorCode: 'OUT_OF_RANGE',
            }
        }

        const siteMeetingTime: number | undefined = construction?.siteMeetingTime
        const siteStartTime: number = construction?.siteStartTime ?? DEFAULT_SITE_START_TIME.totalSeconds
        const siteEndTime: number = construction?.siteEndTime ?? DEFAULT_SITE_END_TIME.totalSeconds

        const allSitesResult = await _getSiteListOfTargetConstruction({ constructionId })
        if (allSitesResult.error) {
            throw {
                error: '既存の現場取得に失敗しました。',
            } as CustomResponse
        }

        const allSiteDays: CustomDate[] = []
        allSitesResult.success?.items?.forEach((site: SiteType) => {
            if (site.startDate) allSiteDays.push(toCustomDateFromTotalSeconds(site.startDate) as CustomDate)
        })

        //00:00.00 にする
        let workDate: CustomDate = newDate({ year: startDate.year, month: startDate.month, day: startDate.day, hour: 0, minute: 0, second: 0 }).toCustomDate()
        let createCount = 0
        for (;;) {
            if (workDate.totalSeconds > endDate.totalSeconds) {
                break
            }

            const checkEmptyResult = await checkEmptyDay({ offDaysOfWeek, otherOffDays, targetDay: workDate, allSiteDays, holidays })
            if (checkEmptyResult.error) {
                throw {
                    error: '現場を設定可能な日の取得に失敗しました。',
                } as CustomResponse
            }

            if (checkEmptyResult.success == false) {
                workDate = nextDay(workDate, 1)
                continue
            }

            const meetingDate = siteMeetingTime ? combineTimeAndDay(toCustomDateFromTotalSeconds(siteMeetingTime), workDate)?.totalSeconds : undefined
            //現場作成
            const site: SiteType = {
                siteId: getUuidv4(),
                constructionId,
                startDate: combineTimeAndDay(toCustomDateFromTotalSeconds(siteStartTime), workDate)?.totalSeconds,
                endDate: combineTimeAndDay(toCustomDateFromTotalSeconds(siteEndTime), workDate)?.totalSeconds,
                siteDate: getDailyStartTime(workDate).totalSeconds,
                meetingDate,
                requiredNum: construction?.siteRequiredNum,
                address: construction?.siteAddress,
                belongings: construction?.siteBelongings,
                remarks: construction?.siteRemarks,
            }

            const siteResult = await _createSite(site)
            if (siteResult.error) {
                throw {
                    error: '現場の作成に失敗しました。',
                } as CustomResponse
            }
            createCount += 1
            workDate = nextDay(workDate, 1)
        }

        return Promise.resolve({
            success: createCount,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

type CheckEmptyDayParam = {
    offDaysOfWeek: WeekOfDay[] | undefined
    otherOffDays: CustomDate[] | undefined
    targetDay: CustomDate
    allSiteDays: CustomDate[]
    holidays: { [x: string]: string }
}

const checkEmptyDay = async (param: CheckEmptyDayParam): Promise<CustomResponse> => {
    try {
        const { offDaysOfWeek, otherOffDays, targetDay, allSiteDays, holidays } = param

        let hitFlag = false

        //すでに現場があるか
        allSiteDays.forEach((tempDay) => {
            if (dayBaseText(tempDay) == dayBaseText(targetDay)) {
                hitFlag = true
            }
        })

        if (hitFlag) {
            return Promise.resolve({
                success: false,
            })
        }

        //その日は定休日か
        hitFlag = false
        if (offDaysOfWeek != undefined) {
            offDaysOfWeek.forEach((tempDay) => {
                if (tempDay == targetDay.dayOfWeekText) {
                    hitFlag = true
                }
                //祝日
                if (tempDay == '祝' && isHoliday(targetDay, holidays) != undefined) {
                    hitFlag = true
                }
            })

            if (hitFlag) {
                return Promise.resolve({
                    success: false,
                })
            }
        }

        //その日はその他の休日と一致するか
        hitFlag = false
        if (otherOffDays != undefined) {
            otherOffDays.forEach((tempDay) => {
                if (dayBaseText(tempDay) == dayBaseText(targetDay)) {
                    hitFlag = true
                }
            })

            if (hitFlag) {
                return Promise.resolve({
                    success: false,
                })
            }
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetInstructionParam = {
    targetRequestId: string
    instructionType: InstructionType
    instructionId?: string
    holidays?: HolidayType
}

export type GetInstructionResponse = InstructionCLType | undefined

export const getTargetInstruction = async (params: GetInstructionParam): Promise<CustomResponse<GetInstructionResponse>> => {
    try {
        const { targetRequestId, instructionType, instructionId, holidays } = params
        if (targetRequestId == undefined || instructionType == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }

        const instructionResult = await _getInstruction({
            targetRequestId,
            instructionType,
        })
        if (instructionResult.error) {
            throw {
                error: '指示がありません。',
            } as CustomResponse
        }
        const instructionDayCount =
            instructionResult.success?.instructionInfo?.startDate &&
            instructionResult.success?.instructionInfo.endDate &&
            calculateConstructionDays(
                toCustomDateFromTotalSeconds(instructionResult.success?.instructionInfo?.startDate),
                toCustomDateFromTotalSeconds(instructionResult.success?.instructionInfo?.endDate),
                instructionResult.success?.instructionInfo?.offDaysOfWeek,
                instructionResult.success?.instructionInfo?.otherOffDays?.map((day) => toCustomDateFromTotalSeconds(day)),
                holidays,
            )
        return Promise.resolve({
            success: toInstructionCLType(instructionResult.success, instructionDayCount),
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetInstructionSiteResponse = SiteDateObjectUIType | undefined

export const getTargetInstructionSites = async (params: GetInstructionListByConstructionIdParam): Promise<CustomResponse<GetInstructionSiteResponse>> => {
    try {
        const { constructionId, instructionType } = params
        if (constructionId == undefined || instructionType == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }

        const instructionSitesResult = await _getInstructionSites({
            constructionId,
            instructionType,
        })
        const sites = instructionSitesResult.success
        const instructions = instructionSitesResult.detail

        const formedSites: SiteDateInfoType[] | undefined = []
        sites?.items?.forEach((site: SiteType, i: number) => {
            formedSites.push(toSiteDateInfoType(site, undefined, toInstructionCLType(instructions[i])))
        })
        const separatedSites = separateListByDay(formedSites, false)
        if (instructionSitesResult.error) {
            throw {
                error: '指示がありません。',
            } as CustomResponse
        }
        return Promise.resolve({
            success: separatedSites,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type WriteSitesForSpanInstructionParam = {
    contractId?: string
    constructionId?: string
    instructionId?: string
    siteStartTimeIsNextDay?: boolean
    siteEndTimeIsNextDay?: boolean
    startDate?: CustomDate
    endDate?: CustomDate
    offDaysOfWeek?: WeekOfDay[]
    otherOffDays?: CustomDate[]
    holidays: { [x: string]: string }
}

/**
 * 現場まとめて編集依頼
 */
export const writeSitesForSpanInstruction = async (params: WriteSitesForSpanInstructionParam): Promise<CustomResponse<number>> => {
    try {
        const { contractId, constructionId, instructionId, siteStartTimeIsNextDay, siteEndTimeIsNextDay, startDate, endDate, offDaysOfWeek, otherOffDays, holidays } = params

        if (contractId == undefined || constructionId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }
        if (startDate == undefined) {
            throw {
                error: '追加する最初の日が足りません。',
            } as CustomResponse
        }
        if (endDate == undefined) {
            throw {
                error: '追加する最後の日が足りません。',
            } as CustomResponse
        }

        const constructionResult = await _getConstruction({ constructionId, options: { project: true } })
        if (constructionResult.error) {
            throw {
                error: '工事がありません。',
            } as CustomResponse
        }
        const construction = constructionResult.success

        if (
            (construction?.project?.startDate && (getDailyStartTime(toCustomDateFromTotalSeconds(construction?.project?.startDate)).totalSeconds ?? 0) > startDate.totalSeconds) ||
            (construction?.project?.endDate && (getDailyStartTime(nextDay(toCustomDateFromTotalSeconds(construction?.project?.endDate), 1)).totalSeconds ?? Infinity) < endDate.totalSeconds)
        ) {
            throw {
                error: '作成する現場は工事の工期内にする必要があります。',
                errorCode: 'OUT_OF_RANGE',
            }
        }

        const siteMeetingTime: number | undefined = construction?.siteMeetingTime
        const siteStartTime: number = construction?.siteStartTime ?? DEFAULT_SITE_START_TIME.totalSeconds
        const siteEndTime: number = construction?.siteEndTime ?? DEFAULT_SITE_END_TIME.totalSeconds

        const allSitesResult = await _getSiteListOfTargetConstruction({ constructionId })
        if (allSitesResult.error) {
            throw {
                error: '既存の現場取得に失敗しました。',
            } as CustomResponse
        }

        const allSiteDays: CustomDate[] = []
        allSitesResult.success?.items?.forEach((site: SiteType) => {
            if (site.startDate) allSiteDays.push(toCustomDateFromTotalSeconds(site.startDate) as CustomDate)
        })

        // 作成指示の現場も追加する
        const instructionType = 'siteCreate'
        const instructionListResult = await _getInstructionListByConstructionId({ constructionId, instructionType })
        instructionListResult.success?.items?.forEach((instruction: InstructionModel) => {
            if (instruction.instructionInfo?.startDate) allSiteDays.push(toCustomDateFromTotalSeconds(instruction.instructionInfo?.startDate) as CustomDate)
        })

        //00:00.00 にする
        let workDate: CustomDate = newDate({ year: startDate.year, month: startDate.month, day: startDate.day, hour: 0, minute: 0, second: 0 }).toCustomDate()
        let createCount = 0
        for (;;) {
            if (workDate.totalSeconds > endDate.totalSeconds) {
                break
            }

            const checkEmptyResult = await checkEmptyDay({ offDaysOfWeek, otherOffDays, targetDay: workDate, allSiteDays, holidays })
            if (checkEmptyResult.error) {
                throw {
                    error: '現場を設定可能な日の取得に失敗しました。',
                } as CustomResponse
            }

            if (checkEmptyResult.success == false) {
                workDate = nextDay(workDate, 1)
                continue
            }

            const meetingDate = siteMeetingTime ? combineTimeAndDay(toCustomDateFromTotalSeconds(siteMeetingTime), workDate)?.totalSeconds : undefined
            //現場作成
            const site: SiteType = {
                siteId: getUuidv4(),
                constructionId,
                siteDate: getYYYYMMDDTotalSeconds(workDate),
                startDate: combineTimeAndDay(toCustomDateFromTotalSeconds(siteStartTime), nextDay(workDate, siteStartTimeIsNextDay ? 1 : 0))?.totalSeconds,
                endDate: combineTimeAndDay(toCustomDateFromTotalSeconds(siteEndTime), nextDay(workDate, siteEndTimeIsNextDay ? 1 : 0))?.totalSeconds,
                meetingDate,
                requiredNum: construction?.siteRequiredNum,
                address: construction?.siteAddress,
                belongings: construction?.siteBelongings,
                remarks: construction?.siteRemarks,
            }

            const newInstruction = {
                instructionId: instructionId,
                instructionType: 'siteCreate',
                targetRequestId: site.siteId,
                contractId: contractId,
                instructionStatus: 'created',
                instructionInfo: site,
                originInfo: undefined,
            } as InstructionModel
            const result = await _createInstruction(newInstruction)
            if (result.error) {
                throw {
                    error: '指示の作成に失敗しました。',
                } as CustomResponse
            }
            createCount += 1
            workDate = nextDay(workDate, 1)
        }

        return Promise.resolve({
            success: createCount,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type UpdateTargetInstructionParam = {
    instructionId?: string
    targetRequestId?: string
    projectId?: string
    startDate?: number
    endDate?: number
}

export type ApproveInstructionResponse = boolean | undefined

export const approveTargetInstruction = async (params: UpdateTargetInstructionParam): Promise<CustomResponse<ApproveInstructionResponse>> => {
    try {
        const { instructionId, targetRequestId, projectId, startDate, endDate } = params
        if (instructionId == undefined && targetRequestId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }

        const instructionResult = await _approveInstruction(params)
        if (instructionResult.error) {
            throw {
                error: instructionResult.error,
            } as CustomResponse
        }
        if (projectId) {
            const projectResult = await _getProject({
                projectId,
            })
            if (startDate && projectResult.success?.startDate && (getYYYYMMDDTotalSeconds(toCustomDateFromTotalSeconds(projectResult.success?.startDate)) ?? 0) > startDate) {
                console.log(1)
                const updateProjectResult = await _updateProject({
                    projectId: projectResult.success.projectId,
                    startDate: getYYYYMMDDTotalSeconds(toCustomDateFromTotalSeconds(startDate)),
                })
                if (updateProjectResult.error) {
                    throw {
                        error: '案件の工期拡張に失敗しました。',
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
                    }
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

export type UnApproveInstructionResponse = boolean | undefined

export const unApproveTargetInstruction = async (params: UpdateTargetInstructionParam): Promise<CustomResponse<UnApproveInstructionResponse>> => {
    try {
        const { instructionId, targetRequestId } = params
        if (instructionId == undefined && targetRequestId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }

        const instructionResult = await _unApproveInstruction(params)
        if (instructionResult.error) {
            throw {
                error: instructionResult.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type DeleteInstructionResponse = boolean | undefined

export const deleteTargetInstruction = async (params: UpdateTargetInstructionParam): Promise<CustomResponse<DeleteInstructionResponse>> => {
    try {
        const { instructionId } = params
        if (instructionId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }

        const instructionResult = await _deleteTargetInstruction(instructionId)
        if (instructionResult.error) {
            throw {
                error: instructionResult.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
