import React, { useCallback, useMemo, useState } from 'react'
import { View, Image, ViewStyle } from 'react-native'

import { BlueColor, GreenColor } from '../../utils/Styles'
import { THEME_COLORS } from '../../utils/Constants'
import Profile from './../../../assets/images/profile.svg'
import CompanyProfile from './../../../assets/images/companyProfile.svg'
import ProjectProfile from './../../../assets/images/project.svg'
import MaskedView from '@react-native-masked-view/masked-view'
import { match } from 'ts-pattern'

export const BORDER_RATIO = 0.06

export type ImageIconProps = {
    size: number
    imageUri: string | undefined
    borderWidth: number
    imageColorHue: number
    type: 'company' | 'worker' | 'project'
    style?: ViewStyle
    borderRadius: number
    borderColor: string
}

export const imageColorHueToColorValue = (imageColorHue?: number) => (imageColorHue ? `hsl(${imageColorHue <= HUE_DIFF ? imageColorHue + HUE_DIFF : imageColorHue - HUE_DIFF}, 100%, 80%)` : '#fff')
export const imageColorHueToBackFillColorValue = (imageColorHue?: number) => `hsl(${imageColorHue}, 80%, 40%)`
const HUE_DIFF = 5
export const ImageIcon = React.memo((props: Partial<ImageIconProps>) => {
    let { size, imageUri, borderWidth, type, imageColorHue, style, borderRadius, borderColor } = props
    type = type ?? 'company'
    const _size = size ?? 50
    borderRadius = useMemo(
        () =>
            borderRadius ??
            match(type)
                .with('company', () => _size / 2.5)
                .with('project', () => _size / 8)
                .otherwise(() => _size),
        [type],
    )

    borderColor = useMemo(
        () =>
            borderColor ??
            match(type)
                .with('company', () => BlueColor.subColor)
                .with('project', () => THEME_COLORS.OTHERS.BLACK)
                .otherwise(() => GreenColor.subColor),
        [type],
    )
    imageUri = imageUri ?? undefined
    borderWidth = borderWidth ?? Math.floor(_size * BORDER_RATIO)

    const fillColor = useMemo(() => imageColorHueToColorValue(imageColorHue), [imageColorHue])
    const backFillColor = useMemo(() => imageUri ? '#888' : imageColorHueToBackFillColorValue(imageColorHue), [imageColorHue, imageUri])

    return (
        <View
            style={{
                width: _size,
                height: _size,
                backgroundColor: backFillColor,
                borderRadius: borderRadius,
                // androidでのみborderRadiusが効かない現象が発生したため。
                borderTopLeftRadius: borderRadius,
                borderTopRightRadius: borderRadius,
                borderBottomLeftRadius: borderRadius,
                borderBottomRightRadius: borderRadius,

                justifyContent: 'center',
                alignItems: 'center',

                ...style,
            }}>
            <MaskedView
                maskElement={
                    <View
                        style={{
                            backgroundColor: '#000',
                            width: _size,
                            height: _size,

                            borderRadius: borderRadius,
                        }}></View>
                }>
                {imageUri == undefined && (
                    <View style={{}}>
                        {type == 'worker' && <Profile width={_size} height={_size} fill={fillColor} />}
                        {type == 'company' && <CompanyProfile width={_size} height={_size} fill={fillColor} />}
                        {type == 'project' && <ProjectProfile width={_size / 1.5} height={_size / 1.5} fill={fillColor} />}
                    </View>
                )}

                {imageUri != undefined && (
                    <Image
                        style={{
                            width: _size,
                            height: _size,
                        }}
                        resizeMode={'cover'}
                        source={{ uri: imageUri }}
                        testID='ImageIcon-Image'
                    />
                )}
            </MaskedView>

            <View
                style={{
                    width: _size,
                    height: _size,
                    borderRadius: borderRadius,
                    borderWidth,
                    borderColor: borderColor,
                    position: 'absolute',
                }}
                testID='ImageIcon-Border'></View>
        </View>
    )
})
