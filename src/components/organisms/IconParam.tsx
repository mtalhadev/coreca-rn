import React from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { THEME_COLORS } from '../../utils/Constants'
import { Icon, IconName } from './../atoms/Icon'
import { PlusButton } from './../atoms/PlusButton'
import { IconParamContent } from './../atoms/IconParamContent'

export type IconParamProps = {
    onPress: () => void
    color: string
    iconName: IconName
    paramName: string
    paramNameSecond: string
    count: number
    withBatch?: boolean
    countSecond: number
    iconSize: number
    plusButtonSize: number
    plusButtonMarginLeft: number
    suffix: string
    suffixSecond: string
    flex: number
    hasBorder: boolean
    style: ViewStyle
}

export const IconParam = React.memo((props: Partial<IconParamProps>) => {
    let { onPress, color, paramName, paramNameSecond, iconSize, plusButtonSize, plusButtonMarginLeft, hasBorder, iconName, flex, count, withBatch, countSecond, suffix, suffixSecond, style } = props
    flex = flex ?? 1
    iconSize = iconSize ?? 16
    plusButtonSize = plusButtonSize ?? 18
    plusButtonMarginLeft = plusButtonMarginLeft ?? 5

    return (
        <View
            style={[
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderLeftWidth: hasBorder ? 1 : 0,
                    paddingVertical: 5,
                    paddingLeft: hasBorder ? 10 : 5,
                    flex,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                },
                style,
            ]}>
            <Icon name={iconName} width={iconSize} height={iconSize} fill={color} />

            <IconParamContent count={count} paramName={paramName} withBatch={withBatch} suffix={suffix} color={color} />
            {(paramNameSecond || countSecond || suffixSecond) && <Text style={{ marginLeft: 5, color: color }}>/</Text>}
            {(paramNameSecond || countSecond || suffixSecond) && <IconParamContent count={countSecond} suffix={suffixSecond} color={color} />}

            {onPress && (
                <PlusButton
                    style={{
                        marginLeft: plusButtonMarginLeft,
                        marginTop: -2,
                    }}
                    onPress={() => {
                        if (onPress) {
                            onPress()
                        }
                    }}
                    shadow={false}
                    size={plusButtonSize}
                    color={THEME_COLORS.OTHERS.GRAY}
                />
            )}
        </View>
    )
})
