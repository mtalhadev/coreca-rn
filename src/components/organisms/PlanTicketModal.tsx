import React, { useEffect, useState } from 'react'
import { Text, StyleSheet } from 'react-native'
import { MAX_PROJECT_SPAN, THEME_COLORS } from '../../utils/Constants'
import { FontStyle } from '../../utils/Styles'
import { InputDateTimeBox } from './inputBox/InputDateTimeBox'
import { CustomDate, newCustomDate, nextDay, nextMonth } from '../../models/_others/CustomDate'
import { InputDropDownBox } from './inputBox/InputDropdownBox'
import { getPaidPlanFromText, getPaidPlanText, getPaidPlanTextList, PaidPlanType } from '../../models/_others/PlanTicket'
import { BaseModal } from './BaseModal'
import { useTextTranslation } from '../../fooks/useTextTranslation'
type initialStateType = PlanTicketInputType

const initialState: initialStateType = {
    startDate: newCustomDate(),
    endDate: undefined,
    paidPlan: 'paid',
}

export type PlanTicketInputType = {
    startDate?: CustomDate
    endDate?: CustomDate
    paidPlan?: PaidPlanType
}

export type PlanTicketModalProps = {
    onPress?: (output: PlanTicketInputType) => void
    onClose?: () => void
    isVisible?: boolean
}

export const PlanTicketModal = (param: PlanTicketModalProps) => {
    const { onPress, isVisible, onClose } = param
    const [{ startDate, endDate, paidPlan }, setState] = useState(initialState)
    const { t } = useTextTranslation()

    useEffect(() => {
        if (!isVisible) {
            setState(() => initialState)
        }
    }, [isVisible])

    const __disable = startDate == undefined || paidPlan == undefined

    return (
        <BaseModal
            onClose={onClose}
            isVisible={isVisible}
            disabled={__disable}
            buttonTitle={t('common:PublishedIn')}
            onPress={() => {
                if (onPress) {
                    onPress({
                        startDate,
                        endDate,
                        paidPlan,
                    })
                }
            }}>
            <Text
                style={{
                    fontSize: 14,
                    color: THEME_COLORS.OTHERS.BLACK,
                    fontFamily: FontStyle.medium,
                    textAlign: 'center',
                    lineHeight: 16,
                }}>
                {t('common:PaidPlanTicketsToBeIssued')}
            </Text>
            <InputDropDownBox
                title={t('common:PaidPlanType')}
                required={true}
                disable={true}
                selectableItems={getPaidPlanTextList()}
                selectNum={1}
                value={(paidPlan ? [getPaidPlanText(paidPlan)] : [t('common:PaidPlans')]) as string[]}
                style={{
                    marginTop: 30,
                }}
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, paidPlan: value ? getPaidPlanFromText(value[0]) : undefined }))
                }}
            />
            <InputDateTimeBox
                style={{ marginTop: 30 }}
                required={true}
                title={t('common:StartDate')}
                value={startDate}
                initDateInput={startDate}
                dateInputMode="datetime"
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, startDate: value }))
                }}
            />
            <InputDateTimeBox
                style={{ marginTop: 30 }}
                title={t('common:EndDate')}
                minDateTime={startDate}
                value={endDate}
                initDateInput={endDate ?? (startDate ? nextMonth(startDate, 1) : undefined)}
                maxDateTime={startDate ? nextDay(startDate, MAX_PROJECT_SPAN) : undefined}
                dateInputMode="datetime"
                onValueChangeValid={(value) => {
                    setState((prev) => ({ ...prev, endDate: value }))
                }}
                infoText={t('common:IfYouDoNotSpecifyEndDatePlanIsForIndefinitePeriod')}
            />
        </BaseModal>
    )
}

const styles = StyleSheet.create({})
