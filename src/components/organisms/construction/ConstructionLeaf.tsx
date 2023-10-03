import React, { useState, useRef, useEffect } from 'react'
import { Text, Pressable, View, Image, ViewStyle } from 'react-native'
import { BlueColor, GreenColor, ColorStyle, GlobalStyles, FontStyle } from '../../../utils/Styles'
import { THEME_COLORS, WINDOW_WIDTH } from '../../../utils/Constants'

import { ConstructionPrefix } from './ConstructionPrefix'
import { ConstructionRelationType } from '../../../models/construction/ConstructionRelationType'
import { newDate } from '../../../utils/ext/Date.extensions'
import { CustomDate, dayBaseText } from "../../../models/_others/CustomDate"
import { ConstructionHeaderCL } from './ConstructionHeaderCL'
import { ConstructionCLType } from '../../../models/construction/Construction'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { ProjectCLType } from '../../../models/project/Project'

export type ConstructionLeafProps = {
    construction?: ConstructionCLType
    project?: ProjectCLType
    style: ViewStyle
}

export const ConstructionLeaf = React.memo((props: Partial<ConstructionLeafProps>) => {
    const { construction, project, style } = props
    const { t } = useTextTranslation()

    return (
        <View
            style={[
                {
                    flexDirection: 'column',
                },
                style,
            ]}
        >
            <View
                style={{
                    justifyContent: 'center',
                }}
            >
                <Text
                    style={[
                        GlobalStyles.smallGrayText,
                        {
                            marginBottom: 5,
                        },
                    ]}
                >
                    {`${project?.startDate ? dayBaseText(project?.startDate) : t('common:Undecided')}〜${project?.endDate ? dayBaseText(project?.endDate) : t('common:Undecided')}`}
                </Text>
            </View>
            <ConstructionHeaderCL constructionRelation={construction?.constructionRelation} displayName={construction?.displayName} />
        </View>
    )
})
