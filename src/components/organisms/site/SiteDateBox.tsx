import React from 'react'
import { Text, Pressable, View, ViewStyle, StyleSheet } from 'react-native'
import { GlobalStyles } from '../../../utils/Styles'
import isEmpty from 'lodash/isEmpty'
import { THEME_COLORS } from '../../../utils/Constants'
import { Icon } from '../../atoms/Icon'
import { CustomDate, getTextBetweenAnotherDate, toCustomDateFromTotalSeconds } from '../../../models/_others/CustomDate'
import { PlusButton } from '../../atoms/PlusButton'
import { useNavigation } from '@react-navigation/native'
import { DateIcon } from '../../atoms/DateIcon'
import { WorkerListCL } from '../worker/WorkerListCL'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { SiteMeter } from './SiteMeter'
import { IconParam } from '../IconParam'
import { Line } from '../../atoms/Line'
import { MinusButton } from '../../atoms/MinusButton'

import { WorkerCLType } from '../../../models/worker/Worker'
import { SiteType } from '../../../models/site/Site'
import { ConstructionRelationType } from '../../../models/construction/ConstructionRelationType'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { InstructionCLType } from '../../../models/instruction/Instruction'
import { RequestCLType } from '../../../models/request/Request'
import { CompanyCLType, CompanyType } from '../../../models/company/Company'

export type SiteDateBoxProps = {
    item?: SiteDateInfoType
    constructionRelation?: ConstructionRelationType
    onPressPlus?: () => void
    onPressMinus?: () => void
    style?: ViewStyle
    companyPartnership?: string
    supportType?: 'support-receive' | 'support-order'
    contractor?: CompanyType
}

export type SiteDateInfoType = SiteType & {
    date?: CustomDate
} & {
    instruction?: InstructionCLType
}

export const SiteDateBox = React.memo((props: SiteDateBoxProps) => {
    const { item, constructionRelation, style, onPressMinus, onPressPlus, companyPartnership, supportType, contractor } = props
    const navigation = useNavigation<any>()
    const { t } = useTextTranslation()
    const getInstructionTypeMessage = (instruction?: InstructionCLType) => {
        if (isEmpty(instruction)) {
            return ''
        } else if (instruction.instructionType == 'siteCreate') {
            return t('admin:HasSiteCreateInstruction')
        } else if (instruction.instructionType == 'site') {
            return t('admin:HasSiteInstruction')
        } else if (instruction.instructionType == 'siteDelete') {
            return t('admin:HasSiteDeleteInstruction')
        }
    }

    return (
        <>
            {/**
             * 現場のない日付は表示しない
             */}
            {/* {item?.siteId == undefined && (
                <ShadowBox
                    style={{
                        backgroundColor: THEME_COLORS.OTHERS.SUPER_LIGHT_GRAY,
                        ...style,
                    }}
                    hasShadow={false}>
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingHorizontal: 10,
                            paddingVertical: 7,
                        }}>
                        <DateIcon date={item?.date} />
                        <View
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'flex-start',
                            }}>
                            <View
                                style={{
                                    marginRight: 15,
                                }}>
                                <IconParam paramName={t('common:CanBeReached')} color={'#000'} iconName={'worker'} count={item?.arrangeableWorkers?.workers?.items?.length ?? 0} />
                            </View>
                            {(constructionRelation == 'manager' || constructionRelation == 'fake-company-manager') && isEmpty(item?.instruction) && onPressPlus && (
                                <PlusButton
                                    size={26}
                                    onPress={() => {
                                        onPressPlus()
                                    }}
                                />
                            )}
                        </View>
                    </View>
                </ShadowBox>
            )} */}
            {item?.siteId != undefined && (
                <ShadowBox
                    onPress={() => {
                        // navigation.push('SiteDetail', {
                        //     title: item?.construction?.name,
                        //     siteId: item?.siteId,
                        //     siteNumber: item?.siteNameData?.siteNumber,
                        //     instruction: item?.instruction,
                        //     supportType,
                        //     contractor,
                        // })
                        navigation.push('SiteAttendanceManage', {
                            siteId: item?.siteId,
                            siteNumber: item?.siteNameData?.siteNumber,
                            requestId: item?.companyRequests?.receiveRequests?.items && item?.companyRequests?.receiveRequests?.items[0]?.requestId,
                        })
                    }}
                    hasShadow={false}
                    style={{
                        borderColor: THEME_COLORS.OTHERS.LIGHT_GRAY,
                        ...style,
                    }}>
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                        }}>
                        <View
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                            <DateIcon
                                style={{
                                    marginRight: 15,
                                }}
                                date={item.date}
                            />
                            {isEmpty(item.instruction) && (
                                <Text style={[GlobalStyles.smallGrayText, { marginRight: 7 }]}>
                                    {getTextBetweenAnotherDate(
                                        item.meetingDate ? toCustomDateFromTotalSeconds(item.meetingDate) : undefined,
                                        item.endDate ? toCustomDateFromTotalSeconds(item.endDate) : undefined,
                                        true,
                                    )}
                                </Text>
                            )}
                            {!isEmpty(item.instruction) && (
                                <Text style={[GlobalStyles.smallGrayText, { marginRight: 7 }]}>
                                    {getTextBetweenAnotherDate(
                                        item.meetingDate ? toCustomDateFromTotalSeconds(item.meetingDate) : undefined,
                                        item.endDate ? toCustomDateFromTotalSeconds(item.endDate) : undefined,
                                        true,
                                    )}
                                </Text>
                            )}
                        </View>
                        <View
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                            <Text
                                style={[
                                    GlobalStyles.smallText,
                                    {
                                        color: THEME_COLORS.OTHERS.ALERT_RED,
                                        marginRight: 7,
                                    },
                                ]}>
                                {getInstructionTypeMessage(item.instruction)}
                            </Text>
                            {/* {((constructionRelation == 'manager' && (companyPartnership == 'partner' || companyPartnership == 'fake-partner') && isEmpty(item.instruction)) ||
                                constructionRelation == 'fake-company-manager') && (
                                <>
                                    <Pressable
                                        style={{
                                            padding: 7,
                                            marginRight: 10,
                                        }}
                                        onPress={() => {
                                            navigation.push('EditSite', {
                                                siteId: item?.siteId,
                                                constructionId: item?.constructionId,
                                                title: item.siteNameData?.name,
                                                isInstruction: !isEmpty(item.instruction),
                                                projectId: item?.construction?.projectId,
                                            })
                                        }}>
                                        <Icon name={'edit'} width={18} height={18} fill={'#000'} />
                                    </Pressable>
                                </>
                            )}
                            {constructionRelation == 'order-children' && companyPartnership == 'my-company' && (
                                <>
                                    <Pressable
                                        style={{
                                            padding: 7,
                                            marginRight: 10,
                                        }}
                                        onPress={() => {
                                            navigation.push('EditSite', {
                                                siteId: item?.siteId,
                                                constructionId: item?.constructionId,
                                                title: item.siteNameData?.name,
                                                isInstruction: true,
                                                projectId: item?.construction?.projectId,
                                            })
                                        }}>
                                        <Icon name={'edit'} width={18} height={18} fill={'#000'} />
                                    </Pressable>
                                </>
                            )} */}
                            {item.fakeCompanyInvRequestId == undefined && constructionRelation == 'order-children' && companyPartnership == 'my-company' && onPressMinus && (
                                <MinusButton
                                    size={26}
                                    onPress={() => {
                                        onPressMinus()
                                    }}
                                />
                            )}
                            {item.fakeCompanyInvRequestId == undefined &&
                                (constructionRelation == 'manager' || constructionRelation == 'fake-company-manager') &&
                                isEmpty(item.instruction) &&
                                onPressMinus && (
                                    <MinusButton
                                        size={26}
                                        onPress={() => {
                                            onPressMinus()
                                        }}
                                    />
                                )}
                        </View>
                    </View>

                    <Line style={{ marginHorizontal: 10 }} />

                    <View
                        style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                        }}>
                        <SiteMeter presentCount={item?.siteMeter?.companyPresentNum} requiredCount={item?.siteMeter?.companyRequiredNum} />
                        <View
                            style={{
                                flexDirection: 'row',
                                marginTop: 5,
                            }}>
                            <WorkerListCL
                                workers={item?.siteMeter?.presentArrangements?.items?.map((arr) => arr.worker).filter((worker) => worker != undefined) as WorkerCLType[]}
                                requests={item.siteMeter?.presentRequests?.items as RequestCLType[]}
                            />
                        </View>
                    </View>
                </ShadowBox>
            )}
        </>
    )
})

const styles = StyleSheet.create({})
