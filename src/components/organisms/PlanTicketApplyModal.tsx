import React, { useEffect, useState } from 'react'
import { Text, StyleSheet } from 'react-native'
import { THEME_COLORS } from '../../utils/Constants'
import { InputTextBox } from './inputBox/InputTextBox'
import { FontStyle } from '../../utils/Styles'
import { BaseModal } from './BaseModal'
import { useTextTranslation } from '../../fooks/useTextTranslation'
type initialStateType = {
    planTicketId?: string
}

const initialState: initialStateType = {
    // 
}


export type PlanTicketApplyModalProps = {
    onPress?: (planTicketId?: string) => void
    onClose?: () => void
    isVisible?: boolean
}


export const PlanTicketApplyModal = (param: PlanTicketApplyModalProps) => {
    const { onPress, isVisible, onClose } = param
    const [{ planTicketId }, setState] = useState(initialState)
    const { t } = useTextTranslation()

    useEffect(() => {
        if (!isVisible) {
            setState(() => initialState)
        }
    }, [isVisible])

    const __disable = planTicketId == undefined

    return (
        <BaseModal 
            isVisible={isVisible}
            onPress={()=>{if (onPress) {
                onPress(planTicketId)
            }}}
            onClose={onClose}
            disabled={__disable}
            buttonTitle={t('common:Apply')} 
        >
                <Text
                    style={{
                        fontSize: 14,
                        color: THEME_COLORS.OTHERS.BLACK,
                        fontFamily: FontStyle.medium,
                        textAlign: 'center',
                        lineHeight: 16,
                    }}>
                    {t('common:EnterThePaidPlanTicketIDToApply')}
                </Text>
                <InputTextBox 
                    style={{
                        marginTop: 20
                    }}
                    required
                    value={planTicketId}
                    placeholder={t('common:EnterID')}
                    infoText={t('common:PleaseHaveYourIDIssuedByYourSupervisor')}
                    title={t('common:PaidPlanTicketID')}
                    onValueChangeValid={(value) => {
                        setState((prev) => ({...prev, planTicketId: value}))
                    }}
                />
        </BaseModal>
    )
}

const styles = StyleSheet.create({})
