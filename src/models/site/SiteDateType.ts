import { CommonModel, Create, ReplaceAnd, Update } from '../_others/Common'
import { GetOptionObjectType, GetOptionParam } from '../_others/Option'
import { TotalSeconds } from '../_others/TotalSeconds'
import { ID } from '../_others/ID'
import { SiteType } from './Site'

/**
 * 会社毎、日付毎の現場データを保存。SSG用
 */
export type SiteDateModel = Partial<{
    siteDateId: ID
    date: TotalSeconds
    companyId: ID
    sites: SiteType[]
}> &
    CommonModel

export const initSiteDate = (siteDate: Create<SiteDateModel> | Update<SiteDateModel>): Update<SiteDateModel> => {
    const newSiteDate: Update<SiteDateModel> = {
        siteDateId: siteDate.siteDateId,
        date: siteDate.date,
        companyId: siteDate.companyId,
        sites: siteDate.sites,
    }
    return newSiteDate
}

/**
 * {@link SiteDateOptionParam - 説明}
 */
export type SiteDateOptionInputParam = ReplaceAnd<
    GetOptionObjectType<SiteDateOptionParam>,
    {
        //
    }
>

export type GetSiteDateOptionParam = GetOptionParam<SiteDateType, SiteDateOptionParam, SiteDateOptionInputParam>

/**
 *
 */
export type SiteDateOptionParam = {
    //
}

export type SiteDateType = SiteDateModel & SiteDateOptionParam
