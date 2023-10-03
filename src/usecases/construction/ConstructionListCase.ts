import sumBy from 'lodash/sumBy'
import { ConstructionCLType, ConstructionType, toConstructionCLType } from '../../models/construction/Construction'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { _getContract } from '../../services/contract/ContractService'
import { CustomDate, dayBaseTextWithoutDate, getMonthlyFinalDay, getYYYYMMTotalSeconds, monthBaseText } from '../../models/_others/CustomDate'
import { CompanyRequestListType, GetCompanyRequestListType } from '../../models/request/CompanyRequestListType'
import { _getRequestListOfTargetCompany, _getRequestListOfTargetCompanyAndMonth } from '../../services/request/RequestService'
import { ConstructionListCLType, ConstructionListType, toConstructionListCLType, toConstructionListType } from '../../models/construction/ConstructionListType'
import { SiteType, SiteCLType } from '../../models/site/Site'
import { _getSubConstructionListOfTargetContract, _getCompanyConstructionListOfTargetCompany } from '../../services/construction/ConstructionService'

export const countSiteArrangements = (site: SiteType | SiteCLType | undefined): number => {
    return site?.allArrangements?.items?.length ?? 0
}

export const countConstructionArrangements = (construction: ConstructionType | ConstructionCLType | undefined): number => {
    return sumBy(construction?.sites?.items?.map((site) => countSiteArrangements(site)))
}

export const sortSiteByMeetingDate = (sites?: SiteType[]): SiteType[] => {
    return sites?.sort((a, b) => (a.meetingDate ?? a.siteDate ?? 0) - (b.meetingDate ?? b.siteDate ?? 0)) ?? []
}

export type GetSelectableConstructionListParam = {
    myCompanyId?: string
}

export type GetSelectableConstructionListResponse = ConstructionCLType[] | undefined

export const getSelectableConstructionList = async (params: GetSelectableConstructionListParam): Promise<CustomResponse<GetSelectableConstructionListResponse>> => {
    try {
        const { myCompanyId } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報が足りません。ログインし直してください。',
            } as CustomResponse
        }

        const result = await _getCompanyConstructionListOfTargetCompany({
            companyId: myCompanyId,
            options: {
                project: true,
                displayName: true,
                sites: { allArrangements: true },
                constructionRelation: {
                    params: {
                        companyId: myCompanyId,
                    },
                },
                contract: true,//部署絞り込みに使用
            },
            types: ['all'],
        })
        if (result.error) {
            throw {
                error: result.error,
            }
        }

        return Promise.resolve({
            success: result.success?.totalConstructions?.items?.map((data) => toConstructionCLType(data)).filter((data) => data != undefined) as GetSelectableConstructionListResponse,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetSelectableConstructionListFilteredTargetDateParam = {
    myCompanyId?: string
    targetDate?: CustomDate
}

export const getSelectableConstructionListFilteredTargetDate = async (params: GetSelectableConstructionListFilteredTargetDateParam): Promise<CustomResponse<GetSelectableConstructionListResponse>> => {
    try {
        const { myCompanyId, targetDate } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報が足りません。ログインし直してください。',
            } as CustomResponse
        }

        if (targetDate == undefined) {
            throw {
                error: '現場の対象日が設定されていません。',
            } as CustomResponse
        }

        const result = await _getCompanyConstructionListOfTargetCompany({
            companyId: myCompanyId,
            options: {
                displayName: true,
                sites: true,
                constructionRelation: {
                    params: {
                        companyId: myCompanyId,
                    },
                },
                project: true,
                contract: true,//部署絞り込みに使用
            },
            types: ['fake-company-manage', 'manage'],
        })
        if (result.error) {
            throw {
                error: result.error,
            }
        }

        const checkInDateRange = (data: ConstructionCLType): boolean => {
            if (data == undefined) {
                return false
            }

            if (
                data.project?.startDate &&
                data.project?.endDate &&
                (dayBaseTextWithoutDate(data.project.startDate) as string) <= dayBaseTextWithoutDate(targetDate) &&
                dayBaseTextWithoutDate(targetDate) <= (dayBaseTextWithoutDate(data.project.endDate) as string)
            ) {
                let hitFlag = false
                /**
                 * すでに現場が存在していたら弾く。
                 */
                data.sites?.items?.forEach((item) => {
                    if (item.startDate && dayBaseTextWithoutDate(item.startDate) == dayBaseTextWithoutDate(targetDate)) {
                        hitFlag = true
                    }
                })

                return !hitFlag
            } else {
                return false
            }
        }

        const rtnList = result.success?.totalConstructions?.items?.map((data) => toConstructionCLType(data)).filter((data) => checkInDateRange(data)) as GetSelectableConstructionListResponse

        return Promise.resolve({
            success: rtnList,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export type GetSelectableConstructionListFilteredTargetMonthParam = {
    myCompanyId?: string
    targetMonth?: CustomDate
}

export const getSelectableConstructionListFilteredTargetMonth = async (
    params: GetSelectableConstructionListFilteredTargetMonthParam,
): Promise<CustomResponse<GetSelectableConstructionListResponse>> => {
    try {
        const { myCompanyId, targetMonth } = params
        if (myCompanyId == undefined) {
            throw {
                error: '自社情報が足りません。ログインし直してください。',
            } as CustomResponse
        }

        if (targetMonth == undefined) {
            throw {
                error: '現場の対象日が設定されていません。',
            } as CustomResponse
        }

        const result = await _getCompanyConstructionListOfTargetCompany({
            companyId: myCompanyId,
            options: {
                project: true,
                displayName: true,
                constructionRelation: {
                    params: {
                        companyId: myCompanyId,
                    },
                },
                contract: true,//部署絞り込みに使用
            },
            types: ['fake-company-manage', 'manage'],
        })
        if (result.error) {
            throw {
                error: result.error,
            }
        }

        const checkInMonthRange = (data: ConstructionCLType): boolean => {
            if (data == undefined) {
                return false
            }

            if (
                data.project?.endDate &&
                data.project?.startDate &&
                (monthBaseText(data.project.startDate) as string) <= monthBaseText(targetMonth) &&
                monthBaseText(targetMonth) <= (monthBaseText(data.project.endDate) as string)
            ) {
                return true
            } else {
                return false
            }
        }

        const rtnList = result.success?.totalConstructions?.items?.map((data) => toConstructionCLType(data)).filter((data) => checkInMonthRange(data)) as GetSelectableConstructionListResponse

        return Promise.resolve({
            success: rtnList,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

/**
 * - totalConstructions - その会社の常用依頼(した or された)現場を含む工事一覧の取得
 * - orderConstructions - その会社の常用依頼した現場を含む工事一覧の取得
 * - receiveConstructions - その会社の常用依頼された現場を含む工事一覧の取得
 */
export type GetRequestConstructionListOfTargetCompanyAndMonthResponse = {
    totalConstructions?: ConstructionListType
    orderConstructions?: ConstructionListType
    receiveConstructions?: ConstructionListType
}
/**
 * @requires
 * - companyId - 会社ID
 * - month - 取得したい月
 * - types - 受発注
 */
export type GetRequestProjectListOfTargetCompanyAndMonthParam = {
    companyId?: string
    month?: CustomDate
    types?: GetCompanyRequestListType
}
/**
 * @remarks その会社の常用依頼(した or された)現場を含む工事一覧の取得
 * @objective  RequestList.tsxにおいて常用依頼の一覧を取得するため。
 * @error
 * - COMPANY_ERROR - 自社Idがなかった場合
 * - MONTH_ERROR - monthがなかった場合
 * - REQUEST_ERROR - 依頼の取得に失敗した場合
 * - CONSTRUCTION_ERROR - 工事の取得に失敗した場合
 * @author  Kamiya
 * @param params - {@link GetRequestProjectListOfTargetCompanyAndMonthParam}
 * @returns - {@link GetRequestConstructionListOfTargetCompanyAndMonthResponse}
 */
export const getRequestConstructionListOfTargetCompanyAndMonth = async (
    params: GetRequestProjectListOfTargetCompanyAndMonthParam,
): Promise<CustomResponse<GetRequestConstructionListOfTargetCompanyAndMonthResponse>> => {
    try {
        const { companyId, month, types } = params
        if (companyId == undefined) {
            throw {
                error: 'idが足りません。',
                errorCode: 'COMPANY_ERROR',
            } as CustomResponse
        }
        if (month == undefined) {
            throw {
                error: '月が足りません。',
                errorCode: 'MONTH_ERROR',
            } as CustomResponse
        }

        /**
         * 会社IDから現場付きでリクエスト取得
         */
        const requests = await _getRequestListOfTargetCompanyAndMonth({
            companyId,
            month: getYYYYMMTotalSeconds(month),
            endOfMonth: getMonthlyFinalDay(month).totalSeconds,
            types: types,
            options: {
                requestMeter: true,
                site: {
                    construction: {
                        project: true, //constructionCompanies.tsxでの工期表示
                        displayName: true,
                        contract: true,
                        constructionRelation: {
                            params: {
                                companyId,
                            },
                        },
                    },
                    siteNameData: true,
                    siteRelation: {
                        params: {
                            companyId,
                        },
                    },
                    allRequests: {
                        subRequests: {
                            requestedCompany: true,
                        },
                        subRespondCount: true,
                        requestMeter: {
                            params: {
                                arrangementOptions: {
                                    worker: true,
                                },
                                requestOptions: {
                                    requestedCompany: true,
                                },
                            },
                        },
                        company: true,
                        requestedCompany: true,
                    },
                },
            },
        })
        if (requests.error) {
            throw {
                error: requests.error,
                errorCode: 'REQUEST_ERROR',
            } as CustomResponse
        }
        /**
         * 取得した常用依頼の工事を取得
         */
        const constructions = await getRequestConstructionListOfRequests({ requests: requests?.success })
        if (constructions.error) {
            throw {
                error: constructions.error,
                errorCode: 'CONSTRUCTION_ERROR',
            } as CustomResponse
        }
        return Promise.resolve({
            success: {
                totalConstructions: constructions.success?.totalConstructions,
                orderConstructions: constructions.success?.orderConstructions,
                receiveConstructions: constructions.success?.receiveConstructions,
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
/**
 * - totalConstructions - 月別の常用依頼のあった工事のリスト
 * - orderConstructions - 月別の常用依頼をした工事のリスト
 * - receiveConstructions - 月別の常用依頼をされた工事のリスト
 */
export type GetRequestConstructionListOfRequestsResponse = {
    totalConstructions?: ConstructionListType
    orderConstructions?: ConstructionListType
    receiveConstructions?: ConstructionListType
}
/**
 * @requires
 * - requests - 工事一覧を取得したい常用依頼の一覧 sites必須
 */
export type GetRequestConstructionListOfRequestsParam = {
    requests?: CompanyRequestListType
}
/**
 * @remarks 常用依頼(した or された)現場を含む工事一覧の取得
 * @objective 常用依頼から、常用依頼一覧に表示するための工事一覧を取得するため
 * @error
 * - REQUEST_ERROR - requestの取得に失敗した際
 * @author  Kamiya
 * @param params - {@link GetRequestConstructionListOfRequestsParam}
 * @returns - {@link GetRequestConstructionListOfRequestsResponse}
 */

export const getRequestConstructionListOfRequests = async (params: GetRequestConstructionListOfRequestsParam): Promise<CustomResponse<GetRequestConstructionListOfRequestsResponse>> => {
    try {
        const { requests } = params
        if (requests == undefined) {
            throw {
                error: 'requestsが足りません。',
                errorCode: 'REQUEST_ERROR',
            } as CustomResponse
        }

        /**
         * 常用依頼受注側は、申請済みのものだけに絞り込む
         */
        const isApplicationReceiveRequests = requests.receiveRequests?.items?.filter((data) => data.isApplication == true) ?? []
        const isApplicationAllRequests = [...isApplicationReceiveRequests, ...(requests?.orderRequests?.items ?? [])]

        /**
         * 別リクエストの同じ現場を削除した現場の配列
         */
        const orderSites = Array.from(new Map(requests?.orderRequests?.items?.map((item) => [item.siteId, item.site])).values())
        const receiveSites = Array.from(new Map(isApplicationReceiveRequests?.map((item) => [item.siteId, item.site])).values())
        const allSites = Array.from(new Map(isApplicationAllRequests?.map((item) => [item.siteId, item.site])).values())

        /**
         * 現場から工事を取得して、元の現場を工事に入れて返却
         * 工事の重複あり
         */
        const orderConstructions =
            orderSites
                .map((site) => {
                    return {
                        ...site?.construction,
                        sites: { items: [site] },
                    } as ConstructionType
                })
                .filter((construction) => construction != undefined) ?? []

        const receiveConstructions =
            receiveSites
                .map((site) => {
                    return {
                        ...site?.construction,
                        sites: { items: [site] },
                    } as ConstructionType
                })
                .filter((construction) => construction != undefined) ?? []
        const allConstructions =
            allSites
                .map((site) => {
                    return {
                        ...site?.construction,
                        sites: { items: [site] },
                    } as ConstructionType
                })
                .filter((construction) => construction != undefined) ?? []

        /**
         * 同じ工事の現場を結合して工事を一つにまとめる
         */
        let uniqOrderConstructions: ConstructionType[] = []
        orderConstructions?.map((construction) => {
            if (uniqOrderConstructions?.map((_construction) => _construction.constructionId).filter((id) => id == construction.constructionId).length > 0) {
                /**
                 * 同じ工事が存在する場合
                 */
                const updateConstruction = uniqOrderConstructions.filter((con) => con.constructionId == construction.constructionId)[0]
                const newConstruction = {
                    ...updateConstruction,
                    sites: { items: [...(updateConstruction?.sites?.items ?? []), ...(construction?.sites?.items ?? [])] },
                }
                uniqOrderConstructions = [...uniqOrderConstructions.filter((con) => con.constructionId != construction.constructionId), newConstruction].filter((data) => data != undefined)
            } else {
                uniqOrderConstructions.push(construction)
            }
        })
        let uniqReceiveConstructions: ConstructionType[] = []
        receiveConstructions?.map((construction) => {
            if (uniqReceiveConstructions?.map((_construction) => _construction.constructionId).filter((id) => id == construction.constructionId).length > 0) {
                /**
                 * 同じ工事が存在する場合
                 */
                const updateConstruction = uniqReceiveConstructions.filter((con) => con.constructionId == construction.constructionId)[0]
                const newConstruction = {
                    ...updateConstruction,
                    sites: { items: [...(updateConstruction?.sites?.items ?? []), ...(construction?.sites?.items ?? [])] },
                }
                uniqReceiveConstructions = [...uniqReceiveConstructions.filter((con) => con.constructionId != construction.constructionId), newConstruction].filter((data) => data != undefined)
            } else {
                uniqReceiveConstructions.push(construction)
            }
        })
        let uniqAllConstructions: ConstructionType[] = []
        allConstructions?.map((construction) => {
            if (uniqAllConstructions?.map((_construction) => _construction.constructionId).filter((id) => id == construction.constructionId).length > 0) {
                /**
                 * 同じ工事が存在する場合
                 */
                const updateConstruction = uniqAllConstructions.filter((con) => con.constructionId == construction.constructionId)[0]
                const newConstruction = {
                    ...updateConstruction,
                    sites: { items: [...(updateConstruction?.sites?.items ?? []), ...(construction?.sites?.items ?? [])] },
                }
                uniqAllConstructions = [...uniqAllConstructions.filter((con) => con.constructionId != construction.constructionId), newConstruction].filter((data) => data != undefined)
            } else {
                uniqAllConstructions.push(construction)
            }
        })

        return Promise.resolve({
            success: {
                totalConstructions: toConstructionListType(uniqAllConstructions),
                orderConstructions: toConstructionListType(uniqOrderConstructions),
                receiveConstructions: toConstructionListType(uniqReceiveConstructions),
            },
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
