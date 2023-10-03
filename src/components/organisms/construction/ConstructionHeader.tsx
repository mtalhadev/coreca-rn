import React, { useMemo } from 'react'
import { Text, View, ViewStyle } from 'react-native'

import { GlobalStyles } from '../../../utils/Styles'

import { WINDOW_WIDTH } from '../../../utils/Constants'
import { compareWithToday, dayBaseText, toCustomDateFromTotalSeconds } from "../../../models/_others/CustomDate"
import { ConstructionPrefix } from './ConstructionPrefix'
import { useComponentSize } from '../../../utils/Utils'
import { NewBadge } from '../../atoms/NewBadge'
import { ConstructionType } from '../../../models/construction/Construction'
import { ProjectType } from '../../../models/project/Project'

export type ConstructionHeaderProps = {
    style?: ViewStyle
    project?: ProjectType
    undisplayedSpan?: boolean
} & ConstructionType

/**
 * CLタイプを無くしたコンポーネントとして再定義
 */
export const ConstructionHeader = React.memo((props: Partial<ConstructionHeaderProps>) => {
    const { constructionRelation, undisplayedSpan, project, name, displayName, style } = props
    const [viewSize, onLayout] = useComponentSize()
    const [prefixSize, onPrefixLayout] = useComponentSize()

    const __startDate = useMemo(() => project?.startDate ? toCustomDateFromTotalSeconds(project.startDate) : undefined, [project?.startDate]) 
    const __endDate = useMemo(() => project?.endDate ? toCustomDateFromTotalSeconds(project.endDate) : undefined, [project?.endDate])

    return (
        <View style={[style]}>
            {((undisplayedSpan != true) && (project?.startDate != undefined && project?.endDate != undefined)) && (
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 5,
                    }}>
                    <Text style={[GlobalStyles.smallGrayText]}>
                        {__startDate ? dayBaseText(__startDate) : 'なし'}〜{__endDate ? dayBaseText(__endDate) : 'なし'}
                    </Text>
                    {__startDate && compareWithToday(__startDate).totalMilliseconds < 0 && <NewBadge />}
                </View>
            )}
            <View
                style={[
                    {
                        flexDirection: 'row',
                        alignItems: 'center',
                    },
                ]}
                onLayout={onLayout}>
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
                    ]}>
                    {displayName}
                </Text>
            </View>
        </View>
    )
})
