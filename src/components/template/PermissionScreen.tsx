import React, { useState, useRef, useEffect } from 'react'
import { Text, Pressable, View, Image, ViewStyle, Linking, Dimensions } from 'react-native'
import { SelectMenuParams } from '../../screens/common/SelectMenu'

import { RootStackParamList } from '../../screens/Router'
import { StackNavigationProp } from '@react-navigation/stack'
type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
import { IPHONEX_NOTCH_HEIGHT_MAXIMUM_PLUS, THEME_COLORS, WINDOW_WIDTH } from '../../utils/Constants'
import { BlueColor, ColorStyle, FontStyle, GlobalStyles, GreenColor } from '../../utils/Styles'
import { Icon, IconName } from '../atoms/Icon'
import { PlusButton } from '../atoms/PlusButton'
import { useComponentSize } from '../../utils/Utils'
import PushImage from './../../../assets/images/pushImage.svg'
import LocateImage from './../../../assets/images/locateImage.svg'
import MaskedView from '@react-native-masked-view/masked-view'
import Cloud from './../../../assets/images/permissionCloud.svg'
import { AppButton } from '../atoms/AppButton'
import { ifIphoneX } from 'react-native-iphone-screen-helper'
import { useTextTranslation } from '../../fooks/useTextTranslation'

export type PermissionScreenProps = {
    style?: ViewStyle
    imageType?: 'push' | 'locate'
    colorStyle?: ColorStyle
    title?: string
    onClose?: () => void
    text?: string
    colorText?: string
    onPress?: () => void
    buttonText?: string
}

export const PermissionScreen = React.memo((props: Partial<PermissionScreenProps>) => {
    let { style, imageType, colorStyle, title, text, onClose, colorText, buttonText, onPress } = props
    let marginTop = 90
    let heightPer = '80%'
    const { height } = Dimensions.get('window')
    if (height <= 700) {
        heightPer = '95%'
        marginTop = 10
    }
    const { t } = useTextTranslation()

    imageType = imageType ?? 'locate'
    colorStyle = colorStyle ?? GreenColor
    title = title ?? t('common:PermissionToShareLocation')
    text = text ?? t('common:TheLocationInformationMustBeShared')
    colorText = colorText ?? t('common:WhenReportingAttendance')
    buttonText = buttonText ?? t('common:Allow')

    return (
        <View
            style={{
                backgroundColor: THEME_COLORS.OTHERS.BLACK,
                height: heightPer,
                borderRadius: 50,
                marginBottom: 90,
                marginTop: marginTop,
                overflow: 'hidden',
            }}>
            <View
                style={
                    {
                        // position: 'absolute',
                    }
                }>
                <Text
                    style={[
                        GlobalStyles.headerText,
                        {
                            position: 'absolute',
                            fontSize: 30,
                            color: colorStyle.textColor,
                            fontFamily: FontStyle.black,
                            lineHeight: 40,
                            zIndex: 1,
                            margin: 20,
                            width: 200,
                            ...ifIphoneX(
                                {
                                    marginTop: 30 + IPHONEX_NOTCH_HEIGHT_MAXIMUM_PLUS,
                                },
                                {
                                    marginTop: 40,
                                },
                            ),
                        },
                    ]}>
                    {title}
                </Text>
                <Cloud fill={colorStyle.mainColor} />
            </View>
            <Pressable
                onPress={onClose}
                style={{
                    padding: 20,
                    position: 'absolute',
                    right: 10,
                    ...ifIphoneX(
                        {
                            top: 10 + IPHONEX_NOTCH_HEIGHT_MAXIMUM_PLUS,
                        },
                        {
                            top: 20,
                        },
                    ),
                }}>
                <Icon name={'close'} width={20} height={20} fill={'#fff'} />
            </Pressable>

            <MaskedView
                style={{
                    ...ifIphoneX(
                        {
                            marginTop: -40,
                        },
                        {
                            marginTop: -60,
                        },
                    ),
                }}
                maskElement={
                    <View
                        style={{
                            borderRadius: 100,
                            backgroundColor: '#fff',
                            width: WINDOW_WIDTH - 40,
                            marginHorizontal: 20,
                            height: WINDOW_WIDTH - 100,
                            alignItems: 'center',
                            justifyContent: 'center',
                            // position: 'absolute'
                        }}></View>
                }>
                <View
                    style={{
                        alignSelf: 'center',
                        borderRadius: 100,
                        backgroundColor: '#fff',
                        width: WINDOW_WIDTH - 40,
                        marginHorizontal: 20,
                        height: WINDOW_WIDTH - 100,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                    {imageType == 'push' && <PushImage width={WINDOW_WIDTH - 100} height={WINDOW_WIDTH - 100} />}
                    {imageType == 'locate' && <LocateImage width={WINDOW_WIDTH - 100} height={WINDOW_WIDTH - 100} />}
                </View>
            </MaskedView>
            <Text
                style={[
                    GlobalStyles.normalText,
                    {
                        color: '#fff',
                        marginHorizontal: 60,
                        marginTop: 20,
                    },
                ]}>
                <Text
                    style={[
                        {
                            color: colorStyle.highLightTextColor,
                            fontFamily: FontStyle.bold,
                            fontSize: 18,
                            lineHeight: 24,
                        },
                    ]}>
                    {colorText}
                </Text>
                {text}
            </Text>
            <AppButton
                title={buttonText}
                color={colorStyle}
                style={{
                    marginTop: 15,
                    marginHorizontal: 20,
                }}
                onPress={onPress}
            />
        </View>
    )
})
