import React, { useState, useRef, useEffect } from 'react'
import { ViewStyle } from 'react-native'
import { THEME_COLORS } from '../../../utils/Constants'
import { Tag } from '../Tag'
import { useTextTranslation } from '../../../fooks/useTextTranslation'

export type PartnershipTagProps = {
    type: 'partner' | 'customer'
    fontSize: number
    style?: ViewStyle
}

export const PartnershipTag = React.memo((props: Partial<PartnershipTagProps>) => {
    let { type, fontSize, style } = props
    fontSize = fontSize ?? 9
    type = type ?? 'partner'
    const { t } = useTextTranslation()

    return <Tag style={style} fontSize={fontSize} fontColor={THEME_COLORS.OTHERS.GRAY} color={THEME_COLORS.OTHERS.SUPER_LIGHT_GRAY} tag={type == 'partner' ? t('common:PartnerCompany') : t('common:CustomerVendor')} />
})
