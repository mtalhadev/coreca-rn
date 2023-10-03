import React, { useMemo } from 'react'
import { Text, View, ViewStyle } from 'react-native'
import uniqBy from 'lodash/uniqBy'
import { GlobalStyles } from '../../../utils/Styles'
import { THEME_COLORS } from '../../../utils/Constants'
import { Tag } from '../Tag'
import { ImageIcon } from '../ImageIcon'
import { ProjectType } from '../../../models/project/Project'
import { dayBaseText, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { MonthlyProjectType } from '../../../models/project/MonthlyProjectType'
import { departmentsToText } from '../../../usecases/worker/CommonWorkerCase'

export type ContractingProjectProps = {
    contractingProject?: ProjectType
    iconSize?: number
    onPress?: () => void
    hideClient?: boolean
    style?: ViewStyle
}

export const ContractingProjectPrefix = React.memo((props: Partial<ContractingProjectProps>) => {
    const { t } = useTextTranslation()
    let { contractingProject, iconSize, hideClient, style } = props
    iconSize = iconSize ?? 25
    const _imageUri = (iconSize <= 30 ? contractingProject?.xsImageUrl : iconSize <= 50 ? contractingProject?.sImageUrl : contractingProject?.imageUrl) ?? contractingProject?.imageUrl
    const receives = useMemo(
        () =>
            contractingProject?.companyContracts?.totalContracts?.items
                ?.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))
                .filter((contract) => contract.orderCompany?.companyPartnership == 'my-company'),
        [contractingProject],
    )
    const receiveCompanyNames = useMemo(
        () =>
            uniqBy(receives, (contract) => contract.receiveCompany?.companyId)
                ?.map((contract) => {
                    const name = contract.receiveCompany?.name
                    const departments = departmentsToText(contract?.receiveDepartments?.items)
                    return (name ?? '') + (' ' + departments ?? '')
                })
                .join(',  '),
        [receives],
    )
    const orders = useMemo(() => contractingProject?.companyContracts?.totalContracts?.items?.filter((contract) => contract.receiveCompany?.companyPartnership == 'my-company'), [contractingProject])
    const orderCompanyNames = useMemo(
        () =>
            uniqBy(orders, (contract) => contract.orderCompany?.companyId)
                ?.map((contract) => {
                    const name = contract.orderCompany?.name
                    const departments = departmentsToText(contract.orderDepartments?.items)
                    return (name ?? '') + (' ' + departments ?? '')
                })
                .join(',  '),
        [orders],
    )

    const requestingCompanyName = useMemo(
        () => contractingProject?.companyContracts?.totalContracts?.items?.filter((contract) => contract.receiveCompany?.isFake).map((contract) => contract.receiveCompany?.name)[0],
        [contractingProject],
    )

    // const endDate = useMemo(() => (contractingProject?.endDate ? dayBaseText(toCustomDateFromTotalSeconds(contractingProject?.endDate)) : t('common:Undecided')), [contractingProject?.endDate])
    // const startDate = useMemo(() => (contractingProject?.startDate ? dayBaseText(toCustomDateFromTotalSeconds(contractingProject?.startDate)) : t('common:Undecided')), [contractingProject?.startDate])

    return (
        <View
            style={{
                ...style,
                flexDirection: 'row',
                alignItems: 'center',
            }}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    maxWidth: '50%',
                }}>
                <ImageIcon imageUri={_imageUri} imageColorHue={contractingProject?.imageColorHue} type={'project'} size={iconSize} />
                <Text
                    ellipsizeMode={'middle'}
                    numberOfLines={1}
                    style={[
                        GlobalStyles.mediumText,
                        {
                            fontSize: 12,
                            lineHeight: 14,
                            marginLeft: 7,
                        },
                    ]}>
                    {contractingProject?.name}
                </Text>
            </View>

            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginLeft: 20,
                    maxWidth: '50%',
                    marginTop: 0,
                }}>
                {contractingProject?.isFakeCompanyManage != true && (orders?.length ?? 0) > 0 && (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginLeft: 5,
                            maxWidth: '85%',
                        }}>
                        <Tag tag={t('common:Client')} color={THEME_COLORS.OTHERS.TABLE_AREA_PURPLE} fontColor={THEME_COLORS.OTHERS.GRAY} />
                        <Text
                            ellipsizeMode={'middle'}
                            numberOfLines={1}
                            style={{
                                ...GlobalStyles.smallGrayText,
                                marginLeft: 5,
                                marginRight: 7,
                            }}>
                            {orderCompanyNames}
                        </Text>
                    </View>
                )}
                {contractingProject?.isFakeCompanyManage != true && (receives?.length ?? 0) > 0 && (orders?.length ?? 0) === 0 && (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginLeft: 5,
                            maxWidth: '85%',
                        }}>
                        <Tag tag={t('common:RecipientOfOrders')} color={THEME_COLORS.OTHERS.TABLE_AREA_PURPLE} fontColor={THEME_COLORS.OTHERS.GRAY} />
                        <Text
                            ellipsizeMode={'middle'}
                            numberOfLines={1}
                            style={{
                                ...GlobalStyles.smallGrayText,
                                marginLeft: 5,
                                marginRight: 7,
                            }}>
                            {receiveCompanyNames}
                        </Text>
                    </View>
                )}
                {contractingProject?.isFakeCompanyManage == true && hideClient != true && (
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginLeft: 5,
                            maxWidth: '85%',
                        }}>
                        <Tag tag={t('common:Client')} color={THEME_COLORS.OTHERS.TABLE_AREA_PURPLE} fontColor={THEME_COLORS.OTHERS.GRAY} />
                        <Text
                            ellipsizeMode={'middle'}
                            numberOfLines={1}
                            style={{
                                ...GlobalStyles.smallGrayText,
                                marginLeft: 5,
                                marginRight: 7,
                            }}>
                            {requestingCompanyName}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    )
})
