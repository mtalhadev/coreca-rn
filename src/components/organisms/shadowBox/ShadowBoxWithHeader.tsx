/* eslint-disable prefer-const */
import React, { PropsWithChildren } from 'react'
import { Text, View, ViewStyle, StyleSheet } from 'react-native'
import { THEME_COLORS } from '../../../utils/Constants'
import { FontStyle } from '../../../utils/Styles'
import { ShadowBox } from './ShadowBox'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
// const {t} = useTextTranslation()

export type ShadowBoxWithHeaderProps = {
    onPress: () => void
    headerColor: string
    titleColor: string
    hasShadow: boolean
    title: string
    style?: ViewStyle
}

export const ShadowBoxWithHeader = React.memo((props: PropsWithChildren<Partial<ShadowBoxWithHeaderProps>>) => {
    let { onPress, style, title, children, hasShadow, headerColor, titleColor } = props
    // import { useTextTranslation } from '../../../fooks/useTextTranslation'
    const {t} = useTextTranslation()
    
    return (
        <ShadowBox
            hasShadow={hasShadow}
            onPress={onPress}
            style={{
                ...style,
            }}
        >
            <View
                style={{
                    backgroundColor: headerColor ?? THEME_COLORS.OTHERS.PURPLE_GRAY,
                    paddingVertical: 5,
                    paddingLeft: 10,
                    borderTopEndRadius: 10,
                    borderTopStartRadius: 10,
                }}
            >
                <Text
                    style={{
                        fontFamily: FontStyle.regular,
                        fontSize: 12,
                        lineHeight: 14,
                        color: titleColor ?? THEME_COLORS.OTHERS.GRAY,
                    }}
                >
                    {title ?? t('common:Title')}
                </Text>
            </View>
            <View
                style={{
                    padding: 10,
                }}
            >
                {children}
            </View>
        </ShadowBox>
    )
})

const styles = StyleSheet.create({})
