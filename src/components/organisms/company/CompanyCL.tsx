import React, { useMemo } from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { GlobalStyles, FontStyle } from '../../../utils/Styles'

import { WINDOW_WIDTH } from '../../../utils/Constants'
import { ImageIcon } from '../ImageIcon'

import { CompanyPrefix } from './CompanyPrefix'
import { NewBadge } from '../../atoms/NewBadge'
import { CompanyCLType } from '../../../models/company/Company'
import { LastDealCLType } from '../../../models/company/CompanyListType'
import { dayBaseText, newCustomDate, nextDay } from '../../../models/_others/CustomDate'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { DepartmentListType } from '../../../models/department/DepartmentListType'
import { departmentsToText } from '../../../usecases/worker/CommonWorkerCase'

export type DisplayLastDealType = keyof LastDealCLType | boolean

export type CompanyProps = {
    company?: CompanyCLType
    hasLastDeal?: DisplayLastDealType
    hideLastDeal?: boolean
    iconSize?: number
    displayCompanyPrefix?: boolean
    departments?: DepartmentListType
    style?: ViewStyle
}

export const CompanyCL = React.memo((props: Partial<CompanyProps>) => {
    let { company, iconSize, hasLastDeal, hideLastDeal, displayCompanyPrefix, departments, style } = props
    iconSize = iconSize ?? 30
    displayCompanyPrefix = displayCompanyPrefix ?? true
    hasLastDeal = hasLastDeal ?? 'latestLastDealDate'
    hasLastDeal = hasLastDeal == true ? 'latestLastDealDate' : hasLastDeal
    const _imageUri = (iconSize <= 30 ? company?.xsImageUrl : iconSize <= 50 ? company?.sImageUrl : company?.imageUrl) ?? company?.imageUrl
    const lastDeal = useMemo(() => (typeof hasLastDeal != 'boolean' && hasLastDeal != undefined ? company?.lastDeal?.[hasLastDeal] : undefined), [company, hasLastDeal])
    const { t } = useTextTranslation()

    return (
        <View style={[{ flex: 1 }, style]}>
            {company?.companyPartnership != 'my-company' && hasLastDeal != false && !hideLastDeal && (
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        height: 16,
                        alignItems: 'center',
                    }}>
                    <Text style={{ ...GlobalStyles.smallGrayText, fontSize: 10, lineHeight: 12 }}>{`${t('common:FinalTransaction')}   ${lastDeal ? dayBaseText(lastDeal) : t('common:None')}`}</Text>
                    {/* 2022.07 okuda - KVSキャッシュ導入に伴い、メソッドを持たないキャッシュデータに対応させるためCustomDateを再生成 */}
                    {/* {company?.lastDeal?.latestLastDealDate == undefined && company?.createdAt && nextDay(company, createdAt, ).totalSeconds > newCustomDate().totalSeconds && ( */}
                    {company?.lastDeal?.latestLastDealDate == undefined && company?.createdAt && nextDay(company.createdAt).totalSeconds > newCustomDate().totalSeconds && <NewBadge />}
                </View>
            )}

            <View
                style={[
                    {
                        flexDirection: 'row',

                        // marginTop: 5
                    },
                ]}>
                <ImageIcon
                    style={
                        {
                            // marginTop: 5,
                        }
                    }
                    imageUri={_imageUri}
                    imageColorHue={company?.imageColorHue}
                    size={iconSize}
                />
                <View
                    style={{
                        flexDirection: 'column',
                        justifyContent: 'center',
                        marginLeft: 7,
                    }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }}>
                        {displayCompanyPrefix == true && (
                            <CompanyPrefix
                                style={{
                                    marginRight: 5,
                                }}
                                type={company?.companyPartnership}
                            />
                        )}

                        <Text
                            numberOfLines={2}
                            ellipsizeMode={'middle'}
                            style={{
                                lineHeight: 14,
                                fontSize: 12,
                                maxWidth: WINDOW_WIDTH - 180,
                                fontFamily: FontStyle.regular,
                            }}>
                            {company?.name}
                        </Text>
                        {departments && (
                            <Text
                                numberOfLines={2}
                                ellipsizeMode={'middle'}
                                style={{
                                    lineHeight: 14,
                                    fontSize: 12,
                                    maxWidth: WINDOW_WIDTH - 180,
                                    fontFamily: FontStyle.regular,
                                    marginLeft: 5,
                                }}>
                                {departmentsToText(departments?.items)}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        </View>
    )
})
