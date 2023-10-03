import React, { useMemo } from 'react'
import { View, Text, ViewStyle, Pressable } from 'react-native'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { InvRequestType, toInvRequestStatusType } from '../../../models/invRequest/InvRequestType'
import { dayBaseText, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { ID } from '../../../models/_others/ID'
import { WINDOW_WIDTH } from '../../../utils/Constants'
import { GlobalStyles } from '../../../utils/Styles'
import { useComponentSize, isNoValueObject } from '../../../utils/Utils'
import { Company } from '../company/Company'
import { SiteMeter } from '../site/SiteMeter'
import { InvRequestPrefix } from './InvRequestPrefix'
import ThreeDotsSvg from '../../../../assets/images/threeDots.svg'

export type InvRequestHeaderProps = {
    batchSize?: number
    style?: ViewStyle
    invRequestNameWidth?: number
    invRequest?: InvRequestType
    presentCount?: number
    hideDisplayDate?: boolean
    isDisplayClient?: boolean
    myCompanyId?: ID
    displayMeter?: boolean
    displayAlert?: () => void
}

export const InvRequestHeader = React.memo((props: Partial<InvRequestHeaderProps>) => {
    let { invRequest, style, batchSize, invRequestNameWidth, presentCount, hideDisplayDate, isDisplayClient, myCompanyId, displayMeter, displayAlert } = props
    const [size, onLayout] = useComponentSize()
    batchSize = batchSize ?? 18
    const { t } = useTextTranslation()

    const status = useMemo(() => (invRequest ? toInvRequestStatusType(invRequest) : undefined), [invRequest])
    const invRequestDate = useMemo(() => (invRequest?.date ? toCustomDateFromTotalSeconds(invRequest.date) : undefined), [invRequest?.date])
    return (
        <>
            {!isNoValueObject(invRequest) && invRequest != undefined && (
                <View onLayout={onLayout} style={[{}, style]}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                        {invRequestDate != undefined && hideDisplayDate != true && (
                            <Text style={GlobalStyles.smallGrayText}>{`${invRequestDate ? dayBaseText(invRequestDate) : t('common:None')}`}</Text>
                        )}
                        <View
                            style={{
                                flexDirection: 'row',
                                flexWrap: 'nowrap',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                width: invRequestNameWidth ?? size?.width ?? WINDOW_WIDTH,
                            }}>
                            <View
                                style={{
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    marginLeft: hideDisplayDate != true ? 5 : 0,
                                    width: (invRequestNameWidth ?? size?.width ?? WINDOW_WIDTH) - (displayAlert ? 40 : 0),
                                }}>
                                <InvRequestPrefix type={status} fontSize={9} />
                                {isDisplayClient == true && (
                                    <Company
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
                            </View>
                            {displayAlert && (
                                <Pressable
                                    style={{}}
                                    onPress={() => {
                                        if (
                                            // !isDeleting &&
                                            displayAlert
                                        ) {
                                            displayAlert()
                                        }
                                    }}>
                                    <ThreeDotsSvg fill={'#000'} />
                                </Pressable>
                            )}
                        </View>
                    </View>
                    {displayMeter != false && <SiteMeter presentCount={presentCount ?? invRequest?.workerIds?.length ?? 0} requiredCount={invRequest?.workerCount} style={{ marginTop: 5 }} />}
                </View>
            )}
        </>
    )
})
