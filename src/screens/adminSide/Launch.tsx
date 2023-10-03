import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useTextTranslation } from './../../fooks/useTextTranslation'
import { Text, View, Button, StyleSheet, Pressable, Image, Alert } from 'react-native'
import { AppButton } from '../../components/atoms/AppButton'
import { IPHONEX_BOTTOM_HEIGHT, IPHONEX_NOTCH_HEIGHT_MAXIMUM_PLUS, THEME_COLORS, WINDOW_HEIGHT, WINDOW_WIDTH } from '../../utils/Constants'
import { ifIphoneX, isIphoneX } from 'react-native-iphone-screen-helper'
import { BlueColor, FontStyle, GlobalStyles, GreenColor } from '../../utils/Styles'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { RootStackParamList } from '../Router'
import { StackNavigationProp } from '@react-navigation/stack'
import { StoreType } from '../../stores/Store'
import { setDeviceTokenToAccount } from '../../usecases/RouteCase'
import { setToastMessage, ToastMessage } from '../../stores/UtilSlice'
import ENV from '../../../env/env'
import { setIsLoggingOff, setSignInUser } from '../../stores/AccountSlice'
import crashlytics from '@react-native-firebase/crashlytics';

type NavProps = StackNavigationProp<RootStackParamList, 'Default'>
type RouteProps = RouteProp<RootStackParamList, 'Default'>

const BOTTOM_IMAGE_HEIGHT = 360 + (isIphoneX() ? IPHONEX_BOTTOM_HEIGHT : 0)
const MAIN_TEXT_TOP_MARGIN = -30
const MAX_IMAGE_WIDTH = WINDOW_WIDTH * 0.9
const IMAGE_HEIGHT = Math.min(WINDOW_HEIGHT - BOTTOM_IMAGE_HEIGHT + MAIN_TEXT_TOP_MARGIN, MAX_IMAGE_WIDTH)

const Launch = () => {
    const navigation = useNavigation<NavProps>()
    const route = useRoute<RouteProps>()
    const signInUser = useSelector((state: StoreType) => state.account.signInUser)
    const isLoggingOff = useSelector((state: StoreType) => state.account.isLoggingOff)
    const checkedSignIn = useSelector((state: StoreType) => state.account.checkedSignIn)
    const [navigated, setNavigated] = useState<boolean>(false)
    const dispatch = useDispatch()

    useLayoutEffect(() => {
        if (isLoggingOff) {
            dispatch(setIsLoggingOff(false))
            dispatch(setSignInUser(undefined))
            return
        }
        if (signInUser && !navigated) {
            ;(async () => {
                await setDeviceTokenToAccount(signInUser.accountId as string)
            })()

            if (signInUser.worker?.companyRole == 'manager' || signInUser.worker?.companyRole == 'owner') {
                navigation.navigate('AdminHome', {
                    animation: 'none',
                })
            } else {
                navigation.navigate('WorkerHome', {
                    animation: 'none',
                })
            }
        }
        return () => {
            setNavigated(true)
        }
    }, [signInUser])

    const { t } = useTextTranslation()

    const displayAlert = useCallback(() => {
        Alert.alert(`${t('admin:AreYouACompanyOwner')}`, '', [
            {
                text: `${t('common:Yes')}`,
                onPress: () => {
                    if (ENV.IS_PLAN_TICKET_AVAILABLE) {
                        navigation.push('AddInviteURL', {})
                    } else {
                        navigation.push('SignUpAccount', {})
                    }
                },
            },
            {
                text: `${t('common:No')}`,
                onPress: () => {
                    dispatch(setToastMessage({ text: `${t('worker:NeedsInvitationURL')}`, type: 'warn' } as ToastMessage))

                    navigation.push('WAddInvitedURL', {})
                },
            },
        ])
    }, [])

    if (!checkedSignIn) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: '#fff',
                }}></View>
        )
    }

    return (
        <View
            style={{
                flex: 1,
                backgroundColor: '#fff',
            }}>
            <View
                style={{
                    flex: 1,
                    ...ifIphoneX(
                        {
                            marginTop: 20 + IPHONEX_NOTCH_HEIGHT_MAXIMUM_PLUS,
                        },
                        {
                            marginTop: 20,
                        },
                    ),
                }}>
                <Image
                    style={{
                        alignSelf: 'flex-end',
                        width: IMAGE_HEIGHT,
                        height: IMAGE_HEIGHT,
                        zIndex: -2,
                    }}
                    resizeMode={'cover'}
                    source={require('./../../../assets/images/launchImage.png')}
                />
                <View
                    style={{
                        marginLeft: 40,
                        marginTop: MAIN_TEXT_TOP_MARGIN,
                    }}>
                    <Text
                        style={{
                            fontFamily: FontStyle.medium,
                            fontSize: 16,
                            lineHeight: 60,
                        }}>
                        <Text
                            style={{
                                fontFamily: FontStyle.black,
                                fontSize: 40,
                            }}>
                            {t('common:Commitment')}
                        </Text>
                        {t('common:OfTheConstructionIndustry')}

                        <Text
                            style={{
                                fontFamily: FontStyle.bold,
                                fontSize: 19,
                            }}>
                            {t('common:ItsAHassle')}
                        </Text>
                    </Text>
                    <View
                        style={{
                            width: 120,
                            height: 10,
                            backgroundColor: THEME_COLORS.GREEN.MIDDLE,
                            left: 120,
                            // position: 'absolute',
                            marginTop: -15,

                            zIndex: -1,
                        }}></View>
                    <Text
                        style={{
                            fontFamily: FontStyle.medium,
                            fontSize: 16,
                            lineHeight: 30,
                        }}>
                        <Text
                            style={{
                                fontFamily: FontStyle.bold,
                                color: THEME_COLORS.BLUE.MIDDLE,
                            }}>
                            CORECA
                        </Text>
                        {t('common:IsASolution')}
                    </Text>
                </View>
            </View>

            <View
                style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                }}>
                <View
                    style={{
                        position: 'absolute',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: WINDOW_WIDTH,

                        ...ifIphoneX(
                            {
                                paddingBottom: 30 + IPHONEX_BOTTOM_HEIGHT,
                            },
                            { paddingBottom: 30 },
                        ),
                    }}>
                    {/* <View
                        style={{
                            flexDirection: 'row',
                        }}
                    >
                        <Text
                            style={{
                                color: BlueColor.textColor,
                                fontFamily: FontStyle.medium,
                                fontSize: 14,
                                lineHeight: 40,
                            }}
                        >
                            基本機能いくら使っても
                            <Text
                                style={{
                                    color: GreenColor.mainColor,
                                    fontFamily: FontStyle.black,
                                    fontSize: 30,
                                }}
                            >
                                0
                            </Text>
                            <Text
                                style={{
                                    color: GreenColor.mainColor,
                                    fontFamily: FontStyle.black,
                                    fontSize: 14,
                                }}
                            >
                                円
                            </Text>
                        </Text>
                        <SurpriseSvg width={30} height={30} fill={'#fff'} />
                    </View> */}
                    <AppButton
                        style={{
                            marginTop: 10,
                            width: WINDOW_WIDTH - 40,
                        }}
                        buttonColor={'#0096E5'}
                        borderWidth={1}
                        borderColor={'#fff'}
                        height={51}
                        fontSize={16}
                        fontFamily={FontStyle.bold}
                        title={t('common:ClickHereForEmployees')}
                        subTitle="Click here to create an account for WORKERS"
                        subTitleTextColor={'#bfbfbf'}
                        onPress={async () => {
                            setNavigated(true)
                            navigation.push('WAddInvitedURL', {})
                        }}
                    />
                    <Text
                        style={{
                            ...GlobalStyles.smallText,
                            color: '#fff',
                            fontSize: 11,
                            marginTop: 10,
                        }}>
                        {t('common:IfYouAreAnEmployeeNotice')}
                    </Text>
                    <AppButton
                        style={{
                            marginTop: 15,
                            width: WINDOW_WIDTH - 40,
                        }}
                        hasShadow={false}
                        buttonColor={'#2F3F48'}
                        borderWidth={1}
                        borderColor={'#707070'}
                        color={BlueColor}
                        fontFamily={FontStyle.regular}
                        title={t('common:CreateNewCompany')}
                        onPress={async () => {
                            setNavigated(true)
                            displayAlert()
                        }}
                    />
                    <AppButton
                        style={{
                            marginTop: 8,
                            width: WINDOW_WIDTH - 40,
                        }}
                        hasShadow={false}
                        buttonColor={'#2F3F48'}
                        borderWidth={1}
                        borderColor={'#707070'}
                        color={BlueColor}
                        fontFamily={FontStyle.regular}
                        title={t('common:Login')}
                        onPress={() => {
                            setNavigated(true)
                            navigation.push('SelectAccount', {})
                        }}
                    />
                </View>
                <Image
                    style={{
                        zIndex: -1,
                        width: WINDOW_WIDTH,
                        height: BOTTOM_IMAGE_HEIGHT,
                    }}
                    resizeMode={'stretch'}
                    source={require('./../../../assets/images/launchBottom.png')}
                />
            </View>
        </View>
    )
}
export default Launch

const styles = StyleSheet.create({})
