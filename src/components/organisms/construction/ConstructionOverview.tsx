import React, {  } from 'react'
import { View, ViewStyle } from 'react-native'

import { CustomDate, dayBaseText } from "../../../models/_others/CustomDate"
import { TableArea } from '../../atoms/TableArea'
import { ConstructionHeaderCL } from './ConstructionHeaderCL'
import { ConstructionCLType } from '../../../models/construction/Construction'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { ProjectCLType } from '../../../models/project/Project'

export type ConstructionOverviewProps = {
    construction?: ConstructionCLType
    project?: ProjectCLType
    style?: ViewStyle
}

export const ConstructionOverview = React.memo((props: Partial<ConstructionOverviewProps>) => {
    const { construction, project, style } = props
    const { t } = useTextTranslation()

    return (
        <>
            {construction != undefined && (
                <View
                    style={[
                        {
                            flexDirection: 'column',
                        },
                        style,
                    ]}
                >
                    <ConstructionHeaderCL style={{ marginBottom: 10 }} constructionRelation={construction.constructionRelation} displayName={construction?.displayName} />
                    <TableArea
                        columns={[
                            {
                                key: '工期',
                                content: (project?.startDate ? dayBaseText(project?.startDate) : t('common:Undecided')) + '〜' + (project?.endDate ? dayBaseText(project?.endDate) : t('common:Undecided')),
                            },
                            {
                                key: '定休日',
                                content: (construction?.offDaysOfWeek ?? []).join(', '),
                            },
                            {
                                key: 'その他の休日',
                                content: (construction?.otherOffDays?.map((day: CustomDate) => dayBaseText(day)) ?? []).join(', '),
                            },
                        ]}
                    />
                </View>
            )}
        </>
    )
})
