import isEmpty from 'lodash/isEmpty'

import { _getConstructionListOfTargetCompaniesAndMonth } from '../../services/construction/ConstructionService'
import { _getRequestListOfTargetCompanies, _getRequestListOfTargetCompaniesAndMonth } from '../../services/request/RequestService'
import { CustomResponse } from '../../models/_others/CustomResponse'

import { getErrorMessage } from '../../services/_others/ErrorService'
import { CreateFileType } from '../../models/_others/FileType'
import { getRequestConstructionListOfRequests } from '../construction/ConstructionListCase'
import { CustomDate, dayBaseText, getMonthlyFinalDay, getMonthlyFirstDay, getYYYYMMTotalSeconds, newCustomDate } from '../../models/_others/CustomDate'
import { CompanyType } from '../../models/company/Company'
import { _sendInvoice } from '../../services/SendGridMail'
import { _createTargetCompanyInvoiceFileData } from '../../services/invoice/TargetCompanyInvoiceService'
import { _checkCompanyPlan } from '../../services/_others/PlanTicketService'
import { _getInvRequestListOfTargetCompaniesAndMonth } from '../../services/invRequest/InvRequestService'
import { ConstructionListType, toConstructionListType } from '../../models/construction/ConstructionListType'
import { toInvReservationListType } from '../../models/invReservation/InvReservationListType'
import { _getInvReservationListOfTargetCompaniesAndMonth } from '../../services/invReservation/InvReservationService'
import { InvoiceInvReservationListUIType } from '../../screens/adminSide/company/companyDetail/CompanyInvoice'
import { getSiteMeterOption } from '../../models/site/SiteMeterType'
import { DepartmentType } from '../../models/department/DepartmentType'
import { departmentsToText } from '../worker/CommonWorkerCase'

export type GetInvoiceResponse = {
    order: ConstructionListType
    receive: ConstructionListType
}
/**
 * @requires
 * - otherCompanyId - 顧客/取引先のID
 * - companyId - 自社のID
 */
export type GetContractInvoiceOfMonthParam = {
    otherCompanyId?: string
    companyId?: string
    month?: CustomDate
}
/**
 * @remarks 月別にオブジェクト化された顧客/取引先との間に受発注契約を持つ工事のリスト
 * @objective CompanyInvoice.tsxにおいて顧客/取引先との間の受発注契約を持つ工事を取得するため
 * @error
 * - OTHER_COMPANY_ERROR - 対象会社のIdがなかった場合
 * - COMPANY_ERROR - 自社のIdがなかった場合
 * - CONSTRUCTION_ERROR - 工事の取得に失敗した場合
 * @author  Kamiya
 * @param params - {@link GetContractInvoiceOfMonthParam}
 * @returns - {@link GetInvoiceResponse}
 */
export const getContractInvoiceOfMonth = async (params: GetContractInvoiceOfMonthParam): Promise<CustomResponse<GetInvoiceResponse>> => {
    const { otherCompanyId, companyId, month } = params
    if (isEmpty(otherCompanyId) || otherCompanyId == undefined || month == undefined) {
        throw {
            error: '情報が足りません。',
            errorCode: 'OTHER_COMPANY_ERROR',
        } as CustomResponse
    }
    if (companyId == undefined) {
        throw {
            error: '自社情報がありません。ログインし直してください。',
            errorCode: 'COMPANY_ERROR',
        } as CustomResponse
    }

    try {
        const constructionsResult = await _getConstructionListOfTargetCompaniesAndMonth({
            otherCompanyId,
            companyId,
            types: ['all'],
            month: getYYYYMMTotalSeconds(month),
            endOfMonth: getMonthlyFinalDay(month).totalSeconds,
            options: {
                constructionRelation: {
                    params: {
                        companyId,
                    },
                },
                displayName: true,
                sites: {
                    siteNameData: true,
                    allArrangements: true,
                    siteRelation: {
                        params: {
                            companyId,
                        },
                    },
                    ...getSiteMeterOption(companyId ?? 'no-id'),
                },
                project: true, //明細経由で契約削除後に再発注する際に使用
                contract: true,
            },
        })
        if (constructionsResult.error) {
            throw {
                error: constructionsResult.error,
                errorCode: 'CONSTRUCTION_ERROR',
            }
        }
        return Promise.resolve({
            success: {
                receive: toConstructionListType(constructionsResult?.success?.receiveConstructionList.totalConstructions?.items),
                order: toConstructionListType(constructionsResult?.success?.orderConstructionList.totalConstructions?.items),
            },
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}
/**
 * @requires
 * - otherCompanyId - 顧客/取引先のID
 * - companyId - 自社のID
 */
export type GetRequestInvoiceOfMonthParam = {
    otherCompanyId?: string
    companyId?: string
    month?: CustomDate
}
/**
 * @remarks 月別にオブジェクト化された顧客/取引先との間に受発注常用依頼を持つ工事のリスト
 * @objective CompanyInvoice.tsxにおいて顧客/取引先との間の受発注常用依頼を持つ工事を取得するため
 * @error
 * - OTHER_COMPANY_ERROR - 対象会社のIdがなかった場合
 * - COMPANY_ERROR - 自社のIdがなかった場合
 * - REQUEST_ERROR - 常用依頼の取得に失敗した場合
 * - CONSTRUCTION_ERROR - 工事の取得に失敗した場合
 * @author  Kamiya
 * @param params - {@link GetRequestInvoiceOfMonthParam}
 * @returns - {@link GetInvoiceResponse}
 */
export const getRequestInvoiceOfMonth = async (params: GetRequestInvoiceOfMonthParam): Promise<CustomResponse<GetInvoiceResponse>> => {
    const { otherCompanyId, companyId, month } = params
    if (isEmpty(otherCompanyId) || otherCompanyId == undefined || month == undefined) {
        throw {
            error: '情報が足りません。',
            errorCode: 'OTHER_COMPANY_ERROR',
        } as CustomResponse
    }
    if (companyId == undefined) {
        throw {
            error: '自社情報がありません。ログインし直してください。',
            errorCode: 'COMPANY_ERROR',
        } as CustomResponse
    }

    try {
        const requests = await _getRequestListOfTargetCompaniesAndMonth({
            companyId: companyId ?? 'no-id',
            targetCompanyId: otherCompanyId ?? 'no-id',
            types: ['all'],
            month: getYYYYMMTotalSeconds(month),
            endOfMonth: getMonthlyFinalDay(month).totalSeconds,
            options: {
                site: {
                    construction: {
                        project: true,
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
                            //Request.tsxで使用
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

        const constructions = await getRequestConstructionListOfRequests({ requests: requests?.success })
        if (constructions.error) {
            throw {
                error: constructions.error,
                errorCode: 'CONSTRUCTION_ERROR',
            } as CustomResponse
        }

        return Promise.resolve({
            success: {
                order: toConstructionListType(constructions.success?.orderConstructions?.items),
                receive: toConstructionListType(constructions.success?.receiveConstructions?.items),
            },
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}

/**
 * @requires
 * - otherCompanyId - 顧客/取引先のID
 * - companyId - 自社のID
 * - month - 取得する月
 */
export type GetInvRequestInvoiceOfMonthParam = {
    otherCompanyId?: string
    companyId?: string
    month?: CustomDate
}
/**
 * @remarks 指定月の顧客/取引先との間に受発注常用申請のリスト
 * @objective CompanyInvoice.tsxにおいて顧客/取引先との間の受発注常用申請を取得するため
 * @error
 * - MONTH_ERROR - 月情報がなかった場合
 * - INV_RESERVATION_ERROR - 対象会社のIdがなかった場合
 * - COMPANY_ERROR - 自社のIdがなかった場合
 * - INV_RESERVATION_ERROR - 常用申請取得エラー
 * @author  Kamiya
 * @param params - {@link GetInvRequestInvoiceOfMonthParam}
 * @returns - {@link InvoiceInvReservationListUIType}
 */
export const getInvRequestInvoiceOfMonth = async (params: GetInvRequestInvoiceOfMonthParam): Promise<CustomResponse<InvoiceInvReservationListUIType>> => {
    const { otherCompanyId, companyId, month } = params
    if (month == undefined) {
        throw {
            error: '月情報が足りません。',
            errorCode: 'MONTH_ERROR',
        } as CustomResponse
    }
    if (companyId == undefined) {
        throw {
            error: '自社情報がありません。ログインし直してください。',
            errorCode: 'COMPANY_ERROR',
        } as CustomResponse
    }
    if (otherCompanyId == undefined) {
        throw {
            error: '相手会社情報がありません',
            errorCode: 'OTHER_COMPANY_ERROR',
        } as CustomResponse
    }

    try {
        //TODO:明細経由で契約削除後の再発注してエラーが起きないか確認。起きるならproject必要か
        const invReservationResult = await _getInvReservationListOfTargetCompaniesAndMonth({
            companyId: companyId ?? 'no-id',
            targetCompanyId: otherCompanyId ?? 'no-id',
            types: ['all'],
            month: getYYYYMMTotalSeconds(month),
            endOfMonth: getMonthlyFinalDay(month).totalSeconds,
            options: {
                monthlyInvRequests: {
                    params: {
                        month: getMonthlyFirstDay(month).totalSeconds,
                        endOfMonth: getMonthlyFinalDay(month).totalSeconds,
                    },
                    workers: true,
                    attendances: {
                        arrangement: {
                            site: {
                                siteNameData: true,
                                siteRelation: {
                                    params: {
                                        companyId,
                                    },
                                },
                                ...getSiteMeterOption(companyId ?? 'no-id'),
                            },
                            worker: true,
                        },
                    },
                    site: {
                        siteNameData: true,
                        siteRelation: {
                            params: {
                                companyId,
                            },
                        },
                        ...getSiteMeterOption(companyId ?? 'no-id'),
                    },
                },
            },
        })
        if (invReservationResult.error) {
            throw {
                error: invReservationResult.error,
                errorCode: 'INV_RESERVATION_ERROR',
            } as CustomResponse
        }
        return Promise.resolve({
            success: {
                order: toInvReservationListType(invReservationResult.success?.orderInvReservations?.items),
                receive: toInvReservationListType(invReservationResult.success?.receiveInvReservations?.items),
            },
        })
    } catch (error: any) {
        return getErrorMessage(error)
    }
}
/**
 * @requires
 * - email - 送付先のメールアドレス
 * - type - 添付ファイルの形式指定（csv,excl,両方）
 * - otherCompany - 対象会社
 * - companyId - 自社のId
 * - month - 請求月
 * - myWorkerName - 自身。作成者を特定するため。
 * - departmentIds - 請求部署
 */
export type sendTargetCompanyInvoiceFileParams = {
    email: string
    type: CreateFileType
    otherCompany?: CompanyType
    companyId?: string
    month?: CustomDate
    myWorkerName?: string
    departments?: DepartmentType[]
}
/**
 * @remarks 明細データをメールに添付してデータベースに登録する。
 * @objective 明細データをメールに添付して送付するため
 * @error
 * - FILE_ERROR - 添付ファイルの作成に失敗した際
 * - MONTH_ERROR - monthがなかった時
 * @author Kamiya
 * @param params - {@link sendTargetCompanyInvoiceFileParams}
 * @returns - boolean
 */
export const sendTargetCompanyInvoiceFile = async (params: sendTargetCompanyInvoiceFileParams): Promise<CustomResponse> => {
    try {
        const { email, type, otherCompany, companyId, month, myWorkerName, departments } = params
        if (companyId == undefined) {
            throw {
                error: '自社IDがありません。',
                errorCode: 'EMPTY_COMPANY_ID',
            }
        }
        const planResult = await _checkCompanyPlan({
            companyId,
            action: 'create-invoice',
        })
        if (planResult.error || planResult.success != true) {
            throw {
                error: 'ご利用のプランではこの機能は使用できません。',
                errorCode: 'PLAN_LOCK',
            }
        }
        if (month == undefined) {
            throw {
                error: 'ダウンロードする月が指定されていません',
                errorCode: 'MONTH_ERROR',
            }
        }
        const fileDataResult = await _createTargetCompanyInvoiceFileData({
            fileType: type,
            otherCompanyId: otherCompany?.companyId,
            companyId,
            month: getYYYYMMTotalSeconds(month),
            endOfMonth: getMonthlyFinalDay(month).totalSeconds,
            timeZoneOffset: newCustomDate().timeZoneOffset,
            departments: departments,
        })
        if (fileDataResult.error) {
            throw {
                error: fileDataResult.error,
                errorCode: 'FILE_ERROR',
            } as CustomResponse
        }
        const result = await _sendInvoice({
            email,
            fileData: fileDataResult.success,
            mailInfo: {
                targetCompanyInvoice: {
                    companyName: otherCompany?.name ?? '',
                },
                commonInvoice: {
                    title: otherCompany?.name
                        ? month?.month + '月明細' + `@${departmentsToText(departments, '_')}`  + '_' + otherCompany?.name
                        : month?.month + '月明細' + `@${departmentsToText(departments, '_')}`,
                    month: month?.month + '月' ?? '',
                    today: dayBaseText(newCustomDate()),
                    myWorkerName: myWorkerName ?? '',
                    departments: departmentsToText(departments, '_')
                },
            },
        })
        if (result.error) {
            throw {
                error: result.error,
                errorCode: result.errorCode,
            }
        }
        return Promise.resolve({
            success: true,
            error: undefined,
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
