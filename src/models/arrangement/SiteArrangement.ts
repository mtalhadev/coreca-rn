import { CommonCLType, CommonModel, Create, ReplaceAnd, Update, toCommonCLType } from '../_others/Common'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'
import { TotalSeconds } from '../_others/TotalSeconds'
import { ID } from '../_others/ID'
import { SiteArrangementDataCLType, SiteArrangementDataType, toSiteArrangementDataCLType } from './SiteArrangementDataType'
import { SiteCLType, SiteType, toSiteCLType } from '../site/Site'
import { RequestCLType, RequestType, toRequestCLType } from '../request/Request'
import { SiteMeterCLType, SiteMeterType, toSiteMeterCLType } from '../site/SiteMeterType'
import { RequestMeterCLType, RequestMeterType } from '../request/RequestMeterType'
import { CustomDate, toCustomDateFromTotalSeconds } from '../_others/CustomDate'
import { InstructionCLType, InstructionModel, toInstructionCLType } from '../instruction/Instruction'

/**
 * 現場の手配データを保存。SSG用
 */
export type SiteArrangementModel = Partial<{
    siteArrangementId: ID
    date: TotalSeconds
    companyId: ID
    siteId: ID
    siteArrangementData?: SiteArrangementDataType
    site?: SiteType
    request?: RequestType
    targetMeter?: SiteMeterType | RequestMeterType
    instruction?: InstructionModel
}> &
    CommonModel

export const initSiteArrangement = (siteArrangement: Create<SiteArrangementModel> | Update<SiteArrangementModel>): Update<SiteArrangementModel> => {
    const newSiteArrangement: Update<SiteArrangementModel> = {
        siteArrangementId: siteArrangement.siteArrangementId,
        date: siteArrangement.date,
        companyId: siteArrangement.companyId,
        siteId: siteArrangement.siteId,
        siteArrangementData: siteArrangement.siteArrangementData,
        site: siteArrangement.site,
        request: siteArrangement.request,
        targetMeter: siteArrangement.targetMeter,
        instruction: siteArrangement.instruction,
    }
    return newSiteArrangement
}

export type SiteArrangementCLType = ReplaceAnd<
    SiteArrangementModel,
    {
        date?: CustomDate
        siteArrangementData?: SiteArrangementDataCLType
        site?: SiteCLType
        request?: RequestCLType
        targetMeter?: SiteMeterCLType | RequestMeterCLType
        instruction?: InstructionCLType
    } & CommonCLType
>

export const toSiteArrangementCLType = (data?: SiteArrangementModel): SiteArrangementCLType => {
    const newSiteArrangement: SiteArrangementCLType = {
        ...toCommonCLType(data),
        date: data?.date ? toCustomDateFromTotalSeconds(data?.date) : undefined,
        siteArrangementData: data?.siteArrangementData ? toSiteArrangementDataCLType(data?.siteArrangementData) : undefined,
        site: data?.site ? toSiteCLType(data?.site) : undefined,
        request: data?.request ? toRequestCLType(data?.request) : undefined,
        targetMeter: data?.targetMeter ? toSiteMeterCLType(data?.targetMeter) : undefined,
        instruction: data?.instruction ? toInstructionCLType(data?.instruction) : undefined,
    }
    return newSiteArrangement
}

/**
 * {@link SiteArrangementOptionParam - 説明}
 */
export type SiteArrangementOptionInputParam = ReplaceAnd<
    GetOptionObjectType<SiteArrangementOptionParam>,
    {
        //
    }
>

export type GetSiteArrangementOptionParam = GetOptionParam<SiteArrangementType, SiteArrangementOptionParam, SiteArrangementOptionInputParam>

/**
 *
 */
export type SiteArrangementOptionParam = {
    //
}

export type SiteArrangementType = SiteArrangementModel & SiteArrangementOptionParam
