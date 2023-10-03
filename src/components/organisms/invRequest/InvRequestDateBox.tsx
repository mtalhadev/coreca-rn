import React, { useMemo } from 'react'
import { Pressable, View, ViewStyle, StyleSheet } from 'react-native'
import { THEME_COLORS } from '../../../utils/Constants'
import { Icon } from '../../atoms/Icon'
import { useNavigation } from '@react-navigation/native'
import { DateIcon } from '../../atoms/DateIcon'
import { WorkerListCL } from '../worker/WorkerListCL'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { Line } from '../../atoms/Line'

import { InvRequestCLType } from '../../../models/invRequest/InvRequestType'
import { SiteMeter } from '../site/SiteMeter'
import { useSelector } from 'react-redux'
import { StoreType } from '../../../stores/Store'
import { CustomDate } from '../../../models/_others/CustomDate'
import { InvRequestPrefix } from './InvRequestPrefix'
import sum from 'lodash/sum'
import { PlusButton } from '../../atoms/PlusButton'
import { MinusButton } from '../../atoms/MinusButton'

export type SiteDateBoxProps = {
    item?: InvRequestDateInfoType
    onPressPlus?: () => void
    onPressMinus?: () => void
    style?: ViewStyle
}

export type InvRequestDateInfoType = {
    date?: CustomDate
    meetingDate?: CustomDate
    endDate?: CustomDate
} & InvRequestCLType
export const InvRequestDateBox = (props: SiteDateBoxProps) => {
    const { item, onPressPlus, onPressMinus, style } = props
    const navigation = useNavigation<any>()
    const presentCount = useMemo(
        () => (item?.workerIds?.length ?? 0) + sum(item?.site?.companyRequests?.orderRequests?.items?.map((req) => req?.requestCount).filter((data) => data != undefined)),
        [item],
    )
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    return (
        <>
            {(item?.invRequestId == undefined || (item.myCompanyId != myCompanyId && item.isApplication != true)) && (
                // InvRequestがない場合
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
                        {item?.myCompanyId == myCompanyId && onPressPlus && (
                            <PlusButton
                                size={26}
                                onPress={() => {
                                    onPressPlus()
                                }}
                            />
                        )}
                    </View>
                </ShadowBox>
            )}
            {item?.invRequestId != undefined && (item.myCompanyId == myCompanyId || (item.targetCompanyId == myCompanyId && item.isApplication == true)) && (
                //InvRequestがある場合
                <ShadowBox
                    onPress={() => {
                        navigation.push('InvRequestDetail', {
                            invRequestId: item?.invRequestId,
                            type: item.myCompanyId == myCompanyId ? 'order' : 'receive',
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
                            <InvRequestPrefix type={item.invRequestStatus} />

                            {/* TODO:要検討：申請確定や承認・非承認がここでできても良いかもしれない。現場確定も同様 */}
                        </View>
                        <View
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}>
                            {item.myCompanyId == myCompanyId && (
                                <>
                                    <Pressable
                                        style={{
                                            padding: 7,
                                            marginRight: 10,
                                        }}
                                        onPress={() => {
                                            navigation.push('EditInvRequest', {
                                                invRequestId: item?.invRequestId,
                                            })
                                        }}>
                                        <Icon name={'edit'} width={18} height={18} fill={'#000'} />
                                    </Pressable>
                                </>
                            )}
                            {item?.myCompanyId == myCompanyId && onPressMinus && (
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
                        <SiteMeter presentCount={presentCount} requiredCount={item.workerCount} />
                        <View
                            style={{
                                flexDirection: 'row',
                                marginTop: 5,
                            }}>
                            <WorkerListCL workers={item?.workers?.items} requests={item.site?.companyRequests?.orderRequests?.items} />
                        </View>
                    </View>
                </ShadowBox>
            )}
        </>
    )
}

const styles = StyleSheet.create({})
