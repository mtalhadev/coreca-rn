import React from 'react'
import { View, ViewStyle, Text } from 'react-native'

import { GlobalStyles } from '../../../utils/Styles'
import { THEME_COLORS } from '../../../utils/Constants'
import { SiteType } from '../../../models/site/Site'
import { SiteHeader } from '../site/SiteHeader'
import { WorkerList } from '../worker/WorkerList'
import { InvRequestType } from '../../../models/invRequest/InvRequestType'
import { RequestType } from '../../../models/request/Request'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { ID } from '../../../models/_others/ID'

export type InvRequestSiteProps = {
    site: SiteType
    invRequest?: InvRequestType
    onPress?: (id: string) => void
    hasShadow?: boolean
    myCompanyId?: ID
    displayAlert?: () => void
    style?: ViewStyle
}
/**
 * 仮会社へ常用で送る場合、または常用で送った先の確定した現場UI
 */
export const InvRequestSite = React.memo((props: Partial<InvRequestSiteProps>) => {
    let { site, invRequest, style, onPress, hasShadow, myCompanyId, displayAlert } = props
    hasShadow = hasShadow ?? false
    const arrangementWorkerIds = invRequest?.attendances?.filter((att) => att.arrangement?.siteId == site?.siteId).map((att) => att.workerId)
    const arrangementWorkerIdsSet = new Set(arrangementWorkerIds)
    const arrangementWorkers = invRequest?.site?.fakeCompanyInvRequestId
        ? invRequest?.workers?.items?.filter((worker) => worker.workerId)
        : invRequest?.workers?.items?.filter((worker) => worker.workerId && arrangementWorkerIdsSet.has(worker.workerId))
    const { t } = useTextTranslation()
    return (
        <ShadowBox
            style={{
                ...style,
            }}
            hasShadow={hasShadow}
            onPress={() => {
                if (onPress && site?.siteId) {
                    onPress(site?.siteId)
                }
            }}
            onLongPress={displayAlert}>
            {site?.fakeCompanyInvRequestId && (
                <View
                    style={{
                        backgroundColor: THEME_COLORS.OTHERS.GRAY,
                        paddingVertical: 5,
                        paddingLeft: 10,
                        borderTopEndRadius: 10,
                        borderTopStartRadius: 10,
                        borderBottomRightRadius: 0,
                        borderBottomLeftRadius: 0,
                    }}>
                    <Text
                        style={{
                            ...GlobalStyles.smallText,
                            color: '#fff',
                        }}>
                        {invRequest?.myCompanyId == myCompanyId ? t('admin:SendYourSupport') : t('admin:BackupIsComing')}
                    </Text>
                </View>
            )}
            <SiteHeader
                style={{
                    padding: 8,
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    backgroundColor: THEME_COLORS.OTHERS.PURPLE_GRAY,
                }}
                site={site}
                titleStyle={GlobalStyles.smallGrayText as ViewStyle}
                isOnlyDateName={false}
                displayDay={false}
                displaySitePrefix
                isDateArrangement
                displayAlert={displayAlert}
            />
            <View
                style={{
                    padding: 8,
                    flexDirection: 'row',
                    marginTop: 5,
                }}>
                <WorkerList workers={arrangementWorkers} requests={site?.companyRequests?.orderRequests?.items as RequestType[]} />
            </View>
        </ShadowBox>
    )
})
