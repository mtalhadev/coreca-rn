import { CommonListType, ReplaceAnd } from '../_others/Common'
import { SiteType, SiteCLType, toSiteCLType } from './Site'

export type GetSiteListType = 'all'[]

export type SiteListType = CommonListType<SiteType> & {
    items?: SiteType[]
}

export type SiteListCLType = ReplaceAnd<
    SiteListType,
    {
        items?: SiteCLType[]
    }
>

export const toSiteListCLType = (data?: SiteListType): SiteListCLType => {
    return {
        ...data,
        items: data?.items ? data?.items?.map((val) => toSiteCLType(val)) : undefined,
    }
}

export const toSiteListType = (items?: SiteType[], mode?: 'all' | 'none'): SiteListType => {
    mode = mode ?? 'all'
    if (mode == 'none') {
        return {
            items,
        }
    }
    return {
        items,
    }
}
