import React, { useMemo, useCallback, useRef, useEffect } from 'react'
import { Pressable, Text, View, Animated, Easing } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { isIphoneX } from 'react-native-iphone-screen-helper'

import { BlueColor, ColorStyle, FontStyle, GreenColor } from '../../utils/Styles'
import { IPHONEX_BOTTOM_HEIGHT, WINDOW_WIDTH, BOTTOM_TAB_BASE_HEIGHT, WINDOW_HEIGHT, SCREEN_WIDTH } from '../../utils/Constants'
import { useTextTranslation } from '../../fooks/useTextTranslation'
import { Icon, IconName } from '../atoms/Icon'
import { useSelector } from 'react-redux'
import { StoreType } from '../../stores/Store'
import { match } from 'ts-pattern'

/**
 * ratioのベースとなる高さ。iPhone SE。
 * この形に近づける。
 */

export const BASE_WINDOWS_HEIGHT = 667
export const MENU_HEIGHT = WINDOW_HEIGHT
export const BASE_HEIGHT_RATIO = MENU_HEIGHT / BASE_WINDOWS_HEIGHT

type CustomBottomTabProps = {
    isAfterSignIn: boolean
    isAdmin: boolean
}

const excludingRouteNames = ['Create', 'Edit', 'Add', 'SelectAccount', 'Sign', 'Launch', 'ResetPassword', 'ChatDetail', 'ChatSettings', 'SelectIndividual', 'SelectUsers']

const CustomBottomTab = ({ isAfterSignIn, isAdmin }: CustomBottomTabProps) => {
    const { t } = useTextTranslation()
    const navigation = useNavigation<any>()

    const fadeAnim = useRef(new Animated.Value(0)).current
    const routeName = useSelector((state: StoreType) => state.nav.routeName)
    const isKeyboardOpen = useSelector((state: StoreType) => state.util.isKeyboardOpen)
    const isBottomOff = useSelector((state: StoreType) => state.util.isBottomOff)

    const menuSide = useMemo(() => (isAdmin ? 'admin' : 'worker'), [isAdmin])

    const color = useMemo(
        () =>
            match(menuSide)
                .with('admin', () => BlueColor)
                .with('worker', () => GreenColor)
                .otherwise(() => undefined),
        [menuSide],
    )

    const BOTTOM_TAB_HEIGHT = isIphoneX() ? BOTTOM_TAB_BASE_HEIGHT + IPHONEX_BOTTOM_HEIGHT : BOTTOM_TAB_BASE_HEIGHT
    const BOTTOM_TAB_BOTTOM_MARGIN = isIphoneX() ? IPHONEX_BOTTOM_HEIGHT : 0

    const isDisplayBottomTab = useMemo(() => {
        if (isAfterSignIn && !isKeyboardOpen && routeName && !isBottomOff) {
            const matchedRouteName = excludingRouteNames.filter((name) => routeName.indexOf(name) > -1)
            return matchedRouteName.length === 0
        }
        return false
    }, [routeName, isAfterSignIn, isKeyboardOpen, isBottomOff])

    const fadeIn = useCallback(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
            easing: Easing.ease,
        }).start()
    }, [fadeAnim])

    const fadeOut = useCallback(() => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
            easing: Easing.ease,
        }).start()
    }, [fadeAnim])

    useEffect(() => {
        if (isDisplayBottomTab) {
            fadeIn()
        } else {
            fadeOut()
        }
    }, [isDisplayBottomTab])

    type MenuIconProps = {
        routeName: string
        iconName: IconName
        title: string
        color: ColorStyle
        isFocused: boolean
        iconSize?: number
        menusLength: number
    }

    const MenuIcon = React.memo(({ routeName, iconName, title, color, isFocused, iconSize, menusLength }: MenuIconProps) => {
        iconSize = iconSize ?? 20 * BASE_HEIGHT_RATIO
        iconSize = iconSize * (isFocused ? 5 / 4 : 1)

        return (
            <Pressable
                style={{
                    marginTop: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: SCREEN_WIDTH / menusLength,
                }}
                accessibilityRole={'button'}
                onTouchStart={() => {
                    navigation.navigate(
                        routeName as never,
                        {
                            animation: 'fade',
                        } as never,
                    )
                }}>
                <View
                    style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                    <Icon name={iconName} width={iconSize} height={iconSize} fill={isFocused ? color.menuHighlightColor : color.textColor} />
                    <Text
                        style={{
                            color: isFocused ? color.menuHighlightColor : color.textColor,
                            fontSize: (isFocused ? 7 : 7) * BASE_HEIGHT_RATIO,
                            fontFamily: isFocused ? FontStyle.bold : FontStyle.regular,
                            lineHeight: 20 * BASE_HEIGHT_RATIO + 2,
                        }}>
                        {title}
                    </Text>
                </View>
            </Pressable>
        )
    })

    type MenuInputType = {
        routeName: string
        title: string
        iconName: IconName
        iconSize?: number
    }

    type BottomTabMenuProps = {
        menus: MenuInputType[]
        color: ColorStyle
        routeName?: string
    }

    const BottomTabMenu = ({ menus, color, routeName }: BottomTabMenuProps) => {
        return (
            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'flex-end', marginBottom: BOTTOM_TAB_BOTTOM_MARGIN }}>
                {menus.map((item, index) => (
                    <MenuIcon
                        key={index}
                        routeName={item.routeName}
                        iconName={item.iconName}
                        title={item.title}
                        iconSize={item.iconSize}
                        color={color}
                        isFocused={routeName == item.routeName}
                        menusLength={menus.length}
                    />
                ))}
            </View>
        )
    }

    return (
        <>
            {isDisplayBottomTab && (
                <>
                    <View style={{ width: WINDOW_WIDTH, height: BOTTOM_TAB_HEIGHT }} />
                    {(menuSide != undefined || menuSide != '') && color != undefined && (
                        <Animated.View style={{ position: 'absolute', left: 0, bottom: 0, height: BOTTOM_TAB_HEIGHT, width: WINDOW_WIDTH, backgroundColor: color?.mainColor, opacity: fadeAnim }}>
                            {menuSide === 'admin' && (
                                <BottomTabMenu
                                    routeName={routeName}
                                    color={color}
                                    menus={[
                                        {
                                            routeName: 'AdminHome',
                                            iconName: 'schedule',
                                            title: t('admin:SiteSchedule'),
                                            iconSize: 18 * BASE_HEIGHT_RATIO,
                                        },
                                        {
                                            routeName: 'TransactionListRouter',
                                            iconName: 'transaction',
                                            title: t('admin:Transaction'),
                                            iconSize: 21 * BASE_HEIGHT_RATIO,
                                        },
                                        // {
                                        //     routeName: 'AdminChatListRouter',
                                        //     iconName: 'email',
                                        //     title: t('admin:Chat'),
                                        //     iconSize: 18 * BASE_HEIGHT_RATIO,
                                        // },
                                        {
                                            routeName: 'MySchedule',
                                            iconName: 'schedule',
                                            title: t('admin:MySchedule'),
                                            iconSize: 18 * BASE_HEIGHT_RATIO,
                                        },
                                        {
                                            routeName: 'AdminMyPageRouter',
                                            iconName: 'mypage',
                                            title: t('admin:CompanyPage'),
                                            iconSize: 17 * BASE_HEIGHT_RATIO,
                                        },
                                    ]}
                                />
                            )}
                            {menuSide === 'worker' && (
                                <BottomTabMenu
                                    routeName={routeName}
                                    color={color}
                                    menus={[
                                        {
                                            routeName: 'WorkerHome',
                                            iconName: 'schedule',
                                            title: t('worker:SiteSchedule'),
                                            iconSize: 18 * BASE_HEIGHT_RATIO,
                                        },
                                        // {
                                        //     routeName: 'WorkerChatListRouter',
                                        //     iconName: 'email',
                                        //     title: t('admin:Chat'),
                                        //     iconSize: 18 * BASE_HEIGHT_RATIO,
                                        // },
                                        {
                                            routeName: 'MyPageRouter',
                                            iconName: 'mypage',
                                            title: t('worker:MyPage'),
                                            iconSize: 17 * BASE_HEIGHT_RATIO,
                                        },
                                    ]}
                                />
                            )}
                        </Animated.View>
                    )}
                </>
            )}
        </>
    )
}

export default CustomBottomTab
