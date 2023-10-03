import cloneDeep from 'lodash/cloneDeep'
import { ConstructionCLType, ConstructionType, toConstructionCLType } from '../../models/construction/Construction'
import { _getCompany } from '../../services/company/CompanyService'
import { _deleteConstruction, _getConstruction } from '../../services/construction/ConstructionService'
import { WeekOfDay } from '../../utils/ext/Date.extensions'
import { CustomDate, dayBaseText, isHoliday, nextDay } from '../../models/_others/CustomDate'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { HolidayType } from '../../services/_others/HolidaySercvice'

export const calculateConstructionDays = (startDate?: CustomDate, endDate?: CustomDate, offDays?: WeekOfDay[], otherOffDays?: CustomDate[], holidays?:HolidayType): number => {
    // for loop
    if (startDate == undefined || endDate == undefined) {
        return 0
    }
    if (startDate.totalSeconds > endDate.totalSeconds) {
        return 0
    }

    let count = 0
    let __nextDay: CustomDate = cloneDeep(startDate)
    const otherOffDaysText: string[] = otherOffDays?.map((day) => dayBaseText(day)) ?? []

    for (;;) {
        if (__nextDay.totalSeconds > endDate.totalSeconds) {
            break
        }

        let hitFlag = false
        if (otherOffDays) {
            otherOffDaysText.forEach((dayText) => {
                if (dayText == dayBaseText(__nextDay)) {
                    hitFlag = true
                }
            })
            if (hitFlag) {
                __nextDay = nextDay(__nextDay)
                continue
            }
        }

        if (offDays) {
            hitFlag = false
            offDays.forEach((offDay) => {
                if (offDay == __nextDay.dayOfWeekText || (offDay == '祝' && holidays && isHoliday(__nextDay, holidays))) {
                    hitFlag = true
                }
            })
            if (hitFlag) {
                __nextDay = nextDay(__nextDay)
                continue
            }
        }

        count += 1
        __nextDay = nextDay(__nextDay)
    }
    return count
}

export type GetTargetConstructionParam = {
    constructionId?: string
    myCompanyId?: string
}

export type GetTargetConstructionResponse = ConstructionCLType | undefined

export const getTargetConstruction = async (params: GetTargetConstructionParam): Promise<CustomResponse<GetTargetConstructionResponse>> => {
    try {
        const { constructionId, myCompanyId } = params
        if (constructionId == undefined || myCompanyId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }

        const constructionResult = await _getConstruction({
            constructionId,
            options: {
                constructionRelation: {
                    params: {
                        companyId: myCompanyId,
                    },
                },
                displayName: true,
                project: true,
                contract: {
                    orderDepartments: true,
                    receiveDepartments: true,
                    receiveCompany: true,
                    contractLog: true,
                },
            },
        })
        if (constructionResult.error) {
            throw {
                error: '工事がありません。',
            } as CustomResponse
        }

        return Promise.resolve({
            success: toConstructionCLType(constructionResult.success),
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type DeleteTargetConstructionParam = {
    constructionId?: string
}

export type DeleteTargetConstructionResponse = boolean | undefined

export const deleteTargetConstruction = async (params: DeleteTargetConstructionParam): Promise<CustomResponse<DeleteTargetConstructionResponse>> => {
    try {
        const { constructionId } = params
        if (constructionId == undefined) {
            throw {
                error: 'idが足りません。',
            } as CustomResponse
        }

        const constructionResult = await _deleteConstruction(constructionId)
        if (constructionResult.error) {
            throw {
                error: constructionResult.error,
            } as CustomResponse
        }

        return Promise.resolve({
            success: true,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const getDateRange = (_startDate: CustomDate, _endDate: CustomDate): CustomDate[] => {
    if (_startDate.totalSeconds > _endDate.totalSeconds) {
        return []
    }
    const rtnDates: CustomDate[] = []
    let workDate = cloneDeep(_startDate)
    for (;;) {
        rtnDates.push(workDate)
        workDate = nextDay(workDate, 1)
        if (workDate.totalSeconds > _endDate.totalSeconds) {
            break
        }
    }
    return rtnDates
}