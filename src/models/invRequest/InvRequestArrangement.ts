import { CommonCLType, CommonModel, Create, ReplaceAnd, Update, toCommonCLType } from '../_others/Common'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'
import { SiteCLType, SiteType, toSiteCLType } from '../site/Site'
import { RequestCLType, RequestType, toRequestCLType } from '../request/Request'
import { SiteMeterCLType, SiteMeterType, toSiteMeterCLType } from '../site/SiteMeterType'
import { InvRequestCLType, InvRequestType, toInvRequestCLType } from './InvRequestType'
import { SiteArrangementDataCLType, SiteArrangementDataType, toSiteArrangementDataCLType } from '../arrangement/SiteArrangementDataType'
import { ID } from '../_others/ID'
import { RequestMeterCLType } from '../request/RequestMeterType'

/**
 * 常用で送る手配データを保存。SSG用
 */
export type InvRequestArrangementModel = Partial<{
    invRequestArrangementId: ID
    invRequestId: ID
    companyId: ID
    invRequest: InvRequestType
    invRequestArrangementData: SiteArrangementDataType
    targetMeter: SiteMeterType
    fakeSite: SiteType
    respondRequest: RequestType
}> &
    CommonModel

export const initInvRequestArrangement = (invRequestArrangement: Create<InvRequestArrangementModel> | Update<InvRequestArrangementModel>): Update<InvRequestArrangementModel> => {
    const newSiteArrangement: Update<InvRequestArrangementModel> = {
        invRequestArrangementId: invRequestArrangement.invRequestArrangementId,
        invRequestId: invRequestArrangement.invRequestId,
        companyId: invRequestArrangement.companyId,
        invRequest: invRequestArrangement.invRequest,
        invRequestArrangementData: invRequestArrangement.invRequestArrangementData,
        targetMeter: invRequestArrangement.targetMeter,
        fakeSite: invRequestArrangement.fakeSite,
        respondRequest: invRequestArrangement.respondRequest,
    }
    return newSiteArrangement
}

export type InvRequestArrangementCLType = ReplaceAnd<
    InvRequestArrangementModel,
    {
        // date?: CustomDate,
        invRequestArrangementData?: SiteArrangementDataCLType
        fakeSite?: SiteCLType
        respondRequest?: RequestCLType
        targetMeter?: SiteMeterCLType | RequestMeterCLType
        invRequest?: InvRequestCLType
    } & CommonCLType
>

export const toInvRequestArrangementCLType = (data?: InvRequestArrangementModel): InvRequestArrangementCLType => {
    const newInvRequestArrangement: InvRequestArrangementCLType = {
        ...toCommonCLType(data),
        // date: data?.date ? toCustomDateFromTotalSeconds(data?.invRequest?.date) : undefined,
        invRequestArrangementData: data?.invRequestArrangementData ? toSiteArrangementDataCLType(data?.invRequestArrangementData) : undefined,
        fakeSite: data?.fakeSite ? toSiteCLType(data?.fakeSite) : undefined,
        respondRequest: data?.respondRequest ? toRequestCLType(data?.respondRequest) : undefined,
        targetMeter: data?.targetMeter ? toSiteMeterCLType(data?.targetMeter) : undefined,
        invRequest: data?.invRequest ? toInvRequestCLType(data?.invRequest) : undefined,
    }
    return newInvRequestArrangement
}

/**
 * {@link InvRequestArrangementOptionParam - 説明}
 */
export type InvRequestArrangementOptionInputParam = ReplaceAnd<
    GetOptionObjectType<InvRequestArrangementOptionParam>,
    {
        //
    }
>

export type GetInvRequestArrangementOptionParam = GetOptionParam<InvRequestArrangementType, InvRequestArrangementOptionParam, InvRequestArrangementOptionInputParam>

/**
 *
 */
export type InvRequestArrangementOptionParam = {
    //
}

export type InvRequestArrangementType = InvRequestArrangementModel & InvRequestArrangementOptionParam
