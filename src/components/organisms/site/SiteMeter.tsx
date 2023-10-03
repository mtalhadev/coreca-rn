import React from 'react'
import { Text, View, ViewStyle } from 'react-native'
import { FontStyle } from '../../../utils/Styles'
import { THEME_COLORS } from '../../../utils/Constants'
import { Meter } from '../../atoms/Meter'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

export type SiteMeterProps = {
    routeNameFrom?: string
    style?: ViewStyle
} & SiteMeterUIType

export type SiteMeterUIType = {
    presentCount?: number
    requiredCount?: number
}

export const SiteMeter = React.memo((props: Partial<SiteMeterProps>) => {
    let { presentCount, requiredCount, routeNameFrom, style } = props
    presentCount = presentCount ?? 0
    requiredCount = requiredCount ?? 0
    const ratio = requiredCount != 0 ? presentCount / requiredCount : 1
    const { t } = useTextTranslation()
    return (
        <View
            style={[
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                },
                style,
            ]}>
            <Meter
                style={{
                    flex: 1,
                }}
                ratio={ratio}
                isGlobalLayoutWidth={routeNameFrom === 'DateArrangements'}
            />
            <View
                style={{
                    flex: 1,
                    marginLeft: 10,
                }}>
                <Text
                    numberOfLines={1}
                    ellipsizeMode={'clip'}
                    style={{
                        lineHeight: 16,
                        fontSize: 11,
                        fontFamily: FontStyle.regular,
                    }}>
                    <Text
                        style={{
                            fontSize: 9,
                        }}>
                        {t('common:Later')}
                    </Text>
                    <Text
                        style={{
                            fontSize: 13,
                            color: requiredCount - presentCount <= 0 ? '#000' : THEME_COLORS.OTHERS.ALERT_RED,
                            fontFamily: FontStyle.medium,
                        }}>
                        {requiredCount - presentCount >= 0 ? requiredCount - presentCount : 0}
                    </Text>
                    <Text
                        style={{
                            fontSize: 9,
                        }}>
                        名
                    </Text>
                    <Text>{`（${presentCount}${t('common:Name')}/${requiredCount}${t('common:Name')}）`}</Text>
                </Text>
            </View>
        </View>
    )
})
