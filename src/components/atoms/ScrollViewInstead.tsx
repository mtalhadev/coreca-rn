import React, { PropsWithChildren, useMemo } from 'react'
import { ViewStyle, FlatList, View } from 'react-native'
import { getUuidv4 } from '../../utils/Utils'

export type ScrollViewInsteadProps = {
    style?: ViewStyle
}

/**
 * 通常のScrollViewだと以下のエラーを発生させるので代替として使用する。
 * VirtualizedLists should never be nested inside plain ScrollViews with the same orientation because it can break windowing and other functionality - use another VirtualizedList-backed container instead.
 */
export const ScrollViewInstead = (props: PropsWithChildren<ScrollViewInsteadProps>) => {
    const { children, style } = props
    const listKey = useMemo(() => getUuidv4(), [])
    return (
        <FlatList
            listKey={listKey}
            data={undefined}
            style={{
                flex: 1,
                ...style,
            }}
            renderItem={undefined}
            ListHeaderComponentStyle={{
                flex: 1,
            }}
            ListHeaderComponent={() => <>{children}</>}
        />
    )
}
