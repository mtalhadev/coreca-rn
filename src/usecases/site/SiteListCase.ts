import flatten from 'lodash/flatten'
import { SiteDateInfoType } from '../../components/organisms/site/SiteDateBox'
import { ConstructionType } from '../../models/construction/Construction'
import { GetSiteOptionParam, SiteType, toSiteCLType } from '../../models/site/Site'
import { _getCompany } from '../../services/company/CompanyService'
import { _getConstruction } from '../../services/construction/ConstructionService'
import { _getSite, _getSiteOfTargetFakeCompanyInvRequestId } from '../../services/site/SiteService'
import { _getArrangementListOfTargetWorker } from '../../services/arrangement/ArrangementService'
import { _getSiteListOfTargetConstruction, _makeSiteName } from '../../services/site/SiteService'
import { toCustomDateFromTotalSeconds } from '../../models/_others/CustomDate'
import { InstructionCLType } from '../../models/instruction/Instruction'
import { InvReservationType } from '../../models/invReservation/InvReservation'
import { InvRequestType } from '../../models/invRequest/InvRequestType'
import { ID } from '../../models/_others/ID'
import { SiteListType, toSiteListType } from '../../models/site/SiteListType'
import { getErrorMessage } from '../../services/_others/ErrorService'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { _getAttendanceListOfTargetSiteAndWorker } from '../../services/attendance/AttendanceService'

/**
 *
 * @param site
 * @param siteNumber
 * @param construction withDisplayName必須
 * @param instruction
 * @returns
 */
export const toSiteDateInfoType = (site?: SiteType, construction?: ConstructionType, instruction?: InstructionCLType): SiteDateInfoType => {
    const _date = site?.meetingDate ?? site?.siteDate
    return {
        date: _date ? toCustomDateFromTotalSeconds(_date) : undefined,
        ...site,
        construction,
        instruction: instruction,
    } as SiteDateInfoType
}

type SiteAndInvRequest = {
    site: SiteType
    invRequestId: string
}
export type InvReservationToUniqSitesResponse = SiteAndInvRequest[]
/**
 * invReservationから、手配された現場の一覧を返す。
 * 現場が被っていた場合は、同一現場にまとめる。
 * companyInvoice.tsxでの表示用のため、siteMeterとpresentArrangementsは常用申請作業員のみが入っている。
 */
export const InvReservationToUniqSites = (invReservation?: InvReservationType): InvReservationToUniqSitesResponse => {
    const invRequests =
        (invReservation?.monthlyInvRequests?.items?.filter((data) => data.attendanceIds?.length && data.attendanceIds?.length > 0).filter((data) => data != undefined) as InvRequestType[]) ?? []
    const siteAndInvRequests =
        (flatten(
            invRequests?.map((invR) =>
                flatten(
                    invR?.attendances?.map((att) => {
                        return {
                            site: {
                                ...att.arrangement?.site,
                                siteMeter: {
                                    ...att.arrangement?.site?.siteMeter,
                                    presentArrangements: {
                                        items: [att.arrangement].filter((data) => data != undefined),
                                    },
                                },
                            },
                            invRequestId: invR.invRequestId,
                        } as SiteAndInvRequest
                    }),
                ),
            ),
        ).filter((data) => data != undefined) as SiteAndInvRequest[]) ?? []

    let siteAndInvIds: SiteAndInvRequest[] = []
    /**
     * 同じ現場を結合して一つにまとめる
     */
    siteAndInvRequests?.map((siteAndInvRequest) => {
        if (siteAndInvIds?.map((siteDateInfo) => siteDateInfo.site.siteId).filter((id) => id == siteAndInvRequest.site.siteId).length > 0) {
            /**
             * 同じ現場が存在する場合
             */
            const updateSiteAndId = siteAndInvIds.filter((siteAndInvId) => siteAndInvId.site.siteId == siteAndInvRequest.site.siteId)[0]
            const newSite = {
                ...updateSiteAndId.site,
                siteMeter: {
                    ...updateSiteAndId.site.siteMeter,
                    presentArrangements: {
                        items: [
                            ...(updateSiteAndId.site?.siteMeter?.presentArrangements?.items ?? []), //old
                            ...(siteAndInvRequest.site?.siteMeter?.presentArrangements?.items ?? []), //new
                        ],
                    },
                },
            }
            siteAndInvIds = [
                ...siteAndInvIds.filter((_siteAndInvId) => _siteAndInvId.site.siteId != siteAndInvRequest.site.siteId),
                {
                    invRequestId: updateSiteAndId.invRequestId,
                    site: newSite,
                },
            ].filter((siteDateInfo) => siteDateInfo != undefined)
        } else {
            siteAndInvIds.push(siteAndInvRequest)
        }
    })
    const _siteIds = siteAndInvIds.map((and) => and.site?.siteId).filter((data) => data != undefined) as string[]
    const _siteIdsSet = new Set(_siteIds)
    const existSiteInvRequests = invReservation?.monthlyInvRequests?.items?.filter((invR) => invR.site?.siteId && !_siteIdsSet.has(invR.site?.siteId))
    const addData = existSiteInvRequests?.map((inv) => {
        return {
            site: inv.site,
            invRequestId: inv.invRequestId,
        } as SiteAndInvRequest
    })
    addData?.map((data) => siteAndInvIds.push(data))
    return siteAndInvIds
}
export type GetSiteListOfTargetInvRequestIdsResponse = SiteListType | undefined
/**
 * @param invRequestIds - 取得したい仮会社施工現場に紐づいているinvRequestId
 */
export type GetSiteListOfTargetInvRequestIdsParam = {
    invRequestIds?: ID[]
    options?: GetSiteOptionParam
}
/**
 * 仮会社へ常用で送った場合に自動で作成される仮会社施工の現場を、invRequestIdsを元に取得する。
 * @param params - {@link GetSiteListOfTargetInvRequestIdsParam}
 * @returns - {@link GetSiteListOfTargetInvRequestIdsResponse}
 */
export const getSiteListOfTargetInvRequestIds = async (params: GetSiteListOfTargetInvRequestIdsParam): Promise<CustomResponse<GetSiteListOfTargetInvRequestIdsResponse>> => {
    try {
        const { invRequestIds, options } = params
        if (invRequestIds == undefined) {
            throw {
                error: 'invRequestIdsがありません',
                errorCode: 'GET_SITES_IDS_ERROR',
            } as CustomResponse
        }
        const sitesResult = await Promise.all(invRequestIds?.map((id) => _getSiteOfTargetFakeCompanyInvRequestId({ fakeCompanyInvRequestId: id, options })))
        sitesResult.forEach((result) => {
            if (result.error) {
                throw {
                    error: result.error,
                    errorCode: 'GET_SITES_ERROR',
                } as CustomResponse
            }
        })
        const sites = sitesResult.map((result) => result.success).filter((data) => data != undefined) as SiteType[]
        return Promise.resolve({
            success: toSiteListType(sites),
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}
