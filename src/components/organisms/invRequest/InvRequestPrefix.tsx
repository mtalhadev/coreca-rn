import React from 'react'
import { ViewStyle } from 'react-native'

import { THEME_COLORS } from '../../../utils/Constants'
import { Prefix } from '../Prefix'
import { match } from 'ts-pattern'
import { InvRequestStatusType } from '../../../models/invRequest/InvRequestType'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

export type InvRequestPrefixProps = {
    type: InvRequestStatusType
    fontSize: number
    style?: ViewStyle
}

export const InvRequestPrefix = React.memo((props: Partial<InvRequestPrefixProps>) => {
    let { type, fontSize, style } = props
    fontSize = fontSize ?? 10
    const { t } = useTextTranslation()
    
    return (
        <>
            {type != undefined && (
                <Prefix
                    style={style}
                    fontSize={fontSize}
                    fontColor={match(type)
                    .with('approval', () => '#ffffff')
                    .with('waiting', () => '#ffffff')
                    .otherwise(() => '#000')
                }
                    color={match(type)
                        .with('unapplied', () => THEME_COLORS.OTHERS.LIGHT_PINK)
                        .with('waiting', () => THEME_COLORS.OTHERS.WARN_ORANGE)
                        .with('unauthorized', () => THEME_COLORS.OTHERS.LIGHT_GRAY)
                        .with('approval', () => THEME_COLORS.OTHERS.PARTNER_GREEN)
                        .otherwise(() => THEME_COLORS.OTHERS.GRAY)}
                    text={match(type)
                        .with('unapplied', () => t('common:unapplied'))
                        .with('waiting', () => t('common:waiting'))
                        .with('unauthorized', () => t('common:unauthorized'))
                        .with('approval', () => t('common:approval'))
                        .otherwise(() => '')}
                />
            )}
        </>
    )
})
