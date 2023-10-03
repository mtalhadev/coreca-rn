import { StyleSheet } from 'react-native'
import { THEME_COLORS } from './Constants'

export const FontStyle = {
    thin: 'NotoSansJP_100Thin',
    light: 'NotoSansJP_300Light',
    regular: 'NotoSansJP_400Regular',
    medium: 'NotoSansJP_500Medium',
    bold: 'NotoSansJP_700Bold',
    black: 'NotoSansJP_900Black',
}

export const GlobalStyles = StyleSheet.create({
    normalText: {
        fontSize: 14,
        fontFamily: FontStyle.regular,
        lineHeight: 16,
    },
    headerText: {
        fontSize: 20,
        fontFamily: FontStyle.bold,
        lineHeight: 22,
    },
    mediumText: {
        fontSize: 13,
        fontFamily: FontStyle.medium,
        lineHeight: 15,
    },
    boldText: {
        fontSize: 14,
        fontFamily: FontStyle.bold,
        lineHeight: 16,
    },
    smallText: {
        fontSize: 12,
        fontFamily: FontStyle.regular,
        lineHeight: 14,
    },
    smallGrayText: {
        fontSize: 12,
        fontFamily: FontStyle.regular,
        lineHeight: 14,
        color: THEME_COLORS.OTHERS.GRAY,
    },
})

export type ColorStyle = {
    mainColor: string
    subColor: string
    deepColor: string
    lightColor: string
    textColor: string
    deepTextColor: string
    highLightColor: string
    focusColor: string
    highLightTextColor: string
    menuHighlightColor: string
    anotherColorStyle: ColorStyle | undefined
}

export const BlueColor: ColorStyle = {
    mainColor: THEME_COLORS.BLUE.MIDDLE,
    subColor: THEME_COLORS.BLUE.MIDDLE_DEEP,
    deepColor: THEME_COLORS.BLUE.SUPER_DEEP,
    lightColor: THEME_COLORS.BLUE.SUPER_LIGHT,
    textColor: '#fff',
    deepTextColor: THEME_COLORS.BLUE.MIDDLE_DEEP,
    highLightColor: THEME_COLORS.BLUE.HIGH_LIGHT,
    focusColor: THEME_COLORS.BLUE.SUPER_DEEP,
    highLightTextColor: THEME_COLORS.BLUE.LIGHT,
    menuHighlightColor: THEME_COLORS.GREEN.LIGHT,
    anotherColorStyle: undefined,
}

export const GreenColor: ColorStyle = {
    mainColor: THEME_COLORS.GREEN.LIGHT,
    subColor: THEME_COLORS.GREEN.MIDDLE,
    deepColor: THEME_COLORS.GREEN.SUPER_DEEP,
    lightColor: THEME_COLORS.GREEN.SUPER_LIGHT,
    textColor: '#000',
    deepTextColor: THEME_COLORS.GREEN.DEEP,
    highLightColor: '#fff',
    focusColor: '#fff',
    highLightTextColor: THEME_COLORS.GREEN.MIDDLE,
    menuHighlightColor: THEME_COLORS.BLUE.LIGHT,
    anotherColorStyle: BlueColor,
}
BlueColor.anotherColorStyle = GreenColor
