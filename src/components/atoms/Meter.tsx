import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { LayoutChangeEvent, View, ViewStyle } from 'react-native'
import { THEME_COLORS } from '../../utils/Constants'
import { useComponentSize } from '../../utils/Utils'
import { setSiteMeterLayoutWidth } from '../../stores/LayoutSlice'
import { StoreType } from '../../stores/Store'

export type MeterProps = {
    color: string
    ratio: number
    completeColor: string
    isGlobalLayoutWidth?: boolean
    style?: ViewStyle
}

export const Meter = React.memo((props: Partial<MeterProps>) => {
    let { color, ratio, completeColor, isGlobalLayoutWidth, style } = props
    const siteMeterLayoutWidth = useSelector((state: StoreType) => state?.layout.siteMeterLayoutWidth)
    const dispatch = useDispatch()
    ratio = ratio ?? 0.5
    color = color ?? THEME_COLORS.OTHERS.ALERT_RED
    completeColor = completeColor ?? THEME_COLORS.OTHERS.GRAY
    const [size, onLayout] = useComponentSize()
    const _viewWidth = size != undefined ? Number(size?.width) * ratio : 0
    const viewWidth = isGlobalLayoutWidth ? (siteMeterLayoutWidth !== undefined ? siteMeterLayoutWidth * ratio : 0) : _viewWidth

    return (
        <View
            onLayout={(event: LayoutChangeEvent) => {
                if (isGlobalLayoutWidth) {
                    if (!siteMeterLayoutWidth) dispatch(setSiteMeterLayoutWidth(event.nativeEvent.layout.width))
                } else {
                    onLayout(event)
                }
            }}
            style={[{}, style]}>
            <View
                style={{
                    backgroundColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                    height: 3,
                    borderRadius: 5,
                }}></View>
            <View
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    maxWidth: isGlobalLayoutWidth ? (siteMeterLayoutWidth !== undefined ? siteMeterLayoutWidth : 100) : size != undefined ? size?.width : 100,
                    width: !isNaN(viewWidth) ? viewWidth : 0,
                    height: 3,
                    borderRadius: 3,
                    backgroundColor: ratio < 1 ? color : completeColor,
                }}></View>
        </View>
    )
})
