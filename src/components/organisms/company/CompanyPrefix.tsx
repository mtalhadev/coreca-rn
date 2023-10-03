import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Text, Pressable, View, Image, ViewStyle } from 'react-native'
import { THEME_COLORS } from '../../../utils/Constants'
import { Prefix } from '../Prefix'
import { match } from 'ts-pattern'
import { CompanyPartnershipType } from '../../../models/company/CompanyPartnershipType'

export type CompanyPrefixProps = {
    type: CompanyPartnershipType
    fontSize: number
    style?: ViewStyle
}

export const CompanyPrefix = React.memo((props: Partial<CompanyPrefixProps>) => {
    let { type, fontSize, style } = props
    fontSize = fontSize ?? 10

    const color = useMemo(
        () =>
            match(type)
                .with('my-company', () => THEME_COLORS.BLUE.MIDDLE)
                .with('partner', () => THEME_COLORS.OTHERS.PARTNER_GREEN)
                .with('fake-partner', 'partner', () => THEME_COLORS.OTHERS.GRAY)
                .otherwise(() => THEME_COLORS.OTHERS.BORDER_COLOR),
        [type],
    )

    const text = useMemo(
        () =>
            match(type)
                .with('my-company', () => '自社')
                .with('partner', () => '連')
                //.with('partner', () => '連携済み')
                //.with('fake-partner', () => '仮会社')
                .otherwise(() => '他社'),
        [type],
    )

    const fontColor = useMemo(
        () =>
            match(type)
                .with('my-company', 'fake-partner', 'partner', () => '#fff')
                .otherwise(() => '#000'),
        [type],
    )
    return <>{type != undefined && type != 'fake-partner' && <Prefix style={{ ...style, paddingHorizontal: 8 }} fontSize={fontSize} color={color} fontColor={fontColor} text={text} />}</>
})
