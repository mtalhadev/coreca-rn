/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { PropsWithChildren } from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { BlueColor, ColorStyle, FontStyle } from '../../utils/Styles'
import { THEME_COLORS } from '../../utils/Constants'
import CheckSvg from './../../../assets/images/check.svg'
import BadSvg from './../../../assets/images/bad.svg'
import { useTextTranslation } from '../../fooks/useTextTranslation'

export type ValidType = 'good' | 'bad' | 'none'

export type InputBoxProps = {
    title: string
    color: ColorStyle
    borderWidth: number
    height: number
    infoText: string
    disable: boolean
    required: boolean
    valid: ValidType
    isList: boolean
    style?: ViewStyle
}

export const MULTILINE_HEIGHT_MULTIPLE = 2

export const InputBox = React.memo((props: PropsWithChildren<Partial<InputBoxProps>>) => {
    const { t } = useTextTranslation()
    let { children, color, borderWidth, height, title, infoText, disable, required, valid, isList, style } = props
    title = title ?? t('common:Title')
    color = color ?? BlueColor
    borderWidth = borderWidth ?? 2
    height = height ?? 50
    disable = disable ?? false
    valid = valid ?? 'none'
    required = required ?? false
    isList = isList ?? false

    return (
        <View style={[style]}>
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginHorizontal: 20,
                }}
            >
                {!isList &&
                    <Text
                        style={{
                            fontFamily: FontStyle.regular,
                            color: disable ? THEME_COLORS.OTHERS.GRAY : color.deepTextColor,
                            fontSize: 12,
                            lineHeight: 15,
                        }}
                    >
                        {title} {required ? '' : `(${t('common:Any')})`}
                    </Text>
                }
                {valid == 'good' && (
                    <CheckSvg
                        style={{
                            marginBottom: 5,
                            marginLeft: 5,
                        }}
                        width={15}
                        height={15}
                        fill={'limegreen'}
                    />
                )}
                {valid == 'bad' && (
                    <BadSvg
                        style={{
                            marginBottom: 5,
                            marginLeft: 5,
                        }}
                        width={15}
                        height={15}
                        fill={'red'}
                    />
                )}
            </View>
            <View
                style={{
                    height: height,
                    marginTop: isList ? 0 : 5,
                    borderColor: disable ? THEME_COLORS.OTHERS.GRAY : color?.deepTextColor,
                    borderTopWidth: isList ? 0 : borderWidth,
                    borderBottomWidth: borderWidth,
                    marginHorizontal: -borderWidth,
                    paddingHorizontal: 20,
                    justifyContent: 'center',
                    backgroundColor: disable ? THEME_COLORS.OTHERS.BACKGROUND : '#fff',
                }}
            >
                {children}
            </View>
            {infoText && (
                <Text
                    style={{
                        marginTop: 5,
                        marginHorizontal: 20,
                        fontFamily: FontStyle.light,
                        color: '#606060',
                        fontSize: 10,
                        lineHeight: 14,
                    }}
                >
                    {infoText}
                </Text>
            )}
        </View>
    )
})
