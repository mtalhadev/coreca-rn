import React from 'react'
import { Text, View } from 'react-native'
import { BlueColor, FontStyle } from '../../utils/Styles'

type SectionTitleType = {
    title: string
}
export const SectionTitle = (props: SectionTitleType) => {
    const { title } = props
    return (
        <View
            style={{
                marginHorizontal: 20,
            }}
        >
            <Text
                style={{
                    fontFamily: FontStyle.regular,
                    color: BlueColor.deepTextColor,
                    fontSize: 12,
                    lineHeight: 15,
                }}
            >
                {title}
            </Text>
        </View>
    )
}
