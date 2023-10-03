import React from 'react'
import { Text, View, ViewStyle } from 'react-native'

export type DecideButtonProps = {
    label: string
    color: string
    backgroundColor: string
    disabled: boolean
    size: number
    style?: ViewStyle
}

export const DecideButton = React.memo((props: Partial<DecideButtonProps>) => {
    let { label, color, backgroundColor, disabled, size } = props
    disabled = disabled ?? false
    size = size ?? 40

    /**
     * 確定 => OK
     * Hiruma
     * 20222.9.21
     * 「確定」ではなく、選択終了なので「OK」という軽いニュアンスに変更。
     */
    label = label ?? 'OK'

    return (
        <View
            style={{
                borderRadius: size,
                alignItems: 'center',
                justifyContent: 'center',
                height: size,
                width: size,
                backgroundColor: backgroundColor,
            }}
        >
            <Text style={{ color, fontWeight: 'bold' }}>{label}</Text>
        </View>
    )
})
