import React from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { GlobalStyles } from '../../../utils/Styles'

import { WINDOW_WIDTH } from '../../../utils/Constants'
import { compareWithToday, CustomDate, dayBaseText } from "../../../models/_others/CustomDate"
import { ConstructionPrefix } from './ConstructionPrefix'
import { useComponentSize } from '../../../utils/Utils'
import { NewBadge } from '../../atoms/NewBadge'
import { ConstructionCLType } from '../../../models/construction/Construction'
import { ProjectCLType } from '../../../models/project/Project'

export type ConstructionHeaderProps = {
    project?: ProjectCLType
    undisplayedSpan?: boolean
    style?: ViewStyle
} & ConstructionCLType

export const ConstructionHeaderCL = React.memo((props: Partial<ConstructionHeaderProps>) => {
    const { constructionRelation, undisplayedSpan, project, name, displayName, style } = props
    const startDate = project?.startDate
    const endDate = project?.endDate
    const [viewSize, onLayout] = useComponentSize()
    const [prefixSize, onPrefixLayout] = useComponentSize()

    return (
        <View style={[style]}>
            {(undisplayedSpan != true && startDate != undefined && endDate != undefined) && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 5,
                    }}
                >
                    <Text style={[GlobalStyles.smallGrayText]}>
                        {dayBaseText(startDate)}〜{dayBaseText(endDate)}
                    </Text>
                    {compareWithToday(startDate).totalMilliseconds < 0 && <NewBadge />}
                </View>
            )}
            <View
                style={[
                    {
                        flexDirection: 'row',
                        alignItems: 'center',
                    },
                ]}
                onLayout={onLayout}
            >
                {constructionRelation != undefined && (
                    <View onLayout={onPrefixLayout}>
                        <ConstructionPrefix type={constructionRelation} />
                    </View>
                )}
                <Text
                    ellipsizeMode={'middle'}
                    numberOfLines={2}
                    style={[
                        GlobalStyles.mediumText,
                        {
                            marginLeft: 5,
                            maxWidth: (viewSize?.width ?? WINDOW_WIDTH) - (prefixSize?.width ?? 60),
                        },
                    ]}
                >
                    {displayName}
                </Text>
            </View>
        </View>
    )
})
