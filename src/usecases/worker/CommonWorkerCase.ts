/* eslint-disable indent */
import isEmpty from 'lodash/isEmpty'
import uniq from 'lodash/uniq'
import { WorkerProfileContentType } from '../../components/template/WorkerProfileContent'
import { AccountType } from '../../models/account/Account'
import { ArrangementCLType, ArrangementType, toArrangementCLType } from '../../models/arrangement/Arrangement'
import { CompanyType, toCompanyCLType } from '../../models/company/Company'
import { GetWorkerOptionParam, toWorkerCLType, WorkerCLType, WorkerType } from '../../models/worker/Worker'
import { CompanyRoleEnumType } from '../../models/worker/CompanyRoleEnumType'
import { _getArrangement, _getArrangementListOfTargetWorker, _getArrangementListOfTargetWorkerAndMonth } from '../../services/arrangement/ArrangementService'
import { _getCompany } from '../../services/company/CompanyService'
import { _getSite } from '../../services/site/SiteService'
import { _deleteWorker, _getArrangeableWorkersOfTargetDateAndCompany, _getWorker, _getWorkerTags } from '../../services/worker/WorkerService'
import { CustomDate, getMonthlyFinalDay, getYYYYMMTotalSeconds, monthBaseText, newCustomDate, toCustomDateFromTotalSeconds } from '../../models/_others/CustomDate'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { WorkerAttendanceType } from '../../screens/adminSide/worker/workerDetail/WorkerAttendanceList'
import { separateListByMonth } from '../CommonCase'
import { newDate } from '../../utils/ext/Date.extensions'
import { DepartmentListType } from '../../models/department/DepartmentListType'
import { DepartmentType } from '../../models/department/DepartmentType'
import { _deleteActiveDepartments } from '../../services/department/DepartmentService'
import { CompanyWorkerListType } from '../../models/worker/CompanyWorkerListType'
import { YYYYMMDDTotalSecondsParam } from '../../models/_others/TotalSeconds'
import { _callFunctions } from '../../services/firebase/FunctionsService'
import { checkMyDepartment } from '../department/DepartmentCase'
import { ID } from '../../models/_others/ID'
import { genKeyName, getCachedData, updateCachedData } from '../CachedDataCase'
import { SiteArrangementModel } from '../../models/arrangement/SiteArrangement'
import { checkIsHolidayWorker } from './WorkerListCase'
import { DateDataType } from '../../models/date/DateDataType'
import { ProjectType } from '../../models/project/Project'
import { StoreType } from '../../stores/Store'
import { useSelector } from 'react-redux'
import { HolidayType } from '../../services/_others/HolidaySercvice'

export type GetWorkerDetailParam = {
    workerId?: string
    myCompanyId?: string
    myWorkerId?: string
    arrangementId?: string
}

export type GetWorkerDetailResponse = {
    worker?: WorkerCLType
    arrangement?: ArrangementCLType
    type?: WorkerProfileContentType
}

type ExtendedDateDataType = {
    monthlyData: DateDataType[]
    projects: ProjectType[]
}

export const getWorkerDetail = async (params: GetWorkerDetailParam): Promise<CustomResponse<GetWorkerDetailResponse>> => {
    try {
        const { workerId, myCompanyId, myWorkerId, arrangementId } = params
        if (isEmpty(workerId) || workerId == undefined) {
            throw {
                error: '取得したい会社のidが必要です。',
            } as CustomResponse
        }

        if (isEmpty(myCompanyId) || myCompanyId == undefined || isEmpty(myWorkerId) || myWorkerId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        const results = await Promise.all([
            _getWorker({
                workerId,
                options: {
                    account: true,
                    company: {
                        companyPartnership: { params: { companyId: myCompanyId } },
                        lastDeal: {
                            params: { myCompanyId: myCompanyId },
                        },
                    },
                },
            }),
            _getArrangement({
                arrangementId: arrangementId ?? 'no-id',
                options: {
                    createCompany: {
                        companyPartnership: {
                            params: {
                                companyId: myCompanyId,
                            },
                        },
                    },
                },
            }),
        ])
        const workerResult = results[0]
        if (workerResult.error) {
            throw {
                error: workerResult.error,
            }
        }
        const arrangementResult = results[1]
        const tagResult = await _getWorkerTags({
            worker: workerResult.success,
            myCompanyId,
            myWorkerId,
            siteId: arrangementResult.success?.siteId,
            timeZoneOffset: newCustomDate().timeZoneOffset,
        })
        if (tagResult.error) {
            throw tagResult.error
        }
        workerResult.success = { ...workerResult.success, workerTags: tagResult.success }
        const belongingCompany = workerResult.success.company
        let type: WorkerProfileContentType | undefined = undefined
        if (belongingCompany?.companyPartnership == 'others') {
            type = 'other-company'
        } else {
            if (workerResult.success?.workerId == myWorkerId) {
                type = 'is-mine'
            } else if (myCompanyId == belongingCompany?.companyId) {
                if (workerResult.success?.account) {
                    type = 'register-worker-of-mycompany'
                } else {
                    type = 'unregister-worker-of-mycompany'
                }
            } else if (belongingCompany?.isFake) {
                type = 'request-worker-of-fake-company'
            } else {
                if (workerResult.success?.account) {
                    type = 'register-worker-of-other-company'
                } else {
                    type = 'request-worker-of-other-company'
                }
            }
        }

        return Promise.resolve({
            success: {
                worker: toWorkerCLType(workerResult.success),
                type,
                arrangement: toArrangementCLType(arrangementResult.success),
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetAnyWorkerWithAccountParam = {
    workerId?: string
}

export type GetMyWorkerResponse = {
    worker?: WorkerCLType
}

export const getAnyWorkerWithAccount = async (params: GetAnyWorkerWithAccountParam): Promise<CustomResponse<GetMyWorkerResponse>> => {
    try {
        const { workerId } = params
        if (isEmpty(workerId) || workerId == undefined) {
            throw {
                error: '取得したい作業員のidが必要です。',
            } as CustomResponse
        }

        const workerResult = await _getWorker({ workerId, options: { account: true } })
        if (workerResult.error) {
            throw {
                error: workerResult.error,
            }
        }

        return Promise.resolve({
            success: {
                worker: toWorkerCLType(workerResult.success),
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetAnyWorkerParam = {
    workerId?: string
}

export type GetAnyWorkerResponse = {
    worker?: WorkerType
}

export const getAnyWorker = async (params: GetAnyWorkerParam): Promise<CustomResponse<GetAnyWorkerResponse>> => {
    try {
        const { workerId } = params
        if (isEmpty(workerId) || workerId == undefined) {
            throw {
                error: '取得したい作業員のidが必要です。',
                errorCode: 'GET_ANY_WORKER_ERROR',
            } as CustomResponse
        }

        const workerResult = await _getWorker({ workerId })
        if (workerResult.error) {
            throw {
                error: workerResult.error,
                errorCode: workerResult.errorCode,
            }
        }

        return Promise.resolve({
            success: {
                worker: workerResult.success,
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetArrangeCountOfTargetWorkerAndDateParam = {
    workerId?: string
    date: CustomDate
}

export type GetArrangeCountOfTargetWorkerAndDateResponse =
    | {
          arrangements?: ArrangementType[]
          count?: number
      }
    | undefined

export const getArrangeCountOfTargetWorkerAndDate = async (params: GetArrangeCountOfTargetWorkerAndDateParam): Promise<CustomResponse<GetArrangeCountOfTargetWorkerAndDateResponse>> => {
    try {
        const { workerId, date } = params
        if (workerId == undefined) {
            throw {
                error: '作業員情報がありません。',
            } as CustomResponse
        }

        if (date == undefined) {
            throw {
                error: '日付がありません。',
            } as CustomResponse
        }

        const arrangementsResult = await _getArrangementListOfTargetWorker({ workerId })
        if (arrangementsResult.error) {
            throw {
                throw: arrangementsResult.error,
            }
        }
        const siteIds = uniq(arrangementsResult?.success?.items?.map((arr) => arr.siteId)).filter((siteId) => siteId != undefined)
        const funcs = siteIds.map((siteId) => _getSite({ siteId: siteId ?? 'no-id' }))
        const sitesResult = await Promise.all(funcs)
        sitesResult.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                }
            }
        })
        const sitesIdsInDate = sitesResult
            .map((result) => result.success)
            .filter((site) => (site?.meetingDate ?? site?.siteDate) && site?.endDate && (site.meetingDate ?? (site.siteDate as number)) >= date.totalSeconds && date.totalSeconds <= site.endDate)
            .filter((site) => site != undefined)
            .map((site) => site?.siteId)
        const rtnArrangements = arrangementsResult.success?.items?.filter((arr) => sitesIdsInDate.indexOf(arr.siteId) != -1)
        return Promise.resolve({
            success: {
                arrangements: rtnArrangements,
                count: rtnArrangements?.length,
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type DeleteWorkerParam = {
    workerId?: string
}

export type DeleteWorkerResponse = boolean | undefined

export const deleteWorker = async (params: DeleteWorkerParam): Promise<CustomResponse<DeleteWorkerResponse>> => {
    try {
        const { workerId } = params
        if (isEmpty(workerId) || workerId == undefined) {
            throw {
                error: 'workerIdが必要です。',
            } as CustomResponse
        }

        const result = await _deleteWorker(workerId)
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }

        const departmentsResult = await _deleteActiveDepartments(workerId)
        if (departmentsResult.error) {
            throw {
                error: departmentsResult.error,
                errorCode: departmentsResult.errorCode,
            }
        }
        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetWorkerAttendancesParam = {
    workerId: string
    myCompanyId: string
}

export type GetWorkerAttendancesResponse = WorkerAttendanceType | undefined

type _ArrangementCLType = {
    startDate?: CustomDate
    endDate?: CustomDate
} & ArrangementCLType

export const getWorkerAttendances = async (param: GetWorkerAttendancesParam): Promise<CustomResponse<GetWorkerAttendancesResponse>> => {
    try {
        const { workerId, myCompanyId } = param
        const workerResult = await _getWorker({
            workerId,
        })
        if (workerResult.error) {
            throw workerResult.error
        }
        // 自社作業員のみ勤怠は取得可能。
        if (workerResult.success?.companyId != myCompanyId) {
            Promise.resolve({ success: undefined })
        }
        const arrangementsResult = await _getArrangementListOfTargetWorker({
            workerId,
            options: {
                site: {
                    siteNameData: true,
                },
                attendance: true,
            },
        })
        if (arrangementsResult.error) {
            throw arrangementsResult.error
        }
        const arrangements = arrangementsResult.success?.items
            ?.map(
                (item) =>
                    ({
                        ...toArrangementCLType(item),
                        startDate: item.site?.meetingDate ? toCustomDateFromTotalSeconds(item.site?.meetingDate) : item.site?.siteDate ? toCustomDateFromTotalSeconds(item.site?.siteDate) : undefined,
                        endDate: item.site?.endDate ? toCustomDateFromTotalSeconds(item.site?.endDate) : undefined,
                    } as _ArrangementCLType),
            )
            .filter((data) => data != undefined && data.startDate != undefined && data.endDate != undefined) as _ArrangementCLType[]
        const respond = separateListByMonth(arrangements)
        return Promise.resolve({ success: respond })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * workerId - 作業員Id
 * myCompanyId - 自社Id
 * month - 取得したい月
 */
export type GetWorkerAttendancesOfMonthParam = {
    workerId: string
    myCompanyId: string
    month: CustomDate
}

export type GetWorkerAttendancesOfMonthResponse = ArrangementCLType[]

export const getWorkerAttendancesOfMonth = async (param: GetWorkerAttendancesOfMonthParam): Promise<CustomResponse<GetWorkerAttendancesOfMonthResponse>> => {
    try {
        const { workerId, myCompanyId, month } = param
        const workerResult = await _getWorker({
            workerId,
        })
        if (workerResult.error) {
            throw workerResult.error
        }
        // 自社作業員のみ勤怠は取得可能。
        if (workerResult.success?.companyId != myCompanyId) {
            Promise.resolve({ success: undefined })
        }
        const arrangementsResult = await _getArrangementListOfTargetWorkerAndMonth({
            workerId,
            month: getYYYYMMTotalSeconds(month),
            endOfMonth: getMonthlyFinalDay(month).totalSeconds,
            options: {
                site: {
                    siteNameData: true,
                },
                attendance: true,
            },
        })
        if (arrangementsResult.error) {
            throw arrangementsResult.error
        }
        const arrangements = arrangementsResult.success?.items
            ?.map(
                (item) =>
                    ({
                        ...toArrangementCLType(item),
                        startDate: item.site?.meetingDate ? toCustomDateFromTotalSeconds(item.site?.meetingDate) : item.site?.siteDate ? toCustomDateFromTotalSeconds(item.site?.siteDate) : undefined,
                        endDate: item.site?.endDate ? toCustomDateFromTotalSeconds(item.site?.endDate) : undefined,
                    } as _ArrangementCLType),
            )
            .filter((data) => data != undefined && data.startDate != undefined && data.endDate != undefined) as _ArrangementCLType[]
        return Promise.resolve({ success: arrangements })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const workerLeftDateToNum = (leftDate?: CustomDate): number => {
    if (leftDate && leftDate.totalSeconds < newDate().toCustomDate().totalSeconds) {
        return 0
    }
    return 1
}

export const departmentsToText = (departments?: DepartmentType[], joint?: string): string => {
    if (departments == undefined || departments?.length == 0) {
        return ''
    }
    return departments
        ?.map((dep) => {
            const isDefault = dep?.isDefault
            if (isDefault) return ''
            const depName = dep.departmentName
            //depNameが7文字以上の場合、中間を省略
            if (depName && depName.length > 7) {
                return `${depName.slice(0, 3)}...${depName.slice(depName.length - 3)}`
            } else {
                return depName
            }
        })
        ?.join(joint ?? ',  ')
}

export type GetArrangeableWorkerOfTargetDateAndCompanyDepartmentParam = {
    companyId?: string
    date?: YYYYMMDDTotalSecondsParam
    endDate?: YYYYMMDDTotalSecondsParam
    activeDepartmentIds?: ID[]
    options?: GetWorkerOptionParam
}
export type GetArrangeableWorkerOfTargetDateAndCompanyDepartmentResponse = CompanyWorkerListType | undefined
/**
 *
 * @param params
 * @returns 現場に手配可能な作業員（自社、他社常用依頼）を取得。休みや同日重複、isOfficeWorkerは考慮しない。
 */
export const getArrangeableWorkersOfTargetDateAndCompanyDepartment = async (
    params: GetArrangeableWorkerOfTargetDateAndCompanyDepartmentParam,
): Promise<CustomResponse<GetArrangeableWorkerOfTargetDateAndCompanyDepartmentResponse>> => {
    try {
        const { companyId, date, endDate, activeDepartmentIds, options } = params
        if (companyId == undefined) {
            throw {
                error: 'companyIdがありません',
                errorCode: 'GET_ARRANGEABLE_WORKERS_ERROR',
            }
        }
        if (date == undefined || endDate == undefined) {
            throw {
                error: '日付情報がありません',
                errorCode: 'GET_ARRANGEABLE_WORKERS_ERROR',
            }
        }
        const result = await _getArrangeableWorkersOfTargetDateAndCompany({ companyId, date, endDate, options })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }

        const arrangeableWorkers = result.success?.workers?.items?.filter((worker) =>
            checkMyDepartment({
                targetDepartmentIds: worker.departmentIds,
                activeDepartmentIds,
            }),
        )
        return Promise.resolve({
            success: {
                reservations: result.success?.reservations,
                workers: { items: arrangeableWorkers },
            } as CompanyWorkerListType,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

export type OnCreateWorkerUpdateSiteArrangementCacheParam = {
    newWorker: WorkerType
    myCompanyId: string
    accountId: string
    holidays: HolidayType
    siteId?: string
}
export const onCreateWorkerUpdateSiteArrangementCache = async (params: OnCreateWorkerUpdateSiteArrangementCacheParam) => {
    const { newWorker, accountId, myCompanyId, holidays, siteId } = params
    if (accountId == undefined) {
        return
    }
    if (siteId) {
        // 現場が特定できる場合、該当現場の手配キャッシュデータのみ更新する
        const siteArrangementCacheKey = genKeyName({
            screenName: 'SiteArrangement',
            accountId: accountId,
            companyId: myCompanyId as string,
            siteId: siteId,
        })
        const siteArrangementCacheData = await getCachedData<SiteArrangementModel>(siteArrangementCacheKey)

        const siteDate = siteArrangementCacheData.success?.site?.siteDate
        const _isHolidayWork = checkIsHolidayWorker(newWorker, toCustomDateFromTotalSeconds(siteDate ?? 0), holidays)
        newWorker.workerTags = ['unregister']
        if (_isHolidayWork) {
            newWorker.workerTags.push('is-holiday')
        }
        // selfSide更新
        if (siteArrangementCacheData.success && siteArrangementCacheData.success.siteArrangementData?.selfSide) {
            siteArrangementCacheData.success.siteArrangementData.selfSide.push({ worker: newWorker })
            siteArrangementCacheData.success.updatedAt = Number(new Date())
        }
        // arrangeableWorkers更新
        if (siteArrangementCacheData.success && siteArrangementCacheData.success.siteArrangementData?.arrangeableWorkers) {
            siteArrangementCacheData.success.siteArrangementData?.arrangeableWorkers?.workers?.items?.push(newWorker)
        }
        updateCachedData({ key: siteArrangementCacheKey, value: siteArrangementCacheData.success ?? {} })
    } else {
        // 現場が特定できない場合、当月の全ての現場の手配キャッシュデータを更新する
        const adminHomeCacheKey = genKeyName({
            screenName: 'AdminHome',
            accountId: accountId,
            companyId: myCompanyId as string,
            month: monthBaseText(newCustomDate()).replace(/\//g, '-'),
        })
        const adminHomeCacheData = await getCachedData<ExtendedDateDataType>(adminHomeCacheKey ?? 'no-id')
        if (adminHomeCacheData.success) {
            adminHomeCacheData.success?.monthlyData.map((cacheDateData) => {
                cacheDateData?.sites?.totalSites?.items?.map(async (site) => {
                    if (site.siteId) {
                        const siteArrangementCacheKey = genKeyName({
                            screenName: 'SiteArrangement',
                            accountId: accountId,
                            companyId: myCompanyId as string,
                            siteId: site.siteId,
                        })
                        const siteArrangementCacheData = await getCachedData<SiteArrangementModel>(siteArrangementCacheKey)
                        const _isHolidayWork = checkIsHolidayWorker(newWorker, toCustomDateFromTotalSeconds(site.siteDate ?? 0), holidays)
                        newWorker.workerTags = ['unregister']
                        if (_isHolidayWork) {
                            newWorker.workerTags.push('is-holiday')
                        }
                        // selfSide更新
                        if (siteArrangementCacheData.success && siteArrangementCacheData.success.siteArrangementData?.selfSide) {
                            siteArrangementCacheData.success.siteArrangementData.selfSide.push({ worker: newWorker })
                            siteArrangementCacheData.success.updatedAt = Number(new Date())
                        }
                        // arrangeableWorkers更新
                        if (siteArrangementCacheData.success && siteArrangementCacheData.success.siteArrangementData?.arrangeableWorkers) {
                            siteArrangementCacheData.success.siteArrangementData?.arrangeableWorkers?.workers?.items?.push(newWorker)
                        }
                        updateCachedData({ key: siteArrangementCacheKey, value: siteArrangementCacheData.success ?? {} })
                    }
                })
            })
        }
    }
}

export type OnUpdateWorkerUpdateSiteArrangementCacheParam = {
    newWorker: WorkerType
    myCompanyId: string
    accountId: string
}
export const onUpdateWorkerUpdateSiteArrangementCache = async (params: OnUpdateWorkerUpdateSiteArrangementCacheParam) => {
    const { newWorker, myCompanyId, accountId } = params
    if (accountId == undefined) {
        return
    }
    const adminHomeCacheKey = genKeyName({
        screenName: 'AdminHome',
        accountId: accountId,
        companyId: myCompanyId as string,
        month: monthBaseText(newCustomDate()).replace(/\//g, '-'),
    })
    const adminHomeCacheData = await getCachedData<ExtendedDateDataType>(adminHomeCacheKey ?? 'no-id')
    if (adminHomeCacheData.success) {
        adminHomeCacheData.success?.monthlyData.map((cacheDateData) => {
            cacheDateData?.sites?.totalSites?.items?.map(async (site) => {
                if (site.siteId) {
                    const siteArrangementCacheKey = genKeyName({
                        screenName: 'SiteArrangement',
                        accountId: accountId,
                        companyId: myCompanyId as string,
                        siteId: site.siteId,
                    })
                    const siteArrangementCacheData = await getCachedData<SiteArrangementModel>(siteArrangementCacheKey)
                    // selfSide更新
                    if (siteArrangementCacheData.success && siteArrangementCacheData.success.siteArrangementData?.selfSide) {
                        const newList = siteArrangementCacheData.success.siteArrangementData.selfSide.map((siteArrangementWorker) => {
                            if (siteArrangementWorker.worker?.workerId == newWorker.workerId) {
                                siteArrangementWorker.worker = { ...siteArrangementWorker.worker, ...newWorker }
                            }
                            return siteArrangementWorker
                        })
                        siteArrangementCacheData.success.siteArrangementData.selfSide = newList.filter(
                            (siteArrangementWorker) => siteArrangementWorker.worker?.leftDate == undefined || (site.siteDate && siteArrangementWorker.worker?.leftDate > site.siteDate),
                        )
                        siteArrangementCacheData.success.updatedAt = Number(new Date())
                    }
                    // arrangeableWorkers更新
                    if (siteArrangementCacheData.success && siteArrangementCacheData.success.siteArrangementData?.arrangeableWorkers?.workers?.items) {
                        const newList = siteArrangementCacheData.success.siteArrangementData?.arrangeableWorkers?.workers?.items?.map((worker) => {
                            if (worker.workerId == newWorker.workerId) {
                                worker = { ...worker, ...newWorker }
                            }
                            return worker
                        })
                        siteArrangementCacheData.success.siteArrangementData.arrangeableWorkers.workers.items = newList.filter(
                            (worker) => worker?.leftDate == undefined || (site.siteDate && worker?.leftDate > site.siteDate),
                        )
                    }
                    updateCachedData({ key: siteArrangementCacheKey, value: siteArrangementCacheData.success ?? {} })
                }
            })
        })
    }
}

export type OnDeleteWorkerUpdateSiteArrangementCacheParam = {
    workerId: string
    myCompanyId: string
    accountId: string
}
export const onDeleteWorkerUpdateSiteArrangementCache = async (params: OnDeleteWorkerUpdateSiteArrangementCacheParam) => {
    const { workerId, myCompanyId, accountId } = params
    if (accountId == undefined || workerId == undefined) {
        return
    }
    const adminHomeCacheKey = genKeyName({
        screenName: 'AdminHome',
        accountId: accountId,
        companyId: myCompanyId as string,
        month: monthBaseText(newCustomDate()).replace(/\//g, '-'),
    })
    const adminHomeCacheData = await getCachedData<ExtendedDateDataType>(adminHomeCacheKey ?? 'no-id')
    if (adminHomeCacheData.success) {
        adminHomeCacheData.success?.monthlyData.map((cacheDateData) => {
            cacheDateData?.sites?.totalSites?.items?.map(async (site) => {
                if (site.siteId) {
                    const siteArrangementCacheKey = genKeyName({
                        screenName: 'SiteArrangement',
                        accountId: accountId,
                        companyId: myCompanyId as string,
                        siteId: site.siteId,
                    })
                    const siteArrangementCacheData = await getCachedData<SiteArrangementModel>(siteArrangementCacheKey)
                    // selfSide更新
                    if (siteArrangementCacheData.success && siteArrangementCacheData.success.siteArrangementData?.selfSide) {
                        const newList = siteArrangementCacheData.success.siteArrangementData.selfSide.filter((worker) => worker.worker?.workerId != workerId)
                        siteArrangementCacheData.success.siteArrangementData.selfSide = newList
                        siteArrangementCacheData.success.updatedAt = Number(new Date())
                    }
                    // arrangeableWorkers更新
                    if (siteArrangementCacheData.success && siteArrangementCacheData.success.siteArrangementData?.arrangeableWorkers?.workers?.items) {
                        const newList = siteArrangementCacheData.success.siteArrangementData?.arrangeableWorkers?.workers?.items?.filter((worker) => worker.workerId != workerId)
                        siteArrangementCacheData.success.siteArrangementData.arrangeableWorkers.workers.items = newList
                    }
                    updateCachedData({ key: siteArrangementCacheKey, value: siteArrangementCacheData.success ?? {} })
                }
            })
        })
    }
}
