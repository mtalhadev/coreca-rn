import React, { useState, useEffect, useMemo } from 'react'
import { View, ViewStyle, FlatList, ListRenderItem, ListRenderItemInfo, RefreshControl } from 'react-native'

import { THEME_COLORS } from '../../utils/Constants'
import { AppButton } from '../atoms/AppButton'
import { CompanyCL, DisplayLastDealType } from '../organisms/company/CompanyCL'
import { ShadowBox } from '../organisms/shadowBox/ShadowBox'
import { Filter } from '../organisms/Filter'
import { IconParam } from '../organisms/IconParam'
import { EmptyScreen } from './EmptyScreen'
import { useNavigation, useRoute } from '@react-navigation/native'
import { CompanyCLType } from '../../models/company/Company'
import { CustomDate, newCustomDate, nextDay } from '../../models/_others/CustomDate'
import { Search } from '../organisms/Search'
import { InvoiceDownloadButton } from '../organisms/invoice/InvoiceDownloadButton'
import { useDispatch, useSelector } from 'react-redux'
import { StoreType } from '../../stores/Store'
import { getUuidv4 } from '../../utils/Utils'
import { useTextTranslation } from '../../fooks/useTextTranslation'

export type CompanyListScreenProps = {
    companies: CompanyCLType[]
    routeNameFrom?: string
    targetDate?: CustomDate
    onPressCompany?: (company: CompanyCLType) => void
    selectedButton?: (companies: CompanyCLType[]) => void
    onRefresh?: () => void
    style?: ViewStyle
}

/**
 *
 * @param props
 * @returns
 */
export const CompanyListScreen = React.memo((props: CompanyListScreenProps) => {
    const { style, onPressCompany, companies, routeNameFrom, targetDate, selectedButton, onRefresh } = props
    const [filter, setFilter] = useState<string[]>([])
    const loading = useSelector((state: StoreType) => state.util.loading)
    const [textFilter, setTextFilter] = useState<string | undefined>(undefined)
    const [displayCompanies, setDisplayCompanies] = useState<CompanyCLType[]>([])
    const [selectedCompanies, setSelectedCompanies] = useState<CompanyCLType[]>([])
    const [hasLastDeal, setHasLastDeal] = useState<DisplayLastDealType>('latestLastDealDate')
    const navigation = useNavigation<any>()
    const { t } = useTextTranslation()
    const dispatch = useDispatch()
    const companyIdsSet = useMemo(() => new Set(selectedCompanies?.map((comp) => comp.companyId)), [selectedCompanies])

    const [refreshing, setRefreshing] = useState<boolean>(false)
    const route = useRoute<any>()

    useEffect(() => {
        return () => {
            setDisplayCompanies([])
        }
    }, [])

    const _onRefresh = async () => {
        setRefreshing(true)
        if (onRefresh) {
            await onRefresh()
        }
        setRefreshing(false)
    }

    const __filterByCompanyName = (text: string | undefined, _companies: CompanyCLType[]): CompanyCLType[] => {
        return text ? _companies.filter((company) => company.name && company.name?.toLowerCase()?.indexOf(text.toLowerCase()) > -1) : _companies
    }

    const _header = () => {
        return (
            <View
                style={{
                    backgroundColor: '#fff',
                    borderBottomWidth: 1,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                    padding: 10,
                }}>
                <Search style={{}} text={textFilter} title={t('common:SearchByCompanyName')} onChange={setTextFilter} clearText={() => setTextFilter(undefined)} />
                <View
                    style={{
                        marginTop: 5,
                        flexDirection: 'row',
                    }}>
                    <IconParam
                        style={{
                            marginTop: 5,
                        }}
                        iconName={'company'}
                        paramName={t('common:ClientsCustomers')}
                        // eslint-disable-next-line react/prop-types
                        count={displayCompanies.length}
                        suffix={t('common:Company')}
                        onPress={() => {
                            if (routeNameFrom === 'AdminHome' || routeNameFrom === 'ContractingProjectList') {
                                // route stackを調整し、現場作成後に戻るボタンで入った所に戻るようにするため
                                //（pushだと案件作成フローのままで会社選択画面に戻ってしまう）
                                navigation.replace('SelectCompanyCreateWay', { routeNameFrom, targetDate })
                            } else {
                                navigation.push('SelectCompanyCreateWay', {})
                            }
                        }}
                    />
                    <Filter
                        items={[t('common:All'), t('common:NoTransactions'), t('common:RequestOrdering'), t('common:RequestReceiving'), t('common:ContractOrder'), t('common:PleaseNote')]}
                        selectedItems={filter}
                        onChange={(filter) => {
                            setFilter(filter)
                        }}
                        title={t('common:SelectACompanyToFilter')}
                        style={{
                            paddingVertical: 5,
                        }}
                        selectNum={1}
                    />
                </View>
                {route.name == 'PartnerCompanyList' && <InvoiceDownloadButton title={t('common:DownloadMonthlyCaseStatementsForAllCompanies')} invoiceType={'projects'} />}
            </View>
        )
    }

    const _footer = () => {
        return (
            <View
                style={{
                    marginBottom: 100,
                    marginHorizontal: 10,
                }}>
                <AppButton
                    style={{
                        marginTop: 20,
                    }}
                    title={t('common:CreateANewCustomerClient')}
                    onPress={() => {
                        if (routeNameFrom === 'AdminHome' || routeNameFrom === 'ContractingProjectList') {
                            // route stackを調整し、現場作成後に戻るボタンで入った所に戻るようにするため
                            //（pushだと案件作成フローのままで会社選択画面に戻ってしまう）
                            navigation.replace('SelectCompanyCreateWay', { routeNameFrom, targetDate })
                        } else {
                            navigation.push('SelectCompanyCreateWay', {})
                        }
                    }}
                />
            </View>
        )
    }

    const _content: ListRenderItem<CompanyCLType> = (info: ListRenderItemInfo<CompanyCLType>) => {
        const { item, index } = info
        const isSelected = companyIdsSet.has(item.companyId)
        return (
            <ShadowBox
                onPress={() => {
                    if (onPressCompany) {
                        onPressCompany(item)
                    }
                    if (selectedButton) {
                        if (isSelected) {
                            setSelectedCompanies(selectedCompanies?.filter((comp) => comp.companyId != item?.companyId))
                        } else {
                            setSelectedCompanies([...(selectedCompanies ?? []), item])
                        }
                    }
                }}
                style={{
                    padding: 8,
                    marginHorizontal: 8,
                    marginTop: 7,
                    borderColor: isSelected ? THEME_COLORS.BLUE.MIDDLE_DEEP : THEME_COLORS.OTHERS.BORDER_COLOR,
                    backgroundColor: isSelected ? 'lightblue' : '#fff',
                }}
                key={item.companyId}>
                <CompanyCL
                    style={
                        {
                            // marginTop: 5,
                        }
                    }
                    company={item}
                    hasLastDeal={hasLastDeal}
                />
                {item?.connectedCompany != undefined && !item.isFake && (
                    <CompanyCL
                        style={{
                            marginTop: 8,
                            padding: 8,
                            borderWidth: 1,
                            borderColor: THEME_COLORS.OTHERS.LIGHT_GRAY,
                            borderRadius: 10,
                        }}
                        company={item.connectedCompany}
                        hasLastDeal={false}
                    />
                )}
            </ShadowBox>
        )
    }

    const __filterByDeal = (_filter: string[], _inputCompanies: CompanyCLType[]): CompanyCLType[] => {
        let _companies: CompanyCLType[] = []
        _inputCompanies = _inputCompanies.filter((company) => !(company?.connectedCompany != undefined && company.isFake))
        if (filter.includes(t('common:NoTransactions'))) {
            _companies = _inputCompanies.filter((company) => company.lastDeal?.latestLastDealDate == undefined).sort((a, b) => -(a.createdAt?.totalSeconds ?? 0) + (b.createdAt?.totalSeconds ?? 0))
            setHasLastDeal('latestLastDealDate')
        } else if (filter.includes(t('common:RequestOrdering'))) {
            _companies = _inputCompanies
                .filter((company) => company.lastDeal?.requestOrderDate != undefined)
                .sort((a, b) => -(a.lastDeal?.requestOrderDate?.totalSeconds ?? 0) + (b.lastDeal?.requestOrderDate?.totalSeconds ?? 0))
            setHasLastDeal('requestOrderDate')
        } else if (filter.includes(t('common:RequestReceiving'))) {
            _companies = _inputCompanies
                .filter((company) => company.lastDeal?.requestReceiveDate != undefined)
                .sort((a, b) => -(a.lastDeal?.requestReceiveDate?.totalSeconds ?? 0) + (b.lastDeal?.requestReceiveDate?.totalSeconds ?? 0))
            setHasLastDeal('requestReceiveDate')
        } else if (filter.includes(t('common:ContractOrder'))) {
            _companies = _inputCompanies
                .filter((company) => company.lastDeal?.contractOrderDate != undefined)
                .sort((a, b) => -(a.lastDeal?.contractOrderDate?.totalSeconds ?? 0) + (b.lastDeal?.contractOrderDate?.totalSeconds ?? 0))
            setHasLastDeal('contractOrderDate')
        } else if (filter.includes(t('common:PleaseNote'))) {
            _companies = _inputCompanies
                .filter((company) => company.lastDeal?.contractReceiveDate != undefined)
                .sort((a, b) => -(a.lastDeal?.contractReceiveDate?.totalSeconds ?? 0) + (b.lastDeal?.contractReceiveDate?.totalSeconds ?? 0))
            setHasLastDeal('contractReceiveDate')
        } else {
            _companies = _inputCompanies.sort(
                (a, b) =>
                    -(a.lastDeal?.latestLastDealDate?.totalSeconds ?? (a.createdAt && nextDay(a.createdAt).totalSeconds > newCustomDate().totalSeconds ? 9999999999999 : 0)) +
                    (b.lastDeal?.latestLastDealDate?.totalSeconds ?? (b.createdAt && nextDay(b.createdAt).totalSeconds > newCustomDate().totalSeconds ? 9999999999999 : 0)),
            )
            setHasLastDeal('latestLastDealDate')
        }
        return _companies
    }

    useEffect(() => {
        setDisplayCompanies(__filterByDeal(filter, __filterByCompanyName(textFilter, companies)))
    }, [filter, textFilter, companies])
    const listKey = useMemo(() => getUuidv4(), [])

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#fff',
                ...style,
            }}>
            {/* FlatListの性質上、TextInputの文字が変更されるたびにリレンダリングが入り、フォーカスが外れて非常に入力しにくいため、ListHeaderComponentからは外して表示。 */}
            {_header()}
            <FlatList
                listKey={listKey}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={_onRefresh} />}
                data={displayCompanies}
                ListEmptyComponent={loading ? <></> : <EmptyScreen text={t('common:NoCustomersClients')} />}
                renderItem={_content}
                ListFooterComponent={_footer}
            />
            {selectedButton && (
                <View
                    style={{
                        paddingVertical: 10,
                        backgroundColor: '#fff',
                        borderTopWidth: 1,
                        borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                    }}>
                    <AppButton
                        style={{ marginHorizontal: 15 }}
                        title={t('admin:AddReservations')}
                        disabled={selectedCompanies?.length === 0 && selectedCompanies.length === 0 ? true : false}
                        onPress={() => {
                            if (selectedButton) {
                                selectedButton(selectedCompanies)
                            }
                        }}
                    />
                </View>
            )}
        </View>
    )
})
