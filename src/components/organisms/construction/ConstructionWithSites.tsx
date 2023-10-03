import React, { useMemo } from 'react'
import { Text, View, ViewStyle, FlatList } from 'react-native'

import { GlobalStyles } from '../../../utils/Styles'
import { ConstructionMeter } from './ConstructionMeter'
import { IconParam } from '../IconParam'
import { ConstructionSite } from './ConstructionSite'
import { ConstructionHeader } from './ConstructionHeader'
import { ShadowBoxWithToggle } from '../shadowBox/ShadowBoxWithToggle'
import { useNavigation } from '@react-navigation/native'
import { ConstructionType } from '../../../models/construction/Construction'
import { CompanyType } from '../../../models/company/Company'
import { RequestDisplayType } from '../../../screens/adminSide/transaction/RequestList'
import { getUuidv4 } from '../../../utils/Utils'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

export type ConstructionWithSitesProps = {
    construction?: ConstructionType
    displayType?: RequestDisplayType
    targetCompany?: CompanyType
    supportType?: 'support-receive' | 'support-order'
    routeNameFrom?: string
    onPress?: () => void
    isDisplaySiteWorker?: boolean
    style?: ViewStyle
}

export const ConstructionWithSites = React.memo((props: Partial<ConstructionWithSitesProps>) => {
    const { construction, onPress, displayType, targetCompany, supportType, routeNameFrom, isDisplaySiteWorker, style } = props
    const navigation = useNavigation<any>()
    const siteIds: string[] = []
    const { t } = useTextTranslation()

    const sites = useMemo(() => construction?.sites?.items?.sort((a, b) => (a.meetingDate ?? a.siteDate ?? 0) - (b.meetingDate ?? b.siteDate ?? 0)), [construction])
    const listKey = useMemo(() => getUuidv4(), [])

    /**
     * 工事のリストでのみ案件名は省略する。初期工事など案件名しかない場合は、案件名を表示する。
     */
    const displaySplit = useMemo(() => (construction?.displayName as string).split('/'), [construction?.displayName])
    const displayName = useMemo(() => (displaySplit.length >= 2 ? displaySplit[1] : displaySplit[0]), [displaySplit])

    return (
        <ShadowBoxWithToggle
            style={{
                padding: 10,
                paddingTop: 5,
                ...style,
            }}
            onPress={onPress}
            bottomChildren={
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                    <IconParam iconName={'site'} paramName={t('common:ManagementSite')} count={construction?.sites?.items?.length} />
                </View>
            }
            hideChildren={
                <FlatList
                    data={sites}
                    listKey={listKey}
                    keyExtractor={(item, index) => index.toString()}
                    ListEmptyComponent={() => {
                        return (
                            <View
                                style={{
                                    marginTop: 5,
                                }}>
                                <Text style={GlobalStyles.smallText}>{t('common:ThereIsNoSite')}</Text>
                            </View>
                        )
                    }}
                    renderItem={({ item, index }) => {
                        siteIds.push(item.siteId ?? 'no-id')
                        return (
                            <ConstructionSite
                                onPress={
                                    displayType
                                        ? undefined
                                        : () => {
                                              navigation.push('SiteDetail', {
                                                  siteId: item.siteId,
                                                  title: item.siteNameData?.name,
                                                  siteNumber: item.siteNameData?.siteNumber,
                                                  relatedCompanyId: targetCompany?.companyId,
                                                  supportType,
                                              })
                                          }
                                }
                                site={item}
                                key={item.siteId}
                                style={{
                                    marginTop: 10,
                                }}
                                displayType={displayType ? displayType : undefined}
                                targetCompany={targetCompany}
                                isDisplaySiteWorker={isDisplaySiteWorker}
                            />
                        )
                    }}
                />
            }>
            <View>
                <ConstructionHeader
                    style={{
                        marginTop: 5,
                    }}
                    project={construction?.project}
                    displayName={routeNameFrom === 'CompanyInvoice' ? construction?.displayName : displayName}
                    constructionRelation={construction?.constructionRelation}
                />
                {construction?.constructionRelation != undefined && construction?.constructionRelation != 'other-company' && (construction?.constructionMeter?.requiredNum ?? 0) > 0 && (
                    <ConstructionMeter
                        style={{
                            marginTop: 5,
                        }}
                        requiredCount={construction?.constructionMeter?.requiredNum}
                        presentCount={construction?.constructionMeter?.presentNum}
                    />
                )}
            </View>
        </ShadowBoxWithToggle>
    )
})
