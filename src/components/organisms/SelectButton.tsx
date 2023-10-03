import isEqual from 'lodash/isEqual'
import React, { useState, useEffect, useMemo } from 'react'
import { Text, Pressable, View, ViewStyle, FlatList } from 'react-native'
import { useTextTranslation } from '../../fooks/useTextTranslation'

import { THEME_COLORS } from '../../utils/Constants'
import { BlueColor, ColorStyle, GlobalStyles } from '../../utils/Styles'
import { getUuidv4 } from '../../utils/Utils'
import { useDispatch, useSelector } from 'react-redux'
import { StoreType } from '../../stores/Store'
import { setSwitchLayoutWidth } from '../../stores/LayoutSlice'
export type SelectButtonProps = {
    items: readonly string[]
    selected: string
    onChangeItem: (item: string) => void
    color?: ColorStyle
    height?: number
    fontSize?: number
    isGlobalLayoutWidth?: boolean
    style?: ViewStyle
}

export const SelectButton = React.memo((props: Partial<SelectButtonProps>) => {
    const globalLayoutWidth = useSelector((state: StoreType) => state?.layout.switchLayoutWidth)
    const dispatch = useDispatch()
    const { t } = useTextTranslation()
    let { onChangeItem, items, fontSize, height, selected, color, isGlobalLayoutWidth, style } = props
    items = items ?? [t('common:Option1'), t('common:Option2'), t('common:Option3')]
    color = color ?? BlueColor
    height = height ?? 25
    fontSize = fontSize ?? 12
    const [localItems, setLocalItems] = useState<readonly string[]>(items ?? [])
    const [layoutWidth, setLayoutWidth] = useState<number>()
    const borderRadius = height
    const listKey = useMemo(() => getUuidv4(), [])

    useEffect(() => {
        if (isEqual(items, localItems)) {
            return
        }
        setLocalItems(items ?? [])
    }, [items])

    const width = isGlobalLayoutWidth ? globalLayoutWidth : layoutWidth

    return (
        <FlatList
            style={{
                height,
                ...style,
            }}
            listKey={listKey}
            onLayout={(event) => {
                if (isGlobalLayoutWidth) {
                    // カレンダー画面でレンダリングごとのスイッチの点滅をふせぐため
                    if (!globalLayoutWidth) dispatch(setSwitchLayoutWidth(event.nativeEvent.layout.width))
                } else {
                    if (event.nativeEvent.layout.width != layoutWidth) setLayoutWidth(event.nativeEvent.layout.width)
                }
            }}
            scrollEnabled={false}
            data={items}
            horizontal
            renderItem={({ item, index }) => {
                const isSelected = item == selected
                return (
                    <Pressable
                        style={{
                            borderWidth: 1,
                            borderLeftWidth: index == 0 ? 1 : 0,
                            height,
                            flex: 1,
                            borderRightWidth: index == localItems.length - 1 ? 1 : 0,
                            borderTopLeftRadius: index == 0 ? borderRadius : 0,
                            borderBottomLeftRadius: index == 0 ? borderRadius : 0,
                            borderTopRightRadius: index == localItems.length - 1 ? borderRadius : 0,
                            borderBottomRightRadius: index == localItems.length - 1 ? borderRadius : 0,
                            borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                            backgroundColor: THEME_COLORS.OTHERS.BACKGROUND,
                            justifyContent: 'center',
                            width: width && localItems.length > 0 ? width / localItems.length : 0,
                            alignItems: 'center',
                        }}
                        key={index}
                        onPress={() => {
                            if (item != selected) {
                                if (onChangeItem) {
                                    onChangeItem(item)
                                }
                            }
                        }}>
                        {isSelected && (
                            <View
                                style={{
                                    flex: 1,
                                    borderWidth: 0,
                                    alignSelf: 'center',
                                    position: 'absolute',
                                    backgroundColor: color?.mainColor,
                                    zIndex: 1,
                                    width: width && localItems.length > 0 ? width / localItems.length : 0,
                                    height,
                                    borderRadius: borderRadius,
                                }}></View>
                        )}

                        <Text
                            style={[
                                GlobalStyles.smallText,
                                {
                                    color: isSelected ? color?.textColor : THEME_COLORS.OTHERS.GRAY,
                                    zIndex: 2,
                                    elevation: 10,
                                    ...(fontSize != undefined
                                        ? {
                                              fontSize: fontSize,
                                              lineHeight: fontSize + 2,
                                          }
                                        : {}),
                                },
                            ]}>
                            {item}
                        </Text>
                    </Pressable>
                )
            }}
        />
    )
})
