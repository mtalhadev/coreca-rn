/* eslint-disable indent */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { Text, Pressable, View, Image, ViewStyle, Animated, Easing, TextInput, StyleSheet, FlatList, InteractionManager, ScrollView } from 'react-native'
import { useSelector, useDispatch } from 'react-redux'
import licensesJson from '../../../assets/licenses.json'
import { Line } from '../../components/atoms/Line'
import { GlobalStyles } from '../../utils/Styles'

export type License = {
    name?: string
    licenseText?: string
}
export const Licenses = () => {
    const [licenseTextList, setLicenseTextList] = useState<License[]>([])

    useMemo(() => {
        const licenseObj = licensesJson as any
        const _licenseTextList = Object.keys(licenseObj ?? {}).map((key, index) => ({ name: key, licenseText: licenseObj[key]['licenseText'] ?? '' })) as License[]
        setLicenseTextList(_licenseTextList)
    }, [])

    return (
        <FlatList
            data={licenseTextList}
            keyExtractor={(item, index) => String(index)}
            renderItem={({ item, index }) => {
                return (
                    <View
                        style={{
                            flexDirection: 'column',
                            marginHorizontal: 15,
                            marginTop: 20,
                        }}
                        key={index}
                    >
                        <Text style={{ ...GlobalStyles.smallText, marginBottom: 5 }}>{item?.name}</Text>
                        <Text style={{ ...GlobalStyles.smallGrayText, fontSize: 10 }}>{item?.licenseText}</Text>
                        <Line
                            style={{
                                marginTop: 15,
                            }}
                        />
                    </View>
                )
            }}
        />
    )
}
