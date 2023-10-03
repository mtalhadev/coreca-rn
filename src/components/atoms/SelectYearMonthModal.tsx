import React, { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import WheelPicker from 'react-native-wheely'
import { newDate } from '../../utils/ext/Date.extensions'
import { CustomDate, getDailyStartTime, newCustomDate } from '../../models/_others/CustomDate'
import { BaseModal } from '../organisms/BaseModal'
import { useTextTranslation } from '../../fooks/useTextTranslation'
type SelectYearMonthModalProps = {
    onCancel?: () => void
    onConfirm?: (selectedDate: CustomDate) => void
    date?: CustomDate
    isVisible?: boolean
}
const initialState: initialStateType = {
    selectedYearIndex: 0,
    selectedMonthIndex: 0,
}
type initialStateType = {
    selectedYearIndex: number
    selectedMonthIndex: number
    selectedYearMonthDate?: CustomDate
}
export const SelectYearMonthModal = (props: Partial<SelectYearMonthModalProps>) => {
    const { onCancel, onConfirm, date, isVisible } = props
    const [{ selectedYearIndex, selectedMonthIndex, selectedYearMonthDate }, setState] = useState(initialState)
    const startYear = 2000
    const endYear = 3000
    const { t } = useTextTranslation()

    useEffect(() => {
        setState((prev) => ({
            ...prev,
            selectedYearIndex: (date?.year ?? newCustomDate().year) - startYear,
            selectedMonthIndex: (date?.month ?? newCustomDate().month) - 1,
        }))
    }, [date])

    useEffect(() => {
        setState((prev) => ({
            ...prev,
            selectedYearMonthDate: getDailyStartTime(
                newDate({
                    year: selectedYearIndex + startYear,
                    month: selectedMonthIndex + 1,
                    day: 1,
                    hour: 1,
                    minute: 0,
                    second: 0,
                }).toCustomDate(),
            ),
        }))
    }, [selectedMonthIndex, selectedYearIndex])

    const yearRange = useMemo(() => [...Array(endYear - startYear + 1)].map((_, i) => (startYear + i).toString() + t('common:Year')), [endYear, startYear])
    const monthRange = useMemo(() => [...Array(12)].map((_, i) => (i + 1).toString() + t('common:Month')), [])

    return (
        <BaseModal
            isVisible={isVisible}
            onClose={onCancel}
            buttonTitle={t('common:Confirmation')}
            onPress={() => {
                if (onConfirm && selectedYearMonthDate) {
                    onConfirm(selectedYearMonthDate)
                }
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <WheelPicker selectedIndex={selectedYearIndex} options={yearRange} onChange={(year) => setState((prev) => ({ ...prev, selectedYearIndex: year }))} />
                <WheelPicker selectedIndex={selectedMonthIndex} options={monthRange} onChange={(month) => setState((prev) => ({ ...prev, selectedMonthIndex: month }))} />
            </View>
        </BaseModal>
    )
}
