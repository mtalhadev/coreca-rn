import React from 'react'
import { Text, View, ViewStyle } from 'react-native'
import { GlobalStyles } from '../../../utils/Styles'

import { CustomDate } from '../../../models/_others/CustomDate'
import { IconParam } from '../IconParam'
import { ConstructionLeaf } from '../construction/ConstructionLeaf'
import { CompanyDirectionType, RequestDirection, RequestDirectionType } from '../request/RequestDirection'
import { SiteInvoice } from '../site/SiteInvoice'
import { ShadowBoxWithToggle } from '../shadowBox/ShadowBoxWithToggle'
import { ConstructionCLType } from '../../../models/construction/Construction'
import { CompanyCLType } from '../../../models/company/Company'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { ProjectCLType } from '../../../models/project/Project'
// const { t } = useTextTranslation()
export type InvoiceSiteUIType = {
    startTime: CustomDate
    endTime: CustomDate
    constructionName: string
    siteNumber: number
    fromMyCompanyNum: number
}
/**
 * project - 工期表示のため
 */
export type InvoiceConstructionUIType = {
    construction: ConstructionCLType
    project?: ProjectCLType
    siteNum: number
    fromMyCompanyNum: number
    sites: InvoiceSiteUIType[]
}

export type InvoiceUIType = {
    type: RequestDirectionType
    direction: CompanyDirectionType
    company: CompanyCLType
    constructions: InvoiceConstructionUIType[]
}

export type InvoiceDetailProps = {
    invoice: InvoiceUIType
    style: ViewStyle
}

export const InvoiceDetail = (props: Partial<InvoiceDetailProps>) => {
    // import { useTextTranslation } from '../../../fooks/useTextTranslation'
    const { t } = useTextTranslation()
    const { invoice, style } = props
    return (
        <View style={style}>
            <RequestDirection type={invoice?.type} direction={invoice?.direction} company={invoice?.company} />
            {invoice?.constructions.map((construction, index) => {
                return (
                    <ShadowBoxWithToggle
                        style={{ paddingHorizontal: 10, paddingVertical: 10, marginTop: 10 }}
                        key={index}
                        bottomChildren={
                            <View style={{ flexDirection: 'row', marginTop: 5 }}>
                                <IconParam iconName="site" paramName={t('common:NumberOfSites')} count={construction.siteNum} suffix="" flex={1} />
                                <IconParam iconName="attend-worker" paramName={t('common:FromOurCompany')} count={construction.fromMyCompanyNum} suffix={t('common:Name')} flex={1} />
                            </View>
                        }
                        hideChildren={
                            <View>
                                {construction.sites.length != 0 &&
                                    construction.sites.map((site, siteIndex) => {
                                        return (
                                            <View key={`${siteIndex}-site`}>
                                                <SiteInvoice key={index} site={site} style={{ marginVertical: 5 }} />
                                            </View>
                                        )
                                    })}
                                {construction.sites.length == 0 && <Text style={GlobalStyles.smallText}>{t('common:ThereIsNoSite')}</Text>}
                            </View>
                        }>
                        <ConstructionLeaf construction={construction.construction} project={construction?.project} style={{ marginVertical: 0 }} />
                    </ShadowBoxWithToggle>
                )
            })}
        </View>
    )
}
