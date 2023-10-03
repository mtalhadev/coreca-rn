import { CommonListType, ReplaceAnd } from '../_others/Common'
import { SiteType } from './Site'
import { SiteListCLType, SiteListType, toSiteListCLType } from './SiteListType'

export type GetCompanySiteListType = ('all' | 'order' | 'order-children' | 'manage' | 'fake-company-manage' | 'requested')[]

/**
 * @param
 * @param orderSites - 発注現場。オーナーと仲介
 * @param orderChildSites - 発注管理下（直接発注契約を持たないが発注契約の下の工事の現場）
 * @param managerSites - 自社施工現場
 * @param requestedSites - 常用現場。他社から依頼された常用現場。
 * @param fakeCompanyMangerSites - 仮会社施工の現場。実質、常用現場。仮会社の必要作業員数は自社への常用依頼作業員数。
 */
export type CompanySiteListType<ListType extends CommonListType<SiteType> = SiteListType> = CommonListType<SiteType> & {
    totalSites?: ListType

    // == 発注現場 ==
    // オーナーと仲介、
    orderSites?: number[]
    // 発注管理下
    orderChildSites?: number[]

    // === 施工現場 ===
    managerSites?: number[]

    // ==== 常用現場 ===
    // 仮会社の必要作業員数は実質、自社への常用依頼作業員数。
    fakeCompanyMangerSites?: number[]
    requestedSites?: number[]

    // その他
    otherCompanySites?: number[]
}

/**
 * @param
 * @param orderSites - 発注現場。オーナーと仲介
 * @param orderChildSites - 発注管理下（直接発注契約を持たないが発注契約の下の工事の現場）
 * @param managerSites - 自社施工現場
 * @param requestedSites - 常用現場。他社から依頼された常用現場。
 * @param fakeCompanyMangerSites - 仮会社施工の現場。実質、常用現場。仮会社の必要作業員数は自社への常用依頼作業員数。
 */
export type CompanySiteListCLType<ListCLType extends CommonListType<SiteType> = SiteListCLType> = ReplaceAnd<
    CompanySiteListType,
    {
        totalSites?: ListCLType
        // == 発注現場 ==
        // オーナーと仲介
        orderSites?: number[]
        // 発注管理下
        orderChildSites?: number[]

        // === 施工現場 ===
        managerSites?: number[]

        // ==== 常用現場 ===
        // 仮会社の必要作業員数は実質、自社への常用依頼作業員数。
        fakeCompanyMangerSites?: number[]
        requestedSites?: number[]

        // その他
        otherCompanySites?: number[]
    }
>

export const toCompanySiteListCLType = (data?: CompanySiteListType): CompanySiteListCLType => {
    return {
        ...data,
        totalSites: data?.totalSites ? toSiteListCLType(data.totalSites) : undefined,
    }
}
