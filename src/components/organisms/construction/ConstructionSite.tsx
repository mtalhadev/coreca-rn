import React, { useCallback, useMemo } from 'react'
import { FlatList, Pressable, ViewStyle } from 'react-native'

import { GlobalStyles } from '../../../utils/Styles'
import { THEME_COLORS } from '../../../utils/Constants'
import { Line } from '../../atoms/Line'
import { SiteHeader } from '../site/SiteHeader'
import { Request } from '../request/Request'
import { SiteType } from '../../../models/site/Site'
import { useSelector } from 'react-redux'
import { StoreType } from '../../../stores/Store'
import { CompanyType } from '../../../models/company/Company'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { useNavigation } from '@react-navigation/core'
import { BothRequestsType, BothRequestType, GetSiteRequests, GetSiteRequestsOfTargetCompany } from '../../../usecases/request/CommonRequestCase'
import { RequestDisplayType } from '../../../screens/adminSide/transaction/RequestList'
import { getUuidv4 } from '../../../utils/Utils'
import { WorkerList } from '../worker/WorkerList'
import { WorkerType } from '../../../models/worker/Worker'

export type ConstructionSiteProps = {
    site: ConstructionSiteUIType
    displayType?: RequestDisplayType
    targetCompany?: CompanyType
    onPress?: (id: string) => void
    isDisplaySiteWorker?: boolean
    style?: ViewStyle
}

export type ConstructionSiteUIType = {
    attendCount?: number
} & SiteType

export const ConstructionSite = React.memo((props: Partial<ConstructionSiteProps>) => {
    const { site, style, onPress, displayType, targetCompany, isDisplaySiteWorker } = props
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)

    const siteRequests = useMemo(
        () => (targetCompany && displayType != 'both' ? GetSiteRequestsOfTargetCompany({ site, displayType, targetCompany, myCompanyId }) : GetSiteRequests({ site, displayType, myCompanyId })),
        [site, myCompanyId, displayType, targetCompany],
    )
    const listKey = useMemo(() => getUuidv4(), [])
    const isManagerSite = useMemo(() => (site?.construction?.contract?.receiveCompanyId == myCompanyId ? true : false), [site])
    const filteredSiteRequests = useMemo(() => siteRequests.filter((item) => item.direction == displayType || displayType == 'both') as BothRequestsType, [siteRequests])
    return (
        <Pressable
            style={[
                {
                    padding: 8,
                    borderWidth: 1,
                    borderColor: THEME_COLORS.OTHERS.LIGHT_GRAY,
                    borderRadius: 10,
                },
                style,
            ]}
            onPress={() => {
                if (onPress && site?.siteId) {
                    onPress(site?.siteId)
                }
            }}>
            <SiteHeader site={site} titleStyle={GlobalStyles.smallGrayText as ViewStyle} isOnlyDateName={true} displayDay={true} />
            {isDisplaySiteWorker && (
                <WorkerList workers={site?.siteMeter?.presentArrangements?.items?.map((arr) => arr.worker).filter((data) => data != undefined) as WorkerType[]} requests={site?.siteMeter?.presentRequests?.items} />
            )}
            {displayType != undefined && (
                <>
                    <Line
                        style={{
                            marginTop: 8,
                        }}
                    />
                    <FlatList
                        listKey={listKey}
                        data={filteredSiteRequests}
                        renderItem={({ item, index }) => {
                            return <SiteRequest isManagerSite={isManagerSite} item={item} site={site} />
                        }}
                    />
                    {filteredSiteRequests.map((item, index) => {})}
                </>
            )}
        </Pressable>
    )
})

const SiteRequest = React.memo((props: { site: ConstructionSiteUIType | undefined; item: BothRequestType; isManagerSite: boolean }) => {
    const { site, isManagerSite, item } = props
    const navigation = useNavigation<any>()
    const display = useMemo(
        () =>
            (item.direction == 'receive' && (item.baseRequest.company?.isFake || (item.baseRequest.requestCount && item.baseRequest.requestCount > 0))) ||
            (item.orderRequestCount && item.orderRequestCount > 0),
        [item],
    )
    const onPress = useCallback(() => {
        navigation.push('SiteDetail', {
            title: site?.siteNameData?.name,
            siteId: site?.siteId,
            siteNumber: site?.siteNameData?.siteNumber,
            requestId:
                // 自社施工の現場への常用依頼（本来あり得ない）
                isManagerSite || site?.siteRelation == 'fake-company-manager' ? undefined : item.baseRequest.requestId,
        })
    }, [site, item])
    if (!display) {
        return <></>
    }
    /**
     * 依頼数0の常用依頼の場合は表示しない(仮会社施工を除く)
     */
    return (
        <ShadowBox
            key={item.baseRequest.requestId}
            hasShadow={false}
            onPress={onPress}
            style={{
                marginTop: 8,
                padding: 8,
            }}>
            <Request
                request={item.baseRequest}
                displayHeader={true}
                type={isManagerSite ? 'receive' : item.requestedCompanies ? 'receive' : 'order'}
                orderPresentCount={item.orderPresentCount}
                orderRequestCount={item.orderRequestCount}
                requestedCompanies={item.requestedCompanies}
                subRequests={item.workerListRequests}
                /**
                 * 発注の場合は自社作業員は非表示で常用依頼のみを表示するため。
                 */
                subArrangedWorkers={item.direction == 'order' ? [] : undefined}
                noIcon
            />
        </ShadowBox>
    )
})
