import React from 'react'
import { Text, Pressable, View, Image, ViewStyle } from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { CustomDate, getDate } from '../../models/_others/CustomDate'

export type DateTimeModalProps = {
    fieldName: string
    mode: 'date' | 'time' | 'datetime'
    isVisible: boolean
    initDate?: CustomDate
    onConfirmFunc: (fieldName?: string, date?: CustomDate) => void
    onHideFunc: () => void
    style?: ViewStyle
}

export const DateTimeModal = (props: Partial<DateTimeModalProps>) => {
    const { fieldName, mode, isVisible, initDate, onConfirmFunc, onHideFunc, style } = props

    return (
        <DateTimePickerModal
            mode={mode}
            isVisible={isVisible}
            date={initDate ? getDate(initDate) : undefined}
            onConfirm={(rcvDate) => {
                if (onConfirmFunc) {
                    onConfirmFunc(fieldName, rcvDate.toCustomDate())
                }
            }}
            onCancel={() => {
                if (onHideFunc) {
                    onHideFunc()
                }
            }}
            locale="ja-JP"
            confirmTextIOS="OK"
            cancelTextIOS="キャンセル"
        />
    )
}
