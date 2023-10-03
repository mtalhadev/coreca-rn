import React, { useMemo } from 'react'
import { View, ViewStyle } from 'react-native'

import { ConstructionMeter } from './ConstructionMeter'
import { ConstructionHeaderCL } from './ConstructionHeaderCL'
import { ConstructionType } from '../../../models/construction/Construction'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { ConstructionHeader } from './ConstructionHeader'

export type ConstructionProps = {
    construction?: ConstructionType
    onPress?: () => void
    style?: ViewStyle
}

export const Construction = React.memo((props: Partial<ConstructionProps>) => {
    const { construction, onPress, style } = props

    /**
     * 工事のリストでのみ案件名は省略する。初期工事など案件名しかない場合は、案件名を表示する。
     */
    const displaySplit = useMemo(() => (construction?.displayName as string).split('/'), [construction?.displayName])
    const displayName = useMemo(() => displaySplit.length >= 2 ? displaySplit[1] : displaySplit[0], [displaySplit])

    return (
        <ShadowBox
            style={{
                padding: 10,
                paddingTop: 5,
                ...style,
            }}
            onPress={onPress}
            >
            <View>
                <ConstructionHeader
                    style={{
                        marginTop: 5,
                    }}
                    project={construction?.project}
                    displayName={displayName}
                    undisplayedSpan
                    constructionRelation={construction?.constructionRelation}
                />
                {(construction?.constructionRelation != undefined && construction?.constructionRelation != 'other-company') && (
                    <ConstructionMeter
                        style={{
                            marginTop: 5,
                        }}
                        requiredCount={construction?.constructionMeter?.requiredNum}
                        presentCount={construction?.constructionMeter?.presentNum}
                    />
                )}
            </View>
        </ShadowBox>
    )
})
