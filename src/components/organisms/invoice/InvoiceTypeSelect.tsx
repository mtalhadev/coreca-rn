import React from 'react'
import { View, ViewStyle } from 'react-native'
import { SelectButton } from '../SelectButton'
import { IconParam } from '../IconParam'
import { InvoiceDownloadButton } from './InvoiceDownloadButton'
import { InvoiceContentsType, InvoiceDisplayType } from '../../../screens/adminSide/company/companyDetail/CompanyInvoice'
import { CustomDate } from '../../../models/_others/CustomDate'
import { CompanyType } from '../../../models/company/Company'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { match } from 'ts-pattern'
// const { t } = useTextTranslation()
export type InvoiceTypeSelectUIType = {
    onChangeType?: (item: InvoiceDisplayType) => void
    onContentsTypeChange?: (item: InvoiceContentsType) => void
    headerDisplayInfo?: {
        projectCount: number
        supportCount: number
        supportedCount: number
    }
    displayType?: InvoiceDisplayType
    contentsType?: InvoiceContentsType
    targetCompany?: CompanyType
    month?: CustomDate
}

export type InvoiceTypeSelectProps = {
    invoice: InvoiceTypeSelectUIType
    style: ViewStyle
}

export const InvoiceTypeSelect = (props: Partial<InvoiceTypeSelectProps>) => {
    // import { useTextTranslation } from '../../../fooks/useTextTranslation'
    const { t } = useTextTranslation()
    const { invoice, style } = props
    return (
        <View style={style}>
            <SelectButton
                items={[t('admin:AcceptingAnOrder'), t('admin:Order')]}
                onChangeItem={(value) => {
                    if (invoice?.onChangeType) {
                        if (value == t('admin:AcceptingAnOrder')) {
                            invoice?.onChangeType('receive')
                        }
                        if (value == t('admin:Order')) {
                            invoice?.onChangeType('order')
                        }
                    }
                }}
                selected={match(invoice?.displayType)
                    .with('order', () => t('admin:Order'))
                    .otherwise(() => t('admin:AcceptingAnOrder'))}
                style={{ marginTop: 10 }}
            />
            <SelectButton
                items={[t('admin:Contract'), t('admin:Support')]}
                onChangeItem={(value) => {
                    if (invoice?.onContentsTypeChange) {
                        if (value == t('admin:Contract')) {
                            invoice.onContentsTypeChange('contract')
                        }
                        if (value == t('admin:Support')) {
                            invoice.onContentsTypeChange('support')
                        }
                    }
                }}
                selected={match(invoice?.contentsType)
                    .with('contract', () => t('admin:Contract'))
                    .with('support', () => t('admin:Support'))
                    .otherwise(() => t('admin:SentSupport'))}
                style={{ marginTop: 10 }}
            />
            {invoice?.contentsType == 'contract' && invoice?.displayType == 'receive' && (
                <View
                    style={{
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}>
                    <IconParam iconName="project" paramName={t('admin:NumberOfNotedCases')} count={invoice?.headerDisplayInfo?.projectCount} style={{ marginTop: 15, minHeight: 20 }} />
                </View>
            )}
            {invoice?.contentsType == 'contract' && invoice?.displayType == 'order' && (
                <View
                    style={{
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}>
                    <IconParam iconName="project" paramName={t('admin:NumberOfCasesIssued')} count={invoice?.headerDisplayInfo?.projectCount} style={{ marginTop: 15, minHeight: 20 }} />
                </View>
            )}
            {invoice?.contentsType == 'support' && invoice?.displayType == 'order' && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 15,
                    }}>
                    <IconParam flex={1.1} iconName={'transferReceive'} paramName={t('admin:NumberOfPeopleExpectedToCome')} iconSize={20} count={invoice.headerDisplayInfo?.supportCount ?? 0} />
                    <IconParam flex={1} iconName={'transferReceive'} paramName={t('admin:NumberOfPeopleWhoCame')} hasBorder count={invoice.headerDisplayInfo?.supportedCount ?? 0} />
                </View>
            )}
            {invoice?.contentsType == 'support' && invoice?.displayType == 'receive' && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 15,
                    }}>
                    <IconParam flex={1.1} iconName={'transfer'} paramName={t('admin:NumberOfPeopleToBeSent')} iconSize={20} count={invoice.headerDisplayInfo?.supportCount ?? 0} />
                    <IconParam flex={1} iconName={'transfer'} paramName={t('admin:NumberOfPeopleSent')} hasBorder count={invoice.headerDisplayInfo?.supportedCount ?? 0} />
                </View>
            )}

            <InvoiceDownloadButton
                title={`${t('common:ThisCompanys')}${invoice?.month?.month}${t('common:DownloadMonthlyStatement')}`}
                targetCompany={invoice?.targetCompany}
                month={invoice?.month}
                invoiceType={'targetCompany'}
            />
        </View>
    )
}
