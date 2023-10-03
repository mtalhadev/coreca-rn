import React, { useEffect, useState } from 'react'
import { Text, Image, StyleSheet, Pressable, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
// import { Video, ResizeMode } from 'expo-av'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import { MinusButton } from '../atoms/MinusButton'

type LibraryThumbnailListType = {
    libraryDatas: ImageInfo[]
    libraryType: 'image' | 'video'
    horizontal?: boolean
    deleteAttachedData?: (x: number) => void
}
export const LibraryThumbnailList = (props: LibraryThumbnailListType) => {
    const { libraryDatas, horizontal, libraryType, deleteAttachedData } = props
    const imageSourcePrefix = 'data:image/png;base64,'
    return (
        <FlatList
            horizontal={horizontal}
            data={libraryDatas}
            renderItem={(item) => {
                return (
                    <View style={{ marginTop: 10 }}>
                        {libraryType === 'image' ? (
                            <View>
                                <Image style={{ width: 100, height: 100, marginRight: 5 }} source={{ uri: imageSourcePrefix + item.item.base64 }} />
                                <View
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                    }}
                                >
                                    <MinusButton
                                        onPress={() => {
                                            if (deleteAttachedData) {
                                                deleteAttachedData(item.index)
                                            }
                                        }}
                                        size={20}
                                    />
                                </View>
                            </View>
                        ) : undefined}
                        {/* 
                            androidのビルドが通らないため。
                            hiruma
                            2022.9.10
                        */}
                        {/* {libraryType === 'video' ? (
                            <View>
                                <Video style={{ width: 100, height: 100, marginRight: 5 }} source={{ uri: item.item.uri }} resizeMode={ResizeMode.CONTAIN} useNativeControls isLooping />
                                <View
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                    }}
                                >
                                    <MinusButton
                                        onPress={() => {
                                            if (deleteAttachedData) {
                                                deleteAttachedData(item.index)
                                            }
                                        }}
                                        size={20}
                                    />
                                </View>
                            </View>
                        ) : undefined} */}
                    </View>
                )
            }}
        />
    )
}
