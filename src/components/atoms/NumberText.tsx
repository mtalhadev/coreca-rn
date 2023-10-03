import React from 'react'
import { Text, TextStyle, ViewStyle } from 'react-native'

export type NumberTextProps = {
    children: number
    style: ViewStyle & TextStyle
    testID: string
}

export const NumberText = React.memo((props: Partial<NumberTextProps>) => {
    const { children: number, style, testID } = props

    let numberText = number?.toString() ?? '-'
    if (number) {
        if (number >= 1000 && number < 1000000) {
            numberText = `${Math.floor(number / 1000)}k`
        } else if (number >= 1000000) {
            numberText = `${Math.floor(number / 1000000)}m`
        }
    }

    return <Text style={[style]} testID={testID}>{numberText}</Text>
})
