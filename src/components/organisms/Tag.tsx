import React, { useState, useRef, useEffect } from 'react'
import { Text, Pressable, View, Image, ViewStyle } from 'react-native'

import { BlueColor, GreenColor, ColorStyle, GlobalStyles, FontStyle } from '../../utils/Styles'
import Profile from './../../../assets/images/profile.svg'
import CompanyProfile from './../../../assets/images/companyProfile.svg'
import MaskedView from '@react-native-masked-view/masked-view'
import { Icon, IconName } from '../atoms/Icon'
import { THEME_COLORS } from '../../utils/Constants'
import { useTextTranslation } from '../../fooks/useTextTranslation'

export type TagProps = {
    color: string
    fontSize: number
    fontColor: string
    style?: ViewStyle
    iconName: IconName
    tag: string
    ellipsizeMode?: "middle" | "head" | "tail" | "clip"
    numberOfLines?: number
}

export const Tag = React.memo((props: Partial<TagProps>) => {
    const { t } = useTextTranslation()
    let { color, tag, fontSize, fontColor, iconName, ellipsizeMode, numberOfLines, style } = props
    fontSize = fontSize ?? 10
    fontColor = fontColor ?? '#fff'
    tag = tag ?? t('common:Tag')

    return (
        <View
            style={{
                    backgroundColor: color ?? THEME_COLORS.OTHERS.ALERT_RED,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: fontSize * 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    ...style,
            }}
            testID='Tag-View'
        >
            {iconName != undefined && (
                <Icon
                    style={{
                        marginRight: 3,
                    }}
                    name={iconName}
                    fill={fontColor}
                    width={fontSize * 1.2}
                    height={fontSize * 1.2}
                />
            )}

            <Text
                style={{
                    fontFamily: FontStyle.medium,
                    fontSize: fontSize,
                    lineHeight: fontSize + 2,
                    color: fontColor,
                }}
                numberOfLines={numberOfLines}
                ellipsizeMode={ellipsizeMode}
                testID='Tag-Text'
            >
                {tag}
            </Text>
        </View>
    )
})
