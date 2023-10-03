import { MyCompanyWorkerUIType } from '../../screens/adminSide/mypage/MyCompanyWorkerList'
import { _getArrangementListOfTargetSite, _getArrangementListOfTargetWorker } from '../../services/arrangement/ArrangementService'
import { _getCompany } from '../../services/company/CompanyService'
import { _getConstruction } from '../../services/construction/ConstructionService'
import { _getSite, _getSiteNameData } from '../../services/site/SiteService'
import { _getWorker, _getWorkerListOfTargetCompany } from '../../services/worker/WorkerService'
import { CustomDate, dayBaseTextWithoutDate, toCustomDateFromTotalSeconds } from '../../models/_others/CustomDate'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { ConstructionCLType } from '../../models/construction/Construction'
import { HolidayType } from '../../services/_others/HolidaySercvice'
import { toWorkerCLType, WorkerType } from '../../models/worker/Worker'

export type GetWorkersOfMyCompanyParam = {
    myCompanyId?: string
    myWorkerId?: string
}

export type GetWorkersOfMyCompanyResponse = MyCompanyWorkerUIType[] | undefined

export const toMyCompanyWorkerUIType = (worker?: WorkerType): MyCompanyWorkerUIType => {
    return {
        ...toWorkerCLType(worker),
    }
}

export const getWorkersOfMyCompany = async (params: GetWorkersOfMyCompanyParam): Promise<CustomResponse<GetWorkersOfMyCompanyResponse>> => {
    try {
        const { myCompanyId, myWorkerId } = params
        if (myCompanyId == undefined || myWorkerId == undefined) {
            throw {
                error: '自社情報がありません。ログインし直してください。',
            } as CustomResponse
        }

        const result = await _getWorkerListOfTargetCompany({
            companyId: myCompanyId,
            options: {
                account: true,
                workerTags: {
                    params: {
                        myCompanyId,
                        myWorkerId,
                    },
                },
            },
        })
        if (result.error) {
            throw {
                error: result.error,
            } as CustomResponse
        }
        return Promise.resolve({
            success: result.success?.items?.map((worker) => toWorkerCLType(worker)) ?? [],
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const checkIsHolidayWorker = (worker?: WorkerType, date?: CustomDate, holidays?: HolidayType): boolean => {
    if (date == undefined) {
        return false
    }
    if (worker == undefined) {
        return false
    }
    if ((worker.offDaysOfWeek ?? []).includes(date.dayOfWeekText as string)) {
        return true
    }
    if (worker.offDaysOfWeek?.includes('祝') && (holidays ?? {})[dayBaseTextWithoutDate(date)] != undefined) {
        return true
    }
    if (
        worker.otherOffDays &&
        worker.otherOffDays?.length > 0 &&
        worker.otherOffDays?.map((day) => dayBaseTextWithoutDate(toCustomDateFromTotalSeconds(day))).indexOf(dayBaseTextWithoutDate(date)) != -1
    ) {
        return true
    }
    return false
}

export const checkIsHolidayOfConstruction = (construction?: ConstructionCLType, date?: CustomDate, holidays?: HolidayType): boolean => {
    if (date == undefined) {
        return false
    }
    if (construction == undefined) {
        return false
    }
    if ((construction.offDaysOfWeek ?? []).includes(date.dayOfWeekText as string)) {
        return true
    }
    if (construction.offDaysOfWeek?.includes('祝') && (holidays ?? {})[dayBaseTextWithoutDate(date)] != undefined) {
        return true
    }
    if (construction.otherOffDays && construction.otherOffDays?.length > 0 && construction.otherOffDays?.map((day: CustomDate) => dayBaseTextWithoutDate(day)).includes(dayBaseTextWithoutDate(date))) {
        return true
    }
    return false
}
