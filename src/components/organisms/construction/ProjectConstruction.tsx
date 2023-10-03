import React from 'react'
import { Pressable, ViewStyle } from 'react-native'
import { THEME_COLORS } from '../../../utils/Constants'
import { ConstructionHeader } from './ConstructionHeader'
import { ConstructionType } from '../../../models/construction/Construction'
import { ConstructionMeter } from './ConstructionMeter'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { ProjectType } from '../../../models/project/Project'

export type ProjectConstructionProps = {
    project?: ProjectType
    construction?: ConstructionType
    onPress?: (id?: string) => void
    displayMeter?: boolean
    paramName?: string
    style?: ViewStyle
}

export const ProjectConstruction = React.memo((props: Partial<ProjectConstructionProps>) => {
    const { t } = useTextTranslation()
    let { project, construction, style, paramName, displayMeter, onPress } = props
    paramName = paramName ?? t('common:AllArrangements')

    displayMeter = displayMeter ?? true
    return (
        <Pressable
            style={[
                {
                    padding: 8,
                    borderWidth: 1,
                    borderColor: THEME_COLORS.OTHERS.LIGHT_GRAY,
                    borderRadius: 10,
                },
                style,
            ]}
            onPress={() => {
                if (onPress && construction?.constructionId) {
                    onPress(construction?.constructionId)
                }
            }}>
            <>
                <ConstructionHeader undisplayedSpan {...construction} project={project} />
                {(displayMeter == true && (construction?.constructionRelation == 'manager' || construction?.constructionRelation == 'fake-company-manager')) && (
                    <ConstructionMeter
                        style={{
                            marginTop: 3,
                        }}
                        presentCount={construction?.constructionMeter?.presentNum}
                        requiredCount={construction?.constructionMeter?.requiredNum}
                    />
                )}
            </>
        </Pressable>
    )
})
