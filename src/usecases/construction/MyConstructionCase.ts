import { Dispatch } from 'react'
import { ConstructionCLType, ConstructionModel, ConstructionType, toConstructionCLType } from '../../models/construction/Construction'
import { _getCompany } from '../../services/company/CompanyService'
import { _getConstructionRelationType, _createConstruction, _getConstruction, _updateConstruction } from '../../services/construction/ConstructionService'
import { _getWorker } from '../../services/worker/WorkerService'
import { MAX_PROJECT_SPAN } from '../../utils/Constants'
import {
    combineTimeAndDay,
    CustomDate,
    dayBaseText,
    getDailyStartTime,
    getMonthlyFirstDay,
    getYYYYMMDDTotalSeconds,
    isHoliday,
    monthBaseText,
    nextDay,
    nextMonth,
    toCustomDateFromTotalSeconds,
} from '../../models/_others/CustomDate'
import { arrayFieldValue, getUuidv4, isNoValueObject, numberFieldValue, stringFieldValue } from '../../utils/Utils'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getMyPartnershipCompaniesWithMyCompany } from '../company/CompanyListCase'
import { calculateConstructionDays } from './CommonConstructionCase'
import { DEFAULT_SITE_END_TIME, DEFAULT_SITE_START_TIME } from '../../utils/Constants'
import { _getSiteListOfTargetConstruction, _createSite, _deleteSiteForSpan } from '../../services/site/SiteService'
import { SiteType } from '../../models/site/Site'
import { CompanyCLType } from '../../models/company/Company'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _getContract, _getContractOfTargetConstruction, _getSubContractOfTargetConstruction } from '../../services/contract/ContractService'
import { _getProject, _getProjectOfTargetConstruction, _getProjectOfTargetContract, _updateProject } from '../../services/project/ProjectService'
import { ProjectCLType, ProjectType, toProjectCLType } from '../../models/project/Project'
import { WeekOfDay, newDate } from '../../utils/ext/Date.extensions'
import { genKeyName, getCachedData, updateCachedData } from '../CachedDataCase'
import { setDeletedConstructionIds, setNewConstructionIds, setNewConstructionIdsInSiteDate } from '../../stores/CacheSlice'
import cloneDeep from 'lodash/cloneDeep'
import isEmpty from 'lodash/isEmpty'
import { deleteFieldParam } from '../../services/firebase/FirestoreService'
import { ConstructionListCacheType } from '../../screens/adminSide/transaction/ConstructionList'
import { SiteDateType } from '../../models/site/SiteDateType'
import { HolidayType } from '../../services/_others/HolidaySercvice'
import { ContractingProjectConstructionListType } from '../../models/construction/ContractingProjectConstructionListType'
import { MonthlySiteType } from '../../models/site/MonthlySiteType'
import { Create, Update } from '../../models/_others/Common'

export type WriteMyConstructionParam = {
    constructionId?: string
    updateWorkerId?: string
    myCompanyId?: string
    contractId?: string
    construction?: ConstructionCLType
    project?: ProjectType
}

export type WriteMyConstructionResponse = 'update' | 'create'

export const writeMyConstruction = async (params: WriteMyConstructionParam): Promise<CustomResponse<WriteMyConstructionResponse>> => {
    try {
        const { constructionId, contractId, myCompanyId, updateWorkerId, construction, project } = params
        if (project?.startDate == undefined || project.endDate == undefined) {
            throw {
                error: '情報が足りません。',
            } as CustomResponse
        }
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }
        if (constructionId == undefined || contractId == undefined || project.projectId == undefined) {
            throw {
                error: 'idがありません。',
            } as CustomResponse
        }
        if (project.startDate > project.endDate) {
            throw {
                error: '工期開始は工期終了より以前にする必要があります。',
            } as CustomResponse
        }

        if (project.endDate > nextDay(toCustomDateFromTotalSeconds(project.startDate), MAX_PROJECT_SPAN).totalSeconds) {
            throw {
                error: `工期終了は開始から${MAX_PROJECT_SPAN}日以内にする必要があります。`,
            } as CustomResponse
        }
        const sitesResult = await _getSiteListOfTargetConstruction({
            constructionId,
        })
        if (sitesResult.error) {
            throw {
                error: sitesResult.error,
            }
        }
        if (
            sitesResult.success?.items?.some((site) => site?.startDate && project.startDate && getDailyStartTime(toCustomDateFromTotalSeconds(site?.startDate)).totalSeconds < project.startDate) ||
            sitesResult.success?.items?.some((site) => site?.endDate && project.endDate && getDailyStartTime(toCustomDateFromTotalSeconds(site?.endDate)).totalSeconds > project.endDate)
        ) {
            throw {
                error: '工事の工期は作成された現場の期間内にする必要があります。',
            }
        }
        const exist = await _getConstruction({ constructionId })
        const isUpdate = !isNoValueObject(exist.success)

        const newConstruction = {
            ...construction,
            constructionId,
            updateWorkerId,
            contractId,
            projectId: project.projectId,
            offDaysOfWeek: arrayFieldValue({ isUpdate, value: construction?.offDaysOfWeek }),
            otherOffDays: arrayFieldValue({ isUpdate, value: construction?.otherOffDays?.map((day) => day.totalSeconds) }),
            siteMeetingTime: construction?.siteMeetingTime?.totalSeconds,
            siteStartTime: construction?.siteStartTime?.totalSeconds,
            siteEndTime: construction?.siteEndTime?.totalSeconds,
            siteStartTimeIsNextDay: construction?.siteStartTimeIsNextDay,
            siteEndTimeIsNextDay: construction?.siteEndTimeIsNextDay,
            remarks: stringFieldValue({ isUpdate, value: construction?.remarks }),
            requiredWorkerNum: numberFieldValue({ isUpdate, value: construction?.requiredWorkerNum }),
            siteAddress: stringFieldValue({ isUpdate, value: construction?.siteAddress }),
            siteRequiredNum: numberFieldValue({ isUpdate, value: construction?.siteRequiredNum }),
            siteBelongings: stringFieldValue({ isUpdate, value: construction?.siteBelongings }),
            siteRemarks: stringFieldValue({ isUpdate, value: construction?.siteRemarks }),
        } as Update<ConstructionModel>

        if (isUpdate) {
            const relationResult = await _getConstructionRelationType({
                companyId: myCompanyId,
                constructionId,
            })
            if (relationResult.error) {
                throw {
                    error: `relationResult: ${relationResult.error}`,
                }
            }
            if (relationResult.success != 'manager' && relationResult.success != 'fake-company-manager') {
                throw {
                    error: '工事の作成・編集権限がありません。',
                }
            }
            const result = await updateConstruction(newConstruction)
            if (result.error) {
                throw {
                    error: '工事のアップデートに失敗しました。',
                } as CustomResponse
            }
            const projectResult = await _updateProject(project)
            if (projectResult.error) {
                throw {
                    error: '工期のアップデートに失敗しました。',
                } as CustomResponse
            }
            return Promise.resolve({
                success: 'update',
            })
        } else {
            const result = await _createConstruction(newConstruction as Create<ConstructionModel>)

            if (result.error) {
                throw {
                    error: '工事の作成に失敗しました。',
                } as CustomResponse
            }
            const projectResult = await _updateProject(project)
            if (projectResult.error) {
                throw {
                    error: '工期のアップデートに失敗しました。',
                } as CustomResponse
            }
            return Promise.resolve({
                success: 'create',
            })
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

/**
 * @param id - constructionId
 */
export type GetMyTotalConstructionParam = {
    id?: string
}

export type GetMyTotalConstructionResponse =
    | ({
          id?: string
      } & ConstructionCLType)
    | undefined

/**
 * 指定IDの工事を取得してCL変換して返す。
 * @param params GetMyTotalConstructionParam
 * @returns GetMyTotalConstructionResponse
 */
export const getMyTotalConstruction = async (params: GetMyTotalConstructionParam): Promise<CustomResponse<GetMyTotalConstructionResponse>> => {
    try {
        const { id } = params
        if (id == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }
        const constructionResult = await _getConstruction({
            constructionId: id,
            options: {
                contract: {
                    orderDepartments: true,
                    receiveDepartments: true,
                },
            },
        })
        if (constructionResult.error) {
            throw {
                error: '工事がありません。',
            } as CustomResponse
        }
        const construction = constructionResult.success
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
            options: {
                companyContracts: {
                    receiveDepartments: true,
                },
            },
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
    | (ConstructionType & {
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
                project: true,
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
                        contract: {
                            orderDepartments: true,
                        },
                    },
                    orderDepartments: true,
                    receiveDepartments: true,
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
                    orderDepartments: true,
                    receiveDepartments: true,
                },
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
                toCustomDateFromTotalSeconds(construction.project.startDate),
                toCustomDateFromTotalSeconds(construction.project.endDate),
                construction.offDaysOfWeek,
                construction.otherOffDays?.map((day) => toCustomDateFromTotalSeconds(day)),
                holidays,
            )
        return Promise.resolve({
            success: { ...(construction ?? {}), dayCount },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type WriteSitesForSpanParam = {
    constructionId?: string
    siteStartTimeIsNextDay?: boolean
    siteEndTimeIsNextDay?: boolean
    startDate?: CustomDate
    endDate?: CustomDate
    offDaysOfWeek?: WeekOfDay[]
    otherOffDays?: CustomDate[]
    holidays: { [x: string]: string }

    accountId?: string
    myCompanyId?: string
}

export const writeSitesForSpan = async (params: WriteSitesForSpanParam): Promise<CustomResponse<number>> => {
    try {
        const { constructionId, siteStartTimeIsNextDay, siteEndTimeIsNextDay, startDate, endDate, offDaysOfWeek, otherOffDays, holidays, accountId, myCompanyId } = params

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
            if (site.siteDate) allSiteDays.push(toCustomDateFromTotalSeconds(site.siteDate))
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
            const startDate = combineTimeAndDay(toCustomDateFromTotalSeconds(siteStartTime), nextDay(workDate, siteStartTimeIsNextDay ? 1 : 0))?.totalSeconds
            //現場作成
            const site: SiteType = {
                siteId: getUuidv4(),
                constructionId,
                startDate: startDate,
                endDate: combineTimeAndDay(toCustomDateFromTotalSeconds(siteEndTime), nextDay(workDate, siteEndTimeIsNextDay ? 1 : 0))?.totalSeconds,
                meetingDate,
                requiredNum: construction?.siteRequiredNum,
                address: construction?.siteAddress,
                belongings: construction?.siteBelongings,
                remarks: construction?.siteRemarks,
                siteDate: meetingDate ? getYYYYMMDDTotalSeconds(toCustomDateFromTotalSeconds(meetingDate)) : startDate ? getYYYYMMDDTotalSeconds(toCustomDateFromTotalSeconds(startDate)) : undefined,
            }
            await _updateConstructionSiteListCache(site, accountId, myCompanyId, constructionId)
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
type CachedMonthlySiteType = {
    monthlySite: MonthlySiteType
    construction: ConstructionType
}
const _updateConstructionSiteListCache = async (site: SiteType, accountId?: string, myCompanyId?: string, constructionId?: string) => {
    if (site.siteDate == undefined || accountId == undefined || myCompanyId == undefined || constructionId == undefined) return
    let month = getMonthlyFirstDay(toCustomDateFromTotalSeconds(site.siteDate))
    const cachedKey = genKeyName({
        screenName: 'ConstructionSiteList',
        accountId: accountId,
        companyId: myCompanyId as string,
        constructionId: constructionId as string,
        month: month ? monthBaseText(month).replace(/\//g, '-') : '',
    })
    const constructionSiteListCacheData = await getCachedData<CachedMonthlySiteType>(cachedKey)
    if (constructionSiteListCacheData.success && constructionSiteListCacheData.success.monthlySite.sites?.items) {
        constructionSiteListCacheData.success.monthlySite.sites?.items?.push(site)
    }
    await updateCachedData({
        key: cachedKey,
        value: {
            monthlySite: constructionSiteListCacheData.success?.monthlySite,
            construction: constructionSiteListCacheData.success?.construction,
        },
    })
}

export type DeleteSitesForSpanParam = {
    constructionId?: string
    startDate?: CustomDate
    endDate?: CustomDate
}

export const deleteSitesForSpan = async (params: DeleteSitesForSpanParam): Promise<CustomResponse<number>> => {
    try {
        const { constructionId, startDate, endDate } = params

        if (constructionId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }
        if (startDate == undefined) {
            throw {
                error: '削除する最初の日が足りません。',
            } as CustomResponse
        }
        if (endDate == undefined) {
            throw {
                error: '削除する最後の日が足りません。',
            } as CustomResponse
        }
        const deleteResult = await _deleteSiteForSpan({
            constructionId: constructionId,
            startDate: startDate.totalSeconds,
            endDate: endDate.totalSeconds,
        })
        return Promise.resolve({
            success: deleteResult.success,
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

export const checkEmptyDay = async (param: CheckEmptyDayParam): Promise<CustomResponse> => {
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

/**
 * 工事を更新
 * @param param 更新したい工事
 * @returns boolean
 */
export const updateConstruction = async (construction: Update<ConstructionType>): Promise<CustomResponse> => {
    try {
        if (construction.constructionId == undefined) {
            throw {
                error: 'constructionIdがありません',
                errorCode: 'UPDATE_CONSTRUCTION_ERROR',
            }
        }
        const result = await _updateConstruction({ ...construction, siteMeetingTime: construction.siteMeetingTime ?? deleteFieldParam() })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

type WriteNewConstructionToCacheParams = {
    construction?: ConstructionType
    project?: ProjectType
    myCompanyId?: string
    accountId?: string
    date?: number
    contractId?: string
    dispatch?: Dispatch<any>
}

export const writeNewConstructionToCache = async (params: WriteNewConstructionToCacheParams): Promise<CustomResponse<ConstructionListCacheReturnType[]>> => {
    try {
        const { myCompanyId, accountId, construction, project, date, contractId, dispatch } = params

        if (construction?.constructionId === undefined || myCompanyId === undefined || accountId === undefined) {
            throw {
                error: 'Idが設定されていません。',
            }
        }
        if (project?.startDate === undefined || project?.endDate === undefined) {
            throw {
                error: '工期の開始日、または終了日が設定されていません。',
            }
        }
        if (dispatch === undefined) {
            throw {
                error: 'dispatchが設定されていません。',
            }
        }

        let month = getMonthlyFirstDay(toCustomDateFromTotalSeconds(project.startDate))
        let cacheKeys = []
        while (month.totalSeconds <= getMonthlyFirstDay(toCustomDateFromTotalSeconds(project.endDate)).totalSeconds) {
            const cachedKey = genKeyName({
                screenName: 'ConstructionList',
                accountId: accountId as string,
                companyId: myCompanyId as string,
                /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                month: month ? monthBaseText(month).replace(/\//g, '-') : '',
            })
            cacheKeys.push(cachedKey)

            month = nextMonth(month)
        }

        const monthOfSiteDate = date ? monthBaseText(getMonthlyFirstDay(toCustomDateFromTotalSeconds(date))) : undefined

        const results = await Promise.all(
            cacheKeys.map(async (cacheKey): Promise<CustomResponse<ConstructionListCacheReturnType>> => {
                try {
                    const result = await getCachedData<ConstructionListCacheType>(cacheKey)

                    if (result.error && result?.errorCode !== 'FIRST_FETCH') {
                        throw {
                            error: result.error,
                            errorCode: result.errorCode,
                        }
                    }

                    const constructions = result.success?.constructions ?? []
                    const monthlySiteDate = result.success?.monthlySiteDate ?? []

                    const newConstructions = [...constructions, construction]

                    let newMonthlySiteDate: SiteDateType[] | undefined
                    const monthBaseText = cacheKey.substring(cacheKey.length - 7).replace(/-/g, '/')
                    if (monthOfSiteDate !== undefined && monthOfSiteDate === monthBaseText) {
                        const _siteDate = monthlySiteDate.filter((siteDate) => siteDate?.date === date)?.[0]

                        if (_siteDate !== undefined) {
                            const _sites = _siteDate?.sites ?? []
                            _sites.push({
                                constructionId: construction.constructionId,
                                siteDate: date,
                            })
                            _siteDate.sites = _sites

                            const _monthlySiteDate = monthlySiteDate.filter((siteDate) => siteDate?.date !== date)

                            newMonthlySiteDate = [..._monthlySiteDate, _siteDate]
                        } else {
                            const newSiteDate = {
                                companyId: myCompanyId,
                                date,
                                sites: [
                                    {
                                        constructionId: construction.constructionId,
                                        siteDate: date,
                                    },
                                ],
                            } as SiteDateType

                            newMonthlySiteDate = [...monthlySiteDate, newSiteDate]
                        }
                    }

                    const _value = {
                        constructions: newConstructions,
                        monthlySiteDate: newMonthlySiteDate ?? monthlySiteDate,
                        updatedAt: Number(new Date()),
                    } as ConstructionListCacheType

                    const cachedResult = await updateCachedData({ key: cacheKey, value: _value })
                    if (cachedResult.error) {
                        throw {
                            error: cachedResult.error,
                            errorCode: cachedResult.errorCode,
                        }
                    }

                    return Promise.resolve({
                        success: { key: cacheKey, value: cloneDeep(_value) } as ConstructionListCacheReturnType,
                    })
                } catch (error) {
                    return getErrorMessage(error)
                }
            }),
        )

        results.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        })

        // 案件の工事一覧キャッシュ更新
        const contractingProjectConstructionListCacheKey = genKeyName({
            screenName: 'ContractingProjectConstructionList',
            accountId: accountId,
            companyId: myCompanyId as string,
            contractId: contractId as string,
        })
        const result = await getCachedData<ContractingProjectConstructionListType>(contractingProjectConstructionListCacheKey)
        const targetConstruction = result.success?.constructions?.items?.find((cachedConstruction) => cachedConstruction.constructionId == construction.constructionId)
        if (targetConstruction) {
            const newConstructions = result.success?.constructions?.items?.map((item) => {
                if (item.constructionId == construction.constructionId) {
                    item.displayName = item?.project?.name + '/' + construction.name
                    return { ...item, ...construction }
                } else {
                    return item
                }
            })
            if (result?.success?.constructions?.items) {
                result.success.constructions.items = newConstructions
            }
        } else {
            construction.displayName = project.name + '/' + construction.name
            construction.constructionRelation = 'manager'
            ;(construction.constructionMeter = {
                requiredNum: construction.requiredWorkerNum,
                presentNum: 0,
            }),
                result.success?.constructions?.items?.push(construction)
        }
        if (result.success){
            result.success = {
                ...result.success,
                updatedAt: Number(new Date())
            }
        } else {
            construction.displayName = project.name + '/' + construction.name
            construction.constructionRelation = "manager"
            construction.constructionMeter = {
                requiredNum: construction.requiredWorkerNum,
                presentNum: 0
            },
            result.success = {
                constructions: {
                    items: [construction]
                },
                updatedAt: Number(new Date())
            }
        }
        const cachedResult = await updateCachedData({ key: contractingProjectConstructionListCacheKey, value: result.success })
        if (cachedResult.error) {
            throw {
                error: cachedResult.error,
                errorCode: cachedResult.errorCode,
            }
        }
        const cacheBackUp = results.map((result) => result.success).filter((data) => data !== undefined)

        dispatch(setNewConstructionIds([construction?.constructionId]))
        dispatch(setNewConstructionIdsInSiteDate([construction?.constructionId]))

        // 一定時間後に、DBに反映されていると想定してリセット
        setTimeout(() => {
            dispatch(setNewConstructionIds([]))
            dispatch(setNewConstructionIdsInSiteDate([]))
        }, 1000 * 60 * 2)

        return Promise.resolve({
            success: cacheBackUp as ConstructionListCacheReturnType[],
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type ConstructionListCacheReturnType = {
    key: string
    value: ConstructionListCacheType[]
}

type DeleteTargetConstructionsFromCacheParams = {
    constructionIds?: string[]
    myCompanyId?: string
    accountId?: string
    startDate?: CustomDate
    endDate?: CustomDate
    contractId?: string
    dispatch?: Dispatch<any>
}

export const deleteTargetConstructionsFromCache = async (params: DeleteTargetConstructionsFromCacheParams): Promise<CustomResponse<ConstructionListCacheReturnType[]>> => {
    const { constructionIds, myCompanyId, accountId, startDate, endDate, contractId, dispatch } = params
    try {
        if (isEmpty(constructionIds) === undefined || myCompanyId === undefined || accountId === undefined) {
            throw {
                error: 'Idが設定されていません。',
            }
        }
        if (startDate === undefined || endDate === undefined) {
            throw {
                error: '工期の開始日、または終了日が設定されていません。',
            }
        }
        if (dispatch === undefined) {
            throw {
                error: 'dispatchが設定されていません。',
            }
        }

        let month = getMonthlyFirstDay(startDate)
        let cacheKeys = []
        while (month.totalSeconds <= getMonthlyFirstDay(endDate).totalSeconds) {
            const cacheKey = genKeyName({
                screenName: 'ConstructionList',
                accountId: accountId as string,
                companyId: myCompanyId as string,
                /** "/" はKVSのキーに使えない文字のため "-" に変換 */
                month: month ? monthBaseText(month).replace(/\//g, '-') : '',
            })
            cacheKeys.push(cacheKey)

            month = nextMonth(month)
        }

        const results = await Promise.all(
            cacheKeys.map(async (cacheKey): Promise<CustomResponse<ConstructionListCacheReturnType>> => {
                try {
                    const result = await getCachedData<ConstructionListCacheType>(cacheKey)

                    if (result.error) {
                        if (result.error && result?.errorCode !== 'FIRST_FETCH') {
                            return Promise.resolve({
                                success: undefined,
                            })
                        }

                        throw {
                            error: result.error,
                            errorCode: result.errorCode,
                        }
                    }

                    const constructions = result.success?.constructions
                    const monthlySiteDate = result.success?.monthlySiteDate

                    if (constructions === undefined || isEmpty(constructions)) {
                        return Promise.resolve({
                            success: undefined,
                        })
                    }

                    const filteredConstructions = constructions.filter(({ constructionId }) => constructionId && !constructionIds?.includes(constructionId))

                    const _value = { 
                        constructions: filteredConstructions, 
                        monthlySiteDate: monthlySiteDate,
                        updatedAt: Number(new Date()),
                    } as ConstructionListCacheType

                    const cachedResult = await updateCachedData({ key: cacheKey, value: _value })
                    if (cachedResult.error) {
                        throw {
                            error: cachedResult.error,
                            errorCode: cachedResult.errorCode,
                        }
                    }

                    return Promise.resolve({
                        success: { key: cacheKey, value: cloneDeep({ constructions, monthlySiteDate } as ConstructionListCacheType) } as ConstructionListCacheReturnType,
                    })
                } catch (error) {
                    return getErrorMessage(error)
                }
            }),
        )

        results.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        })

        // 案件の工事一覧キャッシュ更新
        const contractingProjectConstructionListCacheKey = genKeyName({
            screenName: 'ContractingProjectConstructionList',
            accountId: accountId,
            companyId: myCompanyId as string,
            contractId: contractId as string,
        })
        const result = await getCachedData<ContractingProjectConstructionListType>(contractingProjectConstructionListCacheKey)
        const constructions = result.success?.constructions
        if (constructions === undefined || isEmpty(constructions)) {
            return Promise.resolve({
                success: undefined,
            })
        }

        const filteredConstructions = constructions.items?.filter(({ constructionId }) => constructionId && !constructionIds?.includes(constructionId))
        if (result.success?.constructions) {
            result.success.constructions.items = filteredConstructions
            result.success.updatedAt = Number(new Date())
        }
        const cachedResult = await updateCachedData({ key: contractingProjectConstructionListCacheKey, value: result.success })
        if (cachedResult.error) {
            throw {
                error: cachedResult.error,
                errorCode: cachedResult.errorCode,
            }
        }

        const cacheBackUp = results.map((result) => result.success).filter((data) => data !== undefined)

        dispatch(setDeletedConstructionIds([...(constructionIds ?? [])]))

        // 一定時間後に、DBに反映されていると想定してリセット
        setTimeout(() => {
            dispatch(setDeletedConstructionIds([]))
        }, 1000 * 60 * 2)

        return Promise.resolve({
            success: cacheBackUp as ConstructionListCacheReturnType[],
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

type RestoreConstructionsCacheParams = {
    cacheData?: ConstructionListCacheReturnType[]
}

export const restoreConstructionsCache = async (params: RestoreConstructionsCacheParams): Promise<CustomResponse<undefined>> => {
    try {
        const { cacheData } = params

        if (cacheData === undefined || isEmpty(cacheData)) {
            throw {
                error: 'キャッシュが設定されていません。',
            }
        }

        const results = await Promise.all(
            cacheData.map(async ({ key, value }): Promise<CustomResponse<undefined>> => {
                try {
                    if (key === undefined || value === undefined) {
                        return Promise.resolve({
                            success: undefined,
                        })
                    }

                    const cachedResult = await updateCachedData({ key, value })
                    if (cachedResult.error) {
                        throw {
                            error: cachedResult.error,
                            errorCode: cachedResult.errorCode,
                        }
                    }

                    return Promise.resolve({
                        success: undefined,
                    })
                } catch (error) {
                    return getErrorMessage(error)
                }
            }),
        )

        results.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: result.errorCode,
                }
            }
        })

        return Promise.resolve({
            success: undefined,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
