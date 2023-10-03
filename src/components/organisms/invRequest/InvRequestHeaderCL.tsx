import React from 'react'
import { View, Text, ViewStyle } from 'react-native'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { InvRequestCLType } from '../../../models/invRequest/InvRequestType'
import { dayBaseText } from '../../../models/_others/CustomDate'
import { ID } from '../../../models/_others/ID'
import { WINDOW_WIDTH } from '../../../utils/Constants'
import { GlobalStyles } from '../../../utils/Styles'
import { useComponentSize, isNoValueObject } from '../../../utils/Utils'
import { CompanyCL } from '../company/CompanyCL'
import { SiteMeter } from '../site/SiteMeter'
import { InvRequestPrefix } from './InvRequestPrefix'

export type InvRequestHeaderProps = {
    batchSize?: number
    style?: ViewStyle
    invRequestNameWidth?: number
    invRequest?: InvRequestCLType
    presentCount?: number
    hideDisplayDate?: boolean
    isDisplayClient?: boolean
    myCompanyId?: ID
    displayMeter?: boolean
}

export const InvRequestHeaderCL = React.memo((props: Partial<InvRequestHeaderProps>) => {
    let { invRequest, style, batchSize, invRequestNameWidth, presentCount, hideDisplayDate, isDisplayClient, myCompanyId, displayMeter } = props
    const [size, onLayout] = useComponentSize()
    batchSize = batchSize ?? 18
    const { t } = useTextTranslation()
    return (
        <>
            {!isNoValueObject(invRequest) && invRequest != undefined && (
                <View onLayout={onLayout} style={[{}, style]}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                        {/* <Text
                                style={[
                                    {
                                        fontFamily: FontStyle.black,
                                        fontSize: 22,
                                        lineHeight: 26,
                                        marginRight: 5,
                                    },
                                    titleStyle,
                                ]}>
                                {site?.meetingDate ? dayBaseText(site?.meetingDate) : t('common:Undecided')}
                            </Text> */}
                        {invRequest?.date != undefined && hideDisplayDate != true && (
                            <>
                                <Text style={GlobalStyles.smallGrayText}>{`${invRequest.date ? dayBaseText(invRequest.date) : t('common:None')}`}</Text>
                                {/* <TimeIcon
                                    targetDate={site?.meetingDate}
                                    endDate={site?.endDate}
                                    style={{
                                        marginLeft: 10,
                                    }}
                                /> */}
                            </>
                        )}
                        <View
                            style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                marginLeft: hideDisplayDate != true ? 5 : 0,
                                width: invRequestNameWidth ?? size?.width ?? WINDOW_WIDTH,
                            }}>
                            <InvRequestPrefix type={invRequest.invRequestStatus} fontSize={9} />
                            {isDisplayClient == true && (
                                <CompanyCL
                                    company={invRequest.myCompanyId == myCompanyId ? invRequest?.targetCompany : invRequest?.myCompany}
                                    hasLastDeal={false}
                                    style={{
                                        paddingTop: 5,
                                        paddingBottom: 5,
                                        flex: 0,
                                        marginLeft: 5,
                                    }}
                                    displayCompanyPrefix
                                />
                            )}
                            {/* {site?.siteNameData?.siteNumber == 1 && (site.siteRelation == 'manager' || site.siteRelation == 'fake-company-manager') && <NewBadge size={batchSize} style={{}} />} */}
                        </View>
                    </View>
                    {displayMeter != false && <SiteMeter presentCount={presentCount ?? invRequest?.workerIds?.length ?? 0} requiredCount={invRequest?.workerCount} style={{ marginTop: 5 }} />}
                </View>
            )}
        </>
    )
})
