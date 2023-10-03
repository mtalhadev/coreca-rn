import React, { useMemo } from 'react'
import { ViewStyle } from 'react-native'

import { THEME_COLORS } from '../../../utils/Constants'
import { Prefix } from '../Prefix'
import { match } from 'ts-pattern'
import { ConstructionRelationType } from '../../../models/construction/ConstructionRelationType'

export type ConstructionPrefixProps = {
    type: ConstructionRelationType
    fontSize: number
    style?: ViewStyle
}

export const ConstructionPrefix = React.memo((props: Partial<ConstructionPrefixProps>) => {
    let { type, fontSize, style } = props
    fontSize = fontSize ?? 10

    const color = useMemo(() => match(type)
    .with('owner', () => THEME_COLORS.OTHERS.LIGHT_PINK)
    .with('intermediation', () => THEME_COLORS.OTHERS.LIGHT_PINK)
    .with('order-children', () => THEME_COLORS.OTHERS.LIGHT_PINK)
    .with('manager', () => THEME_COLORS.OTHERS.TIMER_SKY_BLUE)
    .with('fake-company-manager', () => THEME_COLORS.OTHERS.TIMER_SKY_BLUE)
    .otherwise(() => THEME_COLORS.OTHERS.BORDER_COLOR), [type])

    const text = useMemo(() => match(type)
    .with('owner', () => 'オーナー工事')
    .with('intermediation', () => '仲介工事')
    .with('order-children', () => '発注管理下工事')
    .with('manager', () => '自社施工工事')
    .with('fake-company-manager', () => '仮会社施工工事')
    .otherwise(() => '他社工事'), [type])

    return (
        <>
            {type != undefined && (
                <Prefix
                    style={style}
                    fontSize={fontSize}
                    fontColor={'#000'}
                    color={color}
                    text={text}
                />
            )}
        </>
    )
})
