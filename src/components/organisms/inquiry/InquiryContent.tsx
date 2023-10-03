import React, { useCallback } from 'react'
import { Text, View } from 'react-native'
import { AppButton } from '../../atoms/AppButton'
import { GlobalStyles } from '../../../utils/Styles'
import { WorkerCLType } from '../../../models/worker/Worker'
import { CompanyCLType } from '../../../models/company/Company'
import { MyCompanyDetailNavProps } from '../../../screens/adminSide/mypage/MyCompanyDetail'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
// const { t } = useTextTranslation()
export type InquiryContentType = {
    worker?: WorkerCLType
    company?: CompanyCLType
    navigation?: MyCompanyDetailNavProps
}
type toNavigationType = 'BillingInquiry' | 'ProblemsInquiry'
export const InquiryContent = (props: InquiryContentType) => {
    const { worker, company, navigation } = props

    const { t } = useTextTranslation()
    const _navigation = useCallback(
        (toNavigation: toNavigationType) => {
            if (navigation) {
                navigation.push(toNavigation, { worker: worker, company: company })
            }
        },
        [navigation],
    )
    return (
        <View>
            <Text style={GlobalStyles.normalText}>{t('common:ContactUs')}</Text>
            <View
                style={{
                    flex: 1,
                }}>
                {/* <AppButton
                    onPress={() => {
                        _navigation('BillingInquiry')
                    }}
                    style={{
                        marginTop: 10,
                        flex: 1,
                    }}
                    title={t('common:AboutPaidPlans')}
                    height={40}
                    isGray
                /> */}
                <AppButton
                    onPress={() => {
                        _navigation('ProblemsInquiry')
                    }}
                    style={{
                        flex: 1,
                        marginTop: 10,
                    }}
                    title={t('common:DefectsOperationEtc')}
                    height={40}
                    isGray
                />
            </View>
        </View>
    )
}
