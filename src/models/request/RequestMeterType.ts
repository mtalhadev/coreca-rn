import { ArrangementListType, ArrangementListCLType, toArrangementListCLType } from '../arrangement/ArrangementListType'
import { SiteRelationType } from '../site/SiteRelationType'
import { ReplaceAnd } from '../_others/Common'
import { ID } from '../_others/ID'
import { GetRequestOptionParam } from './Request'
import { RequestListCLType, RequestListType, toRequestListCLType } from './RequestListType'

export type RequestMeterType = {
    companyPresentNum?: number
    companyRequiredNum?: number
    presentArrangements?: ArrangementListType
    presentRequests?: RequestListType
}

export type RequestMeterCLType = ReplaceAnd<
    RequestMeterType,
    {
        presentArrangements?: ArrangementListCLType
        presentRequests?: RequestListCLType
    }
>

export const toRequestMeterCLType = (data: RequestMeterType): RequestMeterCLType => {
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
export const getRequestMeterOption = (myCompanyId: ID, siteRelation?: SiteRelationType): GetRequestOptionParam => ({
    requestMeter: {
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
 * {@link getRequestMeterOption}に勤怠も追加したバージョン
 * @param myCompanyId
 * @param siteRelation
 * @returns
 */
export const getRequestMeterWithAttendanceOption = (myCompanyId: ID, siteRelation?: SiteRelationType): GetRequestOptionParam => ({
    requestMeter: {
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
