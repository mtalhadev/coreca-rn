import React, { PropsWithChildren } from 'react'
import { Text, Pressable, View, ViewStyle, TextStyle } from 'react-native'

import { FontStyle } from '../../utils/Styles'
import isEmpty from 'lodash/isEmpty'

import { Icon } from './Icon'
import { THEME_COLORS } from '../../utils/Constants'
import { useTextTranslation } from '../../fooks/useTextTranslation'

export type ColumnBoxProps = {
    onPress: () => void
    title: string
    content: string
    hasContent: boolean
    link: () => void
    icon: () => JSX.Element
    textStyle?: TextStyle
    style?: ViewStyle
}

export const ColumnBox = React.memo((props: PropsWithChildren<Partial<ColumnBoxProps>>) => {
    const { t } = useTextTranslation()

    let { onPress, title, content, textStyle, icon, style, hasContent, link, children } = props
    hasContent = hasContent ?? true
    return (
        <Pressable
            disabled={onPress == undefined}
            onPress={() => {
                if (onPress) {
                    onPress()
                }
            }}
            style={({ pressed }) => [
                {
                    backgroundColor: '#fff',
                    paddingVertical: 15,
                    opacity: onPress != undefined && pressed ? 0.5 : 1,
                    marginBottom: -1,
                    paddingHorizontal: 15,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: content == undefined && onPress == undefined ? 'center' : 'space-between',
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                },
                style,
            ]}
        >
            <Text
                style={{
                    fontSize: 12,
                    lineHeight: 14,
                    fontFamily: FontStyle.regular,
                    flex: 1,
                    paddingRight: 10,
                    ...textStyle
                }}
            >
                {title}
            </Text>
            {hasContent == true && (
                <View
                    style={{
                        flex: 2,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    {link == undefined && (
                        <View
                            style={{
                                paddingRight: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            {icon != undefined && (
                                <View
                                    style={{
                                        marginRight: 5,
                                    }}
                                >
                                    {icon()}
                                </View>
                            )}
                            <Text
                                style={{
                                    fontSize: 12,
                                    lineHeight: 14,
                                    color: content != undefined ? '#000' : THEME_COLORS.OTHERS.LIGHT_GRAY,
                                    fontFamily: FontStyle.regular,
                                }}
                            >
                                {isEmpty(content) ? t('common:NotYetEntered') : content}
                            </Text>
                        </View>
                    )}
                    {link != undefined && (
                        <Pressable
                            style={({ pressed }) => ({
                                paddingRight: 10,
                                opacity: pressed ? 0.5 : 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                            })}
                            disabled={link == undefined}
                            onPress={() => {
                                if (link) {
                                    link()
                                }
                            }}
                        >
                            {icon != undefined && (
                                <View
                                    style={{
                                        marginRight: 5,
                                    }}
                                >
                                    {icon()}
                                </View>
                            )}
                            <Text
                                style={{
                                    fontSize: 12,
                                    lineHeight: 14,
                                    color: content != undefined ? THEME_COLORS.OTHERS.LINK_BLUE : THEME_COLORS.OTHERS.LIGHT_GRAY,
                                    textDecorationLine: content != undefined ? 'underline' : 'none',
                                    fontFamily: FontStyle.regular,
                                }}
                            >
                                {isEmpty(content) ? t('common:NotYetEntered') : content}
                            </Text>
                        </Pressable>
                    )}
                </View>
            )}

            {onPress != undefined && (
                <View
                    style={{
                        width: 10,
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                    }}
                >
                    <Icon
                        name={'back'}
                        fill={THEME_COLORS.OTHERS.GRAY}
                        width={16}
                        height={16}
                        style={{
                            transform: [
                                {
                                    scaleX: -1,
                                },
                            ],
                        }}
                    />
                </View>
            )}
        </Pressable>
    )
})
