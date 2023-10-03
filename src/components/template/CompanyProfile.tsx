import React, { useEffect, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import * as Clipboard from 'expo-clipboard'
import { THEME_COLORS } from '../../utils/Constants'
import { CompanyCL } from '../organisms/company/CompanyCL'
import { ColumnType, TableArea } from '../atoms/TableArea'
import { CompanyCLType } from '../../models/company/Company'
import { WorkerCL } from '../organisms/worker/WorkerCL'
import { ShadowBoxWithHeader } from '../organisms/shadowBox/ShadowBoxWithHeader'
import { Line } from '../atoms/Line'
import { WorkerInfo } from '../organisms/worker/WorkerInfo'
import { InviteUrl } from '../organisms/InviteUrl'
import { AppButton } from '../atoms/AppButton'
import { useNavigation } from '@react-navigation/native'
import { BottomMargin } from '../atoms/BottomMargin'
import { WorkerCLType } from '../../models/worker/Worker'
import { getPaidPlanText } from '../../models/_others/PlanTicket'
import { PlanTicketInputType, PlanTicketModal } from '../organisms/PlanTicketModal'
import { applyPlanTicket, writePlanTicket } from '../../usecases/planTicket/CommonPlanTicketCase'
import { getUuidv4 } from '../../utils/Utils'
import { useDispatch, useSelector } from 'react-redux'
import { StoreType } from '../../stores/Store'
import { CustomResponse } from '../../models/_others/CustomResponse'
import { setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import { PlanTicketApplyModal } from '../organisms/PlanTicketApplyModal'
import { getErrorToastMessage } from '../../services/_others/ErrorService'
import { dayBaseTextWithoutDate, getTextBetweenAnotherDate } from '../../models/_others/CustomDate'
import { InquiryContent } from '../organisms/inquiry/InquiryContent'
import { MyCompanyDetailNavProps } from '../../screens/adminSide/mypage/MyCompanyDetail'
import DisplayIdInDev from '../atoms/DisplayIdInDEV'
import { useTextTranslation } from '../../fooks/useTextTranslation'
import { _getOwnerWorkerOfTargetCompany } from '../../services/worker/WorkerService'
import { checkIsCompanyOwner } from '../../usecases/account/CommonAuthCase'
import ENV from '../../../env/env'
import { departmentsToText } from '../../usecases/worker/CommonWorkerCase'
import isEmpty from 'lodash/isEmpty'

export type CompanyProfileDisplayType = 'my-company' | 'partner-company' | 'fake-partner-company' | 'other-company'
export type CompanyProfileProps = {
    type: CompanyProfileDisplayType
    company?: CompanyCLType | undefined
    worker?: WorkerCLType | undefined
    inviteUrl?: string
    onPressDelete: () => void
    onPressDeletePartnership: () => void
    onPressConnect: () => void
    onPressDisconnect: () => void
    updateCompanyData: () => void
    onPortChanged?: (port: string | undefined) => void
    style?: ViewStyle
    myCompanyDetailNavigation?: MyCompanyDetailNavProps
}

export const CompanyProfile = (props: Partial<CompanyProfileProps>) => {
    const { t } = useTextTranslation()
    let { type, company, worker, updateCompanyData, inviteUrl, onPressDelete, onPressDeletePartnership, onPressConnect, onPressDisconnect, onPortChanged, style, myCompanyDetailNavigation } = props
    type = type ?? 'my-company'
    const myWorkerId = useSelector((state: StoreType) => state.account.signInUser?.workerId)
    const myCompanyId = useSelector((state: StoreType) => state.account.belongCompanyId)
    const dispatch = useDispatch()
    const [isTicketModalVisible, setIsTicketModalVisible] = useState(false)
    const [isTicketApplyModalVisible, setIsTicketApplyModalVisible] = useState(false)
    const navigation = useNavigation<any>()
    let columns: ColumnType[] = []
    const [isOwner, setIsOwner] = useState<boolean | undefined>(false)
    const [isCorecaAdmin, setIsCorecaAdmin] = useState<boolean | undefined>(false)

    useEffect(() => {
        ;(async () => {
            try {
                if (isEmpty(myCompanyId)) {
                    return
                }
                const result = await checkIsCompanyOwner({
                    workerId: myWorkerId,
                    myCompanyId,
                })
                if (result.error) {
                    throw {
                        error: result.error,
                    }
                }

                setIsOwner(result.success?.isOwner)
                setIsCorecaAdmin(result.success?.isCorecaAdmin)
            } catch (error) {
                const _error = error as CustomResponse
                dispatch(
                    setToastMessage({
                        text: getErrorToastMessage(_error),
                        type: 'error',
                    } as ToastMessage),
                )
            }
        })()
    }, [myCompanyId])

    switch (type) {
        case 'my-company':
            columns = [
                { key: '会社名', content: company?.name },
                { key: '部署', content: (company?.departments?.items?.length ?? 0) == 0 ? 'なし' : departmentsToText(company?.departments?.items) },
                { key: '会社所在地', content: company?.address },
                { key: '電話番号', content: company?.phoneNumber },
                { key: '業種', content: company?.industry },
                ...(ENV.IS_PLAN_TICKET_AVAILABLE == true ? [{ key: '利用プラン', content: getPaidPlanText(company?.planTicket?.paidPlan) }] : []),
                ...(ENV.IS_PLAN_TICKET_AVAILABLE == true && company?.planTicket?.paidPlan != undefined && company.planTicket.planStartDate != undefined
                    ? [
                          {
                              key: 'プラン期間',
                              content: `${getTextBetweenAnotherDate(company.planTicket.planStartDate, company.planTicket.planEndDate)}`,
                          },
                      ]
                    : []),
                ...(company?.isAdmin
                    ? [
                          {
                              key: 'CORECA運営',
                              content: t('common:Yes'),
                          },
                      ]
                    : []),
            ]
            break
        case 'partner-company':
            columns = [
                { key: '会社名', content: company?.name },
                { key: '部署', content: (company?.departments?.items?.length ?? 0) == 0 ? 'なし' : departmentsToText(company?.departments?.items) },
                { key: '会社所在地', content: company?.address },
                { key: '電話番号', content: company?.phoneNumber },
                { key: '業種', content: company?.industry },
            ]
            break
        case 'fake-partner-company':
            columns = [
                { key: '会社名', content: company?.name },
                { key: '会社所在地', content: company?.address },
                { key: '担当者', content: company?.ownerName },
                { key: '電話番号', content: company?.ownerPhoneNumber },
                { key: 'メールアドレス', content: company?.ownerEmail },
            ]
            break
        case 'other-company':
            columns = [{ key: '会社名', content: company?.name }]
            break
    }

    const __writePlanTicket = async (ticket: PlanTicketInputType) => {
        try {
            setIsTicketModalVisible(false)
            const planStartDate = ticket.startDate
            const planEndDate = ticket.endDate
            const paidPlan = ticket.paidPlan
            const planTicketId = getUuidv4()
            const result = await writePlanTicket({
                planTicketId,
                paidPlan,
                planEndDate,
                planStartDate,
                myCompanyId,
                myWorkerId,
            })
            if (result.error) {
                throw { ...result }
            }
            await Clipboard.setStringAsync(planTicketId as string)
            dispatch(
                setToastMessage({
                    text: `${t('common:CopyPaidPlanTicketIDToClipboard')} ID: ${planTicketId}`,
                    type: 'success',
                } as ToastMessage),
            )
        } catch (error) {
            const _error = error as CustomResponse
            setIsTicketModalVisible(false)
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    const __applyPlanTicket = async (planTicketId?: string) => {
        try {
            setIsTicketApplyModalVisible(false)
            const result = await applyPlanTicket({
                planTicketId: planTicketId ?? 'no-id',
                myCompanyId,
            })
            if (result.error) {
                throw result.error
            }
            dispatch(
                setToastMessage({
                    text: t('common:PaidPlanTicketApplied'),
                    type: 'success',
                } as ToastMessage),
            )
            if (updateCompanyData) {
                updateCompanyData()
            }
        } catch (error) {
            const _error = error as CustomResponse
            setIsTicketApplyModalVisible(false)
            dispatch(
                setToastMessage({
                    text: getErrorToastMessage(_error),
                    type: 'error',
                } as ToastMessage),
            )
        }
    }

    return (
        <View style={[{}, style]}>
            {company != undefined && (
                <View>
                    <CompanyCL
                        style={{
                            flex: 1,
                        }}
                        iconSize={50}
                        company={company}
                        hasLastDeal={type != 'my-company'}
                    />
                    {(type == 'fake-partner-company' || type == 'partner-company') && (
                        <AppButton
                            style={{
                                marginTop: 10,
                            }}
                            onPress={() => {
                                navigation.push('AddReservation', {
                                    companyId: company?.companyId,
                                })
                            }}
                            height={30}
                            fontSize={13}
                            isGray
                            title={t('common:RequestForSupport')}
                        />
                    )}
                    <TableArea
                        style={{
                            marginTop: 10,
                        }}
                        columns={columns}
                    />
                    {type == 'my-company' && (
                        <>
                            {isOwner && isCorecaAdmin && ENV.IS_PLAN_TICKET_AVAILABLE && (
                                <>
                                    <AppButton
                                        onPress={() => {
                                            setIsTicketModalVisible(true)
                                        }}
                                        style={{
                                            marginTop: 15,
                                            marginBottom: 10,
                                        }}
                                        title={t('common:IssueAPaidPlanTicket')}
                                        height={40}
                                        isGray
                                    />
                                    <PlanTicketModal
                                        isVisible={isTicketModalVisible}
                                        onClose={() => {
                                            setIsTicketModalVisible(false)
                                        }}
                                        onPress={(ticket) => {
                                            __writePlanTicket(ticket)
                                        }}
                                    />
                                </>
                            )}
                            {ENV.IS_PLAN_TICKET_AVAILABLE && (
                                <>
                                    <AppButton
                                        onPress={() => {
                                            setIsTicketApplyModalVisible(true)
                                        }}
                                        style={{
                                            marginTop: 15,
                                            marginBottom: 10,
                                        }}
                                        title={t('common:ApplyAPaidPlanTicket')}
                                        height={40}
                                        isGray
                                    />
                                    <PlanTicketApplyModal
                                        isVisible={isTicketApplyModalVisible}
                                        onClose={() => {
                                            setIsTicketApplyModalVisible(false)
                                        }}
                                        onPress={(id) => {
                                            __applyPlanTicket(id)
                                        }}
                                    />
                                </>
                            )}
                        </>
                    )}
                    {type == 'my-company' && (
                        <View
                            style={{
                                marginTop: 20,
                                marginBottom: 20,
                            }}>
                            <Line
                                style={{
                                    marginBottom: 20,
                                }}
                            />
                            <InquiryContent worker={worker} company={company} navigation={myCompanyDetailNavigation} />
                        </View>
                    )}

                    <Line
                        style={{
                            marginTop: 20,
                        }}
                    />
                    {worker != undefined && type == 'my-company' && (
                        <ShadowBoxWithHeader
                            style={{
                                marginTop: 10,
                            }}
                            onPress={() => {
                                navigation.push('WorkerDetailRouter', {
                                    workerId: worker?.workerId,
                                    title: worker?.name,
                                })
                            }}
                            titleColor={THEME_COLORS.BLUE.MIDDLE_DEEP}
                            title={t('common:Representative')}>
                            <WorkerCL worker={worker} />
                            <Line
                                style={{
                                    marginTop: 10,
                                }}
                            />
                            <WorkerInfo phoneNumber={worker?.phoneNumber} email={worker?.account?.email} />
                        </ShadowBoxWithHeader>
                    )}
                    {company?.connectedCompany != undefined && (type == 'fake-partner-company' || type == 'partner-company') && (
                        <ShadowBoxWithHeader
                            style={{
                                marginTop: 10,
                            }}
                            title={t('common:CombinedCompany')}
                            onPress={() => {
                                // 同じ画面なので一旦戻る必要がある。
                                navigation.goBack()
                                navigation.push('CompanyDetailRouter', {
                                    companyId: company?.connectedCompany?.companyId,
                                    title: company?.connectedCompany?.name,
                                })
                            }}>
                            <CompanyCL
                                style={{
                                    flex: 1,
                                }}
                                company={company?.connectedCompany}
                            />
                        </ShadowBoxWithHeader>
                    )}

                    {type == 'fake-partner-company' && inviteUrl != undefined && company?.connectedCompany == undefined && (
                        <>
                            <InviteUrl
                                invitationUrl={inviteUrl}
                                guidance={t('common:TheUrlCanBeUsedRegardlessOfTheRegsiteration')}
                                onPortChanged={(port) => {
                                    if (onPortChanged) {
                                        onPortChanged(port)
                                    }
                                }}
                                style={{ marginTop: 30 }}
                            />
                            <Line
                                style={{
                                    marginTop: 20,
                                }}
                            />
                        </>
                    )}

                    {(type == 'fake-partner-company' || type == 'my-company') && (
                        <AppButton
                            style={{
                                marginTop: 20,
                            }}
                            onPress={() => {
                                if (type == 'fake-partner-company') {
                                    navigation.push('EditFakeCompany', {
                                        companyId: company?.companyId,
                                        title: company?.name,
                                    })
                                } else if (type == 'my-company') {
                                    navigation.push('EditMyCompany', {})
                                }
                            }}
                            title={type == 'my-company' ? t('admin:EditYourCompanyButton') : t('admin:EditFakeCompanyButton')}
                        />
                    )}
                    {type == 'fake-partner-company' && (
                        <AppButton
                            style={{
                                marginTop: 20,
                            }}
                            onPress={() => {
                                if (onPressDelete) {
                                    onPressDelete()
                                }
                            }}
                            isGray={true}
                            title={t('common:Delete')}
                        />
                    )}
                    {type == 'partner-company' && (
                        <AppButton
                            style={{
                                marginTop: 20,
                            }}
                            onPress={() => {
                                if (onPressDeletePartnership) {
                                    onPressDeletePartnership()
                                }
                            }}
                            buttonColor={THEME_COLORS.OTHERS.GRAY}
                            textColor={'#fff'}
                            height={30}
                            title={t('common:Disconnect')}
                        />
                    )}
                    {type == 'partner-company' && company.connectedCompany == undefined && (
                        <AppButton
                            style={{
                                marginTop: 20,
                            }}
                            onPress={() => {
                                if (onPressConnect) {
                                    onPressConnect()
                                }
                            }}
                            height={30}
                            isGray={true}
                            title={t('common:CombineWithAProvisionalCompany')}
                        />
                    )}
                    {type == 'partner-company' && company.connectedCompany != undefined && (
                        <AppButton
                            style={{
                                marginTop: 20,
                            }}
                            onPress={() => {
                                if (onPressDisconnect) {
                                    onPressDisconnect()
                                }
                            }}
                            height={30}
                            isGray={true}
                            title={t('common:UnbundlingWithAProvisionalCompany')}
                        />
                    )}
                    {type == 'my-company' && (
                        <AppButton
                            style={{
                                marginTop: 20,
                            }}
                            onPress={() => {
                                navigation.push('DepartmentManage', {
                                    companyId: company?.companyId,
                                })
                            }}
                            title={t('admin:AddManageDepartments')}
                        />
                    )}
                </View>
            )}

            <DisplayIdInDev id={company?.companyId} label="companyId" />

            <BottomMargin />
        </View>
    )
}
