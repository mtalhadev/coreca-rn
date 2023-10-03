import React, { useState } from 'react'
import { Text, Pressable, ViewStyle } from 'react-native'

import { THEME_COLORS } from '../../utils/Constants'
import { ColorStyle, GlobalStyles } from '../../utils/Styles'
import { Icon } from './../atoms/Icon'
import { useComponentSize } from '../../utils/Utils'
import { useNavigation } from '@react-navigation/native'
import { useTextTranslation } from '../../fooks/useTextTranslation'
export type FilterProps = {
    items: string[]
    selectedItems: string[]
    onChange: (items: string[]) => void
    color: ColorStyle
    title: string
    selectNum?: number
    style?: ViewStyle
}

export const Filter = React.memo((props: Partial<FilterProps>) => {
    let { onChange, selectedItems, color, title, items, selectNum, style } = props
    selectedItems = selectedItems ?? []
    const navigation = useNavigation<any>()
    const [size, onLayout] = useComponentSize()
    const [localSelectedItems, setLocalSelectedItems] = useState<string[]>(selectedItems ?? [])
    const { t } = useTextTranslation()

    return (
        <Pressable
            style={[
                {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingBottom: 5,
                    borderBottomWidth: 1,
                    paddingHorizontal: 5,
                    borderColor: THEME_COLORS.OTHERS.GRAY,
                    flex: 1,
                },
                style,
            ]}
            onPress={() => {
                if (navigation) {
                    navigation.push('SelectMenu', {
                        items,
                        initialItems: localSelectedItems,
                        onChange: (_items: string[]) => {
                            setLocalSelectedItems(_items)
                        },
                        title: title ?? t('common:FilterESPCamera'),
                        color,
                        onClose: (_items: string[]) => {
                            if (onChange) {
                                onChange(_items)
                            }
                        },
                        indexes: [],
                        selectNum: selectNum ?? 'any',
                    })
                }
            }}
            onLayout={onLayout}
        >
            <Icon name={'filter'} width={16} height={16} fill={localSelectedItems != undefined && localSelectedItems.length > 0 ? THEME_COLORS.OTHERS.LINK_BLUE : THEME_COLORS.OTHERS.BORDER_COLOR} />
            <Text
                ellipsizeMode={'middle'}
                numberOfLines={1}
                style={{
                    maxWidth: size?.width ? size.width - 30 : undefined,
                    marginLeft: 5,
                }}
            >
                {localSelectedItems != undefined && localSelectedItems.length > 0 && (
                    <Text
                        style={[
                            GlobalStyles.smallText,
                            {
                                marginLeft: 5,
                            },
                        ]}
                    >
                        {localSelectedItems?.sort().join(', ')}
                    </Text>
                )}
                {(localSelectedItems == undefined || localSelectedItems.length == 0) && (
                    <Text
                        numberOfLines={1}
                        ellipsizeMode={'tail'}
                        style={[
                            GlobalStyles.smallGrayText,
                            {
                                marginLeft: 5,
                            },
                        ]}
                    >
                        {t('common:FilterESPCamera')}
                    </Text>
                )}
            </Text>
        </Pressable>
    )
})
