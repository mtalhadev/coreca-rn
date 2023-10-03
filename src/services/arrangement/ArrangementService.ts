import { _callFunctions } from '../firebase/FunctionsService'
import { ArrangementModel, ArrangementType, GetArrangementOptionParam } from '../../models/arrangement/Arrangement'
import { Create, Update } from '../../models/_others/Common'
import { getErrorMessage } from '../_others/ErrorService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { ArrangementListType } from '../../models/arrangement/ArrangementListType'
import { YYYYMMDDTotalSecondsParam, YYYYMMTotalSecondsParam } from '../../models/_others/TotalSeconds'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LocalSiteArrangementDataType, SiteArrangementDataCLType, SiteArrangementDataType } from '../../models/arrangement/SiteArrangementDataType'
import { ID } from '../../models/_others/ID'

export type CreateArrangementParam = {
    arrangement: Create<ArrangementModel>
}
export type CreateArrangementResponse = string
export const _createArrangement = async (params: CreateArrangementParam): Promise<CustomResponse<CreateArrangementResponse>> => {
    try {
        const result = await _callFunctions('IArrangement-createArrangement', params)
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

export type GetArrangementParam = {
    arrangementId: string
    options?: GetArrangementOptionParam
}

export type GetArrangementResponse = ArrangementType | undefined

/**
 *
 * @param params
 *  -
 *  - withoutSelf
 *  - attendance
 *  - updateWorker
 *  - site
 *  - createCompany
 *  - request
 *  - respondRequest
 *  - worker
 * @returns
 */
export const _getArrangement = async (params: GetArrangementParam): Promise<CustomResponse<GetArrangementResponse>> => {
    try {
        const result = await _callFunctions('IArrangement-getArrangement', params)
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

export type GetArrangementListByIdsParam = {
    arrangementIds: string[]
    options?: GetArrangementOptionParam
}
export type GetArrangementListByIdsResponse = ArrangementType[] | undefined
export const _getArrangementListByIds = async (params: GetArrangementListByIdsParam): Promise<CustomResponse<GetArrangementListByIdsResponse>> => {
    try {
        const result = await _callFunctions('IArrangement-getArrangementListByIds', params)
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

export type UpdateArrangementParam = {
    arrangement: Update<ArrangementModel>
}
export type UpdateArrangementResponse = boolean | undefined
export const _updateArrangement = async (params: UpdateArrangementParam): Promise<CustomResponse<UpdateArrangementResponse>> => {
    try {
        const result = await _callFunctions('IArrangement-updateArrangement', params)
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

export type DeleteArrangementParam = {
    arrangementId: string
}
export type DeleteArrangementResponse = boolean | undefined
export const _deleteArrangement = async (params: DeleteArrangementParam): Promise<CustomResponse<DeleteArrangementResponse>> => {
    try {
        const result = await _callFunctions('IArrangement-deleteArrangement', params)
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

export type GetArrangementListOfTargetSiteParam = {
    siteId: string
    options?: GetArrangementOptionParam
}
export type GetArrangementListOfTargetSiteResponse = ArrangementListType | undefined
/**
 *
 * @param params
 * @returns 現場の手配を全て取得。常用手配＋手配。客観的な手配を見るときに使う。発注現場など。発注現場の場合はそもそも手配の画面を表示しない。手配結果である勤怠のみで良いな。
 */
export const _getArrangementListOfTargetSite = async (params: GetArrangementListOfTargetSiteParam): Promise<CustomResponse<GetArrangementListOfTargetSiteResponse>> => {
    try {
        const result = await _callFunctions('IArrangement-getArrangementListOfTargetSite', params)
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

export type GetArrangementListOfTargetSiteAndCompanyParam = {
    siteId: string
    createCompanyId: string
    options?: GetArrangementOptionParam
}
export type GetArrangementListOfTargetSiteAndCompanyResponse = ArrangementListType | undefined
/**
 *
 * @param params
 * @returns 現場の手配を全て取得。常用手配＋手配。客観的な手配を見るときに使う。発注現場など。発注現場の場合はそもそも手配の画面を表示しない。手配結果である勤怠のみで良いな。
 */
export const _getArrangementListOfTargetSiteAndCompany = async (params: GetArrangementListOfTargetSiteAndCompanyParam): Promise<CustomResponse<GetArrangementListOfTargetSiteAndCompanyResponse>> => {
    try {
        const result = await _callFunctions('IArrangement-getArrangementListOfTargetSiteAndCompany', params)
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

export type GetArrangementListOfTargetConstructionParam = {
    constructionId: string
    options?: GetArrangementOptionParam
}
export type GetArrangementListOfTargetConstructionResponse = ArrangementListType | undefined
export const _getArrangementListOfTargetConstruction = async (params: GetArrangementListOfTargetConstructionParam): Promise<CustomResponse<GetArrangementListOfTargetConstructionResponse>> => {
    try {
        const result = await _callFunctions('IArrangement-getArrangementListOfTargetConstruction', params)
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

export type GetArrangementListOfTargetWorkerParam = {
    workerId: string
    options?: GetArrangementOptionParam
}
export type GetArrangementListOfTargetWorkerResponse = ArrangementListType | undefined
export const _getArrangementListOfTargetWorker = async (params: GetArrangementListOfTargetWorkerParam): Promise<CustomResponse<GetArrangementListOfTargetWorkerResponse>> => {
    try {
        const result = await _callFunctions('IArrangement-getArrangementListOfTargetWorker', params)
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

/**
 * @requires
 * workerId - 作業員Id
 * month - 取得したい月
 */
export type GetArrangementListOfTargetWorkerAndMonthParam = {
    workerId: string
    month: YYYYMMTotalSecondsParam
    endOfMonth: YYYYMMTotalSecondsParam
    options?: GetArrangementOptionParam
}
export type GetArrangementListOfTargetWorkerAndMonthResponse = ArrangementListType | undefined
export const _getArrangementListOfTargetWorkerAndMonth = async (params: GetArrangementListOfTargetWorkerAndMonthParam): Promise<CustomResponse<GetArrangementListOfTargetWorkerAndMonthResponse>> => {
    try {
        const result = await _callFunctions('IArrangement-getArrangementListOfTargetWorkerAndMonth', params)
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

export type GetArrangementOfTargetAttendanceParam = {
    attendanceId: string
    options?: GetArrangementOptionParam
}
export type GetArrangementOfTargetAttendanceResponse = ArrangementType | undefined
export const _getArrangementOfTargetAttendance = async (params: GetArrangementOfTargetAttendanceParam): Promise<CustomResponse<GetArrangementOfTargetAttendanceResponse>> => {
    try {
        const result = await _callFunctions('IArrangement-getArrangementOfTargetAttendance', params)
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

export type GetArrangementListOfTargetRequestParam = {
    requestId: string
    options?: GetArrangementOptionParam
}
export type GetArrangementListOfTargetRequestResponse = ArrangementListType | undefined
/**
 *
 * @remarks 指定した常用依頼の直下の手配を全て取得。
 * @param params - {@link GetArrangementListOfTargetRequestParam}
 * @returns - {@link GetArrangementListOfTargetRequestResponse}
 */
export const _getSubArrangementListOfTargetRequest = async (params: GetArrangementListOfTargetRequestParam): Promise<CustomResponse<GetArrangementListOfTargetRequestResponse>> => {
    try {
        const result = await _callFunctions('IArrangement-getSubArrangementListOfTargetRequest', params)
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

export type GetSubArrangementListOfTargetSiteParam = {
    siteId: string
    options?: GetArrangementOptionParam
}
export type GetSubArrangementListOfTargetSiteResponse = ArrangementListType | undefined
/**
 *
 * @remarks 指定した現場直下の手配を全て取得。
 * @param params - {@link GetArrangementListOfTargetRequestParam}
 * @returns - {@link GetArrangementListOfTargetRequestResponse}
 */
export const _getSubArrangementListOfTargetSite = async (params: GetSubArrangementListOfTargetSiteParam): Promise<CustomResponse<GetSubArrangementListOfTargetSiteResponse>> => {
    try {
        const result = await _callFunctions('IArrangement-getSubArrangementListOfTargetSite', params)
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

export type GetArrangementOfTargetWorkerAndSiteParam = {
    workerId: string
    siteId: string
    options?: GetArrangementOptionParam
}
export type GetArrangementOfTargetWorkerAndSiteResponse = ArrangementType | undefined
export const _getArrangementOfTargetWorkerAndSite = async (params: GetArrangementOfTargetWorkerAndSiteParam): Promise<CustomResponse<GetArrangementOfTargetWorkerAndSiteResponse>> => {
    try {
        const result = await _callFunctions('IArrangement-getArrangementOfTargetWorkerAndSite', params)
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

export type GetArrangementListOfTargetWorkerAndDateParam = {
    workerId: string
    date: YYYYMMDDTotalSecondsParam
    timeZoneOffset?: number
    options?: GetArrangementOptionParam
}
export type GetArrangementListOfTargetWorkerAndDateResponse = ArrangementListType | undefined
export const _getArrangementListOfTargetWorkerAndDate = async (params: GetArrangementListOfTargetWorkerAndDateParam): Promise<CustomResponse<GetArrangementListOfTargetWorkerAndDateResponse>> => {
    try {
        const result = await _callFunctions('IArrangement-getArrangementListOfTargetWorkerAndDate', params)
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

/**
 * 手配状況をローカルストレージに保存する
 * @param siteArrangement - 手配情報
 * @returns CustomResponse
 */
export const _writeLocalSiteArrangement = async (targetSiteArrangement: LocalSiteArrangementDataType): Promise<CustomResponse> => {
    try {
        let jsonValue = await AsyncStorage.getItem('@arrangements')
        let arrangements: LocalSiteArrangementDataType[] = []
        if (jsonValue !== null) {
            arrangements = JSON.parse(jsonValue)
        }
        arrangements = arrangements.filter((arrangement) => arrangement.siteArrangementId != targetSiteArrangement.siteArrangementId)
        const newSiteArrangements: LocalSiteArrangementDataType[] = [...arrangements, targetSiteArrangement]
        jsonValue = JSON.stringify(newSiteArrangements)
        await AsyncStorage.setItem('@arrangements', jsonValue)
        return Promise.resolve({
            success: true,
            error: undefined,
        } as CustomResponse)
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * 複数の手配状況をローカルストレージに保存する
 * @param targetSiteArrangements - 手配情報
 * @returns CustomResponse
 */
export const _writeLocalSiteArrangements = async (targetSiteArrangements: LocalSiteArrangementDataType[]): Promise<CustomResponse> => {
    try {
        let jsonValue = await AsyncStorage.getItem('@arrangements')
        let arrangements: LocalSiteArrangementDataType[] = []
        if (jsonValue !== null) {
            arrangements = JSON.parse(jsonValue)
        }
        arrangements = arrangements.filter((arrangement) => arrangement.siteArrangementId && !targetSiteArrangements?.map((arr) => arr.siteArrangementId).includes(arrangement.siteArrangementId))
        const newSiteArrangements: LocalSiteArrangementDataType[] = [...arrangements, ...(targetSiteArrangements ?? [])].filter((data) => data != undefined)
        jsonValue = JSON.stringify(newSiteArrangements)
        await AsyncStorage.setItem('@arrangements', jsonValue)
        return Promise.resolve({
            success: true,
            error: undefined,
        } as CustomResponse)
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * ローカルストレージに保存されている手配状況を削除する
 * @param siteArrangementId - 削除したい手配のsiteIdまたは、respondedRequestIdまたはinvRequestIdが入る
 * @returns CustomResponse
 */
export const _deleteLocalSiteArrangement = async (siteArrangementId?: string): Promise<CustomResponse> => {
    try {
        let jsonValue = await AsyncStorage.getItem('@arrangements')
        let arrangements: LocalSiteArrangementDataType[] = []
        if (jsonValue !== null) {
            arrangements = JSON.parse(jsonValue)
        }
        const newSiteArrangements = arrangements.filter((arrangement) => arrangement.siteArrangementId != siteArrangementId)
        jsonValue = JSON.stringify(newSiteArrangements)
        await AsyncStorage.setItem('@arrangements', jsonValue)
        return Promise.resolve({
            success: true,
            error: undefined,
        } as CustomResponse)
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * ローカルストレージに保存されている手配状況を削除する
 * @param siteArrangementIds - 削除したい手配のsiteIdまたは、respondedRequestIdまたはinvRequestIdが入る
 * @returns CustomResponse
 */
export const _deleteLocalSiteArrangements = async (siteArrangementIds?: string[]): Promise<CustomResponse> => {
    try {
        let jsonValue = await AsyncStorage.getItem('@arrangements')
        let arrangements: LocalSiteArrangementDataType[] = []
        if (jsonValue !== null) {
            arrangements = JSON.parse(jsonValue)
        }
        const siteArrangementIdsSet = new Set(siteArrangementIds)

        const newSiteArrangements = arrangements.filter((arrangement) => !siteArrangementIdsSet.has(arrangement.siteArrangementId))
        jsonValue = JSON.stringify(newSiteArrangements)
        await AsyncStorage.setItem('@arrangements', jsonValue)
        return Promise.resolve({
            success: true,
            error: undefined,
        } as CustomResponse)
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 *
 * @param siteArrangementId - 取得したい手配のsiteIdまたは、respondedRequestIdまたはinvRequestId
 * @returns SiteArrangementDataTypeまたはundefined
 */
export const _getLocalArrangement = async (siteArrangementId: ID): Promise<CustomResponse<LocalSiteArrangementDataType>> => {
    try {
        let arrangements: LocalSiteArrangementDataType[] = []
        const jsonValue = await AsyncStorage.getItem('@arrangements')
        if (jsonValue !== null) {
            arrangements = JSON.parse(jsonValue)
        }
        const siteArrangement = arrangements?.filter((arrangement) => arrangement.siteArrangementId == siteArrangementId)[0]
        return Promise.resolve({
            success: siteArrangement,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 *
 * @param siteArrangementIds - 取得したい手配のsiteIdまたは、respondedRequestIdまたはinvRequestId
 * @returns SiteArrangementDataType[]またはundefined
 */
export const _getLocalArrangements = async (siteArrangementIds: ID[]): Promise<CustomResponse<LocalSiteArrangementDataType[]>> => {
    try {
        let arrangements: LocalSiteArrangementDataType[] = []
        const jsonValue = await AsyncStorage.getItem('@arrangements')
        if (jsonValue !== null) {
            arrangements = JSON.parse(jsonValue)
        }
        const siteArrangementIdsSet = new Set(siteArrangementIds)
        const siteArrangements = arrangements?.filter((arrangement) => siteArrangementIdsSet.has(arrangement.siteArrangementId))
        return Promise.resolve({
            success: siteArrangements,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
