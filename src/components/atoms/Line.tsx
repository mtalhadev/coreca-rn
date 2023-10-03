import React from 'react'
import { View, ViewStyle } from 'react-native'

import { THEME_COLORS } from '../../utils/Constants'
export type LineProps = {
    style?: ViewStyle
}

export const Line = React.memo((props: Partial<LineProps>) => {
    const { style } = props

    return (
        <View
            style={[
                {
                    borderBottomWidth: 1,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                },
                style,
            ]}
        ></View>
    )
})
