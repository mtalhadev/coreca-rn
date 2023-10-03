import React, { useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import { THEME_COLORS } from '../../../utils/Constants'
import { Tag } from '../Tag'

import { ContractType } from '../../../models/contract/Contract'
import { TableArea } from '../../atoms/TableArea'
import { timeBaseText, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { CompanyType } from '../../../models/company/Company'
import { Company } from '../company/Company'
import { WorkerType } from '../../../models/worker/Worker'

export type ContractDisplayType = 'receive' | 'order' | 'both'
export type ContractProps = {
    contract?: ContractType
    type?: ContractDisplayType
    style?: ViewStyle
    contractor?: CompanyType
    supportType?: 'support-receive' | 'support-order'
    updateWorker?: WorkerType
    updatedAt?: number
    isOnlyCompany?: boolean
}

export const Contract = (props: Partial<ContractProps>) => {
    const { t } = useTextTranslation()
    let { contract, style, type, contractor, supportType, updateWorker, updatedAt, isOnlyCompany } = props
    type = type ?? 'both'

    const contractAt = useMemo(() => (contract?.contractAt ? toCustomDateFromTotalSeconds(contract?.contractAt) : undefined), [contract?.contractAt])
    const _updatedAt = useMemo(() => (updatedAt ? toCustomDateFromTotalSeconds(updatedAt) : undefined), [updatedAt])
    return (
        <View style={[style]}>
            {updateWorker == undefined && contract?.orderCompany !== undefined && (type == 'order' || type == 'both') && supportType !== 'support-receive' && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 5,
                    }}>
                    <Tag tag={t('common:Client')} color={THEME_COLORS.OTHERS.TABLE_AREA_PURPLE} fontColor={THEME_COLORS.OTHERS.GRAY} />
                    <Company
                        style={{
                            marginLeft: 15,
                            flex: 1,
                        }}
                        iconSize={30}
                        hasLastDeal={false}
                        company={contractor ? contractor : contract?.orderCompany}
                        departments={
                            contractor
                                ? contract?.orderCompanyId == contractor.companyId
                                    ? contract?.orderDepartments
                                    : contract?.superConstruction?.contract?.orderCompanyId == contractor.companyId
                                    ? contract.superConstruction?.contract?.orderDepartments
                                    : undefined
                                : contract.orderDepartments
                        }
                    />
                </View>
            )}
            {updateWorker == undefined && (type == 'receive' || type == 'both') && supportType !== 'support-order' && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 5,
                    }}>
                    <Tag tag={supportType === 'support-receive' ? t('common:Client') : t('common:Construct')} color={THEME_COLORS.OTHERS.TABLE_AREA_PURPLE} fontColor={THEME_COLORS.OTHERS.GRAY} />
                    <Company
                        style={{
                            marginLeft: 15,
                            flex: 1,
                        }}
                        iconSize={30}
                        hasLastDeal={false}
                        company={contract?.receiveCompany}
                        departments={contract?.receiveDepartments}
                    />
                </View>
            )}

            {isOnlyCompany != true && (
                <TableArea
                    style={{
                        marginTop: 0,
                    }}
                    contentRatio={2}
                    columns={[
                        {
                            key: t('common:ContractDate'),
                            content: contractAt ? timeBaseText(contractAt) : t('common:Unidentified'),
                        },
                        {
                            key: t('common:Remarks'),
                            content: contract?.remarks,
                        },
                        updateWorker
                            ? {
                                  key: t('common:Editor'),
                                  content: updateWorker ? updateWorker.nickname ?? updateWorker.name : t('common:Unidentified'),
                              }
                            : undefined,
                        updateWorker
                            ? {
                                  key: t('common:UpdatedAt'),
                                  content: _updatedAt ? timeBaseText(_updatedAt) : t('common:Unidentified'),
                              }
                            : undefined,
                    ]}
                />
            )}
        </View>
    )
}
