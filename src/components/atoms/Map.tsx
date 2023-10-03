import React, { useState, useEffect } from 'react'
import { Text, Pressable, View, ViewStyle, Linking } from 'react-native'

import { GlobalStyles, FontStyle } from '../../utils/Styles'
import MapView, { LatLng, Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { THEME_COLORS, WINDOW_WIDTH } from '../../utils/Constants'
import { Icon } from './Icon'
import { _getLocationInfoFromAddress } from '../../services/_others/GoogleMapApiService'
import { getCurrentLocation } from '../../services/_others/LocationService'
import { LocationInfoType } from '../../models/_others/LocationInfoType'
import { match } from 'ts-pattern'
import AnimatedLottieView from 'lottie-react-native'
import { useTextTranslation } from '../../fooks/useTextTranslation'

export const BORDER_RATIO = 0.04

export type MapDisplayType = 'currentLocation' | 'editableCurrentLocation' | 'addressMap'

export type MapProps = {
    width?: number
    height?: number
    location?: LocationInfoType
    /**
     * currentLocation - 現在地の取得表示
     * addressMap - テキスト住所から所在地を取得表示。
     */
    mapType: MapDisplayType
    onLocationChange?: (location?: LocationInfoType) => void
    style?: ViewStyle
    forceUpdate?: number
}

const DEFAULT_LOCATION_DELTA = {
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
}

/**
 *
 * @param props
 * @returns
 */
export const Map = (props: MapProps) => {
    let { width, height, location, mapType, onLocationChange, style, forceUpdate } = props
    const { t } = useTextTranslation()

    height = height ?? 100
    const [locationNow, setLocationNow] = useState<LocationInfoType | undefined>(location ?? DEFAULT_LOCATION_DELTA)
    const [loading, setLoading] = useState(false)

    const [animation, setAnimation] = useState<AnimatedLottieView | undefined>(undefined)

    useEffect(() => {
        if (mapType == 'currentLocation') {
            setLocationNow(location)
        }
    }, [location])

    useEffect(() => {
        if (animation) {
            animation.play()
        }

        return () => {
            if (animation) {
                animation.pause()
            }
        }
    }, [animation])

    useEffect(() => {
        /**
         * 文字住所の場合はそこから緯度経度を取得。
         */
        if (mapType == 'addressMap') {
            ;(async () => {
                await __getLocationFromAddress()
            })()
        } else if (mapType == 'editableCurrentLocation') {
            ;(async () => {
                await __getCurrentLocation()
            })()
        }
    }, [])

    const hasProperLocation = locationNow?.latitude != undefined && locationNow?.longitude != undefined
    const errorText = match(mapType)
        .with('editableCurrentLocation', () => '現在地を取得できません。')
        .with('currentLocation', () => '報告時の位置情報がありません。')
        .with('addressMap', () => '所在地が表示できません。')
        .otherwise(() => 'その他の不具合発生')

    const __getLocationFromAddress = async () => {
        try {
            const sub = setTimeout(() => {
                if (loading) {
                    setLoading(false)
                }
            }, 20000)
            setLoading(true)
            const _location = await _getLocationInfoFromAddress(locationNow?.address ?? '')
            setLoading(false)
            clearTimeout(sub)
            const newLocation = {
                ...locationNow,
                latitude: _location.lat,
                longitude: _location.lng,
            } as LocationInfoType
            setLocationNow(newLocation)
            if (onLocationChange) {
                onLocationChange(newLocation)
            }
        } catch (error) {
            const newLocation = {
                ...locationNow,
                latitude: undefined,
                longitude: undefined,
            } as LocationInfoType
            setLoading(false)
            setLocationNow(newLocation)
            if (onLocationChange) {
                onLocationChange(newLocation)
            }
        }
    }

    const __getCurrentLocation = async () => {
        try {
            const sub = setTimeout(() => {
                if (loading) {
                    setLoading(false)
                }
            }, 20000)
            setLoading(true)
            const __location = await getCurrentLocation()
            setLoading(false)
            clearTimeout(sub)
            const newLocation = {
                ...locationNow,
                latitude: __location.success?.coords.latitude,
                longitude: __location.success?.coords.longitude,
            }
            setLocationNow(newLocation)
            if (onLocationChange) {
                onLocationChange(newLocation)
            }
        } catch {
            setLoading(false)
            const newLocation = {
                ...locationNow,
                latitude: undefined,
                longitude: undefined,
            }
            setLocationNow(newLocation)
            if (onLocationChange) {
                onLocationChange(newLocation)
            }
        }
    }

    useEffect(() => {
        if (forceUpdate != undefined) {
            __getCurrentLocation()
        }
    }, [forceUpdate])

    return (
        <View
            style={[
                {
                    flex: 1,
                    width,
                    borderWidth: 1,
                    borderRadius: 2,
                    borderColor: THEME_COLORS.OTHERS.BORDER_COLOR,
                    height: height,
                    backgroundColor: THEME_COLORS.OTHERS.BLACK,
                },
                style,
            ]}>
            {hasProperLocation && (
                <MapView
                    style={{
                        width,
                        height: height,
                    }}
                    provider={PROVIDER_GOOGLE}
                    loadingEnabled={loading}
                    scrollEnabled={false}
                    rotateEnabled={false}
                    zoomEnabled={false}
                    initialRegion={{
                        latitude: locationNow?.latitude ?? 0,
                        longitude: locationNow.longitude ?? 0,
                        latitudeDelta: locationNow.latitudeDelta ?? 0.01,
                        longitudeDelta: locationNow.longitudeDelta ?? 0.01,
                    }}
                    region={{
                        latitude: locationNow?.latitude ?? 0,
                        longitude: locationNow.longitude ?? 0,
                        latitudeDelta: locationNow.latitudeDelta ?? 0.01,
                        longitudeDelta: locationNow.longitudeDelta ?? 0.01,
                    }}
                    liteMode={true}>
                    <Marker
                        coordinate={
                            {
                                latitude: locationNow?.latitude,
                                longitude: locationNow?.longitude,
                            } as LatLng
                        }
                    />
                </MapView>
            )}
            {/* 位置情報が不完全でローディングしていない場合の表示 */}
            {!hasProperLocation && !loading && (
                <View
                    style={{
                        width,
                        height: height,
                        borderRadius: 2,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}>
                        <View
                            style={{
                                padding: 5,
                                borderRadius: 100,
                                backgroundColor: THEME_COLORS.OTHERS.ALERT_RED,
                            }}>
                            <Icon name={'close'} fill={'#fff'} width={12} height={12} />
                        </View>
                        <Text
                            style={[
                                GlobalStyles.mediumText,
                                {
                                    marginLeft: 5,
                                    color: '#fff',
                                    fontSize: 14,
                                },
                            ]}>
                            {errorText}
                        </Text>
                    </View>
                    {mapType == 'editableCurrentLocation' && (
                        <Text
                            style={[
                                GlobalStyles.smallGrayText,
                                {
                                    marginLeft: 5,
                                    fontSize: 11,
                                    color: '#fff',
                                    marginTop: 3,
                                },
                            ]}>
                            {t('common:TheImprintingMayBeInvalidated')}
                        </Text>
                    )}
                </View>
            )}

            {/* 位置情報が完全でテキスト住所タイプの場合の表示 */}
            {mapType == 'addressMap' && hasProperLocation && (
                <Pressable
                    style={{
                        alignItems: 'flex-end',
                        position: 'absolute',
                        zIndex: 1,
                        right: 0,
                        bottom: 0,
                        backgroundColor: '#fff',
                        padding: 5,
                        paddingHorizontal: 8,
                    }}
                    onPress={() => {
                        /**
                         * Googleマップを開く。
                         */
                        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${locationNow.latitude}%2C${locationNow.longitude}`)
                    }}>
                    <Text
                        style={{
                            fontFamily: FontStyle.regular,
                            fontSize: 11,
                            lineHeight: 13,
                            color: THEME_COLORS.OTHERS.LINK_BLUE,
                        }}>
                        Google Map{t('common:OpenWith')}
                    </Text>
                </Pressable>
            )}
            {/* 現在地タイプの場合の表示 */}
            {mapType == 'editableCurrentLocation' && (
                <Pressable
                    style={{
                        alignItems: 'center',
                        position: 'absolute',
                        borderWidth: 1,
                        borderColor: '#fff',
                        zIndex: 1,
                        right: 5,
                        borderRadius: 100,
                        bottom: 5,
                        flexDirection: 'row',
                        backgroundColor: loading ? THEME_COLORS.OTHERS.BLACK : THEME_COLORS.GREEN.MIDDLE,

                        padding: 5,
                        paddingHorizontal: 8,
                    }}
                    onPress={async () => {
                        if (!loading) {
                            await __getCurrentLocation()
                        }
                    }}>
                    {!loading && <Icon name={'reload'} width={18} height={18} fill={'#000'} />}
                    <Text
                        style={{
                            marginLeft: 5,
                            fontFamily: FontStyle.regular,
                            fontSize: 11,
                            lineHeight: 13,
                            color: loading ? '#fff' : '#000',
                        }}>
                        {loading ? '取得中...' : '再取得'}
                    </Text>
                </Pressable>
            )}
            {loading && (
                <View
                    style={{
                        width,
                        height: height,
                        zIndex: 1,
                        position: 'absolute',
                        alignSelf: 'center',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                    <AnimatedLottieView
                        ref={(anim) => {
                            setAnimation(anim ?? undefined)
                        }}
                        style={{
                            width: WINDOW_WIDTH / 10,
                            height: WINDOW_WIDTH / 10,
                        }}
                        source={require('./../../../assets/animations/loading.json')}
                    />
                </View>
            )}
        </View>
    )
}
