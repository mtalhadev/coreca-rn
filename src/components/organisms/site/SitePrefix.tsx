import React from 'react'
import { ViewStyle } from 'react-native'

import { THEME_COLORS } from '../../../utils/Constants'
import { Prefix } from '../Prefix'
import { match } from 'ts-pattern'
import { SiteRelationType } from '../../../models/site/SiteRelationType'

export type SitePrefixProps = {
    type: SiteRelationType
    fontSize: number
    style?: ViewStyle
}

export const SitePrefix = React.memo((props: Partial<SitePrefixProps>) => {
    let { type, fontSize, style } = props
    fontSize = fontSize ?? 10
    return (
        <>
            {type != undefined && (
                <Prefix
                    style={style}
                    fontSize={fontSize}
                    fontColor={'#000'}
                    color={match(type)
                        .with('owner', 'intermediation', 'order-children', () => THEME_COLORS.OTHERS.LIGHT_PINK)
                        .with('manager', 'fake-company-manager', () => THEME_COLORS.OTHERS.TIMER_SKY_BLUE)
                        .otherwise(() => THEME_COLORS.OTHERS.BORDER_COLOR)}
                    text={match(type)
                        .with('owner', 'intermediation', () => '発注管理') // 請負発注に使用した仲介工事の直下なので現場は仕様上存在しない。データ上の存在。
                        .with('order-children', () => '発注管理下')
                        .with('manager', () => '自社施工')
                        .with('fake-company-manager', () => '仮会社施工')
                        .otherwise(() => '他社現場')}
                />
            )}
        </>
    )
})
