import React from 'react'
import { Text, ViewStyle, Pressable } from 'react-native'

import { GlobalStyles } from '../../../utils/Styles'
import { ConstructionHeaderCL } from './ConstructionHeaderCL'
import { useNavigation } from '@react-navigation/native'
import { ConstructionCLType } from '../../../models/construction/Construction'
import { ShadowBox } from '../shadowBox/ShadowBox'
import { Icon } from '../../atoms/Icon'
import { THEME_COLORS } from '../../../utils/Constants'
import { Line } from '../../atoms/Line'
import { useTextTranslation } from '../../../fooks/useTextTranslation'
import { ProjectCLType } from '../../../models/project/Project'
/**
 * project - 工期表示のため
 */
export type ConstructionItemProps = {
    project?: ProjectCLType
    construction?: ConstructionCLType
    onPress?: () => void
    onPressDetail?: () => void
    style?: ViewStyle
}

/**
 * @remarks 選択画面用
 * @param props -
 * @returns
 */
export const ConstructionItem = React.memo((props: Partial<ConstructionItemProps>) => {
    const { construction, project, onPress, style } = props
    const navigation = useNavigation<any>()
    const siteIds: string[] = []
    const { t } = useTextTranslation()

    return (
        <ShadowBox
            hasShadow
            style={{
                paddingHorizontal: 10,
                paddingTop: 10,
            }}
        >
            <ConstructionHeaderCL
                style={{
                    marginTop: 0,
                }}
                project={project}
                displayName={construction?.displayName}
                constructionRelation={construction?.constructionRelation}
            />
            <Line
                style={{
                    marginTop: 8,
                }}
            />
            <Pressable
                style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    padding: 5,
                }}
                onPress={() => {
                    navigation.push('ConstructionDetailRouter', {
                        constructionId: construction?.constructionId,
                        projectId: construction?.projectId,
                        title: construction?.displayName,
                        target: 'ConstructionDetail',
                    })
                }}
            >
                <Icon name={'search'} width={16} height={16} fill={THEME_COLORS.OTHERS.LIGHT_GRAY} />
                <Text style={{ ...GlobalStyles.smallGrayText, marginLeft: 5 }}>{t('common:CheckConstructionDetails')}</Text>
            </Pressable>
        </ShadowBox>
    )
})
