/* eslint-disable indent */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { Text, Pressable, View, Image, ViewStyle, Animated, Easing, TextInput, StyleSheet, FlatList, InteractionManager } from 'react-native'
import { useDispatch } from 'react-redux'
import { BlueColor, GreenColor, ColorStyle, GlobalStyles, FontStyle } from '../../utils/Styles'
import { IPHONEX_NOTCH_HEIGHT_MAXIMUM_PLUS, THEME_COLORS, WINDOW_WIDTH } from '../../utils/Constants'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import { DecideButton } from '../../components/atoms/DecideButton'
import { ifIphoneX } from 'react-native-iphone-screen-helper'
import { RootStackParamList } from './../Router'
import CheckSvg from './../../../assets/images/check.svg'
import { EmptyScreen } from '../../components/template/EmptyScreen'
import { getUuidv4 } from '../../utils/Utils'
import { useTextTranslation } from './../../fooks/useTextTranslation'

export type SelectMenuParams = {
    color?: ColorStyle
    items?: string[]
    initialItems?: string[]
    title?: string
    onChange?: (items: string[]) => void
    onClose?: (items: string[]) => void
    selectNum?: number | 'any'
    minNum?: number
}

type NavProps = StackNavigationProp<RootStackParamList, 'SelectMenu'>
type RouteProps = RouteProp<RootStackParamList, 'SelectMenu'>
const SelectMenu = () => {
    const { t } = useTextTranslation()
    const route = useRoute<RouteProps>()
    const params = route.params as SelectMenuParams
    const dispatch = useDispatch()
    const navigation = useNavigation<NavProps>()
    const items = params?.items ?? []
    const color = params?.color ?? BlueColor
    const initialItems = params?.initialItems ?? []
    const title = params?.title ?? '選択'
    const selectNum = params?.selectNum ?? 1
    const minNum = params?.minNum ?? 0
    const onChange = params?.onChange
    const onClose = params?.onClose
    const [selectedItems, setSelectedItems] = useState<string[]>(initialItems)

    const selectedNumNow = selectedItems?.length ?? 0
    const valid = selectedNumNow >= 1 && ((selectNum == 'any' && selectedNumNow >= minNum) || selectNum == selectedNumNow)
    const _selectNumText = selectNum == 'any' ? `複数選択してください（${minNum}個以上）` : `${selectNum}つ選択してください${!valid ? `（あと${selectNum - (selectedItems?.length ?? 0)}つ）` : ''}`
    const listKey = useMemo(() => getUuidv4(), [])

    const routes = navigation.getState()?.routes
    const prevRouteName = routes[routes.length - 2]?.name

    return (
        <View
            style={{
                flex: 1,
            }}>
            <View
                style={{
                    backgroundColor: color.mainColor,
                    flexDirection: 'column',
                    paddingHorizontal: 20,
                    paddingBottom: 15,
                    ...ifIphoneX(
                        {
                            paddingTop: 50 + IPHONEX_NOTCH_HEIGHT_MAXIMUM_PLUS,
                        },
                        {
                            paddingTop: 50,
                        },
                    ),
                }}>
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                    <Text
                        style={{
                            fontFamily: FontStyle.bold,
                            fontSize: 16,
                            color: color.textColor,
                            lineHeight: 20,
                        }}>
                        {title}
                    </Text>
                    <Pressable
                        onPress={() => {
                            if (onClose) {
                                onClose(selectedItems)
                            }
                            navigation.goBack()
                        }}>
                        <DecideButton label="OK" color={color.mainColor} backgroundColor="#fff" />
                    </Pressable>
                </View>

                <View
                    style={{
                        marginTop: 10,
                        flexDirection: 'row',
                    }}>
                    <Text
                        style={{
                            color: color.textColor,
                            fontFamily: FontStyle.regular,
                            lineHeight: 17,
                            fontSize: 13,
                        }}>
                        {_selectNumText}
                    </Text>
                    {valid && (
                        <CheckSvg
                            style={{
                                marginLeft: 5,
                            }}
                            width={15}
                            height={15}
                            fill={'#8DD31C'}
                        />
                    )}
                </View>
            </View>

            <FlatList
                listKey={listKey}
                data={items}
                ListEmptyComponent={() => <EmptyScreen text={t('common:ThereIsNoChoice')} />}
                renderItem={({ item, index }) => {
                    const selected = selectedItems?.includes(item)
                    return (
                        <>
                            <Pressable
                                style={{
                                    borderWidth: 1,
                                    borderColor: selected ? color.subColor : THEME_COLORS.OTHERS.BORDER_COLOR,
                                    backgroundColor: '#fff',
                                    paddingHorizontal: 20,
                                    paddingVertical: 20,
                                    marginTop: 15,
                                    marginHorizontal: 10,
                                    borderRadius: 10,
                                    marginBottom: (prevRouteName === 'AddMyWorker' || prevRouteName === 'EditCompanyRole') && item === '管理者' ? 0 : index === items.length - 1 ? 100 : 0,
                                }}
                                onPress={() => {
                                    let selectedItemsChanged = selectedItems
                                    if (selectNum == 'any') {
                                        if (selected) {
                                            selectedItemsChanged = selectedItems.filter((_item) => _item !== item)
                                            setSelectedItems(selectedItemsChanged)
                                        } else {
                                            selectedItemsChanged = [item, ...selectedItems]
                                            setSelectedItems(selectedItemsChanged)
                                        }
                                    } else if (selectNum == 1) {
                                        selectedItemsChanged = [item]
                                        setSelectedItems(selectedItemsChanged)
                                    } else if (selectNum >= 2) {
                                        if (selected) {
                                            selectedItemsChanged = selectedItems.filter((_item) => _item !== item)
                                            setSelectedItems(selectedItemsChanged)
                                        } else if (selectedItems.length < selectNum) {
                                            selectedItemsChanged = [item, ...selectedItems]
                                            setSelectedItems(selectedItemsChanged)
                                        }
                                    }
                                    if (onChange) {
                                        onChange(selectedItemsChanged)
                                    }
                                }}
                                key={item}>
                                <Text
                                    style={{
                                        color: selected ? color.subColor : '#666',
                                        fontFamily: selected ? FontStyle.medium : FontStyle.regular,
                                        lineHeight: 20,
                                    }}>
                                    {item}
                                </Text>
                            </Pressable>

                            {(prevRouteName === 'AddMyWorker' || prevRouteName === 'EditCompanyRole') && item === '一般作業員' && (
                                <Text style={{ ...GlobalStyles.smallGrayText, marginTop: 10, marginLeft: 30 }}>＊ 自身の勤怠登録・確認 / 手配現場の確認 / プロフィール編集</Text>
                            )}
                            {(prevRouteName === 'AddMyWorker' || prevRouteName === 'EditCompanyRole') && item === '管理者' && (
                                <Text style={{ ...GlobalStyles.smallGrayText, marginTop: 10, marginLeft: 30 }}>＊ 全ての権限</Text>
                            )}
                        </>
                    )
                }}
                keyExtractor={(item) => item}
            />
        </View>
    )
}
export default SelectMenu

const styles = StyleSheet.create({})
