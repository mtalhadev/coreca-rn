import React from 'react'
import { Text, View, ViewStyle } from 'react-native'
import { GlobalStyles } from '../../../utils/Styles'
import { THEME_COLORS, WINDOW_WIDTH } from '../../../utils/Constants'
import { ConstructionType } from '../../../models/construction/Construction'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { CustomDate } from '../../../models/_others/CustomDate'

export type ConstructionSummaryProps = {
    projectName?: string
    isSiteOnTheDay?: boolean
    isSiteOnThePreviousDay?: boolean
    receiveCompanyName?: string
    targetDate: CustomDate
    construction?: ConstructionType
    onPress?: () => void
    onLongPress?: () => void
    isSelected?: boolean
    style?: ViewStyle
}

/**
 * @summary 案件名、施行会社名、工事名を表示
 * @purpose 情報をコンパクト（2行）に表示
 */

export const ConstructionSummary = React.memo((props: Partial<ConstructionSummaryProps>) => {
    const { construction, projectName, isSiteOnTheDay, isSiteOnThePreviousDay, receiveCompanyName, onPress, onLongPress, isSelected, style } = props

    const tagWidth = isSiteOnThePreviousDay ? 45 : 0

    const displayConstructionName = construction?.name !== projectName ? construction?.name : undefined

    const _onPress = () => {
        if (onPress && !isSiteOnTheDay) {
            onPress()
        }
    }

    return (
        <ShadowBox
            hasShadow={!isSiteOnTheDay}
            shadowAnimValue={3}
            style={{
                ...style,
                marginTop: 5,
                marginHorizontal: 5,
                paddingVertical: displayConstructionName === undefined ? (receiveCompanyName === '自社' ? 10 : 5) : undefined,
                borderColor: isSelected ? THEME_COLORS.BLUE.MIDDLE_DEEP : THEME_COLORS.OTHERS.BORDER_COLOR,
                backgroundColor: isSelected ? 'lightblue' : '#fff',
                opacity: isSiteOnTheDay ? 0.5 : 1,
            }}
            onPress={_onPress}
            onLongPress={onLongPress}>
            <View style={{ padding: 5, paddingHorizontal: 10, flexDirection: 'column' }}>
                {receiveCompanyName !== undefined && receiveCompanyName !== '自社' && (
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            marginBottom: 1,
                        }}>
                        <Text
                            style={{
                                backgroundColor: THEME_COLORS.BLUE.MIDDLE,
                                paddingHorizontal: 5,
                                paddingVertical: 1,
                                ...GlobalStyles.smallText,
                                color: '#fff',
                                fontSize: 9,
                                lineHeight: 11,
                            }}>
                            施行
                        </Text>
                        <Text ellipsizeMode="tail" numberOfLines={1} style={{ ...GlobalStyles.smallText, color: THEME_COLORS.OTHERS.GRAY, marginLeft: 2, fontSize: 11 }}>
                            {receiveCompanyName}
                        </Text>
                    </View>
                )}
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        width: WINDOW_WIDTH - 20,
                    }}>
                    {isSiteOnThePreviousDay && (
                        <Text
                            style={{
                                backgroundColor: THEME_COLORS.GREEN.LIGHT,
                                marginBottom: 1,
                                marginRight: 2,
                                paddingHorizontal: 3,
                                paddingVertical: 1,
                                ...GlobalStyles.smallText,
                                color: '#000',
                                fontSize: 9,
                                lineHeight: 11,
                                width: tagWidth,
                                textAlign: 'center',
                            }}>
                            前日入場
                        </Text>
                    )}
                    <Text
                        ellipsizeMode={'middle'}
                        numberOfLines={1}
                        style={{
                            ...GlobalStyles.mediumText,
                            lineHeight: 14,
                            fontSize: 12,
                            color: THEME_COLORS.BLUE.MIDDLE_DEEP,
                            maxWidth: WINDOW_WIDTH - tagWidth - 28,
                        }}>
                        {projectName}
                    </Text>
                </View>
                {displayConstructionName !== undefined && (
                    <View
                        style={{
                            marginTop: 5,
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                        <Text ellipsizeMode={'middle'} numberOfLines={1} style={[GlobalStyles.mediumText]}>
                            {displayConstructionName}
                        </Text>
                    </View>
                )}
            </View>
        </ShadowBox>
    )
})
