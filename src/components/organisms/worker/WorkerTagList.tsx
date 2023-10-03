import React, {  } from 'react'
import { View, ViewStyle } from 'react-native'

import { WorkerTag } from './WorkerTag'
import { WorkerTagType } from '../../../models/worker/WorkerTagType'

export type WorkerTagListProps = {
    types?: WorkerTagType[]
    fontSize?: number
    hasBorder?: boolean
    style?: ViewStyle
}

export const WorkerTagList = React.memo((props: Partial<WorkerTagListProps>) => {
    let { types, fontSize, hasBorder, style } = props
    fontSize = fontSize ?? 10
    return (
        <View
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                ...style,
            }}>
            {types?.map((type, index) => {
                return (
                    <WorkerTag
                        key={index}
                        type={type}
                        hasBorder={hasBorder}
                        fontSize={fontSize}
                        style={{
                            marginRight: index != 0 ? 0 : 5,
                        }}
                    />
                )
            })}
        </View>
    )
})
