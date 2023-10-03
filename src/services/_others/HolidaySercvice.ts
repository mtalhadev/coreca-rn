import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from './ErrorService'

import { _callFunctions } from '../firebase/FunctionsService'

export type HolidayType = { [P in string]: string }

export type GetHolidayListResponse = HolidayType | undefined
export const _getHolidayList = async (): Promise<CustomResponse<GetHolidayListResponse>> => {
    try {
        const result = await _callFunctions('IHoliday-getHolidayList')
        if (result.error) {
            throw { ...result }
        }
        return Promise.resolve({
            success: result.success,
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}
