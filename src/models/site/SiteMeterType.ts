import { ArrangementListCLType, ArrangementListType, toArrangementListCLType } from '../arrangement/ArrangementListType'
import { RequestListCLType, RequestListType, toRequestListCLType } from '../request/RequestListType'
import { ReplaceAnd } from '../_others/Common'
import { ID } from '../_others/ID'
import { GetSiteOptionParam } from './Site'
import { SiteRelationType } from './SiteRelationType'
import { RequestMeterType } from '../request/RequestMeterType'

export type SiteMeterType = {
    companyPresentNum?: number
    companyRequiredNum?: number
    presentArrangements?: ArrangementListType
    presentRequests?: RequestListType
}

export type SiteMeterCLType = ReplaceAnd<
    SiteMeterType,
    {
        presentArrangements?: ArrangementListCLType
        presentRequests?: RequestListCLType
    }
>

export const toSiteMeterCLType = (data: SiteMeterType | RequestMeterType): SiteMeterCLType => {
    return {
        ...data,
        presentArrangements: data.presentArrangements ? toArrangementListCLType(data.presentArrangements) : undefined,
        presentRequests: data.presentRequests ? toRequestListCLType(data.presentRequests) : undefined,
    }
}

// #### よく使うOption

/**
 * @param myCompanyId 自社
 * @param siteRelation 最適化のため
 * @returns WorkerListへの表示も含めてMeterを取得する際に使用。
 */
export const getSiteMeterOption = (myCompanyId: ID, siteRelation?: SiteRelationType): GetSiteOptionParam => ({
    siteMeter: {
        params: {
            companyId: myCompanyId,
            arrangementOptions: {
                worker: true,
            },
            requestOptions: {
                requestedCompany: true,
            },
            ...(siteRelation
                ? {
                      siteRelation,
                  }
                : {}),
        },
    },
})

/**
 * {@link getSiteMeterOption}に勤怠も追加したバージョン
 * @param myCompanyId
 * @param siteRelation
 * @returns
 */
export const getSiteMeterWithAttendanceOption = (myCompanyId: ID, siteRelation?: SiteRelationType): GetSiteOptionParam => ({
    siteMeter: {
        params: {
            companyId: myCompanyId,
            arrangementOptions: {
                worker: true,
                attendance: true,
            },
            requestOptions: {
                requestedCompany: true,
                subRespondCount: true,
                subAttendances: true,
            },
            ...(siteRelation
                ? {
                      siteRelation,
                  }
                : {}),
        },
    },
})
