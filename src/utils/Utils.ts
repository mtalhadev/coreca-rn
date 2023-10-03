/* eslint-disable no-control-regex */
import { useState, useCallback } from 'react'
import { LayoutChangeEvent, Linking, Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
// import * as DocumentPicker from 'expo-document-picker'
import 'react-native-get-random-values'
import { v4 as uuidv4 } from 'uuid'
import isEmpty from 'lodash/isEmpty'
import random from 'lodash/random'
import repeat from 'lodash/repeat'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import { manipulateAsync, SaveFormat, ImageResult } from 'expo-image-manipulator'
import * as Device from 'expo-device'
import * as Network from 'expo-network'
import * as LinkingExpo from 'expo-linking'
import { getErrorMessage } from '../services/_others/ErrorService'
import { CustomResponse } from '../models/_others/CustomResponse'
import ENV from '../../env/env'
import { FieldValueType, deleteFieldParam } from '../services/firebase/FirestoreService'

export type SwitchEditOrCreateProps = {
    mode: 'new' | 'edit'
}

export type SwitchAdminOrWorkerProps = {
    side: 'admin' | 'worker'
}

export const sleep = (sec: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(resolve, sec)
    })
}

export type Size = { x: number; y: number; width: number; height: number }
export const useComponentSize = (): [Size | undefined, (event: LayoutChangeEvent) => void] => {
    const [size, setSize] = useState<Size | undefined>(undefined)

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        const { x, y, width, height } = event?.nativeEvent?.layout
        setSize({ x: x ?? undefined, y: y ?? undefined, width: width ?? undefined, height: height ?? undefined })
    }, [])

    return [size, onLayout]
}

export const isEmail = (text: string): boolean => {
    const emailReg =
        /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|'(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*')@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
    const match = text.match(emailReg)
    return Boolean(match)
}

export const isPhone = (text: string): boolean => {
    const phoneReg = /^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{2,4})[-. )]*(\d{3,4})[-. ]*(\d{3,4})(?: *x(\d+))?\s*$/
    const match = text.match(phoneReg)
    return Boolean(match)
}

export const isPassword = (text: string): boolean => {
    const passReg = /[A-Za-z\d]{8,}$/
    const match = text.match(passReg)
    return Boolean(match)
}

export const pickImage = async (allowsEditing = true): Promise<ImageInfo | undefined> => {
    if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!')
        }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: allowsEditing,
        base64: true,
        aspect: [4, 3],
        quality: 1,
    })
    return !result.cancelled ? result : undefined
}

export const pickVideo = async (): Promise<ImageInfo | undefined> => {
    if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!')
        }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        base64: true,
        aspect: [4, 3],
        quality: 0.1,
    })
    return !result.cancelled ? result : undefined
}

// export const pickDocument = async (): Promise<DocumentPicker.DocumentResult | undefined> => {
//     const result = await DocumentPicker.getDocumentAsync({
//         copyToCacheDirectory: true,
//         type: 'text/comma-separated-values',
//     })

//     return result
// }

export const getUuidv4 = (): string => {
    return uuidv4()
}

export const getIntervalMinutes = (startDate: number, endDate: number): number => {
    const interval = Math.ceil((endDate - startDate) / 60)
    return interval
}

export const openMapAppFromLatLng = (lat: number, lng: number): void => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' })
    const latLng = `${lat},${lng}`
    const label = '[ラベル名]'
    const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`,
    })
    Linking.openURL(url as string)
}

export const getRandomImageColorHue = () => {
    return random(0, 359)
}
/**
 * @requires
 * - m - mサイズのImageResult。画像情報
 * - s - sサイズのImageResult。画像情報
 * - xs - xsサイズのImageResult。画像情報
 */
type ResizeImageResult = {
    m: ImageResult
    s: ImageResult
    xs: ImageResult
}
/**
 * @remarks 画像サイズを変更する
 * @objective アップロードされた画像を3種類のサイズに変更して、保存するため。
 * @author  Kamiya
 * @param params - {@link ImageInfo}画像情報
 * @returns - {@link ResizeImageResult}
 */
export const resizeImage = async (image: ImageInfo): Promise<ResizeImageResult> => {
    const manipResult = await manipulateAsync(
        image.uri,
        [
            {
                resize:
                    image.height > image.width
                        ? {
                              width: 500,
                          }
                        : {
                              height: 500,
                          },
            },
        ],
        { compress: 1, format: SaveFormat.JPEG },
    )
    const sManipResult = await manipulateAsync(
        image.uri,
        [
            {
                resize:
                    image.height > image.width
                        ? {
                              width: 250,
                          }
                        : {
                              height: 250,
                          },
            },
        ],
        { compress: 1, format: SaveFormat.JPEG },
    )
    const xsManipResult = await manipulateAsync(
        image.uri,
        [
            {
                resize:
                    image.height > image.width
                        ? {
                              width: 125,
                          }
                        : {
                              height: 125,
                          },
            },
        ],
        { compress: 1, format: SaveFormat.JPEG },
    )
    return {
        m: manipResult,
        s: sManipResult,
        xs: xsManipResult,
    }
}

// 副作用のテストに使用。
export const fetchTestModule = async (data: any, time = 500): Promise<CustomResponse<any>> => {
    try {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: data,
                })
            }, time)
        })
    } catch (error) {
        return getErrorMessage(error)
    }
}

export const getUpdateNumber = () => {
    return Number(new Date())
}

export const getExpoHostUrl = async (metroPort: string | undefined) => {
    let rtnUrl = ''
    const ipAddress: string = await Network.getIpAddressAsync()
    const expoHostAndPort: string = LinkingExpo.makeUrl()

    if (Device.isDevice) {
        rtnUrl += expoHostAndPort
    } else {
        rtnUrl += 'coreca://' + ipAddress + ':' + metroPort // + expoHostAndPort.split(':')[2]
    }
    return rtnUrl
}

export const sortByAlphabet = (a?: string, b?: string): number => {
    return a?.localeCompare(b ?? '', undefined, { numeric: true }) ?? 0
}

/**
 *
 * @param object
 * @returns 通常の存在判定に加えて、idがあるという担保のもと、すべてのvalueがundefinedや''、0など存在しない場合にも存在しないと判定する。
 */
export const isNoValueObject = (object?: Record<string, any>): boolean => {
    return Object.keys(object ?? {}).filter((key) => !isEmpty((object ?? {})[key])).length == 0
}

export const getRandomName = (title: string, digit = 5) => {
    return `${title}${(repeat('0', digit) + random(0, 10 ** digit - 1)).slice(-digit)}`
}

export const openInviteUrl = (url: string): void => {
    const functionsUrl = `https://asia-northeast1-${__DEV__ ? ENV.TEST_FIREBASE_CONFIG.projectId : ENV.PROD_FIREBASE_CONFIG.projectId}.cloudfunctions.net/invite-inviteFlow?url=${url.replaceAll(
        '&',
        '%26',
    )}`

    Linking.openURL(functionsUrl)
}

export function getCurrentTimestamp(): number {
    return Date.now()
}

/**
 * @remark 編集画面で入力フィールドをリセットした時、undefinedの場合はDBで対応するフィールを削除する
 */
type StringFieldValueParam = {
    isUpdate?: boolean
    value?: string
}
export const stringFieldValue = (params: StringFieldValueParam): string | FieldValueType | undefined => {
    const { isUpdate, value } = params

    const _value = value?.trim()
    return _value ? _value : isUpdate ? deleteFieldParam() : undefined
}

type NumberFieldValueParam = {
    isUpdate?: boolean
    value?: number
}
export const numberFieldValue = (params: NumberFieldValueParam): number | FieldValueType | undefined => {
    const { isUpdate, value } = params

    return value == undefined ? (isUpdate ? deleteFieldParam() : undefined) : value
}

type ArrayFieldValueParam = {
    isUpdate?: boolean
    value?: any[]
}
export const arrayFieldValue = (params: ArrayFieldValueParam): any[] | FieldValueType | undefined => {
    const { isUpdate, value } = params

    return value == undefined || value?.length == 0 ? (isUpdate ? deleteFieldParam() : undefined) : value
}
