import React, {  } from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { FontStyle } from '../../utils/Styles'

import { Icon } from '../atoms/Icon'
import { THEME_COLORS } from '../../utils/Constants'
import { Badge } from '../atoms/Badge'
import { useTextTranslation } from '../../fooks/useTextTranslation'

export const BORDER_RATIO = 0.04

export type AlertMessageProps = {
    message: string
    batchCount: number
    style?: ViewStyle
    isWhite: boolean
}

export const AlertMessage = React.memo((props: Partial<AlertMessageProps>) => {
    const { t } = useTextTranslation()
    let { message, batchCount, isWhite, style } = props
    batchCount = batchCount ?? 1
    message = message ?? t('common:WarningMessage')

    return (
        <View
            style={[
                {
                    flexDirection: 'row',
                    backgroundColor: isWhite ? '#fff' : THEME_COLORS.OTHERS.PURPLE_GRAY,
                    borderRadius: 5,
                    padding: 5,
                    alignItems: 'center',
                    borderWidth: isWhite ? 1 : 0,
                    borderColor: isWhite ? THEME_COLORS.OTHERS.BORDER_COLOR : undefined,
                },
                style,
            ]}
        >
            <Icon
                style={{
                    marginLeft: 5,
                }}
                name={'alert'}
                width={18}
                height={18}
                fill={THEME_COLORS.OTHERS.ALERT_RED}
            />
            <Text
                style={{
                    marginLeft: 10,
                    fontFamily: FontStyle.regular,
                    fontSize: 12,
                    lineHeight: 14,
                }}
            >
                {message}
            </Text>
            <Badge
                style={{
                    position: 'absolute',
                    right: -5,
                    top: -5,
                }}
                batchCount={batchCount}
            />
        </View>
    )
})
