import React, { useEffect, useState } from 'react'
import { Text, View, Image, Pressable, ScrollView } from 'react-native'
import { ImageInfo } from 'expo-image-picker/build/ImagePicker.types'
import { AppButton } from '../../atoms/AppButton'
import { LibraryThumbnailList } from '../../template/LibraryThumbnailList'

type ProblemsInquiryAttachmentType = {
    buttonTitle: string
    onPress: () => void
    attachData: ImageInfo[]
    thubnailType: 'image' | 'video'
    deleteAttachedData?: (x: number) => void
}
export const ProblemsInquiryAttachment = (props: ProblemsInquiryAttachmentType) => {
    const { buttonTitle, onPress, attachData, thubnailType, deleteAttachedData } = props

    return (
        <View>
            <AppButton style={{ flex: 1, marginTop: 10 }} title={buttonTitle} isGray onPress={onPress} />
            {attachData.length !== 0 ? (
                <View
                    style={{
                        width: '100%',
                        height: 100,
                    }}
                >
                    <LibraryThumbnailList libraryType={thubnailType} horizontal={true} libraryDatas={attachData} deleteAttachedData={deleteAttachedData} />
                </View>
            ) : undefined}
        </View>
    )
}
