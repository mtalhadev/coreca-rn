import React, { useState, useRef, useEffect } from 'react'
import { Text, Pressable, View, Image, ViewStyle } from 'react-native'

import { THEME_COLORS } from '../../../utils/Constants'
import { Tag } from '../Tag'
import { WorkerTagType } from '../../../models/worker/WorkerTagType'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

export type WorkerTagProps = {
    type?: WorkerTagType
    fontSize?: number
    hasBorder?: boolean
    style?: ViewStyle
}

export const WorkerTag = React.memo((props: Partial<WorkerTagProps>) => {
    let { type, fontSize, style, hasBorder } = props
    fontSize = fontSize ?? 10
    type = type ?? 'is-mine'
    hasBorder = hasBorder ?? false
    const { t } = useTextTranslation()

    let color = THEME_COLORS.OTHERS.TIMER_SKY_BLUE
    let text: string | undefined = undefined
    let textColor = THEME_COLORS.OTHERS.GRAY
    switch (type) {
        case 'is-mine':
            color = THEME_COLORS.BLUE.MIDDLE
            text = t('common:You')
            textColor = '#fff'
            break
        case 'unregister':
            color = THEME_COLORS.OTHERS.ALERT_RED
            text = t('common:Unregistered')
            textColor = '#fff'
            break
        case 'manager':
            color = THEME_COLORS.OTHERS.SUPER_LIGHT_GRAY
            text = t('common:Administration')
            break
        case 'left-business':
            color = THEME_COLORS.OTHERS.BLACK
            text = t('common:Withdrawal')
            textColor = '#fff'
            break
    }
    if (text == undefined) {
        return <></>
    }
    return (
        <Tag
            style={{ ...style, ...(hasBorder && textColor != '#fff' ? { borderWidth: 1, borderColor: THEME_COLORS.OTHERS.BORDER_COLOR } : {}) }}
            fontSize={fontSize}
            fontColor={textColor}
            color={color}
            tag={text}
        />
    )
})
