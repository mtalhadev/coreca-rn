/* eslint-disable prefer-const */
import React, { useMemo } from 'react'
import { View, ViewStyle, StyleSheet, Text } from 'react-native'

import { FontStyle, GlobalStyles } from '../../../utils/Styles'
import { THEME_COLORS, WINDOW_WIDTH } from '../../../utils/Constants'
import { getUuidv4 } from '../../../utils/Utils'
import { InvRequestHeaderCL } from '../invRequest/InvRequestHeaderCL'
import { WorkerListCL } from '../worker/WorkerListCL'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { useNavigation } from '@react-navigation/native'
import { WorkerCLType } from '../../../models/worker/Worker'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { InvRequestCLType } from '../../../models/invRequest/InvRequestType'
import { CompanyCL } from '../company/CompanyCL'
import { RequestCLType } from '../../../models/request/Request'
import sum from 'lodash/sum'
// import DatePicker from 'react-native-date-picker'
export type DateInvRequestArrangementProps = {
    data: InvRequestCLType
    isReceive?: boolean
    hasShadow?: boolean
    isShowCompanyIcon?: boolean
    style?: ViewStyle
}

export const DateInvRequestArrangementCL = React.memo((props: Partial<DateInvRequestArrangementProps>) => {
    const { t } = useTextTranslation()
    let { data, isReceive, hasShadow, isShowCompanyIcon, style } = props
    hasShadow = hasShadow ?? true
    const navigation = useNavigation<any>()
    const workers = useMemo(() => data?.workers?.items?.filter((data) => data != undefined) as WorkerCLType[], [data])
    const requests = useMemo(() => data?.site?.companyRequests?.orderRequests?.items?.filter(data => data != undefined) as RequestCLType[], [data])
    const presentCount = useMemo(() => (data?.workerIds?.length ?? 0) + sum(data?.site?.companyRequests?.orderRequests?.items?.map(req => req?.requestCount).filter(data => data != undefined)), [data])
    return (
        <ShadowBox
            onPress={() => {
                navigation.push('InvRequestDetail', {
                    invRequestId: data?.invRequestId,
                    type: isReceive ? 'receive' : 'order'
                })
            }}
            key={getUuidv4()}
            hasShadow={hasShadow}
            style={{
                paddingBottom: 5,
                ...style,
            }}>
            {
                isReceive && 
                <View
                    style={{
                        backgroundColor: THEME_COLORS.OTHERS.LIGHT_ORANGE,
                        padding: 5,
                        paddingLeft: 10,
                        paddingTop: 7,
                        alignItems: 'center',
                    }}>
                    <Text
                        style={{
                            ...GlobalStyles.mediumText,
                        }}>
                        {t('admin:SupportSentToOurCompany')}
                    </Text>
                </View>
            }
            <InvRequestHeaderCL
                invRequest={data}
                presentCount={presentCount}
                style={{
                    backgroundColor: THEME_COLORS.OTHERS.PURPLE_GRAY,
                    paddingTop: 10,
                    paddingHorizontal: 10,
                    borderTopEndRadius: 10,
                    borderTopStartRadius: 10,
                }}
                invRequestNameWidth={WINDOW_WIDTH - 40}
            />
            {
                isShowCompanyIcon != false &&
                <CompanyCL
                    company={isReceive ? data?.myCompany : data?.targetCompany}
                    hasLastDeal={false}
                    style={{
                        paddingTop: 5,
                        paddingHorizontal: 10,
                        paddingBottom:5,
                        backgroundColor: THEME_COLORS.OTHERS.PURPLE_GRAY,
                    }}
                />
            }
                <View
                    style={{
                        flexDirection: 'row',
                        paddingHorizontal: 10,
                        marginTop: 3,
                    }}>
                    <WorkerListCL workers={workers} requests={requests}/>
                </View>
        </ShadowBox>
    )
})

const styles = StyleSheet.create({})
