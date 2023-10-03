import React from 'react'
import { Pressable, ViewStyle, TextInput, View } from 'react-native'

import { THEME_COLORS } from '../../utils/Constants'
import { ColorStyle, GlobalStyles } from '../../utils/Styles'
import { Icon } from '../atoms/Icon'
export type SearchProps = {
    text?: string
    onChange: (text?: string) => void
    onBlur: () => void
    clearText?: () => void
    color: ColorStyle
    title: string
    placeholder?: string
    style?: ViewStyle
}

export const Search = React.memo((props: Partial<SearchProps>) => {
    const { onChange, onBlur, clearText, text, color, title, placeholder, style } = props
    return (
        <View
            style={{
                borderWidth: 1,
                borderColor: THEME_COLORS.OTHERS.LIGHT_GRAY,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                borderRadius: 20,
                ...style,
            }}>
            <Icon
                style={{
                    marginRight: 6,
                    marginLeft: 10,
                }}
                name={'search'}
                width={16}
                height={16}
                fill={text != undefined && text.length > 0 ? THEME_COLORS.OTHERS.LINK_BLUE : THEME_COLORS.OTHERS.BORDER_COLOR}
            />
            <TextInput
                style={{
                    ...GlobalStyles.smallText,
                    height: 33,
                    flex: 1,
                    paddingTop: 5,
                }}
                textAlignVertical={'center'}
                textContentType={'name'}
                onChangeText={onChange}
                onBlur={onBlur}
                value={text}
                placeholder={placeholder}
                placeholderTextColor={THEME_COLORS.OTHERS.GRAY}
            />
            {clearText && (
                <Pressable
                    style={{
                        marginRight: 10,
                        marginLeft: 5,
                    }}
                    onPress={clearText}>
                    <Icon name={'close'} width={12} height={12} fill={text != undefined && text.length > 0 ? THEME_COLORS.OTHERS.LINK_BLUE : THEME_COLORS.OTHERS.BORDER_COLOR} />
                </Pressable>
            )}
        </View>
    )
})
