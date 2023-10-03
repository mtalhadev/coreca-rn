import React from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { FontStyle } from '../../utils/Styles'
import { NumberText } from './NumberText'
import { Badge } from './Badge'

export type IconParamContentProps = {
    color: string
    paramName: string
    count: number
    withBatch?: boolean
    suffix: string
    style: ViewStyle
}

export const IconParamContent = React.memo((props: Partial<IconParamContentProps>) => {
    const { color, paramName, count, withBatch, suffix, style } = props

    // let countText = count?.toString() ?? '-'
    // if (count && count >= 1000) {
    //     countText = `${Math.floor(count / 1000)}k`
    // }

    return (
        <View
            style={[
                {
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                style,
            ]}>
            {paramName && (
                <Text
                    style={{
                        lineHeight: 13,
                        fontSize: 11,
                        marginLeft: 5,
                        fontFamily: FontStyle.regular,
                        color: color,
                    }}>
                    {paramName}
                </Text>
            )}
            {withBatch ? (
                <Badge
                    batchCount={count}
                    style={{
                        marginLeft: 5,
                    }}
                />
            ) : (
                <NumberText
                    style={{
                        lineHeight: 14,
                        fontSize: 12,
                        marginLeft: 5,
                        fontFamily: FontStyle.regular,
                        color: color,
                    }}>
                    {count}
                </NumberText>
            )}

            {suffix && (
                <Text
                    style={{
                        lineHeight: 16,
                        fontSize: 9,
                        marginLeft: 2,
                        fontFamily: FontStyle.regular,
                        color: color,
                    }}>
                    {suffix}
                </Text>
            )}
        </View>
    )
})
